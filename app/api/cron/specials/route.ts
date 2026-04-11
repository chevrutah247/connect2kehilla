// Cron endpoint to pre-fetch store specials every morning
// Vercel Cron: configured in vercel.json
// Manual: GET /api/cron/specials?secret=CRON_SECRET

import { NextRequest, NextResponse } from 'next/server'
import { prefetchAllSpecials } from '@/lib/specials'

export const maxDuration = 60 // allow up to 60s for all store fetches

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel cron sends this, or manual trigger)
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret') || authHeader?.replace('Bearer ', '')

  if (secret !== process.env.CRON_SECRET && !request.headers.get('x-vercel-cron')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await prefetchAllSpecials()
  const total = Object.values(results).reduce((a, b) => a + b, 0)

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    totalSpecials: total,
    stores: results,
  })
}
