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

  const sales = await prisma.sale.findMany({
    where: {
      storeId,
      status: 'COMPLETED',
      createdAt: { gte: start, lte: end },
    },
    select: {
      id: true,
      totalAmount: true,
      paymentMethod: true,
      createdAt: true,
    },
  })

  // Aggregate by period
  const periodMap: Record<string, { amount: number; count: number }> = {}
  let cashTotal = 0
  let mobileTotal = 0
  let totalAmount = 0
  let totalCount = 0

  for (const sale of sales) {
    const key = getGroupKey(sale.createdAt, groupBy)
    if (!periodMap[key]) periodMap[key] = { amount: 0, count: 0 }
    periodMap[key].amount += sale.totalAmount
    periodMap[key].count += 1
    totalAmount += sale.totalAmount
    totalCount += 1
    if (sale.paymentMethod === 'CASH') {
      cashTotal += sale.totalAmount
    } else {
      mobileTotal += sale.totalAmount
    }
  }

  const chartData = Object.entries(periodMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, { amount, count }]) => ({
      period,
      amount: Math.round(amount * 100) / 100,
      count,
    }))

  return NextResponse.json({
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalTransactions: totalCount,
    avgTransaction: totalCount > 0 ? Math.round((totalAmount / totalCount) * 100) / 100 : 0,
    chartData,
    paymentBreakdown: [
      { name: 'CASH', value: Math.round(cashTotal * 100) / 100 },
      { name: 'MOBILE', value: Math.round(mobileTotal * 100) / 100 },
    ],
    from: start.toISOString(),
    to: end.toISOString(),
  })
}
