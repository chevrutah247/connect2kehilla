// lib/jobs-menu.ts — Interactive menu-driven JOBS flow via SMS

import prisma from './db'
import { hashPhone } from './users'
import { registerWorker, searchWorkers, postJob, CATEGORY_LABELS } from './workers'

const SESSION_TTL_MINUTES = 30

// Session stored in Query table: rawMessage = __JOBS_STATE__<step>:<data>
// step = MAIN | WORK_GENDER | WORK_CATEGORY | WORK_AREA | HIRE_GENDER | HIRE_CATEGORY | HIRE_AREA | POST_GENDER | POST_CATEGORY | POST_AREA | POST_TYPE

type Step = 'MAIN' | 'WORK_GENDER' | 'WORK_CATEGORY' | 'WORK_AREA' | 'HIRE_GENDER' | 'HIRE_CATEGORY' | 'HIRE_AREA' | 'POST_GENDER' | 'POST_CATEGORY' | 'POST_AREA' | 'POST_TYPE' | 'JOB_ZIP_MENU'

interface SessionState {
  step: Step
  gender?: 'men' | 'women'
  category?: string
  area?: string
  zipCode?: string
}

// ZIP → area mapping for zip-aware job menu
const ZIP_TO_AREA: Record<string, string> = {
  '11211': 'Williamsburg', '11249': 'Williamsburg', '11206': 'Williamsburg', '11205': 'Williamsburg',
  '11219': 'Boro Park', '11204': 'Boro Park', '11218': 'Boro Park',
  '11230': 'Flatbush', '11210': 'Flatbush',
  '11213': 'Crown Heights', '11225': 'Crown Heights', '11203': 'Crown Heights',
  '10952': 'Monsey', '10977': 'Spring Valley', '10950': 'Monroe',
  '08701': 'Lakewood', '11516': 'Cedarhurst', '11559': 'Lawrence',
  '07666': 'Teaneck', '07055': 'Passaic',
}

const CATEGORIES_BY_GENDER = {
  women: [
    { key: 'babysitter', label: 'Babysitter / Nanny', emoji: '👶' },
    { key: 'cleaning', label: 'Cleaning Lady', emoji: '🧹' },
    { key: 'para', label: 'Para (Special Needs)', emoji: '🧩' },
    { key: 'home_attendant', label: 'Home Attendant / Aide', emoji: '🏠' },
    { key: 'cook', label: 'Cook / Chef', emoji: '👩‍🍳' },
    { key: 'tutor', label: 'Tutor / Teacher', emoji: '📚' },
  ],
  men: [
    { key: 'driver', label: 'Driver / Delivery', emoji: '🚗' },
    { key: 'mover', label: 'Mover / Hauler', emoji: '📦' },
    { key: 'handyman', label: 'Handyman', emoji: '🔧' },
    { key: 'painter', label: 'Painter', emoji: '🎨' },
    { key: 'helper', label: 'Helper / General Labor', emoji: '💪' },
    { key: 'tutor', label: 'Tutor / Teacher', emoji: '📚' },
  ],
}

const JOB_TYPES = [
  { key: 'full-time', label: 'Full-time' },
  { key: 'part-time', label: 'Part-time' },
  { key: 'one-time', label: 'One-time' },
  { key: 'hourly', label: 'Hourly' },
]

// ── Session helpers ──
async function saveSession(userId: string, state: SessionState): Promise<void> {
  const tag = `__JOBS_STATE__${state.step}:${JSON.stringify({ gender: state.gender, category: state.category, area: state.area, zipCode: state.zipCode })}`
  await prisma.query.create({
    data: { userId, rawMessage: tag, parsedIntent: 'JOBS', responseText: '', processedAt: new Date() },
  })
}

