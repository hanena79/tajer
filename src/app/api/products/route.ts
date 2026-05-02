import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const categoryId = searchParams.get('categoryId') ?? ''
    const sortBy = searchParams.get('sortBy') ?? 'name_ar'
    const sortDir = searchParams.get('sortDir') ?? 'asc'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'))
    const skip = (page - 1) * limit

    const storeId = session.storeId ?? 'store-1'

    const where = {
      storeId,
      ...(search
        ? {
            OR: [
              { name_ar: { contains: search } },
              { name_fr: { contains: search } },
              { barcode: { contains: search } },
              { sku: { contains: search } },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
    }

    const validSortFields: Record<string, string> = {
      name_ar: 'name_ar',
      name_fr: 'name_fr',
      salePrice: 'salePrice',
      purchasePrice: 'purchasePrice',
      quantity: 'quantity',
    }
    const orderByField = validSortFields[sortBy] ?? 'name_ar'
    const orderByDir = sortDir === 'desc' ? 'desc' : 'asc'

    const [products, total, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name_ar: true, name_fr: true } },
        },
        orderBy: { [orderByField]: orderByDir },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
      prisma.category.findMany({
        where: { storeId },
        orderBy: { name_ar: 'asc' },
      }),
    ])

    return NextResponse.json({ products, total, page, limit, categories })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const storeId = session.storeId ?? 'store-1'
    const body = await request.json()
    const {
      name_ar,
      name_fr,
      sku,
      barcode,
      purchasePrice,
      salePrice,
      quantity,
      minQuantity,
      image,
      categoryId,
    } = body

    if (!name_ar || !name_fr || salePrice === undefined) {
      return NextResponse.json(
        { error: 'name_ar, name_fr, and salePrice are required' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name_ar,
        name_fr,
        sku: sku || null,
        barcode: barcode || null,
        purchasePrice: parseFloat(purchasePrice) || 0,
        salePrice: parseFloat(salePrice),
        quantity: parseInt(quantity) || 0,
        minQuantity: parseInt(minQuantity) || 5,
        image: image || null,
        categoryId: categoryId || null,
        storeId,
      },
      include: {
        category: { select: { id: true, name_ar: true, name_fr: true } },
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    if (msg.includes('Unique constraint') || msg.includes('unique')) {
      return NextResponse.json({ error: 'Barcode already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
