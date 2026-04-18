// Import all Chabad Nearby centers extracted from screenshots
// Only imports centers that don't already exist by name
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

interface Center {
  name: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  distance?: string
}

// ZIP → Area mapping
const ZIP_TO_AREA: Record<string, string> = {
  '11211': 'Williamsburg', '11249': 'Williamsburg', '11206': 'Williamsburg', '11205': 'Williamsburg',
  '11219': 'Borough Park', '11204': 'Borough Park', '11218': 'Borough Park',
  '11230': 'Flatbush', '11210': 'Flatbush',
  '11213': 'Crown Heights', '11225': 'Crown Heights', '11203': 'Crown Heights',
  '10952': 'Monsey', '10977': 'Spring Valley', '10950': 'Monroe',
  '11235': 'Sheepshead Bay', '11415': 'Kew Gardens', '11362': 'Little Neck',
  '11362-1': 'Little Neck', '11214': 'Bensonhurst', '11220': 'Bay Ridge',
  '11201': 'Brooklyn Heights', '11222': 'Greenpoint', '11237': 'Bushwick',
  '11234': 'Mill Basin', '11216': 'Prospect Heights', '11238': 'Prospect Heights',
  '11215': 'Park Slope', '11218-1': 'Ditmas Park',
  '10001': 'New York', '10002': 'Lower East Side', '10003': 'East Village',
  '10007': 'Tribeca', '10011': 'Chelsea', '10014': 'West Village',
  '10023': 'Upper West Side', '10026': 'Harlem', '10033': 'Washington Heights',
  '10038': 'Financial District', '10075': 'Upper East Side',
  '10451': 'South Bronx', '10463': 'Kingsbridge',
  '07030': 'Hoboken', '07055': 'Passaic', '07631': 'Englewood',
  '07652': 'Paramus', '07670': 'Tenafly', '07628': 'Dumont',
  '07052': 'West Orange', '10307': 'Staten Island',
  '11550': 'Hempstead', '11566': 'Merrick', '11577': 'Roslyn Heights',
  '11579': 'Sea Cliff', '11598': 'Woodmere', '11021': 'Great Neck',
}

// Classify center type from name
function classifyCenter(name: string): { categoryRaw: string; categories: string[] } {
  const lower = name.toLowerCase()
  if (/school|preschool|day school|academy|learning center|institute|hebrew school|cheder|yeshiva|gan|early childhood/.test(lower)) {
    return { categoryRaw: 'Education', categories: ['education', 'chabad_organization'] }
  }
  if (/camp/.test(lower)) {
    return { categoryRaw: 'Camp', categories: ['camp', 'youth', 'chabad_organization'] }
  }
  if (/library/.test(lower)) {
    return { categoryRaw: 'Library', categories: ['library', 'chabad_organization'] }
  }
  if (/food bank|brit milah|circumcision/.test(lower)) {
    return { categoryRaw: 'Chesed', categories: ['chesed', 'chabad_organization'] }
  }
  if (/cteen|young professional|youth|minyan|jgrad|hunter|baruch|fordham|cumc|columbia|college|university/.test(lower)) {
    return { categoryRaw: 'Chabad Center', categories: ['chabad_center', 'youth', 'education'] }
  }
  if (/friendship circle|friends of lubavitch/.test(lower)) {
    return { categoryRaw: 'Chesed', categories: ['chesed', 'chabad_organization'] }
  }
  // Default: Chabad center with synagogue
  return { categoryRaw: 'Chabad Center', categories: ['chabad_center', 'synagogue', 'shul'] }
}

async function main() {
  const centers: Center[] = JSON.parse(
    fs.readFileSync('/Users/admin/Documents/ПАРНОСА/connect2kehilla/chabad_nearby_missing.json', 'utf-8')
  )

  let added = 0
  let skipped = 0

  for (const c of centers) {
    // Check if already exists by exact name match
    const existing = await prisma.business.findFirst({
      where: { name: { equals: c.name, mode: 'insensitive' } }
    })
    if (existing) {
      skipped++
      continue
    }

    const { categoryRaw, categories } = classifyCenter(c.name)
    const area = c.zipCode ? ZIP_TO_AREA[c.zipCode] || null : null
    const city = c.city || (c.state === 'NY' || !c.state ? 'Brooklyn' : null)
    const state = c.state || 'NY'

    await prisma.business.create({
      data: {
        name: c.name,
        phone: '', // will fill via Google search later
        address: c.address || '',
        city: city,
        state: state.length <= 2 ? state : 'NY',
        zipCode: c.zipCode || null,
        area: area,
        categoryRaw: categoryRaw,
        categories: categories,
      } as any
    })
    added++
    console.log(`  Added: ${c.name}`)
  }

  const total = await prisma.business.count()
  console.log(`\n✅ Added ${added}, skipped ${skipped}. Total: ${total}`)
  await prisma.$disconnect()
}

main()
