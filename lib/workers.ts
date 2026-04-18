// lib/workers.ts — Workers Directory & Job Board SMS logic

import prisma from './db'
import { hashPhone } from './users'

const WORKER_DURATION_DAYS = 30
const JOB_DURATION_DAYS = 30

// ── Known categories with aliases (typo-tolerant) ──
const CATEGORY_ALIASES: Record<string, string> = {
  // Women
  'babysitter': 'babysitter', 'baby sitter': 'babysitter', 'nanny': 'babysitter', 'babysiter': 'babysitter', 'sitter': 'babysitter',
  'cleaning': 'cleaning', 'cleaner': 'cleaning', 'cleaning lady': 'cleaning', 'housekeeper': 'cleaning', 'clean': 'cleaning',
  'para': 'para', 'paraprofessional': 'para', 'special needs': 'para', 'para professional': 'para',
  'home attendant': 'home_attendant', 'homeattendant': 'home_attendant', 'home aide': 'home_attendant', 'caregiver': 'home_attendant', 'aide': 'home_attendant', 'home care': 'home_attendant',
  'cook': 'cook', 'chef': 'cook', 'cooking': 'cook',
  // Men
  'driver': 'driver', 'delivery': 'driver', 'deliver': 'driver', 'driving': 'driver',
  'mover': 'mover', 'moving': 'mover', 'hauler': 'mover', 'shlepper': 'mover', 'schlepper': 'mover',
  'handyman': 'handyman', 'handy man': 'handyman', 'handiman': 'handyman', 'maintenance': 'handyman',
  'painter': 'painter', 'painting': 'painter', 'paint': 'painter',
  'helper': 'helper', 'general labor': 'helper', 'labor': 'helper', 'worker': 'helper',
  // Both
  'tutor': 'tutor', 'teacher': 'tutor', 'tutoring': 'tutor',
}

// Job types with aliases
const JOB_TYPE_ALIASES: Record<string, string> = {
  'full-time': 'full-time', 'fulltime': 'full-time', 'full time': 'full-time', 'ft': 'full-time', 'permanent': 'full-time',
  'part-time': 'part-time', 'parttime': 'part-time', 'part time': 'part-time', 'pt': 'part-time',
  'one-time': 'one-time', 'onetime': 'one-time', 'one time': 'one-time', 'once': 'one-time', 'temporary': 'one-time', 'temp': 'one-time',
  'hourly': 'hourly', 'by hour': 'hourly', 'per hour': 'hourly',
}

// Hebrew/Yiddish aliases
const HEBREW_CATEGORIES: Record<string, string> = {
  'בייביסיטער': 'babysitter', 'שמרטף': 'babysitter',
  'ניקיון': 'cleaning', 'מנקה': 'cleaning',
  'פארא': 'para',
  'עוזרת בית': 'home_attendant', 'מטפלת': 'home_attendant',
  'נהג': 'driver', 'משלוח': 'driver',
  'סבל': 'mover',
  'צבעי': 'painter',
  'מורה': 'tutor',
  'טבח': 'cook',
}

function normalizeCategory(input: string): string {
  const lower = input.toLowerCase().trim()
  return CATEGORY_ALIASES[lower] || HEBREW_CATEGORIES[input.trim()] || lower
}

function normalizeJobType(input: string): string {
  const lower = input.toLowerCase().trim()
  return JOB_TYPE_ALIASES[lower] || lower
}

const CATEGORY_LIST = {
  women: ['babysitter', 'cleaning', 'para', 'home_attendant', 'cook', 'tutor'],
  men: ['driver', 'mover', 'handyman', 'painter', 'helper', 'tutor'],
}

export const CATEGORY_LABELS: Record<string, string> = {
  'babysitter': '👶 Babysitter / Nanny',
  'cleaning': '🧹 Cleaning Lady',
  'para': '🧩 Para (Special Needs)',
  'home_attendant': '🏠 Home Attendant / Aide',
  'cook': '👩‍🍳 Cook / Chef',
  'driver': '🚗 Driver / Delivery',
  'mover': '📦 Mover / Hauler',
  'handyman': '🔧 Handyman',
  'painter': '🎨 Painter',
  'helper': '💪 Helper / General Labor',
  'tutor': '📚 Tutor / Teacher',
}

// ── HELP messages ──

