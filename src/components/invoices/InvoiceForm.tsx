'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Plus, Trash2, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name_ar: string
  name_fr: string
  salePrice: number
}

interface InvoiceItemRow {
  id: string
  description: string
  quantity: number
  unitPrice: number
  productId?: string
}

interface InvoiceFormProps {
  initialData?: {
    id?: string
    customerName?: string
    customerPhone?: string
    notes?: string
    discount?: number
    taxRate?: number
    items?: InvoiceItemRow[]
  }
  onSuccess: (invoiceId: string) => void
  onCancel: () => void
}

function uid() {
  return Math.random().toString(36).slice(2)
}

export function InvoiceForm({ initialData, onSuccess, onCancel }: InvoiceFormProps) {
  const t = useTranslations('invoices')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  const [customerName, setCustomerName] = useState(initialData?.customerName ?? '')
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone ?? '')
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [discount, setDiscount] = useState(String(initialData?.discount ?? 0))
  const [taxRate, setTaxRate] = useState(String(initialData?.taxRate ?? 0))
  const [items, setItems] = useState<InvoiceItemRow[]>(
    initialData?.items ?? [{ id: uid(), description: '', quantity: 1, unitPrice: 0 }]
  )
  const [products, setProducts] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/products?limit=200')
      .then((r) => r.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(() => {})
  }, [])

  const addItem = () => {
    setItems((prev) => [...prev, { id: uid(), description: '', quantity: 1, unitPrice: 0 }])
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const updateItem = (id: string, field: keyof InvoiceItemRow, value: string | number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    )
  }

  const selectProduct = (rowId: string, productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    setItems((prev) =>
      prev.map((i) =>
        i.id === rowId
          ? {
              ...i,
              productId,
              description: locale === 'ar' ? product.name_ar : product.name_fr,
              unitPrice: product.salePrice,
            }
          : i
      )
    )
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const discountAmt = Math.min(parseFloat(discount) || 0, subtotal)
  const afterDiscount = subtotal - discountAmt
  const taxAmt = afterDiscount * ((parseFloat(taxRate) || 0) / 100)
  const total = afterDiscount + taxAmt

  const buildPayload = useCallback(
    (status: string) => ({
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      notes: notes || undefined,
      discount: parseFloat(discount) || 0,
      taxRate: parseFloat(taxRate) || 0,
      status,
      items: items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        productId: i.productId,
      })),
    }),
    [customerName, customerPhone, notes, discount, taxRate, items]
  )

  async function submit(status: 'DRAFT' | 'SENT') {
    if (items.some((i) => !i.description.trim())) {
      setError(t('atLeastOneItem'))
      return
    }
    if (items.length === 0) {
      setError(t('atLeastOneItem'))
      return
    }
    setError('')
    setSaving(true)
    try {
      const isEdit = Boolean(initialData?.id)
      const url = isEdit ? `/api/invoices/${initialData!.id}` : '/api/invoices'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(status)),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? t('saveError'))
        return
      }
      onSuccess(data.invoice.id)
    } catch {
      setError(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Customer info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('customerName')}</label>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder={t('customerName')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('customerPhone')}</label>
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="+222 XXXXXXXX"
            dir="ltr"
          />
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-800">{t('items')}</h3>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('addItem')}
          </button>
        </div>

        <div className="space-y-2">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium px-1">
            <div className="col-span-5">{t('description')}</div>
            <div className="col-span-2 text-center">{t('quantity')}</div>
            <div className="col-span-3 text-center">{t('unitPrice')}</div>
            <div className="col-span-1 text-end">{t('totalPrice')}</div>
            <div className="col-span-1" />
          </div>

          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2">
              {/* Product selector + description */}
              <div className="col-span-12 sm:col-span-5 flex flex-col gap-1">
                <div className="relative">
                  <select
                    value={item.productId ?? ''}
                    onChange={(e) => {
                      if (e.target.value) selectProduct(item.id, e.target.value)
                      else updateItem(item.id, 'productId', '')
                    }}
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none pe-6"
                  >
                    <option value="">{t('selectProduct')}</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {locale === 'ar' ? p.name_ar : p.name_fr} — {p.salePrice} MRU
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute end-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
                <input
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder={t('description')}
                  required
                />
              </div>

              {/* Quantity */}
              <div className="col-span-4 sm:col-span-2">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                  className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm text-center bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Unit price */}
              <div className="col-span-4 sm:col-span-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm text-center bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Row total */}
              <div className="col-span-3 sm:col-span-1 text-sm font-medium text-end text-gray-700">
                {(item.quantity * item.unitPrice).toLocaleString()}
              </div>

              {/* Remove */}
              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-red-400 hover:text-red-600 p-1 rounded"
                  disabled={items.length === 1}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals + discount/tax */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Left: discount & tax */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('discount')} (MRU)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('tax')}</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Right: totals summary */}
        <div className="sm:w-64 bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>{t('subtotal')}</span>
            <span>{subtotal.toLocaleString()} MRU</span>
          </div>
          {discountAmt > 0 && (
            <div className="flex justify-between text-red-600">
              <span>{t('discount')}</span>
              <span>- {discountAmt.toLocaleString()} MRU</span>
            </div>
          )}
          {taxAmt > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>{t('taxAmount')}</span>
              <span>{taxAmt.toLocaleString()} MRU</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base text-gray-900 border-t pt-2">
            <span>{t('totalAmount')}</span>
            <span>{total.toLocaleString()} MRU</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('notes')}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          placeholder={t('notesPlaceholder')}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end flex-wrap">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          {tCommon('cancel')}
        </Button>
        <Button
          variant="outline"
          onClick={() => submit('DRAFT')}
          disabled={saving}
          className={cn('border-gray-300')}
        >
          {t('saveAsDraft')}
        </Button>
        <Button onClick={() => submit('SENT')} disabled={saving}>
          {saving ? tCommon('loading') : t('sendInvoice')}
        </Button>
      </div>
    </div>
  )
}
