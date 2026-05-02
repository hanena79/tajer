import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Check, Zap } from 'lucide-react'

export function PricingSection() {
  const t = useTranslations('landing.pricing')
  const locale = useLocale()

  const freeFeatures = t.raw('free.features') as string[]
  const proFeatures = t.raw('pro.features') as string[]

  return (
    <section id="pricing" className="py-24 bg-gray-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-500">{t('subtitle')}</p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:border-gray-300 hover:shadow-md transition-all duration-300">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{t('free.name')}</h3>
              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-5xl font-bold text-gray-900">{t('free.price')}</span>
                <span className="text-gray-500 text-sm ms-1">{t('free.period')}</span>
              </div>
            </div>

            <Link
              href={`/${locale}/login`}
              className="block w-full text-center py-3 px-6 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors mb-8"
            >
              {t('free.cta')}
            </Link>

            <ul className="space-y-3">
              {freeFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-8 shadow-xl shadow-emerald-200/50">
            {/* Popular badge */}
            <div className="absolute -top-4 start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
              <div className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-900 px-4 py-1.5 rounded-full text-xs font-bold shadow-md whitespace-nowrap">
                <Zap className="w-3.5 h-3.5" />
                {t('pro.badge')}
              </div>
            </div>

            <div className="mb-6 mt-2">
              <h3 className="text-xl font-bold text-white mb-1">{t('pro.name')}</h3>
              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-5xl font-bold text-white">{t('pro.price')}</span>
                <span className="text-emerald-200 text-sm ms-1">
                  {t('pro.currency')} / {t('pro.period')}
                </span>
              </div>
            </div>

            <Link
              href={`/${locale}/login`}
              className="block w-full text-center py-3 px-6 text-sm font-semibold text-emerald-700 bg-white rounded-xl hover:bg-emerald-50 transition-colors mb-8 shadow-sm"
            >
              {t('pro.cta')}
            </Link>

            <ul className="space-y-3">
              {proFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-emerald-50">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/40 border border-emerald-400/50 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
