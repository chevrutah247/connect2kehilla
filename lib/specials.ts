// Store Specials — MCG (My Cloud Grocer) API + scraped data

import { readFileSync } from 'fs';
import { join } from 'path';

export interface Store {
  id: string;
  name: string;
  apiBase: string | null; // null = no API access
  scrapeUrl?: string;     // URL to scrape via browser (for non-API stores)
  webUrl: string;
  area: string;
  zips: string[]; // ZIP codes for this area
}

export interface Special {
  name: string;
  price: string;
  oldPrice: string | null;
  category: string;
}

// All stores with area/ZIP mapping
const STORES: Store[] = [
  // Williamsburg
  { id: 'rosemary', name: 'Rosemary Kosher', apiBase: 'https://rosemarykosher.com/api', webUrl: 'https://rosemarykosher.com/Rosemary', area: 'Williamsburg', zips: ['11205', '11206', '11211', '11249'] },
  { id: 'pomppeople', name: 'Pom People', apiBase: null, webUrl: 'https://thepompeopleonline.com', area: 'Williamsburg', zips: ['11205', '11206', '11211', '11249'] },
  { id: 'southside', name: 'Southside Kosher', apiBase: null, webUrl: 'https://www.southsidekosher.com', area: 'Williamsburg', zips: ['11205', '11206', '11211', '11249'] },
  { id: 'gottlieb', name: "Gottlieb's Restaurant", apiBase: null, webUrl: 'https://gottliebrestaurant.com/order', area: 'Williamsburg', zips: ['11205', '11206', '11211', '11249'] },
  { id: 'kosherdepot', name: 'The Kosher Depot', apiBase: null, webUrl: 'http://www.thekosherdepot.com', area: 'Williamsburg', zips: ['11205', '11206', '11211', '11249'] },
  { id: 'chestnut', name: 'Chestnut Supermarket', apiBase: null, scrapeUrl: 'https://chestnutsupermarket.com/sale', webUrl: 'https://chestnutsupermarket.com/sale', area: 'Williamsburg', zips: ['11205', '11206', '11211', '11249'] },
  { id: 'hatzlacha', name: 'Hatzlacha Kosher', apiBase: null, scrapeUrl: 'https://www.hatzlachakosher.com/specials', webUrl: 'https://www.hatzlachakosher.com/specials', area: 'Williamsburg', zips: ['11205', '11206', '11211', '11249'] },
  // Crown Heights
  { id: 'koshertown', name: 'KosherTown', apiBase: 'https://koshertown.com/api', webUrl: 'https://koshertown.com/brooklyn', area: 'Crown Heights', zips: ['11213', '11225', '11238'] },
  { id: 'empire', name: 'Empire Kosher', apiBase: 'https://empirekoshersupermarket.com/api', webUrl: 'https://empirekoshersupermarket.com/empire', area: 'Crown Heights', zips: ['11213', '11225', '11238'] },
  { id: 'kosherfamily', name: 'Kosher Family', apiBase: 'https://kosherfamily.com/api', webUrl: 'https://kosherfamily.com/Brooklyn-Crown-Heights', area: 'Crown Heights', zips: ['11213', '11225', '11238'] },
  // Borough Park
  { id: 'breadberry', name: 'Breadberry', apiBase: 'https://breadberry.com/api', webUrl: 'https://breadberry.com/Brooklyn', area: 'Borough Park', zips: ['11204', '11219', '11218', '11230'] },
  // Five Towns
  { id: 'kahans', name: "Kahan's Kosher", apiBase: null, scrapeUrl: 'https://www.kahanskosher.com/specials', webUrl: 'https://www.kahanskosher.com/specials', area: 'Five Towns', zips: ['11516', '11559', '11598'] },
];

// ZIP → area name mapping (for quick lookup)
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

export function formatStoreListForSMS(storeList?: Store[], areaLabel?: string): string {
  const stores = storeList || STORES;
  const title = areaLabel ? `🏷 ${areaLabel} Stores:` : '🏷 Kosher Store Specials:';
  const lines = stores.map((s, i) => {
    const hasData = s.apiBase || (s.scrapeUrl && getScrapedSpecials(s.id));
    const tag = hasData ? '' : ' (website only)';
    return `${i + 1}. ${s.name}${tag}`;
  });
  return `${title}\n${lines.join('\n')}\n\nReply 1-${stores.length} to see specials`;
}

