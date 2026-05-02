'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface SalesChartProps {
  data: { day: string; amount: number }[]
  title: string
  locale: string
}

export function SalesChart({ data, title, locale }: SalesChartProps) {
  const formatAmount = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
    return String(value)
  }

  const formatTooltip = (value: number) =>
    new Intl.NumberFormat(locale === 'ar' ? 'ar-MR' : 'fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(value) + ' MRU'

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="font-semibold text-gray-700 mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatAmount}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            formatter={(value) => [formatTooltip(Number(value)), '']}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#059669"
            strokeWidth={2}
            fill="url(#salesGrad)"
            dot={{ r: 3, fill: '#059669', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#059669' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
