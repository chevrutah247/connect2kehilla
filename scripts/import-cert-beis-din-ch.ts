#!/usr/bin/env npx tsx
// scripts/import-cert-beis-din-ch.ts
// Imports CHK (Crown Heights Kashrus / Beis Din of Crown Heights) certified
// establishments. The CHK list is published as a printed image at
// https://www.vaadhakohol.org/announcements/list-of-establishments-under-chk-supervision-summer-5785
// — there is no JSON/HTML directory. The names below were transcribed from
// the Summer 5785 image (1080×1080 at the source; partial list per CHK's
// own footnote).
//
// Strategy: name-based merge against existing Business records (case-
// insensitive, restricted to NY area). For unmatched names, log only —
// don't create empty rows, since CHK provides no address/phone. The user
// can fill in details later.
//
// Run: npx tsx scripts/import-cert-beis-din-ch.ts [--dry-run]
// Re-run weekly — sync-mode strips cert:beis-din-ch from any business
// no longer on the list.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CERT_TAG = 'cert:beis-din-ch';
const DRY_RUN = process.argv.includes('--dry-run');

interface CertEntry {
  name: string;
  category: string; // 'eatery' | 'bakery' | 'caterer' | 'dairy' | 'meat' | 'other'
  notes?: string;
}

// Source: vaadhakohol.org Summer 5785 list image, transcribed 2026-04-25.
const ENTRIES: CertEntry[] = [
  // Eateries and Takeout (Crown Heights)
  { name: 'Albany Bake Shop', category: 'eatery' },
  { name: 'Almah Cafe', category: 'eatery', notes: 'Albany Ave + Dean Ave locations' },
  { name: 'Boeuf & Bun', category: 'eatery' },
  { name: 'Bread and Dairy', category: 'eatery' },
  { name: 'Brooklyn Artisan Bakehouse', category: 'eatery' },
  { name: 'Butcher Grill House', category: 'eatery' },
  { name: 'Chocolatte', category: 'eatery' },
  { name: 'Crown Heights Mozzarella', category: 'eatery' },
  { name: 'Holesome Bagels', category: 'eatery' },
  { name: 'Holy Schnitzel', category: 'eatery' },
  { name: 'House of Glatt', category: 'eatery' },
  { name: "Joseph's Dream Burger", category: 'eatery' },
  { name: 'Kalf Kafe', category: 'eatery', notes: 'Borough Park' },
  { name: 'Kava 33', category: 'eatery', notes: 'Kingston PA' },
  { name: 'Kingston Bake Shop', category: 'eatery' },
  { name: 'Kingston Kosher Pizza', category: 'eatery' },
  { name: 'Koshertown', category: 'eatery', notes: 'Empire Blvd + Rutland Rd' },
  { name: 'Machne Yehuda', category: 'eatery' },
  { name: 'Malka Takeout', category: 'eatery' },
  { name: "Mendy's at JCM", category: 'eatery' },
  { name: "Mermelstein's", category: 'eatery' },
  { name: 'Noribar', category: 'eatery' },
  { name: 'Pita Point', category: 'eatery' },
  { name: 'Pizza Heights', category: 'eatery' },
  { name: 'Prime Avenue', category: 'eatery' },
  { name: 'Ricotta Cafe', category: 'eatery' },
  { name: 'Roll Masters', category: 'eatery', notes: 'In The Market Place only' },
  { name: 'Shabbos Fish Market', category: 'eatery' },
  { name: 'Sushi Spot', category: 'eatery' },
  { name: 'Sweet Expression', category: 'eatery', notes: 'Kingston Ave + Troy Ave' },
  { name: 'The Market Place', category: 'eatery', notes: 'Meat & pareve' },
  // Bakeries
  { name: "Avraham's Bakery", category: 'bakery' },
  { name: "Beigel's Bakery", category: 'bakery' },
  { name: 'Lubavitch Matzah Bakery', category: 'bakery', notes: 'Tenenbaum' },
  { name: 'Matzah.Biz', category: 'bakery', notes: 'Badatz Matzah' },
  { name: 'Royal Donuts', category: 'bakery' },
  { name: "Stern's Bakery", category: 'bakery' },
  { name: 'Weiss Bakery', category: 'bakery' },
  // Caterers & Halls (Crown Heights)
  { name: 'Ben Kohen Caterer', category: 'caterer' },
  { name: 'Crown Catering', category: 'caterer' },
  { name: 'Eshel', category: 'caterer', notes: 'Meat & dairy' },
  { name: 'Oholei Torah Ballroom', category: 'caterer' },
  { name: 'Razag Caterer & Hall', category: 'caterer' },
  { name: 'Table One', category: 'caterer', notes: 'Feigensen' },
  { name: 'Turk Caterers', category: 'caterer' },
  // Dairy Products (manufacturers)
  { name: 'Best Value', category: 'dairy', notes: 'Fresh & Healthy / Milan / Slim-U' },
  { name: 'Cravings', category: 'dairy' },
  { name: 'Dairy Deluxe', category: 'dairy' },
  { name: 'Devash Farms', category: 'dairy' },
  { name: 'Givat', category: 'dairy' },
  { name: 'The Smart Brand', category: 'dairy' },
  // Meat Products
  { name: '770 Glatt', category: 'meat' },
  { name: 'CH Butcher', category: 'meat' },
  { name: 'David Elliot', category: 'meat' },
  { name: 'Generation 7', category: 'meat' },
  { name: "L'Chaim Kosher Distributors", category: 'meat' },
  { name: 'Rubashkin Meat Store', category: 'meat', notes: 'Borough Park' },
  { name: 'Southern Kosher Meat', category: 'meat' },
  { name: "Yossi's Cut", category: 'meat', notes: 'Empire Kosher / The Market Place' },
  // Other
  { name: 'Bat-Yam', category: 'other' },
  { name: 'Mazon Gourmet', category: 'other' },
  { name: 'Farbrengen Wine', category: 'other' },
  { name: 'Kesser Wine', category: 'other' },
];

