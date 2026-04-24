#!/usr/bin/env npx tsx
// scripts/daily-scrape.ts
// Daily scraper for kosher store specials — runs at 8am on Mac Mini
// Handles: MCG API stores, watsonsale.com PDF stores, Kahan's (browser)
// Usage: npx tsx scripts/daily-scrape.ts
// Env required: CRON_SECRET, API_URL (defaults to https://connect2kehilla.com)

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import pdfParse from 'pdf-parse';

puppeteer.use(StealthPlugin());

const API_URL = process.env.API_URL || 'https://www.connect2kehilla.com';
const SECRET = process.env.CRON_SECRET;

if (!SECRET) {
  console.error('❌ CRON_SECRET env var required');
  process.exit(1);
}

interface Special {
  name: string;
  price: string;
  oldPrice?: string | null;
  category?: string;
}

interface StorePayload {
  storeId: string;
  storeName: string;
  area?: string;
  specials: Special[];
  scrapedAt: string;
}

// ── MCG API stores ────────────────────────────────────────────────────────────

const MCG_STORES = [
  { id: 'koshertown',  name: 'KosherTown',       area: 'Crown Heights', apiBase: 'https://koshertown.com/api' },
  { id: 'empire',      name: 'Empire Kosher',     area: 'Crown Heights', apiBase: 'https://empirekoshersupermarket.com/api' },
  { id: 'kosherfamily',name: 'Kosher Family',     area: 'Crown Heights', apiBase: 'https://kosherfamily.com/api' },
  { id: 'rosemary',   name: 'Rosemary Kosher',   area: 'Williamsburg',  apiBase: 'https://rosemarykosher.com/api' },
  { id: 'mountainfruit',name:'Mountain Fruit',    area: 'Flatbush',      apiBase: 'https://shopmountainfruit.com/api' },
  { id: 'breadberry',  name: 'Breadberry',        area: 'Borough Park',  apiBase: 'https://breadberry.com/api' },
  { id: 'six60one',   name: 'Six 60 One (Kosher on Amsterdam)', area: 'Manhattan', apiBase: 'https://six60one.com/api' },
];

