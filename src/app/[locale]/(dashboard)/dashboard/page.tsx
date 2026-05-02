import { getTranslations, getLocale } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { TrendingUp, ShoppingCart, Package, AlertTriangle } from 'lucide-react'
import { SalesChart } from '@/components/dashboard/SalesChart'
import { formatCurrency, formatDate } from '@/lib/utils'

const STORE_ID = 'store-1'

async function getDashboardData() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(todayStart)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const [todaySales, todayCount, totalProducts, recentSales, salesLast7Days] = await Promise.all([
    prisma.sale.aggregate({ where: { storeId: STORE_ID, createdAt: { gte: todayStart } }, _sum: { totalAmount: true } }),
    prisma.sale.count({ where: { storeId: STORE_ID, createdAt: { gte: todayStart } } }),
    prisma.product.count({ where: { storeId: STORE_ID } }),
    prisma.sale.findMany({
      where: { storeId: STORE_ID },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { invoice: { select: { invoiceNumber: true } } },
    }),
    prisma.sale.findMany({
      where: { storeId: STORE_ID, createdAt: { gte: sevenDaysAgo } },
      select: { totalAmount: true, createdAt: true },
    }),
  ])

  const lowStockProducts = await prisma.$queryRaw<
    { id: string; name_ar: string; name_fr: string; quantity: number; minQuantity: number }[]
  >`SELECT id, name_ar, name_fr, quantity, "minQuantity" FROM "Product" WHERE "storeId" = ${STORE_ID} AND quantity <= "minQuantity" LIMIT 5`

  const chartMap: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setDate(d.getDate() + i)
    chartMap[d.toISOString().slice(0, 10)] = 0
  }
  for (const sale of salesLast7Days) {
    const key = sale.createdAt.toISOString().slice(0, 10)
    if (key in chartMap) chartMap[key] += sale.totalAmount
  }

  const topProductsRaw = await prisma.saleItem.groupBy({
    by: ['productId'],
    where: { sale: { storeId: STORE_ID } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5,
  })
  const topProductDetails = await prisma.product.findMany({
    where: { id: { in: topProductsRaw.map((p) => p.productId) } },
    select: { id: true, name_ar: true, name_fr: true, salePrice: true },
  })
  const topProducts = topProductsRaw.map((p) => ({
    ...topProductDetails.find((d) => d.id === p.productId)!,
    soldQty: p._sum.quantity ?? 0,
  }))

  return {
    todaySalesAmount: todaySales._sum.totalAmount ?? 0,
    todayCount,
    totalProducts,
    lowStockProducts,
    recentSales,
    chartData: Object.entries(chartMap).map(([date, amount]) => ({
      day: new Date(date).toLocaleDateString('ar-SA', { weekday: 'short' }),
      amount: Math.round(amount),
    })),
    topProducts,
  }
}

export default async function DashboardPage() {
  const locale = await getLocale()
  const t = await getTranslations('dashboard')
  await requireAuth(locale)

  const {
    todaySalesAmount,
    todayCount,
    totalProducts,
    lowStockProducts,
    recentSales,
    chartData,
    topProducts,
  } = await getDashboardData()

  const stats = [
    {
      label: t('todaySales'),
      value: formatCurrency(todaySalesAmount),
      icon: TrendingUp,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: t('todayTransactions'),
      value: String(todayCount),
      icon: ShoppingCart,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: t('totalProducts'),
      value: String(totalProducts),
      icon: Package,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      label: t('lowStock'),
      value: String(lowStockProducts.length),
      icon: AlertTriangle,
      iconBg: lowStockProducts.length > 0 ? 'bg-amber-50' : 'bg-gray-50',
      iconColor: lowStockProducts.length > 0 ? 'text-amber-500' : 'text-gray-400',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString(locale === 'ar' ? 'ar-MR' : 'fr-MR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`p-3 ${card.iconBg} rounded-xl flex-shrink-0`}>
              <card.icon className={`w-6 h-6 ${card.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{card.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart data={chartData} title={t('salesChart')} locale={locale} />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            {t('lowStockAlert')}
          </h2>
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              <Package className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              {t('noLowStock')}
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between py-2.5 px-3 bg-amber-50 rounded-lg border border-amber-100"
                >
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {locale === 'ar' ? product.name_ar : product.name_fr}
                  </p>
                  <span className="ms-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex-shrink-0">
                    {product.quantity} {t('units')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-700">{t('recentSales')}</h2>
          </div>
          {recentSales.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">{t('noSales')}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between px-6 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('invoice')} {sale.invoice?.invoiceNumber ?? '#-'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(sale.createdAt, locale)}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    {formatCurrency(sale.totalAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-700">{t('topProducts')}</h2>
          </div>
          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">{t('noSales')}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topProducts.map((product, idx) => (
                <div key={product.id} className="flex items-center gap-4 px-6 py-3.5">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {locale === 'ar' ? product.name_ar : product.name_fr}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {product.soldQty} {t('soldUnits')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 flex-shrink-0">
                    {formatCurrency(product.salePrice)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
