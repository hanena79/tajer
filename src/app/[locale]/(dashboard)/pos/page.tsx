'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Wifi,
  WifiOff,
  Package,
  CheckCircle,
  Download,
  Printer,
  RefreshCw,
  X,
  Tag,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { useOffline } from '@/hooks/useOffline'

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = {
  id: string
  name_ar: string
  name_fr: string
}

type Product = {
  id: string
  name_ar: string
  name_fr: string
  barcode: string | null
  salePrice: number
  quantity: number
  image: string | null
  category: Category | null
}

type CartItem = {
  product: Product
  quantity: number
}

type DiscountType = 'percentage' | 'fixed'
type PaymentMethod = 'CASH' | 'MOBILE'

type OfflineSale = {
  offlineId: string
  items: { productId: string; name_ar: string; name_fr: string; quantity: number; unitPrice: number }[]
  discount: number
  discountType: DiscountType
  paymentMethod: PaymentMethod
  taxRate: number
  createdAt: string
}

type ReceiptData = {
  saleId: string
  invoiceNumber: string
  totalAmount: number
  discount: number
  tax: number
  paymentMethod: PaymentMethod
  items: CartItem[]
  store: { name: string; address: string | null; phone: string | null; currency: string } | null
  createdAt: Date
}

// ─── Offline Storage Helpers ──────────────────────────────────────────────────

const OFFLINE_KEY = 'tajer_offline_sales'

