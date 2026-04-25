#!/usr/bin/env npx tsx
// scripts/import-cert-star-k.ts
// Imports Star-K certified retail establishments. Source page is fully static HTML
// at https://www.star-k.org/retail-establishments — all ~95 entries on one page,
// grouped by state (CA/CT/DC/FL/MD/MI/NJ/NY/OH/OR/PA/RI/VA).
//
// Each entry is a <div class="box" id="item-XXXX"> with:
//   <span class="name">Name</span>
//   <img alt="STAR-K"|"Star-D"> (cert variant)
//   <span class="address">Street<br>City ST 12345 USA<br></span>
//   plain phone text after address
//   <span class="desc">Restaurant Type</span>
//
// Run: npx tsx scripts/import-cert-star-k.ts [--dry-run]

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SOURCE_URL = 'https://www.star-k.org/retail-establishments';
const CERT_TAG = 'cert:star-k';
const DRY_RUN = process.argv.includes('--dry-run');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

interface Establishment {
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  desc: string | null;
  variant: string;
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

function parseAddressLines(raw: string): { address: string | null; city: string | null; state: string | null; zipCode: string | null } {
  // raw: "104 West Avenue<br>Ithaca NY 14850 USA<br>"
  if (!raw) return { address: null, city: null, state: null, zipCode: null };
  const lines = raw.split(/<br\s*\/?>/i).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (lines.length === 0) return { address: null, city: null, state: null, zipCode: null };
  const street = lines[0];
  if (lines.length === 1) return { address: street, city: null, state: null, zipCode: null };
  const cityLine = lines[1].replace(/\s+USA\s*$/i, '').trim();
  // "Ithaca NY 14850" or "Brooklyn NY 11219"
  const m = cityLine.match(/^(.+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (m) return { address: street, city: m[1].trim(), state: m[2], zipCode: m[3] };
  return { address: street, city: cityLine, state: null, zipCode: null };
}

function parseBoxes(html: string): Establishment[] {
  const out: Establishment[] = [];
  const boxRe = /<div\s+class="box"\s+id="item-[A-Z0-9]+"[\s\S]*?(?=<div\s+class="box"\s+id="item-|<\/div><\/div><\/div>)/g;
  const boxes = html.match(boxRe) ?? [];
  for (const box of boxes) {
    const nameM = box.match(/<span\s+class="name">\s*([^<]+?)\s*<\/span>/);
    if (!nameM) continue;
    const name = decodeHtml(nameM[1].trim());

    const variantM = box.match(/<img[^>]+alt="([^"]+)"/);
    const variant = variantM ? variantM[1].trim() : 'STAR-K';

    const addrM = box.match(/<span\s+class="address">([\s\S]*?)<\/span>/);
    const addrInfo = addrM ? parseAddressLines(addrM[1]) : { address: null, city: null, state: null, zipCode: null };

    // Phone: appears as raw text after the address span, e.g. "</span>718-438-2369<br>"
    const phoneM = box.match(/<\/span>\s*([\d.()\s+-]{9,20})\s*<br/);
    const phone = phoneM ? phoneM[1].replace(/\s+/g, '').trim() : null;

    const descM = box.match(/<span\s+class="desc">\s*([^<]+?)\s*<\/span>/);
    const desc = descM ? decodeHtml(descM[1].trim()) : null;

    out.push({
      name,
      address: addrInfo.address,
      city: addrInfo.city,
      state: addrInfo.state,
      zipCode: addrInfo.zipCode,
      phone,
      desc,
      variant,
    });
  }
  return out;
}

function buildCategories(r: Establishment): string[] {
  const cats: string[] = ['kosher', CERT_TAG];
  if (r.variant === 'Star-D') cats.push('cert:star-d', 'dairy');
  if (r.desc) {
    // Split on "/" or "," and convert to slugs
    for (const part of r.desc.split(/[\/,]/)) {
      const slug = part.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (slug) cats.push(slug);
    }
  }
  return Array.from(new Set(cats));
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
    const key = normalizeKey(r.name, r.address);
    liveKeys.add(key);
    const categories = buildCategories(r);

    const existing = await prisma.business.findFirst({
      where: {
        name: { equals: r.name, mode: 'insensitive' },
        ...(r.address ? { address: { equals: r.address, mode: 'insensitive' } } : {}),
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

    if (!r.phone && !r.address) {
      console.log(`  ⏭  skip ${r.name} (no phone, no address)`);
      skipped++;
      continue;
    }

    const data = {
      name: r.name,
      phone: r.phone || 'N/A',
      address: r.address,
      area: r.city || null,
      zipCode: r.zipCode,
      city: r.city,
      state: r.state || 'NY',
      website: null,
      categories,
      categoryRaw: r.desc || 'Kosher Establishment',
      listingType: 'BUSINESS' as const,
      status: 'FREE' as const,
      approvalStatus: 'APPROVED' as const,
      submittedVia: 'import:star-k',
      isActive: true,
    };

    if (DRY_RUN) {
      console.log(`  + ${r.name} @ ${r.address ?? '<no addr>'}, ${r.city ?? '?'}, ${r.state ?? '?'} (${r.desc ?? ''})`);
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
  console.log(`📥 Star-K import${DRY_RUN ? ' [DRY RUN]' : ''}`);
  const res = await fetch(SOURCE_URL, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
  });
  if (!res.ok) {
    console.error(`❌ HTTP ${res.status}`);
    process.exit(1);
  }
  const html = await res.text();
  const rows = parseBoxes(html);
  console.log(`   parsed ${rows.length} establishments`);

  const stats = await syncBusinesses(rows);
  console.log(`\n✅ Done: ${stats.created} created, ${stats.updated} updated/merged, ${stats.skipped} skipped, ${stats.revoked} revoked`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
