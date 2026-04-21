// app/api/sms/route.ts
// Главный webhook для обработки входящих SMS от Twilio

import { NextRequest, NextResponse } from 'next/server'
import { sendSMS, formatBusinessResponse, MESSAGES, validateTwilioRequest } from '@/lib/twilio'
import { parseQuery } from '@/lib/openai'
import { isShabbatWithBuffer } from '@/lib/shabbat'
import { getOrCreateUser, isUserBlocked, blockUser, unblockUser, getUserDefaultZip, setUserDefaultZip } from '@/lib/users'
import { searchBusinesses, searchBusinessesExpanded, searchBusinessesFuzzy, recordLeads } from '@/lib/businesses'
import { normalizeCategory, normalizeArea, normalizeCity, detectLanguage, matchKeywordToCategory } from '@/lib/fuzzy'
import { getAllStores, getStoreByIndex, getStoresByArea, getStoresByZip, getAreaByZip, fetchStoreSpecials, formatSpecialsForSMS, formatStoreListForSMS, Store } from '@/lib/specials'
import { parseWorkCommand, parseJobCommand, parseHireCommand, registerWorker, saveWorkerDescription, postJob, saveJobDescription, renewWorker, stopWorker, searchWorkers, JOBS_HELP, parseFreeformJobPost, postFreeformJob } from '@/lib/workers'
import { fastParse } from '@/lib/fast-parser'
import { handleJobsMenu, hasActiveJobsSession, handleJobZipEntry, JOBS_MAIN_MENU } from '@/lib/jobs-menu'
import { SHIDDUCH_RESPONSE } from '@/lib/shidduch'
import { handleCharityNoZip, handleCharityWithZip, handleCharityReply, hasActiveCharitySession, parseFreeformCharityRequest, postFreeformCharityRequest } from '@/lib/charity'
import { detectTefillah, searchShulsByZip, searchShulsByArea, searchShulByName, formatMinyanForSMS, formatShulForSMS } from '@/lib/minyanim'
import { formatZmanimForSMS } from '@/lib/zmanim'
import {
  detectCalendarIntent,
  formatZmanMenu,
  formatSfiratHaOmer,
  formatCandleLighting,
  formatRoshChodesh,
  formatFasts,
  formatBirkatHalevana,
} from '@/lib/jewish-calendar'
import { detectSubIntent, handleSubIntent, subscribeHint } from '@/lib/subscriptions'
import {
  parseMazelTovSubmission,
  submitMazelTov,
  detectMazelTovMenu,
  formatMazelTovList,
  formatMazelTovInstructions,
} from '@/lib/mazel-tov'
import { isShabbatNow } from '@/lib/is-shabbat'
import prisma from '@/lib/db'

// ============================================
// In-memory rate limiter (per phone hash)
// ============================================
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 10 // max requests per window

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count++
  if (entry.count > RATE_LIMIT_MAX) {
    return true
  }
  return false
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now >= entry.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60_000)

// ============================================
// Timing helper — логирует длительность в Vercel
// ============================================
async function timed<T>(label: string, fn: () => Promise<T> | T): Promise<T> {
  const t0 = Date.now()
  try {
    return await fn()
  } finally {
    console.log(`⏱ ${label}: ${Date.now() - t0}ms`)
  }
}

// ============================================
// GET /api/sms - Keep-warm endpoint for Vercel Cron
// ============================================
// Vercel Cron бьёт сюда каждые 4 минуты: держит warm Node/Prisma
// + просыпает Neon endpoint (prevent scale-to-zero). Без этого
// первый SMS после паузы ловит ~2s cold-start.
export async function GET(request: NextRequest) {
  // Vercel Cron автоматически добавляет Authorization: Bearer <CRON_SECRET>
  // если в env проекта установлен CRON_SECRET. Защита от публичного флуда.
  const auth = request.headers.get('authorization') || ''
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Пропускаем шаббат — Neon засыпает, счёт не капает
  if (isShabbatNow()) {
    console.log('⏸ keep-warm skipped: Shabbat')
    return NextResponse.json({ ok: true, skipped: 'shabbat' })
  }

  const t0 = Date.now()
  try {
    // Тонкий SQL чтобы разбудить Neon endpoint и прогреть connection pool
    await prisma.$queryRaw`SELECT 1`
    console.log(`⏱ keep-warm: ${Date.now() - t0}ms`)
    return NextResponse.json({ ok: true, warmMs: Date.now() - t0 })
  } catch (err: any) {
    console.error('keep-warm error:', err?.message)
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 })
  }
}

