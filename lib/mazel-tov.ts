// lib/mazel-tov.ts
// Mazel Tov / Simcha submissions — moderated by admin, broadcast to subscribers on approve

import prisma from './db'
import { Resend } from 'resend'
import { getSubscribersForTopic } from './subscriptions'
import { sendSMS } from './twilio'

const ADMIN_EMAIL = 'contact@connect2kehilla.com'
const FROM_EMAIL = 'Connect2Kehilla <noreply@crownheightsgroups.com>'

// ─────────────────────────────────────────────
// Submit a new mazel tov — auto-creates Announcement (PENDING)
// ─────────────────────────────────────────────
export async function submitMazelTov(args: {
  text: string
  type?: string
  submittedByPhone?: string
  submittedByName?: string
  zipCode?: string
  area?: string
}): Promise<{ id: string; ok: true }> {
  const ann = await prisma.announcement.create({
    data: {
      type: args.type || 'mazel_tov',
      text: args.text.trim(),
      submittedByPhone: args.submittedByPhone || null,
      submittedByName: args.submittedByName || null,
      zipCode: args.zipCode || null,
      area: args.area || null,
      approvalStatus: 'PENDING',
    },
  })

  // Email admin (fire-and-forget)
  notifyAdmin(ann).catch(() => {})

  return { id: ann.id, ok: true }
}

// ─────────────────────────────────────────────
// Admin email notification
// ─────────────────────────────────────────────
async function notifyAdmin(ann: any) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return
  try {
    const resend = new Resend(resendKey)
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `[Connect2Kehilla] New Mazel Tov pending review`,
      html: `
<h2>🎊 New Mazel Tov / Simcha — Pending Review</h2>
<table style="border-collapse:collapse;font-family:Arial">
  <tr><td style="padding:6px;font-weight:bold">Type:</td><td style="padding:6px">${ann.type}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">From:</td><td style="padding:6px">${ann.submittedByName || ann.submittedByPhone || 'Anonymous'}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Phone:</td><td style="padding:6px">${ann.submittedByPhone || '-'}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Area:</td><td style="padding:6px">${ann.area || ann.zipCode || '-'}</td></tr>
</table>
<h3>Message:</h3>
<blockquote style="border-left:4px solid #C9A227;padding:12px;background:#fffbeb">
${ann.text.replace(/\n/g, '<br>')}
</blockquote>
<p style="margin-top:20px">
  <a href="https://www.connect2kehilla.com/admin" style="background:#059669;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Review & Approve →</a>
</p>
<p style="font-size:12px;color:#888">On approve it will be broadcast to all Mazel Tov subscribers immediately.</p>`,
    })
  } catch (err) {
    console.error('Mazel Tov admin email failed:', err)
  }
}

// ─────────────────────────────────────────────
// Approve announcement → broadcast to all Mazel Tov subscribers
// Returns { sent, failed }
// ─────────────────────────────────────────────
export async function approveAndBroadcast(announcementId: string, reviewedBy = 'admin'): Promise<{ sent: number; failed: number }> {
  const ann = await prisma.announcement.findUnique({ where: { id: announcementId } })
  if (!ann) throw new Error('Announcement not found')
  if (ann.approvalStatus !== 'PENDING') {
    return { sent: 0, failed: 0 }
  }

  // Mark as approved
  await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      approvalStatus: 'APPROVED',
      reviewedBy,
      reviewedAt: new Date(),
    },
  })

  // Build the broadcast message
  const emoji = ann.type === 'engagement' ? '💍' :
                ann.type === 'wedding' ? '👰' :
                ann.type === 'birth' ? '👶' :
                ann.type === 'bar_mitzvah' ? '🎓' : '🎊'
  const broadcastMsg = `${emoji} MAZEL TOV!\n\n${ann.text.trim()}\n\n— Connect2Kehilla\nReply UNSUB MAZEL TOV to stop.`

  // Fetch subscribers
  const subs = await getSubscribersForTopic('mazel_tov')
  let sent = 0
  let failed = 0

  for (const sub of subs) {
    try {
      await sendSMS(sub.phone, broadcastMsg)
      sent++
    } catch (err) {
      console.error(`Failed to send to ${sub.phone}:`, err)
      failed++
    }
  }

  // Update announcement with delivery stats
  await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      sentAt: new Date(),
      recipientCount: sent,
    },
  })

  return { sent, failed }
}

// ─────────────────────────────────────────────
// Reject announcement
// ─────────────────────────────────────────────
export async function rejectAnnouncement(announcementId: string, reason?: string, reviewedBy = 'admin') {
  await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      approvalStatus: 'REJECTED',
      reviewedBy,
      reviewedAt: new Date(),
      rejectionReason: reason || null,
    },
  })
}

