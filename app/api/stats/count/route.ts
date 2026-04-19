// Public stats endpoint — counts of approved content for homepage
// GET /api/stats/count

import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { readFileSync } from 'fs'
import { join } from 'path'

// Cache results in memory for 5 minutes
let cache: { data: any; at: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

export const revalidate = 300 // Next.js route cache 5 min

export async function GET() {
  // In-memory cache first
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return NextResponse.json(cache.data)
  }

  const [businesses, charityRequests] = await Promise.all([
    prisma.business.count({
      where: { isActive: true, approvalStatus: 'APPROVED' },
    }),
    prisma.charityRequest.count({
      where: { isActive: true, approvalStatus: 'APPROVED', expiresAt: { gt: new Date() } },
    }),
  ])

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
