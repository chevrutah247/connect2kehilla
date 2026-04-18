import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
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

async function fix() {
  const content = readFileSync('/Users/admin/Documents/ПАРНОСА/connect2kehilla/connect2kehilla_import.csv', 'utf-8')
  const records: any[] = parse(content, { columns: true, skip_empty_lines: true, trim: true })
  const residents = records.filter(r => (r.category || '').toLowerCase().includes('residential'))

  const residentPhones = new Set(residents.map(r => normalizePhone(r.phone)).filter(p => p))
  console.log(`CSV residents: ${residentPhones.size} unique phones`)

  // Find DB businesses with these phones but missing 'residential' tag
  const misCategorized = await prisma.business.findMany({
    where: {
      phone: { in: Array.from(residentPhones) },
      NOT: { categories: { has: 'residential' } },
    },
    select: { id: true, phone: true, categories: true },
  })

  console.log(`Missing 'residential' tag: ${misCategorized.length}`)

  let fixed = 0
  for (const biz of misCategorized) {
    const newCats = [...new Set([...biz.categories, 'residential'])]
    await prisma.business.update({
      where: { id: biz.id },
      data: { categories: newCats },
    })
    fixed++
    if (fixed % 200 === 0) console.log(`   Fixed ${fixed}/${misCategorized.length}`)
  }

  const finalCount = await prisma.business.count({ where: { categories: { has: 'residential' } } })
  console.log(`\n✅ Done! Residents in DB now: ${finalCount} (added tag to ${fixed})`)
}

fix()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e.message); await prisma.$disconnect() })
