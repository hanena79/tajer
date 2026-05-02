import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const storeId = session.storeId ?? 'store-1'
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') ?? 'all'

    const products = await prisma.product.findMany({
      where: { storeId },
      select: {
        id: true,
        name_ar: true,
        name_fr: true,
        quantity: true,
        minQuantity: true,
        category: { select: { id: true, name_ar: true, name_fr: true } },
      },
      orderBy: { name_ar: 'asc' },
    })

    const enriched = products.map((p) => {
      let status: 'normal' | 'low' | 'out'
      if (p.quantity <= 0) status = 'out'
      else if (p.quantity <= p.minQuantity) status = 'low'
      else status = 'normal'
      return { ...p, status }
    })

    const filtered =
      statusFilter === 'all'
        ? enriched
        : enriched.filter((p) => p.status === statusFilter)

    const total = enriched.length
    const lowCount = enriched.filter((p) => p.status === 'low').length
    const outCount = enriched.filter((p) => p.status === 'out').length
    const alertCount = lowCount + outCount

    return NextResponse.json({ products: filtered, total, lowCount, outCount, alertCount })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
