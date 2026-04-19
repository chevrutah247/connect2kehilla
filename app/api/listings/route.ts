// API for creating business/service listings
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { Resend } from 'resend'

const LISTING_DURATION_DAYS = 8
const ADMIN_EMAIL = 'contact@connect2kehilla.com'
const FROM_EMAIL = 'Connect2Kehilla <noreply@crownheightsgroups.com>'

async function notifyAdmin(business: any) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return
  try {
    const resend = new Resend(resendKey)
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `[Connect2Kehilla] New ${business.listingType?.toLowerCase() || 'business'} pending review: ${business.name}`,
      html: `
<h2>🔔 New Pending Submission</h2>
<table style="border-collapse:collapse;font-family:Arial">
  <tr><td style="padding:6px;font-weight:bold">Name:</td><td style="padding:6px">${business.name}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Phone:</td><td style="padding:6px">${business.phone}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Type:</td><td style="padding:6px">${business.listingType || 'BUSINESS'}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Area:</td><td style="padding:6px">${business.area || '-'}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">ZIP:</td><td style="padding:6px">${business.zipCode || '-'}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Address:</td><td style="padding:6px">${business.address || '-'}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Email:</td><td style="padding:6px">${business.email || '-'}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Website:</td><td style="padding:6px">${business.website || '-'}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Categories:</td><td style="padding:6px">${(business.categories || []).join(', ')}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Description:</td><td style="padding:6px">${business.description || '-'}</td></tr>
  <tr><td style="padding:6px;font-weight:bold">Plan:</td><td style="padding:6px">${business.status}</td></tr>
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
    const { name, phone, categories, listingType, description, hoursOfWork, priceFrom, zipCode, area, address, email, website, plan } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    // Check if business already exists by phone
    const existing = await prisma.business.findFirst({ where: { phone } })
    const isNewSubmission = !existing

    let business
    if (existing) {
      // Update existing — but keep previous approval status if already APPROVED
      // If a user resubmits and we had approved them, keep APPROVED; otherwise PENDING
      business = await prisma.business.update({
        where: { id: existing.id },
        data: {
          name, categories: categories || [], listingType: listingType || 'BUSINESS',
          description, hoursOfWork, priceFrom, zipCode, area, address, email, website,
          status: plan || 'FREE',
          // only change approval status if not already approved
          ...(existing.approvalStatus === 'APPROVED' ? {} : { approvalStatus: 'PENDING' as const, submittedVia: 'web' }),
        },
      })
    } else {
      // New submission — always PENDING
      business = await prisma.business.create({
        data: {
          name, phone, categories: categories || [], listingType: listingType || 'BUSINESS',
          description, hoursOfWork, priceFrom, zipCode, area, address, email, website,
          status: plan || 'FREE',
          approvalStatus: 'PENDING',
          submittedVia: 'web',
        },
      })
    }

    // Create paid listing if not FREE
    if (plan && plan !== 'FREE') {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + LISTING_DURATION_DAYS)

      await prisma.listing.create({
        data: {
          businessId: business.id,
          plan,
          price: plan === 'PREMIUM' ? 50 : plan === 'SPECIALS' ? 40 : plan === 'STANDARD' ? 30 : 7.99,
          expiresAt,
        },
      })
    }

    // Send admin notification for new pending submissions
    if (isNewSubmission || business.approvalStatus === 'PENDING') {
      notifyAdmin(business).catch(() => {}) // fire-and-forget
    }

    const isPending = business.approvalStatus === 'PENDING'
    return NextResponse.json({
      ok: true,
      businessId: business.id,
      status: business.status,
      approvalStatus: business.approvalStatus,
      pending: isPending,
      message: isPending
        ? '✅ Submitted! Our team will review and publish your listing within 24 hours. You will be notified by SMS when approved.'
        : 'Listing updated successfully.',
    })
  } catch (error: any) {
    console.error('Listing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
