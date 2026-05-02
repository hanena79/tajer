import { jsPDF } from 'jspdf'

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface InvoiceData {
  invoiceNumber: string
  createdAt: string | Date
  status: string
  customerName?: string | null
  customerPhone?: string | null
  notes?: string | null
  subtotal: number
  discount: number
  tax: number
  totalAmount: number
  items: InvoiceItem[]
  store: {
    name: string
    address?: string | null
    phone?: string | null
    logo?: string | null
    currency?: string
  }
}

function formatAmount(amount: number, currency = 'MRU'): string {
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`
}

function formatDateStr(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function generateInvoicePDF(invoice: InvoiceData, locale = 'ar'): jsPDF {
  const isRTL = locale === 'ar'
  const currency = invoice.store.currency ?? 'MRU'

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentW = pageW - margin * 2

  // Color palette
  const primaryColor: [number, number, number] = [5, 150, 105] // emerald-600
  const lightGray: [number, number, number] = [248, 250, 252]
  const darkText: [number, number, number] = [15, 23, 42]
  const mutedText: [number, number, number] = [100, 116, 139]
  const borderColor: [number, number, number] = [226, 232, 240]

  let y = margin

  // ── Header background ──────────────────────────────────────────────────────
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageW, 45, 'F')

  // Store name (top-left or top-right for RTL)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  const storeName = invoice.store.name || 'Tajer'
  if (isRTL) {
    doc.text(storeName, pageW - margin, y + 8, { align: 'right' })
  } else {
    doc.text(storeName, margin, y + 8)
  }

  // "INVOICE / فاتورة" label
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const invoiceLabel = isRTL ? 'فاتورة' : 'FACTURE'
  if (isRTL) {
    doc.text(invoiceLabel, margin, y + 8, { align: 'left' })
  } else {
    doc.text(invoiceLabel, pageW - margin, y + 8, { align: 'right' })
  }

  // Store address + phone
  doc.setFontSize(9)
  doc.setTextColor(220, 252, 231)
  if (invoice.store.address) {
    if (isRTL) {
      doc.text(invoice.store.address, pageW - margin, y + 16, { align: 'right' })
    } else {
      doc.text(invoice.store.address, margin, y + 16)
    }
  }
  if (invoice.store.phone) {
    if (isRTL) {
      doc.text(invoice.store.phone, pageW - margin, y + 22, { align: 'right' })
    } else {
      doc.text(invoice.store.phone, margin, y + 22)
    }
  }

  y = 55

  // ── Invoice meta block ─────────────────────────────────────────────────────
  doc.setTextColor(...darkText)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)

  const numberLabel = isRTL ? 'رقم الفاتورة:' : 'N° Facture :'
  const dateLabel = isRTL ? 'تاريخ الإصدار:' : 'Date d\'émission :'
  const statusLabel = isRTL ? 'الحالة:' : 'Statut :'

  const statusMap: Record<string, { ar: string; fr: string }> = {
    DRAFT: { ar: 'مسودة', fr: 'Brouillon' },
    SENT: { ar: 'مُرسلة', fr: 'Envoyée' },
    PAID: { ar: 'مدفوعة', fr: 'Payée' },
    OVERDUE: { ar: 'متأخرة', fr: 'En retard' },
    CANCELLED: { ar: 'ملغاة', fr: 'Annulée' },
  }
  const statusText =
    statusMap[invoice.status]?.[isRTL ? 'ar' : 'fr'] ?? invoice.status

  if (isRTL) {
    doc.text(numberLabel, pageW - margin, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.text(invoice.invoiceNumber, pageW - margin - 38, y, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.text(dateLabel, pageW - margin, y + 7, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.text(formatDateStr(invoice.createdAt), pageW - margin - 38, y + 7, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.text(statusLabel, pageW - margin, y + 14, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.text(statusText, pageW - margin - 38, y + 14, { align: 'right' })
  } else {
    doc.text(numberLabel, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(invoice.invoiceNumber, margin + 38, y)
    doc.setFont('helvetica', 'bold')
    doc.text(dateLabel, margin, y + 7)
    doc.setFont('helvetica', 'normal')
    doc.text(formatDateStr(invoice.createdAt), margin + 38, y + 7)
    doc.setFont('helvetica', 'bold')
    doc.text(statusLabel, margin, y + 14)
    doc.setFont('helvetica', 'normal')
    doc.text(statusText, margin + 38, y + 14)
  }

  y += 25

  // ── Customer info ──────────────────────────────────────────────────────────
  if (invoice.customerName || invoice.customerPhone) {
    doc.setFillColor(...lightGray)
    doc.roundedRect(margin, y, contentW, 20, 2, 2, 'F')
    doc.setDrawColor(...borderColor)
    doc.roundedRect(margin, y, contentW, 20, 2, 2, 'S')

    const toLabel = isRTL ? 'فاتورة إلى:' : 'Facture à :'
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...mutedText)
    if (isRTL) {
      doc.text(toLabel, pageW - margin - 3, y + 6, { align: 'right' })
    } else {
      doc.text(toLabel, margin + 3, y + 6)
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...darkText)
    const customerInfo = [invoice.customerName, invoice.customerPhone]
      .filter(Boolean)
      .join(' | ')
    if (isRTL) {
      doc.text(customerInfo, pageW - margin - 3, y + 14, { align: 'right' })
    } else {
      doc.text(customerInfo, margin + 3, y + 14)
    }

    y += 26
  }

  y += 4

  // ── Items table ────────────────────────────────────────────────────────────
  const colDescW = contentW * 0.45
  const colQtyW = contentW * 0.12
  const colUnitW = contentW * 0.2
  const colTotalW = contentW * 0.23

  // Table header
  doc.setFillColor(...primaryColor)
  doc.rect(margin, y, contentW, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)

  if (isRTL) {
    const headers = [
      { label: 'الإجمالي', x: pageW - margin - 2, align: 'right' as const },
      { label: 'سعر الوحدة', x: pageW - margin - colTotalW - 2, align: 'right' as const },
      { label: 'الكمية', x: pageW - margin - colTotalW - colUnitW - 2, align: 'right' as const },
      { label: 'الوصف', x: margin + 2, align: 'left' as const },
    ]
    headers.forEach((h) => doc.text(h.label, h.x, y + 5.5, { align: h.align }))
  } else {
    const headers = [
      { label: 'Description', x: margin + 2, align: 'left' as const },
      { label: 'Qté', x: margin + colDescW + colQtyW / 2, align: 'center' as const },
      { label: 'Prix unit.', x: margin + colDescW + colQtyW + colUnitW / 2, align: 'center' as const },
      { label: 'Total', x: pageW - margin - 2, align: 'right' as const },
    ]
    headers.forEach((h) => doc.text(h.label, h.x, y + 5.5, { align: h.align }))
  }

  y += 8

  // Table rows
  invoice.items.forEach((item, idx) => {
    const rowH = 9
    if (idx % 2 === 0) {
      doc.setFillColor(255, 255, 255)
    } else {
      doc.setFillColor(...lightGray)
    }
    doc.rect(margin, y, contentW, rowH, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...darkText)

    if (isRTL) {
      doc.text(formatAmount(item.totalPrice, currency), pageW - margin - 2, y + 6, { align: 'right' })
      doc.text(formatAmount(item.unitPrice, currency), pageW - margin - colTotalW - 2, y + 6, { align: 'right' })
      doc.text(String(item.quantity), pageW - margin - colTotalW - colUnitW - 2, y + 6, { align: 'right' })
      // Truncate description if too long
      const maxDescW = contentW - colTotalW - colUnitW - colQtyW - 4
      const desc = doc.splitTextToSize(item.description, maxDescW)[0] ?? item.description
      doc.text(desc, margin + 2, y + 6, { align: 'left' })
    } else {
      doc.text(item.description.length > 40 ? item.description.slice(0, 40) + '…' : item.description, margin + 2, y + 6)
      doc.text(String(item.quantity), margin + colDescW + colQtyW / 2, y + 6, { align: 'center' })
      doc.text(formatAmount(item.unitPrice, currency), margin + colDescW + colQtyW + colUnitW / 2, y + 6, { align: 'center' })
      doc.text(formatAmount(item.totalPrice, currency), pageW - margin - 2, y + 6, { align: 'right' })
    }

    y += rowH
  })

  // Bottom border for table
  doc.setDrawColor(...borderColor)
  doc.line(margin, y, pageW - margin, y)

  y += 6

  // ── Totals block ───────────────────────────────────────────────────────────
  const totalsX = isRTL ? margin : pageW - margin - 70
  const totalsW = 70

  const totalRows = [
    { label: isRTL ? 'المجموع الفرعي' : 'Sous-total', value: invoice.subtotal },
    ...(invoice.discount > 0
      ? [{ label: isRTL ? 'الخصم' : 'Remise', value: -invoice.discount }]
      : []),
    ...(invoice.tax > 0
      ? [{ label: isRTL ? 'الضريبة' : 'Taxe', value: invoice.tax }]
      : []),
  ]

  doc.setFontSize(9)
  totalRows.forEach((row) => {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...mutedText)
    if (isRTL) {
      doc.text(row.label, pageW - margin - 2, y + 5, { align: 'right' })
      const val = (row.value < 0 ? '-' : '') + formatAmount(Math.abs(row.value), currency)
      doc.text(val, margin + 2, y + 5, { align: 'left' })
    } else {
      doc.text(row.label, totalsX + 2, y + 5)
      const val = (row.value < 0 ? '-' : '') + formatAmount(Math.abs(row.value), currency)
      doc.text(val, totalsX + totalsW - 2, y + 5, { align: 'right' })
    }
    y += 7
  })

  // Total row with background
  doc.setFillColor(...primaryColor)
  if (isRTL) {
    doc.rect(margin, y, contentW, 10, 'F')
  } else {
    doc.rect(totalsX, y, totalsW, 10, 'F')
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  const totalLabel = isRTL ? 'المجموع النهائي' : 'Total TTC'
  if (isRTL) {
    doc.text(totalLabel, pageW - margin - 2, y + 7, { align: 'right' })
    doc.text(formatAmount(invoice.totalAmount, currency), margin + 2, y + 7, { align: 'left' })
  } else {
    doc.text(totalLabel, totalsX + 2, y + 7)
    doc.text(formatAmount(invoice.totalAmount, currency), totalsX + totalsW - 2, y + 7, { align: 'right' })
  }

  y += 16

  // ── Notes ──────────────────────────────────────────────────────────────────
  if (invoice.notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...mutedText)
    const notesLabel = isRTL ? 'ملاحظات:' : 'Notes :'
    if (isRTL) {
      doc.text(notesLabel, pageW - margin, y, { align: 'right' })
    } else {
      doc.text(notesLabel, margin, y)
    }
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...darkText)
    const noteLines = doc.splitTextToSize(invoice.notes, contentW)
    if (isRTL) {
      doc.text(noteLines, pageW - margin, y, { align: 'right' })
    } else {
      doc.text(noteLines, margin, y)
    }
    y += noteLines.length * 5 + 4
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  doc.setFillColor(...lightGray)
  doc.rect(0, pageH - 18, pageW, 18, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...mutedText)
  const footerText = isRTL
    ? 'شكراً لتعاملكم معنا'
    : 'Merci pour votre confiance'
  doc.text(footerText, pageW / 2, pageH - 7, { align: 'center' })

  return doc
}

export function downloadInvoicePDF(invoice: InvoiceData, locale = 'ar'): void {
  const doc = generateInvoicePDF(invoice, locale)
  doc.save(`${invoice.invoiceNumber}.pdf`)
}

export function printInvoicePDF(invoice: InvoiceData, locale = 'ar'): void {
  const doc = generateInvoicePDF(invoice, locale)
  doc.autoPrint()
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) {
    win.onload = () => {
      win.print()
      URL.revokeObjectURL(url)
    }
  }
}
