'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  FileText,
  CheckCircle,
  Clock,
  Send,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { InvoiceForm } from '@/components/invoices/InvoiceForm'
import * as Dialog from '@radix-ui/react-dialog'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  customerName?: string | null
  customerPhone?: string | null
  totalAmount: number
  createdAt: string
  items: InvoiceItem[]
}

const STATUS_CONFIG: Record<
  string,
  { label_ar: string; label_fr: string; color: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label_ar: 'مسودة',
    label_fr: 'Brouillon',
    color: 'bg-gray-100 text-gray-700',
    icon: <Clock className="w-3 h-3" />,
  },
  SENT: {
    label_ar: 'مُرسلة',
    label_fr: 'Envoyée',
    color: 'bg-blue-100 text-blue-700',
    icon: <Send className="w-3 h-3" />,
  },
  PAID: {
    label_ar: 'مدفوعة',
    label_fr: 'Payée',
    color: 'bg-emerald-100 text-emerald-700',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  CANCELLED: {
    label_ar: 'ملغاة',
    label_fr: 'Annulée',
    color: 'bg-red-100 text-red-700',
    icon: <XCircle className="w-3 h-3" />,
  },
  OVERDUE: {
    label_ar: 'متأخرة',
    label_fr: 'En retard',
    color: 'bg-orange-100 text-orange-700',
    icon: <Clock className="w-3 h-3" />,
  },
}

function StatusBadge({ status, locale }: { status: string; locale: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        cfg.color
      )}
    >
      {cfg.icon}
      {locale === 'ar' ? cfg.label_ar : cfg.label_fr}
    </span>
  )
}

const STATUSES = ['ALL', 'DRAFT', 'SENT', 'PAID', 'CANCELLED']

export default function InvoicesPage() {
  const t = useTranslations('invoices')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 15
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search ? { search } : {}),
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      })
      const res = await fetch(`/api/invoices?${params}`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setInvoices(data.invoices ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, limit])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  // Reset page on filter/search change
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetch(`/api/invoices/${deleteTarget.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      loadInvoices()
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} {locale === 'ar' ? 'فاتورة' : 'facture(s)'}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 me-1.5" />
          {t('newInvoice')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full border border-gray-200 rounded-xl ps-9 pe-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {STATUSES.map((s) => {
            const cfg = s !== 'ALL' ? STATUS_CONFIG[s] : null
            const labelAr = s === 'ALL' ? tCommon('all') : cfg?.label_ar ?? s
            const labelFr = s === 'ALL' ? tCommon('all') : cfg?.label_fr ?? s
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  statusFilter === s
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {locale === 'ar' ? labelAr : labelFr}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  t('number'),
                  t('customer'),
                  t('amount'),
                  t('status'),
                  tCommon('date'),
                  tCommon('actions'),
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-start text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">{tCommon('loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t('noInvoices')}</p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-gray-900 text-xs">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {inv.customerName ?? (
                        <span className="text-gray-400 italic text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 tabular-nums">
                      {inv.totalAmount.toLocaleString()} MRU
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} locale={locale} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs tabular-nums">
                      {new Date(inv.createdAt).toLocaleDateString(
                        locale === 'ar' ? 'ar-MR' : 'fr-FR'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => router.push(`/${locale}/invoices/${inv.id}`)}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title={tCommon('actions')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {inv.status === 'DRAFT' && (
                          <button
                            onClick={() => setDeleteTarget(inv)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={tCommon('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              {tCommon('page')} {page} {tCommon('of')} {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                      p === page
                        ? 'bg-emerald-600 text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-white'
                    )}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Invoice Dialog */}
      <Dialog.Root open={showForm} onOpenChange={setShowForm}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed inset-x-4 top-4 bottom-4 sm:inset-x-auto sm:start-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-3xl sm:top-8 sm:bottom-8 z-50 bg-white rounded-2xl shadow-2xl flex flex-col focus:outline-none overflow-hidden"
            aria-describedby={undefined}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                {t('newInvoice')}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <InvoiceForm
                onSuccess={(id) => {
                  setShowForm(false)
                  router.push(`/${locale}/invoices/${id}`)
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirm Dialog */}
      <Dialog.Root open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-[90vw] max-w-md p-6 focus:outline-none"
            aria-describedby={undefined}
          >
            <Dialog.Title className="text-base font-semibold text-gray-900 mb-3">
              {t('deleteInvoice')}
            </Dialog.Title>
            <p className="text-sm text-gray-600 mb-5">{t('deleteConfirm')}</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                {tCommon('cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? tCommon('loading') : tCommon('delete')}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