async function fetchMcgStore(store: typeof MCG_STORES[number]): Promise<StorePayload | null> {
  try {
    const res = await fetch(`${store.apiBase}/AjaxFilter/JsonProductsList?pageNumber=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'User-Agent': 'Mozilla/5.0 (compatible; C2K-Scraper/1.0)' },
      body: JSON.stringify([{ FilterType: 6, Value1: 1, categoryId: 0 }]),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.productsJson || data.ProductsJson || '[]';
    const products = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return {
      storeId: store.id,
      storeName: store.name,
      area: store.area,
      specials: products.map((p: any) => ({
        name: p.N || '',
        price: p.P || '',
        oldPrice: p.O || null,
        category: p.CN || '',
      })).filter((s: Special) => s.name),
      scrapedAt: new Date().toISOString(),
    };
  } catch (e) {
    console.error(`  ⚠️  MCG fetch failed for ${store.name}:`, (e as Error).message);
    return null;
  }
}

// ── watsonsale.com PDF stores ─────────────────────────────────────────────────

const WATSONSALE_STORES = [
  { id: 'moishas',          name: "Moisha's Discount",     area: 'Flatbush',     slug: 'moishas' },
  { id: 'goldbergs',        name: "Goldberg's Freshmarket", area: 'Borough Park', slug: 'goldbergs-supermarket' },
  { id: 'krm',              name: 'KRM Kollel Supermarket', area: 'Borough Park', slug: 'krm-kollel-supermarket' },
  { id: 'circus_fruits',    name: 'Circus Fruits',          area: 'Borough Park', slug: 'circus-fruits' },
  { id: 'super_13',         name: 'Super 13 Supermarket',   area: 'Borough Park', slug: 'super-13-supermarket' },
  { id: 'gourmet_glatt_bp', name: 'Gourmet Glatt (Boro Park)', area: 'Borough Park', slug: 'gourmet-glatt' },
  { id: 'kosher_palace',    name: 'Kosher Palace Supermarket', area: 'Flatbush', slug: 'kosher-palace' },
];

function parsePdfText(text: string): Special[] {
  const specials: Special[] = [];

  // Normalize: fix price decimals first (�/\uFFFD used as decimal in some PDFs), then remove leaders
  const normalized = text
    .replace(/\$(\d+)[\ufffd·\u00B7](\d{2})/g, '$$$1.$2') // $3?29 → $3.29
    .replace(/[\ufffd·•‥…\u00B7\u2022\u2026]+/g, ' ')       // leader chars → space
    .replace(/\s{3,}/g, '  ')
    .replace(/\s*lb\b/gi, '/lb')                             // normalize lb units
    .replace(/\s*oz\b/gi, '/oz');

  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Pattern: "Product Name ... $X.XX" or "Product Name $X.XX/lb"
    // Price may have unit: /lb, /pk, ea, lb, oz, etc.
    const withPrice = line.match(/^(.+?)\s+\$(\d+[\.,]\d+|\d+)\s*(?:\/?(lb|oz|pk|ea|each|kg|ct|piece|slice|unit))?(?:\s+was\s+\$(\d+[\.,]\d+))?$/i);
    if (withPrice) {
      const name = withPrice[1].replace(/\s{2,}/g, ' ').trim();
      const priceNum = withPrice[2].replace(',', '.');
      const unit = withPrice[3] ? `/${withPrice[3]}` : '';
      const oldPrice = withPrice[4] ? `$${withPrice[4].replace(',', '.')}` : null;
      if (name.length > 2 && !/^\d+$/.test(name)) {
        specials.push({ name, price: `$${priceNum}${unit}`, oldPrice });
      }
      continue;
    }

    // Pattern: product name on one line, "$X.XX" on next line
    const priceOnly = line.match(/^\$(\d+[\.,]\d+|\d+)\s*(?:\/?(lb|oz|pk|ea|each|kg|ct))?\s*$/i);
    if (priceOnly && i > 0) {
      const name = lines[i - 1].replace(/\s{2,}/g, ' ').trim();
      if (name.length > 2 && !/^\$/.test(name) && !/^\d+$/.test(name)) {
        const unit = priceOnly[2] ? `/${priceOnly[2]}` : '';
        specials.push({
          name,
          price: `$${priceOnly[1].replace(',', '.')}${unit}`,
          oldPrice: null,
        });
      }
    }
  }

  return specials;
}

async function fetchWatsonsaleStore(store: typeof WATSONSALE_STORES[number]): Promise<StorePayload | null> {
  try {
    const pageUrl = `https://watsonsale.com/supermarkets/${store.slug}/`;
    const res = await fetch(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; C2K-Scraper/1.0)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Find PDF link in page HTML
    const pdfMatch = html.match(/href="([^"]+\.pdf[^"]*)"/i);
    if (!pdfMatch) {
      console.error(`  ⚠️  No PDF found for ${store.name}`);
      return null;
    }

    let pdfUrl = pdfMatch[1];
    if (!pdfUrl.startsWith('http')) pdfUrl = `https://watsonsale.com${pdfUrl}`;

    const pdfRes = await fetch(pdfUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; C2K-Scraper/1.0)' },
      signal: AbortSignal.timeout(30000),
    });
    if (!pdfRes.ok) return null;

    const buffer = Buffer.from(await pdfRes.arrayBuffer());
    const parsed = await pdfParse(buffer);
    const specials = parsePdfText(parsed.text);

    return {
      storeId: store.id,
      storeName: store.name,
      area: store.area,
      specials,
      scrapedAt: new Date().toISOString(),
    };
  } catch (e) {
    console.error(`  ⚠️  Watsonsale fetch failed for ${store.name}:`, (e as Error).message);
    return null;
  }
}

// ── Kahan's (browser / lazy-loading) ─────────────────────────────────────────

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
];

async function findChrome(): Promise<string | undefined> {
  const { existsSync } = await import('fs');
  return CHROME_PATHS.find(p => existsSync(p));
}

