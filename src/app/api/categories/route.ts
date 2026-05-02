import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const storeId = session.storeId ?? 'store-1'

    const categories = await prisma.category.findMany({
      where: { storeId },
      orderBy: { name_ar: 'asc' },
    })

    return NextResponse.json({ categories })
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
    const { name_ar, name_fr } = body

    if (!name_ar || !name_fr) {
      return NextResponse.json({ error: 'name_ar and name_fr are required' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: { name_ar, name_fr, storeId },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
