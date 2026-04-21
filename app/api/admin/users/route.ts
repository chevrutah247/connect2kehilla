// Admin users list — everyone who has used the service
// GET /api/admin/users?limit=200&offset=0&filter=...

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
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')
    const filter = searchParams.get('filter')?.toLowerCase().trim() || ''

    const where: any = {}
    if (filter) {
      where.OR = [
        { phone: { contains: filter } },
        { defaultZip: { contains: filter } },
        { defaultArea: { contains: filter, mode: 'insensitive' } },
      ]
    }

    const [users, total, totalActive, totalBlocked] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { lastActiveAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          phone: true,
          phoneHash: true,
          defaultZip: true,
          defaultArea: true,
          isBlocked: true,
          createdAt: true,
          lastActiveAt: true,
          _count: { select: { queries: true, leads: true, subscriptions: true } },
        },
      }),
      prisma.user.count({ where }),
      prisma.user.count({ where: { isBlocked: false } }),
      prisma.user.count({ where: { isBlocked: true } }),
    ])

    // Mask phone numbers for privacy (show last 4 digits only)
    const masked = users.map((u: any) => ({
      ...u,
      phoneMasked: u.phone ? `***-***-${u.phone.slice(-4)}` : null,
    }))

    return NextResponse.json({
      users: masked,
      total,
      totalActive,
      totalBlocked,
      limit,
      offset,
    })
  } catch (err: any) {
    console.error('Admin users error:', err?.message, err?.stack)
    return NextResponse.json(
      { error: 'Server error', message: err?.message || String(err), code: err?.code },
      { status: 500 },
    )
  }
}
