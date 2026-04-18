// lib/charity.ts — Tzedaka / Charity help flow
// Users can seek help (1) or offer to help (2) others in their ZIP area.

import prisma from './db'

const ZIP_TO_AREA_CHARITY: Record<string, string> = {
  '11211': 'Williamsburg', '11249': 'Williamsburg', '11206': 'Williamsburg', '11205': 'Williamsburg',
  '11219': 'Boro Park', '11204': 'Boro Park', '11218': 'Boro Park',
  '11230': 'Flatbush', '11210': 'Flatbush',
  '11213': 'Crown Heights', '11225': 'Crown Heights', '11203': 'Crown Heights',
  '10952': 'Monsey', '10977': 'Spring Valley', '10950': 'Monroe',
  '08701': 'Lakewood', '11516': 'Cedarhurst', '11559': 'Lawrence',
  '07666': 'Teaneck', '07055': 'Passaic',
}

export function areaForZip(zip: string): string {
  return ZIP_TO_AREA_CHARITY[zip] || ''
}

// ── Session state stored in Query table (same pattern as jobs-menu) ──
type CharityStep = 'CHARITY_ZIP_PROMPT' | 'CHARITY_MAIN_MENU' | 'CHARITY_SEEK_FORM'

interface CharityState {
  step: CharityStep
  zipCode?: string
  area?: string
}

const SESSION_TTL_MINUTES = 30

async function saveCharitySession(userId: string, state: CharityState): Promise<void> {
  await prisma.query.create({
    data: {
      userId,
      rawMessage: `__CHARITY_STATE__${state.step}:${JSON.stringify({ zipCode: state.zipCode, area: state.area })}`,
      parsedIntent: 'UNKNOWN',
      responseText: '',
      processedAt: new Date(),
    },
  })
}

