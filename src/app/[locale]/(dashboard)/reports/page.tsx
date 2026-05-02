'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Package, AlertTriangle, BarChart2, Download, Printer,
  FileText, RefreshCw, Calendar,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import * as XLSX from 'xlsx'

// ─── Types ─────────────────────────────────────────────────────────────────────

type GroupBy = 'day' | 'week' | 'month'
type TabId = 'sales' | 'profit' | 'top-products' | 'inventory'
type DatePreset = 'today' | 'thisWeek' | 'thisMonth' | 'custom'
interface DateRange { from: string; to: string }

interface SalesData {
  totalAmount: number; totalTransactions: number; avgTransaction: number
  chartData: { period: string; amount: number; count: number }[]
  paymentBreakdown: { name: string; value: number }[]
  from: string; to: string
}
interface ProfitData {
  revenue: number; cost: number; grossProfit: number; profitMargin: number
  chartData: { period: string; revenue: number; cost: number; profit: number }[]
  from: string; to: string
}
interface TopProduct {
  productId: string; name_ar: string; name_fr: string
  salePrice: number; quantitySold: number; revenue: number
}
interface TopProductsData { products: TopProduct[]; from: string; to: string }

interface InventoryProduct {
  id: string; name_ar: string; name_fr: string
  quantity: number; minQuantity: number
  purchasePrice: number; salePrice: number
  stockValue: number; soldLast30: number
  salesVelocityPerDay: number; daysOfStock: number | null
  lastSaleDate: string | null; isAtRisk: boolean; isDeadStock: boolean
  status: 'normal' | 'low' | 'out'
}
interface InventoryData {
  totalStockValue: number; turnoverRate: number
  totalProducts: number; atRiskCount: number; deadStockCount: number
  products: InventoryProduct[]
  atRiskProducts: InventoryProduct[]
  deadStockProducts: InventoryProduct[]
}

// ─── Date Helpers ──────────────────────────────────────────────────────────────

const PIE_COLORS = ['#059669', '#3b82f6']
const CHART_COLORS = { revenue: '#059669', cost: '#f87171', profit: '#3b82f6', amount: '#059669' }

