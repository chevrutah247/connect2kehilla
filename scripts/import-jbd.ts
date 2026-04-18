// Import JBD businesses into Prisma database
// Usage: npx tsx scripts/import-jbd.ts

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const JBD_FILE = path.join(__dirname, '../../connect2kehilla/jbd_businesses_with_cats.json')
// Fallback: same directory
const JBD_FILE_ALT = path.join(process.cwd(), '../connect2kehilla/jbd_businesses_with_cats.json')
const JBD_FILE_LOCAL = '/Users/admin/Documents/ПАРНОСА/connect2kehilla/jbd_businesses_with_cats.json'

// ZIP → Area mapping
const ZIP_TO_AREA: Record<string, string> = {
  '11211': 'Williamsburg', '11249': 'Williamsburg', '11206': 'Williamsburg', '11205': 'Williamsburg',
  '11219': 'Borough Park', '11204': 'Borough Park', '11218': 'Borough Park',
  '11230': 'Flatbush', '11210': 'Flatbush',
  '11213': 'Crown Heights', '11225': 'Crown Heights',
  '10952': 'Monsey', '10977': 'Spring Valley', '10950': 'Monroe',
  '10314': 'Staten Island', '10301': 'Staten Island',
  '10901': 'Suffern', '08701': 'Lakewood',
  '11516': 'Five Towns', '11559': 'Five Towns',
  '07666': 'Teaneck', '07055': 'Passaic',
}

// JBD category name → our normalized tag
function normalizeJBDCategory(catName: string): string {
  return catName.toLowerCase().replace(/[&]/g, 'and').replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '_')
}

