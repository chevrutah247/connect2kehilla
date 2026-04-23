// Store Specials — central config + runtime read from Postgres.
//
// Architecture:
//   GitHub Actions scraper → POST /api/update-specials → Postgres (StoreSpecials)
//   Runtime (SMS handler, public API) → fetchStoreSpecials() → Postgres
//
// Fields prefixed with `source:` below are hints consumed ONLY by the scraper,
// never at runtime.

import prisma from './db';

export type StoreSource =
  | { kind: 'mcg'; apiBase: string }           // My Cloud Grocer JSON API
  | { kind: 'shopify'; collection: string }     // Shopify /collections/<h>/products.json
  | { kind: 'playwright'; url: string }         // Cloudflare-walled → headless Chrome
  | { kind: 'pdf'; watsonSlug: string }         // watsonsale.com weekly flyer PDF
  | { kind: 'none' };                           // contact-only entry, no specials

export interface Store {
  id: string;
  name: string;
  area: string;
  zips: string[];
  webUrl: string;
  address?: string;
  phone?: string;
  hours?: string;
  source: StoreSource;
}

export interface Special {
  name: string;
  price: string;
  oldPrice: string | null;
  category: string;
}

// ──────────────────────────────────────────────────────────────────────────
// STORES — single source of truth for all scraper + runtime behavior.
// ──────────────────────────────────────────────────────────────────────────

const WB_ZIPS = ['11205', '11206', '11211', '11249'];
const CH_ZIPS = ['11213', '11225', '11238'];
const BP_ZIPS = ['11204', '11219', '11218'];
const FLATBUSH_ZIPS = ['11230', '11210', '11229'];
const LAKEWOOD_ZIPS = ['08701'];

