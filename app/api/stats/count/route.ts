// Public stats endpoint — counts of approved content for homepage
// GET /api/stats/count

import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { readFileSync } from 'fs'
import { join } from 'path'

// Force runtime execution — do NOT prerender at build time (DB may not be available)
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Cache results in memory for 5 minutes
let cache: { data: any; at: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

export async function GET() {
  // In-memory cache first
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return NextResponse.json(cache.data)
  }

  let businesses = 0
  let charityRequests = 0

  try {
    const result = await Promise.all([
      prisma.business.count({
        where: { isActive: true, approvalStatus: 'APPROVED' },
      }),
      prisma.charityRequest.count({
        where: { isActive: true, approvalStatus: 'APPROVED', expiresAt: { gt: new Date() } },
      }).catch(() => 0),
    ])
    businesses = result[0]
    charityRequests = result[1]
  } catch (err) {
    // Fallback: query without approvalStatus in case column doesn't exist yet
    try {
      businesses = await prisma.business.count({ where: { isActive: true } })
    } catch {}
  }

  // Count shuls from JSON file
  let shuls = 0
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'shuls.json'), 'utf-8')
    const shulsData = JSON.parse(raw)
    shuls = Array.isArray(shulsData) ? shulsData.length : 0
  } catch {}

  const data = {
    businesses,
    shuls,
    charityRequests,
    total: businesses + shuls,
    updatedAt: new Date().toISOString(),
  }
  cache = { data, at: Date.now() }
  return NextResponse.json(data)
}