// Extract additional keyword tags from business name
function extractKeywordsFromName(name: string): string[] {
  const lower = name.toLowerCase()
  const tags: string[] = []
  const KEYWORD_MAP: Record<string, string[]> = {
    'glass': ['glass_mirror', 'shower_door', 'mirror', 'table_top'],
    'mirror': ['glass_mirror', 'mirror'],
    'shower': ['shower_door', 'glass_mirror'],
    'plumb': ['plumber', 'plumbing'],
    'electric': ['electrician', 'electrical'],
    'lock': ['locksmith'],
    'key': ['locksmith', 'keys'],
    'paint': ['painter', 'paint_stores'],
    'floor': ['floors', 'flooring'],
    'tile': ['tiles_marble'],
    'marble': ['tiles_marble', 'countertops'],
    'granite': ['tiles_marble', 'countertops'],
    'roof': ['roofing'],
    'carpet': ['carpet_cleaning', 'carpet_vinyl'],
    'clean': ['cleaning_service'],
    'mover': ['movers', 'moving'],
    'moving': ['movers', 'moving'],
    'cab': ['car_service'],
    'taxi': ['car_service'],
    'car service': ['car_service'],
    'limo': ['car_service', 'limousine'],
    'tow': ['towing', 'car_service'],
    'mechanic': ['auto_repair'],
    'collision': ['auto_collision'],
    'dentist': ['dentist', 'dental'],
    'dental': ['dentist', 'dental'],
    'doctor': ['doctor', 'medical'],
    'medical': ['doctor', 'medical'],
    'clinic': ['doctor', 'medical'],
    'pharmacy': ['pharmacies'],
    'drug': ['pharmacies'],
    'rx': ['pharmacies'],
    'optim': ['optical'],
    'eye': ['optical'],
    'vision': ['optical'],
    'lawyer': ['lawyer', 'legal'],
    'law office': ['lawyer', 'legal'],
    'attorney': ['lawyer', 'legal'],
    'esq': ['lawyer', 'legal'],
    'account': ['accountants', 'cpa'],
    'cpa': ['accountants', 'cpa'],
    'tax': ['accountants', 'tax'],
    'insur': ['insurance'],
    'real estate': ['real_estate'],
    'realty': ['real_estate'],
    'realtor': ['real_estate'],
    'property': ['real_estate'],
    'restaurant': ['restaurant', 'food'],
    'pizza': ['restaurant', 'pizza'],
    'grill': ['restaurant', 'food'],
    'sushi': ['restaurant', 'sushi'],
    'bakery': ['bakeries', 'cakes'],
    'cake': ['bakeries', 'cakes_cookies'],
    'cookie': ['cakes_cookies'],
    'caterer': ['catering'],
    'catering': ['catering'],
    'grocery': ['grocery', 'supermarket'],
    'supermarket': ['grocery', 'supermarket'],
    'kosher': ['kosher'],
    'meat': ['meat', 'butcher'],
    'butcher': ['meat', 'butcher'],
    'fish': ['fish'],
    'photo': ['photography'],
    'studio': ['photography', 'studio'],
    'video': ['photography', 'video'],
    'music': ['orchestras_singers', 'music'],
    'band': ['orchestras_singers'],
    'dj': ['orchestras_singers', 'dj'],
    'singer': ['orchestras_singers'],
    'hall': ['halls', 'event_space'],
    'event': ['halls', 'event_space'],
    'wedding': ['halls', 'wedding'],
    'flower': ['flowers'],
    'floral': ['flowers'],
    'jewel': ['jewelry'],
    'gold': ['jewelry'],
    'diamond': ['jewelry'],
    'watch': ['jewelry'],
    'silver': ['silver', 'jewelry'],
    'wig': ['wigs'],
    'sheitel': ['wigs'],
    'hat': ['hatters', 'hats'],
    'shoe': ['shoe_stores', 'shoe_repair'],
    'cloth': ['mens_clothing', 'womens_wear'],
    'tailor': ['alterations'],
    'alter': ['alterations'],
    'seam': ['alterations'],
    'furniture': ['furniture'],
    'kitchen': ['kitchens'],
    'cabinet': ['kitchens', 'cabinets'],
    'applia': ['appliances', 'appliances_repair'],
    'air condition': ['air_conditioning'],
    'hvac': ['air_conditioning', 'heating'],
    'heat': ['heating', 'plumbing_heating'],
    'pest': ['exterminating'],
    'extermin': ['exterminating'],
    'computer': ['computers'],
    'tech': ['computers', 'technology'],
    'print': ['printing'],
    'sign': ['signs'],
    'travel': ['travel'],
    'hotel': ['hotels'],
    'sofer': ['sofrim'],
    'torah': ['sofrim', 'religious_articles'],
    'tefillin': ['religious_articles'],
    'mezuz': ['religious_articles'],
    'judaica': ['judaica', 'religious_articles'],
    'book': ['books'],
    'seforim': ['books', 'religious_articles'],
    'tutor': ['tutor', 'education'],
    'school': ['education'],
    'yeshiv': ['education', 'yeshiva'],
    'camp': ['camp'],
    'daycare': ['daycare'],
    'nurser': ['baby_nurses'],
    'therapy': ['therapy'],
    'counsel': ['therapy', 'counseling'],
  }

  for (const [keyword, keywordTags] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      for (const t of keywordTags) {
        if (!tags.includes(t)) tags.push(t)
      }
    }
  }
  return tags
}

function formatPhone(areaCode: number | string, telNo: string): string {
  const ac = String(areaCode || '').replace(/\D/g, '')
  const tn = String(telNo || '').replace(/\D/g, '')
  if (!ac || !tn) return ''
  return `+1${ac}${tn}`
}

interface JBDRecord {
  account_id: number
  business_name: string
  first_name?: string
  last_name?: string
  area_code: number
  telephone_no: string
  house_no?: string
  other_street?: string
  street_name?: string
  other_city?: string
  city_name?: string
  other_state?: string
  state_name?: string
  state_code?: string
  other_zip?: string
  zipcode?: string
  _cat_id?: number
  _cat_name?: string
}

