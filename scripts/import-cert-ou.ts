#!/usr/bin/env npx tsx
// scripts/import-cert-ou.ts
// Imports OU-certified restaurants from oukosher.org via their JSON REST API.
// Source: https://oukosher.org/wp-json/kosher-api/v1/restaurants/posts?limit=200
//
// Each post has: id, name, address (multi-line), phone, location[] (city + state),
// establishment[] (restaurant type), mdp (Dairy/Meat/Pareve), and boolean flags
// for pas_yisroel, cholov_yisroel, glatt, yoshon, passover.
//
// Run: npx tsx scripts/import-cert-ou.ts [--dry-run]

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SOURCE_URL = 'https://oukosher.org/wp-json/kosher-api/v1/restaurants/posts?limit=500';
const CERT_TAG = 'cert:ou';
const DRY_RUN = process.argv.includes('--dry-run');

interface OuPost {
  id: number;
  name: string;
  slug: string;
  url: string;
  website: string;
  address: string;
  establishment: { slug: string; name: string }[];
  location: { slug: string; name: string }[];
  geo: string;
  mdp: string;
  mdps: string[];
  phone: string;
  passover: boolean;
  pas_yisroel: boolean;
  cholov_yisroel: boolean;
  glatt: boolean;
  yoshon: boolean;
  company_terminated: string;
}

interface ParsedAddress {
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
}

function parseAddress(raw: string): ParsedAddress {
  if (!raw) return { street: null, city: null, state: null, zipCode: null };
  // Normalize: drop <br>, replace newlines with comma, collapse whitespace
  const normalized = raw
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/\r?\n/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/,\s*,+/g, ', ')
    .trim();

  // Pull out zip + state from anywhere in the string (most reliable signal).
  // US format: "NY 10128" or "NY, 10128" or "NY 10128-1234"
  const zipStateMatch = normalized.match(/\b([A-Z]{2})[ ,]+(\d{5}(?:-\d{4})?)\b/);
  // Standalone zip if no state pair
  const zipOnlyMatch = !zipStateMatch ? normalized.match(/\b(\d{5}(?:-\d{4})?)\b/) : null;
  const state = zipStateMatch ? zipStateMatch[1] : null;
  const zipCode = zipStateMatch ? zipStateMatch[2] : (zipOnlyMatch ? zipOnlyMatch[1] : null);

  // Try to split into street + city by removing the state/zip suffix and looking at last comma-segment.
  let cleanForSplit = normalized;
  if (zipStateMatch) {
    cleanForSplit = normalized.slice(0, zipStateMatch.index).replace(/[,\s]+$/, '');
  } else if (zipOnlyMatch) {
    cleanForSplit = normalized.slice(0, zipOnlyMatch.index).replace(/[,\s]+$/, '');
  }
  // Drop trailing "USA"
  cleanForSplit = cleanForSplit.replace(/[,\s]*USA[,\s]*$/i, '').trim();

  const parts = cleanForSplit.split(',').map(s => s.trim()).filter(Boolean);
  let street: string | null;
  let city: string | null;
  if (parts.length >= 2) {
    city = parts[parts.length - 1];
    street = parts.slice(0, -1).join(', ');
  } else {
    street = parts[0] ?? null;
    city = null;
  }
  return { street, city, state, zipCode };
}

function deriveArea(post: OuPost, parsed: ParsedAddress): string | null {
  // Use most specific OU location tag (e.g. "New York City - Manhattan", "Brooklyn")
  // location array often has [city/borough, state] — pick the more specific one
  if (post.location && post.location.length > 0) {
    // Prefer entries with hyphenated/compound names (more specific)
    const compound = post.location.find(l => l.name.includes('-') || l.name.includes(' '));
    if (compound) return compound.name;
    // Else use first non-state entry (state slugs like 'ny' are 2 chars)
    const nonState = post.location.find(l => l.slug.length > 2);
    if (nonState) return nonState.name;
    return post.location[0].name;
  }
  return parsed.city;
}

