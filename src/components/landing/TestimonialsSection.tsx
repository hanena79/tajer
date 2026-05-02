import { useTranslations } from 'next-intl'
import { Quote, Star } from 'lucide-react'

const testimonialKeys = ['t1', 't2', 't3'] as const
const avatarColors = [
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-orange-100 text-orange-700',
]

export function TestimonialsSection() {
  const t = useTranslations('landing.testimonials')

  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-500">{t('subtitle')}</p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonialKeys.map((key, index) => {
            const name = t(`${key}.name`)
            const initials = name.split(' ').slice(0, 2).map((w: string) => w[0]).join('')
            return (
              <div
                key={key}
                className="relative bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all duration-300"
              >
                {/* Quote icon */}
                <Quote className="w-8 h-8 text-emerald-200 mb-4" />

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                {/* Quote text */}
                <p className="text-gray-700 text-sm leading-relaxed mb-6 italic">
                  &ldquo;{t(`${key}.quote`)}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${avatarColors[index]}`}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t(`${key}.name`)}</p>
                    <p className="text-xs text-gray-500">{t(`${key}.shop`)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
