import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

// ============================================
// Area data — each landing page tuned for local SEO
// ============================================
const AREAS: Record<string, {
  name: string
  hebrew?: string
  zips: string[]
  city: string
  state: string
  lat: number
  lng: number
  intro: string
  categories: string[]
  landmarks?: string[]
}> = {
  'crown-heights': {
    name: 'Crown Heights',
    hebrew: 'קראון הייטס',
    zips: ['11213', '11225', '11203'],
    city: 'Brooklyn',
    state: 'NY',
    lat: 40.6694,
    lng: -73.9422,
    intro: 'Home of Chabad-Lubavitch world headquarters (770 Eastern Parkway). Connect2Kehilla covers all businesses, pharmacies, restaurants, doctors, and community services in Crown Heights.',
    categories: ['plumber', 'doctor', 'pharmacy', 'restaurant', 'grocery', 'mikvah', 'beis din', 'judaica', 'yeshiva'],
    landmarks: ['770 Eastern Parkway (Chabad HQ)', 'Kingston Avenue', 'Eastern Parkway', 'Crown Heights Mikvah', 'Oholei Torah', 'OK Kosher Certification'],
  },
  'williamsburg': {
    name: 'Williamsburg',
    hebrew: 'וויליאמסבורג',
    zips: ['11211', '11249', '11206', '11205'],
    city: 'Brooklyn',
    state: 'NY',
    lat: 40.7081,
    lng: -73.9571,
    intro: 'Center of Satmar community. Connect2Kehilla includes 14,000+ Williamsburg businesses — the largest area in our database — from Lee Avenue to Bedford Avenue.',
    categories: ['plumber', 'doctor', 'pharmacy', 'restaurant', 'grocery', 'tailor', 'judaica', 'sofer', 'beis din'],
    landmarks: ['Lee Avenue', 'Bedford Avenue', 'CRC Badatz', 'Central Rabbinical Congress', 'Marcy Avenue'],
  },
  'boro-park': {
    name: 'Boro Park',
    hebrew: 'בארא פארק',
    zips: ['11219', '11204', '11218'],
    city: 'Brooklyn',
    state: 'NY',
    lat: 40.6328,
    lng: -73.9876,
    intro: 'One of the largest Orthodox Jewish communities outside Israel. Connect2Kehilla covers 13th Avenue businesses, medical offices, stores, and all services in Boro Park.',
    categories: ['plumber', 'doctor', 'pharmacy', 'restaurant', 'grocery', 'jewelry', 'tailor', 'urgent care', 'dentist'],
    landmarks: ['13th Avenue', '18th Avenue', '16th Avenue', 'Asisa Urgent Care', 'Bobov headquarters'],
  },
  'flatbush': {
    name: 'Flatbush',
    hebrew: 'פלעטבוש',
    zips: ['11230', '11210'],
    city: 'Brooklyn',
    state: 'NY',
    lat: 40.6197,
    lng: -73.9653,
    intro: 'Large Modern Orthodox and Sephardic Jewish community. Connect2Kehilla covers businesses along Avenue J, Coney Island Avenue, Ocean Parkway, and surrounding streets.',
    categories: ['doctor', 'pharmacy', 'restaurant', 'grocery', 'beis din', 'sephardic synagogue'],
    landmarks: ['Avenue J', 'Coney Island Avenue', 'Ocean Parkway', 'Vaad Harabonim of Flatbush', 'Sephardic Beth Din'],
  },
  'monsey': {
    name: 'Monsey',
    hebrew: 'מאנסי',
    zips: ['10952', '10977'],
    city: 'Monsey',
    state: 'NY',
    lat: 41.1112,
    lng: -74.0687,
    intro: 'Major Haredi community in Rockland County, NY. Connect2Kehilla covers all Monsey Main Street businesses, medical offices, and community services.',
    categories: ['plumber', 'doctor', 'pharmacy', 'restaurant', 'grocery', 'beis din', 'yeshiva'],
    landmarks: ['Main Street Monsey', 'Route 306', 'Beis Din Mechon L\'Hoyroa', 'Robert Pitt Drive'],
  },
  'monroe': {
    name: 'Monroe / Kiryas Joel',
    hebrew: 'קרית יואל',
    zips: ['10950'],
    city: 'Monroe',
    state: 'NY',
    lat: 41.3310,
    lng: -74.1855,
    intro: 'Kiryas Joel is a Satmar Hasidic village in Orange County, NY. Connect2Kehilla covers all Monroe/Kiryas Joel businesses including Forest Road, Acres Road, and more.',
    categories: ['plumber', 'furniture', 'grocery', 'pharmacy', 'beis din', 'tailor'],
    landmarks: ['Forest Road', 'Van Buren Drive', 'Acres Road', 'Rabbinical Court of Kiryas Joel'],
  },
  'lakewood': {
    name: 'Lakewood',
    hebrew: 'לייקווד',
    zips: ['08701'],
    city: 'Lakewood',
    state: 'NJ',
    lat: 40.0960,
    lng: -74.2177,
    intro: 'Home of BMG (Beth Medrash Govoha), the largest yeshiva outside Israel. Connect2Kehilla covers Lakewood businesses, services, and the entire frum community there.',
    categories: ['plumber', 'doctor', 'pharmacy', 'restaurant', 'grocery', 'beis din', 'yeshiva', 'furniture'],
    landmarks: ['BMG Lakewood', 'River Avenue', 'Forest Avenue', 'Bais HaVaad Halacha', 'Bais Din Maysharim'],
  },
  'five-towns': {
    name: 'Five Towns',
    hebrew: 'פייב טאונס',
    zips: ['11516', '11559', '11598', '11557', '11563'],
    city: 'Cedarhurst',
    state: 'NY',
    lat: 40.6318,
    lng: -73.7240,
    intro: 'Five Towns includes Cedarhurst, Lawrence, Woodmere, Hewlett, and Inwood on Long Island. Connect2Kehilla covers businesses throughout this established Orthodox community.',
    categories: ['doctor', 'pharmacy', 'restaurant', 'grocery', 'beis din'],
    landmarks: ['Central Avenue Cedarhurst', 'Willow Avenue', 'Vaad Harabanim of Five Towns'],
  },
  'teaneck': {
    name: 'Teaneck',
    hebrew: 'טינעק',
    zips: ['07666'],
    city: 'Teaneck',
    state: 'NJ',
    lat: 40.8876,
    lng: -74.0159,
    intro: 'Large Modern Orthodox community in Bergen County, NJ. Connect2Kehilla covers Teaneck kosher businesses and services.',
    categories: ['restaurant', 'grocery', 'pharmacy', 'doctor'],
    landmarks: ['Cedar Lane', 'Queen Anne Road'],
  },
  'passaic': {
    name: 'Passaic',
    hebrew: 'פאסאיק',
    zips: ['07055'],
    city: 'Passaic',
    state: 'NJ',
    lat: 40.8568,
    lng: -74.1285,
    intro: 'Growing Orthodox community in Passaic County, NJ. Connect2Kehilla covers local businesses and services.',
    categories: ['restaurant', 'grocery', 'pharmacy'],
    landmarks: ['Main Avenue', 'Passaic Kashrus'],
  },
}

