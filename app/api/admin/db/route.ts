// Admin DB browser — search businesses + residents with filters
// GET /api/admin/db?type=business|residential|all&city=...&zip=...&q=...&limit=100&offset=0

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
    const type = searchParams.get('type') || 'all' // 'business' | 'residential' | 'all'
    const city = searchParams.get('city')?.trim() || ''
    const zip = searchParams.get('zip')?.trim() || ''
    const q = searchParams.get('q')?.trim() || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = { isActive: true, approvalStatus: 'APPROVED' }

    // Filter by type: residents have `categories: ['resident']`
    if (type === 'residential') {
      where.categories = { has: 'resident' }
    } else if (type === 'business') {
      where.NOT = { categories: { has: 'resident' } }
    }

    if (city) {
      where.OR = [
        { city: { contains: city, mode: 'insensitive' } },
        { area: { contains: city, mode: 'insensitive' } },
      ]
    }
    if (zip) {
      where.zipCode = { startsWith: zip }
    }
    if (q) {
      const existingOR = where.OR || []
      where.OR = [
        ...existingOR,
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ]
    }

    const [items, total, cityList] = await Promise.all([
      prisma.business.findMany({
        where,
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
        select: {
          id: true, name: true, phone: true, categoryRaw: true, categories: true,
          address: true, city: true, area: true, zipCode: true, state: true,
          email: true, website: true, listingType: true, status: true,
          createdAt: true,
        },
      }),
      prisma.business.count({ where }),
      // Top 30 cities for the UI filter dropdown
      prisma.business.groupBy({
        by: ['city'],
        where: { isActive: true, approvalStatus: 'APPROVED', city: { not: null } },
        _count: { city: true },
        orderBy: { _count: { city: 'desc' } },
        take: 30,
      }).catch(() => []),
    ])

    return NextResponse.json({
      items,
      total,
      limit,
      offset,
      cities: cityList.map((c: any) => ({ city: c.city, count: c._count?.city || 0 })),
    })
  } catch (err: any) {
    console.error('Admin DB browser error:', err?.message, err?.stack)
    return NextResponse.json(
      { error: 'Server error', message: err?.message || String(err), code: err?.code },
      { status: 500 },
    )
  }
}
