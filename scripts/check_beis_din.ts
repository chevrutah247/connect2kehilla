// Check what Beis Din / Bais Din / Rabbinical Court records exist in DB.
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Multiple spellings + Hebrew term
  const patterns = ['beis din', 'bais din', 'beth din', 'rabbinical court', 'דין']

  const all = await prisma.business.findMany({
    where: {
      OR: [
        ...patterns.map(p => ({ name: { contains: p, mode: 'insensitive' as const } })),
        ...patterns.map(p => ({ categoryRaw: { contains: p, mode: 'insensitive' as const } })),
        { categories: { hasSome: ['beis_din', 'bais_din', 'beth_din', 'rabbinical_court'] } },
      ],
    },
    select: {
      id: true, name: true, phone: true, website: true, hoursOfWork: true,
      email: true, address: true, zipCode: true, area: true, city: true,
      state: true, isActive: true, categoryRaw: true, categories: true,
    },
    orderBy: { name: 'asc' },
  })

  console.log(`Total Beis/Bais Din-related rows: ${all.length}\n`)
  for (const b of all) {
    const active = b.isActive ? '✓' : '✗'
    console.log(`  [${active}] ${b.name}`)
    console.log(`     phone=${b.phone || '-'} | ${b.address || '-'} | ${b.city || '-'}, ${b.state || '-'} ${b.zipCode || ''} | area=${b.area || '-'}`)
    console.log(`     cats=[${b.categories.join(', ')}] raw=${b.categoryRaw}`)
    console.log()
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
