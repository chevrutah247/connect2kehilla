// Find Chabad entries missing phone / website / hoursOfWork / email / address.
// Use this to plan internet enrichment.
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const all = await prisma.business.findMany({
    where: {
      OR: [
        { name: { contains: 'chabad', mode: 'insensitive' } },
        { categoryRaw: { contains: 'chabad', mode: 'insensitive' } },
        { categories: { hasSome: ['chabad_center', 'chabad_organization'] } },
      ],
    },
    select: {
      id: true, name: true, phone: true, website: true, hoursOfWork: true,
      email: true, address: true, zipCode: true, area: true, city: true,
      isActive: true, categoryRaw: true,
    },
    orderBy: { name: 'asc' },
  })

  console.log(`Total Chabad-related: ${all.length}\n`)

  const missing = {
    phone: all.filter(b => !b.phone || b.phone.trim() === '').length,
    website: all.filter(b => !b.website).length,
    hours: all.filter(b => !b.hoursOfWork).length,
    email: all.filter(b => !b.email).length,
    address: all.filter(b => !b.address || b.address.trim() === '').length,
    zip: all.filter(b => !b.zipCode).length,
    inactive: all.filter(b => !b.isActive).length,
  }
  console.log('Missing fields:')
  for (const [k, v] of Object.entries(missing)) {
    console.log(`  ${k.padEnd(10)}: ${v} / ${all.length}`)
  }

  // Worst offenders — entries with the most gaps
  const scored = all.map(b => {
    let gaps = 0
    if (!b.phone || b.phone.trim() === '') gaps++
    if (!b.website) gaps++
    if (!b.hoursOfWork) gaps++
    if (!b.address || b.address.trim() === '') gaps++
    return { ...b, gaps }
  }).sort((a, b) => b.gaps - a.gaps)

  console.log('\nTop 30 entries with most missing fields:')
  for (const b of scored.slice(0, 30)) {
    const flags = [
      b.phone ? '📞' : '  ',
      b.website ? '🌐' : '  ',
      b.hoursOfWork ? '⏰' : '  ',
      b.address ? '📍' : '  ',
    ].join(' ')
    console.log(`  [${flags}] ${b.name} | ${b.zipCode || '-'} | ${b.area || '-'}`)
  }

  // Sample "complete" entries
  const complete = all.filter(b => b.phone && b.website && b.address)
  console.log(`\nFully-populated (phone+website+address): ${complete.length} / ${all.length}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
