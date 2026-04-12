import 'dotenv/config'
import { PrismaClient, BusinessStatus } from '@prisma/client'

const prisma = new PrismaClient()

const businesses = [
  // CAR & TRUCK RENTAL - Page 132
  { name: "Alamo Rent A Car", phone: "+19008011233", category: "car_rentals", area: "Williamsburg" },
  { name: "A&A Rent A Car", phone: "+19083511212", address: "547 Park Ave, Brooklyn NY 11205", category: "car_rentals", area: "Williamsburg" },
  { name: "Avis Rent A Car", phone: "+17184393001", category: "car_rentals", area: "Williamsburg" },
  { name: "Avis Rent A Car - JFK Airport", phone: "+17186451600", category: "car_rentals", area: "Williamsburg" },
  { name: "Avis Rent A Car - LGA Airport", phone: "+17185071300", category: "car_rentals", area: "Williamsburg" },
  { name: "EM Rent A Car", phone: "+17186454500", category: "car_rentals", area: "Williamsburg" },
  { name: "Budget Rent A Car", phone: "+18005274322", address: "56 College Rd, Monsey NY", category: "car_rentals", area: "Monsey" },
  { name: "Jiffy Rent A Car", phone: "+17184494111", category: "car_rentals", area: "Williamsburg" },
  { name: "Just 4 Wheels Car, Truck & Van Rental", phone: "+17188532006", phone2: "800-889-8111", address: "Maspeth, Queens NY", category: "car_rentals", area: "Williamsburg" },
  { name: "Lucky Truck Rental", phone: "+18454257200", address: "56 Rt 59, E Monsey", category: "car_rentals", area: "Monsey" },
  { name: "Honey's Car Rental", phone: "+18452254306", address: "19 McDonald Ave", category: "car_rentals", area: "Monsey" },
  { name: "National Wheels Car Rental", phone: "+13479616888", phone2: "848-225-0259", address: "53 S. Brooklyn NY 11218", category: "car_rentals", area: "Borough Park" },
  { name: "Citi Car Rental", phone: "+17186331798", address: "483 Oquion, Mon", category: "car_rentals", area: "Williamsburg" },
  { name: "Dollar Rent A Car", phone: "+18002227368", category: "car_rentals", area: "Williamsburg" },
  { name: "Domestic Car Rental", phone: "+18002227368", category: "car_rentals", area: "Williamsburg" },
  { name: "Enterprise Rent A Car", phone: "+18002227368", category: "car_rentals", area: "Williamsburg" },
  { name: "Enterprise Rent A Car - Boro Park", phone: "+17184389422", address: "Stof Brdwy", category: "car_rentals", area: "Borough Park" },
  { name: "Enterprise Rent A Car - Brooklyn", phone: "+13474542900", address: "633 84 St", category: "car_rentals", area: "Borough Park" },
  { name: "Payless Rent A Car", phone: "+18002227368", category: "car_rentals", area: "Williamsburg" },
  { name: "Rent Smart Car Rental", phone: "+17189480101", phone2: "800-729-5377", address: "239 Penn St", category: "car_rentals", area: "Williamsburg" },
  { name: "Sensible Car Rental", phone: "+18455576878", category: "car_rentals", area: "Monsey" },
  { name: "Speedway Car Rental", phone: "+17188133520", address: "505 Flushing Ave, Brooklyn", category: "car_rentals", area: "Williamsburg" },
  { name: "Success Car Rental", phone: "+17189638800", address: "900 Atlantic Ave", category: "car_rentals", area: "Williamsburg" },
  { name: "Swefy Rent A Car", phone: "+17189631200", category: "car_rentals", area: "Williamsburg" },
  { name: "Thrifty Rent A Car", phone: "+18005437200", category: "car_rentals", area: "Williamsburg" },
  { name: "Truck Palace", phone: "+18454523900", phone2: "845-342-3111", address: "51 Deerfield Ln, Monsey", category: "car_rentals", area: "Monsey" },
  { name: "U-Save A Car", phone: "+13467083600", phone2: "718-414-0007", address: "547 Park Ave", category: "car_rentals", area: "Williamsburg" },
  { name: "Zoom Car Rental", phone: "+18004324378", phone2: "800-172-8728", address: "269 Wt St, Spring Valley NY 10977", category: "car_rentals", area: "Monsey" },
  { name: "EZ Rental", phone: "+17184327900", address: "200 Mt St, Brooklyn NY 11216", category: "car_rentals", area: "Williamsburg" },
]

async function importCars() {
  const existing = await prisma.business.findMany({ select: { phone: true } })
  const existingPhones = new Set(existing.map(e => e.phone))
  
  let imported = 0, skipped = 0

  for (const biz of businesses) {
    if (existingPhones.has(biz.phone)) { skipped++; continue }
    
    const cats = biz.category.split(',').map(c => c.trim())
    const addr = [biz.address, biz.phone2 ? `Alt: ${biz.phone2}` : null].filter(Boolean).join(' | ')
    
    try {
      await prisma.business.create({
        data: {
          name: biz.name,
          phone: biz.phone,
          categories: cats,
          area: biz.area,
          address: addr || null,
          status: BusinessStatus.FREE,
        }
      })
      imported++
      existingPhones.add(biz.phone)
    } catch (e: any) {
      console.error(`  ❌ ${biz.name}: ${e.message?.substring(0, 100)}`)
    }
  }

  console.log(`\n✅ Imported: ${imported}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`📊 Total in DB: ${existingPhones.size}`)
}

importCars()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect() })
