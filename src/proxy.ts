import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['ar', 'fr'],
  defaultLocale: 'ar',
  localePrefix: 'always',
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
