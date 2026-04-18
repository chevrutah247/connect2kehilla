// Quick diagnostic — list all Chabad-like entries in Business table.
// Run locally: npx tsx scripts/check_chabad.ts

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const total = await prisma.business.count()
  console.log(`Total Business rows: ${total}\n`)

  // 1. Match by name
  const byName = await prisma.business.findMany({
    where: { name: { contains: 'chabad', mode: 'insensitive' } },
    select: { id: true, name: true, phone: true, area: true, categories: true, categoryRaw: true, isActive: true, zipCode: true },
    take: 100,
  })
  console.log(`By name contains 'chabad': ${byName.length}`)
  for (const b of byName.slice(0, 20)) {
    const active = b.isActive ? '✓' : '✗ INACTIVE'
    console.log(`  [${active}] ${b.name} | ${b.phone} | ${b.area || '-'} | ${b.zipCode || '-'} | cats=[${b.categories.join(',')}] | raw=${b.categoryRaw}`)
  }
  if (byName.length > 20) console.log(`  ... and ${byName.length - 20} more`)

  // 2. Match by categoryRaw
  const byRaw = await prisma.business.findMany({
    where: { categoryRaw: { contains: 'chabad', mode: 'insensitive' } },
    select: { name: true, isActive: true },
    take: 100,
  })
  console.log(`\nBy categoryRaw contains 'chabad': ${byRaw.length}`)

  // 3. Match by categories array containing chabad-related tag
  const byCat = await prisma.business.findMany({
    where: {
      OR: [
        { categories: { has: 'chabad' } },
        { categories: { has: 'chabad_center' } },
        { categories: { has: 'chabad_organization' } },
      ],
    },
    select: { name: true, categories: true, isActive: true },
    take: 100,
  })
  console.log(`\nBy categories has chabad/_center/_organization: ${byCat.length}`)
  for (const b of byCat.slice(0, 10)) {
    const active = b.isActive ? '✓' : '✗'
    console.log(`  [${active}] ${b.name} | [${b.categories.join(',')}]`)
  }

  // 4. Only INACTIVE chabad
  const inactive = await prisma.business.count({
    where: {
      isActive: false,
      OR: [
        { name: { contains: 'chabad', mode: 'insensitive' } },
        { categoryRaw: { contains: 'chabad', mode: 'insensitive' } },
      ],
    },
  })
  console.log(`\nINACTIVE chabad entries: ${inactive}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
