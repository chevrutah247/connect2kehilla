import 'dotenv/config'
import { PrismaClient, BusinessStatus } from '@prisma/client'

const prisma = new PrismaClient()

const beisDin = [
  // NEW YORK — Brooklyn
  { name: 'Beis Din of Crown Heights', phone: '+17186048000', address: '390A Kingston Avenue, Brooklyn, NY 11213', area: 'Crown Heights', zipCode: '11213', fax: '718-773-0186', description: 'Hotline 10am-11pm. AskTheRav.com' },
  { name: 'Central Rabbinical Congress (Satmar)', phone: '+17183846765', address: '85 Division Ave., Brooklyn, NY 11211', area: 'Williamsburg', zipCode: '11211', fax: '718-486-5574', description: 'Satmar Central Rabbinical Congress' },
  { name: 'Beth Din Rabbinical Board / Vaad HaRabanim of Flatbush', phone: '+17189516262', address: '1575 Coney Island Ave, Brooklyn, NY 11230', area: 'Flatbush', zipCode: '11230', fax: '718-951-8510', description: 'Also: 718-951-8585' },
  { name: 'Sephardic Beth Din of New York', phone: '+17183826036', address: '508 Avenue M, Brooklyn, NY 11230', area: 'Flatbush', zipCode: '11230', fax: '718-375-3418', description: 'Sephardic Beth Din' },
  { name: 'Tartikov Beth Din', phone: '+17189723508', address: '5014 16th Ave Suite 115, Brooklyn, NY 11204', area: 'Borough Park', zipCode: '11204' },
  { name: 'RAA - Rabbinical Alliance of America', phone: '+18337224484', address: '305 Church Avenue, Brooklyn, NY 11218', area: 'Flatbush', zipCode: '11218', description: '1-833-RAA-IGUD' },
  { name: 'Bais Din Tzedek U\'Mishpat', phone: '+17182225252', address: '141 Livingston St (Mezzanine), Brooklyn, NY 11201', area: 'Brooklyn', zipCode: '11201', fax: '718-222-5250' },
  { name: 'Beth Din of America', phone: '+12128079042', address: '305 7th Ave., 12th Floor, New York, NY 10001', area: 'Manhattan', zipCode: '10001', fax: '212-807-9183', website: 'https://bethdin.org', description: 'Also: 212-807-9072. Pre-eminent rabbinic court since 1960.' },
  // NEW YORK — Monsey
  { name: 'Beis Din of Mechon L\'hoyroa', phone: '+18453528444', address: '168 Maple Ave, Monsey, NY 10952', area: 'Monsey', zipCode: '10952' },
  // NEW JERSEY
  { name: 'Rav Elazar Mayer Teitz', phone: '+19083554850', address: 'Jewish Education Center, 330 Elmora Avenue, Elizabeth, NJ 07208', area: 'Elizabeth', zipCode: '07208', fax: '908-355-4851', description: 'Elizabeth NJ Beis Din. ext 111' },
  { name: 'Bais Din of Lakewood', phone: '+17329675999', address: '100 9th St, Lakewood, NJ 08701', area: 'Lakewood', zipCode: '08701', description: 'Lakewood Bais Din' },
  // OTHER MAJOR US CITIES
  { name: 'The Baltimore Bais Din', phone: '+14437876179', address: '3206 Nerak Road, Baltimore, MD 21208', area: 'Baltimore', zipCode: '21208', fax: '410-358-0398' },
  { name: 'The Rabbinical Council of Greater Washington', phone: '+13017700078', address: '13217 New Hampshire Ave. Suite #10142, Silver Spring, MD 20914', area: 'Silver Spring', zipCode: '20914' },
  { name: 'Chicago Rabbinical Council', phone: '+17734653900', address: '2701 W. Howard St., Chicago, IL 60645', area: 'Chicago', zipCode: '60645' },
  { name: 'Vaad HoEir of Saint Louis', phone: '+13145692770', address: '4 Millstone Campus, St. Louis, MO 63146', area: 'St. Louis', zipCode: '63146', fax: '314-569-2774' },
  { name: 'Rabbinical Court of Greater Detroit', phone: '+12485595005', address: '18877 West 10 Mile Road, Suite 101, Southfield, MI 48075', area: 'Detroit', zipCode: '48075', fax: '248-559-5202' },
  { name: 'Beis Din of Greater Boston', phone: '+16174262139', address: '665 Beacon Street, Boston, MA 02215', area: 'Boston', zipCode: '02215', fax: '617-426-6268' },
  { name: 'Rabbinical Council of California - RCC Vaad', phone: '+12133893382', address: '3780 Wilshire Blvd #420, Los Angeles, CA 90010', area: 'Los Angeles', zipCode: '90010', fax: '213-234-4558' },
  { name: 'The Rabbinical Court of California and the West Coast', phone: '+13239390298', address: '331 N. Alta Vista Blvd, Los Angeles, CA', area: 'Los Angeles', description: 'Led by HaRav Gavriel Cohen' },
  { name: 'Beth Din of Florida', phone: '+15614912360', address: '7900 Montoya Circle, Boca Raton, FL 33433', area: 'Boca Raton', zipCode: '33433' },
  { name: 'Beis Din of South Florida', phone: '+17863001613', address: '3767 Chase Avenue, Miami Beach, FL 33140', area: 'Miami', zipCode: '33140' },
  { name: 'Rabbi Ilan Daniel Feldman - Atlanta', phone: '+14046330551', address: 'Congregation Beth Jacob Atlanta, 1855 La Vista Rd., Atlanta, GA 30329', area: 'Atlanta', zipCode: '30329', description: 'ext 224' },
  { name: 'Vaad HaRabbonim of Greater Cleveland', phone: '+12163821958', address: '14270 Cedar Road, University Heights, OH 44121', area: 'Cleveland', zipCode: '44121' },
  { name: 'Vaad Hoeir of Cincinnati - Rabbi Weinrib', phone: '+15136314900', address: '2455A Section Rd, Cincinnati, OH 45237', area: 'Cincinnati', zipCode: '45237' },
  { name: 'Vaad Harabanim of Greater Pittsburgh', phone: '+14124211437', address: '2319 Murray Avenue, Pittsburgh, PA 15217', area: 'Pittsburgh', zipCode: '15217' },
  { name: 'Rabbi Aharon Dov Berizman', phone: '+12156353152', address: 'Young Israel of Elkins Park, 7715 Montgomery Avenue, Elkins Park, PA 19027', area: 'Elkins Park', zipCode: '19027' },
  { name: 'Vaad HaKehilloth of Memphis', phone: '+19012703911', address: 'P.O. Box 770893, Memphis, TN 38117', area: 'Memphis', zipCode: '38117' },
  { name: 'Vaad HaRabanim of Greater Seattle', phone: '+12067600805', address: '5305 52nd Ave S, Seattle, WA 98118', area: 'Seattle', zipCode: '98118', fax: '206-725-0347' },
  { name: 'The Beltway Vaad - Rabbi Topolosky', phone: '+12404832565', address: 'Washington D.C. Metro Area', area: 'Washington DC', website: 'https://beltwayvaad.org' },
  { name: 'Beis Din of Milwaukee', phone: '+14148734398', address: '5007 West Keefe Avenue, Milwaukee, WI 53216', area: 'Milwaukee', zipCode: '53216', fax: '414-447-7915' },
]

