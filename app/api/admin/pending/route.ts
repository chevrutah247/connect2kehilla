// Admin pending items API — returns all PENDING businesses + charity requests for review
// GET /api/admin/pending

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

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

  const businesses = await prisma.business.findMany({
    where: { approvalStatus: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      phone: true,
      listingType: true,
      categories: true,
      categoryRaw: true,
      description: true,
      address: true,
      area: true,
      city: true,
      zipCode: true,
      email: true,
      website: true,
      hoursOfWork: true,
      priceFrom: true,
      status: true,
      submittedVia: true,
      createdAt: true,
    },
    take: 100,
  })

  const charityRequests = await prisma.charityRequest.findMany({
    where: { approvalStatus: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const announcements = await prisma.announcement.findMany({
    where: { approvalStatus: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({
    businesses,
    charityRequests,
    announcements,
    counts: {
      businesses: businesses.length,
      charityRequests: charityRequests.length,
      announcements: announcements.length,
      total: businesses.length + charityRequests.length + announcements.length,
    },
  })
}
