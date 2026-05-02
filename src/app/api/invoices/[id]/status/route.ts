import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

const STORE_ID = 'store-1'

const VALID_STATUSES = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const storeId = session.storeId ?? STORE_ID
    const body = await request.json()
    const { status } = body

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const existing = await prisma.invoice.findFirst({ where: { id, storeId } })
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        statusHistory: {
          create: { status },
        },
      },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        store: {
          select: { name: true, address: true, phone: true, logo: true, currency: true },
        },
      },
    })

    return NextResponse.json({ invoice })
  } catch (err) {
    console.error('PATCH /api/invoices/[id]/status error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