const STORES: Store[] = [
  // ── Williamsburg ──────────────────────────────────────────────────────
  { id: 'rosemary', name: 'Rosemary Kosher', area: 'Williamsburg', zips: WB_ZIPS,
    webUrl: 'https://rosemarykosher.com/Rosemary',
    source: { kind: 'mcg', apiBase: 'https://rosemarykosher.com/api' } },
  { id: 'pomppeople', name: 'Pom People', area: 'Williamsburg', zips: WB_ZIPS,
    webUrl: 'https://thepompeopleonline.com',
    source: { kind: 'none' } },
  { id: 'southside', name: 'Southside Kosher', area: 'Williamsburg', zips: WB_ZIPS,
    webUrl: 'https://www.southsidekosher.com',
    source: { kind: 'none' } },
  { id: 'gottlieb', name: "Gottlieb's Restaurant", area: 'Williamsburg', zips: WB_ZIPS,
    webUrl: 'https://gottliebrestaurant.com/order',
    source: { kind: 'none' } },
  { id: 'kosherdepot', name: 'The Kosher Depot', area: 'Williamsburg', zips: WB_ZIPS,
    webUrl: 'http://www.thekosherdepot.com',
    source: { kind: 'none' } },
  { id: 'chestnut', name: 'Chestnut Supermarket', area: 'Williamsburg', zips: WB_ZIPS,
    webUrl: 'https://chestnutsupermarket.com/sale',
    source: { kind: 'playwright', url: 'https://chestnutsupermarket.com/sale' } },
  { id: 'hatzlacha', name: 'Hatzlacha Kosher', area: 'Williamsburg', zips: WB_ZIPS,
    webUrl: 'https://www.hatzlachakosher.com/specials',
    source: { kind: 'playwright', url: 'https://www.hatzlachakosher.com/specials' } },
  { id: 'foodoo', name: 'Foodoo Kosher Supermarket', area: 'Williamsburg', zips: WB_ZIPS,
    webUrl: 'https://www.foodookosher.com/specials',
    address: '249 Wallabout St, Brooklyn, NY 11206',
    phone: '(718) 384-2000',
    hours: 'Sun–Tue 8AM–11PM • Wed–Thu 8AM–midnight • Fri 8AM until 2h before candle-lighting • Sat closed',
    source: { kind: 'playwright', url: 'https://www.foodookosher.com/specials' } },
  { id: 'satmar_wb', name: 'Satmar Meats (Williamsburg)', area: 'Williamsburg', zips: WB_ZIPS,
    webUrl: 'https://www.satmarmeatsw.com/',
    address: '823 Bedford Ave, Brooklyn, NY 11211',
    phone: '(718) 963-1100',
    hours: 'Mon–Thu 9AM–9PM • Fri 9AM–2:30PM • Sat closed • Sun 12PM–9PM',
    source: { kind: 'none' } },

  // ── Crown Heights ─────────────────────────────────────────────────────
  { id: 'koshertown', name: 'KosherTown', area: 'Crown Heights', zips: CH_ZIPS,
    webUrl: 'https://koshertown.com/brooklyn',
    source: { kind: 'mcg', apiBase: 'https://koshertown.com/api' } },
  { id: 'empire', name: 'Empire Kosher', area: 'Crown Heights', zips: CH_ZIPS,
    webUrl: 'https://empirekoshersupermarket.com/empire',
    source: { kind: 'mcg', apiBase: 'https://empirekoshersupermarket.com/api' } },
  { id: 'kosherfamily', name: 'Kosher Family', area: 'Crown Heights', zips: CH_ZIPS,
    webUrl: 'https://kosherfamily.com/Brooklyn-Crown-Heights',
    source: { kind: 'mcg', apiBase: 'https://kosherfamily.com/api' } },
  { id: 'kahans', name: "Kahan's Superette", area: 'Crown Heights', zips: CH_ZIPS,
    webUrl: 'https://www.kahanskosher.com/specials',
    address: '317 Kingston Ave, Brooklyn, NY 11213',
    phone: '(718) 756-2999',
    hours: 'Sun–Wed 7:30AM–11PM • Thu 7:30AM–midnight • Fri until 2h before Shabbos • Motzai Shabbos 1h after Shabbos–midnight',
    source: { kind: 'playwright', url: 'https://www.kahanskosher.com/specials' } },
  { id: 'kleins_ch', name: "Klein's Grocery", area: 'Crown Heights', zips: CH_ZIPS,
    webUrl: 'https://kleinsfoodmarket.com/',
    address: '504 Empire Blvd, Brooklyn, NY 11225',
    phone: '(718) 493-9045',
    hours: 'Sun 8AM–7PM • Mon–Tue 8AM–8PM • Wed 8AM–9PM • Thu 8AM–10PM • Fri 8AM–4PM • Sat closed',
    source: { kind: 'none' } },

  // ── Borough Park ──────────────────────────────────────────────────────
  { id: 'breadberry', name: 'Breadberry', area: 'Borough Park', zips: BP_ZIPS,
    webUrl: 'https://breadberry.com/Brooklyn',
    source: { kind: 'mcg', apiBase: 'https://breadberry.com/api' } },
  { id: 'three_guys', name: 'Three Guys From Brooklyn', area: 'Borough Park', zips: BP_ZIPS,
    webUrl: 'https://www.3guysfrombrooklyn.com/',
    address: '6502 Ft Hamilton Pkwy, Brooklyn, NY 11219',
    phone: '(718) 748-8340',
    hours: 'Open 24/7',
    source: { kind: 'none' } },
  { id: 'goldbergs', name: "Goldberg's Freshmarket", area: 'Borough Park', zips: BP_ZIPS,
    webUrl: 'https://watsonsale.com/supermarkets/goldbergs/',
    address: '5025 18th Ave, Brooklyn, NY 11204',
    phone: '(718) 435-7177',
    hours: 'Mon–Thu 24h • Fri midnight–3PM • Sat 9:30PM–midnight • Sun 24h',
    source: { kind: 'pdf', watsonSlug: 'goldbergs' } },
  { id: 'circus_fruits', name: 'Circus Fruits', area: 'Borough Park', zips: BP_ZIPS,
    webUrl: 'https://circusfruits.com/weekly-specials',
    address: '5915 Ft Hamilton Pkwy, Brooklyn, NY 11219',
    phone: '(718) 436-2100',
    hours: 'Open 24/7',
    source: { kind: 'pdf', watsonSlug: 'circus-fruits' } },
  { id: 'satmar_bp', name: 'Satmar Meats (Boro Park)', area: 'Borough Park', zips: BP_ZIPS,
    webUrl: 'https://satmarmeatsbp.com/collections/specials',
    address: '5301 New Utrecht Ave, Brooklyn, NY 11219',
    phone: '(718) 435-8200',
    hours: 'Mon–Wed 8AM–8:30PM • Thu 9AM–8:30PM • Fri 8AM–2PM • Sat closed • Sun 9AM–8:30PM',
    source: { kind: 'shopify', collection: 'specials' } },

  // ── Flatbush / Midwood ────────────────────────────────────────────────
  { id: 'glatt_mart', name: 'Glatt Mart', area: 'Flatbush', zips: FLATBUSH_ZIPS,
    webUrl: 'https://www.glattmart.com/',
    address: '1205 Avenue M, Brooklyn, NY 11230',
    phone: '(718) 338-4040',
    hours: 'Mon–Tue 7AM–8PM • Wed 7AM–10PM • Thu 7AM–11PM • Fri 7AM–5PM • Sat closed • Sun 8AM–7PM',
    source: { kind: 'playwright', url: 'https://www.glattmart.com/sale' } },
  { id: 'mountain_fruit', name: 'Mountain Fruit Supermarket', area: 'Flatbush', zips: FLATBUSH_ZIPS,
    webUrl: 'https://watsonsale.com/supermarkets/mountain-fruit/',
    address: '1523 Avenue M, Brooklyn, NY 11230',
    phone: '(718) 998-3333',
    hours: 'Mon–Wed 7AM–10PM • Thu 7AM–midnight • Fri 7AM–6PM • Sat closed • Sun 7AM–10PM',
    source: { kind: 'pdf', watsonSlug: 'mountain-fruit' } },
  { id: 'moishas', name: "Moisha's Discount Supermarket", area: 'Flatbush', zips: FLATBUSH_ZIPS,
    webUrl: 'https://moishas.com/specials',
    address: '325 Avenue M, Brooklyn, NY 11230',
    phone: '(718) 336-7563',
    hours: 'Sun 8AM–8PM • Mon–Tue 7AM–8PM • Wed 7AM–11PM • Thu 7AM–midnight • Fri 7AM–4PM • Sat closed',
    source: { kind: 'pdf', watsonSlug: 'moishas' } },

  // ── Lakewood, NJ ──────────────────────────────────────────────────────
  { id: 'foodex', name: 'Foodex Kosher Supermarket', area: 'Lakewood', zips: LAKEWOOD_ZIPS,
    webUrl: 'https://www.foodexsupermarket.com/specials',
    address: '407 Princeton Ave, Lakewood, NJ 08701',
    phone: '(732) 364-3300',
    hours: 'Sun–Tue 8AM–11PM • Wed 8AM–11PM • Thu 8AM–midnight • Fri 8AM–7PM • Sat closed',
    source: { kind: 'playwright', url: 'https://www.foodexsupermarket.com/specials' } },
];

