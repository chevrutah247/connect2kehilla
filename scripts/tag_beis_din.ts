// Tag all existing Beis/Bais/Beth Din records with the 'beis_din' category
// so SMS search "beis din" / "bais din" / "beth din" finds them via category
// matching. Also adds searchable aliases.
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const all = await prisma.business.findMany({
    where: {
      OR: [
        { name: { contains: 'beis din', mode: 'insensitive' } },
        { name: { contains: 'bais din', mode: 'insensitive' } },
        { name: { contains: 'beth din', mode: 'insensitive' } },
        { name: { contains: 'beis medrash', mode: 'insensitive' } },
        { categoryRaw: { contains: 'beis din', mode: 'insensitive' } },
        { categoryRaw: { contains: 'rabbinical', mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, categories: true },
  })

  console.log(`Found ${all.length} Beis/Bais/Beth Din rows\n`)

  const newTags = ['beis_din', 'bais_din', 'beth_din', 'rabbinical_court', 'jewish_law']
  let tagged = 0
  let alreadyTagged = 0

  for (const biz of all) {
    // Skip Beis Medrash entries — they're study halls, not courts
    if (/beis medrash/i.test(biz.name)) continue

    const existing = new Set(biz.categories)
    const toAdd = newTags.filter(t => !existing.has(t))
    if (toAdd.length === 0) {
      alreadyTagged++
      continue
    }
    const merged = [...biz.categories, ...toAdd]
    await prisma.business.update({
      where: { id: biz.id },
      data: { categories: merged },
    })
    console.log(`✅ Tagged: ${biz.name} +[${toAdd.join(',')}]`)
    tagged++
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ Tagged: ${tagged}`)
  console.log(`✓ Already had all tags: ${alreadyTagged}`)

  const total = await prisma.business.count({ where: { categories: { has: 'beis_din' } } })
  console.log(`📊 Total with 'beis_din' tag now: ${total}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
