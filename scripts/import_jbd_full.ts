import 'dotenv/config'
import { PrismaClient, BusinessStatus } from '@prisma/client'
import { readFileSync } from 'fs'

const prisma = new PrismaClient()

function normalizePhone(areaCode: any, phone: string): string {
  if (!phone) return ''
  const ac = String(areaCode || '').replace(/\D/g, '')
  const p = String(phone || '').replace(/\D/g, '')
  if (!p) return ''
  if (ac && ac.length === 3 && p.length === 7) return `+1${ac}${p}`
  if (p.length === 10) return `+1${p}`
  if (p.length === 11 && p.startsWith('1')) return `+${p}`
  if (p.length === 7 && ac) return `+1${ac}${p}`
  if (p.length === 7) return `+1718${p}` // default Brooklyn area
  return ''
}

function buildName(r: any): string {
  if (r.account_type_name === 'Business' && r.business_name) return r.business_name.trim()
  // Residential — build from first + last.
  // Skip `title` if it's purely numeric (source data has "1", "2"… in that
  // field — likely a page/family index, not an actual honorific).
  const titleSafe =
    r.title && !/^\s*\d+\s*$/.test(String(r.title)) ? r.title : null
  const parts = [titleSafe, r.first_name, r.last_name].filter(Boolean)
  if (parts.length === 0 && r.business_name) return r.business_name.trim()
  return parts.join(' ').trim() || 'Unknown'
}

function buildAddress(r: any): string | null {
  const parts = [
    r.house_no,
    r.apt_no ? `Apt ${r.apt_no}` : null,
    r.street_name || r.other_street,
    r.city_name || r.other_city,
    r.state_name || r.state_code || r.other_state,
    r.zipcode || r.other_zip,
  ].filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

function getArea(r: any): string | null {
  const zip = String(r.zipcode || r.other_zip || '').padStart(5, '0').slice(0, 5)
  const city = (r.city_name || r.other_city || '').toLowerCase()

  const zipMap: Record<string, string> = {
    '11211': 'Williamsburg', '11249': 'Williamsburg', '11206': 'Williamsburg', '11205': 'Williamsburg',
    '11219': 'Borough Park', '11204': 'Borough Park', '11218': 'Borough Park',
    '11230': 'Flatbush', '11210': 'Flatbush', '11229': 'Flatbush',
    '11213': 'Crown Heights', '11225': 'Crown Heights', '11238': 'Crown Heights',
    '10952': 'Monsey', '10977': 'Spring Valley',
    '08701': 'Lakewood',
    '11516': 'Five Towns', '11559': 'Five Towns', '11598': 'Five Towns',
    '07666': 'Teaneck', '07055': 'Passaic',
    '11203': 'Crown Heights', '11226': 'Flatbush', '11231': 'Brooklyn',
    '11373': 'Queens', '11375': 'Queens',
  }
  if (zipMap[zip]) return zipMap[zip]
  if (city.includes('williamsburg')) return 'Williamsburg'
  if (city.includes('borough park') || city.includes('boro park')) return 'Borough Park'
  if (city.includes('crown heights')) return 'Crown Heights'
  if (city.includes('flatbush')) return 'Flatbush'
  if (city.includes('monsey')) return 'Monsey'
  if (city.includes('lakewood')) return 'Lakewood'
  if (city.includes('brooklyn')) return 'Brooklyn'
  return null
}

async function importAll() {
  console.log('📂 Reading jbd_all_residents.json...')
  const data: any[] = JSON.parse(readFileSync('/Users/admin/Documents/ПАРНОСА/connect2kehilla/jbd_all_residents.json', 'utf-8'))
  console.log(`📊 Total records: ${data.length}`)

  console.log('🔍 Loading existing phones from DB...')
  const existing = await prisma.business.findMany({ select: { phone: true } })
  const existingPhones = new Set(existing.map(e => e.phone))
  console.log(`   Existing in DB: ${existingPhones.size}`)

  const toInsert: any[] = []
  let skippedNoPhone = 0
  let skippedDupe = 0

  for (const r of data) {
    const phone = normalizePhone(r.area_code, r.telephone_no)
    if (!phone) { skippedNoPhone++; continue }
    if (existingPhones.has(phone)) { skippedDupe++; continue }
    existingPhones.add(phone)

    const isBusiness = r.account_type_name === 'Business'
    const categories = isBusiness ? ['business'] : ['residential']

    toInsert.push({
      name: buildName(r).substring(0, 255),
      phone,
      categoryRaw: isBusiness ? 'business' : 'residential',
      categories,
      address: buildAddress(r),
      area: getArea(r),
      zipCode: r.zipcode ? String(r.zipcode).padStart(5, '0').slice(0, 5) : null,
      city: r.city_name || r.other_city || null,
      state: r.state_code || r.state_name || 'NY',
      listingType: 'BUSINESS',
      status: BusinessStatus.FREE,
    })
  }

  console.log(`📦 To insert: ${toInsert.length}`)
  console.log(`   Skipped (no phone): ${skippedNoPhone}`)
  console.log(`   Skipped (duplicate): ${skippedDupe}`)

  const BATCH = 500
  let imported = 0
  let errors = 0

  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH)
    try {
      const result = await prisma.business.createMany({ data: batch, skipDuplicates: true })
      imported += result.count
      console.log(`   Batch ${Math.floor(i/BATCH)+1}/${Math.ceil(toInsert.length/BATCH)}: +${result.count} (total: ${imported})`)
    } catch (e: any) {
      errors += batch.length
      console.error(`   ❌ Batch ${Math.floor(i/BATCH)+1} error: ${e.message?.substring(0,100)}`)
    }
  }

  const finalTotal = await prisma.business.count()
  const finalResidents = await prisma.business.count({ where: { categories: { has: 'residential' } } })
  const finalBusinesses = await prisma.business.count({ where: { categories: { has: 'business' } } })

  console.log(`\n✅ Done!`)
  console.log(`   Imported: ${imported}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Total in DB now: ${finalTotal}`)
  console.log(`   Residents: ${finalResidents}`)
  console.log(`   Business tag: ${finalBusinesses}`)
}

importAll()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error('FATAL:', e); await prisma.$disconnect() })
