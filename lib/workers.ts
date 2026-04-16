// lib/workers.ts — Day Workers "На подхвате" SMS logic

import prisma from './db'
import { hashPhone } from './users'

const WORKER_DURATION_DAYS = 30

// Multilingual messages
const MSGS = {
  en: {
    registered: (cat: string, area: string, expires: string) =>
      `✅ You're listed as ${cat.toUpperCase()} in ${area}!\n\nNow reply with a short description of your skills & availability (1 message):`,
    descriptionSaved: (cat: string, area: string, expires: string, phone: string) =>
      `✅ Profile saved!\n📱 ${maskPhone(phone)} • ${cat} • ${area}\n\n⏰ Active until ${expires}\nText WORK RENEW to extend\nText WORK STOP to remove`,
    renewed: (expires: string) =>
      `✅ Renewed! Your listing is active until ${expires}.\nText WORK STOP to remove.`,
    stopped: `❌ You've been removed from the workers list.\nText WORK [category] [area] to re-register.`,
    alreadyRegistered: (cat: string, area: string, expires: string) =>
      `You're already listed as ${cat} in ${area}.\nActive until ${expires}.\n\nText WORK RENEW to extend\nText WORK STOP to remove`,
    notFound: `You don't have an active worker listing.\nText WORK [category] [area] to register.\nExample: WORK driver Williamsburg`,
  },
  he: {
    registered: (cat: string, area: string, expires: string) =>
      `✅ !נרשמת כ${cat} ב${area}\n\nענה עם תיאור קצר של הכישורים שלך:`,
    descriptionSaved: (cat: string, area: string, expires: string, phone: string) =>
      `✅ הפרופיל נשמר!\n📱 ${maskPhone(phone)} • ${cat} • ${area}\n\n⏰ פעיל עד ${expires}\nשלח WORK RENEW להארכה\nשלח WORK STOP להסרה`,
    renewed: (expires: string) =>
      `✅ הוארך! הרישום פעיל עד ${expires}`,
    stopped: `❌ הוסרת מרשימת העובדים.\nשלח WORK [קטגוריה] [אזור] להרשמה מחדש.`,
    alreadyRegistered: (cat: string, area: string, expires: string) =>
      `כבר רשום כ${cat} ב${area}.\nפעיל עד ${expires}.`,
    notFound: `אין לך רישום פעיל.\nשלח WORK [קטגוריה] [אזור] להרשמה.\nדוגמה: WORK driver Williamsburg`,
  },
  yi: {
    registered: (cat: string, area: string, expires: string) =>
      `✅ !איר זענט רעגיסטרירט אלס ${cat} אין ${area}\n\nענטפערט מיט א קורצע באשרייבונג:`,
    descriptionSaved: (cat: string, area: string, expires: string, phone: string) =>
      `✅ פראפיל איז געראטעוועט!\n📱 ${maskPhone(phone)} • ${cat} • ${area}\n\n⏰ אקטיוו ביז ${expires}\nשלח WORK RENEW צו פארלענגערן`,
    renewed: (expires: string) =>
      `✅ פארלענגערט! אקטיוו ביז ${expires}`,
    stopped: `❌ איר זענט אראפגענומען פון דער ליסטע.`,
    alreadyRegistered: (cat: string, area: string, expires: string) =>
      `איר זענט שוין רעגיסטרירט אלס ${cat} אין ${area}.\nאקטיוו ביז ${expires}.`,
    notFound: `איר האט נישט קיין אקטיוון רעגיסטראציע.\nשלח WORK [קאטעגאריע] [געגנט] צו רעגיסטרירן.`,
  },
}

function maskPhone(phone: string): string {
  if (phone.length < 7) return phone
  return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    timeZone: 'America/New_York',
  })
}

function detectLang(text: string): 'en' | 'he' | 'yi' {
  if (/עבודה|עובד|נהג/.test(text)) return 'he'
  if (/ארבעט|פארער/.test(text)) return 'yi'
  return 'en'
}

function getMsg(lang: string) {
  return MSGS[lang as keyof typeof MSGS] || MSGS.en
}