async function main() {
  // Find JBD file
  let jbdFile = ''
  for (const f of [JBD_FILE_LOCAL, JBD_FILE, JBD_FILE_ALT]) {
    if (fs.existsSync(f)) { jbdFile = f; break }
  }
  if (!jbdFile) {
    console.error('JBD file not found!')
    process.exit(1)
  }

  console.log(`Reading ${jbdFile}...`)
  const raw: JBDRecord[] = JSON.parse(fs.readFileSync(jbdFile, 'utf-8'))
  console.log(`Loaded ${raw.length} records`)

  // Group by account_id to merge categories
  const byId = new Map<number, { record: JBDRecord; categories: string[] }>()
  for (const r of raw) {
    const existing = byId.get(r.account_id)
    const catTag = r._cat_name ? normalizeJBDCategory(r._cat_name) : null
    if (existing) {
      if (catTag && !existing.categories.includes(catTag)) {
        existing.categories.push(catTag)
      }
    } else {
      byId.set(r.account_id, {
        record: r,
        categories: catTag ? [catTag] : [],
      })
    }
  }

  console.log(`Unique businesses: ${byId.size}`)

  // Build insert data
  const businesses: Array<{
    name: string
    phone: string
    categoryRaw: string
    categories: string[]
    zipCode: string | null
    area: string | null
    city: string | null
    state: string
    address: string | null
  }> = []

  let skipped = 0
  for (const [, { record: r, categories }] of byId) {
    const phone = formatPhone(r.area_code, r.telephone_no)
    if (!phone || phone.length < 11) { skipped++; continue }

    const name = r.business_name || `${r.first_name || ''} ${r.last_name || ''}`.trim()
    if (!name) { skipped++; continue }

    const zip = r.other_zip || r.zipcode || null
    const city = r.other_city || r.city_name || null
    const state = r.other_state || r.state_code || r.state_name || 'NY'
    const street = r.other_street || r.street_name || ''
    const houseNo = r.house_no || ''
    const address = [houseNo, street].filter(Boolean).join(' ').trim() || null
    const area = (zip && ZIP_TO_AREA[zip]) || null
    const catRaw = categories.map(c => c.replace(/_/g, ' ')).join(', ')

    // Extract additional tags from business name
    const nameTags = extractKeywordsFromName(name)
    const allCategories = [...new Set([...categories, ...nameTags])]

    businesses.push({
      name,
      phone,
      categoryRaw: catRaw || null as any,
      categories: allCategories,
      zipCode: zip,
      area,
      city,
      state: state.length <= 2 ? state : 'NY',
      address,
    })
  }

  console.log(`Ready to import: ${businesses.length} businesses (skipped ${skipped} invalid)`)

  // Confirm
  console.log('\n⚠️  This will DELETE all existing businesses and replace with JBD data.')
  console.log('Leads and queries will be preserved but orphaned.\n')

  // Delete existing businesses
  const deleted = await prisma.business.deleteMany({})
  console.log(`Deleted ${deleted.count} existing businesses`)

  // Insert in batches of 100
  let imported = 0
  const batchSize = 100
  for (let i = 0; i < businesses.length; i += batchSize) {
    const batch = businesses.slice(i, i + batchSize)
    await prisma.business.createMany({
      data: batch,
      skipDuplicates: true,
    })
    imported += batch.length
    if (imported % 1000 === 0 || imported === businesses.length) {
      console.log(`  Imported ${imported}/${businesses.length}...`)
    }
  }

  console.log(`\n✅ Done! Imported ${imported} businesses.`)

  // Stats
  const total = await prisma.business.count()
  const withZip = await prisma.business.count({ where: { zipCode: { not: null } } })
  const withCity = await prisma.business.count({ where: { city: { not: null } } })
  const withCats = await prisma.business.count({ where: { categories: { isEmpty: false } } })

  console.log(`\nDatabase stats:`)
  console.log(`  Total: ${total}`)
  console.log(`  With ZIP: ${withZip}`)
  console.log(`  With city: ${withCity}`)
  console.log(`  With categories: ${withCats}`)

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
