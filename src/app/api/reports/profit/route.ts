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

function getGroupKey(date: Date, groupBy: string): string {
  if (groupBy === 'week') {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().slice(0, 10)
  }
  if (groupBy === 'month') {
    return date.toISOString().slice(0, 7)
  }
  return date.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined
  const groupBy = searchParams.get('groupBy') ?? 'day'
  const storeId = session.storeId ?? STORE_ID

  const { start, end } = getDateRange(from, to)

  // Fetch sale items with purchase prices to compute cost
  const saleItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        storeId,
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
    },
    select: {
      quantity: true,
      unitPrice: true,
      totalPrice: true,
      product: { select: { purchasePrice: true } },
      sale: { select: { createdAt: true } },
    },
  })

  const periodMap: Record<string, { revenue: number; cost: number }> = {}
  let totalRevenue = 0
  let totalCost = 0

  for (const item of saleItems) {
    const key = getGroupKey(item.sale.createdAt, groupBy)
    if (!periodMap[key]) periodMap[key] = { revenue: 0, cost: 0 }
    const itemRevenue = item.totalPrice
    const itemCost = item.product.purchasePrice * item.quantity
    periodMap[key].revenue += itemRevenue
    periodMap[key].cost += itemCost
    totalRevenue += itemRevenue
    totalCost += itemCost
  }

  const chartData = Object.entries(periodMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, { revenue, cost }]) => ({
      period,
      revenue: Math.round(revenue * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      profit: Math.round((revenue - cost) * 100) / 100,
    }))

  const grossProfit = totalRevenue - totalCost
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

  return NextResponse.json({
    revenue: Math.round(totalRevenue * 100) / 100,
    cost: Math.round(totalCost * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    profitMargin: Math.round(profitMargin * 100) / 100,
    chartData,
    from: start.toISOString(),
    to: end.toISOString(),
  })
}
