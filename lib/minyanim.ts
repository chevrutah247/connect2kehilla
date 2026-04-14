// Minyan search — find prayer times by ZIP/area/shul name
import { readFileSync } from 'fs'
import { join } from 'path'

interface MinyanTime {
  days: string
  time: string
  note?: string
  topic?: string
}

interface Shul {
  id: string
  name: string
  aliases: string[]
  address: string
  zipCode: string
  area: string
  contact: string | null
  phone: string | null
  email: string | null
  website: string | null
  amenities: string[]
  schedule: {
    shacharis: MinyanTime[]
    mincha: MinyanTime[]
    maariv: MinyanTime[]
    shiurim?: MinyanTime[]
    note?: string
  }
}

type Tefillah = 'shacharis' | 'mincha' | 'maariv' | 'all'

let shulsCache: Shul[] | null = null

function loadShuls(): Shul[] {
  if (shulsCache) return shulsCache
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'shuls.json'), 'utf-8')
    shulsCache = JSON.parse(raw)
    return shulsCache!
  } catch {
    return []
  }
}

// Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
  }
  return dp[m][n]
}

// Detect which tefillah user is asking for
const TEFILLAH_ALIASES: Record<string, Tefillah> = {
  // English
  'shacharis': 'shacharis', 'shachrit': 'shacharis', 'shachris': 'shacharis',
  'shacharit': 'shacharis', 'morning': 'shacharis', 'morning prayer': 'shacharis',
  'mincha': 'mincha', 'minchah': 'mincha', 'afternoon': 'mincha',
  'afternoon prayer': 'mincha',
  'maariv': 'maariv', 'arvit': 'maariv',
  'evening': 'maariv', 'evening prayer': 'maariv', 'night': 'maariv',
  // Hebrew/Yiddish
  'שחרית': 'shacharis', 'מנחה': 'mincha', 'מעריב': 'maariv', 'ערבית': 'maariv',
  // Common misspellings
  'shachrus': 'shacharis', 'shachros': 'shacharis',
  'minche': 'mincha', 'mincheh': 'mincha',
  'mariv': 'maariv', 'marev': 'maariv', 'maarev': 'maariv',
}

export function detectTefillah(input: string): Tefillah {
  const lower = input.toLowerCase().trim()
  // Check exact alias
  if (TEFILLAH_ALIASES[lower]) return TEFILLAH_ALIASES[lower]
  // Check Hebrew/Yiddish
  if (TEFILLAH_ALIASES[input.trim()]) return TEFILLAH_ALIASES[input.trim()]
  // Check if input contains a tefillah word
  for (const [alias, tef] of Object.entries(TEFILLAH_ALIASES)) {
    if (lower.includes(alias)) return tef
  }
  return 'all'
}

// Search shuls by ZIP code
export function searchShulsByZip(zip: string): Shul[] {
  const shuls = loadShuls()
  return shuls.filter(s => s.zipCode === zip)
}

// Search shuls by area
export function searchShulsByArea(area: string): Shul[] {
  const shuls = loadShuls()
  const lower = area.toLowerCase()
  return shuls.filter(s => s.area.toLowerCase().includes(lower))
}

// Search shuls by name (fuzzy)
export function searchShulByName(name: string): Shul | null {
  const shuls = loadShuls()
  const lower = name.toLowerCase().trim()

  // Exact name match
  for (const shul of shuls) {
    if (shul.name.toLowerCase() === lower) return shul
  }

  // Alias match
  for (const shul of shuls) {
    for (const alias of shul.aliases) {
      if (alias.toLowerCase() === lower) return shul
    }
  }

  // Partial match (input contains alias or alias contains input)
  for (const shul of shuls) {
    if (shul.name.toLowerCase().includes(lower) || lower.includes(shul.name.toLowerCase())) {
      return shul
    }
    for (const alias of shul.aliases) {
      if (alias.toLowerCase().includes(lower) || lower.includes(alias.toLowerCase())) {
        return shul
      }
    }
  }

  // Fuzzy match (Levenshtein ≤ 3)
  let bestShul: Shul | null = null
  let bestDist = Infinity
  for (const shul of shuls) {
    const targets = [shul.name.toLowerCase(), ...shul.aliases.map(a => a.toLowerCase())]
    for (const target of targets) {
      const dist = levenshtein(lower, target)
      if (dist < bestDist && dist <= 3) {
        bestDist = dist
        bestShul = shul
      }
    }
  }

  return bestShul
}

