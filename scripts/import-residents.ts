// Import JBD residents into Business table with category "resident"
// Residents = private individuals (not businesses) — can be found by name + location
// Usage: npx tsx scripts/import-residents.ts

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

const JBD_FILE = '/Users/admin/Documents/ПАРНОСА/connect2kehilla/jbd_all_residents.json'

// ZIP → Area mapping
const ZIP_TO_AREA: Record<string, string> = {
  '11211': 'Williamsburg', '11249': 'Williamsburg', '11206': 'Williamsburg', '11205': 'Williamsburg',
  '11219': 'Borough Park', '11204': 'Borough Park', '11218': 'Borough Park',
  '11230': 'Flatbush', '11210': 'Flatbush',
  '11213': 'Crown Heights', '11225': 'Crown Heights', '11203': 'Crown Heights',
  '10952': 'Monsey', '10977': 'Spring Valley', '10950': 'Monroe',
  '10314': 'Staten Island', '10301': 'Staten Island',
  '10901': 'Suffern', '08701': 'Lakewood',
  '11516': 'Five Towns', '11559': 'Five Towns',
  '07666': 'Teaneck', '07055': 'Passaic',
}

function formatPhone(areaCode: any, telNo: any): string {
  const ac = String(areaCode || '').replace(/\D/g, '')
  const tn = String(telNo || '').replace(/\D/g, '')
  if (!ac || !tn || ac.length !== 3 || tn.length !== 7) return ''
  return `+1${ac}${tn}`
}

async function main() {
  console.log(`Reading ${JBD_FILE}...`)
  const raw = JSON.parse(fs.readFileSync(JBD_FILE, 'utf-8'))
  console.log(`Loaded ${raw.length} raw records`)

  // Deduplicate by account_id
  const byId = new Map<number, any>()
  for (const r of raw) {
    if (!byId.has(r.account_id)) byId.set(r.account_id, r)
  }
  console.log(`Unique residents: ${byId.size}`)

  // Prepare records
  const records: any[] = []
  let skippedNoPhone = 0
  let skippedNoName = 0

  for (const r of byId.values()) {
    const phone = formatPhone(r.area_code, r.telephone_no)
    if (!phone) { skippedNoPhone++; continue }

    const firstName = (r.first_name || '').trim()
    const lastName = (r.last_name || '').trim()
    const fullName = [lastName, firstName].filter(Boolean).join(', ') || [firstName, lastName].filter(Boolean).join(' ')
    if (!fullName) { skippedNoName++; continue }

    const zip = (r.other_zip || r.zipcode || '').trim() || null
    const city = (r.other_city || r.city_name || '').trim() || null
    const state = (r.other_state || r.state_code || 'NY').trim().slice(0, 2) || 'NY'
    const street = (r.other_street || r.street_name || '').trim()
    const houseNo = (r.house_no || '').trim()
    const apt = (r.apt_no || '').trim()
    const addressParts = [houseNo, street, apt ? `#${apt}` : ''].filter(Boolean).join(' ').trim()
    const area = zip && ZIP_TO_AREA[zip] ? ZIP_TO_AREA[zip] : null

    records.push({
      name: fullName,
      phone,
      categoryRaw: 'Resident',
      categories: ['resident'],
      listingType: 'BUSINESS' as const,  // enum doesn't have RESIDENT, use BUSINESS
      address: addressParts || null,
      city,
      state,
      zipCode: zip,
      area,
      status: 'FREE' as const,
      approvalStatus: 'APPROVED' as const,
      submittedVia: 'import',
    })
  }

  console.log(`Ready to import: ${records.length} residents`)
  console.log(`Skipped: ${skippedNoPhone} (no phone), ${skippedNoName} (no name)`)

  // Check existing residents
  const existingCount = await prisma.business.count({ where: { categories: { has: 'resident' } } })
  console.log(`Existing residents in DB: ${existingCount}`)

  if (existingCount > 0) {
    console.log(`\n⚠️  Deleting ${existingCount} existing residents before re-import...`)
    await prisma.business.deleteMany({ where: { categories: { has: 'resident' } } })
    console.log(`Deleted.`)
  }

  // Insert in batches with skipDuplicates
  const batchSize = 500
  let imported = 0
  let failed = 0

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    try {
      const res = await prisma.business.createMany({
        data: batch,
        skipDuplicates: true,
      })
      imported += res.count
    } catch (err: any) {
      failed += batch.length
      console.error(`Batch ${i}-${i + batchSize} failed:`, err.message)
    }
    if ((i + batchSize) % 5000 === 0 || i + batchSize >= records.length) {
      console.log(`  ${Math.min(i + batchSize, records.length)}/${records.length} processed, imported ${imported}`)
    }
  }

  console.log(`\n✅ Imported ${imported} residents (failed: ${failed})`)

  const total = await prisma.business.count({ where: { isActive: true, approvalStatus: 'APPROVED' } })
  const resTotal = await prisma.business.count({ where: { categories: { has: 'resident' }, approvalStatus: 'APPROVED' } })
  console.log(`Total approved in DB: ${total}`)
  console.log(`Total residents in DB: ${resTotal}`)

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
