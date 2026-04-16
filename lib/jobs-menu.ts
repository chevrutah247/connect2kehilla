// lib/jobs-menu.ts — Interactive menu-driven JOBS flow via SMS

import prisma from './db'
import { hashPhone } from './users'
import { registerWorker, searchWorkers, postJob, CATEGORY_LABELS } from './workers'

const SESSION_TTL_MINUTES = 30

// Session stored in Query table: rawMessage = __JOBS_STATE__<step>:<data>
// step = MAIN | WORK_GENDER | WORK_CATEGORY | WORK_AREA | HIRE_GENDER | HIRE_CATEGORY | HIRE_AREA | POST_GENDER | POST_CATEGORY | POST_AREA | POST_TYPE

type Step = 'MAIN' | 'WORK_GENDER' | 'WORK_CATEGORY' | 'WORK_AREA' | 'HIRE_GENDER' | 'HIRE_CATEGORY' | 'HIRE_AREA' | 'POST_GENDER' | 'POST_CATEGORY' | 'POST_AREA' | 'POST_TYPE'

interface SessionState {
  step: Step
  gender?: 'men' | 'women'
  category?: string
  area?: string
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
  const tag = `__JOBS_STATE__${state.step}:${JSON.stringify({ gender: state.gender, category: state.category, area: state.area })}`
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

// ── Main menu ──
export const JOBS_MAIN_MENU = `📋 JOBS & WORKERS

What do you want?

1️⃣ Looking for work (register yourself)
2️⃣ Hiring (find available workers)
3️⃣ Post a job opening

Reply 1, 2 or 3
Free for everyone!`

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
  if (!session || session.step === 'MAIN' as any) {
    // Main menu — expect 1, 2, or 3
    if (!session) return null // no active menu

    const num = parseInt(trimmed)
    if (num === 1) {
      await saveSession(userId, { step: 'WORK_GENDER' })
      return GENDER_MENU('WORK')
    }
    if (num === 2) {
      await saveSession(userId, { step: 'HIRE_GENDER' })
      return GENDER_MENU('HIRE')
    }
    if (num === 3) {
      await saveSession(userId, { step: 'POST_GENDER' })
      return GENDER_MENU('POST')
    }
    return 'Please reply 1, 2 or 3\n\n' + JOBS_MAIN_MENU
  }

  // Handle based on step
  if (session.step === 'WORK_GENDER' || session.step === 'HIRE_GENDER' || session.step === 'POST_GENDER') {
    const num = parseInt(trimmed)
    if (num !== 1 && num !== 2) {
      return 'Please reply 1 (Men) or 2 (Women)'
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
      return `Please reply 1-${cats.length}`
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
    if (num < 1 || num > 4) return 'Please reply 1-4'
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
