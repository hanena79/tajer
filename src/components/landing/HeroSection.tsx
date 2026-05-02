import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'

function ShopIllustration() {
  return (
    <svg viewBox="0 0 480 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background glow */}
      <ellipse cx="240" cy="320" rx="180" ry="30" fill="#059669" fillOpacity="0.08" />

      {/* Main POS terminal */}
      <rect x="120" y="80" width="240" height="180" rx="16" fill="white" stroke="#e5e7eb" strokeWidth="2" />
      <rect x="120" y="80" width="240" height="48" rx="16" fill="#059669" />
      <rect x="120" y="112" width="240" height="16" fill="#059669" />

      {/* Screen content */}
      <rect x="136" y="148" width="100" height="8" rx="4" fill="#f3f4f6" />
      <rect x="136" y="162" width="80" height="8" rx="4" fill="#f3f4f6" />
      <rect x="136" y="176" width="120" height="8" rx="4" fill="#f3f4f6" />
      <rect x="136" y="190" width="90" height="8" rx="4" fill="#f3f4f6" />

      {/* Price tag */}
      <rect x="256" y="148" width="88" height="60" rx="8" fill="#ecfdf5" stroke="#6ee7b7" strokeWidth="1.5" />
      <rect x="268" y="160" width="64" height="8" rx="4" fill="#059669" fillOpacity="0.3" />
      <rect x="268" y="174" width="48" height="12" rx="4" fill="#059669" />

      {/* Checkout button */}
      <rect x="136" y="220" width="208" height="28" rx="8" fill="#059669" />
      <rect x="176" y="229" width="80" height="10" rx="5" fill="white" fillOpacity="0.8" />

      {/* Terminal stand */}
      <rect x="216" y="260" width="48" height="12" rx="4" fill="#d1d5db" />
      <rect x="196" y="272" width="88" height="8" rx="4" fill="#e5e7eb" />

      {/* Left card: Products */}
      <rect x="30" y="120" width="80" height="100" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      <rect x="40" y="130" width="60" height="36" rx="8" fill="#ecfdf5" />
      <rect x="40" y="130" width="60" height="36" rx="8" fill="url(#productGrad)" />
      <rect x="40" y="176" width="44" height="8" rx="4" fill="#f3f4f6" />
      <rect x="40" y="190" width="36" height="6" rx="3" fill="#059669" fillOpacity="0.4" />
      <rect x="40" y="202" width="56" height="8" rx="4" fill="#ecfdf5" />

      {/* Right card: Chart */}
      <rect x="370" y="120" width="80" height="100" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      <rect x="380" y="130" width="60" height="8" rx="4" fill="#f3f4f6" />
      {/* Bar chart */}
      <rect x="386" y="178" width="12" height="32" rx="3" fill="#d1fae5" />
      <rect x="402" y="165" width="12" height="45" rx="3" fill="#6ee7b7" />
      <rect x="418" y="155" width="12" height="55" rx="3" fill="#059669" />

      {/* Floating notification */}
      <rect x="300" y="55" width="130" height="44" rx="10" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      <circle cx="320" cy="77" r="10" fill="#ecfdf5" />
      <path d="M316 77l3 3 5-5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="336" y="68" width="80" height="7" rx="3.5" fill="#f3f4f6" />
      <rect x="336" y="80" width="60" height="7" rx="3.5" fill="#ecfdf5" />

      {/* Floating badge */}
      <rect x="50" y="55" width="110" height="40" rx="10" fill="#059669" />
      <rect x="64" y="67" width="60" height="7" rx="3.5" fill="white" fillOpacity="0.9" />
      <rect x="64" y="79" width="48" height="7" rx="3.5" fill="white" fillOpacity="0.6" />

      {/* Dots decoration */}
      <circle cx="70" cy="310" r="4" fill="#059669" fillOpacity="0.2" />
      <circle cx="90" cy="300" r="3" fill="#059669" fillOpacity="0.15" />
      <circle cx="410" cy="305" r="4" fill="#059669" fillOpacity="0.2" />
      <circle cx="390" cy="315" r="3" fill="#059669" fillOpacity="0.15" />

      {/* Top nav bar of POS */}
      <circle cx="144" cy="104" r="6" fill="white" fillOpacity="0.3" />
      <rect x="156" y="100" width="100" height="8" rx="4" fill="white" fillOpacity="0.5" />
      <rect x="324" y="100" width="20" height="8" rx="4" fill="white" fillOpacity="0.4" />

      <defs>
        <linearGradient id="productGrad" x1="40" y1="130" x2="100" y2="166">
          <stop offset="0%" stopColor="#ecfdf5" />
          <stop offset="100%" stopColor="#d1fae5" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function HeroSection() {
  const t = useTranslations('landing.hero')
  const locale = useLocale()
  const isRTL = locale === 'ar'
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 pt-16">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -end-40 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute top-1/2 -start-20 w-72 h-72 bg-emerald-50 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 end-1/4 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text content */}
          <div className={`space-y-8 ${isRTL ? 'lg:order-1' : 'lg:order-1'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              {t('badge')}
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              {t('headline')}
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
              {t('subtitle')}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/${locale}/login`}
                className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all duration-200 hover:-translate-y-0.5"
              >
                {t('cta')}
                <ArrowIcon className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold text-gray-700 bg-white border border-gray-200 hover:border-emerald-400 hover:text-emerald-600 rounded-xl transition-all duration-200 shadow-sm"
              >
                {t('ctaSecondary')}
              </a>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="text-emerald-500 font-bold text-lg">✓</span>
                {locale === 'ar' ? 'مجاني للبدء' : 'Gratuit pour commencer'}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="text-emerald-500 font-bold text-lg">✓</span>
                {locale === 'ar' ? 'بدون بطاقة ائتمان' : 'Sans carte de crédit'}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="text-emerald-500 font-bold text-lg">✓</span>
                {locale === 'ar' ? 'إعداد في دقيقة' : 'Configuration en 1 min'}
              </div>
            </div>
          </div>

          {/* Illustration */}
          <div className="lg:order-2 flex justify-center">
            <div className="relative w-full max-w-lg">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/30 to-emerald-100/20 rounded-3xl blur-2xl scale-110" />
              <div className="relative bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/80">
                <ShopIllustration />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 animate-bounce">
        <div className="w-0.5 h-8 bg-gradient-to-b from-transparent to-gray-300 rounded-full" />
      </div>
    </section>
  )
}
