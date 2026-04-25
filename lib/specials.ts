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
  // Contact info — surfaced by SMS A/H replies and GET /api/specials.
  address?: string;
  phone?: string;
  hours?: string;
}

export interface Special {
  name: string;
  price: string;
  oldPrice: string | null;
  category: string;
}

// All stores with area/ZIP mapping
const STORES: Store[] = [
  // ── Williamsburg ────────────────────────────────────────────────────────
  { id: 'rosemary', name: 'Rosemary Kosher', apiBase: 'https://rosemarykosher.com/api', webUrl: 'https://rosemarykosher.com/Rosemary', area: 'Williamsburg', zips: ['11205', '11206', '11211', '11249'],
    address: '392 Flushing Ave, Brooklyn, NY 11205',
    phone: '(718) 500-3322' },
  { id: 'southside', name: 'Southside Kosher', apiBase: null, webUrl: 'https://www.southsidekosher.com', area: 'Williamsburg', zips: ['11205', '11206', '11211', '11249'],
    address: '428 Bedford Ave, Brooklyn, NY 11249',
    phone: '(718) 599-5505' },
  { id: 'gottlieb', name: "Gottlieb's Restaurant", apiBase: null, webUrl: 'https://gottliebrestaurant.com/order', area: 'Williamsburg', zips: ['11205', '11206', '11211', '11249'],
    address: '352 Roebling St, Brooklyn, NY 11211',
    phone: '(718) 384-6612',
    hours: 'Sun–Thu 12PM–10PM • Fri 12PM–8:30PM • Sat closed' },
  { id: 'chestnut', name: 'Chestnut Supermarket', apiBase: null, scrapeUrl: 'https://chestnutsupermarket.com/sale', webUrl: 'https://chestnutsupermarket.com/sale', area: 'Williamsburg', zips: ['11205', '11206', '11211', '11249'],
    address: '700 Myrtle Ave, Brooklyn, NY 11205',
    phone: '(718) 388-1200',
    hours: 'Sun 8AM–11PM • Mon–Tue 7AM–11PM • Wed 7AM–midnight • Thu 7AM–1AM • Fri 7AM–4PM • Sat closed' },
  { id: 'hatzlacha', name: 'Hatzlacha Kosher', apiBase: null, scrapeUrl: 'https://www.hatzlachakosher.com/specials', webUrl: 'https://www.hatzlachakosher.com/specials', area: 'Williamsburg', zips: ['11205', '11206', '11211', '11249'],
    address: '744 Bedford Ave, Brooklyn, NY 11205',
    phone: '(718) 522-5154',
    hours: 'Sun 7AM–11PM • Mon–Tue 7AM–11PM • Wed 7AM–midnight • Thu 7AM–1AM • Fri 7AM–5PM • Sat closed' },
  { id: 'foodoo', name: 'Foodoo Kosher', apiBase: null, scrapeUrl: 'https://www.foodookosher.com/specials', webUrl: 'https://www.foodookosher.com/specials', area: 'Williamsburg', zips: ['11206', '11211'],
    address: '249 Wallabout St, Brooklyn, NY 11206',
    phone: '(718) 384-2000',
    hours: 'Sun–Tue 8AM–11PM • Wed–Thu 8AM–midnight • Fri 8AM until 2h before candle-lighting • Sat closed' },
  { id: 'satmar_wb', name: 'Satmar Meats (Williamsburg)', apiBase: null, webUrl: 'https://www.satmarmeatsw.com/', area: 'Williamsburg', zips: ['11211'],
    address: '823 Bedford Ave, Brooklyn, NY 11211',
    phone: '(718) 963-1100',
    hours: 'Mon–Thu 9AM–9PM • Fri 9AM–2:30PM • Sat closed • Sun 12PM–9PM' },
  { id: 'mehadrin', name: 'Mehadrin Dairy', apiBase: null, webUrl: 'https://weeklylink.com/portfolio/mehadrin-2/', area: 'Williamsburg', zips: ['11237'],
    address: '30 Morgan Ave, Brooklyn, NY 11237',
    phone: '(718) 456-9494' },

  // ── Crown Heights ───────────────────────────────────────────────────────
  { id: 'koshertown', name: 'KosherTown', apiBase: 'https://koshertown.com/api', webUrl: 'https://koshertown.com/brooklyn', area: 'Crown Heights', zips: ['11213', '11225', '11238'] },
  { id: 'empire', name: 'Empire Kosher', apiBase: 'https://empirekoshersupermarket.com/api', webUrl: 'https://empirekoshersupermarket.com/empire', area: 'Crown Heights', zips: ['11213', '11225', '11238'] },
  { id: 'kosherfamily', name: 'Kosher Family', apiBase: 'https://kosherfamily.com/api', webUrl: 'https://kosherfamily.com/Brooklyn-Crown-Heights', area: 'Crown Heights', zips: ['11213', '11225', '11238'] },
  { id: 'kahans', name: "Kahan's Superette", apiBase: null, scrapeUrl: 'https://www.kahanskosher.com/specials', webUrl: 'https://www.kahanskosher.com/specials', area: 'Crown Heights', zips: ['11213', '11225', '11238'],
    address: '317 Kingston Ave, Brooklyn, NY 11213',
    phone: '(718) 756-2999',
    hours: 'Sun–Wed 7:30AM–11PM • Thu 7:30AM–midnight • Fri until 2h before Shabbos • Motzai Shabbos 1h after Shabbos–midnight' },
  { id: 'kleins_ch', name: "Klein's Grocery", apiBase: null, webUrl: 'https://kleinsfoodmarket.com/', area: 'Crown Heights', zips: ['11225', '11213', '11238'],
    address: '504 Empire Blvd, Brooklyn, NY 11225',
    phone: '(718) 493-9045',
    hours: 'Sun 8AM–7PM • Mon–Tue 8AM–8PM • Wed 8AM–9PM • Thu 8AM–10PM • Fri 8AM–4PM • Sat closed' },

  // ── Flatbush / Midwood ──────────────────────────────────────────────────
  { id: 'mountainfruit', name: 'Mountain Fruit', apiBase: 'https://shopmountainfruit.com/api', webUrl: 'https://shopmountainfruit.com/Brooklyn-Midwood-BoroPark/category/specials', area: 'Flatbush', zips: ['11230', '11229', '11218'],
    address: '1523 Avenue M, Brooklyn, NY 11230',
    phone: '(718) 998-3333',
    hours: 'Mon–Wed 7AM–10PM • Thu 7AM–midnight • Fri 7AM–6PM • Sat closed • Sun 7AM–10PM' },
  { id: 'glattmart', name: 'Glatt Mart', apiBase: null, scrapeUrl: 'https://www.glattmart.com/specials', webUrl: 'https://www.glattmart.com/specials', area: 'Flatbush', zips: ['11230', '11229'],
    address: '1205 Avenue M, Brooklyn, NY 11230',
    phone: '(718) 338-4040',
    hours: 'Mon–Tue 7AM–8PM • Wed 7AM–10PM • Thu 7AM–11PM • Fri 7AM–5PM • Sat closed • Sun 8AM–7PM' },
  { id: 'moishas', name: "Moisha's Discount", apiBase: null, scrapeUrl: 'https://watsonsale.com/supermarkets/moishas/', webUrl: 'https://moishas.com/specials', area: 'Flatbush', zips: ['11230', '11229', '11218'],
    address: '325 Avenue M, Brooklyn, NY 11230',
    phone: '(718) 336-7563',
    hours: 'Sun 8AM–8PM • Mon–Tue 7AM–8PM • Wed 7AM–11PM • Thu 7AM–midnight • Fri 7AM–4PM • Sat closed' },
  { id: 'pomppeople', name: 'Pomegranate', apiBase: null, webUrl: 'https://thepompeopleonline.com', area: 'Flatbush', zips: ['11230', '11229', '11218'],
    address: '1507 Coney Island Ave, Brooklyn, NY 11230',
    phone: '(718) 951-7112',
    hours: 'Sun 8AM–9PM • Mon–Tue 7AM–9PM • Wed 7AM–11PM • Thu 7AM–midnight • Fri 7AM–2:45PM • Sat closed (Motzai Shabbos 7PM–10:30PM)' },
  { id: 'organic_circle', name: 'Organic Circle', apiBase: null, webUrl: 'https://weeklylink.com/portfolio/organic-circle/', area: 'Flatbush', zips: ['11230', '11229'],
    address: '1415 Avenue M, Brooklyn, NY 11230',
    phone: '(718) 878-3103',
    hours: 'Sun–Thu 8AM–8PM • Fri 8AM–5PM • Sat closed' },
  { id: 'kosher_palace', name: 'Kosher Palace', apiBase: null, webUrl: 'https://weeklylink.com/portfolio/kosher-palace/', area: 'Flatbush', zips: ['11229', '11230'],
    address: '2818 Avenue U, Brooklyn, NY 11229',
    phone: '(718) 743-1900',
    hours: 'Sun 8AM–8PM • Mon–Wed 7AM–8PM • Thu 7AM–10PM • Fri 7AM–6PM • Sat closed' },

  // ── Borough Park ────────────────────────────────────────────────────────
  { id: 'breadberry', name: 'Breadberry', apiBase: 'https://breadberry.com/api', webUrl: 'https://breadberry.com/Brooklyn', area: 'Borough Park', zips: ['11204', '11219', '11218', '11230'] },
  { id: 'goldbergs', name: "Goldberg's Freshmarket", apiBase: null, scrapeUrl: 'https://watsonsale.com/supermarkets/goldbergs-supermarket/', webUrl: 'https://watsonsale.com/supermarkets/goldbergs-supermarket/', area: 'Borough Park', zips: ['11204', '11219'],
    address: '5025 18th Ave, Brooklyn, NY 11204',
    phone: '(718) 435-7177',
    hours: 'Mon–Thu 24h • Fri midnight–3PM • Sat 9:30PM–midnight • Sun 24h' },
  { id: 'krm', name: 'KRM Kollel Supermarket', apiBase: null, scrapeUrl: 'https://watsonsale.com/supermarkets/krm-kollel-supermarket/', webUrl: 'https://watsonsale.com/supermarkets/krm-kollel-supermarket/', area: 'Borough Park', zips: ['11218', '11219'] },
  { id: 'circus_fruits', name: 'Circus Fruits', apiBase: null, scrapeUrl: 'https://watsonsale.com/supermarkets/circus-fruits/', webUrl: 'https://circusfruits.com/weekly-specials', area: 'Borough Park', zips: ['11219'],
    address: '5915 Ft Hamilton Pkwy, Brooklyn, NY 11219',
    phone: '(718) 436-2100',
    hours: 'Open 24/7' },
  { id: 'three_guys', name: 'Three Guys From Brooklyn', apiBase: null, webUrl: 'https://www.3guysfrombrooklyn.com/', area: 'Borough Park', zips: ['11219'],
    address: '6502 Ft Hamilton Pkwy, Brooklyn, NY 11219',
    phone: '(718) 748-8340',
    hours: 'Open 24/7' },
  { id: 'satmar_bp', name: 'Satmar Meats (Boro Park)', apiBase: null, scrapeUrl: 'https://satmarmeatsbp.com/collections/specials', webUrl: 'https://satmarmeatsbp.com/collections/specials', area: 'Borough Park', zips: ['11219'],
    address: '5301 New Utrecht Ave, Brooklyn, NY 11219',
    phone: '(718) 435-8200',
    hours: 'Mon–Wed 8AM–8:30PM • Thu 9AM–8:30PM • Fri 8AM–2PM • Sat closed • Sun 9AM–8:30PM' },
  { id: 'kosherdepot', name: 'The Kosher Depot', apiBase: null, webUrl: 'http://www.thekosherdepot.com', area: 'Borough Park', zips: ['11204', '11219', '11218', '11230'],
    address: '4124 13th Ave, Brooklyn, NY 11219',
    phone: '(718) 686-9500' },
  { id: 'bingo_bp', name: 'Bingo Wholesale (Boro Park)', apiBase: null, scrapeUrl: 'https://www.bingowholesale.com/weekly-specials', webUrl: 'https://www.bingowholesale.com/weekly-specials', area: 'Borough Park', zips: ['11204', '11219', '11218', '11230'],
    address: '1245 61st St, Brooklyn, NY 11219',
    phone: '(718) 475-1331',
    hours: 'Sun–Tue 10AM–10PM • Wed–Thu 10AM–midnight • Fri 8AM–3:30PM • Sat closed' },
  { id: 'center_fresh', name: 'Center Fresh', apiBase: null, webUrl: 'https://weeklylink.com/portfolio/center-fresh/', area: 'Borough Park', zips: ['11219'],
    address: '4517 13th Ave, Brooklyn, NY 11219',
    phone: '(718) 633-8099',
    hours: 'Sun–Thu 7AM–1AM • Fri 7AM–7:30PM • Sat closed' },
  { id: 'food_spot', name: 'Food Spot', apiBase: null, webUrl: 'https://weeklylink.com/portfolio/food-spot/', area: 'Borough Park', zips: ['11219'],
    address: '4504 Fort Hamilton Pkwy, Brooklyn, NY 11219',
    phone: '(718) 436-0968',
    hours: 'Sun–Fri 8AM–9PM • Sat closed' },
  { id: 'gourmet_glatt_bp', name: 'Gourmet Glatt (Boro Park)', apiBase: null, webUrl: 'https://weeklylink.com/portfolio/gourmet-glatt/', area: 'Borough Park', zips: ['11218', '11219'],
    address: '1274 39th St, Brooklyn, NY 11218',
    phone: '(718) 437-3000',
    hours: 'Sun–Tue 7:30AM–9PM • Wed 7:30AM–11PM • Thu 7:30AM–midnight • Fri 7AM–4PM • Sat closed' },
  { id: 'kosher_discount', name: 'Kosher Discount', apiBase: null, webUrl: 'https://weeklylink.com/portfolio/kosher-discount/', area: 'Borough Park', zips: ['11219'],
    address: '4909 13th Ave, Brooklyn, NY 11219',
    phone: '(718) 854-4949',
    hours: 'Sun–Thu 7:30AM–11PM • Fri 7:30AM–5:30PM • Sat closed' },
  { id: 'landaus', name: "Landau's Supermarket", apiBase: null, webUrl: 'https://weeklylink.com/portfolio/landaus/', area: 'Borough Park', zips: ['11204'],
    address: '4516 18th Ave, Brooklyn, NY 11204',
    phone: '(718) 633-0633',
    hours: 'Sun 8AM–8PM • Mon–Tue 7AM–8PM • Wed 7AM–10PM • Thu 7AM–midnight • Fri 7AM–5PM • Sat closed' },
  { id: 'mega_53', name: 'Mega 53 Supermarket', apiBase: null, webUrl: 'https://weeklylink.com/portfolio/mega-53/', area: 'Borough Park', zips: ['11219'],
    address: '5314 13th Ave, Brooklyn, NY 11219',
    phone: '(718) 436-5353',
    hours: 'Sun–Thu 7AM–1AM • Fri 7AM–2PM • Sat closed' },
  { id: 'super_13', name: 'Super 13', apiBase: null, webUrl: 'https://weeklylink.com/portfolio/super-13/', area: 'Borough Park', zips: ['11219'],
    address: '5214 13th Ave, Brooklyn, NY 11219',
    phone: '(718) 633-1600',
    hours: 'Sun–Wed 8AM–1AM • Thu 8AM–1:30AM • Fri 8:30AM–5PM • Sat closed' },

  // ── Lakewood, NJ ────────────────────────────────────────────────────────
  { id: 'foodex', name: 'Foodex Kosher Supermarket', apiBase: null, scrapeUrl: 'https://www.foodexsupermarket.com/specials', webUrl: 'https://www.foodexsupermarket.com/specials', area: 'Lakewood', zips: ['08701'],
    address: '407 Princeton Ave, Lakewood, NJ 08701',
    phone: '(732) 364-3300',
    hours: 'Sun–Tue 8AM–11PM • Wed 8AM–11PM • Thu 8AM–midnight • Fri 8AM–7PM • Sat closed' },
  { id: 'bingo_lw', name: 'Bingo Wholesale (Lakewood)', apiBase: null, scrapeUrl: 'https://www.bingowholesale.com/weekly-specials', webUrl: 'https://www.bingowholesale.com/weekly-specials', area: 'Lakewood', zips: ['08701'],
    address: '1900 Shorrock St, Lakewood, NJ 08701',
    phone: '(718) 841-9971',
    hours: 'Sun–Tue 9AM–10PM • Wed–Thu 9AM–midnight • Fri 8AM–3:30PM • Sat closed' },

  // ── Monsey / Spring Valley / Pomona, NY ─────────────────────────────────
  { id: 'wesley', name: 'Wesley Kosher', apiBase: null, webUrl: 'https://www.wesleykosheronline.com/', area: 'Monsey', zips: ['10952'],
    address: '455 Route 306, Monsey, NY 10952',
    phone: '(845) 364-7217',
    hours: 'Sun 7AM–9PM • Mon–Wed 7AM–10PM • Thu 7AM–midnight • Fri 7AM until 2h before candle-lighting • Sat closed' },
  { id: 'evergreen_monsey', name: 'Evergreen Kosher Market (Monsey)', apiBase: null, webUrl: 'https://www.evergreenkosher.com/monsey', area: 'Monsey', zips: ['10952'],
    address: '59 NY-59, Monsey, NY 10952',
    phone: '(845) 352-4400',
    hours: 'Sun–Tue 7AM–11PM • Wed 6:30AM–midnight • Thu 6:30AM–1AM • Fri 6:30AM–6:30PM • Sat closed' },
  { id: 'evergreen_pomona', name: 'Evergreen Kosher Market (Uptown / Pomona)', apiBase: null, webUrl: 'https://www.evergreenkosher.com/uptown', area: 'Monsey', zips: ['10970'],
    address: '1581 US-202, Pomona, NY 10970',
    phone: '(845) 352-4400' },
  { id: 'rockland_kosher', name: 'Rockland Kosher Supermarket', apiBase: null, webUrl: 'https://rocklandkosher.com/', area: 'Monsey', zips: ['10952'],
    address: '27 Orchard St, Monsey, NY 10952',
    phone: '(845) 425-2266',
    hours: 'Mon–Tue 7AM–11:30PM • Wed 7AM–midnight • Thu 7AM–1AM • Fri 7AM–3:30PM • Sat closed (Motzai Shabbos 8PM–midnight)' },
  { id: 'newday', name: 'Newday Market', apiBase: null, webUrl: 'https://www.newdaymonsey.com/', area: 'Monsey', zips: ['10952'],
    address: '320 Saddle River Rd, Monsey, NY 10952',
    phone: '(845) 414-3000',
    hours: 'Sun 8AM–10PM • Mon–Tue 7AM–10PM • Wed 7AM–11PM • Thu 7AM–midnight • Fri 7AM–3:30PM • Sat closed (Motzai Shabbos 7PM–10PM)' },
  { id: 'bingo_msy', name: 'Bingo Wholesale (Monsey)', apiBase: null, scrapeUrl: 'https://www.bingowholesale.com/weekly-specials', webUrl: 'https://www.bingowholesale.com/weekly-specials', area: 'Monsey', zips: ['10977', '10952'],
    address: '44 Spring Valley Market Pl, Spring Valley, NY 10977',
    phone: '(718) 475-1331',
    hours: 'Sun–Tue 10AM–10PM • Wed–Thu 10AM–midnight • Fri 8AM–3:30PM • Sat closed' },
  // Restaurants / takeout
  { id: 'hava_java', name: 'Hava Java', apiBase: null, webUrl: 'https://havajavaonline.com/', area: 'Monsey', zips: ['10952'],
    address: '59 NY-59, Monsey, NY 10952',
    phone: '(845) 371-5282',
    hours: 'Sun 9AM–5PM • Mon–Thu 8AM–5PM • Fri 8AM–1PM • Sat closed' },
  { id: 'pita_land', name: 'Pita Land', apiBase: null, webUrl: 'https://pitalandmonsey.com/', area: 'Monsey', zips: ['10952'],
    address: '408 Route 59, Monsey, NY 10952',
    phone: '(845) 368-1116',
    hours: 'Sun–Wed 11AM–7PM • Thu 11AM–8:30PM • Fri closed • Sat closed' },
  { id: 'pies_n_fries', name: "Pies n' Fries", apiBase: null, webUrl: 'https://www.piesnfriesny.com/', area: 'Monsey', zips: ['10970'],
    address: '1581 US-202, Pomona, NY 10970',
    phone: '(845) 533-6680',
    hours: 'Mon–Thu 11AM–7PM • Fri 11AM–2PM • Sat 6PM–11PM (Motzai Shabbos)' },
  { id: 'al_di_la', name: 'Al Di La Pizzeria & Bistro', apiBase: null, webUrl: 'https://aldilapizzeriabistro.netwaiter.com/', area: 'Monsey', zips: ['10952'],
    address: '455 Route 306, Monsey, NY 10952',
    phone: '(845) 354-2672' },
  { id: 'fireside', name: 'Fireside Kosher', apiBase: null, webUrl: 'https://www.firesidekosher.com/monsey', area: 'Monsey', zips: ['10952'],
    address: '59 Route 59, Town Square Mall, Monsey, NY 10952',
    phone: '(845) 517-3570',
    hours: 'Sun 4:30PM–10PM • Mon–Thu 5:30PM–10PM • Fri closed • Sat closed' },
  { id: 'churrasko', name: 'Churrasko Grill House', apiBase: null, webUrl: 'https://churrasko.com/', area: 'Monsey', zips: ['10952'],
    address: '368 Route 306, Monsey, NY 10952',
    phone: '(845) 400-4040',
    hours: 'Sun 11:30AM–10PM • Mon–Thu 11:30AM–11PM • Fri closed • Sat closed' },
  { id: 'the_diner_pomona', name: 'The Diner', apiBase: null, webUrl: 'https://www.thedinerny.com/', area: 'Monsey', zips: ['10970'],
    address: '1669 US-202, Pomona, NY 10970',
    phone: '(845) 860-7173',
    hours: 'Sun–Wed 5PM–10PM • Thu 5PM–11PM • Fri closed • Sat closed' },
  { id: 'seasons_express_msy', name: 'Seasons Express (Monsey)', apiBase: null, webUrl: 'https://seasonsxpress.com/', area: 'Monsey', zips: ['10952'],
    address: '368 Route 306, Monsey, NY 10952',
    phone: '(845) 915-9996',
    hours: 'Mon–Wed 6:30AM–11PM • Thu 6:30AM–1AM • Fri 6:30AM–6PM • Sat closed (Motzai Shabbos 9:30PM–1AM)' },

  // ── Inwood / Five Towns, NY ─────────────────────────────────────────────
  { id: 'bingo_inwood', name: 'Bingo Wholesale (Inwood)', apiBase: null, scrapeUrl: 'https://www.bingowholesale.com/weekly-specials', webUrl: 'https://www.bingowholesale.com/weekly-specials', area: 'Inwood', zips: ['11096', '11598', '11516'],
    address: '603 Burnside Ave, Inwood, NY 11096',
    phone: '(718) 475-1331',
    hours: 'Sun–Mon 10AM–10PM • Tue–Thu 10AM–midnight • Fri 8AM–3:30PM • Sat closed' },
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

export function getStoreById(id: string): Store | null {
  return STORES.find(s => s.id === id) || null;
}

export function formatStoreListForSMS(storeList?: Store[], areaLabel?: string): string {
  const stores = storeList || STORES;
  const title = areaLabel ? `🏷 ${areaLabel} Stores:` : '🏷 Kosher Store Specials:';
  const lines = stores.map((s, i) => {
    // Show (website only) only for stores with no API and no scrapeUrl at all
    const tag = !s.apiBase && !s.scrapeUrl ? ' (website only)' : '';
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

async function getDbSpecials(storeId: string): Promise<Special[] | null> {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const rows = await prisma.storeSpecial.findMany({
      where: { storeId, expiresAt: { gt: new Date() } },
      select: { name: true, price: true, oldPrice: true, category: true },
      orderBy: { name: 'asc' },
    });
    await prisma.$disconnect();
    if (rows.length === 0) return null;
    return rows.map(r => ({
      name: r.name,
      price: r.price,
      oldPrice: r.oldPrice,
      category: r.category || '',
    }));
  } catch {
    return null;
  }
}

export async function fetchStoreSpecials(store: Store): Promise<Special[]> {
  // For non-API stores: try DB first, then fall back to scraped JSON
  if (!store.apiBase) {
    if (store.scrapeUrl) {
      const db = await getDbSpecials(store.id);
      if (db) return db;
      return getScrapedSpecials(store.id) || [];
    }
    return [];
  }

  // MCG API stores: check cache first
  const cached = specialsCache.get(store.id);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.specials;
  }

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

// Footer suffix that invites A (address) / H (hours) follow-up for stores
// that have contact info on file. Joined with "\n" onto the main response.
function infoFooterFor(store: Store): string {
  const bits: string[] = [];
  if (store.address || store.phone) bits.push('A=Address');
  if (store.hours) bits.push('H=Hours');
  return bits.length ? `\nReply ${bits.join(' • ')}` : '';
}

export function formatSpecialsForSMS(store: Store, specials: Special[]): string {
  const infoLine = infoFooterFor(store);

  if (specials.length === 0) {
    const base = (!store.apiBase && store.webUrl)
      ? `🏷 ${store.name}\nVisit their website for specials:\n${store.webUrl}`
      : `🏷 ${store.name}\nNo specials available right now.`;
    return `${base}${infoLine}\n\nReply SPECIALS for store list`;
  }

  // Sort by discount (items with oldPrice first)
  const sorted = [...specials].sort((a, b) => {
    if (a.oldPrice && !b.oldPrice) return -1;
    if (!a.oldPrice && b.oldPrice) return 1;
    return 0;
  });

  const header = `🏷 ${store.name} Specials (${specials.length} items):\n\n`;
  const footer = `${infoLine}\n\nReply SPECIALS for store list`;
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

// Response for A (address) or H (hours) follow-up after viewing a store's specials.
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
