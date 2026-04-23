// scripts/seed-specials-direct.ts
// Reads scraped-specials.json and writes directly to Neon DB via Prisma
// Run: npx tsx scripts/seed-specials-direct.ts

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getAllStores } from '../lib/specials';

const prisma = new PrismaClient();
const stores = getAllStores();
const storeMap = new Map(stores.map(s => [s.id, s]));

interface ScrapedEntry {
  specials: { name: string; price: string; oldPrice?: string | null; category?: string }[];
  scrapedAt: string;
}

async function main() {
  const raw = readFileSync(join(process.cwd(), 'data', 'scraped-specials.json'), 'utf-8');
  const scraped: Record<string, ScrapedEntry> = JSON.parse(raw);

  const eightDays = 8 * 24 * 60 * 60 * 1000;

  for (const [storeId, entry] of Object.entries(scraped)) {
    if (!entry.specials?.length) {
      console.log(`  ⏭  ${storeId}: no specials, skipping`);
      continue;
    }

    const store = storeMap.get(storeId);
    const scrapedAt = new Date(entry.scrapedAt);
    const expiresAt = new Date(scrapedAt.getTime() + eightDays);

    await prisma.$transaction([
      prisma.storeSpecial.deleteMany({ where: { storeId } }),
      prisma.storeSpecial.createMany({
        data: entry.specials.map(s => ({
          storeId,
          storeName: store?.name ?? storeId,
          area: store?.area ?? null,
          name: s.name,
          price: s.price,
          oldPrice: s.oldPrice ?? null,
          category: s.category ?? null,
          scrapedAt,
          expiresAt,
        })),
      }),
    ]);

    console.log(`  ✅ ${store?.name ?? storeId}: ${entry.specials.length} items (expires ${expiresAt.toLocaleDateString()})`);
  }

  console.log('\nDone!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
