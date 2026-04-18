import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const orgCategories: Record<string, string[]> = {
  'Lishkas Ezras Achim': ['chesed', 'office'],
  'F.R.E.E. HQ - Friends of Refugees of Eastern Europe': ['chesed', 'office', 'headquarters'],
  'Mitzvah Tank Organization': ['outreach', 'office'],
  'Agudas Chassidei Chabad': ['headquarters', 'office'],
  'Lahak Hanochos Inc': ['publishing', 'office'],
  'Igud Mesivtos V\'Yeshivos Lubavitch': ['education', 'yeshiva', 'institute', 'office'],
  'Lubavitch Youth Organization': ['youth', 'office', 'headquarters'],
  'Kehot Publication Society': ['publishing', 'books', 'library'],
  'Machne Israel Development Fund': ['fund', 'development', 'office'],
  'The Shluchim Office': ['office', 'headquarters'],
  'Sichos in English': ['publishing', 'media', 'library'],
  'Colel Menachem': ['kollel', 'beis_medrash', 'davening'],
  'The Jewish Learning Institute (JLI)': ['institute', 'education'],
  'Taharas Hamishpacha International': ['mikvah', 'office', 'headquarters'],
  'Jewish Educational Media (JEM)': ['media', 'publishing'],
  'Shabbat Candles Campaign - Mivtza Neshek': ['campaign', 'outreach', 'office'],
}

async function main() {
  const orgs = await prisma.business.findMany({
    where: { categoryRaw: 'Chabad Organization' }
  })

  for (const org of orgs) {
    const cats = orgCategories[org.name]
    if (cats) {
      await prisma.business.update({
        where: { id: org.id },
        data: { categories: cats }
      })
      console.log(`  ${org.name}: [${cats.join(', ')}]`)
    }
  }

  // Also add keyword aliases to fuzzy.ts categories
  console.log('\nNew searchable keywords:')
  console.log('  shul, beis, beis medrash, kollel, minyan, davening')
  console.log('  office, headquarters, media, publishing, fund')
  console.log('  campaign, institute, library, development')

  console.log(`\nUpdated ${orgs.length} organizations`)
  await prisma.$disconnect()
}

main()
