import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Chabad centers (synagogues/shuls)
const chabadCenters = [
  { name: 'Chabad of SUNY Downstate', phone: '+17186131818', address: '460 Lenox Rd', zipCode: '11203', city: 'Brooklyn', area: 'Crown Heights', website: 'ChabadSUNY.org', categories: ['chabad_center', 'synagogue', 'shul', 'education'] },
  { name: 'Chabad of Prospect Lefferts Gardens', phone: '+19178030227', address: '132 Lincoln Rd', zipCode: '11225', city: 'Brooklyn', area: 'Prospect Lefferts Gardens', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad Prospect Heights East', phone: '+13472776908', address: '664 Sterling Place', zipCode: '11216', city: 'Brooklyn', area: 'Prospect Heights', website: 'ChabadHeights.com', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad of Park Slope', phone: '+17189659836', address: '70 Prospect Park West, Suite 1C', zipCode: '11215', city: 'Brooklyn', area: 'Park Slope', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad Jewish Center Prospect Heights West', phone: '', address: '569 Vanderbilt Avenue', zipCode: '11238', city: 'Brooklyn', area: 'Prospect Heights', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad of Windsor Terrace', phone: '', address: '1266 Prospect Avenue', zipCode: '11218', city: 'Brooklyn', area: 'Windsor Terrace', categories: ['chabad_center', 'synagogue', 'shul'] },
]

// Schools / daycares / camps
const schools = [
  { name: 'Brownstone Gan Katan Preschool', phone: '', address: '797 Sterling Place', zipCode: '11216', city: 'Brooklyn', area: 'Prospect Heights', categories: ['education', 'preschool', 'daycare', 'chabad_organization'] },
  { name: 'Gan on Greene - Fort Greene Preschool', phone: '', address: '54 Greene Avenue', zipCode: '11238', city: 'Brooklyn', area: 'Fort Greene', categories: ['education', 'preschool', 'daycare', 'chabad_organization'] },
  { name: 'Kiddie Gan Day Camp', phone: '', address: '70 Prospect Park West, Suite 1B', zipCode: '11215', city: 'Brooklyn', area: 'Park Slope', categories: ['education', 'camp', 'daycare', 'chabad_organization'] },
  { name: 'CTeen Program', phone: '', address: '910 Ditmas Ave #1', zipCode: '11218', city: 'Brooklyn', area: 'Ditmas Park', categories: ['education', 'youth', 'chabad_organization'] },
  { name: 'Beth Rivkah Headstart', phone: '', address: '913 Nostrand Ave', zipCode: '11225', city: 'Brooklyn', area: 'Crown Heights', categories: ['education', 'preschool', 'chabad_organization'] },
  { name: 'Kehot Publication Society Showroom', phone: '', address: '291 Kingston Ave', zipCode: '11213', city: 'Brooklyn', area: 'Crown Heights', website: 'kehot.com', categories: ['publishing', 'books', 'library', 'chabad_organization'] },
  { name: 'Machon L\'Yahadus', phone: '', address: '823-825 Eastern Parkway', zipCode: '11213', city: 'Brooklyn', area: 'Crown Heights', categories: ['education', 'institute', 'chabad_organization'] },
  { name: 'United Lubavitcher Yeshivoth Mesivta & High School', phone: '', address: '885 Eastern Parkway', zipCode: '11213', city: 'Brooklyn', area: 'Crown Heights', categories: ['education', 'yeshiva', 'chabad_organization'] },
]

// Organizations
const orgs = [
  { name: 'National Committee for Furtherance of Jewish Education (NCFJE)', phone: '+17187350200', address: '824 Eastern Parkway', zipCode: '11213', city: 'Brooklyn', area: 'Crown Heights', website: 'NCFJE.org', categories: ['education', 'office', 'headquarters', 'chabad_organization'] },
]

async function main() {
  const all = [
    ...chabadCenters.map(c => ({ ...c, categoryRaw: 'Chabad Center' })),
    ...schools.map(c => ({ ...c, categoryRaw: 'Education' })),
    ...orgs.map(c => ({ ...c, categoryRaw: 'Chabad Organization' })),
  ]

  let added = 0, skipped = 0

  for (const c of all) {
    // Skip if no phone (can't deduplicate reliably)
    if (!c.phone) {
      // Check by name
      const byName = await prisma.business.findFirst({ where: { name: { contains: c.name.split(' - ')[0].substring(0, 20), mode: 'insensitive' } } })
      if (byName) {
        console.log(`  Skip (name match): ${c.name}`)
        skipped++
        continue
      }
      // Add without phone
      await prisma.business.create({
        data: {
          name: c.name, phone: '', address: c.address, zipCode: c.zipCode,
          city: c.city, area: c.area, email: (c as any).email || null,
          website: (c as any).website || null, categoryRaw: c.categoryRaw,
          categories: c.categories, state: 'NY',
        }
      })
      added++
      console.log(`  Added (no phone): ${c.name} (${c.area})`)
      continue
    }

    const existing = await prisma.business.findFirst({ where: { phone: c.phone } })
    if (existing) {
      console.log(`  Skip (phone): ${c.name} → "${existing.name}"`)
      skipped++
      continue
    }

    await prisma.business.create({
      data: {
        name: c.name, phone: c.phone, address: c.address, zipCode: c.zipCode,
        city: c.city, area: c.area, email: (c as any).email || null,
        website: (c as any).website || null, categoryRaw: c.categoryRaw,
        categories: c.categories, state: 'NY',
      }
    })
    added++
    console.log(`  Added: ${c.name} (${c.area})`)
  }

  const total = await prisma.business.count()
  console.log(`\n✅ Added ${added}, skipped ${skipped}. Total: ${total}`)
  await prisma.$disconnect()
}

main()
