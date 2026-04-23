#!/usr/bin/env npx tsx
// scripts/daily-scrape.ts
// Daily scraper for kosher store specials — runs at 8am on Mac Mini
// Handles: MCG API stores, watsonsale.com PDF stores, Kahan's (browser)
// Usage: npx tsx scripts/daily-scrape.ts
// Env required: CRON_SECRET, API_URL (defaults to https://connect2kehilla.com)

import puppeteer from 'puppeteer';
import pdfParse from 'pdf-parse';

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
  { id: 'moishas',   name: "Moisha's Discount",     area: 'Flatbush',     slug: 'moishas' },
  { id: 'goldbergs', name: "Goldberg's Freshmarket", area: 'Borough Park', slug: 'goldbergs-supermarket' },
  { id: 'krm',       name: 'KRM Kollel Supermarket', area: 'Borough Park', slug: 'krm-kollel-supermarket' },
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
    await page.goto('https://www.kahanskosher.com/specials', { waitUntil: 'networkidle2', timeout: 60000 });

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

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n📦 Daily Specials Scraper — ${new Date().toLocaleString()}`);
  console.log(`   Target: ${API_URL}\n`);

  const payloads: StorePayload[] = [];

  // 1. MCG API stores (run in parallel)
  console.log('🏪 Fetching MCG API stores...');
  const mcgResults = await Promise.all(MCG_STORES.map(fetchMcgStore));
  for (const result of mcgResults) {
    if (result) {
      console.log(`  ✅ ${result.storeName}: ${result.specials.length} items`);
      payloads.push(result);
    }
  }

  // 2. Watsonsale PDF stores (run in parallel)
  console.log('\n📄 Fetching watsonsale.com PDFs...');
  const pdfResults = await Promise.all(WATSONSALE_STORES.map(fetchWatsonsaleStore));
  for (const result of pdfResults) {
    if (result) {
      console.log(`  ✅ ${result.storeName}: ${result.specials.length} items`);
      payloads.push(result);
    }
  }

  // 3. Kahan's (headless browser)
  console.log('\n🌐 Scraping Kahan\'s via headless browser...');
  const kahans = await scrapeKahans();
  if (kahans) {
    console.log(`  ✅ Kahan's: ${kahans.specials.length} items`);
    payloads.push(kahans);
  }

  // 4. Upload all
  if (payloads.length === 0) {
    console.log('\n⚠️  No data scraped. Nothing to upload.');
    return;
  }

  console.log(`\n⬆️  Uploading ${payloads.length} stores to ${API_URL}...`);
  const results = await uploadPayloads(payloads);

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
