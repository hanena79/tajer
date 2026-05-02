'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import * as Dialog from '@radix-ui/react-dialog'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  FileText,
  BarChart2,
  Settings,
  Store,
  X,
  LogOut,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

const navItems = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'pos', href: '/pos', icon: ShoppingCart },
  { key: 'products', href: '/products', icon: Package },
  { key: 'inventory', href: '/inventory', icon: Warehouse },
  { key: 'invoices', href: '/invoices', icon: FileText },
  { key: 'reports', href: '/reports', icon: BarChart2 },
  { key: 'settings', href: '/settings', icon: Settings },
]

function NavContent({ onClose }: { onClose?: () => void }) {
  const t = useTranslations('nav')
  const tAuth = useTranslations('auth')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch('/api/inventory')
        if (!res.ok) return
        const data = await res.json()
        setAlertCount((data.alertCount as number) ?? 0)
      } catch {
        // ignore
      }
    }
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 60000)
    return () => clearInterval(interval)
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push(`/${locale}/login`)
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">تاجر</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ key, href, icon: Icon }) => {
          const fullHref = `/${locale}${href}`
          const isActive = pathname === fullHref || pathname.startsWith(fullHref + '/')
          const showBadge = key === 'inventory' && alertCount > 0
          return (
            <Link
              key={key}
              href={fullHref}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon
                className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-white' : 'text-gray-400')}
              />
              <span className="flex-1">{t(key)}</span>
              {showBadge && (
                <span className="min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User / Logout */}
      <div className="px-3 py-4 border-t border-gray-700/50 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">مدير النظام</p>
            <p className="text-xs text-gray-400 truncate">admin@tajer.mr</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>{tAuth('logout')}</span>
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen shrink-0">
      <NavContent />
    </aside>
  )
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" />
        <Dialog.Content
          className="fixed inset-y-0 start-0 w-72 z-50 focus:outline-none lg:hidden shadow-2xl"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">القائمة الجانبية</Dialog.Title>
          <NavContent onClose={onClose} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
