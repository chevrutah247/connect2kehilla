// lib/jewish-calendar.ts
// Jewish calendar utilities: Sfirat Ha'Omer, Candle Lighting,
// Rosh Chodesh, Fasts, Birkat HaLevana.
// Data source: @hebcal/core (same library used across the app).

import {
  HDate, HebrewCalendar, Location,
  CandleLightingEvent, HavdalahEvent, RoshChodeshEvent,
  Event,
} from '@hebcal/core'
import { lookupZip, DEFAULT_LOCATION, LocationInfo } from './locations'

// ─────────────────────────────────────────────
// ZIP → @hebcal/core Location via lib/locations.
// Returns null for unknown ZIPs so callers can surface
// "not supported" instead of silently defaulting to NY.
// ─────────────────────────────────────────────
function locationForZip(zip?: string | null): { loc: Location; info: LocationInfo } | null {
  const info = lookupZip(zip)
  if (!info) return null
  return {
    info,
    loc: new Location(info.lat, info.lng, false, info.tzid, info.city, 'US', info.zip),
  }
}

// Legacy callers (sfira / rosh chodesh / fast / birkat levana) don't
// take ZIP input — they still need SOME location for Shabbat-week
// boundaries. Use Crown Heights as the canonical default.
function defaultLocation(): { loc: Location; info: LocationInfo } {
  const info = DEFAULT_LOCATION
  return {
    info,
    loc: new Location(info.lat, info.lng, false, info.tzid, info.city, 'US', info.zip),
  }
}

function formatTime(d: Date, tzid: string): string {
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: tzid,
  })
}

// Date formatters for Rosh Chodesh / Fasts / Birkat Halevana don't
// care about user ZIP — these are Hebrew-calendar events with
// day-level precision, not times. Default to Crown Heights TZ for
// display consistency; the date itself is the same across the US.
function formatDate(d: Date, tzid: string = DEFAULT_LOCATION.tzid): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: tzid,
  })
}

// ─────────────────────────────────────────────
// 1. Sfirat HaOmer (counting the Omer)
//    Active 16 Nissan → 5 Sivan (49 days)
// ─────────────────────────────────────────────
export function formatSfiratHaOmer(): string {
  const today = new HDate()

  // Compute Omer day manually. Omer starts on 16 Nissan (day after first seder).
  // HebCal month numbers: Nissan = 1, Iyar = 2, Sivan = 3.
  const omerStart = new HDate(16, 1 /* Nissan */, today.getFullYear())
  const daysSinceStart = today.abs() - omerStart.abs() + 1

  // Valid Omer window: days 1-49 (ends on 5 Sivan night → 6 Sivan = Shavuos).
  if (daysSinceStart < 1 || daysSinceStart > 49) {
    return '🌾 Sfiras Ha\'Omer is counted only between the 2nd night of Pesach (16 Nissan) and Shavuos (5 Sivan).\n\nIt is not the season right now — come back between Pesach and Shavuos!'
  }
  const omerDay = daysSinceStart

  // The counting is done at night — hence "last night's" count applies.
  // We report TODAY'S omer day (which was counted last night / will be counted tonight).
  const week = Math.floor((omerDay - 1) / 7) + 1
  const dayOfWeek = ((omerDay - 1) % 7) + 1
  const totalWeeks = Math.floor(omerDay / 7)
  const extraDays = omerDay % 7

  // Construct the text exactly per standard nusach
  let nusach = `Today is day ${omerDay}`
  if (omerDay >= 7) {
    if (totalWeeks === 1 && extraDays === 0) {
      nusach = `Today is 7 days, which is 1 week, of the Omer.`
    } else if (extraDays === 0) {
      nusach = `Today is ${omerDay} days, which is ${totalWeeks} weeks, of the Omer.`
    } else if (totalWeeks === 1) {
      nusach = `Today is ${omerDay} days, which is 1 week and ${extraDays} day${extraDays > 1 ? 's' : ''}, of the Omer.`
    } else {
      nusach = `Today is ${omerDay} days, which is ${totalWeeks} weeks and ${extraDays} day${extraDays > 1 ? 's' : ''}, of the Omer.`
    }
  } else {
    nusach = `Today is ${omerDay} day${omerDay > 1 ? 's' : ''} of the Omer.`
  }

  // Sefira attribute for this day (7 attributes × 7 weeks = 49 combinations)
  const attributes = ['Chesed', 'Gevurah', 'Tiferes', 'Netzach', 'Hod', 'Yesod', 'Malchus']
  const weekAttr = attributes[week - 1]
  const dayAttr = attributes[dayOfWeek - 1]

  return [
    '🌾 SFIRAS HA\'OMER',
    '',
    `היום ${omerDay} יום לעומר`,
    nusach,
    '',
    `Day ${omerDay} of 49 • Week ${week}, Day ${dayOfWeek}`,
    `Middah: ${dayAttr} she'b'${weekAttr}`,
    '',
    'Count after nightfall (tzeis hakochavim).',
    'Reply ZMANIM 11213 for today\'s times.',
  ].join('\n')
}