export function generateStaticParams() {
  return Object.keys(AREAS).map(area => ({ area }))
}

export async function generateMetadata({ params }: { params: { area: string } }): Promise<Metadata> {
  const area = AREAS[params.area]
  if (!area) return { title: 'Area not found' }

  const zipsStr = area.zips.join(', ')
  const title = `${area.name} Kosher Business Directory — SMS Search ${zipsStr}`
  const description = `Find kosher plumbers, doctors, pharmacies, restaurants, and community services in ${area.name}, ${area.city}, ${area.state}. Text (888) 516-3399 — SMS directory with verified listings. ${area.intro.slice(0, 100)}`

  return {
    title,
    description,
    keywords: [
      `${area.name} plumber`, `${area.name} doctor`, `${area.name} pharmacy`,
      `${area.name} kosher restaurant`, `${area.name} business directory`,
      `${area.name} jewish`, `kosher ${area.name}`, `frum ${area.name}`,
      ...area.categories.map(c => `${c} ${area.name}`),
      ...area.zips.map(z => `plumber ${z}`),
    ],
    alternates: { canonical: `https://www.connect2kehilla.com/${params.area}` },
    openGraph: {
      title,
      description,
      url: `https://www.connect2kehilla.com/${params.area}`,
      type: 'website',
    },
  }
}

