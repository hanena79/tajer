import { useTranslations } from 'next-intl'
import { UserPlus, Package, ShoppingBag } from 'lucide-react'

const stepIcons = [UserPlus, Package, ShoppingBag]
const stepKeys = ['step1', 'step2', 'step3'] as const

export function HowItWorksSection() {
  const t = useTranslations('landing.howItWorks')

  return (
    <section id="how-it-works" className="py-24 bg-gray-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-500">{t('subtitle')}</p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (hidden on mobile) */}
          <div className="hidden lg:block absolute top-12 start-1/6 end-1/6 h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200" />

          <div className="grid sm:grid-cols-3 gap-8 lg:gap-12 relative">
            {stepKeys.map((key, index) => {
              const Icon = stepIcons[index]
              return (
                <div key={key} className="flex flex-col items-center text-center group">
                  {/* Step number + icon */}
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center group-hover:border-emerald-300 group-hover:shadow-emerald-100/60 group-hover:shadow-lg transition-all duration-300">
                      <Icon className="w-10 h-10 text-emerald-600" />
                    </div>
                    {/* Step number badge */}
                    <div className="absolute -top-3 -end-3 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                      {index + 1}
                    </div>
                  </div>

                  {/* Text */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {t(`${key}.title`)}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                    {t(`${key}.desc`)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
