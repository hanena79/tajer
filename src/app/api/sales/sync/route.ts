import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

const STORE_ID = 'store-1'

type OfflineSale = {
  offlineId: string
  items: { productId: string; name_ar: string; name_fr: string; quantity: number; unitPrice: number }[]
  discount: number
  discountType: 'percentage' | 'fixed'
  paymentMethod: 'CASH' | 'MOBILE'
  taxRate: number
  createdAt: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sales }: { sales: OfflineSale[] } = await request.json()

    if (!Array.isArray(sales) || sales.length === 0) {
      return NextResponse.json({ synced: 0, errors: [] })
    }

    const storeId = session.storeId ?? STORE_ID
    const userId = session.userId
    const results: { offlineId: string; success: boolean; error?: string }[] = []

    for (const offlineSale of sales) {
      try {
        const { items, discount, discountType, paymentMethod, taxRate, offlineId } = offlineSale

        const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
        const discountAmount = discountType === 'percentage'
          ? subtotal * (discount / 100)
          : Math.min(discount, subtotal)
        const afterDiscount = subtotal - discountAmount
        const taxAmount = afterDiscount * (taxRate / 100)
        const totalAmount = afterDiscount + taxAmount

        const invoiceCount = await prisma.invoice.count()
        const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`

        await prisma.$transaction(async (tx) => {
          const sale = await tx.sale.create({
            data: {
              totalAmount,
              discount: discountAmount,
              tax: taxAmount,
              paymentMethod,
              status: 'COMPLETED',
              userId,
              storeId,
              createdAt: new Date(offlineSale.createdAt),
            },
          })

          await tx.saleItem.createMany({
            data: items.map((item) => ({
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
              productId: item.productId,
              saleId: sale.id,
            })),
          })

          for (const item of items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { decrement: item.quantity } },
            })

            await tx.stockMovement.create({
              data: {
                type: 'OUT',
                quantity: item.quantity,
                reason: `Offline Sale ${offlineId}`,
                productId: item.productId,
                userId,
              },
            })
          }

          await tx.invoice.create({
            data: {
              invoiceNumber,
              status: 'PAID',
              totalAmount,
              tax: taxAmount,
              saleId: sale.id,
              storeId,
            },
          })
        })

        results.push({ offlineId, success: true })
      } catch (err) {
        results.push({
          offlineId: offlineSale.offlineId,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    const synced = results.filter((r) => r.success).length
    const errors = results.filter((r) => !r.success)

    return NextResponse.json({ synced, errors, results })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
