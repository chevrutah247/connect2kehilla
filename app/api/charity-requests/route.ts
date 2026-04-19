// API for creating charity requests from the web
// POST /api/charity-requests

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { Resend } from 'resend'

const ADMIN_EMAIL = 'contact@connect2kehilla.com'
const FROM_EMAIL = 'Connect2Kehilla <noreply@crownheightsgroups.com>'
const EXPIRY_DAYS = 30

async function notifyAdmin(charity: any) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return
  try {
    const resend = new Resend(resendKey)
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `[Connect2Kehilla] New charity request pending review: ${charity.name}`,
      html: `
<h2>❤️ New Charity Request — Pending Review</h2>
<table style="border-collapse:collapse;font-family:Arial">
  <tr><td style="padding:6px;font-weight:bold">Name:</td><td style="padding:6px">${charity.name}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Phone:</td><td style="padding:6px">${charity.phone}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">ZIP:</td><td style="padding:6px">${charity.zipCode || '-'}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Area:</td><td style="padding:6px">${charity.area || '-'}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Description:</td><td style="padding:6px">${charity.description}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Amount:</td><td style="padding:6px">${charity.amount || '-'}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Payment info:</td><td style="padding:6px">${charity.paymentInfo || '-'}</td></tr>
</table>
<p style="margin-top:20px">
  <a href="https://www.connect2kehilla.com/admin" style="background:#059669;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Review in Admin Panel →</a>
</p>`,
    })
  } catch (err) {
    console.error('Admin notification email failed:', err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, zipCode, area, description, amount, paymentInfo } = body

    if (!name || !phone || !description) {
      return NextResponse.json({ error: 'Name, phone, and description are required' }, { status: 400 })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS)

    const charity = await prisma.charityRequest.create({
      data: {
        name,
        phone,
        zipCode: zipCode || null,
        area: area || null,
        description,
        amount: amount || null,
        paymentInfo: paymentInfo || null,
        expiresAt,
        approvalStatus: 'PENDING',
        submittedVia: 'web',
      },
    })

    // Fire-and-forget email notification
    notifyAdmin(charity).catch(() => {})

    return NextResponse.json({
      ok: true,
      id: charity.id,
      pending: true,
      message: '✅ Submitted! Our team will review and publish your charity request within 24 hours.',
    })
  } catch (error: any) {
    console.error('Charity request error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
