// Cron: expire paid listings daily at midnight
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const maxDuration = 30

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret') || authHeader?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET && !request.headers.get('x-vercel-cron')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Expire listings
  const expiredListings = await prisma.listing.updateMany({
    where: { expiresAt: { lt: now }, isActive: true },
    data: { isActive: false },
  })

  // Reset expired businesses back to FREE
  const expiredBusinessIds = await prisma.listing.findMany({
    where: { expiresAt: { lt: now }, isActive: false },
    select: { businessId: true },
    distinct: ['businessId'],
  })

  const idsWithoutActive = []
  for (const { businessId } of expiredBusinessIds) {
    const activeCount = await prisma.listing.count({
      where: { businessId, isActive: true },
    })
    if (activeCount === 0) idsWithoutActive.push(businessId)
  }

  if (idsWithoutActive.length > 0) {
    await prisma.business.updateMany({
      where: { id: { in: idsWithoutActive } },
      data: { status: 'FREE' },
    })
  }

  // Expire jobs
  const expiredJobs = await prisma.job.updateMany({
    where: { expiresAt: { lt: now }, isActive: true },
    data: { isActive: false },
  })

  // Expire workers (30-day listings)
  const expiredWorkers = await prisma.worker.updateMany({
    where: { expiresAt: { lt: now }, isActive: true },
    data: { isActive: false },
  })

  return NextResponse.json({
    ok: true,
    expiredListings: expiredListings.count,
    resetToFree: idsWithoutActive.length,
    expiredJobs: expiredJobs.count,
    expiredWorkers: expiredWorkers.count,
  })
}
