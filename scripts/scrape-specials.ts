// Scrape store specials from four kinds of sources and POST to the app's
// /api/update-specials endpoint (which writes to Postgres).
//
// Sources (dispatched off `Store.source.kind` in lib/specials.ts):
//   1. mcg        — POST to My Cloud Grocer JSON API
//   2. shopify    — GET /collections/<h>/products.json
//   3. playwright — headless Chromium (bypasses Cloudflare challenge)
//   4. pdf        — download flyer from watsonsale.com, extract via pdftotext
//
// Runs in GitHub Actions nightly — see .github/workflows/scrape-specials.yml.
// Env: APP_URL, SCRAPER_SECRET (both set as GitHub repository secrets).

import { spawnSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { chromium, Page } from 'playwright';
import { getAllStores, Store, Special, StoreSource } from '../lib/specials';

const APP_URL = process.env.APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
const SCRAPER_SECRET = process.env.SCRAPER_SECRET;

if (!SCRAPER_SECRET) {
  console.error('SCRAPER_SECRET env var is required');
  process.exit(1);
}

const REAL_BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ──────────────────────────────────────────────────────────────────────────
// 1. MCG (My Cloud Grocer) — used by Rosemary, KosherTown, Empire, etc.
// ──────────────────────────────────────────────────────────────────────────
async function scrapeMCG(apiBase: string): Promise<Special[]> {
  const res = await fetch(`${apiBase}/AjaxFilter/JsonProductsList?pageNumber=1`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain', 'User-Agent': REAL_BROWSER_UA },
    body: JSON.stringify([{ FilterType: 6, Value1: 1, categoryId: 0 }]),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`MCG ${apiBase} HTTP ${res.status}`);
  const data: any = await res.json();
  const raw = data.productsJson || data.ProductsJson || '[]';
  const products = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return products.map((p: any): Special => ({
    name: p.N || '',
    price: p.P || '',
    oldPrice: p.O || null,
    category: p.CN || '',
  })).filter((s: Special) => s.name && s.price);
}

// ──────────────────────────────────────────────────────────────────────────
// 2. Shopify — used by Satmar Meats of Boro Park, Pomegranate, etc.
// ──────────────────────────────────────────────────────────────────────────
async function scrapeShopify(storefrontBase: string, collection: string): Promise<Special[]> {
  // storefrontBase may be a full URL (e.g. https://satmarmeatsbp.com) or the store's webUrl
  const origin = new URL(storefrontBase).origin;
  const url = `${origin}/collections/${collection}/products.json?limit=250`;
  const res = await fetch(url, {
    headers: { 'User-Agent': REAL_BROWSER_UA, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Shopify ${url} HTTP ${res.status}`);
  const data: any = await res.json();
  return (data.products ?? []).map((p: any): Special => {
    const v = (p.variants && p.variants[0]) || {};
    const price = v.price ? `$${v.price}` : '';
    const compare = v.compare_at_price ? `$${v.compare_at_price}` : null;
    return { name: p.title ?? '', price, oldPrice: compare, category: p.product_type ?? '' };
  }).filter((s: Special) => s.name && s.price);
}

// ──────────────────────────────────────────────────────────────────────────
// 3. Playwright — Cloudflare-walled MCG stores (Foodex, Foodoo, Kahan's, Glatt Mart)
// ──────────────────────────────────────────────────────────────────────────
async function scrapeWithBrowser(url: string): Promise<Special[]> {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: REAL_BROWSER_UA,
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
  });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Wait out the Cloudflare JS challenge ("Just a moment...")
    for (let i = 0; i < 30; i++) {
      const title = await page.title();
      if (!/just a moment|attention required/i.test(title)) break;
      await page.waitForTimeout(1000);
    }
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

    // Scroll to trigger lazy-loaded product tiles
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let y = 0;
        const step = () => {
          window.scrollTo(0, y);
          y += 800;
          if (y < document.body.scrollHeight) setTimeout(step, 200);
          else resolve();
        };
        step();
      });
    });
    await page.waitForTimeout(1500);

    return await extractFromDom(page);
  } finally {
    await ctx.close();
    await browser.close();
  }
}

// Generic DOM extractor — picks up any tile that has a struck-through "was" price
// alongside a current price. Matches the MCG-themed storefronts these sites use.
async function extractFromDom(page: Page): Promise<Special[]> {
  return await page.evaluate(() => {
    const out: { name: string; price: string; oldPrice: string | null; category: string }[] = [];
    const priceRe = /\$\s?\d+(?:\.\d{2})?/;
    const tiles = Array.from(document.querySelectorAll<HTMLElement>(
      '[class*="product" i], [data-product-id], [data-sku], article, li'
    ));
    const seen = new Set<string>();
    for (const tile of tiles) {
      const text = (tile.innerText || '').trim();
      if (!text || text.length > 400) continue;
      const oldEl = tile.querySelector<HTMLElement>('s, del, .old-price, [class*="strike" i], [class*="was" i], [class*="compare" i]');
      const oldMatch = oldEl?.innerText?.match(priceRe)?.[0] ?? null;
      if (!oldMatch) continue;
      const allPrices = text.match(/\$\s?\d+(?:\.\d{2})?/g) || [];
      const price = allPrices.find((p) => p !== oldMatch);
      if (!price) continue;
      const lines = text.split('\n').map((l) => l.trim()).filter((l) => l && !priceRe.test(l));
      const name = lines.sort((a, b) => b.length - a.length)[0] || '';
      if (!name || name.length < 3) continue;
      const key = `${name}|${price}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ name, price, oldPrice: oldMatch, category: 'Sale' });
    }
    return out;
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 4. PDF — watsonsale.com weekly flyer (Moisha's, Mountain Fruit, etc.)
// ──────────────────────────────────────────────────────────────────────────
interface PdfResult {
  specials: Special[];
  validUntil: Date | null;
}

async function scrapeFromWatsonsalePdf(slug: string): Promise<PdfResult> {
  const pageUrl = `https://watsonsale.com/supermarkets/${slug}/`;
  const pageRes = await fetch(pageUrl, {
    headers: { 'User-Agent': REAL_BROWSER_UA },
    signal: AbortSignal.timeout(15_000),
  });
  if (!pageRes.ok) throw new Error(`watsonsale page ${pageUrl} HTTP ${pageRes.status}`);
  const pageHtml = await pageRes.text();

  // Find the most recent PDF link
  const pdfs = [...pageHtml.matchAll(/https?:\/\/watsonsale\.com\/wp-content\/uploads\/(\d{4})\/(\d{1,2})\/([^"]+?\.pdf)/g)]
    .map((m) => ({ year: +m[1], month: +m[2], url: m[0] }))
    .sort((a, b) => b.year - a.year || b.month - a.month);
  if (!pdfs.length) throw new Error(`no PDF found on ${pageUrl}`);
  const pdfUrl = pdfs[0].url;

  // Validity window: "Apr 22, 2026 - Apr 28, 2026"
  const valid = pageHtml.match(/(\w+\s\d+,\s\d{4})\s*[-–]\s*(\w+\s\d+,\s\d{4})/);
  const validUntil = valid ? new Date(valid[2]) : null;

  // Download + pdftotext
  const pdfRes = await fetch(pdfUrl, {
    headers: { 'User-Agent': REAL_BROWSER_UA },
    signal: AbortSignal.timeout(30_000),
  });
  if (!pdfRes.ok) throw new Error(`PDF download ${pdfUrl} HTTP ${pdfRes.status}`);
  const buf = Buffer.from(await pdfRes.arrayBuffer());
  const tmpPath = join(tmpdir(), `watsonsale-${slug}-${Date.now()}.pdf`);
  writeFileSync(tmpPath, buf);

  let text = '';
  try {
    const proc = spawnSync('pdftotext', ['-layout', tmpPath, '-'], { encoding: 'utf-8' });
    if (proc.status !== 0) throw new Error(`pdftotext failed: ${proc.stderr}`);
    text = proc.stdout;
  } finally {
    try { unlinkSync(tmpPath); } catch {}
  }

  return { specials: parseFlyerText(text), validUntil };
}

// Heuristic line-by-line parser for pdftotext `-layout` output.
// Picks up rows of the shape "PRODUCT NAME ........... $X.XX[/lb]" (dot-leaders
// common in meat/deli sections). Top card-style sections often miss — that's
// acceptable for v1.
function parseFlyerText(text: string): Special[] {
  const out: Special[] = [];
  const seen = new Set<string>();
  const priceRe = /\$\s?\d+(?:\.\d{1,2})?(?:\s?\/?\s?lb)?\b/i;
  const lines = text.split('\n');

  let currentCategory = '';
  const categoryHeadings = /^(BAKERY|CANDY|SUSHI|FISH|MEAT DEPARTMENT|PRODUCE|DELI|GROCERY|DAIRY|FROZEN|CHICKEN|BEEF|TURKEY|LAMB|SHABBOS|TAKEOUT|BAKED|CHEESE|BEVERAGES?)$/i;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\u2022/g, '').trim();
    if (!line) continue;

    if (categoryHeadings.test(line)) {
      currentCategory = line.charAt(0) + line.slice(1).toLowerCase();
      continue;
    }

    // Dot-leader style: "Chicken Drumsticks (Family Pack) ........ $3.29lb"
    const dotLead = line.match(/^(.+?)\s*[.·•�]{3,}\s*(\$\s?\d+[.�]?\d{0,2}\s?\/?\s?lb?)\s*$/i);
    if (dotLead) {
      const name = dotLead[1].replace(/\s+/g, ' ').trim();
      const price = dotLead[2].replace(/[�·]/g, '.').replace(/\s+/g, '');
      if (name.length >= 3 && priceRe.test(price)) {
        const key = `${name}|${price}`;
        if (!seen.has(key)) {
          seen.add(key);
          out.push({ name, price, oldPrice: null, category: currentCategory || 'Weekly Special' });
        }
      }
      continue;
    }

    // Fallback: "PRODUCT NAME $X.XX" at end of line (no leader).
    const trailing = line.match(/^([A-Z][\w &'’\-\/().,+]{3,60})\s+(\$\s?\d+\.\d{2}(?:\s?\/?\s?lb)?)\s*$/);
    if (trailing) {
      const name = trailing[1].trim();
      const price = trailing[2].replace(/\s+/g, '');
      const key = `${name}|${price}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ name, price, oldPrice: null, category: currentCategory || 'Weekly Special' });
      }
    }
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────────
// Dispatcher + main
// ──────────────────────────────────────────────────────────────────────────
async function scrapeOne(store: Store): Promise<{ items: Special[]; validUntil?: Date | null }> {
  const src: StoreSource = store.source;
  switch (src.kind) {
    case 'mcg':
      return { items: await scrapeMCG(src.apiBase) };
    case 'shopify':
      return { items: await scrapeShopify(store.webUrl, src.collection) };
    case 'playwright':
      return { items: await scrapeWithBrowser(src.url) };
    case 'pdf': {
      const r = await scrapeFromWatsonsalePdf(src.watsonSlug);
      return { items: r.specials, validUntil: r.validUntil };
    }
    case 'none':
      return { items: [] };
  }
}

async function postToApp(storeId: string, items: Special[], validUntil?: Date | null) {
  const url = APP_URL.replace(/\/$/, '') + '/api/update-specials';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SCRAPER_SECRET}`,
    },
    body: JSON.stringify({ storeId, items, validUntil: validUntil?.toISOString() ?? null }),
  });
  if (!res.ok) {
    throw new Error(`POST ${url} HTTP ${res.status}: ${await res.text().catch(() => '')}`);
  }
}

async function main() {
  const storeIdFilter = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const stores = getAllStores().filter((s) => s.source.kind !== 'none'
    && (storeIdFilter.length === 0 || storeIdFilter.includes(s.id)));

  let failed = 0;
  for (const store of stores) {
    process.stdout.write(`→ ${store.id.padEnd(18)} (${store.source.kind.padEnd(10)}) ... `);
    try {
      const { items, validUntil } = await scrapeOne(store);
      if (items.length === 0) {
        console.log(`0 items (skipped POST)`);
        continue;
      }
      await postToApp(store.id, items, validUntil);
      console.log(`✓ ${items.length} items${validUntil ? ` (valid until ${validUntil.toISOString().slice(0, 10)})` : ''}`);
    } catch (err: any) {
      failed++;
      console.log(`✗ ${err?.message ?? err}`);
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} store(s) failed.`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
