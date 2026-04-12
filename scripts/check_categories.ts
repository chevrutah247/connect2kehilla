import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Sample of different category types to see categories array
  console.log('=== HALLS sample ===')
  const halls = await prisma.business.findMany({
    where: { categoryRaw: 'halls' }, take: 3
  })
  for (const r of halls) {
    console.log(`  ${r.name}`)
    console.log(`    categoryRaw: ${r.categoryRaw}`)
    console.log(`    categories: [${r.categories.join(', ')}]`)
  }
  
  console.log('\n=== JEWELRY sample ===')
  const jew = await prisma.business.findMany({
    where: { categoryRaw: 'jewelry' }, take: 3
  })
  for (const r of jew) {
    console.log(`  ${r.name}`)
    console.log(`    categories: [${r.categories.join(', ')}]`)
  }
  
  console.log('\n=== RESIDENTIAL sample ===')
  const res = await prisma.business.findMany({
    where: { categoryRaw: 'residential' }, take: 3
  })
  for (const r of res) {
    console.log(`  ${r.name}`)
    console.log(`    categories: [${r.categories.join(', ')}]`)
  }
  
  // Count records that have empty categories array
  const emptyCategories = await prisma.$queryRaw<any[]>`
    SELECT COUNT(*) as cnt FROM "Business" WHERE array_length(categories, 1) IS NULL OR array_length(categories, 1) = 0
  `
  console.log(`\n=== Records with empty categories array: ${emptyCategories[0].cnt}`)
  
  // Count distinct categories array values
  const distinctTags = await prisma.$queryRaw<any[]>`
    SELECT unnest(categories) as tag, COUNT(*) as cnt 
    FROM "Business" 
    GROUP BY tag 
    ORDER BY cnt DESC 
    LIMIT 30
  `
  console.log('\n=== Top tags in categories[] ===')
  for (const r of distinctTags) {
    console.log(`  ${r.tag}: ${r.cnt}`)
  }
}

main().finally(() => prisma.$disconnect())
