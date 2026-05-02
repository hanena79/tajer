import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

const STORE_ID = 'store-1'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const storeId = session.storeId ?? STORE_ID

    const invoice = await prisma.invoice.findFirst({
      where: { id, storeId },
      include: {
        items: true,
        sale: {
          include: {
            items: {
              include: {
                product: { select: { name_ar: true, name_fr: true } },
              },
            },
          },
        },
        store: {
          select: { name: true, address: true, phone: true, logo: true, currency: true },
        },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json({ invoice })
  } catch (err) {
    console.error('GET /api/invoices/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const storeId = session.storeId ?? STORE_ID
    const body = await request.json()
    const { customerName, customerPhone, items, discount = 0, taxRate = 0, notes, status } = body

    const existing = await prisma.invoice.findFirst({ where: { id, storeId } })
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }

    const subtotal = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    )
    const discountAmount = Math.min(parseFloat(String(discount)) || 0, subtotal)
    const afterDiscount = subtotal - discountAmount
    const taxAmount = afterDiscount * ((parseFloat(String(taxRate)) || 0) / 100)
    const totalAmount = afterDiscount + taxAmount

    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } })

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        totalAmount,
        notes: notes || null,
        ...(status ? { status } : {}),
        items: {
          create: items.map((item: {
            description: string
            quantity: number
            unitPrice: number
            productId?: string
          }) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            productId: item.productId || null,
          })),
        },
      },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    })

    return NextResponse.json({ invoice: updatedInvoice })
  } catch (err) {
    console.error('PUT /api/invoices/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const storeId = session.storeId ?? STORE_ID

    const existing = await prisma.invoice.findFirst({ where: { id, storeId } })
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    await prisma.invoice.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/invoices/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
