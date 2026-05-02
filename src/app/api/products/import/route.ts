import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const storeId = session.storeId ?? 'store-1'
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const previewOnly = formData.get('previewOnly') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

    const products = rows
      .map((row) => ({
        name_ar: String(row['name_ar'] ?? row['اسم عربي'] ?? row['الاسم عربي'] ?? '').trim(),
        name_fr: String(row['name_fr'] ?? row['اسم فرنسي'] ?? row['الاسم فرنسي'] ?? '').trim(),
        sku: String(row['sku'] ?? row['SKU'] ?? '').trim() || null,
        barcode: String(row['barcode'] ?? row['باركود'] ?? row['الباركود'] ?? '').trim() || null,
        purchasePrice: parseFloat(String(row['purchasePrice'] ?? row['سعر الشراء'] ?? '0')) || 0,
        salePrice: parseFloat(String(row['salePrice'] ?? row['سعر البيع'] ?? '0')) || 0,
        quantity: parseInt(String(row['quantity'] ?? row['الكمية'] ?? '0')) || 0,
        minQuantity: parseInt(String(row['minQuantity'] ?? row['الحد الأدنى'] ?? '5')) || 5,
        image: String(row['image'] ?? row['صورة'] ?? '').trim() || null,
      }))
      .filter((p) => p.name_ar && p.name_fr && p.salePrice > 0)

    if (previewOnly) {
      return NextResponse.json({ count: products.length, preview: products.slice(0, 5) })
    }

    const created = await prisma.$transaction(
      products.map((p) =>
        prisma.product.create({
          data: { ...p, storeId },
        })
      )
    )

    return NextResponse.json({ count: created.length, success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
