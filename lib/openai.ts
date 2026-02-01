// lib/openai.ts
// AI парсер запросов через OpenAI GPT-4o Mini

import OpenAI from 'openai'

// Ленивая инициализация
function getClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }
  return new OpenAI({ apiKey })
}

// ============================================
// Типы
// ============================================
export interface ParsedQuery {
  intent: 'search' | 'help' | 'stop' | 'info' | 'unknown'
  category: string | null
  zipCode: string | null
  area: string | null
  businessName: string | null
  confidence: number
  needsMoreInfo: boolean
  missingFields: string[]
}

// ============================================
// Системный промпт для парсера
// ============================================
const PARSER_SYSTEM_PROMPT = `You are a query parser for a Jewish community business directory SMS service.

Your job is to extract structured information from SMS messages.

KNOWN AREAS (New York / New Jersey region):
- Williamsburg (ZIP: 11211, 11249)
- Borough Park (ZIP: 11219)
- Flatbush (ZIP: 11230, 11210)
- Crown Heights (ZIP: 11213, 11225)
- Monsey (ZIP: 10952)
- Lakewood (ZIP: 08701)
- Five Towns (ZIP: 11516, 11559)
- Teaneck (ZIP: 07666)
- Passaic (ZIP: 07055)

COMMON CATEGORIES:
- plumber, electrician, handyman, contractor
- doctor, dentist, pediatrician, therapist
- lawyer, accountant, insurance
- restaurant, catering, bakery, grocery
- car service, mechanic, tow truck
- locksmith, exterminator, cleaner
- tutor, photographer, musician

COMMANDS:
- "HELP", "?" → intent: help
- "STOP", "UNSUBSCRIBE", "CANCEL" → intent: stop
- "INFO", "ABOUT" → intent: info

Respond ONLY with valid JSON matching this schema:
{
  "intent": "search" | "help" | "stop" | "info" | "unknown",
  "category": string | null,
  "zipCode": string | null,
  "area": string | null,
  "businessName": string | null,
  "confidence": number (0-1),
  "needsMoreInfo": boolean,
  "missingFields": string[]
}`

// ============================================
// Парсинг запроса
// ============================================
export async function parseQuery(message: string): Promise<ParsedQuery> {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PARSER_SYSTEM_PROMPT },
        { role: 'user', content: message }
      ],
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return getDefaultParsedQuery()
    }

    const parsed = JSON.parse(content) as ParsedQuery
    return parsed

  } catch (error) {
    console.error('OpenAI parse error:', error)
    return getDefaultParsedQuery()
  }
}

// ============================================
// Дефолтный результат (если AI не справился)
// ============================================
function getDefaultParsedQuery(): ParsedQuery {
  return {
    intent: 'unknown',
    category: null,
    zipCode: null,
    area: null,
    businessName: null,
    confidence: 0,
    needsMoreInfo: true,
    missingFields: ['category', 'location']
  }
}

// ============================================
// Категоризация бизнеса (для импорта из справочника)
// ============================================
export async function categorizeBusiness(
  name: string,
  rawCategory: string
): Promise<string[]> {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You categorize businesses for a directory.
Given a business name and raw category, return relevant search tags.
Return ONLY a JSON object with a "tags" array of lowercase tags.
Example: {"tags": ["plumber", "emergency", "residential", "24h"]}`
        },
        {
          role: 'user',
          content: `Business: "${name}"\nCategory: "${rawCategory}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 100,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) return [rawCategory.toLowerCase()]

    const result = JSON.parse(content)
    return Array.isArray(result.tags) ? result.tags : [rawCategory.toLowerCase()]

  } catch (error) {
    console.error('Categorization error:', error)
    return [rawCategory.toLowerCase()]
  }
}// lib/openai.ts
// AI парсер запросов через OpenAI GPT-4o Mini

import OpenAI from 'openai'

// Ленивая инициализация
function getClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }
  return new OpenAI({ apiKey })
}

// ============================================
// Типы
// ============================================
export interface ParsedQuery {
  intent: 'search' | 'help' | 'stop' | 'info' | 'unknown'
  category: string | null
  zipCode: string | null
  area: string | null
  businessName: string | null
  confidence: number
  needsMoreInfo: boolean
  missingFields: string[]
}

// ============================================
// Системный промпт для парсера
// ============================================
const PARSER_SYSTEM_PROMPT = `You are a query parser for a Jewish community business directory SMS service.

Your job is to extract structured information from SMS messages.

KNOWN AREAS (New York / New Jersey region):
- Williamsburg (ZIP: 11211, 11249)
- Borough Park (ZIP: 11219)
- Flatbush (ZIP: 11230, 11210)
- Crown Heights (ZIP: 11213, 11225)
- Monsey (ZIP: 10952)
- Lakewood (ZIP: 08701)
- Five Towns (ZIP: 11516, 11559)
- Teaneck (ZIP: 07666)
- Passaic (ZIP: 07055)

COMMON CATEGORIES:
- plumber, electrician, handyman, contractor
- doctor, dentist, pediatrician, therapist
- lawyer, accountant, insurance
- restaurant, catering, bakery, grocery
- car service, mechanic, tow truck
- locksmith, exterminator, cleaner
- tutor, photographer, musician

COMMANDS:
- "HELP", "?" → intent: help
- "STOP", "UNSUBSCRIBE", "CANCEL" → intent: stop
- "INFO", "ABOUT" → intent: info

Respond ONLY with valid JSON matching this schema:
{
  "intent": "search" | "help" | "stop" | "info" | "unknown",
  "category": string | null,
  "zipCode": string | null,
  "area": string | null,
  "businessName": string | null,
  "confidence": number (0-1),
  "needsMoreInfo": boolean,
  "missingFields": string[]
}`

