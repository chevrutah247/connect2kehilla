// Tag all Chabad organizations (from 21 screenshots of "Chabad Nearby" app) with
// the 'chabad' category so SMS search "chabad" finds them.
//
// Strategy:
// 1. For each name in CHABAD_NAMES, find existing Business rows by name
//    (case-insensitive, also trying normalized / fuzzy variants).
// 2. If found: add 'chabad' to the categories array if not already there.
// 3. If not found: record as missing so we can create them in a follow-up pass.
//
// Run: npx tsx scripts/tag_chabad.ts

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// All 252 Chabad organization names extracted from IMG_2962–IMG_2982.
// Cleaned up: removed duplicates, trimmed whitespace.
const CHABAD_NAMES: string[] = [
  // IMG_2962
  'Shabbat Candles Campaign - Mivtza Neshek',
  'Aliya Girls',
  'Lishkas Ezras Achim',
  'ALIYA',
  'American Friends of Chabad Venezuelan Jewry',
  'Chabad Israeli Tourist and Delegations',
  'Yaldei Shluchei Harebbe',
  'Lubavitch Youth Mitzvah Tank',
  'F.R.E.E. HQ - Friends of Refugees of Eastern Europe',
  'Chabad F.R.E.E. NYC',
  'Friendship Circle of Brooklyn',
  'Mitzvah Tank Organization',
  'Or Hachasidus Publishing',

  // IMG_2963
  'Taharas Hamishpacha International',
  'Collel Menachem',
  "Womens' Mikvah",
  'Lubavitch Youth Organization',
  'Levi Yitzchok Library - LYO',
  "Yad L'Shliach",
  'Living Chassidus',
  'Vaad Rabonei Lubavitch',
  'Tzivos Hashem',
  'Lahak Hanochos Inc.',
  'Sichos in English',
  'Vaad Talmidei Hatmimim',

  // IMG_2964
  'Colel Menachem',
  'Lubavitch Youth Organization Headquarters',
  "Merkos L'inyonei Chinuch",
  'Vaad Hanochos Hatmimim',
  'Chabad Lubavitch Headquarters',
  'Library of Agudas Chasidei Chabad',
  'Chabad Lubavitch Media Center',
  'Kehot Publication Society',
  'Agudas Chassidei Chabad',
  'Central Yeshiva Tomchei Tmimim Lubavitch',
  'Merkos Suite 302',
  'Colel Chabad',

  // IMG_2965
  'The Shluchim Office',
  'Jewish Educational Media',
  'Chinuch Office',
  "Igud Mesivtos V'Yeshivos Lubavitch",
  'Machne Israel Development Fund',
  'National Committee for Furtherance of Jewish Education',
  'TAG Counceling Programs',
  'The Jewish Learning Institute',
  'Associated Beth Rivkah Schools',
  'Beth Rivkah Headstart',
  'Kehot Publication Society, Showroom',
  "Machon L'Yahadus",

  // IMG_2966
  'Chabad on Campus International',
  'United Lubavitcher Yeshivoth Mesivta & High School',
  'Chabad of SUNY Downstate',
  'Brownstone Gan Katan Preschool',
  'Chabad of Prospect Lefferts Gardens',
  'Chabad Prospect Heights East',
  'Chabad of Park Slope',
  'Kiddie Gan Day Camp',
  'Chabad Jewish Center Prospect Heights West',
  'Chabad of Windsor Terrace',
  'Gan on Greene - Fort Greene Preschool',
  'CTeen Program',
  'Chabad of Clinton Hill and Pratt Institute',

  // IMG_2967
  'Chabad of Ditmas Park',
  'Chabad-Lubavitch of Clinton Hill',
  'Chabad at Brooklyn College',
  'Chabad Lubavitch of Kensington',
  'Chabad Lubavitch of Boro Park',
  'Gan Yisroel School',
  'Bais Menachem Mendel',
  'Chabad-Lubavitch of Midwood',
  'United Lubavitcher Yeshivoth',
  'Camp F.R.E.E. - Gan Israel',
  'F.R.E.E. Educational Center - Ohel Dovid',
  'Chabad Downtown Brooklyn',

  // IMG_2968
  'Chabad of Bushwick',
  'Chabad of Canarsie and Starrett City',
  'Chabad of Brooklyn Law School',
  'Mifal Hafatza',
  'Mayan Yisroel',
  'Chabad of Ridgewood Congregation Beit Aharon',
  'Tzivos Hashem of Boro Park',
  'Heichal Menachem',
  'Chabad-House of Flatbush',
  'Chabad of Brooklyn Heights',
  'Chabad Colleges Downtown Brooklyn',
  'Chabad of Dumbo',
  'The Chabad Center for Russian Speakers',

  // IMG_2969
  'Neiros Lehuir Inc',
  'Chabad of North Brooklyn',
  "Mercaz Yisroel L'Chinuch",
  'Chabad West Village',
  'Mill Basin Jewish Center',
  'Chabad of the Lower East Side',
  'FiDi Hebrew School',
  'Gan Accademia',
  'The Chabad Jewish Center Of FiDi',
  'Chabad of the Lower East Side Synagogue',
  'Chabad of Gravesend',
  'Chabad of Bay Ridge',
  'Chabad of Wall Street',

  // IMG_2970
  'New York Hebrew',
  'Chabad of Greenpoint',
  'Chabad of Bensonhurst',
  'My Little School',
  'Mini Gan Summer Camp',
  'Hebrew School',
  'Chabad of Battery Park City',
  'Chabad House Bowery (Serving NYU)',
  'Chabad of Tribeca and SoHo',
  'Chabad of Sheepshead Bay',
  'Preschool @ Cooper Sq.',
  'Chabad of Gerritsen Beach',

  // IMG_2971
  'Chabad of Howard Beach',
  'F.R.E.E. Brit Milah (Circumcision) Center',
  'Chabad of Kings Highway',
  'Oceanview Chabad House',
  'Chabad East Village',
  'Chabad Lubavitch of Kingsborough College',
  'Chabad of Gramercy Park',
  'The Chabad Loft',
  'Chabad of Long Island City',
  'Jewish Latin Center',
  'Chabad at Baruch College',
  'CYP - F.R.E.E.',

  // IMG_2972
  'Mazel Day School',
  'F.R.E.E. of Brighton Beach - The Jewish Russian Community Center',
  'JLI - F.R.E.E.',
  'Chabad of Forest Hills South and Crescents',
  'Chabad Hebrew School MB',
  'Chabad Lubavitch of Manhattan Beach',
  'The Jewish Institute of Queens',
  'Chabad Lubavitch of West Brighton',
  'Chabad Center For Jewish Discovery',
  'Chabad Oceanview Jewish Center',
  'Kosher Food Bank',
  'Chabad for Diplomats',

  // IMG_2973
  'The Chelsea Shul & Rohr Center for Jgrads',
  'Chabad Association for Georgian Jews',
  'Chabad of Rego Park',
  'Chabad of Forest Hills',
  'Chabad Lubavitch of Midtown Manhattan',
  'Chabad of Roosevelt Island',
  'Chabad Young Professionals of Hoboken and Jersey City',
  'Chabad-Sutton',
  'Chabad House of Queens-Kew Gardens',
  'Chabad of the Diamond District',
  'Chabad of Forest Hills North',
  'Chabad of Sea-Gate',

  // IMG_2974
  'Chabad for Young Professionals',
  'The Institute of American & Talmudic Law',
  'Chabad of the Plaza District',
  'The Young Minyan',
  'Aleph Learning Center',
  'Chabad Lubavitch Upper East Side',
  'Chabad at Hunter College',
  'Chabad Young Professionals UES',
  'Chabad of Briarwood',
  'The Jewish Conversation',
  'Chabad Lubavitch of Hoboken',
  'Chabad House of Flushing New York',
  'Belle Harbor Chai Center',

  // IMG_2975
  'Chabad on Campus - Queens',
  'Chabad at Fordham',
  'Chabad Pod',
  'Chabad of the West Sixties',
  'Chabad Israel Center',
  'West Side Center for Jewish Life',
  'Chabad Young Professionals UWS',
  'Chabad of Bayonne',
  'Chabad of the West Side Annex',
  'CTeen Upper West Side',
  'Chabad of the West Side',
  'Chabad of Hamilton Heights',

  // IMG_2976
  'Chabad at CUMC',
  'Chabad of Jackson Heights',
  'Gan Israel School',
  'Chabad at Columbia University',
  'Chabad of Mid Island',
  'Chabad of Harlem',
  'Chabad Lubavitch of Staten Island',
  'Chabad of Eastern Queens',
  'Ohel Chabad Lubavitch',
  'Chabad Lubavitch of Far Rockaway',
  'Chabad of South Bronx',
  'Chabad of Northeast Queens',

  // IMG_2977
  'Chabad of Fort Lee',
  'Levi Yitzchak Library',
  'Chabad of the Five Towns',
  'Gan Chamesh Early Childhood Center',
  'Elmont Jewish Center',
  'Chabad of Valley Stream',
  'Chabad of Hewlett',
  'Chabad of Washington Heights East',
  'Chabad at Adelphi University',
  'Chabad of Rockville Centre',
  'Chabad of Inwood',

  // IMG_2978
  'Chabad of Hewlett Neck & Old Woodmere',
  'Chabad of Little Neck',
  'Chabad of Newark',
  'Chabad of Washington Heights',
  'Chabad @ The Medical Centers',
  'Chabad Hebrew School',
  'Silverstein Hebrew Academy',
  'Chabad of the Medical Community',
  'Chabad of Lake Success & University Gardens',
  'Chabad of South Bergen County and The Meadowlands',
  'Chabad of the Beaches',
  'Chabad of Englewood',

  // IMG_2979
  'Chabad of the South Shore',
  'Chabad of Hasbrouck Heights',
  'Chabad of West Hempstead',
  'Chabad of Great Neck',
  'Chabad of Kingsbridge',
  'Chabad of Manhasset',
  'Friends of Lubavitch of Bergen County',
  'Chabad Lubavitch of Riverdale',
  'Chabad of Oceanside',
  'Chabad of Passaic - Clifton',
  'Chabad Passaic Clifton',
  'Chabad of Mineola',

  // IMG_2980
  'Chabad of Hackensack',
  'Chabad of Port Washington',
  'Chabad of Roslyn',
  'Camp Gan Israel',
  'Chabad Jewish Learning Center',
  'Chabad Jewish Student Center',
  'Anshei Lubavitch',
  'Lubavitch on the Palisades',
  'Chabad of Old Westbury',
  'Chabad Pelham',
  'Chabad of Linden',
  'Chabad of Tottenville',

  // IMG_2981
  'Lubavitch Center of Essex County',
  'Shabbat House',
  'Chabad of West Orange',
  'Chabad of Dumont',
  'Chabad Hebrew Schools of Nassau County',
  'Jewish Learning Center of Springfield',
  'Chabad of Paramus',
  'The Living Legacy',
  'Friendship Circle',
  'Chabad-Lubavitch of Yonkers',
  'Chabad of Brush Hollow',

  // IMG_2982
  'Chabad Center for Jewish Life',
  'Gan Israel Day Camp',
  'Alan & Tatyana Forman Jewish Early Learning Center',
  'Chabad Lubavitch of Westchester County',
  'Chabad of the Caldwells',
  'Chabad at Short Hills',
]

