import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tajer | تاجر',
    short_name: 'تاجر',
    description: 'منصة إدارة المحلات والشركات الصغيرة في موريتانيا',
    start_url: '/ar/dashboard',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#059669',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    categories: ['business', 'productivity'],
  }
}