// ============================================
// Парсинг запроса
// ============================================
export async function parseQuery(message: string): Promise<ParsedQuery> {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PARSER_SYSTEM_PROMPT },
        { role: 'user', content: message }
      ],
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return getDefaultParsedQuery()
    }

    const parsed = JSON.parse(content) as ParsedQuery
    return parsed

  } catch (error) {
    console.error('OpenAI parse error:', error)
    return getDefaultParsedQuery()
  }
}

// ============================================
// Дефолтный результат (если AI не справился)
// ============================================
function getDefaultParsedQuery(): ParsedQuery {
  return {
    intent: 'unknown',
    category: null,
    zipCode: null,
    area: null,
    businessName: null,
    confidence: 0,
    needsMoreInfo: true,
    missingFields: ['category', 'location']
  }
}

// ============================================
// Категоризация бизнеса (для импорта из справочника)
// ============================================
export async function categorizeBusiness(
  name: string,
  rawCategory: string
): Promise<string[]> {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You categorize businesses for a directory.
Given a business name and raw category, return relevant search tags.
Return ONLY a JSON object with a "tags" array of lowercase tags.
Example: {"tags": ["plumber", "emergency", "residential", "24h"]}`
        },
        {
          role: 'user',
          content: `Business: "${name}"\nCategory: "${rawCategory}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 100,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) return [rawCategory.toLowerCase()]

    const result = JSON.parse(content)
    return Array.isArray(result.tags) ? result.tags : [rawCategory.toLowerCase()]

  } catch (error) {
    console.error('Categorization error:', error)
    return [rawCategory.toLowerCase()]
  }
}// lib/openai.ts
// AI парсер запросов через OpenAI GPT-4o Mini

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ============================================
// Типы
// ============================================
export interface ParsedQuery {
  intent: 'search' | 'help' | 'stop' | 'info' | 'unknown'
  category: string | null      // "plumber", "electrician", "restaurant"
  zipCode: string | null       // "11211"
  area: string | null          // "Williamsburg", "Monsey"
  businessName: string | null  // Если ищут конкретный бизнес
  confidence: number           // 0-1
  needsMoreInfo: boolean
  missingFields: string[]      // ["zipCode", "category"]
}

// ============================================
// Системный промпт для парсера
// ============================================
const PARSER_SYSTEM_PROMPT = `You are a query parser for a Jewish community business directory SMS service.

Your job is to extract structured information from SMS messages.

KNOWN AREAS (New York / New Jersey region):
- Williamsburg (ZIP: 11211, 11249)
- Borough Park (ZIP: 11219)
- Flatbush (ZIP: 11230, 11210)
- Crown Heights (ZIP: 11213, 11225)
- Monsey (ZIP: 10952)
- Lakewood (ZIP: 08701)
- Five Towns (ZIP: 11516, 11559)
- Teaneck (ZIP: 07666)
- Passaic (ZIP: 07055)

COMMON CATEGORIES:
- plumber, electrician, handyman, contractor
- doctor, dentist, pediatrician, therapist
- lawyer, accountant, insurance
- restaurant, catering, bakery, grocery
- car service, mechanic, tow truck
- locksmith, exterminator, cleaner
- tutor, photographer, musician

COMMANDS:
- "HELP", "?" → intent: help
- "STOP", "UNSUBSCRIBE", "CANCEL" → intent: stop
- "INFO", "ABOUT" → intent: info

Respond ONLY with valid JSON matching this schema:
{
  "intent": "search" | "help" | "stop" | "info" | "unknown",
  "category": string | null,
  "zipCode": string | null,
  "area": string | null,
  "businessName": string | null,
  "confidence": number (0-1),
  "needsMoreInfo": boolean,
  "missingFields": string[]
}`

// ============================================
// Парсинг запроса
// ============================================
export async function parseQuery(message: string): Promise<ParsedQuery> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PARSER_SYSTEM_PROMPT },
        { role: 'user', content: message }
      ],
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return getDefaultParsedQuery()
    }

    const parsed = JSON.parse(content) as ParsedQuery
    return parsed

  } catch (error) {
    console.error('OpenAI parse error:', error)
    return getDefaultParsedQuery()
  }
}

// ============================================
// Дефолтный результат (если AI не справился)
// ============================================
function getDefaultParsedQuery(): ParsedQuery {
  return {
    intent: 'unknown',
    category: null,
    zipCode: null,
    area: null,
    businessName: null,
    confidence: 0,
    needsMoreInfo: true,
    missingFields: ['category', 'location']
  }
}

// ============================================
// Категоризация бизнеса (для импорта из справочника)
// ============================================
export async function categorizeBusiness(
  name: string,
  rawCategory: string
): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You categorize businesses for a directory.
Given a business name and raw category, return relevant search tags.
Return ONLY a JSON array of lowercase tags.
Example: ["plumber", "emergency", "residential", "24h"]`
        },
        {
          role: 'user',
          content: `Business: "${name}"\nCategory: "${rawCategory}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 100,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) return [rawCategory.toLowerCase()]

    const result = JSON.parse(content)
    return Array.isArray(result.tags) ? result.tags : [rawCategory.toLowerCase()]

  } catch (error) {
    console.error('Categorization error:', error)
    return [rawCategory.toLowerCase()]
  }
}