// ── Scraped specials (from JSON file, updated weekly via browser) ──
const SCRAPED_MAX_AGE = 8 * 24 * 60 * 60 * 1000; // 8 days
let scrapedCache: Record<string, { specials: Special[]; scrapedAt: string }> | null = null;

export function loadScrapedSpecials(): Record<string, { specials: Special[]; scrapedAt: string }> {
  if (scrapedCache) return scrapedCache;
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'scraped-specials.json'), 'utf-8');
    scrapedCache = JSON.parse(raw);
    return scrapedCache!;
  } catch {
    return {};
  }
}

export function getScrapedSpecials(storeId: string): Special[] | null {
  const scraped = loadScrapedSpecials();
  const entry = scraped[storeId];
  if (!entry || !entry.specials?.length) return null;
  if (Date.now() - new Date(entry.scrapedAt).getTime() > SCRAPED_MAX_AGE) return null;
  return entry.specials;
}

// Force reload from disk (call after scraping new data)
export function invalidateScrapedCache(): void {
  scrapedCache = null;
}

// ── Specials Cache (fetched once, served all day) ──
const specialsCache = new Map<string, { specials: Special[]; fetchedAt: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

async function fetchFromAPI(store: Store): Promise<Special[]> {
  try {
    const res = await fetch(`${store.apiBase}/AjaxFilter/JsonProductsList?pageNumber=1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'Mozilla/5.0 (compatible; Connect2Kehilla/1.0)',
      },
      body: JSON.stringify([{ FilterType: 6, Value1: 1, categoryId: 0 }]),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const raw = data.productsJson || data.ProductsJson || '[]';
    const products = typeof raw === 'string' ? JSON.parse(raw) : raw;

    return products.map((p: any) => ({
      name: p.N || '',
      price: p.P || '',
      oldPrice: p.O || null,
      category: p.CN || '',
    }));
  } catch {
    return [];
  }
}

export async function fetchStoreSpecials(store: Store): Promise<Special[]> {
  // For non-API stores, try scraped data
  if (!store.apiBase) {
    if (store.scrapeUrl) {
      return getScrapedSpecials(store.id) || [];
    }
    return [];
  }

  // Check cache first
  const cached = specialsCache.get(store.id);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.specials;
  }

  // Fetch fresh and cache
  const specials = await fetchFromAPI(store);
  if (specials.length > 0) {
    specialsCache.set(store.id, { specials, fetchedAt: Date.now() });
  }
  return specials;
}

// Pre-fetch all MCG stores (call from cron or on first request)
export async function prefetchAllSpecials(): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  const mcgStores = STORES.filter(s => s.apiBase);

  await Promise.all(mcgStores.map(async (store) => {
    const specials = await fetchFromAPI(store);
    if (specials.length > 0) {
      specialsCache.set(store.id, { specials, fetchedAt: Date.now() });
    }
    results[store.name] = specials.length;
  }));

  return results;
}

export function formatSpecialsForSMS(store: Store, specials: Special[]): string {
  if (specials.length === 0) {
    if (!store.apiBase && store.webUrl) {
      return `🏷 ${store.name}\nVisit their website for specials:\n${store.webUrl}\n\nReply SPECIALS for store list`;
    }
    return `🏷 ${store.name}\nNo specials available right now.\n\nReply SPECIALS for store list`;
  }

  // Sort by discount (items with oldPrice first)
  const sorted = [...specials].sort((a, b) => {
    if (a.oldPrice && !b.oldPrice) return -1;
    if (!a.oldPrice && b.oldPrice) return 1;
    return 0;
  });

  const header = `🏷 ${store.name} Specials (${specials.length} items):\n\n`;
  const footer = `\n\nReply SPECIALS for store list`;
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

  if (count < specials.length) {
    body += `... and ${specials.length - count} more\n`;
  }

  return header + body.trim() + footer;
}
