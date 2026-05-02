'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  return (
    <div className="flex items-center gap-1 border rounded-md p-1">
      <Button
        variant={locale === 'ar' ? 'default' : 'ghost'}
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => switchLocale('ar')}
      >
        عربي
      </Button>
      <Button
        variant={locale === 'fr' ? 'default' : 'ghost'}
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => switchLocale('fr')}
      >
        FR
      </Button>
    </div>
  )
}