// ============================================
// POST /api/sms - Twilio Webhook
// ============================================
export async function POST(request: NextRequest) {
  const reqStart = Date.now()
  try {
    // Validate Twilio signature to prevent spoofed requests
    const twilioSignature = request.headers.get('x-twilio-signature') || ''
    const webhookUrl = process.env.TWILIO_WEBHOOK_URL || `${request.nextUrl.origin}/api/sms`

    // Clone the request to read formData without consuming the body
    const formData = await timed('formData', () => request.formData())

    // Build params object for validation
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value as string
    })

    if (!validateTwilioRequest(twilioSignature, webhookUrl, params)) {
      console.warn('Rejected request with invalid Twilio signature')
      return new NextResponse('Forbidden', { status: 403 })
    }

    const from = params['From']
    const body = params['Body']

    if (!from || !body) {
      return createTwiMLResponse('Invalid request')
    }

    // Rate limit by sender phone number
    if (isRateLimited(from)) {
      return createTwiMLResponse('Too many requests. Please wait a moment and try again.')
    }

    console.log(`SMS received and processing`)

    // Параллелим blocked-check + user lookup — они независимы
    const [isBlocked, user] = await timed('blocked+user (parallel)', () =>
      Promise.all([isUserBlocked(from), getOrCreateUser(from)])
    )
    if (isBlocked) {
      // Проверяем, не пытается ли вернуться (START) — unblock AND send full menu
      if (body.trim().toUpperCase() === 'START') {
        await unblockUser(from)
        return createTwiMLResponse(MESSAGES.MENU)
      }
      // Иначе - не отвечаем
      return createTwiMLResponse('')
    }
    const trimmed = body.trim()
    const upperTrimmed = trimmed.toUpperCase()

    // ── Fast HELP intercept — CTIA/carrier compliance auto-reply ──
    if (upperTrimmed === 'HELP') {
      await prisma.query.create({
        data: { userId: user.id, rawMessage: body, parsedIntent: 'HELP', responseText: MESSAGES.HELP, processedAt: new Date() }
      })
      return createTwiMLResponse(MESSAGES.HELP)
    }

    // ── Fast MENU/START intercept — same full feature menu ──
    if (upperTrimmed === 'MENU' || upperTrimmed === 'START' || upperTrimmed === '?') {
      await prisma.query.create({
        data: { userId: user.id, rawMessage: body, parsedIntent: 'HELP', responseText: MESSAGES.MENU, processedAt: new Date() }
      })
      return createTwiMLResponse(MESSAGES.MENU)
    }

    // ── Subscriptions: SUB / SUBSCRIBE / UNSUB / MY SUBS / SUB <topic> [zip] ──
    const subIntent = detectSubIntent(body)
    if (subIntent) {
      const responseText = await handleSubIntent(subIntent, user.id)
      if (responseText) {
        await prisma.query.create({
          data: { userId: user.id, rawMessage: body, parsedCategory: 'subscription', parsedIntent: 'INFO', responseText, processedAt: new Date() }
        })
        return createTwiMLResponse(responseText)
      }
    }

    // ── Mazel Tov menu (view list or get instructions) ──
    const mtMenu = detectMazelTovMenu(body)
    if (mtMenu === 'list') {
      const responseText = await formatMazelTovList(5)
      await prisma.query.create({
        data: { userId: user.id, rawMessage: body, parsedCategory: 'mazel_tov_list', parsedIntent: 'INFO', responseText, processedAt: new Date() }
      })
      return createTwiMLResponse(responseText)
    }
    if (mtMenu === 'add_instructions') {
      const responseText = formatMazelTovInstructions()
      await prisma.query.create({
        data: { userId: user.id, rawMessage: body, parsedCategory: 'mazel_tov_instructions', parsedIntent: 'INFO', responseText, processedAt: new Date() }
      })
      return createTwiMLResponse(responseText)
    }

    // ── Mazel Tov / Simcha submission: "MAZEL TOV <text>" or "SIMCHA <text>" ──
    const mtSubmission = parseMazelTovSubmission(body)
    if (mtSubmission) {
      try {
        await submitMazelTov({
          text: mtSubmission.text,
          type: mtSubmission.type,
          submittedByPhone: from,
        })
        const responseText = `🎊 Thank you! Your mazel tov is pending review.\n\nOnce approved by our team it will be sent to all Mazel Tov subscribers.\n\nReply SUB to see all subscriptions.`
        await prisma.query.create({
          data: { userId: user.id, rawMessage: body, parsedCategory: 'mazel_tov_submission', parsedIntent: 'INFO', responseText, processedAt: new Date() }
        })
        return createTwiMLResponse(responseText)
      } catch (err) {
        console.error('Mazel Tov submission error:', err)
      }
    }

    // ── SHIDDUCH — static response with shidduch resource links ──
    if (upperTrimmed === 'SHIDDUCH' || upperTrimmed === 'SHIDDUCHIM') {
      await prisma.query.create({
        data: { userId: user.id, rawMessage: body, parsedCategory: 'shidduch', parsedIntent: 'INFO', responseText: SHIDDUCH_RESPONSE, processedAt: new Date() }
      })
      return createTwiMLResponse(SHIDDUCH_RESPONSE)
    }

    // ── CHARITY + ZIP — zip-aware 2-option menu (seek/offer help) ──
    const charityZipMatch = trimmed.match(/^(?:charity|tzedaka|tzedakah)\s+(\d{5})\s*$/i)
    if (charityZipMatch) {
      const zip = charityZipMatch[1]
      const responseText = await handleCharityWithZip(user.id, zip)
      await prisma.query.create({ data: { userId: user.id, rawMessage: body, parsedCategory: 'charity', parsedZip: zip, parsedIntent: 'SEARCH', responseText, processedAt: new Date() } })
      return createTwiMLResponse(responseText)
    }

    // ── CHARITY freeform post — "charity John 11213 needs rent $500 Zelle:... 718-555-1234" ──
    if (/^charity\s+.{10,}/i.test(trimmed) && /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(trimmed) && /\d{5}/.test(trimmed)) {
      const parsed = parseFreeformCharityRequest(trimmed)
      if (parsed && parsed.name && parsed.phone) {
        const responseText = await postFreeformCharityRequest(parsed)
        await prisma.query.create({ data: { userId: user.id, rawMessage: body, parsedCategory: 'charity', parsedZip: parsed.zipCode, parsedArea: parsed.area, parsedIntent: 'SEARCH', responseText, processedAt: new Date() } })
        return createTwiMLResponse(responseText)
      }
    }

    // ── CHARITY plain — ask for ZIP first ──
    if (upperTrimmed === 'CHARITY' || upperTrimmed === 'TZEDAKA' || upperTrimmed === 'TZEDAKAH') {
      const responseText = await handleCharityNoZip(user.id)
      await prisma.query.create({ data: { userId: user.id, rawMessage: body, parsedCategory: 'charity', parsedIntent: 'SEARCH', responseText, processedAt: new Date() } })
      return createTwiMLResponse(responseText)
    }

    // ── Active charity session continuation (reply with ZIP or menu option) ──
    if (await hasActiveCharitySession(user.id)) {
      const responseText = await handleCharityReply(user.id, from, trimmed)
      if (responseText) {
        await prisma.query.create({ data: { userId: user.id, rawMessage: body, parsedCategory: 'charity', parsedIntent: 'SEARCH', responseText, processedAt: new Date() } })
        return createTwiMLResponse(responseText)
      }
    }

    // ── JOB + ZIP — zip-aware 2-option menu (Seekers/Posters) ──
    const jobZipMatch = trimmed.match(/^jobs?\s+(\d{5})\s*$/i)
    if (jobZipMatch) {
      const zip = jobZipMatch[1]
      const responseText = await handleJobZipEntry(user.id, from, zip)
      await prisma.query.create({ data: { userId: user.id, rawMessage: body, parsedIntent: 'JOBS', responseText, processedAt: new Date() } })
      return createTwiMLResponse(responseText)
    }

    // ── JOB freeform post — "job cashier 11211 full $20/hr John 718-555-1234" ──
    if (/^jobs?\s+.{10,}/i.test(trimmed) && /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(trimmed)) {
      const parsed = parseFreeformJobPost(trimmed)
      if (parsed && parsed.position && parsed.phone) {
        const responseText = await postFreeformJob(from, parsed)
        await prisma.query.create({ data: { userId: user.id, rawMessage: body, parsedIntent: 'JOBS', responseText, processedAt: new Date() } })
        return createTwiMLResponse(responseText)
      }
    }

    // ── JOBS interactive menu (plain "JOB" / "JOBS") ──
    if (upperTrimmed === 'JOBS' || upperTrimmed === 'JOB' || upperTrimmed === 'MENU JOBS') {
      const responseText = await handleJobsMenu(user.id, from, 'JOBS')
      if (responseText) {
        await prisma.query.create({ data: { userId: user.id, rawMessage: body, parsedIntent: 'JOBS', responseText, processedAt: new Date() } })
        return createTwiMLResponse(responseText)
      }
    }

    // ── Check if user is in active JOBS menu and continue flow ──
    if (await hasActiveJobsSession(user.id)) {
      const menuResponse = await handleJobsMenu(user.id, from, trimmed)
      if (menuResponse) {
        await prisma.query.create({ data: { userId: user.id, rawMessage: body, parsedIntent: 'JOBS', responseText: menuResponse, processedAt: new Date() } })
        return createTwiMLResponse(menuResponse)
      }
    }

    // ── WORK commands — register as worker ──
    const workCmd = parseWorkCommand(trimmed)
    if (workCmd.action === 'stop') {
      const responseText = await stopWorker(from)
      await prisma.query.create({ data: { userId: user.id, rawMessage: body, parsedIntent: 'JOBS', responseText, processedAt: new Date() } })
      return createTwiMLResponse(responseText)
    }
    if (workCmd.action === 'renew') {
      const responseText = await renewWorker(from)
      await prisma.query.create({ data: { userId: user.id, rawMessage: body, parsedIntent: 'JOBS', responseText, processedAt: new Date() } })
      return createTwiMLResponse(responseText)
    }
    if (workCmd.action === 'register' && workCmd.category) {
      const responseText = await registerWorker(from, workCmd.category, workCmd.area, workCmd.lang)
      await prisma.query.create({ data: { userId: user.id, rawMessage: body, parsedIntent: 'JOBS', responseText, processedAt: new Date() } })
      return createTwiMLResponse(responseText)
    }

    // ── JOB command — post a job opening ──
    const jobCmd = parseJobCommand(trimmed)
    if (jobCmd) {
      const responseText = await postJob(from, jobCmd.category!, jobCmd.area, jobCmd.jobType, jobCmd.lang)
      await prisma.query.create({ data: { userId: user.id, rawMessage: body, parsedIntent: 'JOBS', responseText, processedAt: new Date() } })
      return createTwiMLResponse(responseText)
    }

    // ── HIRE command — find workers ──
    const hireCmd = parseHireCommand(trimmed)
    if (hireCmd) {
      const responseText = await searchWorkers(hireCmd.category, hireCmd.area)
      await prisma.query.create({ data: { userId: user.id, rawMessage: body, parsedIntent: 'JOBS', responseText, processedAt: new Date() } })
      return createTwiMLResponse(responseText)
    }

    // ── Check if worker/job poster just registered and is sending description ──
    const workerDesc = await saveWorkerDescription(from, trimmed)
    if (workerDesc) {
      await prisma.query.create({ data: { userId: user.id, rawMessage: body, parsedIntent: 'JOBS', responseText: workerDesc, processedAt: new Date() } })
      return createTwiMLResponse(workerDesc)
    }
    const jobDesc = await saveJobDescription(from, trimmed)
    if (jobDesc) {
      await prisma.query.create({ data: { userId: user.id, rawMessage: body, parsedIntent: 'JOBS', responseText: jobDesc, processedAt: new Date() } })
      return createTwiMLResponse(jobDesc)
    }

    // ── Check for active specials session (DB-based for serverless) ──
    const num = parseInt(trimmed)
    if (num >= 1 && num <= 20) {
      // Check if user's last query (within 10 min) was a specials list
      const recentSpecials = await prisma.query.findFirst({
        where: {
          userId: user.id,
          rawMessage: { startsWith: '__SPECIALS_LIST__' },
          createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
      })
      if (recentSpecials) {
        // Reconstruct the same store list that was shown
        const storeList = getSpecialsStoreList(recentSpecials.parsedArea)
        const store = getStoreByIndex(num - 1, storeList)
        if (store) {
          const specials = await fetchStoreSpecials(store)
          const responseText = formatSpecialsForSMS(store, specials)
          await prisma.query.create({
            data: {
              userId: user.id,
              rawMessage: body,
              parsedCategory: 'specials',
              parsedIntent: 'SEARCH',
              responseText,
              processedAt: new Date(),
            }
          })
          return createTwiMLResponse(responseText)
        }
      }
    }

    // ── Jewish calendar commands: SFIRA / CANDLE / ROSH CHODESH / FAST / BIRKAT LEVANA / ZMAN menu ──
    // Runs BEFORE zmanim intercept so 'ZMAN' alone shows the menu, while 'ZMANIM' still works.
    const calendarIntent = detectCalendarIntent(body)
    if (calendarIntent) {
      let responseText = ''
      let category = ''
      let zmanimZipForLogging: string | null = null
      switch (calendarIntent) {
        case 'zman_menu':
          responseText = formatZmanMenu()
          category = 'zman_menu'
          break
        case 'sfira':
          responseText = formatSfiratHaOmer() + subscribeHint('sfira')
          category = 'sfira'
          break
        case 'candle': {
          const zipMatch = body.match(/\b(\d{5})\b/)
          let candleZip = zipMatch ? zipMatch[1] : null
          if (!candleZip) candleZip = await getUserDefaultZip(from)
          responseText = formatCandleLighting(candleZip)
          category = 'candle_lighting'
          zmanimZipForLogging = candleZip
          break
        }
        case 'rosh_chodesh':
          responseText = formatRoshChodesh() + subscribeHint('rosh_chodesh')
          category = 'rosh_chodesh'
          break
        case 'fast':
          responseText = formatFasts()
          category = 'fast'
          break
        case 'birkat_levana':
          responseText = formatBirkatHalevana() + subscribeHint('birkat_levana')
          category = 'birkat_levana'
          break
      }
      await prisma.query.create({
        data: { userId: user.id, rawMessage: body, parsedCategory: category, parsedZip: zmanimZipForLogging, parsedIntent: 'SEARCH', responseText, processedAt: new Date() },
      })
      return createTwiMLResponse(responseText)
    }

    // ── Zmanim (halachic times) — fast intercept before AI parser ──
    const zmanimKeywords = ['zman', 'zmanim', 'zmanei', 'זמנים', 'זמני', 'זמן']
    const bodyLower = body.toLowerCase().trim()
    const isZmanimQuery = zmanimKeywords.some(kw => bodyLower.includes(kw))

    if (isZmanimQuery) {
      const zipMatch = body.match(/\b(\d{5})\b/)
      let zmanimZip = zipMatch ? zipMatch[1] : null
      if (!zmanimZip) zmanimZip = await getUserDefaultZip(from)
      const responseText = formatZmanimForSMS(zmanimZip || '11213')
      await prisma.query.create({
        data: { userId: user.id, rawMessage: body, parsedCategory: 'zmanim', parsedZip: zmanimZip, parsedIntent: 'SEARCH', responseText, processedAt: new Date() }
      })
      return createTwiMLResponse(responseText)
    }

    // ── Minyan / Shul search (before AI parser — fast keyword detection) ──
    const minyanKeywords = ['mincha', 'minchah', 'shacharis', 'shachrit', 'shachris', 'maariv', 'mariv', 'arvit', 'davening', 'minyan', 'shul', 'שחרית', 'מנחה', 'מעריב', 'שול', 'מנין']
    const isMinyanQuery = minyanKeywords.some(kw => bodyLower.includes(kw))

    if (isMinyanQuery) {
      const tefillah = detectTefillah(body)

      // Check if searching by shul name
      const shulByName = searchShulByName(body.replace(/\d{5}/g, '').replace(/mincha|shacharis|maariv|minyan|davening/gi, '').trim())
      if (shulByName) {
        const responseText = formatShulForSMS(shulByName)
        await prisma.query.create({
          data: { userId: user.id, rawMessage: body, parsedCategory: 'minyan', parsedIntent: 'SEARCH', responseText, businessCount: 1, processedAt: new Date() }
        })
        return createTwiMLResponse(responseText)
      }

      // Extract ZIP from message
      const zipMatch = body.match(/\b\d{5}\b/)
      let shuls = zipMatch ? searchShulsByZip(zipMatch[0]) : []

      // Try area if no ZIP
      if (shuls.length === 0) {
        const areaWords = body.replace(/mincha|shacharis|maariv|minyan|davening|shul|שחרית|מנחה|מעריב|שול|מנין/gi, '').trim()
        if (areaWords) {
          const normalizedArea = normalizeArea(areaWords) || normalizeCity(areaWords)
          if (normalizedArea) {
            shuls = searchShulsByArea(normalizedArea)
          }
        }
      }

      // Default to Crown Heights if no location specified
      if (shuls.length === 0 && !zipMatch) {
        const defaultZip = await getUserDefaultZip(from)
        if (defaultZip) {
          shuls = searchShulsByZip(defaultZip)
        }
        if (shuls.length === 0) {
          shuls = searchShulsByArea('Crown Heights')
        }
      }

      const responseText = formatMinyanForSMS(shuls, tefillah)
      await prisma.query.create({
        data: { userId: user.id, rawMessage: body, parsedCategory: 'minyan', parsedZip: zipMatch?.[0], parsedIntent: 'SEARCH', responseText, businessCount: shuls.length, processedAt: new Date() }
      })
      return createTwiMLResponse(responseText)
    }

    // ── Fast regex parser: skip OpenAI for simple "<category> <zip>" queries ──
    // Saves ~1.2–2.6 sec on common patterns. Falls back to AI if nothing matched.
    const fastParsed = fastParse(body)
    const parsed = fastParsed
      ? { ...fastParsed, city: null, needsMoreInfo: false, missingFields: [] }
      : await timed('OpenAI parseQuery', () => parseQuery(body))
    console.log(fastParsed ? '⚡ Fast-parsed:' : '🤖 AI-parsed:', parsed)

    // Обрабатываем по интенту
    let responseText = ''

    switch (parsed.intent) {
      case 'help':
        // AI-detected "help me / what can I do" → show feature menu, not compliance text
        responseText = MESSAGES.MENU
        break

      case 'stop':
        await blockUser(from)
        responseText = MESSAGES.STOP
        break

      case 'info':
        responseText = MESSAGES.WELCOME
        break

      case 'add_business':
        responseText = MESSAGES.ADD_BUSINESS
        break

      case 'specials': {
        // Filter stores by area or ZIP if provided
        const area = parsed.area || (parsed.zipCode ? getAreaByZip(parsed.zipCode) : null)
        const storeList = getSpecialsStoreList(area)
        const areaLabel = area || undefined
        responseText = formatStoreListForSMS(storeList, areaLabel)
        // Mark this query so we recognize number replies as store selections
        await prisma.query.create({
          data: {
            userId: user.id,
            rawMessage: '__SPECIALS_LIST__' + body,
            parsedCategory: 'specials',
            parsedArea: area,
            parsedZip: parsed.zipCode,
            parsedIntent: 'SEARCH',
            responseText,
            processedAt: new Date(),
          }
        })
        return createTwiMLResponse(responseText)
      }

      case 'search':
        responseText = await timed('handleSearch', () => handleSearch(user.id, from, body, parsed))
        break

      default: {
        // Если AI не понял — попробуем keyword matching на сыром сообщении
        const keywordFallback = matchKeywordToCategory(body)
        if (keywordFallback) {
          // Found a keyword match — treat as search
          const fixedParsed = { ...parsed, intent: 'search' as const, category: keywordFallback }
          responseText = await handleSearch(user.id, from, body, fixedParsed)
        } else {
          responseText = MESSAGES.NEED_MORE_INFO
        }
      }
    }

    // Сохраняем запрос в базу (best-effort, не ломаем ответ если лог не записался)
    try {
      const upperIntent = String(parsed.intent || 'unknown').toUpperCase()
      // Map any unknown value to UNKNOWN so Prisma doesn't reject invalid enum
      const validIntents = new Set(['SEARCH','HELP','STOP','INFO','SPECIALS','JOBS','UNKNOWN'])
      const safeIntent = validIntents.has(upperIntent) ? upperIntent : 'UNKNOWN'
      await prisma.query.create({
        data: {
          userId: user.id,
          rawMessage: body,
          parsedCategory: parsed.category,
          parsedZip: parsed.zipCode,
          parsedArea: parsed.area,
          parsedIntent: safeIntent as any,
          responseText,
          processedAt: new Date(),
        }
      })
    } catch (logErr: any) {
      console.error('⚠️ Query log write failed (non-fatal):', logErr?.code, logErr?.message)
    }

    console.log(`⏱ TOTAL request: ${Date.now() - reqStart}ms`)
    return createTwiMLResponse(responseText)

  } catch (error: any) {
    console.log(`⏱ TOTAL request (error): ${Date.now() - reqStart}ms`)
    console.error('❌ SMS processing error')
    console.error('  name:', error?.name)
    console.error('  code:', error?.code)
    console.error('  clientVersion:', error?.clientVersion)
    console.error('  message:', error?.message)
    console.error('  meta:', JSON.stringify(error?.meta))
    console.error('  stack:', error?.stack)
    return createTwiMLResponse(MESSAGES.ERROR)
  }
}

