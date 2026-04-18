// Admin broadcast endpoint — send targeted SMS to customers
// POST /api/admin/broadcast
// Auth: Bearer CRON_SECRET header

import { NextRequest, NextResponse } from 'next/server'
import { sendBroadcast, Segment } from '@/lib/broadcast'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization')
  const secret = authHeader?.replace('Bearer ', '')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { segment, message, sinceDays, dryRun } = body

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  if (message.length > 1200) {
    return NextResponse.json({
      error: 'message too long (>1200 chars). SMS fragmentation may be expensive.'
    }, { status: 400 })
  }

  // Validate segment
  let seg: Segment | 'all'
  if (segment === 'all' || segment === undefined || segment === null) {
    seg = 'all'
  } else if (typeof segment === 'object') {
    seg = segment as Segment
    if (!seg.category && !seg.zip && !seg.area) {
      return NextResponse.json({
        error: 'segment must have at least one of: category, zip, area (or use "all")'
      }, { status: 400 })
    }
  } else {
    return NextResponse.json({ error: 'invalid segment' }, { status: 400 })
  }

  try {
    const result = await sendBroadcast({
      segment: seg,
      message,
      sinceDays: typeof sinceDays === 'number' ? sinceDays : 90,
      dryRun: Boolean(dryRun),
      createdBy: request.headers.get('x-admin-id') || 'api',
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (e: any) {
    console.error('Broadcast error:', e)
    return NextResponse.json({
      ok: false,
      error: e?.message || String(e),
    }, { status: 500 })
  }
}