function todayRange(): DateRange { const d = new Date().toISOString().slice(0, 10); return { from: d, to: d } }
function weekRange(): DateRange {
  const now = new Date(); const day = now.getDay(); const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(now); start.setDate(diff)
  return { from: start.toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) }
}
function monthRange(): DateRange {
  const now = new Date()
  return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to: now.toISOString().slice(0, 10) }
}
function fmtPeriod(period: string, groupBy: GroupBy, locale: string): string {
  const loc = locale === 'ar' ? 'ar-MR' : 'fr-FR'
  if (groupBy === 'month') {
    const [y, m] = period.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleDateString(loc, { month: 'short', year: '2-digit' })
  }
  return new Date(period).toLocaleDateString(loc, { day: 'numeric', month: 'short' })
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ label, value, icon: Icon, iconBg, iconColor, trend }: {
  label: string; value: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string; iconColor: string; trend?: 'up' | 'down' | null
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 ${iconBg} rounded-xl flex-shrink-0`}><Icon className={`w-6 h-6 ${iconColor}`} /></div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
      </div>
      {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
      {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />}
    </div>
  )
}

function LoadingSpinner() {
  return <div className="text-center py-12"><RefreshCw className="w-7 h-7 animate-spin mx-auto text-emerald-600" /></div>
}

function ExportBar({ onPdf, onExcel, onPrint, t }: { onPdf: () => void; onExcel: () => void; onPrint: () => void; t: (k: string) => string }) {
  return (
    <div className="flex flex-wrap gap-3 justify-end pt-2">
      <button onClick={onPdf} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors">
        <FileText className="w-4 h-4" />{t('exportPdf')}
      </button>
      <button onClick={onExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-sm font-medium transition-colors">
        <Download className="w-4 h-4" />{t('exportExcel')}
      </button>
      <button onClick={onPrint} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors">
        <Printer className="w-4 h-4" />{t('print')}
      </button>
    </div>
  )
}

// ─── Export Utilities ──────────────────────────────────────────────────────────

function doExportExcel(rows: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Report')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

function doPrint(elId: string) {
  const el = document.getElementById(elId)
  if (!el) return
  const dir = document.documentElement.dir || 'ltr'
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return
  win.document.write(`<html><head><title>Report</title><style>
    body{font-family:Arial,sans-serif;padding:24px;direction:${dir}}
    table{border-collapse:collapse;width:100%;margin-top:12px}
    th,td{border:1px solid #e5e7eb;padding:8px 12px;text-align:start;font-size:13px}
    th{background:#f9fafb;font-weight:600;color:#374151}
    h3{color:#059669;margin:16px 0 8px}
  </style></head><body>${el.innerHTML}</body></html>`)
  win.document.close(); win.focus()
  setTimeout(() => { win.print(); win.close() }, 600)
}

async function doPDF(elId: string, title: string, locale: string) {
  const { jsPDF } = await import('jspdf')
  const el = document.getElementById(elId)
  if (!el) return
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth(); const margin = 15; const isRTL = locale === 'ar'
  doc.setFillColor(5, 150, 105); doc.rect(0, 0, pageW, 30, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(255, 255, 255)
  doc.text(title, isRTL ? pageW - margin : margin, 18, { align: isRTL ? 'right' : 'left' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text(new Date().toLocaleDateString(isRTL ? 'ar-MR' : 'fr-FR'), isRTL ? margin : pageW - margin, 18, { align: isRTL ? 'left' : 'right' })
  let y = 40
  el.querySelectorAll('table').forEach((table) => {
    table.querySelectorAll('tr').forEach((row) => {
      const cells = Array.from(row.querySelectorAll('th,td'))
      const texts = cells.map((c) => (c as HTMLElement).innerText.trim().slice(0, 28))
      if (texts.every((t) => !t)) return
      const colW = (pageW - margin * 2) / Math.max(texts.length, 1)
      const isHeader = row.querySelector('th') !== null
      if (isHeader) { doc.setFillColor(249, 250, 251); doc.rect(margin, y - 4, pageW - margin * 2, 7, 'F') }
      doc.setFontSize(8); doc.setTextColor(isHeader ? 75 : 30, isHeader ? 85 : 40, isHeader ? 99 : 60)
      texts.forEach((text, i) => {
        const x = isRTL ? pageW - margin - i * colW : margin + i * colW
        doc.text(text, x, y, { align: isRTL ? 'right' : 'left', maxWidth: colW - 2 })
      })
      y += 7; if (y > 270) { doc.addPage(); y = 20 }
    }); y += 3
  })
  doc.save(`${title}.pdf`)
}

// ─── Date Range Bar ────────────────────────────────────────────────────────────

function DateRangeBar({ range, preset, groupBy, onPreset, onRange, onGroupBy, onApply, isRTL, t }: {
  range: DateRange; preset: DatePreset; groupBy: GroupBy
  onPreset: (p: DatePreset) => void; onRange: (r: DateRange) => void
  onGroupBy: (g: GroupBy) => void; onApply: () => void
  isRTL: boolean; t: (k: string) => string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
      <div className="flex gap-1.5 flex-wrap">
        {(['today', 'thisWeek', 'thisMonth', 'custom'] as DatePreset[]).map((p) => (
          <button key={p} onClick={() => onPreset(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${preset === p ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t(p)}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={range.from} onChange={e => onRange({ ...range, from: e.target.value })}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <span className="text-gray-400 text-sm">{isRTL ? '—' : '→'}</span>
          <input type="date" value={range.to} onChange={e => onRange({ ...range, to: e.target.value })}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <button onClick={onApply} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
            {t('apply')}
          </button>
        </div>
      )}
      <div className="flex items-center gap-1.5 ms-auto">
        <span className="text-xs text-gray-500">{t('groupBy')}:</span>
        {(['day', 'week', 'month'] as GroupBy[]).map((g) => (
          <button key={g} onClick={() => onGroupBy(g)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${groupBy === g ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-100'}`}>
            {t(g)}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Sales Tab ─────────────────────────────────────────────────────────────────

function SalesTab({ range, groupBy, locale, t }: { range: DateRange; groupBy: GroupBy; locale: string; t: (k: string) => string }) {
  const [data, setData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/reports/sales?from=${range.from}&to=${range.to}&groupBy=${groupBy}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch { setError(t('loadError')) } finally { setLoading(false) }
  }, [range.from, range.to, groupBy, t])

  useEffect(() => { load() }, [load])

  const chartData = data?.chartData.map((d) => ({ ...d, period: fmtPeriod(d.period, groupBy, locale) })) ?? []
  const title = t('salesReport')

  if (loading) return <LoadingSpinner />
  if (error) return <p className="text-red-500 text-center py-8">{error}</p>
  if (!data) return null

  return (
    <div id="sales-section" className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label={t('totalSales')} value={formatCurrency(data.totalAmount)} icon={DollarSign} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <MetricCard label={t('totalTransactions')} value={String(data.totalTransactions)} icon={ShoppingCart} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <MetricCard label={t('avgTransaction')} value={formatCurrency(data.avgTransaction)} icon={TrendingUp} iconBg="bg-violet-50" iconColor="text-violet-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">{t('salesByDay')}</h3>
          {chartData.length === 0
            ? <p className="text-center text-gray-400 py-10 text-sm">{t('noData')}</p>
            : <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs><linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={50}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip formatter={(v) => [formatCurrency(Number(v)), t('totalSales')]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Area type="monotone" dataKey="amount" stroke="#059669" strokeWidth={2} fill="url(#sg2)"
                    dot={{ r: 3, fill: '#059669', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">{t('paymentBreakdown')}</h3>
          {data.paymentBreakdown.every((d) => d.value === 0)
            ? <p className="text-center text-gray-400 py-10 text-sm">{t('noData')}</p>
            : <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.paymentBreakdown} cx="50%" cy="50%" outerRadius={75} dataKey="value">
                      {data.paymentBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {data.paymentBreakdown.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                      {d.name === 'CASH' ? t('cash') : t('mobile')}: {formatCurrency(d.value)}
                    </div>
                  ))}
                </div>
              </>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50"><h3 className="font-semibold text-gray-700">{t('monthlyBreakdown')}</h3></div>
        {chartData.length === 0
          ? <p className="text-center text-gray-400 py-8 text-sm">{t('noData')}</p>
          : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-6 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('period')}</th>
                <th className="px-6 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('totalSales')}</th>
                <th className="px-6 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('totalTransactions')}</th>
                <th className="px-6 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('avgTransaction')}</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {data.chartData.map((row) => (
                  <tr key={row.period} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-gray-600">{fmtPeriod(row.period, groupBy, locale)}</td>
                    <td className="px-6 py-3 font-semibold text-emerald-600">{formatCurrency(row.amount)}</td>
                    <td className="px-6 py-3 text-gray-700">{row.count}</td>
                    <td className="px-6 py-3 text-gray-700">{row.count > 0 ? formatCurrency(row.amount / row.count) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>}
      </div>

      <ExportBar
        onPdf={() => doPDF('sales-section', title, locale)}
        onExcel={() => doExportExcel(data.chartData.map(r => ({ [t('period')]: fmtPeriod(r.period, groupBy, locale), [t('totalSales')]: r.amount, [t('totalTransactions')]: r.count })), title)}
        onPrint={() => doPrint('sales-section')} t={t} />
    </div>
  )
}

// ─── Profit Tab ────────────────────────────────────────────────────────────────

function ProfitTab({ range, groupBy, locale, t }: { range: DateRange; groupBy: GroupBy; locale: string; t: (k: string) => string }) {
  const [data, setData] = useState<ProfitData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/reports/profit?from=${range.from}&to=${range.to}&groupBy=${groupBy}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch { setError(t('loadError')) } finally { setLoading(false) }
  }, [range.from, range.to, groupBy, t])

  useEffect(() => { load() }, [load])

  const chartData = data?.chartData.map((d) => ({ ...d, period: fmtPeriod(d.period, groupBy, locale) })) ?? []
  const title = t('profitReport')

  if (loading) return <LoadingSpinner />
  if (error) return <p className="text-red-500 text-center py-8">{error}</p>
  if (!data) return null

  return (
    <div id="profit-section" className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label={t('revenue')} value={formatCurrency(data.revenue)} icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <MetricCard label={t('cost')} value={formatCurrency(data.cost)} icon={TrendingDown} iconBg="bg-red-50" iconColor="text-red-400" />
        <MetricCard label={t('grossProfit')} value={formatCurrency(data.grossProfit)} icon={DollarSign} iconBg="bg-blue-50" iconColor="text-blue-600" trend={data.grossProfit >= 0 ? 'up' : 'down'} />
        <MetricCard label={t('profitMargin')} value={`${data.profitMargin.toFixed(1)}%`} icon={BarChart2} iconBg="bg-violet-50" iconColor="text-violet-600" trend={data.profitMargin >= 0 ? 'up' : 'down'} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">{t('profitTrend')}</h3>
        {chartData.length === 0
          ? <p className="text-center text-gray-400 py-10 text-sm">{t('noData')}</p>
          : <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={55}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(v, name) => [formatCurrency(Number(v)), name === 'revenue' ? t('revenue') : name === 'cost' ? t('cost') : t('grossProfit')]}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend formatter={(v) => v === 'revenue' ? t('revenue') : v === 'cost' ? t('cost') : t('grossProfit')} />
                <Bar dataKey="revenue" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="cost" fill={CHART_COLORS.cost} radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="profit" fill={CHART_COLORS.profit} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50"><h3 className="font-semibold text-gray-700">{t('monthlyBreakdown')}</h3></div>
        {chartData.length === 0
          ? <p className="text-center text-gray-400 py-8 text-sm">{t('noData')}</p>
          : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-6 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('period')}</th>
                <th className="px-6 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('revenue')}</th>
                <th className="px-6 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('cost')}</th>
                <th className="px-6 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('grossProfit')}</th>
                <th className="px-6 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('profitMargin')}</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {data.chartData.map((row) => {
                  const margin = row.revenue > 0 ? ((row.profit / row.revenue) * 100).toFixed(1) : '0'
                  return (
                    <tr key={row.period} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-gray-600">{fmtPeriod(row.period, groupBy, locale)}</td>
                      <td className="px-6 py-3 font-semibold text-emerald-600">{formatCurrency(row.revenue)}</td>
                      <td className="px-6 py-3 text-red-500">{formatCurrency(row.cost)}</td>
                      <td className={`px-6 py-3 font-semibold ${row.profit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{formatCurrency(row.profit)}</td>
                      <td className="px-6 py-3 text-gray-700">{margin}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table></div>}
      </div>

      <ExportBar
        onPdf={() => doPDF('profit-section', title, locale)}
        onExcel={() => doExportExcel(data.chartData.map(r => ({ [t('period')]: fmtPeriod(r.period, groupBy, locale), [t('revenue')]: r.revenue, [t('cost')]: r.cost, [t('grossProfit')]: r.profit })), title)}
        onPrint={() => doPrint('profit-section')} t={t} />
    </div>
  )
}

// ─── Top Products Tab ──────────────────────────────────────────────────────────

function TopProductsTab({ range, locale, t }: { range: DateRange; locale: string; t: (k: string) => string }) {
  const [data, setData] = useState<TopProductsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/reports/top-products?from=${range.from}&to=${range.to}&limit=10`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch { setError(t('loadError')) } finally { setLoading(false) }
  }, [range.from, range.to, t])

  useEffect(() => { load() }, [load])

  const title = t('topProductsReport')

  if (loading) return <LoadingSpinner />
  if (error) return <p className="text-red-500 text-center py-8">{error}</p>
  if (!data) return null

  const barData = data.products.map((p) => ({
    name: (locale === 'ar' ? p.name_ar : p.name_fr).slice(0, 20),
    revenue: p.revenue,
  }))

  return (
    <div id="top-products-section" className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">{t('top10Products')}</h3>
        {barData.length === 0
          ? <p className="text-center text-gray-400 py-10 text-sm">{t('noData')}</p>
          : <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={130} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), t('revenueGenerated')]}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#059669" radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50"><h3 className="font-semibold text-gray-700">{t('topProducts')}</h3></div>
        {data.products.length === 0
          ? <p className="text-center text-gray-400 py-8 text-sm">{t('noData')}</p>
          : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-6 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('rank')}</th>
                <th className="px-6 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('product')}</th>
                <th className="px-6 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('quantitySold')}</th>
                <th className="px-6 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('revenueGenerated')}</th>
                <th className="px-6 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('salePrice')}</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {data.products.map((p, idx) => (
                  <tr key={p.productId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-200 text-gray-600' : idx === 2 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-800">{locale === 'ar' ? p.name_ar : p.name_fr}</td>
                    <td className="px-6 py-3 text-gray-700">{p.quantitySold}</td>
                    <td className="px-6 py-3 font-semibold text-emerald-600">{formatCurrency(p.revenue)}</td>
                    <td className="px-6 py-3 text-gray-600">{formatCurrency(p.salePrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>}
      </div>

      <ExportBar
        onPdf={() => doPDF('top-products-section', title, locale)}
        onExcel={() => doExportExcel(data.products.map((p, i) => ({ [t('rank')]: i + 1, [t('product')]: locale === 'ar' ? p.name_ar : p.name_fr, [t('quantitySold')]: p.quantitySold, [t('revenueGenerated')]: p.revenue })), title)}
        onPrint={() => doPrint('top-products-section')} t={t} />
    </div>
  )
}

// ─── Inventory Tab ─────────────────────────────────────────────────────────────

function InventoryTab({ locale, t }: { locale: string; t: (k: string) => string }) {
  const [data, setData] = useState<InventoryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<'all' | 'risk' | 'dead'>('all')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/reports/inventory')
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch { setError(t('loadError')) } finally { setLoading(false) }
  }, [t])

  useEffect(() => { load() }, [load])

  const title = t('inventoryReport')
  const displayProducts = data ? (view === 'risk' ? data.atRiskProducts : view === 'dead' ? data.deadStockProducts : data.products) : []

  const badge = (s: string) => ({
    out: <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">{locale === 'ar' ? 'نفد' : 'Épuisé'}</span>,
    low: <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-xs font-medium">{locale === 'ar' ? 'منخفض' : 'Faible'}</span>,
    normal: <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full text-xs font-medium">{locale === 'ar' ? 'طبيعي' : 'Normal'}</span>,
  }[s] ?? null)

  if (loading) return <LoadingSpinner />
  if (error) return <p className="text-red-500 text-center py-8">{error}</p>
  if (!data) return null

  return (
    <div id="inventory-section" className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label={t('stockValue')} value={formatCurrency(data.totalStockValue)} icon={Package} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <MetricCard label={t('turnoverRate')} value={`${data.turnoverRate}x`} icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <MetricCard label={t('atRiskProducts')} value={String(data.atRiskCount)} icon={AlertTriangle} iconBg="bg-amber-50" iconColor="text-amber-500" />
        <MetricCard label={t('deadStock')} value={String(data.deadStockCount)} icon={TrendingDown} iconBg="bg-red-50" iconColor="text-red-400" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'risk', 'dead'] as const).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === v ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {v === 'all' ? t('currentStock') : v === 'risk' ? `${t('atRiskProducts')} (${data.atRiskCount})` : `${t('deadStock')} (${data.deadStockCount})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-700">
            {view === 'all' ? t('currentStock') : view === 'risk' ? t('atRiskProducts') : t('deadStock')}
          </h3>
        </div>
        {displayProducts.length === 0
          ? <p className="text-center text-gray-400 py-8 text-sm">{t('noData')}</p>
          : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('product')}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('currentStock')}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('minQuantity')}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('purchasePrice')}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('totalValue')}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('salesVelocity')}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase">{t('status')}</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {displayProducts.map((p) => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.isAtRisk ? 'bg-amber-50/30' : p.isDeadStock ? 'bg-red-50/20' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{locale === 'ar' ? p.name_ar : p.name_fr}</td>
                    <td className="px-4 py-3 text-gray-700">{p.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{p.minQuantity}</td>
                    <td className="px-4 py-3 text-gray-600">{formatCurrency(p.purchasePrice)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{formatCurrency(p.stockValue)}</td>
                    <td className="px-4 py-3 text-gray-600">{p.salesVelocityPerDay > 0 ? `${p.salesVelocityPerDay}/d` : '—'}</td>
                    <td className="px-4 py-3">{badge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>}
      </div>

      <ExportBar
        onPdf={() => doPDF('inventory-section', title, locale)}
        onExcel={() => doExportExcel(displayProducts.map(p => ({ [t('product')]: locale === 'ar' ? p.name_ar : p.name_fr, [t('currentStock')]: p.quantity, [t('minQuantity')]: p.minQuantity, [t('purchasePrice')]: p.purchasePrice, [t('totalValue')]: p.stockValue })), title)}
        onPrint={() => doPrint('inventory-section')} t={t} />
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const locale = useLocale()
  const t = useTranslations('reports')
  const isRTL = locale === 'ar'

  const [activeTab, setActiveTab] = useState<TabId>('sales')
  const [preset, setPreset] = useState<DatePreset>('thisMonth')
  const [range, setRange] = useState<DateRange>(monthRange())
  const [groupBy, setGroupBy] = useState<GroupBy>('day')
  const [pendingRange, setPendingRange] = useState<DateRange>(monthRange())

  const handlePreset = (p: DatePreset) => {
    setPreset(p)
    if (p === 'today') { const r = todayRange(); setRange(r); setPendingRange(r); setGroupBy('day') }
    else if (p === 'thisWeek') { const r = weekRange(); setRange(r); setPendingRange(r); setGroupBy('day') }
    else if (p === 'thisMonth') { const r = monthRange(); setRange(r); setPendingRange(r); setGroupBy('day') }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'sales', label: t('sales') },
    { id: 'profit', label: t('profit') },
    { id: 'top-products', label: t('topProducts') },
    { id: 'inventory', label: t('inventory') },
  ]

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-max px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date range bar (not for inventory) */}
      {activeTab !== 'inventory' && (
        <DateRangeBar
          range={pendingRange}
          preset={preset}
          groupBy={groupBy}
          onPreset={handlePreset}
          onRange={setPendingRange}
          onGroupBy={setGroupBy}
          onApply={() => setRange({ ...pendingRange })}
          isRTL={isRTL}
          t={t}
        />
      )}

      {/* Tab panels */}
      {activeTab === 'sales' && <SalesTab range={range} groupBy={groupBy} locale={locale} t={t} />}
      {activeTab === 'profit' && <ProfitTab range={range} groupBy={groupBy} locale={locale} t={t} />}
      {activeTab === 'top-products' && <TopProductsTab range={range} locale={locale} t={t} />}
      {activeTab === 'inventory' && <InventoryTab locale={locale} t={t} />}
    </div>
  )
}
