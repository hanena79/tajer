import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

const STORE_ID = 'store-1'

// Generate next invoice number: INV-YYYY-XXXXX
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.invoice.count({
    where: { invoiceNumber: { startsWith: `INV-${year}-` } },
  })
  return `INV-${year}-${String(count + 1).padStart(5, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const storeId = session.storeId ?? STORE_ID
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? ''
    const search = searchParams.get('search') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'))
    const skip = (page - 1) * limit

    const where = {
      storeId,
      ...(status && status !== 'ALL' ? { status } : {}),
      ...(search
        ? {
            OR: [
              { invoiceNumber: { contains: search } },
              { customerName: { contains: search } },
            ],
          }
        : {}),
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({ invoices, total, page, limit })
  } catch (err) {
    console.error('GET /api/invoices error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const storeId = session.storeId ?? STORE_ID
    const body = await request.json()
    const {
      customerName,
      customerPhone,
      items,
      discount = 0,
      taxRate = 0,
      notes,
      status = 'DRAFT',
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }

    const invoiceNumber = await generateInvoiceNumber()

    const subtotal = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    )
    const discountAmount = Math.min(parseFloat(discount) || 0, subtotal)
    const afterDiscount = subtotal - discountAmount
    const taxAmount = afterDiscount * ((parseFloat(taxRate) || 0) / 100)
    const totalAmount = afterDiscount + taxAmount

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        status,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        totalAmount,
        notes: notes || null,
        storeId,
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
        statusHistory: {
          create: { status },
        },
      },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (err) {
    console.error('POST /api/invoices error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
