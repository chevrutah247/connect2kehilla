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
import { parseWorkCommand, parseJobCommand, parseHireCommand, registerWorker, saveWorkerDescription, postJob, saveJobDescription, renewWorker, stopWorker, searchWorkers, JOBS_HELP } from '@/lib/workers'
import { handleJobsMenu, hasActiveJobsSession, JOBS_MAIN_MENU } from '@/lib/jobs-menu'
import { detectTefillah, searchShulsByZip, searchShulsByArea, searchShulByName, formatMinyanForSMS, formatShulForSMS } from '@/lib/minyanim'
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
// POST /api/sms - Twilio Webhook
// ============================================
export async function POST(request: NextRequest) {
  try {
    // Validate Twilio signature to prevent spoofed requests
    const twilioSignature = request.headers.get('x-twilio-signature') || ''
    const webhookUrl = process.env.TWILIO_WEBHOOK_URL || `${request.nextUrl.origin}/api/sms`

    // Clone the request to read formData without consuming the body
    const formData = await request.formData()

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

    // Проверяем, заблокирован ли пользователь (STOP)
    const isBlocked = await isUserBlocked(from)
    if (isBlocked) {
      // Проверяем, не пытается ли вернуться (START)
      if (body.trim().toUpperCase() === 'START') {
        await unblockUser(from)
        return createTwiMLResponse(MESSAGES.WELCOME)
      }
      // Иначе - не отвечаем
      return createTwiMLResponse('')
    }

    // Получаем или создаём пользователя
    const user = await getOrCreateUser(from)
    const trimmed = body.trim()
    const upperTrimmed = trimmed.toUpperCase()

    // ── Fast HELP/? intercept — before AI parser, before Twilio can swallow it ──
    if (upperTrimmed === 'HELP' || upperTrimmed === '?' || upperTrimmed === 'MENU') {
      await prisma.query.create({
        data: { userId: user.id, rawMessage: body, parsedIntent: 'HELP', responseText: MESSAGES.HELP, processedAt: new Date() }
      })
      return createTwiMLResponse(MESSAGES.HELP)
    }

    // ── JOBS interactive menu ──
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

    // ── Minyan / Shul search (before AI parser — fast keyword detection) ──
    const minyanKeywords = ['mincha', 'minchah', 'shacharis', 'shachrit', 'shachris', 'maariv', 'mariv', 'arvit', 'davening', 'minyan', 'shul', 'שחרית', 'מנחה', 'מעריב', 'שול', 'מנין']
    const bodyLower = body.toLowerCase().trim()
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

    // Парсим сообщение через AI
    const parsed = await parseQuery(body)
    console.log('🤖 Parsed:', parsed)

    // Обрабатываем по интенту
    let responseText = ''

    switch (parsed.intent) {
      case 'help':
        responseText = MESSAGES.HELP
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
        responseText = await handleSearch(user.id, from, body, parsed)
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

    // Сохраняем запрос в базу
    await prisma.query.create({
      data: {
        userId: user.id,
        rawMessage: body,
        parsedCategory: parsed.category,
        parsedZip: parsed.zipCode,
        parsedArea: parsed.area,
        parsedIntent: parsed.intent.toUpperCase() as any,
        responseText,
        processedAt: new Date(),
      }
    })

    return createTwiMLResponse(responseText)

  } catch (error) {
    console.error('❌ SMS processing error:', error)
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
  
  // Shabbat mode disabled — service runs 24/7
  // TODO: re-enable when needed
  // const zipForShabbat = parsed.zipCode || await getUserDefaultZip(phone)
  // const isShabbat = await isShabbatWithBuffer(zipForShabbat ?? undefined)

  // ── Direct business name match: skip ZIP requirement if unique match ──
  if (parsed.businessName && !parsed.category) {
    const directMatches = await searchBusinesses({
      businessName: parsed.businessName,
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
  let businesses = await searchBusinesses({
    category,
    zipCode,
    area,
    businessName: parsed.businessName,
    limit: 3,
  })

  // Step 2: If not found — retry WITHOUT location (ZIP/area often missing in DB)
  if (businesses.length === 0) {
    console.log('🔍 Step 2: retry without location filter')
    businesses = await searchBusinesses({
      category,
      businessName: parsed.businessName,
      limit: 3,
    })
  }

  // Step 3: Fuzzy search
  if (businesses.length === 0 && (category || parsed.businessName)) {
    console.log('🔍 Step 3: fuzzy search')
    businesses = await searchBusinessesFuzzy({
      category,
      businessName: parsed.businessName,
      limit: 3,
    })
  }

  // Step 4: Treat category as business name
  if (businesses.length === 0 && parsed.category && !parsed.businessName) {
    console.log('🔍 Step 4: try category as business name')
    businesses = await searchBusinesses({
      businessName: parsed.category,
      limit: 3,
    })
  }

  // Step 5: Try raw message as business name
  if (businesses.length === 0) {
    console.log('🔍 Step 5: try raw message as business name')
    businesses = await searchBusinesses({
      businessName: rawMessage.replace(/\d{5}/g, '').trim(),
      limit: 3,
    })
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
    await recordLeads(
      query.id,
      userId,
      businesses.map(b => b.id)
    )
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