// Format minyan times for SMS
export function formatMinyanForSMS(shuls: Shul[], tefillah: Tefillah): string {
  if (shuls.length === 0) {
    return '🕍 No shuls found in this area.\n\nReply HELP for assistance.'
  }

  const tefillahNames: Record<Tefillah, string> = {
    shacharis: 'Shacharis',
    mincha: 'Mincha',
    maariv: "Ma'ariv",
    all: 'Prayer Times',
  }

  let response = `🕍 ${tefillahNames[tefillah]} — ${shuls[0].area}:\n\n`
  let count = 0

  for (const shul of shuls) {
    const times = tefillah === 'all'
      ? [...(shul.schedule.shacharis || []).map(t => ({ ...t, type: 'Shacharis' })),
         ...(shul.schedule.mincha || []).map(t => ({ ...t, type: 'Mincha' })),
         ...(shul.schedule.maariv || []).map(t => ({ ...t, type: "Ma'ariv" }))]
      : (shul.schedule[tefillah] || []).map(t => ({ ...t, type: tefillahNames[tefillah] }))

    if (times.length === 0 && tefillah !== 'all') continue
    if (times.length === 0 && shul.schedule.note) {
      // Show note even without times
    } else if (times.length === 0) {
      continue
    }

    count++
    response += `${count}. ${shul.name}\n`
    response += `   📍 ${shul.address}\n`

    if (tefillah === 'all') {
      // Group by type
      for (const type of ['Shacharis', 'Mincha', "Ma'ariv"]) {
        const typeTimes = times.filter(t => t.type === type)
        if (typeTimes.length > 0) {
          response += `   ${type}: ${typeTimes.map(t => t.time).join(', ')}\n`
        }
      }
    } else {
      for (const t of times) {
        response += `   🕐 ${t.days}: ${t.time}\n`
      }
    }

    if (shul.phone) {
      response += `   📞 ${shul.phone}\n`
    }

    if (shul.schedule.note) {
      response += `   ℹ️ ${shul.schedule.note}\n`
    }

    response += '\n'

    // SMS length limit
    if (response.length > 1400) {
      response += `... and ${shuls.length - count} more shuls\n`
      break
    }
  }

  if (count === 0) {
    return `🕍 No ${tefillahNames[tefillah]} times found in this area.\n\nTry: "shacharis 11213" or "mincha Crown Heights"\n\nReply HELP for assistance.`
  }

  response += '💡 Please tell them Connect2Kehilla sent you!\n\n'
  response += 'Reply HELP for assistance or STOP to unsubscribe.'
  return response
}

// Format single shul info for SMS
export function formatShulForSMS(shul: Shul): string {
  let response = `🕍 ${shul.name}\n`
  response += `📍 ${shul.address}\n`
  if (shul.phone) response += `📞 ${shul.phone}\n`
  if (shul.email) response += `📧 ${shul.email}\n`
  if (shul.website) response += `🌐 ${shul.website}\n`
  response += '\n'

  const { shacharis, mincha, maariv } = shul.schedule

  if (shacharis.length > 0) {
    response += '🌅 Shacharis:\n'
    for (const t of shacharis) response += `   ${t.days}: ${t.time}\n`
  }
  if (mincha.length > 0) {
    response += '☀️ Mincha:\n'
    for (const t of mincha) response += `   ${t.days}: ${t.time}\n`
  }
  if (maariv.length > 0) {
    response += "🌙 Ma'ariv:\n"
    for (const t of maariv) response += `   ${t.days}: ${t.time}\n`
  }

  if (shul.schedule.shiurim && shul.schedule.shiurim.length > 0) {
    response += '📚 Shiurim:\n'
    for (const t of shul.schedule.shiurim) {
      response += `   ${t.days}: ${t.time}${t.topic ? ` — ${t.topic}` : ''}\n`
    }
  }

  if (shul.schedule.note) {
    response += `\nℹ️ ${shul.schedule.note}\n`
  }

  if (shul.amenities.length > 0) {
    const icons: Record<string, string> = {
      coffee: '☕', kiddush: '🍷', kids_program: '👶', library: '📚',
      chavrusas: '👥', open_24h: '🔓', food: '🍕', mezonos: '🍪', seltzer: '🥤',
      shiurim: '📖',
    }
    const amenStr = shul.amenities.map(a => icons[a] || a).join(' ')
    response += `\n${amenStr}\n`
  }

  response += '\n💡 Please tell them Connect2Kehilla sent you!\n'
  response += 'Reply HELP for assistance or STOP to unsubscribe.'
  return response
}
