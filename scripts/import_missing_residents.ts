import 'dotenv/config'
import { PrismaClient, BusinessStatus } from '@prisma/client'
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'

const prisma = new PrismaClient()

function normalizePhone(phone: string): string {
  if (!phone) return ''
  if (phone.startsWith('+')) return phone
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length === 7) return `+1718${digits}`
  return digits.length > 0 ? `+${digits}` : ''
}

function getAreaFromZip(zip: string): string | null {
  const map: Record<string, string> = {
    '11211': 'Williamsburg', '11249': 'Williamsburg', '11206': 'Williamsburg', '11205': 'Williamsburg',
    '11219': 'Borough Park', '11204': 'Borough Park', '11218': 'Borough Park',
    '11230': 'Flatbush', '11210': 'Flatbush',
    '11213': 'Crown Heights', '11225': 'Crown Heights',
    '10952': 'Monsey', '08701': 'Lakewood',
    '11516': 'Five Towns', '11559': 'Five Towns',
    '07666': 'Teaneck', '07055': 'Passaic',
  }
  return map[zip] || null
}

async function importMissing() {
  const csvPath = '/Users/admin/Documents/ПАРНОСА/connect2kehilla/connect2kehilla_import.csv'
  console.log(`📂 Reading: ${csvPath}`)
  const content = readFileSync(csvPath, 'utf-8')
  const records: any[] = parse(content, { columns: true, skip_empty_lines: true, trim: true })
  const residents = records.filter(r => (r.category || '').toLowerCase().includes('residential'))
  console.log(`📊 Residential in CSV: ${residents.length}`)

  console.log('🔍 Loading existing phones from Neon...')
  const existing = await prisma.business.findMany({ select: { phone: true } })
  const existingPhones = new Set(existing.map(e => e.phone))
  console.log(`   Found ${existingPhones.size} existing in DB`)

  const toInsert: any[] = []
  let skipped = 0

  for (const r of residents) {
    if (!r.name || !r.phone) { skipped++; continue }
    const phone = normalizePhone(r.phone)
    if (!phone) { skipped++; continue }
    if (existingPhones.has(phone)) { skipped++; continue }
    existingPhones.add(phone)

    toInsert.push({
      name: r.name.substring(0, 255),
      phone,
      categoryRaw: r.category || 'residential',
      categories: ['residential'],
      zipCode: r.zip_code || null,
      area: r.area || (r.zip_code ? getAreaFromZip(r.zip_code) : null),
      address: r.address || null,
      listingType: 'BUSINESS',
      status: BusinessStatus.FREE,
    })
  }

  console.log(`📦 To insert: ${toInsert.length} (skipped ${skipped})`)

  const BATCH = 500
  let imported = 0
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH)
    const result = await prisma.business.createMany({ data: batch, skipDuplicates: true })
    imported += result.count
    console.log(`   Batch ${Math.floor(i/BATCH)+1}/${Math.ceil(toInsert.length/BATCH)}: +${result.count} (total: ${imported})`)
  }

  const finalCount = await prisma.business.count({ where: { categories: { has: 'residential' } } })
  console.log(`\n✅ Done! Residents in DB: ${finalCount} (imported ${imported}, skipped ${skipped})`)
}

importMissing()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error('❌', e.message); await prisma.$disconnect() })
