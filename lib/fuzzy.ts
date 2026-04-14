// Fuzzy matching: typo tolerance, synonyms, transliterations
// Supports English, Yiddish transliteration, Hebrew transliteration, Hebrew & Yiddish script

// Common category aliases & misspellings → normalized category
const CATEGORY_ALIASES: Record<string, string> = {
  // Typos & variations
  'plumer': 'plumber', 'plummer': 'plumber', 'plumbing': 'plumber',
  'electrition': 'electrician', 'electrcian': 'electrician', 'electric': 'electrician',
  'docter': 'doctor', 'dr': 'doctor', 'doc': 'doctor',
  'dentis': 'dentist', 'dental': 'dentist',
  'laywer': 'lawyer', 'lawer': 'lawyer', 'attorney': 'lawyer',
  'restarant': 'restaurant', 'restraunt': 'restaurant', 'resturant': 'restaurant',
  'locksmth': 'locksmith', 'locsmith': 'locksmith',
  'carservice': 'car_service', 'car servce': 'car_service', 'taxi': 'car_service', 'cab': 'car_service',
  'exterminator': 'exterminating', 'pest': 'exterminating', 'pest control': 'exterminating',
  'accountent': 'accountants', 'cpa': 'accountants', 'tax': 'accountants',
  'fotografer': 'photography', 'photographer': 'photography', 'photo': 'photography',
  'caterer': 'catering', 'catring': 'catering',
  'insurence': 'insurance', 'insurnce': 'insurance',
  'car rental': 'car_rentals', 'rental car': 'car_rentals', 'rent a car': 'car_rentals',
  'bus': 'buses', 'busses': 'buses', 'shuttle': 'buses',
  'pharmacy': 'pharmacies', 'drugstore': 'pharmacies',
  'grocer': 'grocery', 'supermarket': 'grocery', 'market': 'grocery',
  'wig': 'wigs', 'sheitel': 'wigs', 'shaitel': 'wigs',
  'shtreimel': 'shtreimlech', 'shtreimal': 'shtreimlech',
  'mover': 'movers', 'moving': 'movers',
  'painter': 'paint_stores', 'painting': 'paint_stores',
  'bank': 'banks', 'banking': 'banks',
  'handiman': 'handyman', 'handy man': 'handyman',
  'tutoring': 'tutor', 'teacher': 'tutor',
  'cleaning': 'cleaning_service', 'cleaner': 'cleaning_service',
  'real estate': 'real_estate', 'realtor': 'real_estate', 'realty': 'real_estate',
  'apartment': 'real_estate', 'apt': 'real_estate', 'housing': 'real_estate',
  'jewlery': 'jewelry', 'jeweler': 'jewelry',
  'optician': 'optical', 'eye doctor': 'optical', 'glasses': 'optical',
  'glazer': 'glass_mirror', 'glazier': 'glass_mirror', 'glass': 'glass_mirror',
  'glass shop': 'glass_mirror', 'glass store': 'glass_mirror',
  'travel agent': 'travel', 'flights': 'travel',
  'printing': 'printing', 'printer': 'printing', 'print shop': 'printing',

  // Organizations / Institutions
  'kollel': 'kollel', 'beis medrash': 'beis_medrash', 'beis midrash': 'beis_medrash',
  'bais medrash': 'beis_medrash', 'beit midrash': 'beis_medrash',
  'headquarters': 'headquarters', 'hq': 'headquarters',
  'publishing': 'publishing', 'publisher': 'publishing',
  'media': 'media', 'fund': 'fund', 'campaign': 'campaign',
  'institute': 'institute', 'library': 'library',
  'development': 'development', 'nonprofit': 'nonprofit', 'non profit': 'nonprofit',

  // Yiddish transliterations (Latin script)
  'shlasser': 'locksmith', 'doktor': 'doctor', 'advokat': 'lawyer',
  'apteik': 'pharmacies', 'bakery': 'bakeries', 'bekery': 'bakeries',
  'fleisher': 'meat', 'fleish': 'meat', 'fish': 'fish', 'fisch': 'fish',
  'shuster': 'shoe_repair', 'shnyder': 'alterations', 'tailor': 'alterations',
  'maler': 'paint_stores', 'elektriker': 'electrician',
  'tischler': 'furniture', 'carpenter': 'furniture',
  'blumen': 'flowers', 'muzikant': 'orchestras_singers', 'musician': 'orchestras_singers',

  // Hebrew transliterations (Latin script)
  'shpahtler': 'plumber', 'rofe': 'doctor', 'orech din': 'lawyer', 'beit marpeh': 'doctor',

  // ── Hebrew (עברית) ──
  'רופא': 'doctor', 'דוקטור': 'doctor', 'רופא שיניים': 'dentist',
  'שיניים': 'dentist', 'עורך דין': 'lawyer', 'עו״ד': 'lawyer',
  'חשמלאי': 'electrician', 'שרברב': 'plumber', 'אינסטלטור': 'plumber',
  'מנעולן': 'locksmith', 'מסעדה': 'restaurant', 'בית מרקחת': 'pharmacies',
  'רוקח': 'pharmacies', 'מכולת': 'grocery', 'סופרמרקט': 'grocery',
  'בנק': 'banks', 'ביטוח': 'insurance', 'עורך חשבון': 'accountants',
  'רואה חשבון': 'accountants', 'צלם': 'photography', 'קייטרינג': 'catering',
  'הובלות': 'movers', 'ניקיון': 'cleaning_service', 'תיקון': 'appliances_repair',
  'נדלן': 'real_estate', 'תכשיטים': 'jewelry', 'פרחים': 'flowers',
  'נגר': 'furniture', 'צבעי': 'paint_stores', 'מוניות': 'car_service',
  'אוטובוס': 'buses', 'טיסות': 'travel', 'נסיעות': 'travel',
  'דפוס': 'printing', 'הדפסה': 'printing', 'אופטיקה': 'optical',
  'משקפיים': 'optical', 'נעליים': 'shoe_stores', 'תיקון נעליים': 'shoe_repair',
  'בגדי נשים': 'womens_wear', 'פאות': 'wigs', 'שטריימל': 'shtreimlech',
  'סופר': 'sofrim', 'מוהל': 'sofrim', 'מזוזות': 'religious_articles',
  'תפילין': 'religious_articles', 'ספרים': 'books', 'אלרם': 'alarms',
  'מנקה': 'cleaning_service', 'הדברה': 'exterminating', 'גנן': 'landscaping',

  // ── Yiddish (אידיש) ──
  'דאקטער': 'doctor', 'דאקטאר': 'doctor', 'צוינדאקטער': 'dentist',
  'אדוואקאט': 'lawyer', 'שלאסער': 'locksmith', 'עלעקטריקער': 'electrician',
  'אפטייק': 'pharmacies', 'פליישער': 'meat', 'פלייש': 'meat',
  'שוסטער': 'shoe_repair', 'שניידער': 'alterations', 'טישלער': 'furniture',
  'מאלער': 'paint_stores', 'בלומען': 'flowers', 'מוזיקאנט': 'orchestras_singers',
  'בעקער': 'bakeries', 'בעקעריי': 'bakeries', 'פישער': 'fish',
  'לעדיג': 'real_estate', 'דירה': 'real_estate', 'וואונונג': 'real_estate',
  'שפאכטלער': 'plumber', 'גלעזער': 'glass_mirror',
  'גאלדשמיד': 'jewelry', 'זייגערמאכער': 'jewelry',
  'שטאף': 'fabrics', 'שיך': 'shoe_stores',
  'מובער': 'movers', 'טאקסי': 'car_service', 'באס': 'buses',
  'דרוקעריי': 'printing', 'קאמפיוטער': 'computers',
  'אייזן וואריג': 'hardware_housewares', 'קוכער': 'catering',
}

