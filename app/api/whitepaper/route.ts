import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { appendFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const PDF_PATH = '/connect2kehilla-market-report-2026.pdf'
const ADMIN_EMAIL = 'list@connect2kehilla.com'
const FROM_EMAIL = 'Connect2Kehilla <list@connect2kehilla.com>'
const LEADS_LOG = join(process.cwd(), 'data', 'whitepaper-leads.jsonl')

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export async function POST(req: NextRequest) {
  let body: { name?: unknown; email?: unknown; consent?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!name || name.length < 2) {
    return NextResponse.json({ ok: false, error: 'Please enter your name' }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid email' }, { status: 400 })
  }

  const lead = {
    name,
    email,
    consent: !!body.consent,
    source: 'whitepaper-2026',
    referer: req.headers.get('referer') || null,
    userAgent: req.headers.get('user-agent') || null,
    ip: req.headers.get('x-forwarded-for') || null,
    createdAt: new Date().toISOString(),
  }

  // Append to JSONL log so leads survive even if email send fails.
  try {
    mkdirSync(join(process.cwd(), 'data'), { recursive: true })
    appendFileSync(LEADS_LOG, JSON.stringify(lead) + '\n')
  } catch (e) {
    console.error('whitepaper lead log write failed:', e)
  }

  // Send admin notification (best-effort).
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const resend = new Resend(resendKey)
      await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `[Connect2Kehilla] Market Report download: ${name}`,
        html: `
          <h2>📑 Market Report 2026 — new download</h2>
          <table style="border-collapse:collapse;font-family:Arial,sans-serif">
            <tr><td style="padding:6px;font-weight:bold">Name:</td><td style="padding:6px">${name}</td></tr>
            <tr><td style="padding:6px;font-weight:bold">Email:</td><td style="padding:6px"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:6px;font-weight:bold">Consent to follow-up:</td><td style="padding:6px">${lead.consent ? 'Yes' : 'No'}</td></tr>
            <tr><td style="padding:6px;font-weight:bold">Page:</td><td style="padding:6px">${lead.referer ?? '-'}</td></tr>
            <tr><td style="padding:6px;font-weight:bold">Time:</td><td style="padding:6px">${lead.createdAt}</td></tr>
          </table>
        `,
      })
    } catch (e) {
      console.error('whitepaper admin email send failed:', e)
    }

    // Optional: confirmation to the user with the PDF link.
    try {
      const resend = new Resend(resendKey)
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Your Connect2Kehilla Market Report — download link inside',
        html: `
          <p>Thanks ${name},</p>
          <p>Your copy of <strong>The Kosher Phone Market: Size, Demographics &amp; Opportunity</strong> is ready.</p>
          <p><a href="https://www.connect2kehilla.com${PDF_PATH}" style="display:inline-block;background:#047857;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold">📑 Download PDF</a></p>
          <p>If the button doesn't work, open this link directly: <br>
          <a href="https://www.connect2kehilla.com${PDF_PATH}">https://www.connect2kehilla.com${PDF_PATH}</a></p>
          <hr>
          <p style="color:#6b7280;font-size:13px">Connect2Kehilla &mdash; recognized by the Beis Din of Crown Heights as a valuable and appropriate service for the community.</p>
        `,
      })
    } catch (e) {
      console.error('whitepaper user confirmation email failed:', e)
    }
  }

  return NextResponse.json({ ok: true, downloadUrl: PDF_PATH })
}
