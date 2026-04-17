// lib/fast-parser.ts
// Regex-based fast parser for common SMS query patterns.
// Skips the OpenAI call (1.2–2.6 sec) for queries we can recognize with confidence.
// Falls back to null (caller then uses OpenAI parseQuery).

import { normalizeArea, normalizeCategory, matchKeywordToCategory } from './fuzzy'

export interface FastParsed {
  intent: 'search'
  category: string | null
  zipCode: string | null
  area: string | null
  businessName: string | null
  confidence: number
  source: 'fast'
}

// Commands that should NEVER fast-parse (they have their own handlers)
const RESERVED_KEYWORDS = new Set([
  'HELP', 'MENU', '?', 'STOP', 'START', 'UNSUBSCRIBE', 'CANCEL',
  'INFO', 'ABOUT', 'SPECIALS', 'JOBS', 'JOB', 'WORK', 'HIRE',
  'YES', 'NO', '1', '2', '3',
])

/**
 * Try to parse SMS text with regex-only rules.
 * Returns a FastParsed object if recognized, or null to fallback to AI.
 *
 * Handles these patterns:
 *   1. "<category> <zip>"          → category + zipCode
 *   2. "<category> <area>"         → category + area
 *   3. "<category>"                → category only
 *   4. Just a ZIP                  → zipCode only (uses default category later)
 *
 * Requires either:
 *   - a recognized category (via normalizeCategory or matchKeywordToCategory)
 *   OR
 *   - a 5-digit ZIP by itself
 */
export function fastParse(input: string): FastParsed | null {
  const text = (input || '').trim()
  if (!text) return null

  const upper = text.toUpperCase()
  if (RESERVED_KEYWORDS.has(upper)) return null

  // Skip if looks like a sentence (too long or too many words)
  const wordCount = text.split(/\s+/).length
  if (wordCount > 5) return null

  // Extract 5-digit ZIP
  const zipMatch = text.match(/\b(\d{5})\b/)
  const zipCode = zipMatch ? zipMatch[1] : null

  // Remaining text (without ZIP)
  const rest = (zipCode ? text.replace(zipCode, '') : text).trim()

  // Just a bare ZIP
  if (zipCode && !rest) {
    return {
      intent: 'search',
      category: null,
      zipCode,
      area: null,
      businessName: null,
      confidence: 0.6,
      source: 'fast',
    }
  }

  if (!rest) return null

  // Try to match category / area in the remaining text
  const lower = rest.toLowerCase()

  // 1) Direct keyword match to category
  const kwCat = matchKeywordToCategory(lower)
  if (kwCat) {
    return {
      intent: 'search',
      category: kwCat,
      zipCode,
      area: null,
      businessName: null,
      confidence: 0.95,
      source: 'fast',
    }
  }

  // 2) Normalize category (handles typos & synonyms)
  const norm = normalizeCategory(lower)
  if (norm.category && norm.category !== lower) {
    return {
      intent: 'search',
      category: norm.category,
      zipCode,
      area: null,
      businessName: null,
      confidence: 0.9,
      source: 'fast',
    }
  }

  // 3) Maybe text is "<category> <area>" — split by space, try both halves
  const parts = rest.split(/\s+/)
  if (parts.length >= 2) {
    // Try first word as category, rest as area
    const firstAsCat = matchKeywordToCategory(parts[0]) || normalizeCategory(parts[0]).category
    const restAsArea = normalizeArea(parts.slice(1).join(' '))
    if (firstAsCat && firstAsCat !== parts[0].toLowerCase() && restAsArea) {
      return {
        intent: 'search',
        category: firstAsCat,
        zipCode,
        area: restAsArea,
        businessName: null,
        confidence: 0.85,
        source: 'fast',
      }
    }
    // Try first words as category (multi-word categories like "shower door"), last as area
    for (let i = parts.length - 1; i >= 1; i--) {
      const catCandidate = parts.slice(0, i).join(' ').toLowerCase()
      const areaCandidate = parts.slice(i).join(' ')
      const cat = matchKeywordToCategory(catCandidate) || normalizeCategory(catCandidate).category
      const area = normalizeArea(areaCandidate)
      if (cat && cat !== catCandidate && area) {
        return {
          intent: 'search',
          category: cat,
          zipCode,
          area,
          businessName: null,
          confidence: 0.85,
          source: 'fast',
        }
      }
    }
  }

  // 4) Single recognizable area (no category) → need AI to decide intent
  const areaOnly = normalizeArea(lower)
  if (areaOnly && !zipCode) {
    // Could be "I'm in Williamsburg, what's around" — need AI
    return null
  }

  // Nothing recognized confidently → fallback to AI
  return null
}