async function importBeisDin() {
  const existing = await prisma.business.findMany({ select: { phone: true } })
  const existingPhones = new Set(existing.map(e => e.phone))

  let imported = 0, skipped = 0, errors = 0

  for (const bd of beisDin) {
    if (existingPhones.has(bd.phone)) { skipped++; continue }

    try {
      await prisma.business.create({
        data: {
          name: bd.name,
          phone: bd.phone,
          categories: ['beis_din', 'rabbinical_court', 'jewish_law', 'court'],
          categoryRaw: 'Beis Din / Rabbinical Court',
          area: bd.area || null,
          zipCode: bd.zipCode || null,
          address: bd.address || null,
          website: bd.website || null,
          fax: bd.fax || null,
          description: bd.description || null,
          listingType: 'BUSINESS',
          status: BusinessStatus.FREE,
        },
      })
      imported++
      existingPhones.add(bd.phone)
    } catch (e: any) {
      console.error(`❌ ${bd.name}: ${e.message?.substring(0, 100)}`)
      errors++
    }
  }

  console.log(`\n✅ Imported: ${imported}`)
  console.log(`⏭️  Skipped (duplicate): ${skipped}`)
  console.log(`❌ Errors: ${errors}`)
  console.log(`📊 Total in DB: ${existingPhones.size}`)
}

importBeisDin()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect() })
