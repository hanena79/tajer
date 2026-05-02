import type { Metadata, Viewport } from 'next'
import { Inter, Cairo } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import '../globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' })

export const metadata: Metadata = {
  title: 'Tajer | تاجر',
  description: 'منصة إدارة المحلات والشركات الصغيرة في موريتانيا',
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#059669',
}

export function generateStaticParams() {
  return [{ locale: 'ar' }, { locale: 'fr' }]
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()
  const isRTL = locale === 'ar'

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body
        className={`${inter.variable} ${cairo.variable} ${
          isRTL ? 'font-cairo' : 'font-inter'
        } antialiased bg-gray-50`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