function buildCategories(post: OuPost): string[] {
  const cats: string[] = ['kosher', CERT_TAG];
  // mdps: ['dairy'] | ['meat'] | ['pareve']
  for (const m of post.mdps || []) {
    if (m === 'dairy' || m === 'meat' || m === 'pareve') cats.push(m);
  }
  // establishment: [{slug:'restaurant',name:'Restaurant'}, ...]
  for (const e of post.establishment || []) {
    if (e.slug) cats.push(e.slug);
  }
  // Boolean kashrus flags → kashrus:* tags
  if (post.pas_yisroel) cats.push('kashrus:pas-yisroel');
  if (post.cholov_yisroel) cats.push('kashrus:cholov-yisroel');
  if (post.glatt) cats.push('kashrus:glatt');
  if (post.yoshon) cats.push('kashrus:yoshon');
  if (post.passover) cats.push('kashrus:passover');
  return Array.from(new Set(cats));
}

function normalizeKey(name: string, address: string | null): string {
  const n = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const a = (address ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return `${n}|${a}`;
}

async function syncBusinesses(posts: OuPost[]) {
  const liveKeys = new Set<string>();
  let created = 0, updated = 0, skipped = 0;

  for (const post of posts) {
    if (post.company_terminated && post.company_terminated.toLowerCase() === 'yes') {
      // Termination flag — skip and revoke later
      continue;
    }
    const parsed = parseAddress(post.address);
    const key = normalizeKey(post.name, parsed.street);
    liveKeys.add(key);
    const categories = buildCategories(post);

    const existing = await prisma.business.findFirst({
      where: {
        name: { equals: post.name, mode: 'insensitive' },
        ...(parsed.street ? { address: { equals: parsed.street, mode: 'insensitive' } } : {}),
      },
    });

    if (existing) {
      const merged = Array.from(new Set([...(existing.categories || []), ...categories]));
      if (DRY_RUN) {
        console.log(`  ↻ ${post.name}: tags ${merged.join(', ')}`);
      } else {
        await prisma.business.update({
          where: { id: existing.id },
          data: { categories: merged },
        });
      }
      updated++;
      continue;
    }

    if (!post.phone && !parsed.street) {
      console.log(`  ⏭  skip ${post.name} (no phone, no address)`);
      skipped++;
      continue;
    }

    const data = {
      name: post.name,
      phone: post.phone || 'N/A',
      address: parsed.street,
      area: deriveArea(post, parsed),
      zipCode: parsed.zipCode,
      city: parsed.city,
      state: parsed.state || 'NY',
      website: post.website || post.url,
      categories,
      categoryRaw: 'Kosher Restaurant',
      listingType: 'BUSINESS' as const,
      status: 'FREE' as const,
      approvalStatus: 'APPROVED' as const,
      submittedVia: 'import:ou',
      isActive: true,
    };

    if (DRY_RUN) {
      console.log(`  + ${post.name} @ ${parsed.street ?? '<no addr>'}, ${parsed.city ?? '?'}, ${parsed.state ?? '?'}`);
    } else {
      await prisma.business.create({ data });
    }
    created++;
  }

  // Revocation pass: anyone tagged cert:ou that's no longer in the live list loses the tag.
  let revoked = 0;
  const tagged = await prisma.business.findMany({
    where: { categories: { has: CERT_TAG } },
  });
  for (const biz of tagged) {
    const key = normalizeKey(biz.name, biz.address);
    if (!liveKeys.has(key)) {
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
  console.log(`📥 OU restaurants import${DRY_RUN ? ' [DRY RUN]' : ''}`);
  const res = await fetch(SOURCE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; C2K-Importer/1.0)' },
  });
  if (!res.ok) {
    console.error(`❌ HTTP ${res.status}`);
    process.exit(1);
  }
  const json = (await res.json()) as { status: string; count: number; total: number; results: OuPost[] };
  console.log(`   API returned ${json.count} of ${json.total} total`);

  if (json.count < json.total) {
    console.warn(`   ⚠️  API capped response — only got ${json.count} of ${json.total}. Need pagination.`);
  }

  const stats = await syncBusinesses(json.results);
  console.log(`\n✅ Done: ${stats.created} created, ${stats.updated} updated/merged, ${stats.skipped} skipped, ${stats.revoked} revoked`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
