import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const centers = [
  { name: 'Chabad-Lubavitch of Clinton Hill', phone: '+17189749472', address: '191 Washington Ave', zipCode: '11205', city: 'Brooklyn', area: 'Clinton Hill', website: 'greenechabad.com', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad of Clinton Hill and Pratt Institute', phone: '+16464813663', address: '110 Emerson Place', zipCode: '11205', city: 'Brooklyn', area: 'Clinton Hill', website: 'CHChabad.com', categories: ['chabad_center', 'education', 'synagogue'] },
  { name: 'Chabad of Ditmas Park', phone: '+13478502255', address: '716 Ditmas Avenue', zipCode: '11218', city: 'Brooklyn', area: 'Ditmas Park', website: 'DitmasParkChabad.com', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad at Brooklyn College', phone: '+13233605480', address: '868 E. 23rd Street', zipCode: '11210', city: 'Brooklyn', area: 'Flatbush', email: 'rabbi@chabadatbc.com', categories: ['chabad_center', 'education', 'synagogue'] },
  { name: 'Chabad Lubavitch of Kensington', phone: '+17188540006', address: '605 Ocean Parkway', zipCode: '11218', city: 'Brooklyn', area: 'Kensington', website: 'ChabadCentralBrooklyn.com', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad Lubavitch of Boro Park', phone: '+17188539853', address: '3905 15th Avenue', zipCode: '11218', city: 'Brooklyn', area: 'Borough Park', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad-Lubavitch of Midwood', phone: '+17183383324', address: '1043 E 16th Street', zipCode: '11230', city: 'Brooklyn', area: 'Midwood', website: 'chabadofmidwood.com', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad Downtown Brooklyn', phone: '+13479949770', address: '84 Hoyt Street', zipCode: '11201', city: 'Brooklyn', area: 'Downtown Brooklyn', email: 'rabbi@DTBKchabad.com', website: 'DTBKchabad.com', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad of Bushwick', phone: '+17187562488', address: '1087 Flushing Avenue', zipCode: '11237', city: 'Brooklyn', area: 'Bushwick', website: 'chabadofbushwick.org', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad of Canarsie and Starrett City', phone: '+13477707506', address: '10576 Flatlands 1st Street', zipCode: '11236', city: 'Brooklyn', area: 'Canarsie', categories: ['chabad_center', 'synagogue', 'shul'] },
  { name: 'Chabad of Ridgewood - Congregation Beit Aharon', phone: '+17186139536', address: '55-39 Myrtle Avenue', zipCode: '11385', city: 'Ridgewood', area: 'Ridgewood', email: 'rabbisarytchev@hotmail.com', website: 'ChabadofRidgewood.com', categories: ['chabad_center', 'synagogue', 'shul'] },
]

async function main() {
  let added = 0
  for (const c of centers) {
    const existing = await prisma.business.findFirst({ where: { phone: c.phone } })
    if (existing) {
      console.log(`  Skip: ${c.name} (phone exists as "${existing.name}")`)
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
        categoryRaw: 'Chabad Center',
        categories: c.categories,
        state: 'NY',
      }
    })
    added++
    console.log(`  Added: ${c.name} (${c.area})`)
  }

  // Update Brooklyn Heights email
  const bh = await prisma.business.findFirst({ where: { name: { contains: 'Brooklyn Heights' }, phone: '+17185964840' } })
  if (bh) {
    await prisma.business.update({
      where: { id: bh.id },
      data: { email: 'infoheightschabad@gmail.com' }
    })
    console.log(`  Updated: Chabad of Brooklyn Heights email`)
  }

  const total = await prisma.business.count()
  console.log(`\n✅ Added ${added}. Total in DB: ${total}`)
  await prisma.$disconnect()
}

main()
