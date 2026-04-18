import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

// Source: Supabase (local .env.local)
const supabase = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
})

// Target: Neon (from .env.neon)
const fs = require('fs')
const neonEnv = fs.readFileSync('.env.neon', 'utf-8')
const neonUrl = neonEnv.match(/^DATABASE_URL="?([^"\n]+)/m)?.[1]
if (!neonUrl) { console.error('No Neon URL found'); process.exit(1) }

const neon = new PrismaClient({
  datasources: { db: { url: neonUrl } }
})

async function sync() {
  // 1. Push schema to Neon first
  console.log('📊 Counting source records...')
  const srcCount = await supabase.business.count()
  console.log(`   Supabase: ${srcCount} businesses`)

  const neonCount = await neon.business.count()
  console.log(`   Neon: ${neonCount} businesses`)

  if (neonCount >= srcCount) {
    console.log('✅ Neon already has all data!')
    return
  }

  // 2. Export all from Supabase
  console.log('📦 Loading all businesses from Supabase...')
  const businesses = await supabase.business.findMany()
  console.log(`   Loaded ${businesses.length} records`)

  // 3. Import to Neon in batches
  const BATCH = 500
  let imported = 0
  let skipped = 0

  // Get existing phones in Neon
  const existing = await neon.business.findMany({ select: { phone: true } })
  const existingPhones = new Set(existing.map((e: any) => e.phone))

  for (let i = 0; i < businesses.length; i += BATCH) {
    const batch = businesses.slice(i, i + BATCH)
    const toInsert = batch
      .filter(b => !existingPhones.has(b.phone))
      .map(b => ({
        name: b.name,
        phone: b.phone,
        categoryRaw: b.categoryRaw,
        categories: b.categories,
        zipCode: b.zipCode,
        area: b.area,
        city: b.city,
        state: b.state,
        address: b.address,
        email: b.email,
        website: b.website,
        fax: b.fax,
        status: b.status,
        isActive: b.isActive,
      }))

    if (toInsert.length > 0) {
      const result = await neon.business.createMany({ data: toInsert, skipDuplicates: true })
      imported += result.count
      toInsert.forEach(b => existingPhones.add(b.phone))
    }
    skipped += batch.length - toInsert.length
    console.log(`   Batch ${Math.floor(i/BATCH)+1}/${Math.ceil(businesses.length/BATCH)}: +${toInsert.length} (total: ${imported})`)
  }

  const finalCount = await neon.business.count()
  console.log(`\n✅ Done! Neon now has ${finalCount} businesses (imported ${imported}, skipped ${skipped})`)
}

sync()
  .then(() => { supabase.$disconnect(); neon.$disconnect() })
  .catch(async (e) => { console.error('❌', e.message); await supabase.$disconnect(); await neon.$disconnect() })