export const JOBS_HELP = `📋 CONNECT2KEHILLA — Jobs & Workers

👷 LOOKING FOR WORK? Register yourself:
Text: WORK [category] [area]
Example: "WORK babysitter Williamsburg"
Example: "WORK driver Crown Heights"

You'll be asked for a description.
Active for 30 days. Free!

🏢 HIRING? Find available workers:
Text: HIRE [category] [area]
Example: "HIRE cleaning Flatbush"
Example: "HIRE mover 11211"

📋 POST A JOB OPENING:
Text: JOB [category] [area] [type]
Example: "JOB babysitter Williamsburg part-time"
Types: full-time, part-time, one-time, hourly

👩 WOMEN CATEGORIES:
👶 Babysitter  🧹 Cleaning  🧩 Para
🏠 Home Attendant  👩‍🍳 Cook  📚 Tutor

👨 MEN CATEGORIES:
🚗 Driver  📦 Mover  🔧 Handyman
🎨 Painter  💪 Helper  📚 Tutor

📌 COMMANDS:
• WORK RENEW — extend 30 days
• WORK STOP — remove yourself
• JOBS — this menu

All services are FREE!`

// ── Multilingual messages ──
const MSGS = {
  en: {
    registered: (cat: string, area: string, expires: string) =>
      `✅ You're listed as ${CATEGORY_LABELS[cat] || cat} in ${area}!\n\n⏰ Active until ${expires}\n\nNow reply with a short description:\n• What can you do?\n• Experience?\n• Availability?\n• Full-time / Part-time / Hourly?\n\n(Send 1 message)`,
    descriptionSaved: (cat: string, area: string, expires: string, phone: string) =>
      `✅ Profile complete!\n\n${CATEGORY_LABELS[cat] || cat}\n📱 ${phone}\n📍 ${area}\n⏰ Active until ${expires}\n\nText WORK RENEW to extend\nText WORK STOP to remove`,
    renewed: (expires: string) =>
      `✅ Renewed! Active until ${expires}.\nText WORK STOP to remove.`,
    stopped: `❌ Removed from workers list.\nText WORK [category] [area] to re-register.`,
    alreadyRegistered: (cat: string, area: string, expires: string) =>
      `You're already listed as ${CATEGORY_LABELS[cat] || cat} in ${area}.\n⏰ Active until ${expires}.\n\nText WORK RENEW to extend\nText WORK STOP to remove`,
    notFound: `You don't have an active worker listing.\nText JOBS for instructions.`,
    jobPosted: (cat: string, area: string, jobType: string, expires: string) =>
      `✅ Job posted!\n\n${CATEGORY_LABELS[cat] || cat} • ${jobType}\n📍 ${area}\n⏰ Active until ${expires}\n\nNow reply with job details:\n• Hours & schedule\n• Pay rate\n• Requirements\n\n(Send 1 message)`,
    jobDescSaved: (cat: string, area: string, expires: string) =>
      `✅ Job listing complete!\n${CATEGORY_LABELS[cat] || cat} in ${area}\n⏰ Active until ${expires}\nSubscribers will be notified.`,
  },
  he: {
    registered: (cat: string, area: string, expires: string) =>
      `✅ !נרשמת כ${CATEGORY_LABELS[cat] || cat} ב${area}\n⏰ פעיל עד ${expires}\n\nענה עם תיאור קצר: ניסיון, זמינות, סוג עבודה`,
    descriptionSaved: (cat: string, area: string, expires: string, phone: string) =>
      `✅ !הפרופיל נשמר\n${CATEGORY_LABELS[cat] || cat}\n📱 ${phone}\n📍 ${area}\n⏰ פעיל עד ${expires}`,
    renewed: (expires: string) => `✅ הוארך! פעיל עד ${expires}`,
    stopped: `❌ הוסרת מהרשימה. שלח WORK להרשמה מחדש.`,
    alreadyRegistered: (cat: string, area: string, expires: string) => `כבר רשום כ${cat} ב${area}. פעיל עד ${expires}.`,
    notFound: `אין רישום פעיל. שלח JOBS להוראות.`,
    jobPosted: (cat: string, area: string, jobType: string, expires: string) =>
      `✅ !המשרה פורסמה\n${cat} • ${jobType} • ${area}\n⏰ עד ${expires}\n\nענה עם פרטי המשרה:`,
    jobDescSaved: (cat: string, area: string, expires: string) =>
      `✅ !המשרה הושלמה\n${cat} ב${area}\n⏰ עד ${expires}`,
  },
  yi: {
    registered: (cat: string, area: string, expires: string) =>
      `✅ !רעגיסטרירט אלס ${CATEGORY_LABELS[cat] || cat} אין ${area}\n⏰ אקטיוו ביז ${expires}\n\nשרייבט א קורצע באשרייבונג:`,
    descriptionSaved: (cat: string, area: string, expires: string, phone: string) =>
      `✅ !פראפיל געראטעוועט\n${CATEGORY_LABELS[cat] || cat}\n📱 ${phone}\n📍 ${area}\n⏰ ביז ${expires}`,
    renewed: (expires: string) => `✅ פארלענגערט! ביז ${expires}`,
    stopped: `❌ אראפגענומען פון ליסטע.`,
    alreadyRegistered: (cat: string, area: string, expires: string) => `שוין רעגיסטרירט אלס ${cat} אין ${area}. ביז ${expires}.`,
    notFound: `קיין אקטיווע רעגיסטראציע. שלח JOBS פאר אינסטרוקציעס.`,
    jobPosted: (cat: string, area: string, jobType: string, expires: string) =>
      `✅ !משרה פארעפנטלעכט\n${cat} • ${jobType} • ${area}\n⏰ ביז ${expires}`,
    jobDescSaved: (cat: string, area: string, expires: string) =>
      `✅ !משרה פארטיק\n${cat} אין ${area}\n⏰ ביז ${expires}`,
  },
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
}