// ─────────────────────────────────────────────
// 2. Candle Lighting (next Friday / Yom Tov)
// ─────────────────────────────────────────────
export function formatCandleLighting(zip?: string | null): string {
  // If caller didn't provide a ZIP at all, use the default (Crown Heights).
  // If they DID provide one but we don't recognise it — tell them, don't
  // silently show NYC candle-lighting.
  const resolved = zip ? locationForZip(zip) : defaultLocation()
  if (!resolved) {
    return `🕯 Couldn't find that ZIP code.
Please send your 5-digit US ZIP.
Example: candle 11213

Outside the US? Email
contact@connect2kehilla.com`
  }
  const { loc, info } = resolved
  const now = new Date()
  const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // next 14 days

  const events = HebrewCalendar.calendar({
    start: now,
    end: endDate,
    location: loc,
    candlelighting: true,
    havdalahMins: 72, // 72 minutes after sunset (Chabad minhag)
    sedrot: false,
    il: false,
  })

  const candle = events.find((e: Event) => e instanceof CandleLightingEvent)
  const havdalah = events.find((e: Event) => e instanceof HavdalahEvent)

  if (!candle) {
    return `🕯 No candle-lighting times found in the next 14 days for ${info.zip}.`
  }

  const candleDate = candle.getDate().greg()
  const candleDateTime = (candle as any).eventTime as Date | undefined
  const havdalahDateTime = havdalah ? ((havdalah as any).eventTime as Date | undefined) : undefined

  const lines: string[] = []
  lines.push('🕯 CANDLE LIGHTING')
  lines.push('')
  lines.push(`📍 ${info.city}, ${info.state} ${info.zip}`)
  lines.push('')
  lines.push(`${formatDate(candleDate, info.tzid)}`)
  if (candleDateTime) lines.push(`🕯 Light: ${formatTime(candleDateTime, info.tzid)}`)
  if (havdalah && havdalahDateTime) {
    lines.push(`✨ Havdalah: ${formatTime(havdalahDateTime, info.tzid)} (72 min)`)
  }
  lines.push('')
  lines.push('Reply ZMAN for full menu.')
  return lines.join('\n')
}