function categoryTags(c: string): string[] {
  switch (c) {
    case 'eatery':  return ['kosher', 'restaurant', 'takeout'];
    case 'bakery':  return ['kosher', 'bakery'];
    case 'caterer': return ['kosher', 'caterer', 'events'];
    case 'dairy':   return ['kosher', 'dairy', 'food-manufacturer'];
    case 'meat':    return ['kosher', 'meat', 'butcher'];
    case 'other':   return ['kosher'];
    default:        return ['kosher'];
  }
}

function normalizeName(n: string): string {
  return n.toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function syncBusinesses() {
  let matched = 0, ambiguous: { entry: string; candidates: string[] }[] = [];
  let unmatched: string[] = [];
  const liveKeys = new Set<string>();

  for (const e of ENTRIES) {
    const tags = [...categoryTags(e.category), CERT_TAG];
    const normalized = normalizeName(e.name);
    liveKeys.add(normalized);

    // Search by name across all active businesses; prefer Crown Heights ZIP matches.
    const all = await prisma.business.findMany({
      where: {
        name: { contains: e.name, mode: 'insensitive' },
        isActive: true,
      },
      take: 10,
    });
    const exactByName = all.filter(c => normalizeName(c.name) === normalized);
    const chZips = ['11213', '11225', '11238'];

    if (exactByName.length === 0) {
      // No exact match — create cert-tracking stub but mark isActive=false so it
      // never surfaces in SMS searches. User fills in address/phone via admin,
      // then flips isActive=true at that point.
      const data = {
        name: e.name,
        phone: 'N/A',
        address: null,
        area: 'Crown Heights',
        zipCode: null,
        city: 'Brooklyn',
        state: 'NY',
        website: null,
        categories: [...tags, 'cert-only-stub'],
        categoryRaw: e.notes ? `${e.category} (${e.notes})` : e.category,
        listingType: 'BUSINESS' as const,
        status: 'FREE' as const,
        approvalStatus: 'APPROVED' as const,
        submittedVia: 'import:beis-din-ch',
        isActive: false,
      };
      if (DRY_RUN) {
        console.log(`  + ${e.name}  (inactive stub — cert tracked, hidden from SMS until enriched)`);
      } else {
        await prisma.business.create({ data });
      }
      unmatched.push(e.name);
      continue;
    }

    // Prefer CH-zip match if any; else if single match exists, take it; else ambiguous.
    const chMatch = exactByName.find(c => c.zipCode && chZips.includes(c.zipCode));
    if (chMatch) {
      const merged = Array.from(new Set([...(chMatch.categories || []), ...tags]));
      if (DRY_RUN) {
        console.log(`  ↻ ${e.name}  →  "${chMatch.name}" @ ${chMatch.address ?? '?'} (CH match)`);
      } else {
        await prisma.business.update({
          where: { id: chMatch.id },
          data: { categories: merged },
        });
      }
      matched++;
      continue;
    }

    if (exactByName.length === 1) {
      // Single match outside CH — tag it but flag for review.
      const m = exactByName[0];
      const merged = Array.from(new Set([...(m.categories || []), ...tags]));
      if (DRY_RUN) {
        console.log(`  ↻ ${e.name}  →  "${m.name}" @ ${m.address ?? '?'} (single match outside CH zips — verify)`);
      } else {
        await prisma.business.update({
          where: { id: m.id },
          data: { categories: merged },
        });
      }
      matched++;
      continue;
    }

    // Multiple non-CH matches — ambiguous, skip and report.
    ambiguous.push({
      entry: e.name,
      candidates: exactByName.map(c => `${c.name} @ ${c.address ?? '?'} [${c.zipCode ?? '?'}]`),
    });
    if (DRY_RUN) {
      console.log(`  ⚠️  ${e.name}: ${exactByName.length} matches, none in CH zips — manual review`);
    }
  }

  // Revocation: any business currently tagged cert:beis-din-ch but not in this list loses the tag
  let revoked = 0;
  const tagged = await prisma.business.findMany({
    where: { categories: { has: CERT_TAG } },
  });
  for (const biz of tagged) {
    if (!liveKeys.has(normalizeName(biz.name))) {
      const stripped = (biz.categories || []).filter(c => c !== CERT_TAG);
      if (DRY_RUN) {
        console.log(`  \u2702\ufe0f  revoke ${biz.name}`);
      } else {
        await prisma.business.update({
          where: { id: biz.id },
          data: { categories: stripped },
        });
      }
      revoked++;
    }
  }

  return { matched, revoked, unmatched, ambiguous };
}

async function main() {
  console.log(`📥 Beis Din of Crown Heights (CHK) import${DRY_RUN ? ' [DRY RUN]' : ''}`);
  console.log(`   ${ENTRIES.length} entries from Summer 5785 list`);
  const stats = await syncBusinesses();
  console.log(`\n✅ Done: ${stats.matched} matched & tagged, ${stats.unmatched.length} inactive stubs created (admin-only), ${stats.revoked} revoked`);
  if (stats.ambiguous.length > 0) {
    console.log(`\n   ⚠️  Ambiguous (${stats.ambiguous.length}) — multiple matches outside CH, manually pick the right one:`);
    for (const a of stats.ambiguous) {
      console.log(`     • ${a.entry}`);
      for (const c of a.candidates) console.log(`         - ${c}`);
    }
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
