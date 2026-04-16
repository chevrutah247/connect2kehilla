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

// ── Register worker ──
export async function registerWorker(phone: string, category: string, area: string | null, lang: string): Promise<string> {
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
  const worker = await prisma.worker.findUnique({ where: { phone } })
  if (!worker) return MSGS.en.notFound
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + WORKER_DURATION_DAYS)
  await prisma.worker.update({ where: { phone }, data: { expiresAt, isActive: true } })
  return getMsg(worker.language).renewed(formatDate(expiresAt))
}

export async function stopWorker(phone: string): Promise<string> {
  const worker = await prisma.worker.findUnique({ where: { phone } })
  if (!worker) return MSGS.en.notFound
  await prisma.worker.update({ where: { phone }, data: { isActive: false } })
  return getMsg(worker.language).stopped
}

// ── Search workers (HIRE command) ──
export async function searchWorkers(category: string, area: string | null, limit = 5): Promise<string> {
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
}