// ─────────────────────────────────────────────
// 3. Rosh Chodesh (within next 30 days; flag if within 3 days)
// ─────────────────────────────────────────────
export function formatRoshChodesh(): string {
  const now = new Date()
  const end = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000) // 45 days ahead

  const events = HebrewCalendar.calendar({
    start: now,
    end,
    sedrot: false,
    noHolidays: false,
    il: false,
  }).filter((e: Event) => e instanceof RoshChodeshEvent) as RoshChodeshEvent[]

  if (!events.length) {
    return '🌑 No Rosh Chodesh in the next 45 days.'
  }

  const lines: string[] = ['🌑 ROSH CHODESH', '']
  const grouped: { month: string; dates: Date[] }[] = []
  for (const ev of events.slice(0, 4)) {
    const date = ev.getDate().greg()
    const monthName = ev.getDesc().replace('Rosh Chodesh ', '')
    const existing = grouped.find(g => g.month === monthName)
    if (existing) existing.dates.push(date)
    else grouped.push({ month: monthName, dates: [date] })
  }

  for (const g of grouped) {
    const days = g.dates.map(d => formatDate(d)).join(' & ')
    const daysUntil = Math.ceil((g.dates[0].getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    const heading = daysUntil <= 3 ? `🔔 ${g.month} (in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}):` : `${g.month}:`
    lines.push(heading)
    lines.push(`  ${days}`)
    lines.push('')
  }

  lines.push('Yaʿaleh V\'yavo in Shmoneh Esreh & Birkas HaMazon.')
  lines.push('Half Hallel in the morning.')
  return lines.join('\n')
}

// ─────────────────────────────────────────────
// 4. Fasts (next within 60 days, flag within 3 days)
// ─────────────────────────────────────────────
const FAST_KEYS: Record<string, string> = {
  'Tzom Gedaliah': 'Tzom Gedaliah',
  'Yom Kippur': 'Yom Kippur',
  'Asara B\'Tevet': 'Asara B\'Teves',
  'Ta\'anit Esther': 'Taʿanis Esther',
  'Tzom Tammuz': 'Shivʿa Asar b\'Tammuz',
  'Tish\'a B\'Av': 'Tishʿa B\'Av',
}

export function formatFasts(): string {
  const now = new Date()
  const end = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000)

  const events = HebrewCalendar.calendar({
    start: now,
    end,
    sedrot: false,
    noHolidays: false,
    il: false,
  }).filter((e: Event) => {
    const desc = e.getDesc()
    return Object.keys(FAST_KEYS).includes(desc)
  })

  if (!events.length) return '🕍 No fast days in the next 4 months.'

  const lines: string[] = ['🕍 FAST DAYS', '']
  for (const ev of events.slice(0, 4)) {
    const date = ev.getDate().greg()
    const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    const prefix = daysUntil <= 3 ? '🔔 ' : ''
    const suffix = daysUntil <= 3 ? ` (in ${daysUntil} day${daysUntil !== 1 ? 's' : ''})` : ''
    lines.push(`${prefix}${FAST_KEYS[ev.getDesc()]}${suffix}`)
    lines.push(`  ${formatDate(date)}`)
    lines.push('')
  }

  lines.push('Fast from dawn until nightfall')
  lines.push('(Yom Kippur & Tish\'a B\'Av: sunset to sunset).')
  return lines.join('\n')
}

// ─────────────────────────────────────────────
// 5. Birkat HaLevana (Kiddush Levana)
//    Window: from 3 days after molad until 14 days 18 hours 22 minutes after molad.
//    Chabad minhag: from 7 days (some use 3).
//    We'll compute current Hebrew month's window and show 3 days before start.
// ─────────────────────────────────────────────
export function formatBirkatHalevana(): string {
  const now = new Date()
  const today = new HDate(now)

  // Determine window for this Hebrew month
  // Start = Rosh Chodesh day + 3 days (earliest allowed per some poskim, Chabad uses 7,
  //         but we display starting day 3 so users know when it's possible at all)
  // End   = day 15 of month

  const hebMonth = today.getMonth()
  const hebYear = today.getFullYear()

  // Day 1 of month
  const monthStart = new HDate(1, hebMonth, hebYear).greg()
  const startEarliest = new Date(monthStart.getTime() + 3 * 24 * 60 * 60 * 1000)
  const startChabad = new Date(monthStart.getTime() + 7 * 24 * 60 * 60 * 1000)
  const windowEnd = new Date(monthStart.getTime() + 15 * 24 * 60 * 60 * 1000 - 1000)

  const msInDay = 24 * 60 * 60 * 1000
  const daysToStart = Math.ceil((startEarliest.getTime() - now.getTime()) / msInDay)
  const daysToEnd = Math.ceil((windowEnd.getTime() - now.getTime()) / msInDay)

  // If we're already past the window for this month, calculate for next month.
  // "next month" in Hebrew calendar: advance Gregorian by ~29.5 days then recompute month.
  if (daysToEnd < -1) {
    const approxNextMonthStart = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000)
    const nextMonthHD = new HDate(approxNextMonthStart)
    const nextStart = new HDate(1, nextMonthHD.getMonth(), nextMonthHD.getFullYear()).greg()
    const nextEarliest = new Date(nextStart.getTime() + 3 * 24 * 60 * 60 * 1000)
    const nextChabad = new Date(nextStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    const nextEnd = new Date(nextStart.getTime() + 15 * 24 * 60 * 60 * 1000 - 1000)

    return [
      '🌙 BIRKAS HALEVANA',
      '',
      `Next window: ${nextMonthHD.getMonthName()}`,
      `Earliest (3 days): ${formatDate(nextEarliest)}`,
      `Chabad minhag (7 days): ${formatDate(nextChabad)}`,
      `Latest: ${formatDate(nextEnd)}`,
      '',
      'Only recited at night, under clear sky when moon is visible.',
    ].join('\n')
  }

  // Within window or approaching
  const isOpen = now >= startEarliest && now <= windowEnd
  const approachingSoon = daysToStart > 0 && daysToStart <= 3

  const lines: string[] = ['🌙 BIRKAS HALEVANA', '']
  lines.push(`Month: ${today.getMonthName()}`)
  lines.push('')

  if (isOpen) {
    lines.push('✅ The window is OPEN now.')
    lines.push(`Latest: ${formatDate(windowEnd)}`)
  } else if (approachingSoon) {
    lines.push(`🔔 Opens in ${daysToStart} day${daysToStart !== 1 ? 's' : ''}`)
    lines.push(`Earliest (3 days): ${formatDate(startEarliest)}`)
    lines.push(`Chabad minhag (7 days): ${formatDate(startChabad)}`)
    lines.push(`Latest: ${formatDate(windowEnd)}`)
  } else {
    lines.push(`Opens: ${formatDate(startEarliest)}`)
    lines.push(`Chabad (7 days): ${formatDate(startChabad)}`)
    lines.push(`Latest: ${formatDate(windowEnd)}`)
  }

  lines.push('')
  lines.push('Only recited at night,')
  lines.push('under clear sky when moon is visible.')
  return lines.join('\n')
}

