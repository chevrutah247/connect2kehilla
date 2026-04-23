// scripts/import-grocery-stores.ts
// Импорт кошерных продуктовых магазинов Brooklyn в базу данных
// Запуск: npx tsx scripts/import-grocery-stores.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const GROCERY_STORES = [
  // ── Crown Heights ─────────────────────────────────────────────
  {
    name: "Kahan's Superette",
    phone: '(718) 756-2999',
    address: '317 Kingston Ave, Brooklyn, NY 11213',
    area: 'Crown Heights',
    zipCode: '11213',
    website: 'https://www.kahanskosher.com',
    categories: ['grocery', 'kosher', 'supermarket', 'food', 'specials'],
  },
  {
    name: 'Kol Tuv',
    phone: '(718) 953-4440',
    address: '409 Kingston Ave, Brooklyn, NY 11225',
    area: 'Crown Heights',
    zipCode: '11225',
    website: 'https://www.koltuvkosher.com',
    categories: ['grocery', 'kosher', 'supermarket', 'food'],
  },
  // ── Williamsburg ──────────────────────────────────────────────
  {
    name: 'Foodoo Kosher',
    phone: '(718) 384-2000',
    address: '249 Wallabout St, Brooklyn, NY 11206',
    area: 'Williamsburg',
    zipCode: '11206',
    website: 'https://www.foodookosher.com',
    categories: ['grocery', 'kosher', 'supermarket', 'food', 'specials'],
  },
  {
    name: 'Mehadrin',
    phone: '(718) 456-9494',
    address: '30 Morgan Ave, Brooklyn, NY 11237',
    area: 'Williamsburg',
    zipCode: '11237',
    website: 'https://www.mehadrin.com',
    categories: ['grocery', 'kosher', 'supermarket', 'food'],
  },
  // ── Flatbush / Midwood ────────────────────────────────────────
  {
    name: "Moisha's Discount Supermarket",
    phone: '(718) 336-7563',
    address: '325 Avenue M, Brooklyn, NY 11230',
    area: 'Flatbush',
    zipCode: '11230',
    website: 'https://moishas.com',
    categories: ['grocery', 'kosher', 'supermarket', 'food', 'specials'],
  },
  {
    name: 'Mountain Fruit',
    phone: '(718) 998-3333',
    address: '1523 Avenue M, Brooklyn, NY 11230',
    area: 'Flatbush',
    zipCode: '11230',
    website: 'https://shopmountainfruit.com',
    categories: ['grocery', 'kosher', 'supermarket', 'food', 'specials', 'produce'],
  },
  {
    name: 'Glatt Mart',
    phone: '(718) 338-4040',
    address: '1205 Avenue M, Brooklyn, NY 11230',
    area: 'Flatbush',
    zipCode: '11230',
    website: 'https://www.glattmart.com',
    categories: ['grocery', 'kosher', 'supermarket', 'food', 'specials'],
  },
  {
    name: 'Organic Circle',
    phone: '(718) 878-3103',
    address: '1415 Avenue M, Brooklyn, NY 11230',
    area: 'Flatbush',
    zipCode: '11230',
    website: 'http://organiccircleny.com',
    categories: ['grocery', 'kosher', 'supermarket', 'food', 'organic', 'produce'],
  },
  {
    name: 'Kosher Palace',
    phone: '(718) 743-1900',
    address: '2818 Avenue U, Brooklyn, NY 11229',
    area: 'Flatbush',
    zipCode: '11229',
    website: '',
    categories: ['grocery', 'kosher', 'supermarket', 'food'],
  },
  // ── Boro Park / Mapleton ──────────────────────────────────────
  {
    name: '3 Guys From Brooklyn',
    phone: '(718) 748-8340',
    address: '6502 Fort Hamilton Pkwy, Brooklyn, NY 11219',
    area: 'Boro Park',
    zipCode: '11219',
    website: 'https://www.3guysfrombrooklyn.com',
    categories: ['grocery', 'kosher', 'supermarket', 'food', 'produce'],
  },
  {
    name: 'Center Fresh',
    phone: '(718) 633-8099',
    address: '4517 13th Ave, Brooklyn, NY 11219',
    area: 'Boro Park',
    zipCode: '11219',
    website: 'https://centerfresh13.wixsite.com/mysite',
    categories: ['grocery', 'kosher', 'supermarket', 'food'],
  },
  {
    name: 'Food Spot',
    phone: '(718) 436-0968',
    address: '4504 Fort Hamilton Pkwy, Brooklyn, NY 11219',
    area: 'Boro Park',
    zipCode: '11219',
    website: 'https://bp.spotyourorder.com',
    categories: ['grocery', 'kosher', 'supermarket', 'food'],
  },
  {
    name: "Goldberg's Freshmarket",
    phone: '(718) 435-7177',
    address: '5025 18th Ave, Brooklyn, NY 11204',
    area: 'Boro Park',
    zipCode: '11204',
    website: '',
    categories: ['grocery', 'kosher', 'supermarket', 'food', 'specials'],
  },
  {
    name: 'Gourmet Glatt',
    phone: '',
    address: '1274 39th St, Brooklyn, NY 11218',
    area: 'Boro Park',
    zipCode: '11218',
    website: 'https://gourmetglatt.com',
    categories: ['grocery', 'kosher', 'supermarket', 'food', 'gourmet'],
  },
  {
    name: 'KRM Kollel Supermarket',
    phone: '(718) 436-7701',
    address: '1325 39th St, Brooklyn, NY 11218',
    area: 'Boro Park',
    zipCode: '11218',
    website: 'http://www.krmonline.com',
    categories: ['grocery', 'kosher', 'supermarket', 'food', 'specials'],
  },
  {
    name: 'Kosher Discount',
    phone: '(718) 854-4949',
    address: '4909 13th Ave, Brooklyn, NY 11219',
    area: 'Boro Park',
    zipCode: '11219',
    website: 'https://kosher-discount.edan.io',
    categories: ['grocery', 'kosher', 'supermarket', 'food'],
  },
  {
    name: "Landau's Supermarket",
    phone: '(718) 633-0633',
    address: '4516 18th Ave, Brooklyn, NY 11204',
    area: 'Boro Park',
    zipCode: '11204',
    website: 'https://www.landaussupermarket.com',
    categories: ['grocery', 'kosher', 'supermarket', 'food'],
  },
  {
    name: 'Mega 53',
    phone: '(718) 436-5353',
    address: '5314 13th Ave, Brooklyn, NY 11219',
    area: 'Boro Park',
    zipCode: '11219',
    website: 'https://mega53market.com',
    categories: ['grocery', 'kosher', 'supermarket', 'food'],
  },
  {
    name: 'Super 13',
    phone: '(718) 633-1600',
    address: '5214 13th Ave, Brooklyn, NY 11219',
    area: 'Boro Park',
    zipCode: '11219',
    website: '',
    categories: ['grocery', 'kosher', 'supermarket', 'food'],
  },
  {
    name: "Yidel's",
    phone: '(718) 947-7403',
    address: '4921 12th Ave, Brooklyn, NY 11219',
    area: 'Boro Park',
    zipCode: '11219',
    website: 'https://www.yidels.com',
    categories: ['grocery', 'kosher', 'supermarket', 'food'],
  },
  {
    name: 'Super Savings',
    phone: '',
    address: '691 New Lots Ave, Brooklyn, NY',
    area: 'East Flatbush',
    zipCode: '11207',
    website: '',
    categories: ['grocery', 'kosher', 'supermarket', 'food'],
  },
]

async function main() {
  console.log(`Importing ${GROCERY_STORES.length} grocery stores...`)
  let created = 0
  let skipped = 0

  for (const store of GROCERY_STORES) {
    // Skip if already exists (match by name + area)
    const existing = await prisma.business.findFirst({
      where: { name: store.name, area: store.area },
    })

    if (existing) {
      console.log(`  ⏭  Already exists: ${store.name}`)
      skipped++
      continue
    }

    await prisma.business.create({
      data: {
        name: store.name,
        phone: store.phone || 'N/A',
        address: store.address,
        area: store.area,
        zipCode: store.zipCode,
        city: 'Brooklyn',
        state: 'NY',
        website: store.website || null,
        categories: store.categories,
        categoryRaw: 'Grocery / Supermarket',
        listingType: 'BUSINESS',
        status: 'FREE',
        approvalStatus: 'APPROVED',
        submittedVia: 'import',
        isActive: true,
      },
    })

    console.log(`  ✅ Created: ${store.name} (${store.area})`)
    created++
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
