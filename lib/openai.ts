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
  intent: 'search' | 'help' | 'stop' | 'info' | 'specials' | 'add_business' | 'unknown'
  category: string | null
  zipCode: string | null
  area: string | null
  city: string | null
  businessName: string | null
  confidence: number
  needsMoreInfo: boolean
  missingFields: string[]
}

// ============================================
// Системный промпт для парсера
// ============================================
const PARSER_SYSTEM_PROMPT = `You are a query parser for a Jewish community business directory SMS service.
Users text in English, Hebrew (עברית), or Yiddish (אידיש). Extract structured info from their messages.

KNOWN AREAS & CITIES:
- Williamsburg (ZIP: 11211, 11249, 11206, 11205) — וויליאמסבורג
- Borough Park (ZIP: 11219, 11204, 11218) — בארא פארק
- Crown Heights (ZIP: 11213, 11225, 11203) — קראון הייטס
- Flatbush (ZIP: 11230, 11210) — פלעטבוש
- Monsey (ZIP: 10952) — מאנסי
- Monroe / Kiryas Joel (ZIP: 10950) — מאנרא / קרית יואל
- New Square (ZIP: 10977) — ניו סקווער / סקווירא
- Spring Valley (ZIP: 10977)
- Lakewood (ZIP: 08701) — לייקווד
- Five Towns (ZIP: 11516, 11559)
- Teaneck (ZIP: 07666)
- Passaic (ZIP: 07055)
- Staten Island (ZIP: 10314)
- Suffern (ZIP: 10901)

COMMON CATEGORIES:
- plumber, electrician, handyman, contractor, construction
- doctor, dentist, pediatrician, therapist, pharmacy
- lawyer, accountant, insurance, real estate
- restaurant, catering, bakery, grocery, meat, fish
- car service, mechanic, tow truck, auto collision
- locksmith, exterminator, cleaner, mover
- tutor, photographer, musician, printing
- glass, mirror, shower door, window
- wigs, jewelry, clothing, shoes
- sofer, mezuzah, tefillin, judaica

HEBREW/YIDDISH CATEGORIES (map to English):
- רופא/דאקטער → doctor, שיניים/צוינדאקטער → dentist
- עורך דין/אדוואקאט → lawyer, חשמלאי/עלעקטריקער → electrician
- שרברב/שפאכטלער → plumber, מנעולן/שלאסער → locksmith
- מסעדה → restaurant, בית מרקחת/אפטייק → pharmacy
- פאות/שייטל → wigs, תכשיטים/גאלדשמיד → jewelry
- נגר/טישלער → furniture, פליישער → meat

IMPORTANT RULES:
1. If user writes a specific business name (e.g. "Lemofet Glass", "Kehot"), set businessName, NOT category
2. If query has a product/service keyword (shower door, table top, mirror), set category to the SERVICE not the product
3. Always extract ZIP code if present (5 digits)
4. Always extract area/city if mentioned (in any language)
5. If user types just a ZIP code, set intent: search with only zipCode
6. Hebrew/Yiddish text → translate to English category/area names in output
7. If unsure between businessName and category, prefer businessName for proper nouns

SPECIALS/DEALS:
- "specials", "deals", "sales", "what's on sale" → intent: specials

ADD BUSINESS:
- "add business", "list my business", "register", "advertise" → intent: add_business

COMMANDS:
- "HELP", "?" → intent: help
- "STOP", "UNSUBSCRIBE", "CANCEL" → intent: stop
- "INFO", "ABOUT" → intent: info

Respond ONLY with valid JSON:
{
  "intent": "search" | "help" | "stop" | "info" | "specials" | "add_business" | "unknown",
  "category": string | null,
  "zipCode": string | null,
  "area": string | null,
  "city": string | null,
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
    city: null,
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
}