import 'dotenv/config'
import { PrismaClient, BusinessStatus } from '@prisma/client'

const prisma = new PrismaClient()

const businesses = [
  // BUS SCHEDULES & INFO
  { name: "Baltimore - Brooklyn Bus", phone: "+17189725578", phone2: "845-354-7026", category: "buses", area: "Williamsburg" },
  { name: "Boro Park - Sea Gate (JCC)", phone: "+17184495000", category: "buses", area: "Borough Park" },
  { name: "Boro Park - Staten Island Bus", phone: "+13474180800", category: "buses", area: "Borough Park" },
  { name: "Bus & Subway N.Y.C. M.T.A.", phone: "+17183301234", category: "transportation", area: "Williamsburg" },
  { name: "Excellent Bus (Charter)", phone: "+17189631495", category: "buses", area: "Williamsburg" },
  { name: "Excellent Bus (Catskill)", phone: "+17185995040", category: "buses", area: "Williamsburg" },
  { name: "Greyhound Information", phone: "+18002312222", category: "buses", area: "Williamsburg" },
  { name: "Kaser Bus Service (Monsey)", phone: "+18457313783", category: "buses", area: "Monsey" },
  { name: "Lakewood - Brooklyn (Lakewood Express)", phone: "+17329877733", phone2: "845-510-5113", category: "buses", area: "Lakewood" },
  { name: "Lakewood - Monsey (Rockshire Transit)", phone: "+18453528543", category: "buses", area: "Lakewood" },
  { name: "Lakewood - Williamsburg Shuttle", phone: "+17326300548", category: "buses", area: "Lakewood" },
  { name: "Monroe - Manhattan - Brooklyn (Excellent Bus)", phone: "+17185995040", category: "buses", area: "Williamsburg" },
  { name: "Monroe - Monsey (KJ Express)", phone: "+17189725578", phone2: "845-354-7026", category: "buses", area: "Monsey" },
  { name: "Monsey - Lakewood Trip System", phone: "+17166234733", category: "buses", area: "Monsey" },
  { name: "Monsey & Spring Valley - Brooklyn (Monsey Trails)", phone: "+17189725578", phone2: "845-510-5100", category: "buses", area: "Monsey" },
  { name: "Monsey Tours Charters", phone: "+17186239000", category: "buses", area: "Monsey" },
  { name: "Monsey - Gibbers (Kiamisha Lake)", phone: "+18457313783", category: "buses", area: "Monsey" },
  { name: "Montreal & Tosh - Derech Yeshura", phone: "+13476835959", phone2: "514-605-7600", category: "buses", area: "Williamsburg" },
  { name: "Montreal & Tosh - Heimann's Tours", phone: "+17183872114", phone2: "514-271-6627", category: "buses", area: "Williamsburg" },
  { name: "Montreal & Tosh - Hershey's Trips", phone: "+17185545151", phone2: "514-664-4022", category: "buses", area: "Williamsburg" },
  { name: "Montreal & Tosh - Tosh, Landau's", phone: "+17187823138", phone2: "347-546-6546", category: "buses", area: "Williamsburg" },
  { name: "Trips to Montreal", phone: "+15146644011", category: "buses", area: "Williamsburg" },
  { name: "New Jersey Transit", phone: "+19732755555", category: "buses", area: "Williamsburg" },
  { name: "New York - Toronto Bus", phone: "+17189631495", phone2: "800-540-4448 #105", category: "buses", area: "Williamsburg" },
  { name: "Rockland Bus Transit", phone: "+18453643333", category: "buses", area: "Monsey" },
  { name: "Safra Bus Co.", phone: "+18453621886", category: "buses", area: "Monsey" },
  { name: "Shortline", phone: "+18006318405", category: "buses", area: "Williamsburg" },
  { name: "Shvilei Chesed (Lakewood Ride Share)", phone: "+17327027433", category: "buses", area: "Lakewood" },
  { name: "Staten Island - Boro Park Bus", phone: "+13474180800", category: "buses", area: "Borough Park" },
  { name: "Toronto Bus", phone: "+17189631495", phone2: "800-540-4448 #105", category: "buses", area: "Williamsburg" },
  { name: "The Port Authority (8 Ave & 41 St)", phone: "+12125648484", category: "transportation", area: "Williamsburg" },
  { name: "Upstate Airport Shuttle", phone: "+18452486755", category: "buses", area: "Monsey" },
  { name: "Williamsburg - Boro Park Bus", phone: "+17188758888", category: "buses", area: "Williamsburg" },

  // TRANSPORTATION TO HOSPITALS
  { name: "Access-A-Ride (People With Disabilities)", phone: "+18773372017", category: "transportation,medical", area: "Williamsburg" },
  { name: "Satmar Bikur Cholim - Williamsburg", phone: "+13474236406", category: "bikur_cholim,transportation", area: "Williamsburg" },
  { name: "Satmar Bikur Cholim - Boro Park", phone: "+17188545900", category: "bikur_cholim,transportation", area: "Borough Park" },
  { name: "Satmar Bikur Cholim - Flatbush", phone: "+17182533119", category: "bikur_cholim,transportation", area: "Flatbush" },
  { name: "Chesed - Williamsburg", phone: "+17182189000", category: "chesed,transportation", area: "Williamsburg" },
  { name: "Chesed - Boro Park", phone: "+17184310111", category: "chesed,transportation", area: "Borough Park" },
  { name: "Rockland Bikur Cholim", phone: "+18454257877", category: "bikur_cholim,transportation", area: "Monsey" },
  { name: "Chesed of New Square", phone: "+18453542627", category: "chesed,transportation", area: "Monsey", description: "From Monsey & New S. To Manhattan" },
  { name: "Chai Lifline", phone: "+12124651300", category: "medical,chesed", area: "Williamsburg", description: "To Doctors & Health Facilities in NY & NJ" },
  { name: "G'mach Hatzolah - Monroe", phone: "+18457825376", category: "chesed,transportation", area: "Monsey" },
  { name: "Rodeph Chesed", phone: "+17184359229", category: "chesed,transportation", area: "Williamsburg" },
]

async function importBuses() {
  const existing = await prisma.business.findMany({ select: { phone: true } })
  const existingPhones = new Set(existing.map(e => e.phone))
  
  let imported = 0
  let skipped = 0

  for (const biz of businesses) {
    if (existingPhones.has(biz.phone)) {
      skipped++
      continue
    }
    
    const cats = biz.category.split(',').map(c => c.trim())
    
    try {
      await prisma.business.create({
        data: {
          name: biz.name,
          phone: biz.phone,
          categories: cats,
          area: biz.area,
          status: BusinessStatus.FREE,
          address: biz.description || (biz.phone2 ? `Alt: ${biz.phone2}` : null),
        }
      })
      imported++
      existingPhones.add(biz.phone)
    } catch (e: any) {
      console.error(`  ❌ ${biz.name}: ${e.message}`)
    }
  }

  console.log(`✅ Imported: ${imported}`)
  console.log(`⏭️  Skipped (duplicate): ${skipped}`)
  console.log(`📊 Total in DB: ${existingPhones.size}`)
}

importBuses()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect() })