async function scrapeKahans(): Promise<StorePayload | null> {
  const executablePath = await findChrome();
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    timeout: 60000,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    await page.goto('https://www.kahanskosher.com/specials', { waitUntil: 'networkidle2', timeout: 120000 });

    // Scroll to load all lazy-loaded items
    let previousHeight = 0;
    for (let i = 0; i < 20; i++) {
      const height = await page.evaluate(() => document.body.scrollHeight);
      if (height === previousHeight) break;
      previousHeight = height;
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(r => setTimeout(r, 1200));
    }

    // Extract product data — Kahan's runs on Wix, use data-hook attributes
    const specials = await page.evaluate(() => {
      const items: { name: string; price: string; oldPrice: string | null; category: string }[] = [];

      // Wix product grid items
      const cards = document.querySelectorAll('[data-hook="product-list-grid-item"]');
      cards.forEach(card => {
        const name = (card.querySelector('[data-hook="product-item-name"]') as HTMLElement)?.innerText?.trim();
        const priceEl = card.querySelector('[data-hook="product-item-price-to-pay"]') as HTMLElement;
        const price = priceEl?.innerText?.trim();
        const oldPriceEl = card.querySelector('[data-hook="product-item-strikethrough-price"]') as HTMLElement;
        const oldPrice = oldPriceEl?.innerText?.trim() || null;
        if (name && price) items.push({ name, price, oldPrice, category: '' });
      });

      return items;
    });

    // Fallback: parse page text using the regex pattern we know works
    if (specials.length < 5) {
      const text = await page.evaluate(() => document.body.innerText);
      // Pattern from parse-kahans.ts that successfully parsed 83 items
      const re = /Sale price \$([\d.]+)\s+insteadRegular price \$([\d.]+)\s+Ends at[^\n]+\n([^\n]+)/g;
      let m;
      while ((m = re.exec(text)) !== null) {
        specials.push({ name: m[3].trim(), price: `$${m[1]}`, oldPrice: `$${m[2]}`, category: '' });
      }
    }

    return {
      storeId: 'kahans',
      storeName: "Kahan's Superette",
      area: 'Crown Heights',
      specials,
      scrapedAt: new Date().toISOString(),
    };
  } catch (e) {
    console.error(`  ⚠️  Kahan's scrape failed:`, (e as Error).message);
    return null;
  } finally {
    await browser.close();
  }
}

// ── Foodoo — own API, intercept network responses ────────────────────────────

async function scrapeFoodoo(): Promise<StorePayload | null> {
  const executablePath = await findChrome();
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    timeout: 90000,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

    const allItems: any[] = [];
    page.on('response', async (resp) => {
      if (resp.url().includes('/v2/retailers') && resp.url().includes('/specials?')) {
        try {
          const json = await resp.json();
          if (json.specials?.length) allItems.push(...json.specials);
        } catch {}
      }
    });

    await page.goto('https://www.foodookosher.com/specials', { waitUntil: 'networkidle2', timeout: 90000 });

    // Scroll to trigger lazy-load pagination
    let prevH = 0, stableCount = 0;
    for (let i = 0; i < 30; i++) {
      const h = await page.evaluate(() => document.body.scrollHeight);
      if (h === prevH) { stableCount++; if (stableCount >= 3) break; } else stableCount = 0;
      prevH = h;
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(r => setTimeout(r, 1200));
    }

    // Extract name + price from Foodoo's API structure
    const seen = new Set<string>();
    const specials: Special[] = [];
    for (const s of allItems) {
      const pd = s.branch?.productsData;
      const brand = pd?.brands?.[0]?.names?.['2'] || '';
      const family = pd?.families?.[0]?.names?.['2']?.name || '';
      const name = [brand, family].filter(Boolean).join(' ') || s.description || '';
      const price = s.localDescription || s.description || '';
      const key = `${name}|${price}`;
      if (!name || !price || seen.has(key)) continue;
      seen.add(key);
      specials.push({ name, price, oldPrice: null, category: pd?.categories?.[0]?.names?.['2'] || '' });
    }

    return { storeId: 'foodoo', storeName: 'Foodoo Kosher', area: 'Williamsburg', specials, scrapedAt: new Date().toISOString() };
  } catch (e) {
    console.error(`  ⚠️  Foodoo scrape failed:`, (e as Error).message);
    return null;
  } finally {
    await browser.close();
  }
}

// ── MCG browser-based stores (Cloudflare-protected) ──────────────────────────
// Hatzlacha and Foodoo are on MCG platform but behind Cloudflare.
// We navigate with stealth browser, then parse page text — same format as Kahan's.

const MCG_BROWSER_STORES = [
  { id: 'hatzlacha', name: 'Hatzlacha Kosher',           area: 'Williamsburg', url: 'https://www.hatzlachakosher.com/specials' },
  { id: 'foodex',    name: 'Foodex Kosher Supermarket', area: 'Lakewood',     url: 'https://www.foodexsupermarket.com/specials' },
  // Foodoo has its own API — handled by scrapeFoodoo()
];

