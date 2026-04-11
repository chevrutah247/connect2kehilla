// POST /api/vapi-webhook/test
// Send test emails to all Connect2Kehilla mailboxes

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const TEST_EMAILS = [
  'contact@connect2kehilla.com',
  'list@connect2kehilla.com',
  'business@connect2kehilla.com',
  'support@connect2kehilla.com',
  'billing@connect2kehilla.com',
  'noreply@connect2kehilla.com',
]

export async function POST(request: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  // Simple auth check
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = new Resend(resendKey)
  const results: Record<string, string> = {}

  for (const email of TEST_EMAILS) {
    try {
      const { error } = await resend.emails.send({
        from: 'Connect2Kehilla <noreply@connect2kehilla.com>',
        to: email,
        subject: `[TEST] Connect2Kehilla Email Test — ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`,
        html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669, #047857); padding: 20px; border-radius: 12px; color: white; text-align: center;">
    <h2 style="margin: 0;">✅ Test Email</h2>
    <p style="margin: 8px 0 0; opacity: 0.9;">Connect2Kehilla Vapi Webhook</p>
  </div>
  <div style="padding: 20px; background: #f9fafb; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
    <p><b>To:</b> ${email}</p>
    <p><b>Time:</b> ${new Date().toISOString()}</p>
    <p style="color: #059669; font-weight: bold;">If you see this, the email routing is working correctly!</p>
  </div>
</body>
</html>`,
      })
      results[email] = error ? `❌ ${error.message}` : '✅ sent'
    } catch (e: any) {
      results[email] = `❌ ${e.message}`
    }
  }

  return NextResponse.json({ ok: true, results })
}
