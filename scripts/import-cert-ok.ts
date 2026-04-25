#!/usr/bin/env npx tsx
// scripts/import-cert-ok.ts
// Imports OK Kosher certified restaurants. Combines two endpoints:
//   - admin-ajax `action=load-all-restaurants` → ID + title + address (no type)
//   - wp-json `wp/v2/cpt_restaurant?per_page=100` → ID + class_list (has type taxonomy)
// Match by ID. Phone is not exposed in the API (would require scraping each
// /restaurant/<slug>/ page individually) — left null for now.
//
// Run: npx tsx scripts/import-cert-ok.ts [--dry-run]

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const AJAX_URL = 'https://www.ok.org/wp-admin/admin-ajax.php';
const REST_URL = 'https://www.ok.org/wp-json/wp/v2/cpt_restaurant?per_page=100';
const REFERER = 'https://www.ok.org/restaurant-guide/';
const CERT_TAG = 'cert:ok';
const DRY_RUN = process.argv.includes('--dry-run');

interface OkBasic {
  ID: number;
  title: string;
  restaurant_address: { title: string; url: string };
}
interface OkCpt {
  id: number;
  link: string;
  class_list: string[];
}
interface Establishment {
  id: number;
  name: string;
  rawAddress: string;
  link: string;
  types: string[];
}