// Area aliases & misspellings (neighborhoods within Brooklyn / upstate)
const AREA_ALIASES: Record<string, string> = {
  // English
  'willy': 'Williamsburg', 'wburg': 'Williamsburg', 'wmsburg': 'Williamsburg',
  'williamsburgh': 'Williamsburg', 'williamsberg': 'Williamsburg',
  'bp': 'Borough Park', 'boro park': 'Borough Park', 'boropark': 'Borough Park',
  'borough pk': 'Borough Park', 'boro pk': 'Borough Park',
  'ch': 'Crown Heights', 'crown hts': 'Crown Heights', 'crownheights': 'Crown Heights',
  'flatbsh': 'Flatbush', 'flat bush': 'Flatbush',
  'monsy': 'Monsey', 'monsay': 'Monsey',
  'lakewod': 'Lakewood', 'lkwd': 'Lakewood',
  'five twns': 'Five Towns', '5 towns': 'Five Towns', '5towns': 'Five Towns',
  'teneck': 'Teaneck', 'teanek': 'Teaneck',
  'passaik': 'Passaic', 'pasaic': 'Passaic',

  // Hebrew/Yiddish → area
  'וויליאמסבורג': 'Williamsburg',
  'בארא פארק': 'Borough Park', 'בורו פארק': 'Borough Park',
  'קראון הייטס': 'Crown Heights', 'קראון הייס': 'Crown Heights',
  'פלעטבוש': 'Flatbush',
}

