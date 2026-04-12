// Fuzzy matching: typo tolerance, synonyms, transliterations
// Supports English, Yiddish transliteration, Hebrew transliteration

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
  'travel agent': 'travel', 'flights': 'travel',
  'printing': 'printing', 'printer': 'printing', 'print shop': 'printing',

  // Yiddish transliterations (Latin)
  'shlasser': 'locksmith', // שלאסער
  'doktor': 'doctor', // דאקטאר
  'advokat': 'lawyer', // אדוואקאט
  'apteik': 'pharmacies', // אפטייק
  'bakery': 'bakeries', 'bekery': 'bakeries', // בעקעריי
  'fleisher': 'meat', 'fleish': 'meat', // פלייש
  'fish': 'fish', 'fisch': 'fish',
  'shuster': 'shoe_repair', // שוסטער
  'shnyder': 'alterations', 'tailor': 'alterations', // שניידער
  'maler': 'paint_stores', // מאלער
  'elektriker': 'electrician', // עלעקטריקער
  'tischler': 'furniture', 'carpenter': 'furniture', // טישלער
  'blumen': 'flowers', // בלומען
  'muzikant': 'orchestras_singers', 'musician': 'orchestras_singers',

  // Hebrew transliterations
  'shpahtler': 'plumber', // שפאכטלער
  'rofe': 'doctor', // רופא
  'orech din': 'lawyer', // עורך דין
  'beit marpeh': 'doctor', // בית מרפא
}

// Area aliases & misspellings
const AREA_ALIASES: Record<string, string> = {
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

  // Exact alias match
  if (CATEGORY_ALIASES[lower]) {
    return { category: CATEGORY_ALIASES[lower] };
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
 * Normalize area name: check aliases, then fuzzy match
 */
export function normalizeArea(input: string): string | null {
  const lower = input.toLowerCase().trim();

  // Exact alias
  if (AREA_ALIASES[lower]) return AREA_ALIASES[lower];

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
