// lib/subscriptions.ts
// SMS subscription system — users can subscribe to category broadcasts
// (Mazel Tov, Rosh Chodesh, Birkat Levana, Sfira, Gmach, Jobs, Charity)

import prisma from './db'

// ─────────────────────────────────────────────
// Topic registry — single source of truth
// ─────────────────────────────────────────────
export interface TopicDef {
  key: string                       // canonical slug stored in DB
  number: number                    // menu number
  emoji: string
  label: string                     // human-friendly label
  shortAlias: string                // short keyword for "SUB <ALIAS>" (e.g. "SFIRA", "RC", "BL")
  longAliases: string[]             // additional accepted aliases for parsing
  description: string               // shown in SUB menu
  needsZip?: boolean                // true if subscription requires ZIP filter (e.g. GMACH, CANDLE)
}

export const TOPICS: TopicDef[] = [
  {
    key: 'mazel_tov', number: 1, emoji: '🎊',
    label: 'Mazel Tov / Simcha', shortAlias: 'MAZEL TOV',
    longAliases: ['MAZEL', 'MAZEL TOV', 'SIMCHA', 'SIMCHAS', 'MT'],
    description: 'Community simchas — engagements, weddings, births, bar mitzvahs',
  },
  {
    key: 'rosh_chodesh', number: 2, emoji: '🌑',
    label: 'Rosh Chodesh', shortAlias: 'RC',
    longAliases: ['RC', 'ROSH CHODESH', 'ROSH HODESH', 'RH', 'ROSH'],
    description: 'Reminder 3 days before each Rosh Chodesh',
  },
  {
    key: 'birkat_levana', number: 3, emoji: '🌙',
    label: 'Birkat Levana', shortAlias: 'BL',
    longAliases: ['BL', 'BIRKAT LEVANA', 'BIRKAS LEVANA', 'KIDDUSH LEVANA', 'LEVANA'],
    description: 'Reminder when the window opens each Hebrew month',
  },
  {
    key: 'sfira', number: 4, emoji: '🌾',
    label: 'Sfira (daily during season)', shortAlias: 'SFIRA',
    longAliases: ['SFIRA', 'SFIRAS', 'SFIRAT', 'SEFIRA', 'OMER'],
    description: 'Daily Sfira count between Pesach and Shavuos',
  },
  {
    key: 'gmach', number: 5, emoji: '🎁',
    label: 'Gmach (new offers in your ZIP)', shortAlias: 'GMACH',
    longAliases: ['GMACH', 'GMAH', 'GEMACH'],
    description: 'New gemach items posted in your ZIP / area',
    needsZip: true,
  },
  {
    key: 'jobs', number: 6, emoji: '📋',
    label: 'Job alerts (in your area)', shortAlias: 'JOBS',
    longAliases: ['JOBS', 'JOB', 'WORK'],
    description: 'New jobs posted in your area',
    needsZip: true,
  },
  {
    key: 'charity', number: 7, emoji: '❤️',
    label: 'Charity requests (in your area)', shortAlias: 'CHARITY',
    longAliases: ['CHARITY', 'TZEDAKA', 'TZEDAKAH'],
    description: 'New tzedaka requests in your area',
    needsZip: true,
  },
]

function findTopic(input: string): TopicDef | null {
  const t = input.toUpperCase().trim()
  // Numeric (1-7)
  if (/^[1-7]$/.test(t)) {
    return TOPICS.find(top => top.number === parseInt(t)) || null
  }
  // By alias (longest match first to avoid e.g. "MT" matching inside "EMPTY")
  for (const topic of TOPICS) {
    for (const alias of [...topic.longAliases].sort((a, b) => b.length - a.length)) {
      if (t === alias) return topic
    }
  }
  return null
}

// ─────────────────────────────────────────────
// Format SUB menu
// ─────────────────────────────────────────────
export function formatSubMenu(): string {
  const lines: string[] = ['📬 SUBSCRIBE TO UPDATES', '']
  for (const t of TOPICS) {
    lines.push(`${t.number} ${t.emoji} ${t.label}`)
  }
  lines.push('')
  lines.push('Reply 1-7 to subscribe.')
  lines.push('Or text directly: "SUB SFIRA"')
  lines.push('Reply MY SUBS to see your list.')
  lines.push('Reply UNSUB to cancel.')
  return lines.join('\n')
}

// ─────────────────────────────────────────────
// Format current user's subscriptions
// ─────────────────────────────────────────────
export async function formatMySubscriptions(userId: string): Promise<string> {
  const subs = await prisma.subscription.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'asc' },
  })
  if (subs.length === 0) {
    return '📭 You have no subscriptions.\n\nReply SUB to see available topics.'
  }
  const lines: string[] = ['📬 YOUR SUBSCRIPTIONS', '']
  for (const sub of subs) {
    const topic = TOPICS.find(t => t.key === sub.topic)
    if (!topic) continue
    const loc = sub.zipCode ? ` (${sub.zipCode})` : ''
    lines.push(`${topic.emoji} ${topic.label}${loc}`)
  }
  lines.push('')
  lines.push(`Total: ${subs.length} active`)
  lines.push('')
  lines.push('Reply UNSUB <name> to cancel one.')
  lines.push('Reply UNSUB to cancel all.')
  return lines.join('\n')
}

