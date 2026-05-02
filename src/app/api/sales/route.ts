import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

const STORE_ID = 'store-1'

export type CartItem = {
  productId: string
  name_ar: string
  name_fr: string
  quantity: number
  unitPrice: number
}

export type CreateSalePayload = {
  items: CartItem[]
  discount: number
  discountType: 'percentage' | 'fixed'
  paymentMethod: 'CASH' | 'MOBILE'
  taxRate: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateSalePayload = await request.json()
    const { items, discount, discountType, paymentMethod, taxRate } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in sale' }, { status: 400 })
    }

    const storeId = session.storeId ?? STORE_ID
    const userId = session.userId

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const discountAmount = discountType === 'percentage'
      ? subtotal * (discount / 100)
      : Math.min(discount, subtotal)
    const afterDiscount = subtotal - discountAmount
    const taxAmount = afterDiscount * (taxRate / 100)
    const totalAmount = afterDiscount + taxAmount

    // Verify stock availability and get current prices
    const productIds = items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, storeId },
      select: { id: true, quantity: true, salePrice: true, name_ar: true },
    })

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
      }
      if (product.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name_ar}` },
          { status: 400 }
        )
      }
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count()
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`

    // Create sale, items, invoice, and stock movements in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create sale
      const sale = await tx.sale.create({
        data: {
          totalAmount,
          discount: discountAmount,
          tax: taxAmount,
          paymentMethod,
          status: 'COMPLETED',
          userId,
          storeId,
        },
      })

      // Create sale items
      await tx.saleItem.createMany({
        data: items.map((item) => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          productId: item.productId,
          saleId: sale.id,
        })),
      })

      // Update stock and create stock movements
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        })

        await tx.stockMovement.create({
          data: {
            type: 'OUT',
            quantity: item.quantity,
            reason: `Sale ${sale.id}`,
            productId: item.productId,
            userId,
          },
        })
      }

      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          status: 'PAID',
          totalAmount,
          tax: taxAmount,
          saleId: sale.id,
          storeId,
        },
      })

      return { sale, invoice }
    })

    // Fetch store info for receipt
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { name: true, address: true, phone: true, currency: true },
    })

    return NextResponse.json({
      success: true,
      saleId: result.sale.id,
      invoiceNumber: result.invoice.invoiceNumber,
      totalAmount,
      paymentMethod,
      store,
    })
  } catch (err) {
    console.error('Sale error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
