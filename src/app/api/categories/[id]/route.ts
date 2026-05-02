import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<'/api/categories/[id]'>
) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await ctx.params
    const body = await request.json()
    const { name_ar, name_fr } = body

    if (!name_ar || !name_fr) {
      return NextResponse.json({ error: 'name_ar and name_fr are required' }, { status: 400 })
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name_ar, name_fr },
    })

    return NextResponse.json({ category })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<'/api/categories/[id]'>
) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await ctx.params

    await prisma.category.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
