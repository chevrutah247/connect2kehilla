// Admin delete / deactivate API
// POST /api/admin/delete { type, id, hard?: boolean }
// Soft delete by default (isActive=false); hard=true physically deletes the row.

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  const adminPass = process.env.ADMIN_PASSWORD || process.env.CRON_SECRET
  return Boolean(adminPass && token === adminPass)
}

const VALID_TYPES = [
  'announcement',
  'charity',
  'listing',
  'job',
  'worker',
  'business',
] as const
type ItemType = (typeof VALID_TYPES)[number]

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, id, hard } = body as { type: ItemType; id: string; hard?: boolean }
  if (!type || !id) {
    return NextResponse.json({ error: 'Missing type or id' }, { status: 400 })
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  try {
    switch (type) {
      case 'announcement':
        // Announcement has no isActive — always physically delete
        await prisma.announcement.delete({ where: { id } })
        return NextResponse.json({ ok: true, deleted: true })

      case 'charity':
        if (hard) await prisma.charityRequest.delete({ where: { id } })
        else
          await prisma.charityRequest.update({
            where: { id },
            data: { isActive: false },
          })
        return NextResponse.json({ ok: true, softDeleted: !hard })

      case 'listing':
        if (hard) await prisma.listing.delete({ where: { id } })
        else
          await prisma.listing.update({
            where: { id },
            data: { isActive: false },
          })
        return NextResponse.json({ ok: true, softDeleted: !hard })

      case 'job':
        if (hard) await prisma.job.delete({ where: { id } })
        else
          await prisma.job.update({
            where: { id },
            data: { isActive: false },
          })
        return NextResponse.json({ ok: true, softDeleted: !hard })

      case 'worker':
        if (hard) await prisma.worker.delete({ where: { id } })
        else
          await prisma.worker.update({
            where: { id },
            data: { isActive: false },
          })
        return NextResponse.json({ ok: true, softDeleted: !hard })

      case 'business':
        // Businesses are soft-deleted (isActive=false); hard delete only via DB
        await prisma.business.update({
          where: { id },
          data: { isActive: false },
        })
        return NextResponse.json({ ok: true, softDeleted: true })
    }
  } catch (err: any) {
    console.error('Delete route error:', err?.message, err?.stack)
    return NextResponse.json(
      { error: 'Server error', message: err?.message || String(err), code: err?.code },
      { status: 500 },
    )
  }
}
