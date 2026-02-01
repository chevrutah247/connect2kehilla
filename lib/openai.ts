// lib/openai.ts
import OpenAI from 'openai'

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }
  return new OpenAI({ apiKey })
}

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

const PARSER_SYSTEM_PROMPT = `You are a query parser for a Jewish community business directory SMS service.
Extract: intent, category, zipCode, area, businessName.
Respond ONLY with valid JSON.`

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
    if (!content) return getDefaultParsedQuery()
    return JSON.parse(content) as ParsedQuery
  } catch (error) {
    console.error('OpenAI parse error:', error)
    return getDefaultParsedQuery()
  }
}

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

export async function categorizeBusiness(name: string, rawCategory: string): Promise<string[]> {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Return JSON with "tags" array of lowercase category tags.' },
        { role: 'user', content: `Business: "${name}" Category: "${rawCategory}"` }
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
    return [rawCategory.toLowerCase()]
  }
}
