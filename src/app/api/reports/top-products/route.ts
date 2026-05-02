import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

const STORE_ID = 'store-1'

function getDateRange(from?: string, to?: string): { start: Date; end: Date } {
  const end = to ? new Date(to) : new Date()
  end.setHours(23, 59, 59, 999)
  const start = from ? new Date(from) : new Date()
  start.setHours(0, 0, 0, 0)
  if (!from) {
    start.setDate(start.getDate() - 29)
  }
  return { start, end }
}

export async function GET(req: NextRequest) {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50)
  const storeId = session.storeId ?? STORE_ID

  const { start, end } = getDateRange(from, to)

  const grouped = await prisma.saleItem.groupBy({
    by: ['productId'],
    where: {
      sale: {
        storeId,
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
    },
    _sum: { quantity: true, totalPrice: true },
    orderBy: { _sum: { totalPrice: 'desc' } },
    take: limit,
  })

  const productIds = grouped.map((g) => g.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name_ar: true,
      name_fr: true,
      salePrice: true,
      purchasePrice: true,
    },
  })

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]))

  const result = grouped
    .map((g) => {
      const product = productMap[g.productId]
      if (!product) return null
      return {
        productId: g.productId,
        name_ar: product.name_ar,
        name_fr: product.name_fr,
        salePrice: product.salePrice,
        quantitySold: g._sum.quantity ?? 0,
        revenue: Math.round((g._sum.totalPrice ?? 0) * 100) / 100,
      }
    })
    .filter(Boolean)

  return NextResponse.json({
    products: result,
    from: start.toISOString(),
    to: end.toISOString(),
  })
}
