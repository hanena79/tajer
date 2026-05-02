import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

const STORE_ID = 'store-1'

export async function GET(req: NextRequest) {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const storeId = session.storeId ?? STORE_ID

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // All products with their total sales in last 30 days
  const products = await prisma.product.findMany({
    where: { storeId },
    select: {
      id: true,
      name_ar: true,
      name_fr: true,
      quantity: true,
      minQuantity: true,
      purchasePrice: true,
      salePrice: true,
      saleItems: {
        where: {
          sale: {
            storeId,
            status: 'COMPLETED',
            createdAt: { gte: thirtyDaysAgo },
          },
        },
        select: { quantity: true, sale: { select: { createdAt: true } } },
      },
    },
  })

  let totalStockValue = 0
  const atRiskProducts: typeof products = []
  const deadStockProducts: typeof products = []

  const enriched = products.map((p) => {
    const soldLast30 = p.saleItems.reduce((sum, si) => sum + si.quantity, 0)
    const stockValue = p.quantity * p.purchasePrice
    totalStockValue += stockValue

    const salesVelocityPerDay = soldLast30 / 30
    const lastSaleDate = p.saleItems.length > 0
      ? p.saleItems.reduce((latest, si) => {
          const d = si.sale.createdAt
          return d > latest ? d : latest
        }, new Date(0))
      : null

    const daysOfStock = salesVelocityPerDay > 0 ? p.quantity / salesVelocityPerDay : Infinity
    const isAtRisk = p.quantity <= p.minQuantity && salesVelocityPerDay > 0
    const isDeadStock = soldLast30 === 0

    return {
      id: p.id,
      name_ar: p.name_ar,
      name_fr: p.name_fr,
      quantity: p.quantity,
      minQuantity: p.minQuantity,
      purchasePrice: p.purchasePrice,
      salePrice: p.salePrice,
      stockValue: Math.round(stockValue * 100) / 100,
      soldLast30,
      salesVelocityPerDay: Math.round(salesVelocityPerDay * 100) / 100,
      daysOfStock: isFinite(daysOfStock) ? Math.round(daysOfStock) : null,
      lastSaleDate: lastSaleDate instanceof Date && lastSaleDate.getTime() > 0 ? lastSaleDate.toISOString() : null,
      isAtRisk,
      isDeadStock,
      status: p.quantity === 0 ? 'out' : p.quantity <= p.minQuantity ? 'low' : 'normal',
    }
  })

  // Turnover: total sold qty in 30 days / avg stock (approx = current stock)
  const totalCurrentStock = products.reduce((sum, p) => sum + p.quantity, 0)
  const totalSoldLast30 = enriched.reduce((sum, p) => sum + p.soldLast30, 0)
  const turnoverRate = totalCurrentStock > 0 ? Math.round((totalSoldLast30 / totalCurrentStock) * 100) / 100 : 0

  return NextResponse.json({
    totalStockValue: Math.round(totalStockValue * 100) / 100,
    turnoverRate,
    totalProducts: products.length,
    atRiskCount: enriched.filter((p) => p.isAtRisk).length,
    deadStockCount: enriched.filter((p) => p.isDeadStock).length,
    products: enriched,
    atRiskProducts: enriched.filter((p) => p.isAtRisk),
    deadStockProducts: enriched.filter((p) => p.isDeadStock),
  })
}