function detectLang(text: string): 'en' | 'he' | 'yi' {
  if (/[ײױ]|אַ|אָ|ארבעט/.test(text)) return 'yi'
  if (/[\u0590-\u05FF]/.test(text)) return 'he'
  return 'en'
}

function getMsg(lang: string) { return MSGS[lang as keyof typeof MSGS] || MSGS.en }

// ── Parse WORK command ──
export function parseWorkCommand(text: string): { action: 'register' | 'renew' | 'stop' | null; category: string | null; area: string | null; lang: 'en' | 'he' | 'yi' } {
  const trimmed = text.trim()
  const upper = trimmed.toUpperCase()
  const lang = detectLang(trimmed)

  if (upper.startsWith('WORK STOP') || /עבודה סטופ/.test(trimmed)) return { action: 'stop', category: null, area: null, lang }
  if (upper.startsWith('WORK RENEW') || /עבודה חידוש/.test(trimmed)) return { action: 'renew', category: null, area: null, lang }

  const workMatch = trimmed.match(/^(?:WORK|עבודה|ארבעט)\s+(.+)$/i)
  if (workMatch) {
    const parts = workMatch[1].trim().split(/\s+/)
    const cat = normalizeCategory(parts[0])
    const area = parts.slice(1).join(' ') || null
    return { action: 'register', category: cat, area, lang }
  }

  return { action: null, category: null, area: null, lang }
}

// ── Parse JOB command (posting a job) ──
export function parseJobCommand(text: string): { category: string | null; area: string | null; jobType: string; lang: 'en' | 'he' | 'yi' } | null {
  const trimmed = text.trim()
  const upper = trimmed.toUpperCase()
  const lang = detectLang(trimmed)

  const jobMatch = trimmed.match(/^JOB\s+(.+)$/i)
  if (!jobMatch) return null

  const parts = jobMatch[1].trim().split(/\s+/)
  const cat = normalizeCategory(parts[0])

  // Try to find job type in remaining parts
  let area: string | null = null
  let jobType = 'full-time'

  for (let i = 1; i < parts.length; i++) {
    const normalized = normalizeJobType(parts.slice(i).join(' '))
    if (JOB_TYPE_ALIASES[parts[i].toLowerCase()] || JOB_TYPE_ALIASES[parts.slice(i).join(' ').toLowerCase()]) {
      jobType = normalizeJobType(parts.slice(i).join(' '))
      area = parts.slice(1, i).join(' ') || null
      break
    }
  }
  if (!area) area = parts.slice(1).join(' ') || null

  return { category: cat, area, jobType, lang }
}

// ── Parse HIRE command ──
export function parseHireCommand(text: string): { category: string; area: string | null } | null {
  const match = text.trim().match(/^HIRE\s+(\S+)(?:\s+(.+))?$/i)
  if (!match) return null
  return { category: normalizeCategory(match[1]), area: match[2]?.trim() || null }
}

const WORKERS_UNAVAILABLE_MSG = `⚠️ Workers directory is temporarily unavailable.\nPlease try again in a few minutes.\n\nOther services (business search, minyan times, specials) still work normally.`

