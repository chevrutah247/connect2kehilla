import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const total = await prisma.business.count()
  console.log(`\n=== FINAL DATABASE STATE ===`)
  console.log(`Total records: ${total}`)

  const residential = await prisma.business.count({ where: { categoryRaw: 'residential' } })
  const business = total - residential
  console.log(`  Residential: ${residential}`)
  console.log(`  Businesses:  ${business}`)

  const byArea = await prisma.$queryRaw<any[]>`
    SELECT "area", COUNT(*) as cnt FROM "Business" GROUP BY "area" ORDER BY cnt DESC
  `
  console.log(`\nBy area:`)
  for (const r of byArea) {
    console.log(`  ${r.area || '(null)'}: ${r.cnt}`)
  }
}

main().finally(() => prisma.$disconnect())
