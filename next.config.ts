import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

const nextConfig: NextConfig = {
  // Vercel handles output automatically
  // No need for standalone or export
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'jose'],
  },
}
export default withNextIntl(nextConfig)
