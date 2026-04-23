// Cron endpoint to pre-fetch store specials every morning
// Vercel Cron: configured in vercel.json
// Manual: GET /api/cron/specials?secret=CRON_SECRET

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAllStores, fetchStoreSpecials } from '@/lib/specials'

export const maxDuration = 60

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret') || authHeader?.replace('Bearer ', '')

  if (secret !== process.env.CRON_SECRET && !request.headers.get('x-vercel-cron')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const mcgStores = getAllStores().filter(s => s.apiBase)
  const now = new Date()
  const eightDays = 8 * 24 * 60 * 60 * 1000

  const results: Record<string, number> = {}

  await Promise.all(mcgStores.map(async (store) => {
    const specials = await fetchStoreSpecials(store)
    if (specials.length === 0) {
      results[store.name] = 0
      return
    }

    const expiresAt = new Date(now.getTime() + eightDays)

    await prisma.$transaction([
      prisma.storeSpecial.deleteMany({ where: { storeId: store.id } }),
      prisma.storeSpecial.createMany({
        data: specials.map(s => ({
          storeId: store.id,
          storeName: store.name,
          area: store.area,
          name: s.name,
          price: s.price,
          oldPrice: s.oldPrice ?? null,
          category: s.category ?? null,
          scrapedAt: now,
          expiresAt,
        })),
      }),
    ])

    results[store.name] = specials.length
  }))

  const total = Object.values(results).reduce((a, b) => a + b, 0)

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    totalSpecials: total,
    stores: results,
  })
}
