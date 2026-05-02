import { useTranslations } from 'next-intl'
import {
  ShoppingCart,
  Package,
  FileText,
  BarChart3,
  WifiOff,
  Languages,
} from 'lucide-react'

const icons = [ShoppingCart, Package, FileText, BarChart3, WifiOff, Languages]
const featureKeys = ['pos', 'inventory', 'invoicing', 'reports', 'offline', 'bilingual'] as const
const iconColors = [
  'text-emerald-600 bg-emerald-50',
  'text-blue-600 bg-blue-50',
  'text-violet-600 bg-violet-50',
  'text-orange-600 bg-orange-50',
  'text-pink-600 bg-pink-50',
  'text-teal-600 bg-teal-50',
]

export function FeaturesSection() {
  const t = useTranslations('landing.features')

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium">
            {t('title')}
          </div>
          <p className="text-lg text-gray-500">{t('subtitle')}</p>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureKeys.map((key, index) => {
            const Icon = icons[index]
            const colorClass = iconColors[index]
            return (
              <div
                key={key}
                className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50/50 transition-all duration-300"
              >
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl ${colorClass} mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t(`${key}.title`)}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {t(`${key}.desc`)}
                </p>

                {/* Hover accent line */}
                <div className="absolute bottom-0 start-6 end-6 h-0.5 bg-emerald-500 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-start" />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