function getOfflineSales(): OfflineSale[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveOfflineSale(sale: OfflineSale) {
  const existing = getOfflineSales()
  localStorage.setItem(OFFLINE_KEY, JSON.stringify([...existing, sale]))
}

function clearOfflineSales() {
  localStorage.setItem(OFFLINE_KEY, JSON.stringify([]))
}

// ─── PDF Receipt Generator ────────────────────────────────────────────────────

async function generateReceiptPDF(receipt: ReceiptData, locale: string) {
  const { default: jsPDF } = await import('jspdf')
  const isAr = locale === 'ar'
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 200] })

  const pageW = 80
  let y = 10

  const centerText = (text: string, yPos: number, size = 10) => {
    doc.setFontSize(size)
    const w = doc.getTextWidth(text)
    doc.text(text, (pageW - w) / 2, yPos)
  }

  const leftText = (text: string, yPos: number, size = 8) => {
    doc.setFontSize(size)
    doc.text(text, 5, yPos)
  }

  const rightText = (text: string, yPos: number, size = 8) => {
    doc.setFontSize(size)
    const w = doc.getTextWidth(text)
    doc.text(text, pageW - 5 - w, yPos)
  }

  const line = (yPos: number) => {
    doc.setLineWidth(0.3)
    doc.line(5, yPos, pageW - 5, yPos)
  }

  // Header
  centerText(receipt.store?.name ?? 'Tajer', y, 14)
  y += 5
  if (receipt.store?.address) {
    centerText(receipt.store.address, y, 7)
    y += 4
  }
  if (receipt.store?.phone) {
    centerText(receipt.store.phone, y, 7)
    y += 4
  }

  line(y)
  y += 4

  // Receipt info
  const dateStr = receipt.createdAt.toLocaleDateString(isAr ? 'ar-MR' : 'fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  leftText(isAr ? `رقم: ${receipt.invoiceNumber}` : `N°: ${receipt.invoiceNumber}`, y)
  y += 4
  leftText(isAr ? `التاريخ: ${dateStr}` : `Date: ${dateStr}`, y)
  y += 4
  leftText(
    isAr
      ? `الدفع: ${receipt.paymentMethod === 'CASH' ? 'نقدًا' : 'إلكترونيًا'}`
      : `Paiement: ${receipt.paymentMethod === 'CASH' ? 'Espèces' : 'Mobile'}`,
    y
  )
  y += 4

  line(y)
  y += 4

  // Items header
  leftText(isAr ? 'المنتج' : 'Produit', y, 8)
  rightText(isAr ? 'المجموع' : 'Total', y, 8)
  y += 4
  line(y)
  y += 4

  // Items
  for (const item of receipt.items) {
    const name = isAr ? item.product.name_ar : item.product.name_fr
    const itemTotal = item.product.salePrice * item.quantity
    leftText(name.length > 20 ? name.substring(0, 20) + '…' : name, y, 8)
    rightText(formatCurrency(itemTotal, receipt.store?.currency ?? 'MRU'), y, 8)
    y += 4
    leftText(
      `  ${item.quantity} × ${formatCurrency(item.product.salePrice, receipt.store?.currency ?? 'MRU')}`,
      y,
      7
    )
    y += 4
  }

  line(y)
  y += 4

  // Totals
  const subtotal = receipt.items.reduce(
    (sum, i) => sum + i.product.salePrice * i.quantity,
    0
  )
  leftText(isAr ? 'المجموع الفرعي' : 'Sous-total', y)
  rightText(formatCurrency(subtotal, receipt.store?.currency ?? 'MRU'), y)
  y += 4

  if (receipt.discount > 0) {
    leftText(isAr ? 'الخصم' : 'Remise', y)
    rightText(`-${formatCurrency(receipt.discount, receipt.store?.currency ?? 'MRU')}`, y)
    y += 4
  }

  if (receipt.tax > 0) {
    leftText(isAr ? 'الضريبة' : 'Taxe', y)
    rightText(formatCurrency(receipt.tax, receipt.store?.currency ?? 'MRU'), y)
    y += 4
  }

  line(y)
  y += 4

  doc.setFont('helvetica', 'bold')
  leftText(isAr ? 'المجموع النهائي' : 'Total', y, 10)
  rightText(formatCurrency(receipt.totalAmount, receipt.store?.currency ?? 'MRU'), y, 10)
  doc.setFont('helvetica', 'normal')
  y += 8

  centerText(isAr ? 'شكرًا لتسوّقكم معنا' : 'Merci pour votre achat', y, 9)
  y += 6

  line(y)

  doc.save(`receipt-${receipt.invoiceNumber}.pdf`)
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function POSPage() {
  const t = useTranslations('pos')
  const locale = useLocale()
  const isRTL = locale === 'ar'
  const isOffline = useOffline()

  // Products & categories
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadError, setLoadError] = useState(false)

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<DiscountType>('percentage')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [taxRate] = useState(0) // loaded from store settings in real usage

  // Checkout state
  const [processing, setProcessing] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)

  // Offline
  const [offlineSales, setOfflineSales] = useState<OfflineSale[]>([])
  const [syncing, setSyncing] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // ── Load products ─────────────────────────────────────────────────────────

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true)
    setLoadError(false)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (selectedCategory) params.set('categoryId', selectedCategory)
      const res = await fetch(`/api/products?${params}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setProducts(data.products)
      setCategories(data.categories)
    } catch {
      setLoadError(true)
    } finally {
      setLoadingProducts(false)
    }
  }, [search, selectedCategory])

  useEffect(() => {
    if (!isOffline) {
      loadProducts()
    }
  }, [loadProducts, isOffline])

  // Load offline sales count
  useEffect(() => {
    setOfflineSales(getOfflineSales())
  }, [])

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOffline && offlineSales.length > 0) {
      handleSync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline])

  // ── Cart helpers ──────────────────────────────────────────────────────────

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) return
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        const maxQty = product.quantity
        if (existing.quantity >= maxQty) return prev
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const changeQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
        )
        .filter((i) => i.quantity > 0)
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setDiscount(0)
    setDiscountType('percentage')
    setPaymentMethod('CASH')
    setReceipt(null)
  }

  // ── Totals ────────────────────────────────────────────────────────────────

  const subtotal = cart.reduce((sum, i) => sum + i.product.salePrice * i.quantity, 0)
  const discountAmount =
    discountType === 'percentage'
      ? subtotal * (Math.min(discount, 100) / 100)
      : Math.min(discount, subtotal)
  const afterDiscount = subtotal - discountAmount
  const taxAmount = afterDiscount * (taxRate / 100)
  const totalAmount = afterDiscount + taxAmount

  // ── Checkout ──────────────────────────────────────────────────────────────

  const handleCheckout = async () => {
    if (cart.length === 0 || processing) return
    setProcessing(true)

    const payload = {
      items: cart.map((i) => ({
        productId: i.product.id,
        name_ar: i.product.name_ar,
        name_fr: i.product.name_fr,
        quantity: i.quantity,
        unitPrice: i.product.salePrice,
      })),
      discount,
      discountType,
      paymentMethod,
      taxRate,
    }

    if (isOffline) {
      // Save to localStorage
      const offlineSale: OfflineSale = {
        offlineId: `offline-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      }
      saveOfflineSale(offlineSale)
      const updated = getOfflineSales()
      setOfflineSales(updated)

      // Show a local receipt
      setReceipt({
        saleId: offlineSale.offlineId,
        invoiceNumber: offlineSale.offlineId,
        totalAmount,
        discount: discountAmount,
        tax: taxAmount,
        paymentMethod,
        items: [...cart],
        store: null,
        createdAt: new Date(),
      })
      setProcessing(false)
      return
    }

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error ?? t('saleError'))
        setProcessing(false)
        return
      }

      const data = await res.json()
      setReceipt({
        saleId: data.saleId,
        invoiceNumber: data.invoiceNumber,
        totalAmount: data.totalAmount,
        discount: discountAmount,
        tax: taxAmount,
        paymentMethod,
        items: [...cart],
        store: data.store,
        createdAt: new Date(),
      })
      // Reload products to update quantities
      loadProducts()
    } catch {
      alert(t('saleError'))
    } finally {
      setProcessing(false)
    }
  }

  // ── Sync offline sales ────────────────────────────────────────────────────

  const handleSync = async () => {
    const pending = getOfflineSales()
    if (pending.length === 0 || syncing) return
    setSyncing(true)
    try {
      const res = await fetch('/api/sales/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sales: pending }),
      })
      if (res.ok) {
        clearOfflineSales()
        setOfflineSales([])
        loadProducts()
      }
    } finally {
      setSyncing(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const productName = (p: Product) => (locale === 'ar' ? p.name_ar : p.name_fr)
  const categoryName = (c: Category) => (locale === 'ar' ? c.name_ar : c.name_fr)

  // ── Receipt Modal ─────────────────────────────────────────────────────────

  if (receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{t('saleSuccess')}</h2>
            <p className="text-gray-500 text-sm mt-1">{receipt.invoiceNumber}</p>
          </div>

          {/* Receipt summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
            {receipt.items.map((item) => (
              <div key={item.product.id} className="flex justify-between">
                <span className="text-gray-700">
                  {productName(item.product)} × {item.quantity}
                </span>
                <span className="font-medium">
                  {formatCurrency(item.product.salePrice * item.quantity)}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 space-y-1">
              {receipt.discount > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>{t('discount')}</span>
                  <span>-{formatCurrency(receipt.discount)}</span>
                </div>
              )}
              {receipt.tax > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>{t('tax')}</span>
                  <span>{formatCurrency(receipt.tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1">
                <span>{t('total')}</span>
                <span className="text-emerald-600">{formatCurrency(receipt.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => generateReceiptPDF(receipt, locale)}
              className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              {t('downloadReceipt')}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              {t('printReceipt')}
            </button>
          </div>

          <button
            onClick={clearCart}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            {t('newSale')}
          </button>
        </div>
      </div>
    )
  }

  // ── POS Layout ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 lg:-m-6 overflow-hidden">
      {/* Offline banner */}
      {(isOffline || offlineSales.length > 0) && (
        <div
          className={cn(
            'flex items-center justify-between px-4 py-2 text-sm font-medium',
            isOffline ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-900'
          )}
        >
          <div className="flex items-center gap-2">
            {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            <span>
              {isOffline
                ? t('offlineBadge', { count: offlineSales.length })
                : t('pendingSales', { count: offlineSales.length })}
            </span>
          </div>
          {!isOffline && offlineSales.length > 0 && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 bg-white/30 rounded-lg px-3 py-1 hover:bg-white/50 transition-colors"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} />
              {t('syncButton')}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left/Right panel: Products ──────────────────────────────────────── */}
        <div
          className={cn(
            'flex flex-col bg-gray-50 border-e border-gray-200',
            'w-full lg:w-[60%] xl:w-[65%]',
            cart.length > 0 ? 'hidden lg:flex' : 'flex'
          )}
        >
          {/* Search + filter bar */}
          <div className="p-3 bg-white border-b border-gray-200 space-y-2.5">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full ps-9 pe-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('')}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  selectedCategory === ''
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {t('allCategories')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
                  className={cn(
                    'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {categoryName(cat)}
                </button>
              ))}
            </div>
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {loadingProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl h-28 animate-pulse border border-gray-100" />
                ))}
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <Package className="w-12 h-12 text-gray-200" />
                <p className="text-sm">{t('loadError')}</p>
                <button
                  onClick={loadProducts}
                  className="text-emerald-600 text-sm font-medium hover:underline"
                >
                  {t('retryButton')}
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <Package className="w-12 h-12 text-gray-200" />
                <p className="text-sm">{t('noProducts')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {products.map((product) => {
                  const inCart = cart.find((i) => i.product.id === product.id)
                  const outOfStock = product.quantity <= 0
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={outOfStock}
                      className={cn(
                        'relative bg-white rounded-xl border p-3 text-start transition-all duration-150 flex flex-col gap-1.5',
                        outOfStock
                          ? 'opacity-50 cursor-not-allowed border-gray-100'
                          : inCart
                          ? 'border-emerald-400 ring-1 ring-emerald-300 shadow-sm hover:shadow-md'
                          : 'border-gray-100 hover:border-emerald-300 hover:shadow-md active:scale-[0.98]'
                      )}
                    >
                      {/* Category badge */}
                      {product.category && (
                        <span className="text-[10px] text-gray-400 truncate flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" />
                          {categoryName(product.category)}
                        </span>
                      )}

                      {/* Product icon placeholder */}
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto">
                        <Package className="w-5 h-5 text-emerald-400" />
                      </div>

                      <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2 text-center">
                        {productName(product)}
                      </p>
                      <p className="text-sm font-bold text-emerald-600 text-center">
                        {formatCurrency(product.salePrice)}
                      </p>
                      <p
                        className={cn(
                          'text-[10px] text-center',
                          product.quantity <= 5 ? 'text-amber-500' : 'text-gray-400'
                        )}
                      >
                        {outOfStock ? t('outOfStock') : `${product.quantity} ${t('unit')}`}
                      </p>

                      {/* Cart quantity badge */}
                      {inCart && (
                        <span className="absolute top-1.5 end-1.5 w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {inCart.quantity}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right/Left panel: Cart ───────────────────────────────────────────── */}
        <div
          className={cn(
            'flex flex-col bg-white',
            'w-full lg:w-[40%] xl:w-[35%]',
            cart.length > 0 ? 'flex' : 'hidden lg:flex'
          )}
        >
          {/* Cart header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-gray-800">{t('cart')}</h2>
              {cart.length > 0 && (
                <span className="w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <div className="flex items-center gap-2">
                {/* Back to products on mobile */}
                <button
                  onClick={() => setCart([])}
                  className="lg:hidden text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  {t('clearCartMobile')}
                </button>
                <button
                  onClick={clearCart}
                  className="hidden lg:flex text-xs text-red-500 hover:text-red-700 items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('clearCart')}
                </button>
              </div>
            )}
          </div>

          {/* Mobile: back button when cart is empty */}
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
              <ShoppingCart className="w-16 h-16 text-gray-100" />
              <p className="font-medium text-gray-500">{t('emptyCart')}</p>
              <p className="text-sm text-gray-400">{t('emptyCartHint')}</p>
            </div>
          ) : (
            <>
              {/* Cart items */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5 border border-gray-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {productName(item.product)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatCurrency(item.product.salePrice)} / {t('unit')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => changeQty(item.product.id, -1)}
                        className="w-6 h-6 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => changeQty(item.product.id, 1)}
                        disabled={item.quantity >= item.product.quantity}
                        className="w-6 h-6 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 flex items-center justify-center transition-colors disabled:opacity-40"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-xs font-bold text-gray-800 w-14 text-end flex-shrink-0">
                      {formatCurrency(item.product.salePrice * item.quantity)}
                    </p>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Discount + payment + totals */}
              <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                {/* Discount row */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14 flex-shrink-0">{t('discount')}</span>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 flex-shrink-0"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">MRU</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    max={discountType === 'percentage' ? 100 : subtotal}
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-end"
                  />
                </div>

                {/* Totals */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>{t('subtotal')}</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>{t('discount')}</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>{t('tax')}</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-1 border-t">
                    <span>{t('total')}</span>
                    <span className="text-emerald-600">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {/* Payment method */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('CASH')}
                    className={cn(
                      'py-2 rounded-xl text-sm font-medium border transition-colors',
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'
                    )}
                  >
                    {t('cash')}
                  </button>
                  <button
                    onClick={() => setPaymentMethod('MOBILE')}
                    className={cn(
                      'py-2 rounded-xl text-sm font-medium border transition-colors',
                      paymentMethod === 'MOBILE'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'
                    )}
                  >
                    {t('mobile')}
                  </button>
                </div>

                {/* Checkout button */}
                <button
                  onClick={handleCheckout}
                  disabled={processing || cart.length === 0}
                  className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-base hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {t('processing')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {isOffline
                        ? t('savingOffline')
                        : t('completeOrder')}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile floating cart button */}
      {cart.length > 0 && (
        <button
          onClick={() => {
            // scroll cart into view on mobile — handled by CSS show/hide
          }}
          className="lg:hidden fixed bottom-6 end-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center z-30"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-1 -end-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {cart.reduce((s, i) => s + i.quantity, 0)}
          </span>
        </button>
      )}
    </div>
  )
}