// Deduplicate preserving order
const uniqueNames = Array.from(new Set(CHABAD_NAMES.map(n => n.trim())))

async function tagOne(targetName: string): Promise<{ status: 'tagged' | 'already' | 'missing'; matchedAs?: string }> {
  // First try exact case-insensitive equality.
  const exact = await prisma.business.findFirst({
    where: { name: { equals: targetName, mode: 'insensitive' } },
    select: { id: true, name: true, categories: true },
  })
  if (exact) return await applyTag(exact)

  // Fallback: strip punctuation/common words and try contains match.
  // Keep significant tokens (length >= 4) and search by them.
  const normalized = targetName
    .replace(/[.,()'"&@#]/g, ' ')
    .replace(/\b(of|the|and|inc|center|jewish|for|with)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (normalized.length < 4) return { status: 'missing' }

  // Try direct contains on the normalized form.
  const contain = await prisma.business.findFirst({
    where: { name: { contains: normalized, mode: 'insensitive' } },
    select: { id: true, name: true, categories: true },
  })
  if (contain) return await applyTag(contain)

  return { status: 'missing' }
}

async function applyTag(biz: { id: string; name: string; categories: string[] }): Promise<{ status: 'tagged' | 'already'; matchedAs: string }> {
  if (biz.categories.includes('chabad')) {
    return { status: 'already', matchedAs: biz.name }
  }
  await prisma.business.update({
    where: { id: biz.id },
    data: { categories: [...biz.categories, 'chabad'] },
  })
  return { status: 'tagged', matchedAs: biz.name }
}

async function main() {
  console.log(`Processing ${uniqueNames.length} unique Chabad names...\n`)

  const missing: string[] = []
  const tagged: Array<{ target: string; matchedAs: string }> = []
  const already: Array<{ target: string; matchedAs: string }> = []

  for (const name of uniqueNames) {
    const res = await tagOne(name)
    if (res.status === 'tagged') {
      tagged.push({ target: name, matchedAs: res.matchedAs! })
      console.log(`✅ TAGGED: "${name}" → "${res.matchedAs}"`)
    } else if (res.status === 'already') {
      already.push({ target: name, matchedAs: res.matchedAs! })
    } else {
      missing.push(name)
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ Newly tagged: ${tagged.length}`)
  console.log(`✓ Already tagged: ${already.length}`)
  console.log(`❌ Not found in DB: ${missing.length}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  if (missing.length > 0) {
    console.log('Missing (will need to be created):')
    for (const m of missing) console.log(`  • ${m}`)
  }

  // Final check: how many total businesses now have 'chabad' in categories
  const total = await prisma.business.count({ where: { categories: { has: 'chabad' } } })
  console.log(`\nTotal businesses with 'chabad' tag now: ${total}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