async function getSession(userId: string): Promise<SessionState | null> {
  const recent = await prisma.query.findFirst({
    where: {
      userId,
      rawMessage: { startsWith: '__JOBS_STATE__' },
      createdAt: { gte: new Date(Date.now() - SESSION_TTL_MINUTES * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!recent) return null

  const match = recent.rawMessage.match(/^__JOBS_STATE__(\w+):(.+)$/)
  if (!match) return null
  try {
    const data = JSON.parse(match[2])
    return { step: match[1] as Step, ...data }
  } catch { return null }
}

async function clearSession(userId: string): Promise<void> {
  // Mark session as cleared by adding a new __JOBS_STATE__CLEAR entry
  await prisma.query.create({
    data: { userId, rawMessage: '__JOBS_STATE__CLEAR:{}', parsedIntent: 'JOBS', responseText: '', processedAt: new Date() },
  })
}

// ── Main menu — NEW simplified 2-option flow ──
export const JOBS_MAIN_MENU = `💼 JOBS

Reply:
1️⃣ Job Seekers — see open jobs
2️⃣ Job Posters — post a new job

Free for everyone!`

// Old menu kept available in case we need advanced options later
export const JOBS_ADVANCED_MENU = `📋 JOBS & WORKERS (advanced)

1️⃣ Looking for work (register yourself as worker)
2️⃣ Hiring (find available workers)
3️⃣ Post a job opening with category flow

Reply 1, 2 or 3`

const GENDER_MENU = (action: string) => `${action === 'WORK' ? '👷 REGISTER AS WORKER' : action === 'HIRE' ? '🔍 FIND WORKERS' : '📋 POST A JOB'}

Who/What are you looking for?

1️⃣ Men's jobs
2️⃣ Women's jobs

Reply 1 or 2`

const CATEGORY_MENU = (gender: 'men' | 'women', action: string) => {
  const cats = CATEGORIES_BY_GENDER[gender]
  const title = gender === 'women' ? '👩 WOMEN JOBS' : '👨 MEN JOBS'
  const lines = cats.map((c, i) => `${i + 1}️⃣ ${c.emoji} ${c.label}`).join('\n')
  return `${title} — pick category:\n\n${lines}\n\nReply 1-${cats.length}`
}

const AREA_PROMPT = (cat: string, action: string) => {
  const label = CATEGORY_LABELS[cat] || cat
  if (action === 'WORK') {
    return `📍 ${label}\n\nIn which area will you work?\n\nReply area name or ZIP\nExamples: Williamsburg, Crown Heights, 11211`
  }
  if (action === 'HIRE') {
    return `📍 Looking for ${label}\n\nIn which area?\n\nReply area name or ZIP\nExamples: Williamsburg, Crown Heights, 11211`
  }
  return `📍 Posting job for ${label}\n\nIn which area?\n\nReply area name or ZIP`
}

const JOB_TYPE_MENU = (cat: string) => {
  const label = CATEGORY_LABELS[cat] || cat
  return `⏰ ${label} — what type?\n\n1️⃣ Full-time\n2️⃣ Part-time\n3️⃣ One-time\n4️⃣ Hourly\n\nReply 1-4`
}

// ────────────────────────────────────────────────
// ZIP-aware JOBS entry: "job 11213" → 2-option menu
// ────────────────────────────────────────────────
const JOB_ZIP_MENU_TEXT = (zip: string, area: string) => `💼 JOBS for ZIP ${zip}${area ? ` (${area})` : ''}

Reply:
1️⃣ Job Seekers — see open jobs
2️⃣ Job Posters — post a new job

Free for everyone!`

const JOB_POSTER_INSTRUCTIONS = `📝 Post a job — text back in this format:

job [position] [ZIP] [full|part] [pay] [name] [phone]

Example:
job cashier 11211 full $20/hr John 718-555-1234

Job will be listed for 7 days.`

export async function handleJobZipEntry(userId: string, _phone: string, zipCode: string): Promise<string> {
  const area = ZIP_TO_AREA[zipCode] || ''
  await clearSession(userId)
  await saveSession(userId, { step: 'JOB_ZIP_MENU', zipCode, area })
  return JOB_ZIP_MENU_TEXT(zipCode, area)
}

// ── Process menu input ──
export async function handleJobsMenu(userId: string, phone: string, input: string): Promise<string | null> {
  const trimmed = input.trim()
  const upperInput = trimmed.toUpperCase()

  // Start new menu
  if (upperInput === 'JOBS' || upperInput === 'JOB' || upperInput === 'MENU') {
    await clearSession(userId)
    await saveSession(userId, { step: 'MAIN' })
    return JOBS_MAIN_MENU
  }

  // Get current session
  const session = await getSession(userId)

  // JOB_ZIP_MENU — reply "1" (seekers) or "2" (posters)
  if (session && session.step === 'JOB_ZIP_MENU') {
    const num = parseInt(trimmed)
    const zip = session.zipCode || ''
    const area = session.area || ''

    if (num === 1) {
      // Show open jobs
      await clearSession(userId)
      const now = new Date()
      const where: any = {
        type: 'OFFERING',
        isActive: true,
        expiresAt: { gt: now },
      }
      if (zip || area) {
        where.OR = []
        if (zip) where.OR.push({ zipCode: zip })
        if (area) where.OR.push({ area: { contains: area, mode: 'insensitive' } })
      }
      const jobs = await prisma.job.findMany({
        where, orderBy: { createdAt: 'desc' }, take: 5,
      })
      if (jobs.length === 0) {
        return `📭 No job openings available in ${area || 'your area'} right now.\n\nCheck back soon — jobs are posted daily!`
      }
      // Format list
      const fmtDaysLeft = (d: Date) => {
        const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return diff <= 0 ? 'today' : `${diff} day${diff === 1 ? '' : 's'} left`
      }
      let response = `💼 Jobs in ${area || zip} (${jobs.length}):\n\n`
      jobs.forEach((j, i) => {
        response += `${i + 1}. ${j.title}\n`
        if (j.salary) response += `   💰 ${j.salary}\n`
        response += `   📞 ${j.phone}\n`
        response += `   ⏰ ${fmtDaysLeft(j.expiresAt)}\n\n`
      })
      response += `Post a job: text "JOB" to start`
      return response
    }

    if (num === 2) {
      await clearSession(userId)
      return JOB_POSTER_INSTRUCTIONS
    }

    // Not 1 or 2 — exit session
    await clearSession(userId)
    return null
  }

  if (!session || session.step === 'MAIN' as any) {
    // Main menu — NEW simplified 2-option flow
    if (!session) return null // no active menu

    const num = parseInt(trimmed)

    // If reply looks like a ZIP (5 digits), user is providing ZIP for the menu
    if (/^\d{5}$/.test(trimmed)) {
      return await handleJobZipEntry(userId, phone, trimmed)
    }

    if (num === 1) {
      // Job Seekers — no specific ZIP, show most recent jobs anywhere
      await clearSession(userId)
      const now = new Date()
      const jobs = await prisma.job.findMany({
        where: { type: 'OFFERING', isActive: true, expiresAt: { gt: now } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
      if (jobs.length === 0) {
        return `📭 No job openings available right now.\n\nCheck back soon — jobs are posted daily!\n\nTip: text "job 11213" to filter by ZIP.`
      }
      const fmtDaysLeft = (d: Date) => {
        const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return diff <= 0 ? 'today' : `${diff} day${diff === 1 ? '' : 's'} left`
      }
      let response = `💼 Open jobs (${jobs.length}):\n\n`
      jobs.forEach((j, i) => {
        response += `${i + 1}. ${j.title}\n`
        if (j.area) response += `   📍 ${j.area}${j.zipCode ? ' ('+j.zipCode+')' : ''}\n`
        if (j.salary) response += `   💰 ${j.salary}\n`
        response += `   📞 ${j.phone}\n`
        response += `   ⏰ ${fmtDaysLeft(j.expiresAt)}\n\n`
      })
      response += `Tip: text "job 11213" to filter by your ZIP`
      return response
    }

    if (num === 2) {
      await clearSession(userId)
      return JOB_POSTER_INSTRUCTIONS
    }

    // Not a menu reply — exit the JOBS flow so the outer handler can
    // treat this as a normal business/minyan/specials query.
    await clearSession(userId)
    return null
  }

  // Handle based on step
  if (session.step === 'WORK_GENDER' || session.step === 'HIRE_GENDER' || session.step === 'POST_GENDER') {
    const num = parseInt(trimmed)
    if (num !== 1 && num !== 2) {
      await clearSession(userId)
      return null
    }
    const gender = num === 1 ? 'men' : 'women'
    const nextStep = session.step === 'WORK_GENDER' ? 'WORK_CATEGORY' : session.step === 'HIRE_GENDER' ? 'HIRE_CATEGORY' : 'POST_CATEGORY'
    const action = session.step.split('_')[0]
    await saveSession(userId, { step: nextStep, gender })
    return CATEGORY_MENU(gender, action)
  }

  if (session.step === 'WORK_CATEGORY' || session.step === 'HIRE_CATEGORY' || session.step === 'POST_CATEGORY') {
    const num = parseInt(trimmed)
    const cats = CATEGORIES_BY_GENDER[session.gender!]
    if (num < 1 || num > cats.length) {
      await clearSession(userId)
      return null
    }
    const cat = cats[num - 1]
    const nextStep = session.step === 'WORK_CATEGORY' ? 'WORK_AREA' : session.step === 'HIRE_CATEGORY' ? 'HIRE_AREA' : 'POST_AREA'
    const action = session.step.split('_')[0]
    await saveSession(userId, { step: nextStep, gender: session.gender, category: cat.key })
    return AREA_PROMPT(cat.key, action)
  }

  if (session.step === 'WORK_AREA') {
    // Register worker
    await clearSession(userId)
    return await registerWorker(phone, session.category!, trimmed, 'en')
  }

  if (session.step === 'HIRE_AREA') {
    // Search workers
    await clearSession(userId)
    return await searchWorkers(session.category!, trimmed)
  }

  if (session.step === 'POST_AREA') {
    await saveSession(userId, { step: 'POST_TYPE', gender: session.gender, category: session.category, area: trimmed })
    return JOB_TYPE_MENU(session.category!)
  }

  if (session.step === 'POST_TYPE') {
    const num = parseInt(trimmed)
    if (num < 1 || num > 4) {
      await clearSession(userId)
      return null
    }
    const jobType = JOB_TYPES[num - 1].key
    await clearSession(userId)
    return await postJob(phone, session.category!, session.area!, jobType, 'en')
  }

  return null
}

// Detect if user is in an active JOBS menu flow.
// Returns true for ANY active session (including MAIN) so the user's
// next reply (e.g. "2") is routed to handleJobsMenu and not to the
// specials-number picker further down the SMS handler.
export async function hasActiveJobsSession(userId: string): Promise<boolean> {
  try {
    const session = await getSession(userId)
    return session !== null
  } catch (error) {
    console.error('hasActiveJobsSession DB error (non-fatal):', error)
    return false
  }
}