// ─────────────────────────────────────────────
// Zman menu (main entry for "ZMAN")
// ─────────────────────────────────────────────
export function formatZmanMenu(): string {
  return [
    '📅 ZMAN — Jewish Calendar',
    '',
    '🕯 CANDLE [zip] — lighting times',
    '🕍 ZMANIM [zip] — prayer times',
    '🌾 SFIRA — counting of the Omer',
    '🌑 ROSH CHODESH — upcoming',
    '🕍 FAST — upcoming fast days',
    '🌙 BIRKAT LEVANA — Kiddush Levana',
    '',
    'Example: "candle 11213" or "sfira"',
  ].join('\n')
}

// Detect which calendar command was requested
export type CalendarIntent = 'zman_menu' | 'candle' | 'sfira' | 'rosh_chodesh' | 'fast' | 'birkat_levana' | null

export function detectCalendarIntent(body: string): CalendarIntent {
  const t = body.toLowerCase().trim()

  // Exact menu keywords (explicit, not misfire-prone)
  if (/^(zman|zmanei?|calendar|luach)$/.test(t)) return 'zman_menu'
  if (/^(זמן|זמנים)$/.test(body.trim())) return 'zman_menu'

  // Sfirat HaOmer
  if (/\b(sfira|sfiras|sfirat|sefira|sefiras|sefirat|omer)\b/.test(t)) return 'sfira'
  if (/ספיר|עומר/.test(body)) return 'sfira'

  // Candle lighting
  if (/\b(candle|candles|candlelighting|licht|licht|hadlakas|hadlakat)\b/.test(t)) return 'candle'
  if (/הדלקת|נרות/.test(body)) return 'candle'

  // Rosh Chodesh
  if (/\b(rosh\s*chodesh|rosh\s*hodesh|r\'?ch|rc)\b/.test(t)) return 'rosh_chodesh'
  if (/ראש\s*חודש/.test(body)) return 'rosh_chodesh'

  // Fasts
  if (/\b(fast|fasts|taanit|taanis|tzom)\b/.test(t)) return 'fast'
  if (/תענית|צום/.test(body)) return 'fast'

  // Birkat HaLevana
  if (/\b(birkas\s*halevana|birkat\s*halevana|kiddush\s*levana|levana)\b/.test(t)) return 'birkat_levana'
  if (/ברכת\s*הלבנה|קידוש\s*לבנה/.test(body)) return 'birkat_levana'

  return null
}
