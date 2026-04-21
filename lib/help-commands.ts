// lib/help-commands.ts
// Detects per-category help commands like "SIMCHA ?", "? simcha",
// "help simcha", "jobs?" etc. Runs BEFORE the OpenAI parser to
// avoid a round-trip for these cheap pattern matches.
//
// Supported commands (all case-insensitive):
//   SEARCH ?   simcha ?   LECHAIM?   specials?
//   JOBS ?     MINYAN ?   ZMANIM?    GMACH ?
//   SHIDDUCH?  CHARITY ?  ZIP ?      HELP <cat>
//
// All of these yield the same result:
//   "SIMCHA ?", "simcha?", "SIMCHA?", "? simcha", "help simcha"
//
// Returns a stable key from HELP_KEYS or null.

export type HelpKey =
  | 'search_help'
  | 'simcha_help'
  | 'lechaim_help'
  | 'specials_help'
  | 'jobs_help'
  | 'minyan_help'
  | 'zmanim_help'
  | 'gmach_help'
  | 'shidduch_help'
  | 'charity_help'
  | 'subscribe_help'
  | 'zip_help'

// Canonical category → aliases recognised in input.
// Keep aliases narrow to avoid false positives with SEARCH queries.
const CATEGORY_ALIASES: Array<{ key: HelpKey; aliases: string[] }> = [
  { key: 'search_help', aliases: ['search', 'find'] },
  { key: 'simcha_help', aliases: ['simcha', 'simchas', 'mazel', 'mazel tov', 'mazeltov'] },
  { key: 'lechaim_help', aliases: ["l'chaim", 'lechaim', 'l chaim'] },
  { key: 'specials_help', aliases: ['specials', 'special', 'deals'] },
  { key: 'jobs_help', aliases: ['jobs', 'job', 'work'] },
  { key: 'minyan_help', aliases: ['minyan', 'minyanim', 'shul', 'shuls'] },
  { key: 'zmanim_help', aliases: ['zmanim', 'zman', 'zmanei'] },
  { key: 'gmach_help', aliases: ['gmach', 'gmah', 'gemach', 'gemachs'] },
  { key: 'shidduch_help', aliases: ['shidduch', 'shidduchim'] },
  { key: 'charity_help', aliases: ['charity', 'tzedaka', 'tzedakah', 'donate', 'donation'] },
  { key: 'subscribe_help', aliases: ['subscribe', 'sub', 'subs', 'subscription', 'subscriptions', 'alerts', 'notifications'] },
  { key: 'zip_help', aliases: ['zip', 'zipcode', 'zip code'] },
]

// Build a map: alias → key
const ALIAS_TO_KEY: Map<string, HelpKey> = (() => {
  const m = new Map<string, HelpKey>()
  for (const { key, aliases } of CATEGORY_ALIASES) {
    for (const a of aliases) m.set(a, key)
  }
  return m
})()

// Flat list of aliases, longest-first — so "mazel tov" matches before "mazel"
const ALL_ALIASES: string[] = Array.from(ALIAS_TO_KEY.keys()).sort(
  (a, b) => b.length - a.length,
)

// Escape regex special chars in an alias
function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Detects a per-category help request. Returns the help key or null.
 *
 * Accepted patterns (case-insensitive, any amount of whitespace):
 *   <alias> ?          e.g. "SIMCHA?", "jobs ?"
 *   ? <alias>          e.g. "? simcha"
 *   help <alias>       e.g. "help jobs"
 *   <alias> help       e.g. "jobs help"
 */
export function detectHelpCommand(input: string): HelpKey | null {
  if (!input) return null
  const t = input.trim().toLowerCase()
  if (!t) return null

  // Skip long messages — clearly not a bare "CAT ?" command
  if (t.length > 40) return null

  // Build a regex that captures the alias in any of the 4 positions
  const aliasGroup = ALL_ALIASES.map(esc).join('|')
  // Pattern A: "<alias> ?" or "? <alias>"  (bare question-mark form)
  const patQ = new RegExp(`^\\s*(?:\\?\\s*(${aliasGroup})|(${aliasGroup})\\s*\\?)\\s*$`)
  // Pattern B: "help <alias>" or "<alias> help"
  const patH = new RegExp(`^\\s*(?:help\\s+(${aliasGroup})|(${aliasGroup})\\s+help)\\s*$`)

  const mQ = t.match(patQ)
  if (mQ) {
    const alias = (mQ[1] || mQ[2])?.trim()
    if (alias) return ALIAS_TO_KEY.get(alias) || null
  }
  const mH = t.match(patH)
  if (mH) {
    const alias = (mH[1] || mH[2])?.trim()
    if (alias) return ALIAS_TO_KEY.get(alias) || null
  }
  return null
}