function decodeHtml(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

interface ParsedAddress {
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
}

function parseAddress(raw: string): ParsedAddress {
  if (!raw) return { street: null, city: null, state: null, zipCode: null };
  const normalized = raw.replace(/\s+/g, ' ').trim();
  // "8832 W Pico Blvd, Los Angeles, CA 90035"
  const zipStateMatch = normalized.match(/\b([A-Z]{2})[ ,]+(\d{5}(?:-\d{4})?)\b/);
  const state = zipStateMatch ? zipStateMatch[1] : null;
  const zipCode = zipStateMatch ? zipStateMatch[2] : null;

  let cleanForSplit = zipStateMatch
    ? normalized.slice(0, zipStateMatch.index).replace(/[,\s]+$/, '')
    : normalized;
  cleanForSplit = cleanForSplit.replace(/[,\s]*USA[,\s]*$/i, '').trim();
  const parts = cleanForSplit.split(',').map(s => s.trim()).filter(Boolean);
  const city = parts.length >= 2 ? parts[parts.length - 1] : null;
  const street = parts.length >= 2 ? parts.slice(0, -1).join(', ') : (parts[0] ?? null);
  return { street, city, state, zipCode };
}

function typesFromClassList(classes: string[]): string[] {
  const out: string[] = [];
  for (const c of classes) {
    const m = c.match(/^ctax_restaurant_type-(.+)$/);
    if (!m) continue;
    out.push(m[1]); // e.g. "dairy", "caterer-meat", "kosher-supermarket"
  }
  return out;
}

function buildCategories(types: string[]): string[] {
  const cats = new Set<string>(['kosher', CERT_TAG]);
  for (const t of types) {
    cats.add(t);
    if (t.startsWith('caterer-')) cats.add('caterer');
    if (t === 'kosher-supermarket') { cats.add('supermarket'); cats.add('grocery'); }
    if (t === 'dairy' || t === 'meat' || t === 'pareve') cats.add(t);
  }
  return Array.from(cats);
}

function normalizeKey(name: string, address: string | null): string {
  const n = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const a = (address ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return `${n}|${a}`;
}

async function syncBusinesses(rows: Establishment[]) {
  const liveKeys = new Set<string>();
  let created = 0, updated = 0, skipped = 0;

  for (const r of rows) {
    const parsed = parseAddress(r.rawAddress);
    const key = normalizeKey(r.name, parsed.street);
    liveKeys.add(key);
    const categories = buildCategories(r.types);

    const existing = await prisma.business.findFirst({
      where: {
        name: { equals: r.name, mode: 'insensitive' },
        ...(parsed.street ? { address: { equals: parsed.street, mode: 'insensitive' } } : {}),
      },
    });

    if (existing) {
      const merged = Array.from(new Set([...(existing.categories || []), ...categories]));
      if (DRY_RUN) {
        console.log(`  ↻ ${r.name}: ${merged.join(', ')}`);
      } else {
        await prisma.business.update({
          where: { id: existing.id },
          data: { categories: merged },
        });
      }
      updated++;
      continue;
    }

    if (!parsed.street) {
      console.log(`  ⏭  skip ${r.name} (no address)`);
      skipped++;
      continue;
    }

    const data = {
      name: r.name,
      phone: 'N/A',
      address: parsed.street,
      area: parsed.city || null,
      zipCode: parsed.zipCode,
      city: parsed.city,
      state: parsed.state || 'NY',
      website: r.link,
      categories,
      categoryRaw: 'Kosher Establishment',
      listingType: 'BUSINESS' as const,
      status: 'FREE' as const,
      approvalStatus: 'APPROVED' as const,
      submittedVia: 'import:ok',
      isActive: true,
    };

    if (DRY_RUN) {
      console.log(`  + ${r.name} @ ${parsed.street}, ${parsed.city ?? '?'}, ${parsed.state ?? '?'} | types: ${r.types.join(',')}`);
    } else {
      await prisma.business.create({ data });
    }
    created++;
  }

  // Revocation
  let revoked = 0;
  const tagged = await prisma.business.findMany({
    where: { categories: { has: CERT_TAG } },
  });
  for (const biz of tagged) {
    if (!liveKeys.has(normalizeKey(biz.name, biz.address))) {
      const stripped = (biz.categories || []).filter(c => c !== CERT_TAG);
      if (DRY_RUN) {
        console.log(`  ✂️  revoke ${biz.name}`);
      } else {
        await prisma.business.update({
          where: { id: biz.id },
          data: { categories: stripped },
        });
      }
      revoked++;
    }
  }

  return { created, updated, skipped, revoked };
}

async function main() {
  console.log(`📥 OK Kosher import${DRY_RUN ? ' [DRY RUN]' : ''}`);

  // Fetch the basic list (with addresses)
  const ajaxRes = await fetch(AJAX_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': REFERER,
      'User-Agent': 'Mozilla/5.0 (compatible; C2K-Importer/1.0)',
    },
    body: new URLSearchParams({ action: 'load-all-restaurants' }).toString(),
  });
  if (!ajaxRes.ok) { console.error(`❌ AJAX HTTP ${ajaxRes.status}`); process.exit(1); }
  const ajaxJson = (await ajaxRes.json()) as { PreparedData: OkBasic[] };
  const basics = ajaxJson.PreparedData ?? [];
  console.log(`   load-all-restaurants: ${basics.length} entries`);

  // Fetch CPT records (with class_list for type taxonomy)
  const cptRes = await fetch(REST_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; C2K-Importer/1.0)' },
  });
  if (!cptRes.ok) { console.error(`❌ REST HTTP ${cptRes.status}`); process.exit(1); }
  const cptJson = (await cptRes.json()) as OkCpt[];
  console.log(`   wp/v2/cpt_restaurant: ${cptJson.length} entries`);

  const cptById = new Map<number, OkCpt>();
  for (const c of cptJson) cptById.set(c.id, c);

  const rows: Establishment[] = basics.map(b => {
    const cpt = cptById.get(b.ID);
    return {
      id: b.ID,
      name: decodeHtml(b.title),
      rawAddress: b.restaurant_address?.title ?? '',
      link: cpt?.link ?? '',
      types: cpt ? typesFromClassList(cpt.class_list) : [],
    };
  });

  const stats = await syncBusinesses(rows);
  console.log(`\n✅ Done: ${stats.created} created, ${stats.updated} updated/merged, ${stats.skipped} skipped, ${stats.revoked} revoked`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
