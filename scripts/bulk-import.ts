// scripts/bulk-import.ts
// Быстрый bulk импорт без AI категоризации
// Использует существующие категории из CSV
// Запуск: npx tsx scripts/bulk-import.ts --file=path/to/file.csv

import 'dotenv/config'
import { PrismaClient, BusinessStatus } from '@prisma/client'
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'

const prisma = new PrismaClient()

interface RawBusiness {
  name: string
  phone: string
  category?: string
  address?: string
  area?: string
  zip_code?: string
  description?: string
}

function normalizePhone(phone: string): string {
  if (phone.startsWith('+')) return phone
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length === 7) return `+1718${digits}`
  return `+${digits}`
}

function getAreaFromZip(zipCode: string): string | null {
  const map: Record<string, string> = {
    '11211': 'Williamsburg', '11249': 'Williamsburg', '11206': 'Williamsburg',
    '11219': 'Borough Park', '11204': 'Borough Park', '11218': 'Borough Park',
    '11230': 'Flatbush', '11210': 'Flatbush',
    '11213': 'Crown Heights', '11225': 'Crown Heights',
    '10952': 'Monsey', '08701': 'Lakewood',
    '11516': 'Five Towns', '11559': 'Five Towns',
    '07666': 'Teaneck', '07055': 'Passaic',
  }
  return map[zipCode] || null
}

function splitCategoryToTags(category: string): string[] {
  if (!category) return ['other']
  // Split by underscore, slash, or and
  const normalized = category.toLowerCase().trim()
  const tags = normalized
    .split(/[_\/]|(?:\band\b)/)
    .map(t => t.trim())
    .filter(t => t.length > 0 && t !== 'and')
  return tags.length > 0 ? tags : [normalized]
}

async function bulkImport(filePath: string) {
  console.log(`📂 Reading: ${filePath}`)
  const content = readFileSync(filePath, 'utf-8')
  const records: RawBusiness[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })
  console.log(`📊 Total records: ${records.length}`)

  const BATCH_SIZE = 500
  let imported = 0
  let skipped = 0
  let errors = 0

  // Load existing phones to skip duplicates
  console.log('🔍 Loading existing phone numbers...')
  const existing = await prisma.business.findMany({ select: { phone: true } })
  const existingPhones = new Set(existing.map(e => e.phone))
  console.log(`   Found ${existingPhones.size} existing records`)

  // Process in batches
  const batches: RawBusiness[][] = []
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    batches.push(records.slice(i, i + BATCH_SIZE))
  }
  console.log(`📦 Processing ${batches.length} batches of ${BATCH_SIZE}\n`)

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx]
    const toInsert: any[] = []

    for (const record of batch) {
      if (!record.name || !record.phone) {
        skipped++
        continue
      }

      const phone = normalizePhone(record.phone)
      if (existingPhones.has(phone)) {
        skipped++
        continue
      }
      existingPhones.add(phone)

      const categories = splitCategoryToTags(record.category || '')
      const area = record.area || (record.zip_code ? getAreaFromZip(record.zip_code) : null)

      toInsert.push({
        name: record.name.substring(0, 255),
        phone,
        categoryRaw: record.category || null,
        categories,
        zipCode: record.zip_code || null,
        area,
        address: record.address || null,
        status: BusinessStatus.FREE,
      })
    }

    if (toInsert.length > 0) {
      try {
        const result = await prisma.business.createMany({
          data: toInsert,
          skipDuplicates: true,
        })
        imported += result.count
        console.log(`  Batch ${batchIdx + 1}/${batches.length}: +${result.count} (total: ${imported})`)
      } catch (e: any) {
        console.error(`  ❌ Batch ${batchIdx + 1} error:`, e.message)
        errors += toInsert.length
      }
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`📊 Import Summary:`)
  console.log(`   ✅ Imported: ${imported}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   ❌ Errors:  ${errors}`)
  console.log('='.repeat(50))
}

const args = process.argv.slice(2)
const fileArg = args.find(a => a.startsWith('--file='))
if (!fileArg) {
  console.error('Usage: npx tsx scripts/bulk-import.ts --file=path/to/file.csv')
  process.exit(1)
}

bulkImport(fileArg.replace('--file=', ''))
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error('Fatal:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
