// Daily comprehensive analytics report
// Cron: runs daily at 9 PM EST (1 AM UTC) via Vercel
// Sends detailed email to owner with usage stats, popular categories,
// unmet demand, confused users, errors, and lead performance

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import prisma from '@/lib/db'

const OWNER_EMAIL = process.env.REPORT_EMAIL || 'contact@connect2kehilla.com'
const FROM_EMAIL = 'Connect2Kehilla <noreply@crownheightsgroups.com>'

export const maxDuration = 30

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret') || authHeader?.replace('Bearer ', '')

  if (secret !== process.env.CRON_SECRET && !request.headers.get('x-vercel-cron')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Today's date range (EST) — report covers today since it runs at 9 PM
  const now = new Date()
  const todayStart = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  // ============================================
  // A. Daily Summary KPIs
  // ============================================
  const totalQueries = await prisma.query.count({
    where: { createdAt: { gte: todayStart, lt: todayEnd } }
  })

  const uniqueUsers = await prisma.query.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: todayStart, lt: todayEnd } },
  })

  const newUsers = await prisma.user.count({
    where: { createdAt: { gte: todayStart, lt: todayEnd } }
  })

  const searchQueries = await prisma.query.count({
    where: { createdAt: { gte: todayStart, lt: todayEnd }, parsedIntent: 'SEARCH' }
  })

  const successQueries = await prisma.query.count({
    where: { createdAt: { gte: todayStart, lt: todayEnd }, parsedIntent: 'SEARCH', businessCount: { gt: 0 } }
  })

  const successRate = searchQueries > 0 ? Math.round((successQueries / searchQueries) * 100) : 0

  // ============================================
  // B. Intent Breakdown
  // ============================================
  const intentGroups = await prisma.query.groupBy({
    by: ['parsedIntent'],
    where: { createdAt: { gte: todayStart, lt: todayEnd } },
    _count: true,
  })

  // Also count zmanim and minyan (stored as SEARCH with specific parsedCategory)
  const zmanimCount = await prisma.query.count({
    where: { createdAt: { gte: todayStart, lt: todayEnd }, parsedCategory: 'zmanim' }
  })
  const minyanCount = await prisma.query.count({
    where: { createdAt: { gte: todayStart, lt: todayEnd }, parsedCategory: 'minyan' }
  })

  // ============================================
  // C. Top 10 Popular Categories
  // ============================================
  const categoryGroups = await prisma.query.groupBy({
    by: ['parsedCategory'],
    where: {
      createdAt: { gte: todayStart, lt: todayEnd },
      parsedIntent: 'SEARCH',
      parsedCategory: { not: null },
      rawMessage: { not: { startsWith: '__SPECIALS_LIST__' } },
    },
    _count: true,
    _avg: { businessCount: true },
    orderBy: { _count: { parsedCategory: 'desc' } },
    take: 10,
  })

  // Get sample queries for top categories
  const categorySamples: Record<string, string[]> = {}
  for (const cg of categoryGroups) {
    if (!cg.parsedCategory) continue
    const samples = await prisma.query.findMany({
      where: {
        createdAt: { gte: todayStart, lt: todayEnd },
        parsedCategory: cg.parsedCategory,
        parsedIntent: 'SEARCH',
      },
      select: { rawMessage: true },
      take: 3,
      distinct: ['rawMessage'],
    })
    categorySamples[cg.parsedCategory] = samples.map(s => s.rawMessage)
  }

  // ============================================
  // D. Geographic Activity
  // ============================================
  const geoGroups = await prisma.query.groupBy({
    by: ['parsedZip'],
    where: {
      createdAt: { gte: todayStart, lt: todayEnd },
      parsedZip: { not: null },
    },
    _count: true,
    orderBy: { _count: { parsedZip: 'desc' } },
    take: 10,
  })

  const areaGroups = await prisma.query.groupBy({
    by: ['parsedArea'],
    where: {
      createdAt: { gte: todayStart, lt: todayEnd },
      parsedArea: { not: null },
    },
    _count: true,
    orderBy: { _count: { parsedArea: 'desc' } },
    take: 10,
  })

  // ============================================
  // E. Unmet Demand (0 results)
  // ============================================
  const zeroResults = await prisma.query.findMany({
    where: {
      createdAt: { gte: todayStart, lt: todayEnd },
      businessCount: 0,
      parsedIntent: 'SEARCH',
      rawMessage: { not: { startsWith: '__SPECIALS_LIST__' } },
    },
    select: { rawMessage: true, parsedCategory: true, parsedArea: true, parsedZip: true },
    orderBy: { createdAt: 'desc' },
  })

  const unmetByCategory: Record<string, { count: number; queries: string[]; areas: string[] }> = {}
  for (const q of zeroResults) {
    const cat = q.parsedCategory || 'unknown'
    if (!unmetByCategory[cat]) unmetByCategory[cat] = { count: 0, queries: [], areas: [] }
    unmetByCategory[cat].count++
    if (unmetByCategory[cat].queries.length < 3 && !unmetByCategory[cat].queries.includes(q.rawMessage)) {
      unmetByCategory[cat].queries.push(q.rawMessage)
    }
    const area = q.parsedArea || q.parsedZip || ''
    if (area && !unmetByCategory[cat].areas.includes(area)) {
      unmetByCategory[cat].areas.push(area)
    }
  }

  // ============================================
  // F. Confused Users (UNKNOWN intent)
  // ============================================
  const confusedQueries = await prisma.query.findMany({
    where: {
      createdAt: { gte: todayStart, lt: todayEnd },
      parsedIntent: 'UNKNOWN',
    },
    select: { rawMessage: true },
    orderBy: { createdAt: 'desc' },
  })

  const confusedGrouped: Record<string, number> = {}
  for (const q of confusedQueries) {
    const msg = q.rawMessage.toLowerCase().trim()
    confusedGrouped[msg] = (confusedGrouped[msg] || 0) + 1
  }

  // ============================================
  // G. Error Queries
  // ============================================
  const errorQueries = await prisma.query.findMany({
    where: {
      createdAt: { gte: todayStart, lt: todayEnd },
      OR: [
        { responseText: { contains: 'something went wrong' } },
        { responseText: { contains: 'temporarily unavailable' } },
      ],
    },
    select: { rawMessage: true, responseText: true },
    orderBy: { createdAt: 'desc' },
  })

  // ============================================
  // H. Lead Performance (top businesses)
  // ============================================
  const topLeads = await prisma.lead.groupBy({
    by: ['businessId'],
    where: { createdAt: { gte: todayStart, lt: todayEnd } },
    _count: true,
    orderBy: { _count: { businessId: 'desc' } },
    take: 5,
  })

  const topBusinesses = []
  for (const tl of topLeads) {
    const biz = await prisma.business.findUnique({
      where: { id: tl.businessId },
      select: { name: true, phone: true, area: true },
    })
    if (biz) topBusinesses.push({ ...biz, leads: tl._count })
  }

  // ============================================
  // I. Customer Base (CRM)
  // ============================================
  const totalCustomers = await prisma.user.count({ where: { phone: { not: null } } })
  const activeCustomers = await prisma.user.count({ where: { phone: { not: null }, isBlocked: false } })
  const newCustomersToday = await prisma.user.count({
    where: { phone: { not: null }, createdAt: { gte: todayStart, lt: todayEnd } }
  })
  const optedOut = await prisma.user.count({ where: { isBlocked: true } })

  // Top 10 categories by unique customers (for broadcast targeting)
  const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const topSegments = await prisma.$queryRaw<Array<{ category: string, users: number }>>`
    SELECT "parsedCategory" AS category, COUNT(DISTINCT "userId")::int AS users
    FROM "Query"
    WHERE "parsedIntent" = 'SEARCH'
      AND "parsedCategory" IS NOT NULL
      AND "createdAt" >= ${since90}
    GROUP BY "parsedCategory"
    ORDER BY users DESC
    LIMIT 10
  `

  // Recent broadcasts stats
  const recentBroadcasts = await prisma.broadcast.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, message: true, segment: true, sent: true, failed: true, createdAt: true },
  })

  // ============================================
  // Skip if no activity
  // ============================================
  if (totalQueries === 0) {
    return NextResponse.json({ ok: true, message: 'No queries today, skipping report' })
  }

  // ============================================
  // Build HTML Email
  // ============================================
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/New_York',
  })

  const card = (value: string | number, label: string, color: string) =>
    `<div style="flex:1;background:white;padding:16px;border-radius:8px;border:1px solid #e5e7eb;text-align:center;min-width:80px;">
      <div style="font-size:28px;font-weight:bold;color:${color};">${value}</div>
      <div style="color:#666;font-size:12px;">${label}</div>
    </div>`

  const intentRow = (intent: string, count: number, emoji: string) =>
    count > 0 ? `<tr><td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;">${emoji} ${intent}</td><td style="padding:6px 12px;text-align:right;font-weight:bold;border-bottom:1px solid #f3f4f6;">${count}</td></tr>` : ''

  const intentMap: Record<string, number> = {}
  for (const ig of intentGroups) {
    intentMap[ig.parsedIntent] = ig._count
  }

  // Categories table
  const categoriesHTML = categoryGroups.map(cg => {
    const cat = cg.parsedCategory || 'unknown'
    const avgRes = cg._avg?.businessCount ? Math.round(cg._avg.businessCount * 10) / 10 : 0
    const samples = categorySamples[cat]?.slice(0, 2).map(s => `"${s}"`).join(', ') || ''
    return `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;font-weight:bold;">${cat}</td>
      <td style="padding:6px 12px;text-align:center;border-bottom:1px solid #f3f4f6;">${cg._count}</td>
      <td style="padding:6px 12px;text-align:center;border-bottom:1px solid #f3f4f6;">${avgRes}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#888;">${samples}</td>
    </tr>`
  }).join('')

  // Unmet demand table
  const unmetHTML = Object.entries(unmetByCategory)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([cat, data]) => `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;font-weight:bold;">${cat}</td>
      <td style="padding:6px 12px;text-align:center;border-bottom:1px solid #f3f4f6;">${data.count}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;color:#666;">${data.areas.join(', ') || '—'}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#888;">${data.queries.map(q => `"${q}"`).join(', ')}</td>
    </tr>`).join('')

  // Confused queries
  const confusedHTML = Object.entries(confusedGrouped)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([msg, count]) => `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;font-family:monospace;font-size:13px;">"${msg}"</td>
      <td style="padding:6px 12px;text-align:center;border-bottom:1px solid #f3f4f6;">${count}</td>
    </tr>`).join('')

  // Error queries
  const errorsHTML = errorQueries.slice(0, 10).map(eq =>
    `<tr><td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;font-family:monospace;font-size:13px;">"${eq.rawMessage}"</td></tr>`
  ).join('')

  // Geographic activity
  const geoHTML = geoGroups.map(g =>
    `<tr><td style="padding:4px 12px;border-bottom:1px solid #f3f4f6;">📍 ${g.parsedZip}</td><td style="padding:4px 12px;text-align:right;border-bottom:1px solid #f3f4f6;">${g._count}</td></tr>`
  ).join('')
  const areaHTML = areaGroups.map(a =>
    `<tr><td style="padding:4px 12px;border-bottom:1px solid #f3f4f6;">🏘 ${a.parsedArea}</td><td style="padding:4px 12px;text-align:right;border-bottom:1px solid #f3f4f6;">${a._count}</td></tr>`
  ).join('')

  // Lead performance
  const leadsHTML = topBusinesses.map((b, i) =>
    `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;">${i + 1}. ${b.name}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;color:#666;">${b.area || ''}</td>
      <td style="padding:6px 12px;text-align:center;border-bottom:1px solid #f3f4f6;font-weight:bold;">${b.leads}</td>
    </tr>`
  ).join('')

  const section = (title: string, emoji: string, content: string) => `
    <div style="padding:20px;border:1px solid #e5e7eb;border-top:none;">
      <h3 style="color:#1e3a5f;margin-top:0;">${emoji} ${title}</h3>
      ${content}
    </div>`

  const tableWrap = (headers: string[], rows: string) => `
    <table style="width:100%;border-collapse:collapse;">
      <tr style="background:#f3f4f6;">${headers.map(h => `<th style="padding:8px 12px;text-align:left;font-size:13px;">${h}</th>`).join('')}</tr>
      ${rows}
    </table>`

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;padding:20px;color:#333;">

  <div style="background:linear-gradient(135deg,#1e3a5f,#2d5a87);padding:24px;border-radius:12px 12px 0 0;color:white;">
    <h2 style="margin:0;">📊 Connect2Kehilla — Daily Report</h2>
    <p style="margin:8px 0 0;opacity:0.8;">${dateStr}</p>
  </div>

  <!-- A. KPI Cards -->
  <div style="background:#f9fafb;padding:20px;border:1px solid #e5e7eb;display:flex;gap:12px;flex-wrap:wrap;">
    ${card(totalQueries, 'Total Queries', '#1e3a5f')}
    ${card(uniqueUsers.length, 'Unique Users', '#6366f1')}
    ${card(newUsers, 'New Users', '#059669')}
    ${card(successRate + '%', 'Success Rate', successRate >= 70 ? '#059669' : '#dc2626')}
  </div>

  <!-- B. Intent Breakdown -->
  ${section('Intent Breakdown', '📋', tableWrap(['Type', 'Count'], `
    ${intentRow('Search', (intentMap['SEARCH'] || 0) - zmanimCount - minyanCount, '🔍')}
    ${intentRow('Zmanim', zmanimCount, '🕐')}
    ${intentRow('Minyan / Shul', minyanCount, '🕍')}
    ${intentRow('Specials', intentMap['SPECIALS'] || 0, '🏷')}
    ${intentRow('Jobs / Work', intentMap['JOBS'] || 0, '👷')}
    ${intentRow('Help / Menu', intentMap['HELP'] || 0, '📱')}
    ${intentRow('Stop (unsubscribe)', intentMap['STOP'] || 0, '🚫')}
    ${intentRow('Unknown / Confused', intentMap['UNKNOWN'] || 0, '❓')}
    ${intentRow('Info', intentMap['INFO'] || 0, 'ℹ️')}
  `))}

  <!-- C. Top Categories -->
  ${categoryGroups.length > 0 ? section('Top Categories', '🏆', tableWrap(
    ['Category', 'Queries', 'Avg Results', 'Samples'],
    categoriesHTML
  )) : ''}

  <!-- D. Geographic Activity -->
  ${(geoGroups.length > 0 || areaGroups.length > 0) ? section('Geographic Activity', '🗺', `
    <div style="display:flex;gap:20px;">
      <div style="flex:1;">${geoGroups.length > 0 ? '<strong>By ZIP Code</strong>' + tableWrap(['ZIP', 'Queries'], geoHTML) : ''}</div>
      <div style="flex:1;">${areaGroups.length > 0 ? '<strong>By Area</strong>' + tableWrap(['Area', 'Queries'], areaHTML) : ''}</div>
    </div>
  `) : ''}

  <!-- E. Unmet Demand -->
  ${zeroResults.length > 0 ? section('Unmet Demand — Zero Results', '🔴',
    `<p style="color:#666;font-size:13px;">These searches returned nothing. Consider adding businesses for these categories/areas.</p>`
    + tableWrap(['Category', 'Count', 'Areas', 'Sample Queries'], unmetHTML)
  ) : section('Unmet Demand', '✅', '<p style="color:#059669;">All searches found results today!</p>')}

  <!-- F. Confused Users -->
  ${confusedQueries.length > 0 ? section('Confused Users — Could Not Parse', '❓',
    `<p style="color:#666;font-size:13px;">These messages were not understood by the system. Consider adding aliases or improving the parser.</p>`
    + tableWrap(['Message', 'Count'], confusedHTML)
  ) : ''}

  <!-- G. Errors -->
  ${errorQueries.length > 0 ? section('Errors — System Failures', '⚠️',
    `<p style="color:#dc2626;font-size:13px;">${errorQueries.length} queries resulted in system errors:</p>`
    + tableWrap(['Message'], errorsHTML)
  ) : ''}

  <!-- H. Lead Performance -->
  ${topBusinesses.length > 0 ? section('Top Businesses by Leads', '💼', tableWrap(
    ['Business', 'Area', 'Leads'],
    leadsHTML
  )) : ''}

  <!-- I. Customer Base (CRM) -->
  ${section('Customer Base', '📇', `
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
      ${card(totalCustomers, 'Total Customers', '#1e3a5f')}
      ${card(activeCustomers, 'Active (not blocked)', '#059669')}
      ${card(newCustomersToday, 'New Today', '#6366f1')}
      ${card(optedOut, 'Opted Out (STOP)', '#dc2626')}
    </div>
    ${topSegments.length > 0 ? `
      <strong style="display:block;margin:16px 0 8px;">Top broadcast segments (last 90 days):</strong>
      ${tableWrap(['Category', 'Unique Customers'],
        topSegments.map(s =>
          `<tr><td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;">${s.category}</td><td style="padding:6px 12px;text-align:right;font-weight:bold;border-bottom:1px solid #f3f4f6;">${s.users}</td></tr>`
        ).join('')
      )}
    ` : ''}
    ${recentBroadcasts.length > 0 ? `
      <strong style="display:block;margin:16px 0 8px;">Recent broadcasts (last 7 days):</strong>
      ${tableWrap(['Date', 'Segment', 'Sent', 'Failed'],
        recentBroadcasts.map(b => {
          const d = new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })
          return `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;">${d}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;">${b.segment}</td>
            <td style="padding:6px 12px;text-align:center;border-bottom:1px solid #f3f4f6;color:#059669;font-weight:bold;">${b.sent}</td>
            <td style="padding:6px 12px;text-align:center;border-bottom:1px solid #f3f4f6;color:${b.failed > 0 ? '#dc2626' : '#666'};">${b.failed}</td>
          </tr>`
        }).join('')
      )}
    ` : '<p style="color:#666;font-size:13px;margin-top:12px;">No broadcasts sent recently.</p>'}
  `)}

  <div style="padding:16px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;text-align:center;background:#f9fafb;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">Connect2Kehilla • +1 (888) 516-3399 • ${totalQueries > 0 ? `${totalQueries} queries from ${uniqueUsers.length} users` : 'Daily Report'}</p>
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
    subject: `📊 Connect2Kehilla Daily — ${dateStr} | ${totalQueries} queries, ${uniqueUsers.length} users, ${zeroResults.length} unmet`,
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
    uniqueUsers: uniqueUsers.length,
    newUsers,
    successRate,
    zeroResults: zeroResults.length,
    confused: confusedQueries.length,
    errors: errorQueries.length,
  })
}