// City aliases — maps typos, abbreviations, Hebrew/Yiddish to canonical city name
const CITY_ALIASES: Record<string, string> = {
  // Brooklyn typos & abbreviations
  'brooklin': 'Brooklyn', 'bklyn': 'Brooklyn', 'bk': 'Brooklyn', 'brklyn': 'Brooklyn',
  'brookyn': 'Brooklyn', 'broooklyn': 'Brooklyn',
  // Monsey
  'monsy': 'Monsey', 'monsay': 'Monsey', 'monsie': 'Monsey',
  // Monroe
  'monro': 'Monroe', 'monrow': 'Monroe', 'kiryas joel': 'Monroe', 'kj': 'Monroe',
  // New Square
  'new sqare': 'New Square', 'new sq': 'New Square', 'newsquare': 'New Square', 'skver': 'New Square',
  // Spring Valley
  'spring vally': 'Spring Valley', 'spring val': 'Spring Valley', 'sv': 'Spring Valley',
  // Staten Island
  'staten iland': 'Staten Island', 'si': 'Staten Island', 'statenisland': 'Staten Island',
  // Lakewood
  'lakewod': 'Lakewood', 'lkwd': 'Lakewood', 'lakwood': 'Lakewood',
  // Suffern
  'sufern': 'Suffern', 'suffren': 'Suffern',
  // Others
  'new york': 'New York', 'ny': 'New York', 'nyc': 'New York', 'manhattan': 'New York',

  // ── Hebrew (עברית) ──
  'ברוקלין': 'Brooklyn', 'מאנסי': 'Monsey', 'מונסי': 'Monsey',
  'לייקווד': 'Lakewood', 'ניו יורק': 'New York',
  'סטעטן איילענד': 'Staten Island', 'סטטן איילנד': 'Staten Island',
  'מונרו': 'Monroe', 'ניו סקווער': 'New Square',
  'ספרינג וואלי': 'Spring Valley',

  // ── Yiddish (אידיש) — only unique keys not already in Hebrew section ──
  'לעיקוואוד': 'Lakewood', 'ניו יארק': 'New York',
  'מאנרא': 'Monroe',
  'סקווירא': 'New Square', 'קרית יואל': 'Monroe',
}

