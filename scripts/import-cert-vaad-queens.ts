#!/usr/bin/env npx tsx
// scripts/import-cert-vaad-queens.ts
// Imports certified establishments from Vaad Harabonim of Queens directory.
// Source: https://queensvaad.org/kashrus/certified-establishments/
//
// Each card on the page is a `<div class="np-map-card">` with data-* attributes
// (data-area, data-type, data-title, data-lat/lng, data-permalink). Inside is a
// <ul> with phone (tel:), address (href to maps.google.com?q=...), and region.
//
// Strategy: fetch the single page, regex-parse each card, dedupe against
// Business by normalized name+address, attach `cert:vaad-queens` to categories.
//
// Run: npx tsx scripts/import-cert-vaad-queens.ts [--dry-run]

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SOURCE_URL = 'https://queensvaad.org/kashrus/certified-establishments/';
const CERT_TAG = 'cert:vaad-queens';
const DRY_RUN = process.argv.includes('--dry-run');

interface Establishment {
  name: string;
  area: string;
  types: string[];
  additional: string[];
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  website: string;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function parseGmapsAddress(href: string): { address: string | null; city: string | null; state: string | null; zipCode: string | null } {
  // href like: https://www.google.com/maps?q=63-34+Austin+St%2C+Queens%2C+NY+11374%2C+USA
  const m = href.match(/[?&]q=([^&"]+)/);
  if (!m) return { address: null, city: null, state: null, zipCode: null };
  const decoded = decodeURIComponent(m[1]).replace(/\+/g, ' ');
  // "63-34 Austin St, Queens, NY 11374, USA"
  const parts = decoded.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length < 2) return { address: decoded, city: null, state: null, zipCode: null };
  // Last part may be "USA"; strip it
  if (parts[parts.length - 1].toUpperCase() === 'USA') parts.pop();
  // Last remaining part: "NY 11374" or "11374"
  let state: string | null = null;
  let zipCode: string | null = null;
  const last = parts[parts.length - 1];
  const stateZip = last.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  const zipOnly = last.match(/^(\d{5}(?:-\d{4})?)$/);
  if (stateZip) {
    state = stateZip[1];
    zipCode = stateZip[2];
    parts.pop();
  } else if (zipOnly) {
    zipCode = zipOnly[1];
    parts.pop();
  }
  // Now: parts = [street, city] or just [street] depending on data
  const city = parts.length >= 2 ? parts[parts.length - 1] : null;
  const street = parts.length >= 2 ? parts.slice(0, -1).join(', ') : parts[0];
  return { address: street, city, state, zipCode };
}

function parseCards(html: string): Establishment[] {
  const out: Establishment[] = [];
  // Split on the opening of each card div — each chunk after the first contains one card.
  // Card structure: data-* attrs, then <a><h4>Name</h4></a><ul class="np-map-li">...</ul>
  // We process up to the closing </ul> of np-map-li (the only ul inside the card).
  const chunks = html.split(/<div\s+class="np-map-card"/);
  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i];
    const ulEnd = chunk.indexOf('</ul>');
    const block = ulEnd >= 0 ? chunk.slice(0, ulEnd) : chunk.slice(0, 2000);
    const attr = (name: string): string => {
      const r = new RegExp(`data-${name}="([^"]*)"`).exec(block);
      return r ? decodeHtml(r[1]) : '';
    };
    const name = attr('title');
    if (!name) continue;
    const area = attr('area');
    const typesRaw = attr('type');
    const additionalRaw = attr('additional');
    const permalink = attr('permalink');
    const types = typesRaw ? typesRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
    const additional = additionalRaw ? additionalRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    // Phone: <a href="tel:...">
    const phoneM = block.match(/<a\s+href="tel:([^"]+)"/);
    const phone = phoneM ? phoneM[1].trim() : null;

    // Address: <a href="https://www.google.com/maps?q=...">
    const addrM = block.match(/<a\s+href="(https:\/\/www\.google\.com\/maps[^"]+)"/);
    const addrInfo = addrM ? parseGmapsAddress(addrM[1]) : { address: null, city: null, state: null, zipCode: null };

    out.push({
      name,
      area: area.replace(/-/g, ' '),
      types,
      additional,
      address: addrInfo.address,
      city: addrInfo.city,
      state: addrInfo.state,
      zipCode: addrInfo.zipCode,
      phone,
      website: permalink,
    });
  }
  // Dedupe by permalink (sometimes same card appears in both map+list views)
  const seen = new Set<string>();
  return out.filter(r => {
    if (seen.has(r.website)) return false;
    seen.add(r.website);
    return true;
  });
}

function normalizeKey(name: string, address: string | null): string {
  const n = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const a = (address ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return `${n}|${a}`;
}

async function importEstablishments(rows: Establishment[]) {
  let created = 0;
  let merged = 0;
  let skipped = 0;

  for (const r of rows) {
    const baseCategories = [
      'kosher',
      ...r.types.map(t => t === 'take-out' ? 'takeout' : t),
      ...r.additional.map(a => `kashrus:${a}`),
      CERT_TAG,
    ];

    // Try exact match first by name + address
    const existing = await prisma.business.findFirst({
      where: {
        name: { equals: r.name, mode: 'insensitive' },
        ...(r.address ? { address: { equals: r.address, mode: 'insensitive' } } : {}),
      },
    });

    if (existing) {
      const merged_cats = Array.from(new Set([...(existing.categories || []), ...baseCategories]));
      if (DRY_RUN) {
        console.log(`  ↻ merge: ${r.name} (cats: ${merged_cats.join(', ')})`);
      } else {
        await prisma.business.update({
          where: { id: existing.id },
          data: { categories: merged_cats },
        });
      }
      merged++;
      continue;
    }

    // Create new business
    if (!r.phone && !r.address) {
      console.log(`  ⏭  skip ${r.name} (no phone, no address)`);
      skipped++;
      continue;
    }

    const data = {
      name: r.name,
      phone: r.phone || 'N/A',
      address: r.address,
      area: r.area || null,
      zipCode: r.zipCode,
      city: r.city || 'Queens',
      state: r.state || 'NY',
      website: r.website,
      categories: baseCategories,
      categoryRaw: 'Kosher Establishment',
      listingType: 'BUSINESS' as const,
      status: 'FREE' as const,
      approvalStatus: 'APPROVED' as const,
      submittedVia: 'import:vaad-queens',
      isActive: true,
    };

    if (DRY_RUN) {
      console.log(`  + create: ${r.name} @ ${r.address ?? '<no addr>'} | ${baseCategories.join(', ')}`);
    } else {
      await prisma.business.create({ data });
    }
    created++;
  }

  return { created, merged, skipped };
}

async function main() {
  console.log(`📥 Vaad Queens import${DRY_RUN ? ' [DRY RUN]' : ''}`);
  const res = await fetch(SOURCE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; C2K-Importer/1.0)' },
  });
  if (!res.ok) {
    console.error(`❌ HTTP ${res.status}`);
    process.exit(1);
  }
  const html = await res.text();
  const rows = parseCards(html);
  console.log(`   parsed ${rows.length} establishments`);

  const stats = await importEstablishments(rows);
  console.log(`\n✅ Done: ${stats.created} created, ${stats.merged} merged with existing, ${stats.skipped} skipped`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