// Parse WORK command: "WORK driver williamsburg" or "עבודה נהג וויליאמסבורג"
export function parseWorkCommand(text: string): { action: 'register' | 'renew' | 'stop' | null; category: string | null; area: string | null; lang: 'en' | 'he' | 'yi' } {
  const trimmed = text.trim()
  const upper = trimmed.toUpperCase()
  const lang = detectLang(trimmed)

  // WORK STOP
  if (upper.startsWith('WORK STOP') || /עבודה סטופ/.test(trimmed)) {
    return { action: 'stop', category: null, area: null, lang }
  }
  // WORK RENEW
  if (upper.startsWith('WORK RENEW') || /עבודה חידוש/.test(trimmed)) {
    return { action: 'renew', category: null, area: null, lang }
  }
  // WORK [category] [area] — or עבודה [category] [area]
  const workMatch = trimmed.match(/^(?:WORK|עבודה|ארבעט)\s+(\S+)(?:\s+(.+))?$/i)
  if (workMatch) {
    return { action: 'register', category: workMatch[1].toLowerCase(), area: workMatch[2]?.trim() || null, lang }
  }

  return { action: null, category: null, area: null, lang }
}

// Register a worker
export async function registerWorker(phone: string, category: string, area: string | null, lang: string): Promise<string> {
  const phoneH = hashPhone(phone)
  const msg = getMsg(lang)

  // Check if already registered
  const existing = await prisma.worker.findUnique({ where: { phone } })
  if (existing && existing.isActive && existing.expiresAt > new Date()) {
    return msg.alreadyRegistered(existing.category, existing.area || 'All areas', formatDate(existing.expiresAt))
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + WORKER_DURATION_DAYS)
  const areaName = area || 'All areas'

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

// Save description (second message after registration)
export async function saveWorkerDescription(phone: string, description: string): Promise<string | null> {
  const worker = await prisma.worker.findUnique({ where: { phone } })
  if (!worker || !worker.isActive) return null
  // Only save if description is empty (just registered)
  if (worker.description) return null

  await prisma.worker.update({
    where: { phone },
    data: { description },
  })

  const msg = getMsg(worker.language)
  return msg.descriptionSaved(worker.category, worker.area || 'All areas', formatDate(worker.expiresAt), phone)
}

// Renew worker listing
export async function renewWorker(phone: string): Promise<string> {
  const worker = await prisma.worker.findUnique({ where: { phone } })
  if (!worker) return MSGS.en.notFound

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + WORKER_DURATION_DAYS)

  await prisma.worker.update({
    where: { phone },
    data: { expiresAt, isActive: true },
  })

  const msg = getMsg(worker.language)
  return msg.renewed(formatDate(expiresAt))
}

// Stop/remove worker
export async function stopWorker(phone: string): Promise<string> {
  const worker = await prisma.worker.findUnique({ where: { phone } })
  if (!worker) return MSGS.en.notFound

  await prisma.worker.update({
    where: { phone },
    data: { isActive: false },
  })

  return getMsg(worker.language).stopped
}

// Search for available workers (for HIRE command)
export async function searchWorkers(category: string, area: string | null, limit = 5): Promise<string> {
  const where: any = { isActive: true, expiresAt: { gt: new Date() } }

  // Fuzzy category match
  where.category = { contains: category, mode: 'insensitive' }
  if (area) {
    where.area = { contains: area, mode: 'insensitive' }
  }

  const workers = await prisma.worker.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: { phone: true, category: true, area: true, description: true },
  })

  if (workers.length === 0) {
    // Try without area
    if (area) {
      delete where.area
      const allArea = await prisma.worker.findMany({
        where, take: limit, orderBy: { createdAt: 'desc' },
        select: { phone: true, category: true, area: true, description: true },
      })
      if (allArea.length > 0) {
        return formatWorkerResults(allArea, category, 'All areas')
      }
    }
    return `No ${category} workers available right now.\n\nKnow someone? Tell them to text:\nWORK ${category} ${area || 'Brooklyn'}\nto (888) 516-3399`
  }

  return formatWorkerResults(workers, category, area)
}

function formatWorkerResults(workers: any[], category: string, area: string | null): string {
  let response = `👷 Found ${workers.length} ${category}${area ? ` in ${area}` : ''}:\n\n`

  workers.forEach((w: any, i: number) => {
    const last4 = w.phone.slice(-4)
    response += `${i + 1}. ${w.phone}\n`
    if (w.description) {
      const desc = w.description.length > 60 ? w.description.substring(0, 57) + '...' : w.description
      response += `   ${desc}\n`
    }
    if (w.area) response += `   📍 ${w.area}\n`
    response += '\n'
  })

  response += 'Call directly to hire!'
  return response
}
