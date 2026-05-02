'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Store, Eye, EyeOff, Loader2 } from 'lucide-react'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'

export default function LoginPage() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        router.push(`/${locale}/dashboard`)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || t('invalidCredentials'))
      }
    } catch {
      setError(t('serverError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 flex flex-col">
      {/* Language switcher top bar */}
      <div className="flex justify-end p-4">
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-1">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-xl mb-4">
              <Store className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">تاجر</h1>
            <p className="text-emerald-100 mt-2 text-sm">
              {locale === 'ar' ? 'منصة إدارة المحلات الذكية' : 'Plateforme de gestion intelligente'}
            </p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              {t('login')}
            </h2>

            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="admin@tajer.mr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pe-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 end-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{tCommon('loading')}</span>
                  </>
                ) : (
                  t('login')
                )}
              </button>
            </form>

            {/* Demo credentials hint */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-2">
                {locale === 'ar' ? 'بيانات تجريبية' : 'Identifiants de test'}
              </p>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 font-mono text-center space-y-1">
                <p>admin@tajer.mr</p>
                <p>admin123</p>
              </div>
            </div>
          </div>

          <p className="text-center text-emerald-100/60 text-xs mt-6">
            &copy; 2025 Tajer · موريتانيا
          </p>
        </div>
      </div>
    </div>
  )
}