// ============================================
// Обработка поискового запроса
// ============================================
async function handleSearch(
  userId: string,
  phone: string,
  rawMessage: string,
  parsed: Awaited<ReturnType<typeof parseQuery>>
): Promise<string> {
  try {
    return await handleSearchInner(userId, phone, rawMessage, parsed)
  } catch (error: any) {
    console.error('handleSearch DB error:')
    console.error('  name:', error?.name)
    console.error('  code:', error?.code)
    console.error('  message:', error?.message)
    console.error('  meta:', JSON.stringify(error?.meta))
    return `⚠️ Business search is temporarily unavailable.\nPlease try again in a few minutes.\n\nMinyan times, specials, and HELP still work.`
  }
}

async function handleSearchInner(
  userId: string,
  phone: string,
  rawMessage: string,
  parsed: Awaited<ReturnType<typeof parseQuery>>
): Promise<string> {

  // Shabbat mode disabled — service runs 24/7
  // TODO: re-enable when needed
  // const zipForShabbat = parsed.zipCode || await getUserDefaultZip(phone)
  // const isShabbat = await isShabbatWithBuffer(zipForShabbat ?? undefined)

  // ── Direct business name match: prefer user's ZIP/area but fall back to all ──
  if (parsed.businessName && !parsed.category) {
    const defaultZipForName = parsed.zipCode || await getUserDefaultZip(phone)
    const directMatches = await searchBusinesses({
      businessName: parsed.businessName,
      zipCode: defaultZipForName,
      area: parsed.area,
      limit: 3,
    })
    if (directMatches.length >= 1 && directMatches.length <= 3) {
      // Found exact business — no need for ZIP
      const query = await prisma.query.create({
        data: {
          userId, rawMessage,
          parsedCategory: parsed.category,
          parsedZip: parsed.zipCode,
          parsedArea: parsed.area,
          parsedIntent: 'SEARCH',
          businessCount: directMatches.length,
          processedAt: new Date(),
        }
      })
      await recordLeads(query.id, userId, directMatches.map(b => b.id))
      return formatBusinessResponse(directMatches, parsed.businessName)
    }
  }

  // Если нет локации - пробуем взять дефолтную
  let zipCode = parsed.zipCode
  let area = parsed.area

  if (!zipCode && !area) {
    const defaultZip = await getUserDefaultZip(phone)
    if (defaultZip) {
      zipCode = defaultZip
    }
  }

  // ── Keyword matching on raw message BEFORE any checks ──
  // e.g. "shower door 11205" → category = glass_mirror
  let category = parsed.category
  if (category) {
    const keywordCat = matchKeywordToCategory(category)
    if (keywordCat) {
      category = keywordCat
    } else {
      const normalized = normalizeCategory(category)
      category = normalized.category
    }
  }
  if (!category) {
    const keywordCat = matchKeywordToCategory(rawMessage)
    if (keywordCat) category = keywordCat
  }
  if (!category && parsed.businessName) {
    const keywordCat = matchKeywordToCategory(parsed.businessName)
    if (keywordCat) category = keywordCat
  }

  // Если всё ещё нет категории и имени бизнеса - просим уточнить
  if (!category && !parsed.category && !parsed.businessName) {
    return MESSAGES.NEED_MORE_INFO
  }

  console.log(`🔍 SEARCH DEBUG: category=${category}, businessName=${parsed.businessName}, zip=${zipCode}, area=${area}`)
  if (area) {
    const normalizedArea = normalizeArea(area)
    if (normalizedArea) area = normalizedArea
  }

  console.log(`🔍 AFTER FUZZY: category=${category}, area=${area}, zip=${zipCode}, businessName=${parsed.businessName}`)

  // Step 1: Search with location filter
  let businesses = await timed('search step1 (with location)', () => searchBusinesses({
    category,
    zipCode,
    area,
    businessName: parsed.businessName,
    limit: 3,
  }))

  // Step 2: If not found — retry WITHOUT location (ZIP/area often missing in DB)
  if (businesses.length === 0) {
    console.log('🔍 Step 2: retry without location filter')
    businesses = await timed('search step2 (no location)', () => searchBusinesses({
      category,
      businessName: parsed.businessName,
      limit: 3,
    }))
  }

  // Step 3: Fuzzy search
  if (businesses.length === 0 && (category || parsed.businessName)) {
    console.log('🔍 Step 3: fuzzy search')
    businesses = await timed('search step3 (fuzzy)', () => searchBusinessesFuzzy({
      category,
      businessName: parsed.businessName,
      limit: 3,
    }))
  }

  // Step 4: Treat category as business name
  if (businesses.length === 0 && parsed.category && !parsed.businessName) {
    console.log('🔍 Step 4: try category as business name')
    businesses = await timed('search step4 (cat as name)', () => searchBusinesses({
      businessName: parsed.category,
      limit: 3,
    }))
  }

  // Step 5: Try raw message as business name
  if (businesses.length === 0) {
    console.log('🔍 Step 5: try raw message as business name')
    businesses = await timed('search step5 (raw as name)', () => searchBusinesses({
      businessName: rawMessage.replace(/\d{5}/g, '').trim(),
      limit: 3,
    }))
  }

  // Если нашли - сохраняем ZIP как дефолтный
  if (zipCode && businesses.length > 0) {
    await setUserDefaultZip(phone, zipCode)
  }

  // Создаём запись запроса и лидов
  const query = await prisma.query.create({
    data: {
      userId,
      rawMessage,
      parsedCategory: parsed.category,
      parsedZip: zipCode,
      parsedArea: area,
      parsedIntent: 'SEARCH',
      businessCount: businesses.length,
      processedAt: new Date(),
    }
  })

  if (businesses.length > 0) {
    await timed('recordLeads', () => recordLeads(
      query.id,
      userId,
      businesses.map(b => b.id)
    ))
  }

  // Форматируем ответ
  return formatBusinessResponse(
    businesses,
    parsed.category || parsed.businessName || 'results'
  )
}

// ============================================
// Get store list filtered by area (or all stores)
// ============================================
function getSpecialsStoreList(area: string | null | undefined): Store[] {
  if (area) {
    const filtered = getStoresByArea(area)
    if (filtered.length > 0) return filtered
  }
  return getAllStores()
}

// ============================================
// Создание TwiML ответа
// ============================================
function createTwiMLResponse(message: string): NextResponse {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`

  return new NextResponse(twiml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
  })
}

// ============================================
// Экранирование XML
// ============================================
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
