#!/usr/bin/env npx tsx
// scripts/import-cert-vaad-5tfr.ts
// Imports certified establishments from Vaad Hakashrus of the Five Towns & Far Rockaway.
// Source: https://vaadhakashrus.org/establishments/
//
// The directory uses a WordPress + WilCity theme with AJAX pagination.
// Each page fetched via POST to /wp-admin/admin-ajax.php with action=establishment_search.
// Card HTML lacks per-business type tags — only name/address/phone are surfaced
// in the listing cards. Type enrichment (sushi/pizza/etc.) would require fetching
// each /listing/<slug>/ detail page; deferred for now.
//
// Run: npx tsx scripts/import-cert-vaad-5tfr.ts [--dry-run]

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const AJAX_URL = 'https://vaadhakashrus.org/wp-admin/admin-ajax.php';
const REFERER = 'https://vaadhakashrus.org/establishments/';
const CERT_TAG = 'cert:vaad-5tfr';
const DRY_RUN = process.argv.includes('--dry-run');

interface Establishment {
  name: string;
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

function parseGmapsSearchAddress(href: string): { address: string | null; city: string | null; state: string | null; zipCode: string | null } {
  // href like: https://www.google.com/maps/search/566 Central Ave, Cedarhurst, NY 11516, USA
  const m = href.match(/maps\/search\/(.+?)(?:["?#]|$)/);
  if (!m) return { address: null, city: null, state: null, zipCode: null };
  const decoded = decodeURIComponent(m[1]).replace(/\+/g, ' ').trim();
  const parts = decoded.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length < 2) return { address: decoded, city: null, state: null, zipCode: null };
  if (parts[parts.length - 1].toUpperCase() === 'USA') parts.pop();
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
  const city = parts.length >= 2 ? parts[parts.length - 1] : null;
  const street = parts.length >= 2 ? parts.slice(0, -1).join(', ') : parts[0];
  return { address: street, city, state, zipCode };
}

function parseCards(html: string): Establishment[] {
  const out: Establishment[] = [];
  // Each card is an <article class="listing_module__..."> ... </article>
  const cardRe = /<article\s+class="listing_module__[\s\S]*?<\/article>/g;
  const cards = html.match(cardRe) ?? [];
  for (const card of cards) {
    // Name: <h2 class="listing_title__..."><a ...>NAME</a></h2>
    const nameM = card.match(/listing_title__[^"]+"[^>]*><a[^>]*>([^<]+)</);
    if (!nameM) continue;
    const name = decodeHtml(nameM[1].trim());

    // Permalink (detail page)
    const linkM = card.match(/href="(https:\/\/vaadhakashrus\.org\/listing\/[^"]+)"/);
    const website = linkM ? linkM[1] : '';

    // Address: <a target="_blank" href="https://www.google.com/maps/search/..."
    const addrM = card.match(/href="(https:\/\/www\.google\.com\/maps\/search\/[^"]+)"/);
    const addrInfo = addrM ? parseGmapsSearchAddress(addrM[1]) : { address: null, city: null, state: null, zipCode: null };

    // Phone: <a href="tel:...">
    const phoneM = card.match(/<a\s+href="tel:([^"]+)"/);
    const phone = phoneM ? phoneM[1].trim() : null;

    out.push({
      name,
      address: addrInfo.address,
      city: addrInfo.city,
      state: addrInfo.state,
      zipCode: addrInfo.zipCode,
      phone,
      website,
    });
  }
  return out;
}

async function fetchPage(page: number): Promise<string> {
  const body = new URLSearchParams({
    action: 'establishment_search',
    businesstype: '',
    esktype: '',
    estitle: '',
    chks: '',
    page: String(page),
    address: '',
  });
  const res = await fetch(AJAX_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': REFERER,
      'User-Agent': 'Mozilla/5.0 (compatible; C2K-Importer/1.0)',
    },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} on page ${page}`);
  return res.text();
}

async function syncBusinesses(rows: Establishment[]) {
  const liveKeys = new Set<string>();
  const normalize = (name: string, addr: string | null) =>
    `${name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()}|${(addr ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()}`;

  let created = 0, updated = 0, skipped = 0;

  for (const r of rows) {
    const baseCategories = ['kosher', CERT_TAG];
    const key = normalize(r.name, r.address);
    liveKeys.add(key);

    const existing = await prisma.business.findFirst({
      where: {
        name: { equals: r.name, mode: 'insensitive' },
        ...(r.address ? { address: { equals: r.address, mode: 'insensitive' } } : {}),
      },
    });

    if (existing) {
      const merged = Array.from(new Set([...(existing.categories || []), ...baseCategories]));
      if (DRY_RUN) {
        console.log(`  ↻ ${r.name}: tags ${merged.join(', ')}`);
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
      area: 'Five Towns',
      zipCode: r.zipCode,
      city: r.city || 'Cedarhurst',
      state: r.state || 'NY',
      website: r.website,
      categories: baseCategories,
      categoryRaw: 'Kosher Establishment',
      listingType: 'BUSINESS' as const,
      status: 'FREE' as const,
      approvalStatus: 'APPROVED' as const,
      submittedVia: 'import:vaad-5tfr',
      isActive: true,
    };

    if (DRY_RUN) {
      console.log(`  + ${r.name} @ ${r.address ?? '<no addr>'}`);
    } else {
      await prisma.business.create({ data });
    }
    created++;
  }

  // Sync: any business currently tagged cert:vaad-5tfr but not in liveKeys → strip the tag.
  let revoked = 0;
  const tagged = await prisma.business.findMany({
    where: { categories: { has: CERT_TAG } },
  });
  for (const biz of tagged) {
    const key = normalize(biz.name, biz.address);
    if (!liveKeys.has(key)) {
      const stripped = (biz.categories || []).filter(c => c !== CERT_TAG);
      if (DRY_RUN) {
        console.log(`  ✂️  revoke ${biz.name} (no longer in Vaad 5TFR list)`);
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
  console.log(`📥 Vaad Five Towns / Far Rockaway import${DRY_RUN ? ' [DRY RUN]' : ''}`);

  const allRows: Establishment[] = [];
  for (let p = 1; p <= 30; p++) {
    const html = await fetchPage(p);
    const rows = parseCards(html);
    if (rows.length === 0) break;
    allRows.push(...rows);
    console.log(`   page ${p}: ${rows.length} cards`);
  }

  // Dedupe by website (permalink)
  const seen = new Set<string>();
  const unique = allRows.filter(r => {
    const k = r.website || `${r.name}|${r.address}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  console.log(`   ${unique.length} unique establishments`);

  const stats = await syncBusinesses(unique);
  console.log(`\n✅ Done: ${stats.created} created, ${stats.updated} updated/merged, ${stats.skipped} skipped, ${stats.revoked} revoked`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