export default function AreaPage({ params }: { params: { area: string } }) {
  const area = AREAS[params.area]
  if (!area) notFound()

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Connect2Kehilla — ${area.name}`,
    description: area.intro,
    url: `https://www.connect2kehilla.com/${params.area}`,
    telephone: '+1-888-516-3399',
    address: {
      '@type': 'PostalAddress',
      addressLocality: area.city,
      addressRegion: area.state,
      postalCode: area.zips[0],
      addressCountry: 'US',
    },
    geo: { '@type': 'GeoCoordinates', latitude: area.lat, longitude: area.lng },
    areaServed: area.zips.map(z => ({ '@type': 'PostalCodeRange', postalCode: z })),
    priceRange: 'Free',
  }

  return (
    <main id="main-content" style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: 1.6, color: '#1f2937' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />

      <nav style={{ marginBottom: 24, fontSize: 14 }}>
        <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>← Home</Link>
      </nav>

      <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>
        {area.name} Kosher Business Directory
      </h1>
      {area.hebrew && <p style={{ fontSize: 24, color: '#64748b', marginBottom: 16, direction: 'rtl' }}>{area.hebrew}</p>}

      <p style={{ fontSize: 18, color: '#475569', marginBottom: 32 }}>
        Covering ZIP codes: <strong>{area.zips.join(', ')}</strong> • {area.city}, {area.state}
      </p>

      <section style={{ background: '#f8fafc', padding: 24, borderRadius: 12, marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, marginTop: 0, marginBottom: 12 }}>📱 Find Businesses by SMS</h2>
        <p style={{ margin: '8px 0', fontSize: 17 }}>
          Text <a href="sms:+18885163399" style={{ color: '#2563eb', fontWeight: 600 }}>+1 (888) 516-3399</a> with what you need and your ZIP code:
        </p>
        <ul style={{ margin: '16px 0', paddingLeft: 20 }}>
          {area.categories.slice(0, 6).map(cat => (
            <li key={cat} style={{ margin: '6px 0', fontFamily: 'monospace', fontSize: 15 }}>
              &quot;{cat} {area.zips[0]}&quot;
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>About {area.name}</h2>
        <p>{area.intro}</p>
      </section>

      {area.landmarks && area.landmarks.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Notable {area.name} Landmarks</h2>
          <ul>
            {area.landmarks.map(l => <li key={l} style={{ margin: '4px 0' }}>{l}</li>)}
          </ul>
        </section>
      )}

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Services Available in {area.name}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {area.categories.map(cat => (
            <div key={cat} style={{ padding: '12px 16px', background: '#eff6ff', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1e40af', textTransform: 'capitalize' }}>{cat}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: '#dcfce7', padding: 24, borderRadius: 12, marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, marginTop: 0, marginBottom: 12 }}>🕐 Also Available by SMS</h2>
        <ul style={{ margin: 0 }}>
          <li><strong>Zmanim</strong> (halachic times): Text <code>zmanim {area.zips[0]}</code></li>
          <li><strong>Minyan / Shul times</strong>: Text <code>mincha {area.zips[0]}</code></li>
          <li><strong>Grocery specials</strong>: Text <code>SPECIALS</code></li>
          <li><strong>Jobs & workers</strong>: Text <code>JOBS</code></li>
        </ul>
      </section>

      <section style={{ borderTop: '1px solid #e5e7eb', paddingTop: 24 }}>
        <p style={{ fontSize: 16 }}>
          <strong>Own a business in {area.name}?</strong>{' '}
          <Link href="/add-business" style={{ color: '#2563eb' }}>Add your listing free</Link> or{' '}
          <Link href="/pricing" style={{ color: '#2563eb' }}>see paid placement options</Link>.
        </p>
      </section>
    </main>
  )
}
