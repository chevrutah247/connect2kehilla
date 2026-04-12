// Daily report: queries with 0 results (unmet demand)
// Cron: runs daily at 8am EST via Vercel
// Shows what people are looking for but can't find

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import prisma from '@/lib/db'

const OWNER_EMAIL = process.env.REPORT_EMAIL || 'contact@connect2kehilla.com'
const FROM_EMAIL = 'Connect2Kehilla <noreply@crownheightsgroups.com>' // verified domain

export const maxDuration = 30

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret') || authHeader?.replace('Bearer ', '')

  if (secret !== process.env.CRON_SECRET && !request.headers.get('x-vercel-cron')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get yesterday's date range (EST)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  // Queries with 0 business results (unmet demand)
  const zeroResults = await prisma.query.findMany({
    where: {
      createdAt: { gte: yesterday, lt: today },
      businessCount: 0,
      parsedIntent: 'SEARCH',
      rawMessage: { not: { startsWith: '__SPECIALS_LIST__' } },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      rawMessage: true,
      parsedCategory: true,
      parsedArea: true,
      parsedZip: true,
      createdAt: true,
    },
  })

  // Total queries yesterday
  const totalQueries = await prisma.query.count({
    where: {
      createdAt: { gte: yesterday, lt: today },
    },
  })

  // Total successful queries
  const successQueries = await prisma.query.count({
    where: {
      createdAt: { gte: yesterday, lt: today },
      businessCount: { gt: 0 },
    },
  })

  // Specials queries
  const specialsQueries = await prisma.query.count({
    where: {
      createdAt: { gte: yesterday, lt: today },
      rawMessage: { startsWith: '__SPECIALS_LIST__' },
    },
  })

  if (totalQueries === 0 && zeroResults.length === 0) {
    return NextResponse.json({ ok: true, message: 'No queries yesterday, skipping report' })
  }

  // Group zero-result queries by category
  const byCategory: Record<string, { count: number; queries: string[]; areas: string[] }> = {}
  for (const q of zeroResults) {
    const cat = q.parsedCategory || 'unknown'
    if (!byCategory[cat]) byCategory[cat] = { count: 0, queries: [], areas: [] }
    byCategory[cat].count++
    if (!byCategory[cat].queries.includes(q.rawMessage)) {
      byCategory[cat].queries.push(q.rawMessage)
    }
    const area = q.parsedArea || q.parsedZip || ''
    if (area && !byCategory[cat].areas.includes(area)) {
      byCategory[cat].areas.push(area)
    }
  }

  const dateStr = yesterday.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/New_York',
  })

  // Build HTML
  const zeroResultsHTML = Object.entries(byCategory)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([cat, data]) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${cat}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${data.count}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #666;">${data.areas.join(', ') || '—'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #888;">${data.queries.slice(0, 3).map(q => `"${q}"`).join(', ')}</td>
      </tr>
    `).join('')

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #1e3a5f, #2d5a87); padding: 20px; border-radius: 12px 12px 0 0; color: white;">
    <h2 style="margin: 0;">📊 Daily Report — Connect2Kehilla</h2>
    <p style="margin: 8px 0 0; opacity: 0.8;">${dateStr}</p>
  </div>

  <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
    <div style="display: flex; gap: 20px; text-align: center;">
      <div style="flex: 1; background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <div style="font-size: 28px; font-weight: bold; color: #1e3a5f;">${totalQueries}</div>
        <div style="color: #666; font-size: 13px;">Total Queries</div>
      </div>
      <div style="flex: 1; background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <div style="font-size: 28px; font-weight: bold; color: #059669;">${successQueries}</div>
        <div style="color: #666; font-size: 13px;">Found Results</div>
      </div>
      <div style="flex: 1; background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <div style="font-size: 28px; font-weight: bold; color: #dc2626;">${zeroResults.length}</div>
        <div style="color: #666; font-size: 13px;">No Results</div>
      </div>
      <div style="flex: 1; background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <div style="font-size: 28px; font-weight: bold; color: #7c3aed;">${specialsQueries}</div>
        <div style="color: #666; font-size: 13px;">Specials</div>
      </div>
    </div>
  </div>

  ${zeroResults.length > 0 ? `
  <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
    <h3 style="color: #dc2626; margin-top: 0;">🔍 Unmet Demand — Queries With No Results</h3>
    <p style="color: #666; font-size: 14px;">These are categories/areas people searched for but found nothing. Consider adding businesses in these areas.</p>
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="background: #f3f4f6;">
        <th style="padding: 8px; text-align: left;">Category</th>
        <th style="padding: 8px; text-align: center;">Count</th>
        <th style="padding: 8px; text-align: left;">Areas</th>
        <th style="padding: 8px; text-align: left;">Sample Queries</th>
      </tr>
      ${zeroResultsHTML}
    </table>
  </div>
  ` : `
  <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
    <p style="color: #059669; font-size: 18px;">✅ All queries found results!</p>
  </div>
  `}

  <div style="padding: 16px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; text-align: center; background: #f9fafb;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">Connect2Kehilla • +1 (888) 516-3399 • Daily Report</p>
  </div>
</body>
</html>`

  // Send email
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ ok: false, error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  const resend = new Resend(resendKey)
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: OWNER_EMAIL,
    subject: `[Connect2Kehilla] Daily Report — ${dateStr} | ${totalQueries} queries, ${zeroResults.length} unmet`,
    html,
  })

  if (error) {
    console.error('❌ Report email error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    date: dateStr,
    totalQueries,
    successQueries,
    zeroResults: zeroResults.length,
    specialsQueries,
  })
}