// ─────────────────────────────────────────────
// Subscribe a user to a topic
// ─────────────────────────────────────────────
export async function subscribe(userId: string, topicInput: string, zip: string | null = null): Promise<string> {
  const topic = findTopic(topicInput)
  if (!topic) {
    return `❓ Unknown topic "${topicInput}". Reply SUB to see the menu.`
  }

  // upsert
  await prisma.subscription.upsert({
    where: { userId_topic: { userId, topic: topic.key } },
    create: { userId, topic: topic.key, zipCode: zip, isActive: true },
    update: { isActive: true, zipCode: zip || undefined },
  })

  let msg = `✅ Subscribed to ${topic.emoji} ${topic.label}`
  if (zip) msg += ` (${zip})`
  if (topic.needsZip && !zip) {
    msg += `\n\n💡 Tip: Add a ZIP for local results — text "SUB ${topic.shortAlias} 11213"`
  }
  msg += '\n\nReply MY SUBS to see all.\nReply UNSUB to cancel.'
  return msg
}

// ─────────────────────────────────────────────
// Unsubscribe
// ─────────────────────────────────────────────
export async function unsubscribeOne(userId: string, topicInput: string): Promise<string> {
  const topic = findTopic(topicInput)
  if (!topic) {
    return `❓ Unknown topic "${topicInput}". Reply MY SUBS to see your list.`
  }
  const updated = await prisma.subscription.updateMany({
    where: { userId, topic: topic.key, isActive: true },
    data: { isActive: false },
  })
  if (updated.count === 0) {
    return `You weren't subscribed to ${topic.label}.`
  }
  return `✅ Unsubscribed from ${topic.emoji} ${topic.label}.`
}

export async function unsubscribeAll(userId: string): Promise<string> {
  const updated = await prisma.subscription.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  })
  if (updated.count === 0) {
    return '📭 You have no active subscriptions.'
  }
  return `✅ Unsubscribed from all ${updated.count} topics.\n\nReply SUB anytime to subscribe again.`
}

// ─────────────────────────────────────────────
// Intent detection
// ─────────────────────────────────────────────
export type SubIntent =
  | { type: 'menu' }
  | { type: 'list' }
  | { type: 'subscribe'; topic: string; zip: string | null }
  | { type: 'unsubscribe_one'; topic: string }
  | { type: 'unsubscribe_all' }
  | null

export function detectSubIntent(body: string): SubIntent {
  const t = body.toUpperCase().trim()

  // MY SUBS / MY SUBSCRIPTIONS
  if (/^(MY\s*SUBS?|MY\s*SUBSCRIPTIONS?|SUBSCRIPTIONS?)$/.test(t)) {
    return { type: 'list' }
  }

  // SUB menu (alone)
  if (/^(SUB|SUBSCRIBE)$/.test(t)) {
    return { type: 'menu' }
  }

  // SUB <topic> [zip]
  const subMatch = t.match(/^(?:SUB|SUBSCRIBE)\s+(.+?)(?:\s+(\d{5}))?$/)
  if (subMatch) {
    return { type: 'subscribe', topic: subMatch[1].trim(), zip: subMatch[2] || null }
  }

  // UNSUB / UNSUBSCRIBE alone — cancel all
  if (/^(UNSUB|UNSUBSCRIBE)$/.test(t)) {
    return { type: 'unsubscribe_all' }
  }

  // UNSUB <topic>
  const unsubMatch = t.match(/^(?:UNSUB|UNSUBSCRIBE)\s+(.+)$/)
  if (unsubMatch) {
    return { type: 'unsubscribe_one', topic: unsubMatch[1].trim() }
  }

  return null
}

// ─────────────────────────────────────────────
// Handle SUB-related intents (single entry point for SMS route)
// ─────────────────────────────────────────────
export async function handleSubIntent(intent: SubIntent, userId: string): Promise<string | null> {
  if (!intent) return null
  if (intent.type === 'menu') return formatSubMenu()
  if (intent.type === 'list') return formatMySubscriptions(userId)
  if (intent.type === 'subscribe') return subscribe(userId, intent.topic, intent.zip)
  if (intent.type === 'unsubscribe_one') return unsubscribeOne(userId, intent.topic)
  if (intent.type === 'unsubscribe_all') return unsubscribeAll(userId)
  return null
}

// ─────────────────────────────────────────────
// Get all active subscribers for a topic (for broadcasts)
// Optionally filter by ZIP / area
// ─────────────────────────────────────────────
export async function getSubscribersForTopic(
  topic: string,
  filter?: { zipCode?: string; area?: string }
): Promise<Array<{ userId: string; phone: string; zipCode: string | null; area: string | null }>> {
  const where: any = {
    topic,
    isActive: true,
  }
  if (filter?.zipCode) where.zipCode = filter.zipCode
  if (filter?.area) where.area = { contains: filter.area, mode: 'insensitive' }

  const subs = await prisma.subscription.findMany({
    where,
    select: {
      userId: true,
      zipCode: true,
      area: true,
      user: { select: { phone: true, isBlocked: true } },
    },
  })

  return subs
    .filter((s: any) => s.user?.phone && !s.user?.isBlocked)
    .map((s: any) => ({
      userId: s.userId,
      phone: s.user!.phone!,
      zipCode: s.zipCode,
      area: s.area,
    }))
}

// ─────────────────────────────────────────────
// Contextual subscribe hint — append to other responses
// e.g. after SFIRA response, suggest "Reply SUB SFIRA for daily updates"
// ─────────────────────────────────────────────
export function subscribeHint(topicKey: string): string {
  const topic = TOPICS.find(t => t.key === topicKey)
  if (!topic) return ''
  return `\n\n📬 Reply SUB ${topic.shortAlias} for ${topic.description.toLowerCase()}.`
}
