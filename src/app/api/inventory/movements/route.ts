import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const storeId = session.storeId ?? 'store-1'
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'))
    const skip = (page - 1) * limit

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { product: { storeId } },
        include: {
          product: { select: { id: true, name_ar: true, name_fr: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockMovement.count({ where: { product: { storeId } } }),
    ])

    return NextResponse.json({ movements, total, page, limit })
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

    const body = await request.json()
    const { productId, type, quantity, reason } = body

    if (!productId || !type || !quantity) {
      return NextResponse.json(
        { error: 'productId, type, and quantity are required' },
        { status: 400 }
      )
    }

    if (!['IN', 'OUT'].includes(type)) {
      return NextResponse.json({ error: 'type must be IN or OUT' }, { status: 400 })
    }

    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'quantity must be a positive integer' }, { status: 400 })
    }

    const movement = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } })
      if (!product) throw new Error('Product not found')

      const newQuantity =
        type === 'IN' ? product.quantity + qty : product.quantity - qty

      await tx.product.update({
        where: { id: productId },
        data: { quantity: Math.max(0, newQuantity) },
      })

      return tx.stockMovement.create({
        data: {
          type,
          quantity: qty,
          reason: reason || null,
          productId,
          userId: session.userId,
        },
        include: {
          product: { select: { id: true, name_ar: true, name_fr: true } },
          user: { select: { id: true, name: true } },
        },
      })
    })

    return NextResponse.json({ movement }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    if (msg === 'Product not found') {
      return NextResponse.json({ error: msg }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
