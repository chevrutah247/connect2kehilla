import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const centers = [
  { name: 'Heichal Menachem', phone: '+17186331076', address: '1581 52nd Street', zipCode: '11219', city: 'Brooklyn', area: 'Borough Park', website: 'chassidus.com', categories: ['chabad_center', 'library', 'beis_medrash', 'chabad_organization'] },
  { name: 'Chabad of Brooklyn Heights', phone: '+17185964840', address: '117 Remsen Street', zipCode: '11201', city: 'Brooklyn', area: 'Brooklyn Heights', email: 'info@heightschabad.com', website: 'heightschabad.com', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad Colleges Downtown Brooklyn', phone: '+13474132116', address: '128 Montague Street', zipCode: '11201', city: 'Brooklyn', area: 'Downtown Brooklyn', email: 'chabadstudent@gmail.com', website: 'chabadstudentspace.org', categories: ['chabad_center', 'education', 'chabad_organization'] },
  { name: 'Chabad of Dumbo', phone: '+17183620682', address: '205 Plymouth Street, 1st Floor', zipCode: '11201', city: 'Brooklyn', area: 'Dumbo', website: 'chabadofdumbo.com', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad of North Brooklyn', phone: '+17183880748', address: '132 North 5th Street #2C', zipCode: '11249', city: 'Brooklyn', area: 'Williamsburg', website: 'chabadofnorthbrooklyn.com', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad Center for Russian Speakers', phone: '+16469750862', address: '2143 East 71st Street', zipCode: '11234', city: 'Brooklyn', area: 'Bergen Beach', website: 'jccrs.com', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Mill Basin Jewish Center', phone: '+13479870083', address: '2748 Mill Avenue', zipCode: '11234', city: 'Brooklyn', area: 'Mill Basin', website: 'jewishmillbasin.com', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad of the Lower East Side', phone: '+12124730770', address: '37 Essex Street', zipCode: '10002', city: 'New York', area: 'Lower East Side', email: 'chabadles@gmail.com', website: 'chabadles.com', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad Jewish Center of FiDi', phone: '+12123350613', address: '10 Cliff St', zipCode: '10038', city: 'New York', area: 'Financial District', website: 'chabadfidi.com', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad of Gravesend', phone: '+13472670263', address: '723 Avenue Z', zipCode: '11223', city: 'Brooklyn', area: 'Gravesend', email: 'BeachHavenJewishCenter@gmail.com', website: 'jewishgravesend.com', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad of Bay Ridge', phone: '+17189746366', address: '373 Bay Ridge Avenue', zipCode: '11220', city: 'Brooklyn', area: 'Bay Ridge', email: 'rabbi@chabadofbayridge.com', website: 'chabadofbayridge.com', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad of Wall Street', phone: '+12127860068', address: '139 Fulton Street', zipCode: '10038', city: 'New York', area: 'Financial District', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad of Bensonhurst', phone: '+17182366646', address: '8224 23rd Avenue', zipCode: '11214', city: 'Brooklyn', area: 'Bensonhurst', website: 'chabadofbensonhurst.com', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'FiDi Hebrew School', phone: '+12123350613', address: '10 Cliff St', zipCode: '10038', city: 'New York', area: 'Financial District', email: 'info@thejle.com', website: 'fidihebrewschool.com', categories: ['education', 'hebrew_school', 'chabad_organization'] },
  { name: 'Gan Accademia', phone: '+12123350613', address: '10 Cliff St', zipCode: '10038', city: 'New York', area: 'Financial District', website: 'ganaccademia.com', categories: ['education', 'preschool', 'daycare', 'chabad_organization'] },
]

async function main() {
  let added = 0
  let skipped = 0
  for (const c of centers) {
    const existing = await prisma.business.findFirst({ where: { phone: c.phone, name: { contains: c.name.split(' ')[0], mode: 'insensitive' } } })
    if (existing) {
      console.log(`  Skip: ${c.name} (exists as "${existing.name}")`)
      skipped++
      continue
    }
    await prisma.business.create({
      data: {
        name: c.name,
        phone: c.phone,
        address: c.address,
        zipCode: c.zipCode,
        city: c.city,
        area: c.area,
        email: c.email || null,
        website: c.website || null,
        categoryRaw: c.categories.includes('education') ? 'Education' : 'Chabad Center',
        categories: c.categories,
        state: 'NY',
      }
    })
    added++
    console.log(`  Added: ${c.name} (${c.area})`)
  }

  const total = await prisma.business.count()
  console.log(`\n✅ Added ${added}, skipped ${skipped}. Total in DB: ${total}`)
  await prisma.$disconnect()
}

main()