async function getCharitySession(userId: string): Promise<CharityState | null> {
  const recent = await prisma.query.findFirst({
    where: {
      userId,
      rawMessage: { startsWith: '__CHARITY_STATE__' },
      createdAt: { gte: new Date(Date.now() - SESSION_TTL_MINUTES * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!recent) return null
  const match = recent.rawMessage.match(/^__CHARITY_STATE__(\w+):(.+)$/)
  if (!match) return null
  if (match[1] === 'CLEAR') return null
  try {
    const data = JSON.parse(match[2])
    return { step: match[1] as CharityStep, ...data }
  } catch { return null }
}

async function clearCharitySession(userId: string): Promise<void> {
  await prisma.query.create({
    data: {
      userId,
      rawMessage: '__CHARITY_STATE__CLEAR:{}',
      parsedIntent: 'UNKNOWN',
      responseText: '',
      processedAt: new Date(),
    },
  })
}

export async function hasActiveCharitySession(userId: string): Promise<boolean> {
  try {
    const s = await getCharitySession(userId)
    return s !== null
  } catch (e) {
    console.error('hasActiveCharitySession error:', e)
    return false
  }
}

// ── Entry points ──

const CHARITY_ZIP_PROMPT = `❤️ TZEDAKA / CHARITY

What's your ZIP code?
(Example: reply with 11213)

We'll show you charity requests in your area.`

const CHARITY_MAIN_MENU = (zip: string, area: string) => `❤️ TZEDAKA — ${zip}${area ? ` (${area})` : ''}

Reply:
1️⃣ Seek help — post a request
2️⃣ Offer help — see who needs support

Tzedaka tatzil mimavet.`

const CHARITY_SEEK_FORM_INSTRUCTIONS = (zip: string, area: string) => `📝 Post a charity request — reply with all of this in one message:

Name: [your name]
ZIP: ${zip}${area ? ' - ' + area : ''}
Need: [short description]
Amount: [$ amount needed]
Pay: [Zelle / CashApp / Venmo — your handle]
Phone: [contact number]

Or on one line:
charity Name 11213 needs-rent $500 Zelle:name@email.com 718-555-1234

Listed for 30 days. Privacy: your phone only shared with people who want to help.`

/**
 * Entry: user texts "charity" (no zip) → ask for zip
 */
export async function handleCharityNoZip(userId: string): Promise<string> {
  await clearCharitySession(userId)
  await saveCharitySession(userId, { step: 'CHARITY_ZIP_PROMPT' })
  return CHARITY_ZIP_PROMPT
}

/**
 * Entry: user texts "charity 11213" (with zip) → show 2-option menu
 */
export async function handleCharityWithZip(userId: string, zipCode: string): Promise<string> {
  const area = areaForZip(zipCode)
  await clearCharitySession(userId)
  await saveCharitySession(userId, { step: 'CHARITY_MAIN_MENU', zipCode, area })
  return CHARITY_MAIN_MENU(zipCode, area)
}

/**
 * Handle a reply while user is in active charity session
 */
export async function handleCharityReply(userId: string, phone: string, input: string): Promise<string | null> {
  const trimmed = input.trim()
  const session = await getCharitySession(userId)
  if (!session) return null

  // Step 1: waiting for ZIP after initial "charity" prompt
  if (session.step === 'CHARITY_ZIP_PROMPT') {
    const zipMatch = trimmed.match(/^\d{5}$/)
    if (!zipMatch) {
      // Not a zip — exit
      await clearCharitySession(userId)
      return null
    }
    return await handleCharityWithZip(userId, trimmed)
  }

  // Step 2: 2-option menu
  if (session.step === 'CHARITY_MAIN_MENU') {
    const num = parseInt(trimmed)
    const zip = session.zipCode || ''
    const area = session.area || ''

    if (num === 1) {
      // Seek help — show form instructions, clear session (user will post freeform)
      await clearCharitySession(userId)
      return CHARITY_SEEK_FORM_INSTRUCTIONS(zip, area)
    }

    if (num === 2) {
      // Offer help — list active requests in area
      await clearCharitySession(userId)
      const now = new Date()
      const where: any = {
        isActive: true,
        expiresAt: { gt: now },
      }
      if (zip || area) {
        where.OR = []
        if (zip) where.OR.push({ zipCode: zip })
        if (area) where.OR.push({ area: { contains: area, mode: 'insensitive' } })
      }
      const requests = await prisma.charityRequest.findMany({
        where, orderBy: { createdAt: 'desc' }, take: 5,
      })
      if (requests.length === 0) {
        return `💛 No active charity requests in ${area || zip} right now.\n\nThank you for wanting to help! Check back soon.`
      }
      let response = `❤️ Charity requests in ${area || zip} (${requests.length}):\n\n`
      requests.forEach((r, i) => {
        response += `${i + 1}. ${r.name}\n`
        response += `   📝 ${r.description}\n`
        if (r.amount) response += `   💰 ${r.amount}\n`
        if (r.paymentInfo) response += `   💳 ${r.paymentInfo}\n`
        response += `   📞 ${r.phone}\n\n`
      })
      response += `Please call or send funds directly.\nTizku l'mitzvos!`
      return response
    }

    await clearCharitySession(userId)
    return null
  }

  return null
}

// ============================================
// Parse freeform charity request
// Example: "charity John 11213 needs rent $500 Zelle:john@email.com 718-555-1234"
// Or multi-line labeled format
// ============================================

export interface FreeformCharityRequest {
  name: string
  zipCode: string | null
  area: string | null
  description: string
  amount: string | null
  paymentInfo: string | null
  phone: string
  raw: string
}

export function parseFreeformCharityRequest(text: string): FreeformCharityRequest | null {
  const raw = text.trim()
  let working = raw.replace(/^charity\s+/i, '').trim()

  // Multi-line labeled format: look for lines like "Name: ..."
  const labeled = {
    name: null as string | null,
    zip: null as string | null,
    need: null as string | null,
    amount: null as string | null,
    pay: null as string | null,
    phone: null as string | null,
  }
  if (/\bname\s*:/i.test(working)) {
    const nameM = working.match(/name\s*:\s*([^\n,]+)/i)
    labeled.name = nameM?.[1]?.trim() || null
    const zipM = working.match(/zip\s*:\s*(\d{5})/i)
    labeled.zip = zipM?.[1] || null
    const needM = working.match(/need(?:s)?\s*:\s*([^\n]+)/i)
    labeled.need = needM?.[1]?.trim() || null
    const amountM = working.match(/amount\s*:\s*([^\n]+)/i)
    labeled.amount = amountM?.[1]?.trim() || null
    const payM = working.match(/pay(?:ment)?\s*:\s*([^\n]+)/i)
    labeled.pay = payM?.[1]?.trim() || null
    const phoneM = working.match(/phone\s*:\s*([^\n]+)/i)
    labeled.phone = phoneM?.[1]?.trim() || null
  }

  // Fallback: regex-based extraction from unlabeled one-liner
  // Phone — last thing usually
  const phoneMatch = working.match(/(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/)
  const phone = labeled.phone
    ? normalizeE164(labeled.phone)
    : phoneMatch ? `+1${phoneMatch[1]}${phoneMatch[2]}${phoneMatch[3]}` : null
  if (phoneMatch) working = working.replace(phoneMatch[0], ' ').trim()

  // ZIP
  const zipMatch = working.match(/\b(\d{5})\b/)
  const zipCode = labeled.zip || (zipMatch ? zipMatch[1] : null)
  if (zipMatch) working = working.replace(zipMatch[0], ' ').trim()

  // Amount — $ amount
  const amtMatch = working.match(/\$\s*[\d,]+(?:\.\d+)?(?:\s*\/\s*(?:mo|month|week|yr|year|day))?/i)
  const amount = labeled.amount || (amtMatch ? amtMatch[0].trim() : null)
  if (amtMatch) working = working.replace(amtMatch[0], ' ').trim()

  // Payment info (Zelle:xxx, Venmo:xxx, CashApp:xxx)
  const payMatch = working.match(/(?:zelle|venmo|cashapp|cash app|paypal)\s*[:\-]?\s*[^\s,]+/i)
  const paymentInfo = labeled.pay || (payMatch ? payMatch[0].trim() : null)
  if (payMatch) working = working.replace(payMatch[0], ' ').trim()

  // Name — first 1-2 capitalized words
  let name: string | null = labeled.name
  if (!name) {
    const nameMatch = working.match(/^\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/)
    name = nameMatch ? nameMatch[1].trim() : null
    if (name) working = working.replace(nameMatch![0], ' ').trim()
  }

  // Description — whatever's left (or from labeled)
  let description: string | null = labeled.need
  if (!description) {
    description = working.replace(/^[:,;\-\s]+/, '').trim()
    // Clean up residual punctuation
    description = description.replace(/\s+/g, ' ').slice(0, 200)
  }
  if (!description && raw.length > 0) description = raw.slice(0, 200)

  if (!name || !phone || !description) return null

  const area = zipCode ? (ZIP_TO_AREA_CHARITY[zipCode] || null) : null

  return {
    name,
    zipCode,
    area,
    description: description || 'Needs help',
    amount,
    paymentInfo,
    phone,
    raw,
  }
}

function normalizeE164(input: string): string | null {
  const digits = (input || '').replace(/\D/g, '')
  if (digits.length === 10) return '+1' + digits
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits
  return null
}

// ============================================
// Post freeform charity request
// ============================================
export async function postFreeformCharityRequest(parsed: FreeformCharityRequest): Promise<string> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  try {
    await prisma.charityRequest.create({
      data: {
        name: parsed.name,
        phone: parsed.phone,
        zipCode: parsed.zipCode,
        area: parsed.area,
        description: parsed.description,
        amount: parsed.amount,
        paymentInfo: parsed.paymentInfo,
        expiresAt,
        isActive: true,
      },
    })

    const exp = expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `❤️ Request posted. Thank you for reaching out.

👤 ${parsed.name}
${parsed.area ? `📍 ${parsed.area}${parsed.zipCode ? ' ('+parsed.zipCode+')' : ''}\n` : parsed.zipCode ? `📍 ZIP ${parsed.zipCode}\n` : ''}📝 ${parsed.description}
${parsed.amount ? `💰 ${parsed.amount}\n` : ''}${parsed.paymentInfo ? `💳 ${parsed.paymentInfo}\n` : ''}📞 ${parsed.phone}

⏰ Active until ${exp} (30 days)

May you be blessed with yeshuos b'karov.`
  } catch (err: any) {
    console.error('postFreeformCharityRequest error:', err?.message)
    return '⚠️ Could not post request right now. Please try again in a moment.'
  }
}