// Parse MCG text format: "Buy [NAME] for $X\nONLY $X.XX\nBuy...\nValid...\nAdd"
function parseMcgPageText(text: string): Special[] {
  const specials: Special[] = [];
  const lines = text.split('\n').map(l => l.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Detect price label: "ONLY $X.XX" or "X FOR $Y"
    const onlyMatch = line.match(/^ONLY \$([\d.]+)$/i);
    const forMatch = line.match(/^(\d+)\s+FOR\s+\$([\d.]+)$/i);

    if (onlyMatch || forMatch) {
      // Product name is on the line before (the "Buy X for $Y" line)
      const buyLine = lines[i - 1] || '';
      const nameMatch = buyLine.match(/^Buy (.+?) for \$/i);
      const name = nameMatch ? nameMatch[1].trim() : '';

      if (name && name.length > 2) {
        // Strip leading "N units " or "N pack " from name
        const cleanName = name.replace(/^\d+\s+(units?|pack)\s+/i, '');
        const price = onlyMatch
          ? `$${onlyMatch[1]}`
          : `${forMatch![1]} for $${forMatch![2]}`;
        specials.push({ name: cleanName, price, oldPrice: null, category: '' });
      }
    }
  }

  return specials;
}

async function scrapeMcgBrowserStore(store: typeof MCG_BROWSER_STORES[number]): Promise<StorePayload | null> {
  const executablePath = await findChrome();
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    timeout: 60000,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.goto(store.url, { waitUntil: 'networkidle2', timeout: 90000 });

    // Scroll until height stops growing — wait for stable height 3× in a row
    let prevHeight = 0, stableScrolls = 0;
    for (let i = 0; i < 40; i++) {
      const h = await page.evaluate(() => document.body.scrollHeight);
      if (h === prevHeight) { stableScrolls++; if (stableScrolls >= 3) break; } else stableScrolls = 0;
      prevHeight = h;
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(r => setTimeout(r, 2000));
    }

    const text = await page.evaluate(() => document.body.innerText);
    const specials = parseMcgPageText(text);

    return { storeId: store.id, storeName: store.name, area: store.area, specials, scrapedAt: new Date().toISOString() };
  } catch (e) {
    console.error(`  ⚠️  ${store.name} scrape failed:`, (e as Error).message);
    return null;
  } finally {
    await browser.close();
  }
}

// ── Shopify stores (Satmar Meats BP) ─────────────────────────────────────────
// Shopify exposes a public /collections/<handle>/products.json endpoint —
// no auth, no Cloudflare, just fetch + map.

const SHOPIFY_STORES = [
  { id: 'satmar_bp', name: 'Satmar Meats (Boro Park)', area: 'Borough Park',
    origin: 'https://satmarmeatsbp.com', collection: 'specials' },
];

async function fetchShopifyStore(store: typeof SHOPIFY_STORES[number]): Promise<StorePayload | null> {
  try {
    const url = `${store.origin}/collections/${store.collection}/products.json?limit=250`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; C2K-Scraper/1.0)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const specials: Special[] = (data.products ?? []).map((p: any) => {
      const v = (p.variants && p.variants[0]) || {};
      return {
        name: p.title ?? '',
        price: v.price ? `$${v.price}` : '',
        oldPrice: v.compare_at_price ? `$${v.compare_at_price}` : null,
        category: p.product_type ?? '',
      };
    }).filter((s: Special) => s.name && s.price);
    if (specials.length === 0) return null;
    return {
      storeId: store.id,
      storeName: store.name,
      area: store.area,
      specials,
      scrapedAt: new Date().toISOString(),
    };
  } catch (e) {
    console.error(`  ⚠️  Shopify fetch failed for ${store.name}:`, (e as Error).message);
    return null;
  }
}

// ── Upload to connect2kehilla API ─────────────────────────────────────────────