// ──────────────────────────────────────────────────────────────────────────
// Lookup helpers
// ──────────────────────────────────────────────────────────────────────────

const ZIP_TO_AREA: Record<string, string> = {};
for (const store of STORES) {
  for (const zip of store.zips) {
    if (!ZIP_TO_AREA[zip]) ZIP_TO_AREA[zip] = store.area;
  }
}

export function getAreaByZip(zip: string): string | null {
  return ZIP_TO_AREA[zip] || null;
}

export function getAllStores(): Store[] {
  return STORES;
}

export function getStoreById(id: string): Store | null {
  return STORES.find(s => s.id === id) || null;
}

export function getStoresByArea(area: string): Store[] {
  return STORES.filter(s => s.area.toLowerCase() === area.toLowerCase());
}

export function getStoresByZip(zip: string): Store[] {
  return STORES.filter(s => s.zips.includes(zip));
}

export function getStoreByIndex(index: number, storeList?: Store[]): Store | null {
  const list = storeList || STORES;
  if (index < 0 || index >= list.length) return null;
  return list[index];
}

// ──────────────────────────────────────────────────────────────────────────
// Runtime: read specials from Postgres
// ──────────────────────────────────────────────────────────────────────────

const FRESHNESS_MS = {
  daily: 2 * 24 * 60 * 60 * 1000,   // 2 days — Playwright/Shopify/MCG refresh daily
  weekly: 9 * 24 * 60 * 60 * 1000,  // 9 days — PDF flyers refresh weekly
};

function freshnessFor(store: Store): number {
  return store.source.kind === 'pdf' ? FRESHNESS_MS.weekly : FRESHNESS_MS.daily;
}

// In-process memo so a single Lambda invocation doesn't re-hit Postgres per store.
const memo = new Map<string, { items: Special[]; fetchedAt: number }>();
const MEMO_TTL = 5 * 60 * 1000; // 5 min

