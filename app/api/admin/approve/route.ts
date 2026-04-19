// Admin approve/reject API
// POST /api/admin/approve { type: "business" | "charity", id: string, action: "approve" | "reject", reason?: string }

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  const adminPass = process.env.ADMIN_PASSWORD || process.env.CRON_SECRET
  return Boolean(adminPass && token === adminPass)
}

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

  const { type, id, action, reason } = body

  if (!type || !id || !action) {
    return NextResponse.json({ error: 'Missing required fields: type, id, action' }, { status: 400 })
  }
  if (!['business', 'charity'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
  const updateData: any = {
    approvalStatus: newStatus,
    reviewedAt: new Date(),
    reviewedBy: 'admin',
  }
  if (action === 'reject' && reason) {
    updateData.rejectionReason = reason
  }

  try {
    if (type === 'business') {
      const updated = await prisma.business.update({
        where: { id },
        data: updateData,
      })
      return NextResponse.json({ ok: true, id: updated.id, approvalStatus: updated.approvalStatus })
    } else {
      const updated = await prisma.charityRequest.update({
        where: { id },
        data: updateData,
      })
      return NextResponse.json({ ok: true, id: updated.id, approvalStatus: updated.approvalStatus })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
