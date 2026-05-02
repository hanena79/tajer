import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ShoppingBag, Mail, Phone } from 'lucide-react'

export function CTABanner() {
  const t = useTranslations('landing.cta')
  const locale = useLocale()
  const isRTL = locale === 'ar'
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 rounded-3xl px-8 py-16 text-center overflow-hidden shadow-2xl shadow-emerald-200/50">
          {/* Decorative circles */}
          <div className="absolute -top-12 -end-12 w-48 h-48 bg-emerald-500/30 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -start-12 w-48 h-48 bg-emerald-700/40 rounded-full blur-2xl" />

          <div className="relative space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              {t('title')}
            </h2>
            <p className="text-lg text-emerald-100">
              {t('subtitle')}
            </p>
            <div>
              <Link
                href={`/${locale}/login`}
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-emerald-700 bg-white rounded-xl hover:bg-emerald-50 transition-all duration-200 shadow-lg hover:-translate-y-0.5"
              >
                {t('button')}
                <ArrowIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function LandingFooter() {
  const t = useTranslations('landing')
  const tNav = useTranslations('landing.nav')
  const tFooter = useTranslations('landing.footer')
  const locale = useLocale()
  const currentYear = new Date().getFullYear()

  const navLinks = [
    { href: '#features', label: tNav('features') },
    { href: '#pricing', label: tNav('pricing') },
    { href: '#contact', label: tNav('contact') },
  ]

  return (
    <footer id="contact" className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-xl">تاجر</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              {tFooter('tagline')}
            </p>
            <p className="text-sm text-gray-500">{tFooter('madeIn')}</p>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white text-sm uppercase tracking-wider">
              {tFooter('links')}
            </h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href={`/${locale}/login`}
                  className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
                >
                  {tNav('login')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white text-sm uppercase tracking-wider">
              {tFooter('contact')}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Mail className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <a href={`mailto:${tFooter('email')}`} className="hover:text-emerald-400 transition-colors">
                  {tFooter('email')}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Phone className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span dir="ltr">{tFooter('phone')}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {currentYear} تاجر — {tFooter('rights')}</p>
          <p className="text-gray-600">Tajer v1.0</p>
        </div>
      </div>
    </footer>
  )
}
