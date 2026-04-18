// Admin analytics API — requires Bearer token (CRON_SECRET or ADMIN_PASSWORD)
// GET /api/admin/analytics?date=YYYY-MM-DD&limit=200

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const maxDuration = 30

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

  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date') // YYYY-MM-DD
  const limit = parseInt(searchParams.get('limit') || '200')

  // Parse date range (EST)
  const now = new Date()
  const baseDate = dateParam
    ? new Date(dateParam + 'T00:00:00-04:00')  // EST
    : now
  const dayStart = new Date(baseDate)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  // ============================================
  // KPIs
  // ============================================
  const [totalQueries, uniqueUsersData, newUsers, searchQueries, successQueries] = await Promise.all([
    prisma.query.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
    prisma.query.groupBy({ by: ['userId'], where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
    prisma.user.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
    prisma.query.count({ where: { createdAt: { gte: dayStart, lt: dayEnd }, parsedIntent: 'SEARCH' } }),
    prisma.query.count({ where: { createdAt: { gte: dayStart, lt: dayEnd }, parsedIntent: 'SEARCH', businessCount: { gt: 0 } } }),
  ])
  const uniqueUsers = uniqueUsersData.length
  const successRate = searchQueries > 0 ? Math.round((successQueries / searchQueries) * 100) : 0

  // ============================================
  // Intent breakdown
  // ============================================
  const intentGroups = await prisma.query.groupBy({
    by: ['parsedIntent'],
    where: { createdAt: { gte: dayStart, lt: dayEnd } },
    _count: true,
  })

  const zmanimCount = await prisma.query.count({
    where: { createdAt: { gte: dayStart, lt: dayEnd }, parsedCategory: 'zmanim' }
  })
  const minyanCount = await prisma.query.count({
    where: { createdAt: { gte: dayStart, lt: dayEnd }, parsedCategory: 'minyan' }
  })

  // ============================================
  // Top categories
  // ============================================
  const topCategories = await prisma.query.groupBy({
    by: ['parsedCategory'],
    where: {
      createdAt: { gte: dayStart, lt: dayEnd },
      parsedCategory: { not: null },
      parsedIntent: 'SEARCH',
    },
    _count: true,
    orderBy: { _count: { parsedCategory: 'desc' } },
    take: 15,
  })

  // ============================================
  // Area activity (active / inactive)
  // ============================================
  const activeAreas = await prisma.query.groupBy({
    by: ['parsedArea'],
    where: {
      createdAt: { gte: dayStart, lt: dayEnd },
      parsedArea: { not: null },
    },
    _count: true,
    orderBy: { _count: { parsedArea: 'desc' } },
    take: 15,
  })

  const activeZips = await prisma.query.groupBy({
    by: ['parsedZip'],
    where: {
      createdAt: { gte: dayStart, lt: dayEnd },
      parsedZip: { not: null },
    },
    _count: true,
    orderBy: { _count: { parsedZip: 'desc' } },
    take: 15,
  })

  // 30-day view to identify LOW-activity areas (had 1-2 queries in past 30 days)
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const areas30d = await prisma.query.groupBy({
    by: ['parsedArea'],
    where: { createdAt: { gte: since30 }, parsedArea: { not: null } },
    _count: true,
    orderBy: { _count: { parsedArea: 'asc' } },
    take: 10,
  })

  // ============================================
  // Hourly distribution (for chart)
  // ============================================
  const hourly = await prisma.$queryRaw<Array<{ hour: number, count: number }>>`
    SELECT EXTRACT(HOUR FROM "createdAt" AT TIME ZONE 'America/New_York')::int AS hour, COUNT(*)::int AS count
    FROM "Query"
    WHERE "createdAt" >= ${dayStart} AND "createdAt" < ${dayEnd}
    GROUP BY hour ORDER BY hour
  `

  // ============================================
  // Event log (recent queries)
  // ============================================
  const logs = await prisma.query.findMany({
    where: { createdAt: { gte: dayStart, lt: dayEnd } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      createdAt: true,
      rawMessage: true,
      parsedCategory: true,
      parsedZip: true,
      parsedArea: true,
      parsedIntent: true,
      businessCount: true,
      responseText: true,
      user: { select: { phone: true, createdAt: true } },
    },
  })

  // Mask phone for display (e.g. +1 (***) ***-1234)
  const maskedLogs = logs.map(l => {
    let maskedPhone = '(anonymous)'
    if (l.user?.phone) {
      const p = l.user.phone.replace(/\D/g, '')
      const last4 = p.slice(-4)
      maskedPhone = `***-${last4}`
    }
    return {
      id: l.id,
      at: l.createdAt,
      from: maskedPhone,
      message: l.rawMessage,
      category: l.parsedCategory,
      zip: l.parsedZip,
      area: l.parsedArea,
      intent: l.parsedIntent,
      results: l.businessCount,
      response: l.responseText?.slice(0, 200) || null,
    }
  })

  // ============================================
  // Customer base
  // ============================================
  const [totalCustomers, activeCustomers, optedOut] = await Promise.all([
    prisma.user.count({ where: { phone: { not: null } } }),
    prisma.user.count({ where: { phone: { not: null }, isBlocked: false } }),
    prisma.user.count({ where: { isBlocked: true } }),
  ])

  return NextResponse.json({
    date: dayStart.toISOString(),
    kpi: {
      totalQueries,
      uniqueUsers,
      newUsers,
      searchQueries,
      successQueries,
      successRate,
    },
    intents: intentGroups.map(i => ({ intent: i.parsedIntent, count: i._count })),
    zmanimCount,
    minyanCount,
    topCategories: topCategories.map(c => ({ category: c.parsedCategory, count: c._count })),
    activeAreas: activeAreas.map(a => ({ area: a.parsedArea, count: a._count })),
    activeZips: activeZips.map(z => ({ zip: z.parsedZip, count: z._count })),
    inactiveAreas30d: areas30d.map(a => ({ area: a.parsedArea, count: a._count })),
    hourly,
    logs: maskedLogs,
    customers: { total: totalCustomers, active: activeCustomers, optedOut },
  })
}
