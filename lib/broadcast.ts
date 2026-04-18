// lib/broadcast.ts
// Targeted SMS broadcasts to customers based on past search behavior.
// Respects STOP (isBlocked flag) and adds CTIA-compliance footer to every message.

import prisma from './db'
import { sendSMS } from './twilio'

// ============================================
// Types
// ============================================
export interface Segment {
  category?: string   // e.g. 'plumber' — matches Query.parsedCategory
  zip?: string        // e.g. '11213' — matches Query.parsedZip
  area?: string       // e.g. 'Crown Heights' — matches Query.parsedArea
}

export interface Recipient {
  userId: string
  phone: string
}

export interface BroadcastResult {
  broadcastId: string | null
  totalRecipients: number
  sent: number
  failed: number
  skipped: number
  dryRun: boolean
  sampleRecipients?: Array<{ phone: string; userId: string }>
}

// ============================================
// Compliance footer — appended to every broadcast
// ============================================
const COMPLIANCE_FOOTER = '\n— Connect2Kehilla\nReply STOP to opt out.'

function withCompliance(message: string): string {
  // Don't add footer if already included
  if (message.includes('STOP to opt out') || message.includes('STOP to unsubscribe')) {
    return message
  }
  return message + COMPLIANCE_FOOTER
}

// ============================================
// Find recipients by segment using past Query history
// Only users with phone set and not blocked
// ============================================
export async function findRecipientsBySegment(
  segment: Segment,
  sinceDays: number = 90
): Promise<Recipient[]> {
  const sinceDate = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)

  // Build where clause for Query
  const queryWhere: any = {
    createdAt: { gte: sinceDate },
    parsedIntent: 'SEARCH',
    user: { isBlocked: false, phone: { not: null } },
  }
  if (segment.category) queryWhere.parsedCategory = segment.category
  if (segment.zip) queryWhere.parsedZip = segment.zip
  if (segment.area) queryWhere.parsedArea = { contains: segment.area, mode: 'insensitive' }

  // Find distinct users who match
  const queries = await prisma.query.findMany({
    where: queryWhere,
    distinct: ['userId'],
    select: { userId: true, user: { select: { phone: true } } },
  })

  return queries
    .filter(q => q.user?.phone)
    .map(q => ({ userId: q.userId, phone: q.user!.phone! }))
}

// ============================================
// Find all active customers (for general announcements)
// ============================================
export async function findAllActiveCustomers(): Promise<Recipient[]> {
  const users = await prisma.user.findMany({
    where: { isBlocked: false, phone: { not: null } },
    select: { id: true, phone: true },
  })
  return users
    .filter(u => u.phone)
    .map(u => ({ userId: u.id, phone: u.phone! }))
}

// ============================================
// Describe segment as human-readable string
// ============================================
function segmentLabel(segment: Segment | 'all'): string {
  if (segment === 'all') return 'all'
  const parts: string[] = []
  if (segment.category) parts.push(`category:${segment.category}`)
  if (segment.zip) parts.push(`zip:${segment.zip}`)
  if (segment.area) parts.push(`area:${segment.area}`)
  return parts.join(',') || 'all'
}

// ============================================
// Send broadcast with logging
// ============================================
export async function sendBroadcast(params: {
  segment: Segment | 'all'
  message: string
  sinceDays?: number
  dryRun?: boolean
  createdBy?: string
}): Promise<BroadcastResult> {
  const { segment, message, sinceDays = 90, dryRun = false, createdBy } = params

  // 1. Find recipients
  const recipients = segment === 'all'
    ? await findAllActiveCustomers()
    : await findRecipientsBySegment(segment, sinceDays)

  // 2. Dry run — just return counts
  if (dryRun) {
    return {
      broadcastId: null,
      totalRecipients: recipients.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      dryRun: true,
      sampleRecipients: recipients.slice(0, 5),
    }
  }

  // 3. Create Broadcast audit record
  const fullMessage = withCompliance(message)
  const broadcast = await prisma.broadcast.create({
    data: {
      message: fullMessage,
      segment: segmentLabel(segment),
      createdBy: createdBy || 'admin',
    }
  })

  // 4. Send each SMS + log recipient
  let sent = 0, failed = 0
  for (const r of recipients) {
    // Re-check isBlocked at send time (in case changed since findRecipients)
    const fresh = await prisma.user.findUnique({
      where: { id: r.userId },
      select: { isBlocked: true, phone: true },
    })
    if (!fresh || fresh.isBlocked || !fresh.phone) {
      await prisma.broadcastRecipient.create({
        data: {
          broadcastId: broadcast.id,
          userId: r.userId,
          phone: r.phone,
          status: 'skipped',
          error: 'blocked or no phone',
        }
      })
      continue
    }

    try {
      const ok = await sendSMS(fresh.phone, fullMessage)
      await prisma.broadcastRecipient.create({
        data: {
          broadcastId: broadcast.id,
          userId: r.userId,
          phone: fresh.phone,
          status: ok ? 'sent' : 'failed',
          error: ok ? null : 'sendSMS returned false',
        }
      })
      if (ok) sent++
      else failed++
    } catch (e: any) {
      failed++
      await prisma.broadcastRecipient.create({
        data: {
          broadcastId: broadcast.id,
          userId: r.userId,
          phone: fresh.phone,
          status: 'failed',
          error: String(e?.message || e).slice(0, 200),
        }
      })
    }
  }

  const skipped = recipients.length - sent - failed

  // 5. Update broadcast stats
  await prisma.broadcast.update({
    where: { id: broadcast.id },
    data: { sent, failed, skipped },
  })

  return {
    broadcastId: broadcast.id,
    totalRecipients: recipients.length,
    sent,
    failed,
    skipped,
    dryRun: false,
  }
}
