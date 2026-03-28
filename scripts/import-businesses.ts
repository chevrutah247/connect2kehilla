// scripts/import-businesses.ts
// Скрипт для импорта бизнесов из CSV файла
// Запуск: npm run import -- --file=businesses.csv

import { PrismaClient } from '@prisma/client'
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'
import OpenAI from 'openai'

const prisma = new PrismaClient()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ============================================
// Типы
// ============================================
interface RawBusiness {
  name: string
  phone: string
  category?: string
  address?: string
  area?: string
  zip_code?: string
  city?: string
}

// ============================================
// AI категоризация
// ============================================
async function categorizeBusiness(name: string, rawCategory?: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You categorize businesses for a Jewish community directory.
Return a JSON object with a "tags" array of lowercase search tags.
Include:
- Main service type (plumber, electrician, restaurant, etc.)
- Specialties if evident (emergency, 24h, kosher, etc.)
- Related terms people might search for

Example output: {"tags": ["plumber", "emergency", "residential", "water heater"]}`
        },
        {
          role: 'user',
          content: `Business name: "${name}"${rawCategory ? `\nCategory: "${rawCategory}"` : ''}`
        }
      ],
      temperature: 0.1,
      max_tokens: 150,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) return rawCategory ? [rawCategory.toLowerCase()] : ['other']

    const result = JSON.parse(content)
    return Array.isArray(result.tags) ? result.tags : [rawCategory?.toLowerCase() || 'other']

  } catch (error) {
    console.error(`⚠️ Categorization error for "${name}":`, error)
    return rawCategory ? [rawCategory.toLowerCase()] : ['other']
  }
}

// ============================================
// Нормализация телефона
// ============================================
function normalizePhone(phone: string): string {
  // Убираем всё кроме цифр
  const digits = phone.replace(/\D/g, '')
  
  // Добавляем +1 если нужно
  if (digits.length === 10) {
    return `+1${digits}`
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  
  return `+${digits}`
}

// ============================================
// Определение района по ZIP
// ============================================
function getAreaFromZip(zipCode: string): string | null {
  const zipToArea: Record<string, string> = {
    '11211': 'Williamsburg',
    '11249': 'Williamsburg',
    '11219': 'Borough Park',
    '11230': 'Flatbush',
    '11210': 'Flatbush',
    '11213': 'Crown Heights',
    '11225': 'Crown Heights',
    '10952': 'Monsey',
    '08701': 'Lakewood',
    '11516': 'Five Towns',
    '11559': 'Five Towns',
    '07666': 'Teaneck',
    '07055': 'Passaic',
  }
  
  return zipToArea[zipCode] || null
}

// ============================================
// Главная функция импорта
// ============================================
async function importBusinesses(filePath: string) {
  console.log(`📂 Reading file: ${filePath}`)
  
  // Читаем CSV
  const fileContent = readFileSync(filePath, 'utf-8')
  const records: RawBusiness[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  console.log(`📊 Found ${records.length} records`)

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const record of records) {
    try {
      // Проверяем обязательные поля
      if (!record.name || !record.phone) {
        console.log(`⏭️ Skipping (no name/phone): ${JSON.stringify(record)}`)
        skipped++
        continue
      }

      const phone = normalizePhone(record.phone)
      
      // Проверяем, нет ли уже такого бизнеса
      const existing = await prisma.business.findFirst({
        where: {
          OR: [
            { phone },
            { 
              name: { equals: record.name, mode: 'insensitive' },
              zipCode: record.zip_code || null
            }
          ]
        }
      })

      if (existing) {
        console.log(`⏭️ Skipping (exists): ${record.name}`)
        skipped++
        continue
      }

      // Категоризируем через AI
      console.log(`🤖 Categorizing: ${record.name}...`)
      const categories = await categorizeBusiness(record.name, record.category)

      // Определяем район
      const area = record.area || (record.zip_code ? getAreaFromZip(record.zip_code) : null)

      // Создаём запись
      await prisma.business.create({
        data: {
          name: record.name,
          phone,
          categoryRaw: record.category || null,
          categories,
          zipCode: record.zip_code || null,
          area,
          city: record.city || null,
          status: 'FREE',
        }
      })

      console.log(`✅ Imported: ${record.name} [${categories.join(', ')}]`)
      imported++

      // Пауза чтобы не превысить лимиты OpenAI
      await new Promise(resolve => setTimeout(resolve, 200))

    } catch (error) {
      console.error(`❌ Error importing "${record.name}":`, error)
      errors++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`📊 Import Summary:`)
  console.log(`   ✅ Imported: ${imported}`)
  console.log(`   ⏭️ Skipped: ${skipped}`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log('='.repeat(50))
}

// ============================================
// Запуск
// ============================================
const args = process.argv.slice(2)
const fileArg = args.find(a => a.startsWith('--file='))

if (!fileArg) {
  console.error('Usage: npm run import -- --file=businesses.csv')
  process.exit(1)
}

const filePath = fileArg.replace('--file=', '')

importBusinesses(filePath)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
