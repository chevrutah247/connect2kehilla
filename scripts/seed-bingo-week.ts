#!/usr/bin/env npx tsx
// scripts/seed-bingo-week.ts
// One-shot manual seed for Bingo Wholesale weekly specials (all 4 locations).
// Bingo's flyer is on Wix Documents — needs a real browser session to grab.
// Until Mac Mini puppeteer flow is built, the PDF is downloaded by hand
// (DevTools → Network → grab the *.pdf URL on /mesamchelev) and the contents
// are extracted by hand each week.
//
// Run: npx tsx scripts/seed-bingo-week.ts
//
// To update: replace SPECIALS + VALID_FROM/VALID_TO with the next week's data.

import { PrismaClient } from '@prisma/client';
import { getAllStores } from '../lib/specials';

const prisma = new PrismaClient();

// Update these every week from the new flyer:
const VALID_FROM = '2026-04-22';
const VALID_TO   = '2026-04-28';

const SPECIALS: { name: string; price: string; oldPrice: string | null; category: string }[] = [
  { name: 'Bingo 2-Seater Swing Chair (Beige or Gray)', price: '$159.99', oldPrice: null, category: 'Seasonal' },
  { name: 'Step 2 Waterpark Arcade',                    price: '$39.99',  oldPrice: null, category: 'Seasonal' },
  { name: 'Sleek Wipes Unscented 4 x 72',               price: '$5.79',   oldPrice: null, category: 'Household' },
  { name: 'Glad ForceFlex Fragrance Free 160 ct',       price: '$18.99',  oldPrice: null, category: 'Household' },
  { name: 'Gevina Blended Greek Yogurt 5.3 oz',         price: '5/$5.49', oldPrice: null, category: 'Fridge & Freezer' },
  { name: 'Holy Hummus 10 oz, Assorted',                price: '$3.29',   oldPrice: null, category: 'Fridge & Freezer' },
  { name: 'BGan French Fries Crinkle Cut 32 oz',        price: '$2.99',   oldPrice: null, category: 'Fridge & Freezer' },
  { name: 'BGan Breaded Cauliflower 24 oz',             price: '$7.99',   oldPrice: null, category: 'Fridge & Freezer' },
  { name: 'Mount Ridge Pizza Bagels 22.8 oz',           price: '$9.99',   oldPrice: null, category: 'Fridge & Freezer' },
  { name: 'Coca Cola Israeli Coke 1.5 lt 6 pk',         price: '$13.99',  oldPrice: null, category: 'Pantry & Snacks' },
  { name: 'Polar Variety Seltzer 30 x 12 oz',           price: '$11.49',  oldPrice: null, category: 'Pantry & Snacks' },
  { name: 'Paskesz Sour Belts 4 oz, Assorted',          price: '2/$4',    oldPrice: null, category: 'Pantry & Snacks' },
  { name: 'Beigel Cracker Crisps Sour Cream & Onion 10.6 oz', price: '$3.29', oldPrice: null, category: 'Pantry & Snacks' },
  { name: 'Oreo Cookies 4 pk',                          price: '$8.49',   oldPrice: null, category: 'Pantry & Snacks' },
  { name: 'Ritz Crackers Original 200 gr',              price: '$2.59',   oldPrice: null, category: 'Pantry & Snacks' },
  { name: 'BluPantry Egg Noodles Fine or Medium 12 oz', price: '2/$3.29', oldPrice: null, category: 'Pantry & Snacks' },
  { name: 'Elite Potato Chips 1.76 oz, Assorted',       price: '4/$2.99', oldPrice: null, category: 'Pantry & Snacks' },
  { name: 'Beit Hashita Cucumbers In Brine Small 13-17 19.8 oz', price: '2/$5', oldPrice: null, category: 'Pantry & Snacks' },
  { name: 'Bnei Darom Cucumbers In Brine Mini 29 oz',   price: '$3.49',   oldPrice: null, category: 'Pantry & Snacks' },
  { name: 'Gefen Ramen Noodles Chicken or Vegetable 3 oz', price: '6/$3.29', oldPrice: null, category: 'Pantry & Snacks' },
  { name: "Lieber's Matzoh Ball Mix 4.5 oz",            price: '3/$3.29', oldPrice: null, category: 'Pantry & Snacks' },
  { name: 'Kravy Dip Dip Cracker 6 oz, Assorted',       price: '$2.99',   oldPrice: null, category: 'Pantry & Snacks' },
  { name: 'Made Good Granola Bars 5.1 oz',              price: '$3.29',   oldPrice: null, category: 'Pantry & Snacks' },
  { name: 'Osem Bissli BBQ/Onion/Pizza Case of 48',     price: '$21.99',  oldPrice: null, category: 'Pantry & Snacks' },
  { name: "Bloom's Pretzels Mini 15 oz, 30 pk",         price: '$4.99',   oldPrice: null, category: 'Pantry & Snacks' },
  { name: 'Heimish Long Kokosh Chocolate or Cinnamon',  price: '$11.99',  oldPrice: null, category: 'Bakery' },
  { name: 'KJ Family Chicken Franks 24 oz',             price: '$5.69',   oldPrice: null, category: 'Meat & Deli' },
  { name: 'KJ Sliced Smoked Turkey Breast 6 oz',        price: '$4.59',   oldPrice: null, category: 'Meat & Deli' },
  { name: 'Cubed Pineapple',                            price: '$2.49/lb',oldPrice: null, category: 'Produce' },
  { name: 'Clementines 3 lb bag',                       price: '$4.99',   oldPrice: null, category: 'Produce' },
  { name: 'Grape Tomatoes',                             price: '2/$4.99', oldPrice: null, category: 'Produce' },
  { name: 'Hot House Cucumbers',                        price: '4/$2.99', oldPrice: null, category: 'Produce' },
];

const BINGO_STORE_IDS = ['bingo_bp', 'bingo_lw', 'bingo_msy', 'bingo_inwood'];

async function main() {
  const stores = new Map(getAllStores().map(s => [s.id, s]));
  const scrapedAt = new Date(`${VALID_FROM}T00:00:00`);
  const expiresAt = new Date(`${VALID_TO}T23:59:59`);

  for (const storeId of BINGO_STORE_IDS) {
    const store = stores.get(storeId);
    if (!store) {
      console.error(`  ❌ ${storeId} not found in lib/specials.ts`);
      continue;
    }
    await prisma.$transaction([
      prisma.storeSpecial.deleteMany({ where: { storeId } }),
      prisma.storeSpecial.createMany({
        data: SPECIALS.map(s => ({
          storeId,
          storeName: store.name,
          area: store.area,
          name: s.name,
          price: s.price,
          oldPrice: s.oldPrice,
          category: s.category,
          scrapedAt,
          expiresAt,
        })),
      }),
    ]);
    console.log(`  ✅ ${store.name}: ${SPECIALS.length} items (valid ${VALID_FROM} → ${VALID_TO})`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