async function uploadPayloads(payloads: StorePayload[]) {
  const https = await import('https');
  const body = Buffer.from(JSON.stringify(payloads), 'utf-8');
  const url = new URL(`${API_URL}/api/update-specials`);

  return new Promise<Record<string, number>>((resolve, reject) => {
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SECRET}`,
        'Content-Length': body.byteLength,
      },
      timeout: 60000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data) as { ok: boolean; results: Record<string, number> };
          if (res.statusCode !== 200 || !json.ok) {
            reject(new Error(`Upload failed (${res.statusCode}): ${data}`));
          } else {
            resolve(json.results);
          }
        } catch {
          reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Upload timeout')); });
    req.write(body);
    req.end();
  });
}

// ── Hash cache — skip upload if specials haven't changed ─────────────────────

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const HASH_FILE = join(process.cwd(), 'data', 'specials-hashes.json');
const FORCE = process.argv.includes('--force');

function hashSpecials(specials: Special[]): string {
  const sorted = [...specials].sort((a, b) => a.name.localeCompare(b.name));
  return createHash('md5').update(JSON.stringify(sorted)).digest('hex');
}

function loadHashes(): Record<string, string> {
  try {
    return existsSync(HASH_FILE) ? JSON.parse(readFileSync(HASH_FILE, 'utf-8')) : {};
  } catch {
    return {};
  }
}

function saveHashes(hashes: Record<string, string>) {
  writeFileSync(HASH_FILE, JSON.stringify(hashes, null, 2));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n📦 Specials Scraper — ${new Date().toLocaleString()}${FORCE ? ' [--force]' : ''}`);
  console.log(`   Target: ${API_URL}\n`);

  const hashes = loadHashes();
  const scraped: StorePayload[] = [];

  // 1. MCG API stores (parallel)
  console.log('🏪 Fetching MCG API stores...');
  const mcgResults = await Promise.all(MCG_STORES.map(fetchMcgStore));
  for (const r of mcgResults) {
    if (r) { console.log(`  ✅ ${r.storeName}: ${r.specials.length} items`); scraped.push(r); }
  }

  // 2. Watsonsale PDF stores (parallel)
  console.log('\n📄 Fetching watsonsale.com PDFs...');
  const pdfResults = await Promise.all(WATSONSALE_STORES.map(fetchWatsonsaleStore));
  for (const r of pdfResults) {
    if (r) { console.log(`  ✅ ${r.storeName}: ${r.specials.length} items`); scraped.push(r); }
  }

  // 3. Kahan's (headless browser)
  console.log('\n🌐 Scraping Kahan\'s...');
  const kahans = await scrapeKahans();
  if (kahans) { console.log(`  ✅ Kahan's: ${kahans.specials.length} items`); scraped.push(kahans); }

  // 4. Cloudflare-protected MCG stores (sequential)
  console.log('\n🌐 Scraping Cloudflare-protected MCG stores...');
  for (const store of MCG_BROWSER_STORES) {
    const r = await scrapeMcgBrowserStore(store);
    if (r) { console.log(`  ✅ ${r.storeName}: ${r.specials.length} items`); scraped.push(r); }
  }

  // 5. Foodoo (own API — intercept network responses)
  console.log('\n🌐 Scraping Foodoo...');
  const foodoo = await scrapeFoodoo();
  if (foodoo) { console.log(`  ✅ Foodoo: ${foodoo.specials.length} items`); scraped.push(foodoo); }

  // 6. Shopify stores (Satmar Meats BP — parallel)
  console.log('\n🛒 Fetching Shopify stores...');
  const shopifyResults = await Promise.all(SHOPIFY_STORES.map(fetchShopifyStore));
  for (const r of shopifyResults) {
    if (r) { console.log(`  ✅ ${r.storeName}: ${r.specials.length} items`); scraped.push(r); }
  }

  if (scraped.length === 0) {
    console.log('\n⚠️  No data scraped. Nothing to upload.');
    return;
  }

  // 6. Filter: only upload stores whose data changed
  const changed: StorePayload[] = [];
  const skipped: string[] = [];
  const newHashes = { ...hashes };

  for (const payload of scraped) {
    if (payload.specials.length === 0) continue; // never overwrite with empty
    const h = hashSpecials(payload.specials);
    if (!FORCE && hashes[payload.storeId] === h) {
      skipped.push(payload.storeName);
    } else {
      newHashes[payload.storeId] = h;
      changed.push(payload);
    }
  }

  if (skipped.length > 0) {
    console.log(`\n⏭  Unchanged (skipping): ${skipped.join(', ')}`);
  }

  if (changed.length === 0) {
    console.log('✅ All specials unchanged — nothing to upload.');
    return;
  }

  console.log(`\n⬆️  Uploading ${changed.length} changed store(s)...`);
  const results = await uploadPayloads(changed);

  saveHashes(newHashes);

  console.log('\n✅ Done:');
  for (const [store, count] of Object.entries(results)) {
    console.log(`   ${store}: ${count} items`);
  }
  console.log();
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
