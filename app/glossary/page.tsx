import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Market Glossary — Kosher Tech & Jewish Community Terms',
  description:
    'Plain-English definitions of the niche terminology used in kosher technology, Haredi demographics, and Jewish community services — Kosher Phone, Haredi, Zmanim, Gmach, Kehilla, SMS Information Hub, and more.',
  alternates: { canonical: 'https://www.connect2kehilla.com/glossary' },
}

interface Term {
  term: string
  definition: string
  also?: string
}

const TERMS: Term[] = [
  {
    term: 'Gmach',
    definition:
      'Short for Gemilut Hasadim. A Jewish free-loan fund or community resource service that lends out items, money, or services without charge or interest. Gmachs cover everything from wedding gowns to baby cribs to short-term cash loans, and most operate on a phone-only, word-of-mouth basis — making them ideal for SMS distribution.',
    also: 'Hebrew: גמ"ח',
  },
  {
    term: 'Haredi (Ultra-Orthodox)',
    definition:
      'The most traditional branch of Orthodox Judaism, characterized by strict adherence to Halakha (Jewish law) and a focus on community-centric living. Haredim are the fastest-growing Jewish demographic, doubling roughly every 20 years, and form the core market for kosher technology and offline-first information services.',
    also: 'Hebrew: חֲרֵדִי',
  },
  {
    term: 'Kehilla',
    definition:
      'A Jewish community or congregation. Often serves as the primary social, financial, and support network for its members — kehillos run schools, mikvahs, charity funds, beit dins, simcha halls, and security patrols, frequently coordinated through low-tech communication channels.',
    also: 'Hebrew: קְהִלָּה',
  },
  {
    term: 'Kosher Phone',
    definition:
      'A mobile device with hardware or software modifications that block internet access, app stores, cameras, and non-approved messaging services. Authorized by rabbinic leadership, kosher phones come in two main forms: physically modified flip phones and certified kosher carriers that filter at the network level. Used by an estimated 1.7–1.8 million people globally.',
  },
  {
    term: 'SMS Information Hub',
    definition:
      'A centralized database of communal and commercial information accessible solely via text message — no app, no website, no login. Essential for users without data plans or smartphones. Connect2Kehilla is one example: a single SMS gateway that returns minyan times, business listings, weekly grocery specials, classifieds, and zmanim by ZIP code.',
  },
  {
    term: 'Zmanim',
    definition:
      'Specific times of the day for Jewish prayers and rituals, calculated based on the sun&rsquo;s position. Common zmanim include alos hashachar (dawn), netz (sunrise), sof zman shema (latest time to recite the Shema), mincha gedola, plag haminchah, shkiah (sunset), and tzeis hakochavim (nightfall). Zmanim shift daily and are location-dependent, so they&rsquo;re a natural fit for ZIP-coded SMS lookup.',
    also: 'Hebrew: זְמַנִּים',
  },
]

const ADDITIONAL_TERMS: Term[] = [
  {
    term: 'Beis Din',
    definition:
      'A rabbinical court that adjudicates disputes between members of the community according to Jewish law — covering business disputes, divorces, conversions, and kashrus certifications.',
    also: 'Hebrew: בֵּית דִּין',
  },
  {
    term: 'Hashgacha',
    definition:
      'Kosher certification — the supervision of a food production facility, restaurant, or product by a rabbinic authority. Major hashgacha agencies include the OU (Orthodox Union), OK Kosher, Star-K, Kof-K, and many local vaadim.',
    also: 'Hebrew: הַשְׁגָּחָה',
  },
  {
    term: 'Mikvah',
    definition:
      'A ritual bath used for purification, primarily by women monthly and by men before holidays. Every kehilla maintains at least one mikvah, often run as a community service with a phone-based scheduling system.',
    also: 'Hebrew: מִקְוֶה',
  },
  {
    term: 'Minyan',
    definition:
      'A quorum of ten Jewish adults required for communal prayer. Many shuls publish multiple minyan times per day — finding the next available minyan is one of the most common SMS lookup queries.',
    also: 'Hebrew: מִנְיָן',
  },
  {
    term: 'Shabbos / Shabbat',
    definition:
      'The Jewish Sabbath, observed from Friday sunset to Saturday nightfall. No electronics, commerce, or non-essential travel. Any service serving the Haredi market must be Shabbos-aware: stop sending messages, suspend automated alerts, and resume only after tzeis hakochavim.',
    also: 'Hebrew: שַׁבָּת',
  },
  {
    term: 'Shul',
    definition:
      'A synagogue. Often the social and operational center of a kehilla — many community announcements, simchas, and gemach listings originate from individual shuls.',
    also: 'Yiddish: שול',
  },
  {
    term: 'Simcha',
    definition:
      'A celebratory life-cycle event — wedding, bar/bat mitzvah, bris, vort, sheva brachos. Simchas drive a substantial portion of the Haredi service economy (catering, halls, gowns, photography, music) and are typically announced community-wide.',
    also: 'Hebrew: שִׂמְחָה',
  },
]

function TermSection({ heading, items }: { heading: string; items: Term[] }) {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">{heading}</h2>
      <dl className="space-y-8">
        {items.map(t => (
          <div key={t.term} id={t.term.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t.term}
            </h3>
            <dd className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.definition }} />
            {t.also && (
              <p className="text-sm text-gray-500 mt-2">{t.also}</p>
            )}
          </div>
        ))}
      </dl>
    </section>
  )
}

export default function GlossaryPage() {
  const allTerms = [...TERMS, ...ADDITIONAL_TERMS].sort((a, b) => a.term.localeCompare(b.term))

  const definedTermSchema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Connect2Kehilla Market Glossary',
    description: 'Definitions for kosher technology, Haredi demographics, and Jewish community services.',
    hasDefinedTerm: allTerms.map(t => ({
      '@type': 'DefinedTerm',
      name: t.term,
      description: t.definition.replace(/<[^>]+>/g, ''),
      inDefinedTermSet: 'https://www.connect2kehilla.com/glossary',
    })),
  }

  return (
    <main id="main-content" className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSchema) }}
      />

      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-white font-black text-xl">
            Connect<span className="text-emerald-500">2</span>Kehilla
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/research" className="text-gray-300 hover:text-white">Research</Link>
            <Link href="/" className="text-gray-300 hover:text-white">Home</Link>
          </div>
        </div>
      </nav>

      <header className="bg-gradient-to-br from-gray-50 to-white border-b border-gray-200 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-sm text-emerald-700 font-semibold uppercase tracking-wide mb-3">
            Reference
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-4">
            Market Glossary
          </h1>
          <p className="text-lg text-gray-700">
            Plain-English definitions of the terminology used in kosher technology, Haredi demographics,
            and Jewish community services. Built for investors, journalists, and operators new to the niche.
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <TermSection heading="Core Concepts" items={TERMS} />
        <TermSection heading="Community &amp; Religious Life" items={ADDITIONAL_TERMS} />

        <div className="mt-16 bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Want more depth?</h2>
          <p className="text-gray-700 mb-6">
            Our research articles unpack what these terms mean for businesses, investors, and operators.
          </p>
          <Link
            href="/research"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-lg"
          >
            Browse Research &amp; Insights →
          </Link>
        </div>
      </div>
    </main>
  )
}