export async function fetchStoreSpecials(store: Store): Promise<Special[]> {
  const cached = memo.get(store.id);
  if (cached && Date.now() - cached.fetchedAt < MEMO_TTL) return cached.items;

  try {
    const row = await prisma.storeSpecials.findUnique({ where: { storeId: store.id } });
    if (!row) return [];
    if (Date.now() - row.scrapedAt.getTime() > freshnessFor(store)) return [];
    const items = row.items as unknown as Special[];
    memo.set(store.id, { items, fetchedAt: Date.now() });
    return items;
  } catch {
    return [];
  }
}

export async function upsertStoreSpecials(
  storeId: string,
  items: Special[],
  opts?: { validUntil?: Date },
): Promise<void> {
  const scrapedAt = new Date();
  await prisma.storeSpecials.upsert({
    where: { storeId },
    create: { storeId, items: items as any, scrapedAt, validUntil: opts?.validUntil ?? null },
    update: { items: items as any, scrapedAt, validUntil: opts?.validUntil ?? null },
  });
  memo.delete(storeId);
}

// Kept for backward-compat with the existing Vercel cron route.
// MCG stores are now refreshed by the GitHub Actions scraper; this becomes a no-op
// that simply reports current DB status.
export async function prefetchAllSpecials(): Promise<Record<string, number>> {
  const rows = await prisma.storeSpecials.findMany();
  const out: Record<string, number> = {};
  for (const r of rows) {
    const store = getStoreById(r.storeId);
    const name = store?.name ?? r.storeId;
    out[name] = Array.isArray(r.items) ? (r.items as any[]).length : 0;
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────────
// SMS formatters
// ──────────────────────────────────────────────────────────────────────────

export function formatStoreListForSMS(storeList?: Store[], areaLabel?: string): string {
  const stores = storeList || STORES;
  const title = areaLabel ? `🏷 ${areaLabel} Stores:` : '🏷 Kosher Store Specials:';
  const lines = stores.map((s, i) => {
    const hasSpecials = s.source.kind !== 'none';
    const tag = hasSpecials ? '' : ' (info only)';
    return `${i + 1}. ${s.name}${tag}`;
  });
  return `${title}\n${lines.join('\n')}\n\nReply 1-${stores.length} to see specials`;
}

export function formatSpecialsForSMS(store: Store, specials: Special[]): string {
  const infoFooter = infoFooterFor(store);

  if (specials.length === 0) {
    const noSpecials = store.source.kind === 'none'
      ? `🏷 ${store.name}\nVisit their website:\n${store.webUrl}`
      : `🏷 ${store.name}\nNo specials available right now.`;
    return noSpecials + infoFooter + `\n\nReply SPECIALS for store list`;
  }

  const sorted = [...specials].sort((a, b) => {
    if (a.oldPrice && !b.oldPrice) return -1;
    if (!a.oldPrice && b.oldPrice) return 1;
    return 0;
  });

  const header = `🏷 ${store.name} Specials (${specials.length} items):\n\n`;
  const footer = infoFooter + `\n\nReply SPECIALS for store list`;
  const maxLen = 1500 - header.length - footer.length;

  let body = '';
  let count = 0;
  for (const s of sorted) {
    const discount = s.oldPrice ? ` (was ${s.oldPrice})` : '';
    const line = `• ${s.name} ${s.price}${discount}\n`;
    if (body.length + line.length > maxLen) break;
    body += line;
    count++;
  }
  if (count < specials.length) body += `... and ${specials.length - count} more\n`;

  return header + body.trim() + footer;
}

function infoFooterFor(store: Store): string {
  const bits: string[] = [];
  if (store.address) bits.push('A=Address');
  if (store.hours) bits.push('H=Hours');
  if (!bits.length) return '';
  return `\n\nReply ${bits.join(' • ')}`;
}

export function formatStoreInfoForSMS(store: Store, field: 'address' | 'hours'): string {
  if (field === 'address') {
    const parts = [`📍 ${store.name}`];
    if (store.address) parts.push(store.address);
    if (store.phone) parts.push(store.phone);
    if (!store.address && !store.phone) parts.push('Address on file not available.');
    return parts.join('\n') + `\n\nReply SPECIALS for store list`;
  }
  // hours
  const parts = [`🕐 ${store.name} — Hours`];
  parts.push(store.hours || 'Call store to confirm hours.');
  if (store.phone) parts.push(store.phone);
  return parts.join('\n') + `\n\nReply SPECIALS for store list`;
}
