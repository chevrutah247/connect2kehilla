// app/api/vapi-webhook/route.ts
// Vapi.ai end-of-call webhook → email routing via Resend

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// ── Email routing by call topic ──
const EMAIL_ROUTING: Record<string, string> = {
  list_business: 'list@connect2kehilla.com',
  billing: 'billing@connect2kehilla.com',
  support: 'support@connect2kehilla.com',
  business_inquiry: 'business@connect2kehilla.com',
  default: 'contact@connect2kehilla.com',
}

// ── Keyword → category mapping ──
const CATEGORY_KEYWORDS: { keywords: string[]; category: string }[] = [
  { keywords: ['add', 'list', 'register', 'directory', 'business listing', 'add my business'], category: 'list_business' },
  { keywords: ['pay', 'payment', 'billing', 'invoice', 'charge', 'subscription', 'refund'], category: 'billing' },
  { keywords: ['problem', 'issue', 'help', 'not working', 'support', 'bug', 'error', 'broken'], category: 'support' },
  { keywords: ['partner', 'advertise', 'sponsor', 'wholesale', 'collaboration', 'marketing'], category: 'business_inquiry' },
]

function categorizeCall(transcript: string): { category: string; email: string } {
  const lower = transcript.toLowerCase()

  for (const { keywords, category } of CATEGORY_KEYWORDS) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return { category, email: EMAIL_ROUTING[category] }
      }
    }
  }

  return { category: 'default', email: EMAIL_ROUTING.default }
}

function formatDuration(startedAt: string, endedAt: string): string {
  const start = new Date(startedAt)
  const end = new Date(endedAt)
  const diffMs = end.getTime() - start.getTime()
  const minutes = Math.floor(diffMs / 60000)
  const seconds = Math.floor((diffMs % 60000) / 1000)
  return minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const CATEGORY_LABELS: Record<string, string> = {
  list_business: '📋 List Business',
  billing: '💳 Billing',
  support: '🔧 Support',
  business_inquiry: '🤝 Business Inquiry',
  default: '📞 General',
}

function buildEmailHTML(params: {
  callerNumber: string
  dateTime: string
  duration: string
  category: string
  summary: string
  transcript: string
  recordingUrl?: string
}): string {
  const { callerNumber, dateTime, duration, category, summary, transcript, recordingUrl } = params

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #1e3a5f, #2d5a87); padding: 20px; border-radius: 12px 12px 0 0; color: white;">
    <h2 style="margin: 0;">📞 New Call — Connect2Kehilla</h2>
  </div>

  <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; width: 140px;">📅 Date/Time:</td>
        <td style="padding: 8px 0;">${dateTime}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">📱 Caller:</td>
        <td style="padding: 8px 0;">${callerNumber}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">⏱ Duration:</td>
        <td style="padding: 8px 0;">${duration}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">🏷 Category:</td>
        <td style="padding: 8px 0;">${CATEGORY_LABELS[category] || category}</td>
      </tr>
      ${recordingUrl ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">🎙 Recording:</td>
        <td style="padding: 8px 0;"><a href="${recordingUrl}" style="color: #2563eb;">Listen</a></td>
      </tr>` : ''}
    </table>
  </div>

  <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
    <h3 style="color: #1e3a5f; margin-top: 0;">📋 Summary</h3>
    <p style="line-height: 1.6; background: #ecfdf5; padding: 12px; border-radius: 8px; border-left: 4px solid #059669;">${summary || 'No summary available'}</p>
  </div>

  <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <h3 style="color: #1e3a5f; margin-top: 0;">📝 Full Transcript</h3>
    <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${transcript || 'No transcript available'}</div>
  </div>

  <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
    Connect2Kehilla • +1 (888) 516-3399
  </p>
</body>
</html>`
}

// ── Main webhook handler ──
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get('authorization')
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret') || authHeader?.replace('Bearer ', '')
    if (secret !== process.env.VAPI_WEBHOOK_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Vapi sends different message types — we only care about end-of-call
    const messageType = body?.message?.type
    if (messageType !== 'end-of-call-report') {
      // Acknowledge other events silently
      return NextResponse.json({ ok: true, skipped: messageType })
    }

    const call = body.message.call || {}
    const transcript = body.message.transcript || ''
    const summary = body.message.summary || ''
    const recordingUrl = body.message.recordingUrl || null
    const callerNumber = call.customer?.number || 'Unknown'
    const startedAt = call.startedAt || new Date().toISOString()
    const endedAt = call.endedAt || new Date().toISOString()

    // Categorize and route
    const { category, email } = categorizeCall(transcript)
    const duration = formatDuration(startedAt, endedAt)
    const dateTime = formatDateTime(startedAt)

    console.log(`📞 Vapi call from ${callerNumber} → ${category} → ${email}`)

    // Send email via Resend
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.error('❌ RESEND_API_KEY not configured')
      return NextResponse.json({ ok: false, error: 'Email not configured' }, { status: 500 })
    }

    const resend = new Resend(resendKey)

    const { error } = await resend.emails.send({
      from: 'Connect2Kehilla <noreply@connect2kehilla.com>',
      to: email,
      subject: `[Connect2Kehilla] New message from ${callerNumber} — ${CATEGORY_LABELS[category] || category}`,
      html: buildEmailHTML({
        callerNumber,
        dateTime,
        duration,
        category,
        summary,
        transcript,
        recordingUrl,
      }),
    })

    if (error) {
      console.error('❌ Resend error:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, category, email, callerNumber })
  } catch (err) {
    console.error('❌ Vapi webhook error:', err)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
