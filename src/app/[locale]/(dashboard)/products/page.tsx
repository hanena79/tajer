'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import * as Dialog from '@radix-ui/react-dialog'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Upload,
  Tag,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

// ---------- Types ----------
interface Category {
  id: string
  name_ar: string
  name_fr: string
}

interface Product {
  id: string
  name_ar: string
  name_fr: string
  sku: string | null
  barcode: string | null
  purchasePrice: number
  salePrice: number
  quantity: number
  minQuantity: number
  image: string | null
  categoryId: string | null
  category: Category | null
}

interface ProductFormData {
  name_ar: string
  name_fr: string
  sku: string
  barcode: string
  purchasePrice: string
  salePrice: string
  quantity: string
  minQuantity: string
  image: string
  categoryId: string
}

const emptyForm: ProductFormData = {
  name_ar: '',
  name_fr: '',
  sku: '',
  barcode: '',
  purchasePrice: '',
  salePrice: '',
  quantity: '0',
  minQuantity: '5',
  image: '',
  categoryId: '',
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

// ---------- Category Dialog ----------
function CategoryDialog({
  open,
  onClose,
  categories,
  onSaved,
  locale,
}: {
  open: boolean
  onClose: () => void
  categories: Category[]
  onSaved: () => void
  locale: string
}) {
  const t = useTranslations('products')
  const tCommon = useTranslations('common')
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [form, setForm] = useState({ name_ar: '', name_fr: '' })
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function startEdit(cat: Category) {
    setEditingCat(cat)
    setForm({ name_ar: cat.name_ar, name_fr: cat.name_fr })
  }

  function startAdd() {
    setEditingCat(null)
    setForm({ name_ar: '', name_fr: '' })
  }

  async function handleSave() {
    if (!form.name_ar || !form.name_fr) return
    setLoading(true)
    try {
      const url = editingCat ? `/api/categories/${editingCat.id}` : '/api/categories'
      const method = editingCat ? 'PUT' : 'POST'
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setForm({ name_ar: '', name_fr: '' })
      setEditingCat(null)
      onSaved()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setLoading(true)
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      setDeleteId(null)
      onSaved()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 end-0 w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col focus:outline-none">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {t('manageCategories')}
            </Dialog.Title>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                {editingCat ? t('editCategory') : t('addCategory')}
              </h3>
              <input
                placeholder={t('nameAr')}
                value={form.name_ar}
                onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="rtl"
              />
              <input
                placeholder={t('nameFr')}
                value={form.name_fr}
                onChange={(e) => setForm((f) => ({ ...f, name_fr: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading || !form.name_ar || !form.name_fr}
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  {tCommon('save')}
                </button>
                {editingCat && (
                  <button
                    onClick={startAdd}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
                  >
                    {tCommon('cancel')}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 group"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {locale === 'ar' ? cat.name_ar : cat.name_fr}
                    </p>
                    <p className="text-xs text-gray-400">
                      {locale === 'ar' ? cat.name_fr : cat.name_ar}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {deleteId === cat.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 text-xs font-medium"
                        >
                          {tCommon('yes')}
                        </button>
                        <button
                          onClick={() => setDeleteId(null)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-xs"
                        >
                          {tCommon('no')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteId(cat.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">{tCommon('noData')}</p>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ---------- Product Form Dialog ----------
function ProductDialog({
  open,
  onClose,
  product,
  categories,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  product: Product | null
  categories: Category[]
  onSaved: (p: Product) => void
}) {
  const t = useTranslations('products')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [form, setForm] = useState<ProductFormData>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (product) {
      setForm({
        name_ar: product.name_ar,
        name_fr: product.name_fr,
        sku: product.sku ?? '',
        barcode: product.barcode ?? '',
        purchasePrice: String(product.purchasePrice),
        salePrice: String(product.salePrice),
        quantity: String(product.quantity),
        minQuantity: String(product.minQuantity),
        image: product.image ?? '',
        categoryId: product.categoryId ?? '',
      })
    } else {
      setForm(emptyForm)
    }
    setErrors({})
    setApiError('')
  }, [product, open])

  function validate() {
    const e: Partial<Record<keyof ProductFormData, string>> = {}
    if (!form.name_ar) e.name_ar = 'required'
    if (!form.name_fr) e.name_fr = 'required'
    if (!form.salePrice || isNaN(parseFloat(form.salePrice))) e.salePrice = 'required'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setLoading(true)
    setApiError('')
    try {
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        setApiError(data.error ?? 'Error')
        return
      }
      const data = await res.json()
      onSaved(data.product)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 end-0 w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col focus:outline-none">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {product ? t('editProduct') : t('addProduct')}
            </Dialog.Title>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            {apiError && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-600">
                {apiError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('nameAr')}</label>
                <input
                  value={form.name_ar}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name_ar: e.target.value }))
                    setErrors((errs) => ({ ...errs, name_ar: undefined }))
                  }}
                  dir="rtl"
                  className={cn(
                    'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
                    errors.name_ar ? 'border-red-400' : 'border-gray-200'
                  )}
                />
                {errors.name_ar && <p className="text-xs text-red-500 mt-0.5">required</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('nameFr')}</label>
                <input
                  value={form.name_fr}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name_fr: e.target.value }))
                    setErrors((errs) => ({ ...errs, name_fr: undefined }))
                  }}
                  dir="ltr"
                  className={cn(
                    'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
                    errors.name_fr ? 'border-red-400' : 'border-gray-200'
                  )}
                />
                {errors.name_fr && <p className="text-xs text-red-500 mt-0.5">required</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('sku')}</label>
                <input
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('barcode')}</label>
                <input
                  value={form.barcode}
                  onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('purchasePrice')}</label>
                <input
                  type="number"
                  value={form.purchasePrice}
                  onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('salePrice')}</label>
                <input
                  type="number"
                  value={form.salePrice}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, salePrice: e.target.value }))
                    setErrors((errs) => ({ ...errs, salePrice: undefined }))
                  }}
                  className={cn(
                    'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
                    errors.salePrice ? 'border-red-400' : 'border-gray-200'
                  )}
                  min="0"
                  step="0.01"
                />
                {errors.salePrice && <p className="text-xs text-red-500 mt-0.5">required</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('quantity')}</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('minQuantity')}</label>
                <input
                  type="number"
                  value={form.minQuantity}
                  onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('category')}</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{t('noCategory')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {locale === 'ar' ? cat.name_ar : cat.name_fr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('imageUrl')}</label>
              <input
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="https://..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {form.image && (
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </form>

          <div className="px-5 py-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
            >
              {tCommon('cancel')}
            </button>
            <button
              onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? tCommon('loading') : tCommon('save')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ---------- Import Excel Dialog ----------
function ImportDialog({
  open,
  onClose,
  onImported,
}: {
  open: boolean
  onClose: () => void
  onImported: (count: number) => void
}) {
  const t = useTranslations('products')
  const tCommon = useTranslations('common')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ count: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setFile(null)
    setPreview(null)
    setError(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleFileChange(f: File) {
    setFile(f)
    setError(false)
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', f)
      fd.append('previewOnly', 'true')
      const res = await fetch('/api/products/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(true)
        return
      }
      setPreview({ count: data.count })
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    if (!file) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/products/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(true)
        return
      }
      onImported(data.count)
      onClose()
      reset()
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose()
          reset()
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl z-50 shadow-2xl p-6 focus:outline-none">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {t('importExcel')}
            </Dialog.Title>
            <button
              onClick={() => {
                onClose()
                reset()
              }}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
          >
            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{file ? file.name : t('importExcel')}</p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />
          </div>

          {loading && (
            <p className="text-sm text-gray-400 text-center mt-3">{tCommon('loading')}</p>
          )}

          {preview && !loading && (
            <div className="mt-4 p-4 bg-emerald-50 rounded-xl">
              <p className="text-sm font-medium text-emerald-800">
                {t('productsToImport').replace('{count}', String(preview.count))}
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-500 mt-3">{t('importError')}</p>}

          <div className="flex justify-end gap-2 mt-5">
            <button
              onClick={() => {
                onClose()
                reset()
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
            >
              {tCommon('cancel')}
            </button>
            {preview && (
              <button
                onClick={handleImport}
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? tCommon('loading') : t('importConfirm')}
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ---------- Sort Icon ----------
function SortIcon({ field, sortBy, sortDir }: { field: string; sortBy: string; sortDir: string }) {
  if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 text-gray-400 inline ms-1" />
  return <span className="text-emerald-600 ms-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

// ---------- Main Page ----------
export default function ProductsPage() {
  const t = useTranslations('products')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState('name_ar')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const [productDialog, setProductDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [categoryDialog, setCategoryDialog] = useState(false)
  const [importDialog, setImportDialog] = useState(false)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const PAGE_SIZE = 20

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search,
        categoryId: categoryFilter,
        sortBy,
        sortDir,
        page: String(page),
        limit: String(PAGE_SIZE),
      })
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      setProducts(data.products ?? [])
      setTotal(data.total ?? 0)
      setCategories(data.categories ?? [])
    } catch {
      setToast({ message: t('errorLoading'), type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, sortBy, sortDir, page, t])

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300)
    return () => clearTimeout(timer)
  }, [fetchProducts])

  function handleSort(field: string) {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  function handleProductSaved(_p: Product) {
    setProductDialog(false)
    fetchProducts()
    setToast({ message: t('saveSuccess'), type: 'success' })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setDeleteTarget(null)
      fetchProducts()
      setToast({ message: t('deleteSuccess'), type: 'success' })
    } catch {
      setToast({ message: t('deleteError'), type: 'error' })
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const defaultSortField = locale === 'ar' ? 'name_ar' : 'name_fr'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCategoryDialog(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">{t('manageCategories')}</span>
          </button>
          <button
            onClick={() => setImportDialog(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">{t('importExcel')}</span>
          </button>
          <button
            onClick={() => {
              setEditingProduct(null)
              setProductDialog(true)
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            {t('addProduct')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder={t('searchPlaceholder')}
            className="w-full ps-9 pe-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            setPage(1)
          }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-32"
        >
          <option value="">{tCommon('all')}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {locale === 'ar' ? cat.name_ar : cat.name_fr}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 w-12"></th>
                <th
                  className="px-4 py-3 text-start text-gray-600 font-medium cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort(defaultSortField)}
                >
                  {t('name')}
                  <SortIcon field={defaultSortField} sortBy={sortBy} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-start text-gray-600 font-medium">{t('category')}</th>
                <th
                  className="px-4 py-3 text-start text-gray-600 font-medium cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('purchasePrice')}
                >
                  {t('purchasePrice')}
                  <SortIcon field="purchasePrice" sortBy={sortBy} sortDir={sortDir} />
                </th>
                <th
                  className="px-4 py-3 text-start text-gray-600 font-medium cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('salePrice')}
                >
                  {t('salePrice')}
                  <SortIcon field="salePrice" sortBy={sortBy} sortDir={sortDir} />
                </th>
                <th
                  className="px-4 py-3 text-start text-gray-600 font-medium cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort('quantity')}
                >
                  {t('stock')}
                  <SortIcon field="quantity" sortBy={sortBy} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-start text-gray-600 font-medium">{t('barcode')}</th>
                <th className="px-4 py-3 text-start text-gray-600 font-medium">{tCommon('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                    {tCommon('loading')}
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                    {t('noProducts')}
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isLow =
                    product.quantity > 0 && product.quantity <= product.minQuantity
                  const isOut = product.quantity <= 0
                  return (
                    <tr
                      key={product.id}
                      className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
                            📦
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {locale === 'ar' ? product.name_ar : product.name_fr}
                        </p>
                        <p className="text-xs text-gray-400">
                          {locale === 'ar' ? product.name_fr : product.name_ar}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {product.category ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                            {locale === 'ar'
                              ? product.category.name_ar
                              : product.category.name_fr}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatCurrency(product.purchasePrice)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatCurrency(product.salePrice)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'font-medium',
                              isOut
                                ? 'text-red-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-gray-900'
                            )}
                          >
                            {product.quantity}
                          </span>
                          {(isLow || isOut) && (
                            <AlertTriangle
                              className={cn(
                                'w-3.5 h-3.5',
                                isOut ? 'text-red-500' : 'text-amber-500'
                              )}
                            />
                          )}
                        </div>
                        {isOut && (
                          <span className="text-xs text-red-500">{t('outOfStock')}</span>
                        )}
                        {isLow && !isOut && (
                          <span className="text-xs text-amber-500">{t('lowStockWarning')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                        {product.barcode ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingProduct(product)
                              setProductDialog(true)
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-emerald-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(product)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {tCommon('page')} {page} {tCommon('of')} {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ProductDialog
        open={productDialog}
        onClose={() => setProductDialog(false)}
        product={editingProduct}
        categories={categories}
        onSaved={handleProductSaved}
      />

      <CategoryDialog
        open={categoryDialog}
        onClose={() => setCategoryDialog(false)}
        categories={categories}
        onSaved={() => {
          fetchProducts()
          setCategoryDialog(false)
        }}
        locale={locale}
      />

      <ImportDialog
        open={importDialog}
        onClose={() => setImportDialog(false)}
        onImported={(count) => {
          fetchProducts()
          setToast({
            message: t('importSuccess').replace('{count}', String(count)),
            type: 'success',
          })
        }}
      />

      {/* Delete Confirm */}
      <Dialog.Root
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl z-50 shadow-2xl p-6 focus:outline-none">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              {t('deleteProduct')}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-500 mb-5">
              {t('deleteConfirm')}
            </Dialog.Description>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
              >
                {tCommon('cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
              >
                {tCommon('delete')}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