// ── Register worker ──
export async function registerWorker(phone: string, category: string, area: string | null, lang: string): Promise<string> {
  try {
    const phoneH = hashPhone(phone)
    const msg = getMsg(lang)
    const areaName = area || 'All areas'

    const existing = await prisma.worker.findUnique({ where: { phone } })
    if (existing && existing.isActive && existing.expiresAt > new Date()) {
      return msg.alreadyRegistered(existing.category, existing.area || 'All areas', formatDate(existing.expiresAt))
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + WORKER_DURATION_DAYS)

    if (existing) {
      await prisma.worker.update({
        where: { phone },
        data: { category, area: areaName, phoneHash: phoneH, language: lang, expiresAt, isActive: true, description: null },
      })
    } else {
      await prisma.worker.create({
        data: { phone, phoneHash: phoneH, category, area: areaName, language: lang, expiresAt },
      })
    }

    return msg.registered(category, areaName, formatDate(expiresAt))
  } catch (error) {
    console.error('registerWorker DB error:', error)
    return WORKERS_UNAVAILABLE_MSG
  }
}

// ── Save worker description ──
export async function saveWorkerDescription(phone: string, description: string): Promise<string | null> {
  try {
    const worker = await prisma.worker.findUnique({ where: { phone } })
    if (!worker || !worker.isActive || worker.description) return null

    await prisma.worker.update({ where: { phone }, data: { description } })
    const msg = getMsg(worker.language)
    return msg.descriptionSaved(worker.category, worker.area || 'All areas', formatDate(worker.expiresAt), worker.phone)
  } catch (error) {
    console.error('saveWorkerDescription DB error (non-fatal):', error)
    return null
  }
}

// ── Post a job ──
export async function postJob(phone: string, category: string, area: string | null, jobType: string, lang: string): Promise<string> {
  const msg = getMsg(lang)
  const areaName = area || 'All areas'
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + JOB_DURATION_DAYS)

  await prisma.job.create({
    data: {
      title: `${CATEGORY_LABELS[category] || category} — ${jobType}`,
      description: '', // will be filled in next message
      category,
      area: areaName,
      phone,
      type: 'OFFERING',
      expiresAt,
    },
  })

  return msg.jobPosted(category, areaName, jobType, formatDate(expiresAt))
}

// ── Save job description (second message) ──
export async function saveJobDescription(phone: string, description: string): Promise<string | null> {
  try {
    const job = await prisma.job.findFirst({
      where: { phone, isActive: true, description: '', expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })
    if (!job) return null

    await prisma.job.update({ where: { id: job.id }, data: { description } })

    // TODO: notify subscribers
    return `✅ Job listing complete!\n${job.title}\n📍 ${job.area}\n⏰ Active until ${formatDate(job.expiresAt)}`
  } catch (error) {
    console.error('saveJobDescription DB error (non-fatal):', error)
    return null
  }
}

// ── Renew / Stop worker ──
export async function renewWorker(phone: string): Promise<string> {
  try {
    const worker = await prisma.worker.findUnique({ where: { phone } })
    if (!worker) return MSGS.en.notFound
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + WORKER_DURATION_DAYS)
    await prisma.worker.update({ where: { phone }, data: { expiresAt, isActive: true } })
    return getMsg(worker.language).renewed(formatDate(expiresAt))
  } catch (error) {
    console.error('renewWorker DB error:', error)
    return WORKERS_UNAVAILABLE_MSG
  }
}

export async function stopWorker(phone: string): Promise<string> {
  try {
    const worker = await prisma.worker.findUnique({ where: { phone } })
    if (!worker) return MSGS.en.notFound
    await prisma.worker.update({ where: { phone }, data: { isActive: false } })
    return getMsg(worker.language).stopped
  } catch (error) {
    console.error('stopWorker DB error:', error)
    return WORKERS_UNAVAILABLE_MSG
  }
}

