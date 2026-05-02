'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Download,
  Printer,
  MessageCircle,
  ChevronDown,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  AlertCircle,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { downloadInvoicePDF, printInvoicePDF } from '@/lib/invoice-pdf'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  productId?: string | null
}

interface StatusHistoryEntry {
  id: string
  status: string
  createdAt: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  customerName?: string | null
  customerPhone?: string | null
  subtotal: number
  discount: number
  tax: number
  totalAmount: number
  notes?: string | null
  createdAt: string
  updatedAt: string
  items: InvoiceItem[]
  store: {
    name: string
    address?: string | null
    phone?: string | null
    logo?: string | null
    currency?: string
  }
  statusHistory: StatusHistoryEntry[]
}

const STATUS_CONFIG: Record<string, { label_ar: string; label_fr: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label_ar: 'مسودة', label_fr: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: Clock },
  SENT: { label_ar: 'مُرسلة', label_fr: 'Envoyée', color: 'bg-blue-100 text-blue-700', icon: Send },
  PAID: { label_ar: 'مدفوعة', label_fr: 'Payée', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  OVERDUE: { label_ar: 'متأخرة', label_fr: 'En retard', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  CANCELLED: { label_ar: 'ملغاة', label_fr: 'Annulée', color: 'bg-red-100 text-red-700', icon: XCircle },
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={cn(
      'fixed bottom-4 end-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg text-white',
      type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
    )}>
      {message}
    </div>
  )
}

export default function InvoiceDetailPage() {
  const t = useTranslations('invoices')
  const tCommon = useTranslations('common')
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'ar'
  const id = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusOpen, setStatusOpen] = useState(false)
  const [deletingOpen, setDeletingOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type })

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/invoices/${id}`)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      setInvoice(data.invoice)
    } catch {
      setError(t('errorLoading'))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  const handleStatusChange = async (newStatus: string) => {
    setStatusOpen(false)
    try {
      const res = await fetch(`/api/invoices/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setInvoice(data.invoice)
      showToast(t('statusUpdateSuccess'), 'success')
    } catch {
      showToast(t('statusUpdateError'), 'error')
    }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.push(`/${locale}/invoices`)
    } catch {
      showToast(t('deleteError'), 'error')
      setDeletingOpen(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!invoice) return
    downloadInvoicePDF(invoice, locale)
  }

  const handlePrint = () => {
    if (!invoice) return
    printInvoicePDF(invoice, locale)
  }

  const handleWhatsApp = () => {
    if (!invoice) return
    const phone = invoice.customerPhone?.replace(/\D/g, '') ?? ''
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const msg = t('whatsappMessage', {
      number: invoice.invoiceNumber,
      amount: invoice.totalAmount.toLocaleString(),
      url,
    })
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <span>{tCommon('loading')}</span>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">{error || t('errorLoading')}</p>
        <Button variant="outline" onClick={() => router.push(`/${locale}/invoices`)}>
          {t('backToList')}
        </Button>
      </div>
    )
  }

  const statusInfo = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.DRAFT
  const StatusIcon = statusInfo.icon
  const statusLabel = locale === 'ar' ? statusInfo.label_ar : statusInfo.label_fr

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => router.push(`/${locale}/invoices`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToList')}
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => router.push(`/${locale}/invoices?edit=${invoice.id}`)}>
            <Pencil className="h-4 w-4 me-1" />
            {tCommon('edit')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 me-1" />
            {t('downloadPdf')}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 me-1" />
            {tCommon('print')}
          </Button>
          {invoice.customerPhone && (
            <Button variant="outline" size="sm" onClick={handleWhatsApp} className="text-green-600 border-green-300 hover:bg-green-50">
              <MessageCircle className="h-4 w-4 me-1" />
              {t('sendWhatsApp')}
            </Button>
          )}
          {/* Status dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusOpen((v) => !v)}
              className="flex items-center gap-1"
            >
              {t('changeStatus')}
              <ChevronDown className="h-3 w-3" />
            </Button>
            {statusOpen && (
              <div className="absolute end-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon
                  return (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-start',
                        invoice.status === key ? 'font-semibold bg-gray-50' : ''
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {locale === 'ar' ? cfg.label_ar : cfg.label_fr}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeletingOpen(true)}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600 px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-white font-bold text-xl">{invoice.store.name}</h1>
            {invoice.store.address && (
              <p className="text-emerald-100 text-sm mt-0.5">{invoice.store.address}</p>
            )}
            {invoice.store.phone && (
              <p className="text-emerald-100 text-sm">{invoice.store.phone}</p>
            )}
          </div>
          <div className="text-end">
            <p className="text-emerald-100 text-xs uppercase tracking-wide">
              {locale === 'ar' ? 'فاتورة' : 'FACTURE'}
            </p>
            <p className="text-white font-bold text-lg">{invoice.invoiceNumber}</p>
            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1', statusInfo.color)}>
              <StatusIcon className="h-3 w-3" />
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Meta row */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-gray-500 text-xs block">{t('invoiceDate')}</span>
            <span className="font-medium">{formatDate(invoice.createdAt, locale)}</span>
          </div>
          {invoice.customerName && (
            <div>
              <span className="text-gray-500 text-xs block">{t('customerName')}</span>
              <span className="font-medium">{invoice.customerName}</span>
            </div>
          )}
          {invoice.customerPhone && (
            <div>
              <span className="text-gray-500 text-xs block">{t('customerPhone')}</span>
              <span className="font-medium">{invoice.customerPhone}</span>
            </div>
          )}
        </div>

        {/* Items table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-start text-gray-600 font-medium">{t('description')}</th>
                <th className="px-4 py-3 text-center text-gray-600 font-medium">{t('quantity')}</th>
                <th className="px-4 py-3 text-end text-gray-600 font-medium">{t('unitPrice')}</th>
                <th className="px-6 py-3 text-end text-gray-600 font-medium">{t('totalPrice')}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={item.id} className={cn('border-b last:border-0', idx % 2 === 1 ? 'bg-gray-50/50' : '')}>
                  <td className="px-6 py-3">{item.description}</td>
                  <td className="px-4 py-3 text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-end">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-6 py-3 text-end font-medium">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{t('subtotal')}</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>{t('discount')}</span>
                  <span className="text-red-600">-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              {invoice.tax > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>{t('taxAmount')}</span>
                  <span>{formatCurrency(invoice.tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                <span>{t('totalAmount')}</span>
                <span className="text-emerald-600">{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 font-medium mb-1">{t('notes')}</p>
            <p className="text-sm text-gray-700">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Status history */}
      {invoice.statusHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm">{t('statusHistory')}</h2>
          <div className="space-y-2">
            {invoice.statusHistory.map((entry) => {
              const cfg = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.DRAFT
              const Icon = cfg.icon
              return (
                <div key={entry.id} className="flex items-center gap-3 text-sm">
                  <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs', cfg.color)}>
                    <Icon className="h-3 w-3" />
                    {locale === 'ar' ? cfg.label_ar : cfg.label_fr}
                  </span>
                  <span className="text-gray-400 text-xs">{formatDate(entry.createdAt, locale)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deletingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">{t('deleteInvoice')}</h3>
            <p className="text-gray-600 text-sm mb-6">{t('deleteConfirm')}</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeletingOpen(false)}>
                {tCommon('cancel')}
              </Button>
              <Button size="sm" onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                {tCommon('delete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Click-outside for status dropdown */}
      {statusOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
