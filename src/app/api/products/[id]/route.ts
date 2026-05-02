import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<'/api/products/[id]'>
) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await ctx.params
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

    const product = await prisma.product.update({
      where: { id },
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
      },
      include: {
        category: { select: { id: true, name_ar: true, name_fr: true } },
      },
    })

    return NextResponse.json({ product })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    if (msg.includes('Unique constraint') || msg.includes('unique')) {
      return NextResponse.json({ error: 'Barcode already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<'/api/products/[id]'>
) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await ctx.params

    await prisma.product.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
