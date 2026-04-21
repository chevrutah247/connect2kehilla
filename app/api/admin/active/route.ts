// Admin active items API — returns all currently-live time-sensitive content
// GET /api/admin/active

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  const adminPass = process.env.ADMIN_PASSWORD || process.env.CRON_SECRET
  return Boolean(adminPass && token === adminPass)
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // ── Approved Mazel Tov (last 30 days) ──
    const announcements = await prisma.announcement.findMany({
      where: {
        approvalStatus: 'APPROVED',
        sentAt: { gte: thirtyDaysAgo },
      },
      orderBy: { sentAt: 'desc' },
      take: 100,
    })

    // ── Active Charity Requests ──
    const charityRequests = await prisma.charityRequest.findMany({
      where: {
        isActive: true,
        approvalStatus: 'APPROVED',
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // ── Paid Listings (active, non-expired) ──
    const listings = await prisma.listing.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: 'asc' },
      include: {
        business: {
          select: { id: true, name: true, phone: true, area: true, zipCode: true, categories: true },
        },
      },
      take: 100,
    })

    // ── Active Jobs (not expired) ──
    const jobs = await prisma.job.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: 'asc' },
      take: 100,
    })

    // ── Active Workers (day-workers, not expired) ──
    const workers = await prisma.worker.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: 'asc' },
      take: 100,
    })

    // ── Approved Businesses with non-FREE status (implied paid) ──
    // Shows potential paid customers even without active listing
    const paidBusinesses = await prisma.business.findMany({
      where: {
        isActive: true,
        approvalStatus: 'APPROVED',
        status: { in: ['STANDARD', 'PREMIUM', 'SPECIALS', 'AD_BOOST'] },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, name: true, phone: true, area: true, zipCode: true, categories: true,
        status: true, listingType: true, createdAt: true, updatedAt: true,
      },
      take: 100,
    })

    return NextResponse.json({
      announcements,
      charityRequests,
      listings,
      jobs,
      workers,
      paidBusinesses,
      counts: {
        announcements: announcements.length,
        charityRequests: charityRequests.length,
        listings: listings.length,
        jobs: jobs.length,
        workers: workers.length,
        paidBusinesses: paidBusinesses.length,
        total:
          announcements.length +
          charityRequests.length +
          listings.length +
          jobs.length +
          workers.length +
          paidBusinesses.length,
      },
      timestamp: now.toISOString(),
    })
  } catch (err: any) {
    console.error('Active route error:', err?.message, err?.stack)
    return NextResponse.json(
      { error: 'Server error', message: err?.message || String(err), code: err?.code },
      { status: 500 },
    )
  }
}
