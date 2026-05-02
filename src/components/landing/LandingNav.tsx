'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, ShoppingBag } from 'lucide-react'

export function LandingNav() {
  const t = useTranslations('landing.nav')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
    setMenuOpen(false)
  }

  const navLinks = [
    { href: `#features`, label: t('features') },
    { href: `#pricing`, label: t('pricing') },
    { href: `#contact`, label: t('contact') },
  ]

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md group-hover:bg-emerald-700 transition-colors">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-gray-900 text-lg leading-none">تاجر</span>
              <span className="text-xs text-gray-500 leading-none hidden sm:block">{t('logoTagline')}</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right side: lang switcher + login */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language switcher */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => switchLocale('ar')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  locale === 'ar'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                عربي
              </button>
              <button
                onClick={() => switchLocale('fr')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  locale === 'fr'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                FR
              </button>
            </div>
            <Link
              href={`/${locale}/login`}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-all"
            >
              {t('login')}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              {locale === 'ar' ? 'ابدأ مجانًا' : 'Commencer'}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-sm font-medium text-gray-700 hover:text-emerald-600 py-2"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => switchLocale('ar')}
                  className={`px-3 py-1.5 text-xs font-medium ${locale === 'ar' ? 'bg-emerald-600 text-white' : 'text-gray-600'}`}
                >
                  عربي
                </button>
                <button
                  onClick={() => switchLocale('fr')}
                  className={`px-3 py-1.5 text-xs font-medium ${locale === 'fr' ? 'bg-emerald-600 text-white' : 'text-gray-600'}`}
                >
                  FR
                </button>
              </div>
              <Link
                href={`/${locale}/login`}
                className="flex-1 text-center py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg"
                onClick={() => setMenuOpen(false)}
              >
                {t('login')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
