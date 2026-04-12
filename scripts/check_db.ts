import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const total = await prisma.business.count()
  console.log(`Total records in DB: ${total}`)

  // Group by categoryRaw
  const byRaw = await prisma.$queryRaw<any[]>`
    SELECT "categoryRaw" as cat, COUNT(*) as cnt 
    FROM "Business" 
    GROUP BY "categoryRaw" 
    ORDER BY cnt DESC 
    LIMIT 30
  `
  console.log('\n--- Top 30 categoryRaw ---')
  for (const r of byRaw) {
    console.log(`  ${r.cat || '(null)'}: ${r.cnt}`)
  }

  // Count records by area
  const byArea = await prisma.$queryRaw<any[]>`
    SELECT "area", COUNT(*) as cnt 
    FROM "Business" 
    GROUP BY "area" 
    ORDER BY cnt DESC
  `
  console.log('\n--- By area ---')
  for (const r of byArea) {
    console.log(`  ${r.area || '(null)'}: ${r.cnt}`)
  }

  // Sample residential entries
  const resSample = await prisma.business.findMany({
    where: { categoryRaw: 'residential' },
    take: 5,
  })
  console.log(`\n--- Sample residential: ${resSample.length} shown ---`)
  for (const r of resSample) {
    console.log(`  ${r.name} | ${r.phone}`)
  }
}

main().finally(() => prisma.$disconnect())
