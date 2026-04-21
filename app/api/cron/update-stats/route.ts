// Cron: recompute cached system stats (e.g. business_count).
// Runs weekly (Vercel cron → vercel.json). Keeps MENU message fresh
// without querying the DB on every SMS.

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const maxDuration = 30

// Round down to the nearest 1,000 and append "+" for a friendly display.
// 21,547 → "21,000+"
function formatBusinessCount(n: number): string {
  if (n < 1000) return String(n)
  const rounded = Math.floor(n / 1000) * 1000
  return rounded.toLocaleString('en-US') + '+'
}

export async function GET(request: NextRequest) {
  // Same auth pattern as other cron endpoints here
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret') || authHeader?.replace('Bearer ', '')
  const isVercelCron = request.headers.get('x-vercel-cron')
  if (secret !== process.env.CRON_SECRET && !isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Count only approved + active BUSINESS listings (exclude residents).
    // The Business table also stores imported JBD residents tagged with
    // categories containing "resident" or "residential" — they bloat the
    // total from ~16K actual businesses to ~63K. The menu promises
    // "businesses", not "people in our directory", so filter them out.
    const count = await prisma.business.count({
      where: {
        isActive: true,
        approvalStatus: 'APPROVED',
        NOT: [
          { categories: { has: 'resident' } },
          { categories: { has: 'residential' } },
        ],
      },
    })
    const formatted = formatBusinessCount(count)

    await prisma.systemCache.upsert({
      where: { key: 'business_count' },
      update: { value: formatted, updatedAt: new Date() },
      create: { key: 'business_count', value: formatted },
    })

    return NextResponse.json({ ok: true, count, formatted })
  } catch (err: any) {
    console.error('update-stats cron error:', err?.message, err?.stack)
    return NextResponse.json(
      { error: 'Server error', message: err?.message || String(err) },
      { status: 500 },
    )
  }
}