// ── Search workers (HIRE command) ──
export async function searchWorkers(category: string, area: string | null, limit = 5): Promise<string> {
  try {
    const where: any = { isActive: true, expiresAt: { gt: new Date() }, category: { contains: category, mode: 'insensitive' } }
    if (area) where.area = { contains: area, mode: 'insensitive' }

    let workers = await prisma.worker.findMany({
      where, take: limit, orderBy: { createdAt: 'desc' },
      select: { phone: true, category: true, area: true, description: true },
    })

    // Fallback without area
    if (workers.length === 0 && area) {
      delete where.area
      workers = await prisma.worker.findMany({
        where, take: limit, orderBy: { createdAt: 'desc' },
        select: { phone: true, category: true, area: true, description: true },
      })
    }

    if (workers.length === 0) {
      return `No ${CATEGORY_LABELS[category] || category} available right now.\n\nKnow someone? Tell them to text:\nWORK ${category} ${area || 'Brooklyn'}\nto (888) 516-3399`
    }

    let response = `👷 Found ${workers.length} ${CATEGORY_LABELS[category] || category}${area ? ` in ${area}` : ''}:\n\n`
    workers.forEach((w: any, i: number) => {
      response += `${i + 1}. ${w.phone}\n`
      if (w.description) {
        const desc = w.description.length > 60 ? w.description.substring(0, 57) + '...' : w.description
        response += `   ${desc}\n`
      }
      if (w.area) response += `   📍 ${w.area}\n`
      response += '\n'
    })
    response += 'Call directly — it\'s FREE!'
    return response
  } catch (error) {
    console.error('searchWorkers DB error:', error)
    return WORKERS_UNAVAILABLE_MSG
  }
}

// ============================================
// FREEFORM JOB POST parser
// Parses: "job cashier 11211 full $20/hr John 718-555-1234"
// ============================================

export interface FreeformJobPost {
  position: string
  zipCode: string | null
  area: string | null
  jobType: 'full-time' | 'part-time' | 'one-time' | 'hourly' | null
  pay: string | null
  contactName: string | null
  phone: string | null
  raw: string
}

const ZIP_TO_AREA_JOBS: Record<string, string> = {
  '11211': 'Williamsburg', '11249': 'Williamsburg', '11206': 'Williamsburg', '11205': 'Williamsburg',
  '11219': 'Boro Park', '11204': 'Boro Park', '11218': 'Boro Park',
  '11230': 'Flatbush', '11210': 'Flatbush',
  '11213': 'Crown Heights', '11225': 'Crown Heights', '11203': 'Crown Heights',
  '10952': 'Monsey', '10977': 'Spring Valley', '10950': 'Monroe',
  '08701': 'Lakewood', '11516': 'Cedarhurst', '11559': 'Lawrence',
  '07666': 'Teaneck', '07055': 'Passaic',
}

// Known areas (for parsing)
const AREA_KEYWORDS = [
  'williamsburg', 'boro park', 'borough park', 'boropark', 'crown heights',
  'crown hts', 'flatbush', 'monsey', 'monroe', 'kiryas joel', 'lakewood',
  'five towns', 'cedarhurst', 'lawrence', 'woodmere', 'teaneck', 'passaic',
  'brooklyn', 'far rockaway', 'staten island',
]

