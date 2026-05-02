'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import * as Dialog from '@radix-ui/react-dialog'
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

// ---------- Types ----------
interface Category {
  id: string
  name_ar: string
  name_fr: string
}

interface InventoryProduct {
  id: string
  name_ar: string
  name_fr: string
  quantity: number
  minQuantity: number
  status: 'normal' | 'low' | 'out'
  category: Category | null
}

interface MovementProduct {
  id: string
  name_ar: string
  name_fr: string
}

interface StockMovement {
  id: string
  type: 'IN' | 'OUT'
  quantity: number
  reason: string | null
  createdAt: string
  product: MovementProduct
  user: { id: string; name: string }
}

interface AllProducts {
  id: string
  name_ar: string
  name_fr: string
}

// ---------- Toast ----------
function Toast({
  message,
  type,
  onClose,
}: {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        'fixed bottom-4 end-4 z-[100] px-4 py-3 rounded-lg shadow-lg text-white text-sm flex items-center gap-2 max-w-xs',
        type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
      )}
    >
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ---------- Add Movement Dialog ----------
function AddMovementDialog({
  open,
  onClose,
  onSaved,
  allProducts,
  locale,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  allProducts: AllProducts[]
  locale: string
}) {
  const t = useTranslations('inventory')
  const tCommon = useTranslations('common')
  const [form, setForm] = useState({ productId: '', type: 'IN', quantity: '1', reason: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm({ productId: '', type: 'IN', quantity: '1', reason: '' })
      setError('')
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.productId || !form.quantity) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: form.productId,
          type: form.type,
          quantity: parseInt(form.quantity),
          reason: form.reason,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error')
        return
      }
      onSaved()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl z-50 shadow-2xl p-6 focus:outline-none">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {t('addMovement')}
            </Dialog.Title>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('movementProduct')}
              </label>
              <select
                required
                value={form.productId}
                onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{t('selectProduct')}</option>
                {allProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {locale === 'ar' ? p.name_ar : p.name_fr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('movementType')}
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="IN"
                    checked={form.type === 'IN'}
                    onChange={() => setForm((f) => ({ ...f, type: 'IN' }))}
                    className="text-emerald-600"
                  />
                  <span className="text-sm text-emerald-700 font-medium">{t('movementIn')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="OUT"
                    checked={form.type === 'OUT'}
                    onChange={() => setForm((f) => ({ ...f, type: 'OUT' }))}
                    className="text-red-600"
                  />
                  <span className="text-sm text-red-700 font-medium">{t('movementOut')}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('movementQuantity')}
              </label>
              <input
                type="number"
                required
                min="1"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('movementReason')}
              </label>
              <input
                type="text"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder={t('reasonPlaceholder')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
              >
                {tCommon('cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || !form.productId}
                className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? tCommon('loading') : tCommon('save')}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ---------- Status Badge ----------
function StatusBadge({ status }: { status: 'normal' | 'low' | 'out' }) {
  const t = useTranslations('inventory')
  const map = {
    normal: { label: t('statusNormal'), cls: 'bg-emerald-100 text-emerald-700' },
    low: { label: t('statusLow'), cls: 'bg-amber-100 text-amber-700' },
    out: { label: t('statusOut'), cls: 'bg-red-100 text-red-700' },
  }
  const { label, cls } = map[status]
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', cls)}>
      {status !== 'normal' && <AlertTriangle className="w-3 h-3" />}
      {label}
    </span>
  )
}

// ---------- Main Page ----------
export default function InventoryPage() {
  const t = useTranslations('inventory')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [allProducts, setAllProducts] = useState<AllProducts[]>([])
  const [stats, setStats] = useState({ total: 0, lowCount: 0, outCount: 0 })
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingMovements, setLoadingMovements] = useState(true)

  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out'>('all')
  const [movPage, setMovPage] = useState(1)
  const [movTotal, setMovTotal] = useState(0)
  const MOV_PAGE_SIZE = 10

  const [addMovDialog, setAddMovDialog] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchInventory = useCallback(async () => {
    setLoadingProducts(true)
    try {
      const params = new URLSearchParams({ status: statusFilter })
      const res = await fetch(`/api/inventory?${params}`)
      const data = await res.json()
      setProducts(data.products ?? [])
      setStats({ total: data.total ?? 0, lowCount: data.lowCount ?? 0, outCount: data.outCount ?? 0 })
    } finally {
      setLoadingProducts(false)
    }
  }, [statusFilter])

  const fetchMovements = useCallback(async () => {
    setLoadingMovements(true)
    try {
      const params = new URLSearchParams({ page: String(movPage), limit: String(MOV_PAGE_SIZE) })
      const res = await fetch(`/api/inventory/movements?${params}`)
      const data = await res.json()
      setMovements(data.movements ?? [])
      setMovTotal(data.total ?? 0)
    } finally {
      setLoadingMovements(false)
    }
  }, [movPage])

  const fetchAllProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products?limit=500&sortBy=name_ar')
      const data = await res.json()
      setAllProducts(data.products ?? [])
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => { fetchInventory() }, [fetchInventory])
  useEffect(() => { fetchMovements() }, [fetchMovements])
  useEffect(() => { fetchAllProducts() }, [fetchAllProducts])

  function handleMovementSaved() {
    fetchInventory()
    fetchMovements()
    setToast({ message: t('addMovementSuccess'), type: 'success' })
  }

  const movTotalPages = Math.ceil(movTotal / MOV_PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <button
          onClick={() => setAddMovDialog(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          {t('addMovement')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('totalProducts')}</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('lowStockCount')}</p>
            <p className="text-2xl font-bold text-amber-600">{stats.lowCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('outOfStockCount')}</p>
            <p className="text-2xl font-bold text-red-600">{stats.outCount}</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(stats.lowCount > 0 || stats.outCount > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            {t('alerts')}
          </h3>
          <div className="space-y-1">
            {products
              .filter((p) => p.status !== 'normal')
              .slice(0, 5)
              .map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-amber-700">
                    {locale === 'ar' ? p.name_ar : p.name_fr}
                  </span>
                  <StatusBadge status={p.status} />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Stock Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold text-gray-800">{t('title')}</h2>
          <div className="flex gap-1">
            {(['all', 'low', 'out'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s) }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  statusFilter === s
                    ? s === 'all'
                      ? 'bg-gray-900 text-white'
                      : s === 'low'
                      ? 'bg-amber-500 text-white'
                      : 'bg-red-500 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                )}
              >
                {s === 'all' ? t('allStatuses') : s === 'low' ? t('statusLow') : t('statusOut')}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-start text-gray-600 font-medium">{t('movementProduct')}</th>
                <th className="px-4 py-3 text-start text-gray-600 font-medium">{t('currentQuantity')}</th>
                <th className="px-4 py-3 text-start text-gray-600 font-medium">{t('minQuantity')}</th>
                <th className="px-4 py-3 text-start text-gray-600 font-medium">{tCommon('status')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingProducts ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400 text-sm">
                    {tCommon('loading')}
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400 text-sm">
                    {tCommon('noData')}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className={cn(
                      'border-b last:border-0 transition-colors',
                      product.status === 'out'
                        ? 'bg-red-50/40 hover:bg-red-50'
                        : product.status === 'low'
                        ? 'bg-amber-50/40 hover:bg-amber-50'
                        : 'hover:bg-gray-50'
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {locale === 'ar' ? product.name_ar : product.name_fr}
                      </p>
                      {product.category && (
                        <p className="text-xs text-gray-400">
                          {locale === 'ar' ? product.category.name_ar : product.category.name_fr}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'font-semibold text-base',
                          product.status === 'out'
                            ? 'text-red-600'
                            : product.status === 'low'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        )}
                      >
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{product.minQuantity}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={product.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{t('recentMovements')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-start text-gray-600 font-medium">{t('movementProduct')}</th>
                <th className="px-4 py-3 text-start text-gray-600 font-medium">{t('movementType')}</th>
                <th className="px-4 py-3 text-start text-gray-600 font-medium">{t('movementQuantity')}</th>
                <th className="px-4 py-3 text-start text-gray-600 font-medium">{t('movementReason')}</th>
                <th className="px-4 py-3 text-start text-gray-600 font-medium">{t('movementUser')}</th>
                <th className="px-4 py-3 text-start text-gray-600 font-medium">{t('movementDate')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingMovements ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                    {tCommon('loading')}
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                    {t('noMovements')}
                  </td>
                </tr>
              ) : (
                movements.map((mov) => (
                  <tr key={mov.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {locale === 'ar' ? mov.product.name_ar : mov.product.name_fr}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                          mov.type === 'IN'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        )}
                      >
                        {mov.type === 'IN' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {mov.type === 'IN' ? t('movementIn') : t('movementOut')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{mov.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{mov.reason ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{mov.user.name}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {formatDate(mov.createdAt, locale)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {movTotalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {tCommon('page')} {movPage} {tCommon('of')} {movTotalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMovPage((p) => Math.max(1, p - 1))}
                disabled={movPage <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMovPage((p) => Math.min(movTotalPages, p + 1))}
                disabled={movPage >= movTotalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Movement Dialog */}
      <AddMovementDialog
        open={addMovDialog}
        onClose={() => setAddMovDialog(false)}
        onSaved={handleMovementSaved}
        allProducts={allProducts}
        locale={locale}
      />

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
