'use client'

import { useLocale } from 'next-intl'
import { Bell, Menu } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const locale = useLocale()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-gray-600"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <span className="text-sm text-gray-500 hidden sm:block">
          {new Date().toLocaleDateString(locale === 'ar' ? 'ar-MR' : 'fr-MR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <Bell className="w-5 h-5" />
          </Button>
          <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </div>
      </div>
    </header>
  )
}