export function parseFreeformJobPost(text: string): FreeformJobPost | null {
  const raw = text.trim()
  if (!raw) return null

  // Strip leading "job" / "jobs"
  let remaining = raw.replace(/^jobs?\s+/i, '').trim()

  // 1. Phone — find last phone-shaped group of digits
  const phoneMatch = remaining.match(/(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/)
  const phone = phoneMatch ? `+1${phoneMatch[1]}${phoneMatch[2]}${phoneMatch[3]}` : null

  // Remove the phone from text to simplify remaining parsing
  if (phoneMatch) remaining = remaining.replace(phoneMatch[0], ' ').trim()

  // 2. ZIP — first 5-digit sequence (after phone removal)
  const zipMatch = remaining.match(/\b(\d{5})\b/)
  const zipCode = zipMatch ? zipMatch[1] : null
  if (zipMatch) remaining = remaining.replace(zipMatch[0], ' ').trim()

  // 3. Pay — $ amount
  const payMatch = remaining.match(/\$\s*[\d,]+(?:\.\d+)?(?:\s*\/\s*(?:hr|hour|yr|year|week|wk|day|mo|month))?/i)
  const pay = payMatch ? payMatch[0].trim() : null
  if (payMatch) remaining = remaining.replace(payMatch[0], ' ').trim()

  // 4. Job type
  let jobType: FreeformJobPost['jobType'] = null
  const jtMatch = remaining.match(/\b(full[-\s]?time|full|ft|part[-\s]?time|part|pt|one[-\s]?time|once|hourly|per hour|temporary|temp)\b/i)
  if (jtMatch) {
    const kw = jtMatch[0].toLowerCase().replace(/\s/g, '-')
    jobType = JOB_TYPE_ALIASES[kw] as any
      || (kw.includes('full') || kw === 'ft' ? 'full-time' : null)
      || (kw.includes('part') || kw === 'pt' ? 'part-time' : null)
      || (kw.includes('one') || kw === 'once' || kw === 'temp' || kw === 'temporary' ? 'one-time' : null)
      || (kw.includes('hour') ? 'hourly' : null)
    remaining = remaining.replace(jtMatch[0], ' ').trim()
  }

  // 5. Area (if provided as name)
  let area: string | null = zipCode ? (ZIP_TO_AREA_JOBS[zipCode] || null) : null
  const lowerRem = remaining.toLowerCase()
  for (const a of AREA_KEYWORDS) {
    if (lowerRem.includes(a)) {
      area = a.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      // Normalize
      if (area.toLowerCase() === 'borough park' || area.toLowerCase() === 'boropark') area = 'Boro Park'
      if (area.toLowerCase() === 'crown hts') area = 'Crown Heights'
      // Strip from remaining
      const re = new RegExp(a.replace(/\s+/g, '\\s+'), 'i')
      remaining = remaining.replace(re, ' ').trim()
      break
    }
  }

  // 6. Contact name — capitalized word(s) left over (take 1-2 words)
  let contactName: string | null = null
  const tokens = remaining.split(/\s+/).filter(t => t.length > 0 && t !== '-' && t !== '—')
  // Find first capitalized token (proper name) that's NOT the position
  const namingTokens: string[] = []
  for (let i = tokens.length - 1; i >= 0 && namingTokens.length < 2; i--) {
    const t = tokens[i]
    if (/^[A-Z][a-zA-Z]+$/.test(t)) {
      namingTokens.unshift(t)
    } else if (namingTokens.length > 0) {
      break
    }
  }
  if (namingTokens.length > 0) {
    contactName = namingTokens.join(' ')
    // Remove name tokens from remaining
    for (const n of namingTokens) {
      remaining = remaining.replace(new RegExp(`\\b${n}\\b`), ' ')
    }
    remaining = remaining.trim()
  }

  // 7. Position — whatever's left, take first 1-3 meaningful words
  const positionTokens = remaining.split(/\s+/).filter(t => t.length > 0 && !/^[,.;:]+$/.test(t)).slice(0, 3)
  const position = positionTokens.join(' ').trim()

  if (!position || !phone) return null

  return { position, zipCode, area, jobType, pay, contactName, phone, raw }
}

// ============================================
// Post freeform job with 7-day expiry
// ============================================
export async function postFreeformJob(posterPhone: string, parsed: FreeformJobPost): Promise<string> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7-day expiry for freeform posts

  // Normalize category from position
  const category = normalizeCategory(parsed.position)

  // Title
  const typeLabel = parsed.jobType ? parsed.jobType : 'any schedule'
  const title = `${parsed.position} — ${typeLabel}`

  // Description (readable summary)
  const descParts: string[] = []
  if (parsed.position) descParts.push(parsed.position)
  if (parsed.jobType) descParts.push(parsed.jobType)
  if (parsed.pay) descParts.push(parsed.pay)
  if (parsed.contactName) descParts.push(`contact: ${parsed.contactName}`)
  const description = descParts.join(' • ') + '\n\n' + parsed.raw

  try {
    await prisma.job.create({
      data: {
        title,
        description,
        category,
        area: parsed.area,
        zipCode: parsed.zipCode,
        phone: parsed.phone!, // we already validated it's set
        salary: parsed.pay,
        type: 'OFFERING',
        expiresAt,
        isActive: true,
      },
    })

    const expiryDateStr = expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `✅ Job posted successfully!

💼 ${title}
${parsed.area ? `📍 ${parsed.area}${parsed.zipCode ? ' ('+parsed.zipCode+')' : ''}\n` : parsed.zipCode ? `📍 ZIP ${parsed.zipCode}\n` : ''}${parsed.pay ? `💰 ${parsed.pay}\n` : ''}📞 ${parsed.contactName ? parsed.contactName + ' ' : ''}${parsed.phone}

⏰ Active until ${expiryDateStr} (7 days)
📱 Text "JOB ${parsed.zipCode || ''}" to see your listing`
  } catch (error: any) {
    console.error('postFreeformJob error:', error?.message)
    return '⚠️ Could not save job right now. Please try again in a moment.'
  }
}