// ─────────────────────────────────────────────
// Detect MAZEL TOV submission via SMS
// Format: "MAZEL TOV <text>" or "SIMCHA <text>"
// ─────────────────────────────────────────────
export function parseMazelTovSubmission(body: string): { text: string; type: string } | null {
  const t = body.trim()
  // Must start with one of these prefixes AND have at least 10 chars after
  const m = t.match(/^(MAZEL\s*TOV|SIMCHA|ENGAGEMENT|WEDDING|BIRTH|BAR\s*MITZVAH)\s+(.{10,})/i)
  if (!m) return null
  const prefix = m[1].toUpperCase().replace(/\s+/g, ' ')
  const text = m[2].trim()
  let type = 'mazel_tov'
  if (/ENGAGEMENT/.test(prefix)) type = 'engagement'
  else if (/WEDDING/.test(prefix)) type = 'wedding'
  else if (/BIRTH/.test(prefix)) type = 'birth'
  else if (/BAR\s*MITZVAH/.test(prefix)) type = 'bar_mitzvah'
  else if (/SIMCHA/.test(prefix)) type = 'simcha'
  return { text, type }
}

// ─────────────────────────────────────────────
// Detect MAZEL TOV list/view command (no text after, or "ADD" request)
// ─────────────────────────────────────────────
export type MazelTovMenuIntent = 'list' | 'add_instructions' | null

export function detectMazelTovMenu(body: string): MazelTovMenuIntent {
  const t = body.trim().toUpperCase()
  // Instructions for adding
  if (/^ADD\s*(MAZEL\s*TOV|SIMCHA)$/.test(t)) return 'add_instructions'
  // View list — exact command without trailing text
  if (/^(MAZEL\s*TOV|SIMCHA|SIMCHAS|MAZEL)$/.test(t)) return 'list'
  return null
}

// ─────────────────────────────────────────────
// Format list of recent approved Mazel Tov announcements
// ─────────────────────────────────────────────
export async function formatMazelTovList(limit = 5): Promise<string> {
  const recent = await prisma.announcement.findMany({
    where: { approvalStatus: 'APPROVED' },
    orderBy: { sentAt: 'desc' },
    take: limit,
  })

  if (recent.length === 0) {
    return `🎊 MAZEL TOV — no recent simchas yet.\n\nShare yours! Text:\n  MAZEL TOV <your message>\n\nOr text ADD MAZEL TOV for full instructions.`
  }

  const lines: string[] = ['🎊 RECENT MAZEL TOVS', '']
  for (const ann of recent) {
    const emoji = ann.type === 'engagement' ? '💍' :
                  ann.type === 'wedding' ? '👰' :
                  ann.type === 'birth' ? '👶' :
                  ann.type === 'bar_mitzvah' ? '🎓' : '🎊'
    // Trim text to fit SMS limits (we show 5 items max)
    const preview = ann.text.length > 120 ? ann.text.slice(0, 120) + '…' : ann.text
    lines.push(`${emoji} ${preview}`)
    if (ann.sentAt) {
      const days = Math.floor((Date.now() - new Date(ann.sentAt).getTime()) / (24 * 60 * 60 * 1000))
      lines.push(`   ${days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`}`)
    }
    lines.push('')
  }
  lines.push('📬 Reply SUB MAZEL TOV for live alerts.')
  lines.push('🎊 To share yours: ADD MAZEL TOV')
  return lines.join('\n')
}

// ─────────────────────────────────────────────
// Instructions for adding a mazel tov via SMS
// ─────────────────────────────────────────────
export function formatMazelTovInstructions(): string {
  return [
    '🎊 SHARE A SIMCHA',
    '',
    'Text to (888) 516-3399 in this format:',
    '',
    '  MAZEL TOV <your message>',
    '',
    'Or pick a specific type:',
    '  ENGAGEMENT <couple + details>',
    '  WEDDING <couple + details>',
    '  BIRTH <parents + baby>',
    '  BAR MITZVAH <boy + shul>',
    '  SIMCHA <general celebration>',
    '',
    'EXAMPLE:',
    '  ENGAGEMENT Yossi Cohen (Crown Heights)',
    '  to Rivka Goldstein (Monsey).',
    '  L\'Chaim Mon 8:30PM, 578 Albany Ave.',
    '',
    'Our team will review and broadcast',
    'to all Mazel Tov subscribers.',
    '',
    '🌐 Or use web form:',
    'connect2kehilla.com/add-mazel-tov',
    '',
    '👀 View recent: text MAZEL TOV',
  ].join('\n')
}