// ── Product/Service keywords → category mapping ──
// When someone searches for a specific product or service, map to the right category
const KEYWORD_TO_CATEGORY: Record<string, string> = {
  // Glass & Mirror
  'shower door': 'glass_mirror', 'shower doors': 'glass_mirror',
  'table top': 'glass_mirror', 'tabletop': 'glass_mirror',
  'mirror': 'glass_mirror', 'mirrors': 'glass_mirror',
  'glass': 'glass_mirror', 'glass repair': 'glass_mirror', 'glazer': 'glass_mirror', 'glazier': 'glass_mirror',
  'window glass': 'glass_mirror', 'broken glass': 'glass_mirror',
  'glass table': 'glass_mirror', 'glass shelf': 'glass_mirror',
  'שפיגל': 'glass_mirror', 'גלאז': 'glass_mirror',

  // Plumbing
  'leak': 'plumber', 'leaking': 'plumber', 'pipe': 'plumber', 'pipes': 'plumber',
  'faucet': 'plumber', 'toilet': 'plumber', 'drain': 'plumber', 'clogged': 'plumber',
  'boiler': 'boiler_repairs', 'boiler repair': 'boiler_repairs',
  'water heater': 'plumber', 'hot water': 'plumber',

  // Electrical
  'wiring': 'electrician', 'outlet': 'electrician', 'light fixture': 'electrician',
  'circuit breaker': 'electrician', 'fuse': 'electrician', 'power outage': 'electrician',

  // Locksmith
  'locked out': 'locksmith', 'key': 'locksmith', 'keys': 'locksmith',
  'lock change': 'locksmith', 'door lock': 'locksmith',

  // Appliances
  'fridge': 'appliances_repair', 'refrigerator': 'appliances_repair',
  'washing machine': 'appliances_repair', 'dryer': 'appliances_repair',
  'oven': 'appliances_repair', 'dishwasher': 'appliances_repair',
  'stove': 'appliances_repair', 'ac': 'air_conditioning', 'air conditioner': 'air_conditioning',

  // Construction / Home improvement
  'roof': 'roofing', 'roofing': 'roofing', 'roof leak': 'roofing',
  'floor': 'floors', 'flooring': 'floors', 'tile': 'tiles_marble', 'tiles': 'tiles_marble',
  'marble': 'tiles_marble', 'countertop': 'tiles_marble', 'granite': 'tiles_marble',
  'kitchen': 'kitchens', 'kitchen remodel': 'kitchens', 'cabinets': 'kitchens',
  'closet': 'closets', 'shelving': 'shelving',
  'window shade': 'window_shades', 'blinds': 'window_shades', 'curtain': 'window_shades',
  'window': 'windows', 'window repair': 'windows_repair',
  'door': 'doors', 'garage door': 'garage_doors',

  // Pest control
  'mice': 'exterminating', 'mouse': 'exterminating', 'roach': 'exterminating',
  'bed bugs': 'exterminating', 'bedbug': 'exterminating', 'ants': 'exterminating',
  'rats': 'exterminating', 'termite': 'exterminating',

  // Cleaning
  'carpet cleaning': 'carpet_cleaning', 'rug cleaning': 'carpet_cleaning',
  'dryer vent': 'dryer_vent_cleaning', 'duct cleaning': 'air_condition_duct_cleaning',

  // Car
  'car accident': 'auto_collision', 'collision': 'auto_collision',
  'tire': 'tires', 'flat tire': 'tires',
  'tow': 'car_service', 'towing': 'car_service',
  'oil change': 'auto_dealers',

  // Medical
  'eye exam': 'optical', 'vision': 'optical',
  'hearing': 'hearing_aids', 'hearing aid': 'hearing_aids',
  'breast pump': 'breast_pumps',
  'wheelchair': 'surgical_supplies', 'walker': 'surgical_supplies',
  'prescription': 'pharmacies', 'medication': 'pharmacies',

  // Events
  'wedding hall': 'halls', 'event space': 'halls', 'party hall': 'halls',
  'wedding band': 'orchestras_singers', 'band': 'orchestras_singers',
  'singer': 'orchestras_singers', 'dj': 'orchestras_singers',
  'invitation': 'invitations', 'invitations': 'invitations',
  'balloon': 'balloons', 'balloons': 'balloons',
  'flowers for wedding': 'flowers',
  'chair rental': 'chair_table_rental', 'table rental': 'chair_table_rental',

  // Religious
  'mezuzah': 'religious_articles', 'mezuzos': 'religious_articles',
  'tefillin': 'religious_articles', 'tallis': 'talisim',
  'esrog': 'religious_articles', 'lulav': 'religious_articles',
  'sefer torah': 'sofrim', 'sofer': 'sofrim',
  'shaimos': 'shaimos_services',
  'mikvah': 'businesses_organizations',
}

/**
 * Check if input matches a product/service keyword → category
 */
export function matchKeywordToCategory(input: string): string | null {
  const lower = input.toLowerCase().trim();

  // Exact match
  if (KEYWORD_TO_CATEGORY[lower]) return KEYWORD_TO_CATEGORY[lower];

  // Check if input contains a keyword
  for (const [keyword, category] of Object.entries(KEYWORD_TO_CATEGORY)) {
    if (lower.includes(keyword)) return category;
  }

  return null;
}

/**
 * Levenshtein distance between two strings
 */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

/**
 * Normalize category: check aliases, then fuzzy match known categories
 */
export function normalizeCategory(input: string): { category: string; didYouMean?: string } {
  const lower = input.toLowerCase().trim();
  const trimmed = input.trim();

  // Exact alias match (English)
  if (CATEGORY_ALIASES[lower]) {
    return { category: CATEGORY_ALIASES[lower] };
  }
  // Exact alias match (Hebrew/Yiddish — case-sensitive)
  if (CATEGORY_ALIASES[trimmed]) {
    return { category: CATEGORY_ALIASES[trimmed] };
  }

  // Check all aliases with Levenshtein distance ≤ 2
  let bestMatch = '';
  let bestDist = Infinity;
  for (const [alias, cat] of Object.entries(CATEGORY_ALIASES)) {
    const dist = levenshtein(lower, alias);
    if (dist < bestDist && dist <= 2) {
      bestDist = dist;
      bestMatch = cat;
    }
  }

  if (bestMatch) {
    return { category: bestMatch, didYouMean: bestMatch };
  }

  // No match — return as-is
  return { category: lower };
}

/**
 * Normalize city name: check aliases, then fuzzy match
 */
export function normalizeCity(input: string): string | null {
  const lower = input.toLowerCase().trim();

  // Exact alias
  if (CITY_ALIASES[lower]) return CITY_ALIASES[lower];

  // Hebrew/Yiddish — check without lowercasing
  const trimmed = input.trim();
  if (CITY_ALIASES[trimmed]) return CITY_ALIASES[trimmed];

  // Known cities exact match
  const knownCities = [
    'Brooklyn', 'Monsey', 'Monroe', 'New Square', 'Spring Valley',
    'Staten Island', 'Lakewood', 'Suffern', 'New York', 'Airmont',
    'Pomona', 'New City', 'Teaneck', 'Passaic', 'Linden',
    'Highland Mills', 'Chestnut Ridge',
  ];
  for (const city of knownCities) {
    if (city.toLowerCase() === lower) return city;
  }

  // Fuzzy match aliases (distance ≤ 2)
  let bestMatch = '';
  let bestDist = Infinity;
  for (const [alias, city] of Object.entries(CITY_ALIASES)) {
    const dist = levenshtein(lower, alias.toLowerCase());
    if (dist < bestDist && dist <= 2) {
      bestDist = dist;
      bestMatch = city;
    }
  }

  // Fuzzy match known cities directly (distance ≤ 3)
  for (const city of knownCities) {
    const dist = levenshtein(lower, city.toLowerCase());
    if (dist < bestDist && dist <= 3) {
      bestDist = dist;
      bestMatch = city;
    }
  }

  return bestMatch || null;
}

/**
 * Normalize area name: check aliases, then fuzzy match
 */
export function normalizeArea(input: string): string | null {
  const lower = input.toLowerCase().trim();
  const trimmed = input.trim();

  // Exact alias (including Hebrew/Yiddish)
  if (AREA_ALIASES[lower]) return AREA_ALIASES[lower];
  if (AREA_ALIASES[trimmed]) return AREA_ALIASES[trimmed];

  // Known areas exact match (case-insensitive)
  const knownAreas = ['Williamsburg', 'Borough Park', 'Crown Heights', 'Flatbush', 'Monsey', 'Lakewood', 'Five Towns', 'Teaneck', 'Passaic'];
  for (const area of knownAreas) {
    if (area.toLowerCase() === lower) return area;
  }

  // Fuzzy match aliases (distance ≤ 2)
  let bestMatch = '';
  let bestDist = Infinity;
  for (const [alias, area] of Object.entries(AREA_ALIASES)) {
    const dist = levenshtein(lower, alias);
    if (dist < bestDist && dist <= 2) {
      bestDist = dist;
      bestMatch = area;
    }
  }

  // Fuzzy match known areas directly (distance ≤ 3)
  for (const area of knownAreas) {
    const dist = levenshtein(lower, area.toLowerCase());
    if (dist < bestDist && dist <= 3) {
      bestDist = dist;
      bestMatch = area;
    }
  }

  return bestMatch || null;
}

/**
 * Detect language from input text
 */
export function detectLanguage(text: string): 'en' | 'yi' | 'he' {
  // Check for Hebrew/Yiddish characters (Unicode block 0590-05FF)
  const hebrewChars = text.match(/[\u0590-\u05FF]/g);
  if (hebrewChars && hebrewChars.length > text.length * 0.3) {
    // Yiddish typically has more vowel points (nikkud) and specific letters
    // Simple heuristic: if contains ײ,ױ,אַ,אָ → Yiddish
    if (/[ײױ]|אַ|אָ/.test(text)) return 'yi';
    return 'he';
  }
  return 'en';
}
