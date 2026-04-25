import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Research & Insights — Kosher Phone & Haredi Market',
  description:
    'In-depth research on the global Haredi (ultra-Orthodox) population, kosher phone adoption, and the offline-first technology serving 1.7+ million observant Jews. Editorial by Levi Dombrovsky, Founder of Connect2Kehilla.',
  alternates: { canonical: 'https://www.connect2kehilla.com/research' },
}

interface ArticleMeta {
  slug: string
  title: string
  subtitle?: string
  abstract: string
  publishedAt: string
  readingTime: string
  category: 'Foundations' | 'Market & Opportunity' | 'Reports'
  featured?: boolean
}

const ARTICLES: ArticleMeta[] = [
  {
    slug: 'kosher-phone-market-2026',
    title: 'The Kosher Phone Market: Size, Demographics & Opportunity',
    subtitle: 'Connect2Kehilla Market Research Report — April 2026',
    abstract:
      'Definitive 14-minute report: world Jewish demographics, the Haredi growth curve, kosher-phone adoption by region, expansion roadmap, and full source citations.',
    publishedAt: '2026-04-01',
    readingTime: '14 min read',
    category: 'Reports',
    featured: true,
  },
  {
    slug: 'what-is-a-kosher-phone',
    title: 'What Is a Kosher Phone?',
    subtitle: 'A simple technology with a profound purpose',
    abstract:
      'How a 2004 rabbinical commission in Israel quietly engineered the device that protects Haredi family life from the open internet — and why hundreds of thousands of non-Jews now buy one.',
    publishedAt: '2026-04-22',
    readingTime: '6 min read',
    category: 'Foundations',
  },
  {
    slug: 'why-kosher-phones-exist',
    title: 'Why Kosher Phones Exist',
    subtitle: 'The problem they were built to solve',
    abstract:
      'Two years before the iPhone shipped, Israeli rabbinic authorities had already built the answer. The kosher phone is not a rejection of modernity — it is a 20-year-old negotiation with it.',
    publishedAt: '2026-04-22',
    readingTime: '6 min read',
    category: 'Foundations',
  },
  {
    slug: 'evolution-of-kosher-tech',
    title: 'The Evolution of Kosher Tech',
    subtitle: 'From blockades to ecosystems',
    abstract:
      'For decades the kosher phone was defined by what it couldn\u2019t do. Today the architecture has shifted — toward intentional connectivity, structured information, and SMS-first community services.',
    publishedAt: '2026-04-10',
    readingTime: '5 min read',
    category: 'Foundations',
  },
  {
    slug: 'why-the-kosher-phone-market-matters',
    title: 'Why the Kosher Phone Market Matters',
    subtitle: 'A community invisible to the digital world',
    abstract:
      '1.5 to 1.8 million observant Jews are systematically invisible to apps, search engines, and social media. They have urgent information needs. There is no service in the world built to meet them — yet.',
    publishedAt: '2026-04-23',
    readingTime: '6 min read',
    category: 'Market & Opportunity',
  },
  {
    slug: 'why-the-kosher-phone-market-grows',
    title: 'Why the Kosher Phone Market Will Keep Growing',
    subtitle: 'Three forces that will shape the next twenty years',
    abstract:
      'The Haredi population doubles every 20 years. The kosher-phone ecosystem is professionalizing, not retreating. And the rest of the world is catching up to the questions Haredi communities answered two decades ago.',
    publishedAt: '2026-04-24',
    readingTime: '7 min read',
    category: 'Market & Opportunity',
  },
  {
    slug: 'sms-vs-apps-psychology',
    title: 'Why SMS Outperforms Apps in 2026',
    subtitle: 'The psychology of offline communities',
    abstract:
      'In a world drowning in notifications, the kosher phone user gets ~5 SMS a day — and reads every one. The constraint is the feature, and it produces the highest-trust communication channel in modern marketing.',
    publishedAt: '2026-04-15',
    readingTime: '4 min read',
    category: 'Market & Opportunity',
  },
  {
    slug: 'haredi-economic-potential',
    title: 'The Economic Potential of the Haredi Economy',
    subtitle: 'The invisible $billions',
    abstract:
      'A loyal, family-driven, fast-growing audience that conventional digital advertising cannot reach. Where the spend concentrates, why brands miss it, and what bridging the gap looks like.',
    publishedAt: '2026-04-20',
    readingTime: '4 min read',
    category: 'Market & Opportunity',
  },
  {
    slug: 'digital-ghetto-paradox',
    title: 'The Digital Ghetto Paradox',
    subtitle: 'How religious stringency created a modern information vacuum',
    abstract:
      '84% of Haredim use kosher phones; 95% of essential services are digitized. The gap between those two numbers is the cost of holiness — and the reason an SMS information layer is no longer optional.',
    publishedAt: '2026-04-25',
    readingTime: '6 min read',
    category: 'Market & Opportunity',
  },
  {
    slug: 'psychology-of-disconnection',
    title: 'The Psychology of Disconnection',
    subtitle: 'Why "offline" shouldn\u2019t mean "out of the loop"',
    abstract:
      'Why brands assume the kosher-phone user doesn\u2019t exist, why that\u2019s wrong, and how the rabbinical mandate for clean technology actually demands better community infrastructure — not less of it.',
    publishedAt: '2026-04-25',
    readingTime: '5 min read',
    category: 'Market & Opportunity',
  },
]

const CATEGORY_META: Record<ArticleMeta['category'], { label: string; pill: string; tagline: string }> = {
  Reports: {
    label: 'Reports',
    pill: 'bg-amber-100 text-amber-900 border-amber-300',
    tagline: 'Long-form, fully cited primary research.',
  },
  Foundations: {
    label: 'Foundations',
    pill: 'bg-blue-100 text-blue-900 border-blue-300',
    tagline: 'What kosher phones are, how they came to be, where they\u2019re going.',
  },
  'Market & Opportunity': {
    label: 'Market & Opportunity',
    pill: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    tagline: 'Demographics, economics, and the unserved-market thesis.',
  },
}

const CATEGORY_ORDER: ArticleMeta['category'][] = ['Reports', 'Foundations', 'Market & Opportunity']

const AUTHOR_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://www.connect2kehilla.com/research#author',
  name: 'Levi Dombrovsky',
  jobTitle: 'Founder, Connect2Kehilla',
  worksFor: { '@type': 'Organization', '@id': 'https://www.connect2kehilla.com/#organization' },
  homeLocation: { '@type': 'Place', name: 'Crown Heights, Brooklyn, New York' },
  knowsAbout: [
    'Kosher phones',
    'Haredi (ultra-Orthodox) demographics',
    'SMS-based information services',
    'Offline-first technology',
    'Jewish community infrastructure',
  ],
  url: 'https://www.connect2kehilla.com/research',
}

export default function ResearchHubPage() {
  const featured = ARTICLES.find(a => a.featured)
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Connect2Kehilla Research & Insights',
    itemListElement: ARTICLES.map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://www.connect2kehilla.com/research/${a.slug}`,
      name: a.title,
    })),
  }

  return (
    <main id="main-content" className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(AUTHOR_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-white font-black text-xl">
            Connect<span className="text-emerald-500">2</span>Kehilla
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/investors" className="text-gray-300 hover:text-white">For Investors</Link>
            <Link href="/glossary" className="text-gray-300 hover:text-white">Glossary</Link>
            <Link href="/" className="text-gray-300 hover:text-white">Home</Link>
          </div>
        </div>
      </nav>

      {/* ── Editorial masthead ──────────────────────────────────────── */}
      <header className="bg-white border-b-4 border-gray-900">
        <div className="max-w-5xl mx-auto px-4 pt-12 pb-8">
          <div className="flex items-center justify-between mb-3 text-sm">
            <p className="text-emerald-700 font-bold uppercase tracking-[0.25em]">
              Connect2Kehilla &middot; Research &amp; Insights
            </p>
            <p className="hidden md:block text-gray-500 italic">Vol. I, No. 1 &middot; April 2026</p>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-[1.05] tracking-tight">
            Editorial research on the world&apos;s last large offline-first audience.
          </h1>
          <p className="mt-5 text-lg md:text-xl text-gray-700 max-w-3xl leading-relaxed">
            Ten in-depth pieces by{' '}
            <Link href="#author" className="text-emerald-700 font-semibold hover:underline">
              Levi Dombrovsky
            </Link>{' '}
            — Founder of Connect2Kehilla, writing from Crown Heights, Brooklyn —
            on the people, technology, and economics of kosher phones and the Haredi market.
          </p>
        </div>

        {/* Editorial credentials strip */}
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <p className="text-2xl font-black text-gray-900">10</p>
              <p className="text-gray-600 text-xs uppercase tracking-wide">Articles</p>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">10+</p>
              <p className="text-gray-600 text-xs uppercase tracking-wide">Cited sources</p>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">1.7M+</p>
              <p className="text-gray-600 text-xs uppercase tracking-wide">Audience studied</p>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">2026</p>
              <p className="text-gray-600 text-xs uppercase tracking-wide">First edition</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Featured ─────────────────────────────────────────────────── */}
      {featured && (
        <section className="max-w-5xl mx-auto px-4 py-14">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-700 font-bold mb-3">
            ✦ Featured Report
          </p>
          <Link href={`/research/${featured.slug}`} className="block group">
            <div className="grid md:grid-cols-3 gap-8 items-start border-y border-gray-300 py-8">
              <div className="md:col-span-2">
                <span className={`inline-block text-xs font-bold uppercase tracking-wide px-3 py-1 rounded border ${CATEGORY_META[featured.category].pill} mb-3`}>
                  {CATEGORY_META[featured.category].label}
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 group-hover:text-emerald-700 transition leading-tight mb-2">
                  {featured.title}
                </h2>
                {featured.subtitle && (
                  <p className="text-xl text-gray-600 italic mb-4">{featured.subtitle}</p>
                )}
                <p className="text-gray-700 leading-relaxed mb-4">{featured.abstract}</p>
                <p className="text-sm text-gray-500">
                  By <strong className="text-gray-900">Levi Dombrovsky</strong>{' '}
                  &middot;{' '}
                  <time dateTime={featured.publishedAt}>
                    {new Date(featured.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </time>{' '}
                  &middot; {featured.readingTime}
                </p>
              </div>
              <div className="md:col-span-1 bg-gradient-to-br from-amber-50 via-white to-emerald-50 border border-gray-200 rounded-xl p-5 text-center">
                <div className="text-5xl mb-2">📑</div>
                <p className="font-bold text-gray-900 mb-1">Read the report</p>
                <p className="text-sm text-gray-600 mb-4">14 min · 5 tables · 10 sources</p>
                <span className="inline-block bg-emerald-600 group-hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg transition">
                  Open →
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ── Articles by category ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 pb-14">
        {CATEGORY_ORDER.map(cat => {
          const list = ARTICLES.filter(a => a.category === cat && !a.featured)
          if (list.length === 0) return null
          const meta = CATEGORY_META[cat]
          return (
            <div key={cat} className="mb-16 first:mt-0">
              <div className="flex items-baseline justify-between gap-4 border-b-2 border-gray-900 pb-2 mb-6 flex-wrap">
                <h2 className="text-2xl md:text-3xl font-black text-gray-900">{meta.label}</h2>
                <p className="text-sm text-gray-600 italic">{meta.tagline}</p>
              </div>
              <div className="divide-y divide-gray-200">
                {list.map((a, i) => (
                  <Link
                    key={a.slug}
                    href={`/research/${a.slug}`}
                    className="flex flex-col md:flex-row md:items-baseline gap-3 md:gap-6 py-6 group"
                  >
                    <div className="md:w-12 md:flex-shrink-0">
                      <p className="text-3xl font-black text-gray-300 group-hover:text-emerald-600 transition">
                        {String(i + 1).padStart(2, '0')}
                      </p>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-emerald-700 transition leading-snug mb-1">
                        {a.title}
                      </h3>
                      {a.subtitle && (
                        <p className="text-gray-500 italic mb-2">{a.subtitle}</p>
                      )}
                      <p className="text-gray-700 text-sm leading-relaxed mb-3 max-w-2xl">{a.abstract}</p>
                      <p className="text-xs text-gray-500">
                        <time dateTime={a.publishedAt}>
                          {new Date(a.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </time>
                        {' · '}
                        {a.readingTime}
                        {' · '}
                        <span className="text-emerald-700 font-semibold group-hover:underline">Read →</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </section>

      {/* ── About the author ─────────────────────────────────────────── */}
      <section id="author" className="bg-gray-900 text-white py-16 px-4 border-t-4 border-emerald-500">
        <div className="max-w-5xl mx-auto">
          <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-3">About the author</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 flex flex-col items-center md:items-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/levi-dombrovsky.jpg"
                alt="Levi Dombrovsky, Founder of Connect2Kehilla"
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover mb-4 shadow-2xl border-4 border-emerald-500"
              />
              <p className="text-2xl font-black text-white">Levi Dombrovsky</p>
              <p className="text-emerald-300 font-semibold text-sm">Founder, Connect2Kehilla</p>
              <p className="text-gray-400 text-xs mt-1">📍 Crown Heights, Brooklyn</p>
            </div>
            <div className="md:col-span-2 text-gray-200 leading-relaxed space-y-4">
              <p>
                Levi Dombrovsky founded Connect2Kehilla to build community information
                infrastructure for the world&apos;s 1.7+ million kosher-phone users — a
                population that conventional digital marketing, search engines, and social
                platforms cannot reach.
              </p>
              <p>
                His research focuses on the intersection of Haredi demographics, kosher
                technology, and offline-first system design. He writes from Crown Heights,
                Brooklyn — one of the largest Hasidic neighborhoods in the United States and
                home to Chabad-Lubavitch&apos;s global headquarters.
              </p>
              <p className="text-sm text-gray-400 border-l-2 border-emerald-500 pl-4 italic">
                Connect2Kehilla is recognized by the <strong className="text-white not-italic">Beis
                Din of Crown Heights</strong> as a valuable and appropriate service for the
                community.
              </p>
              <div className="flex flex-wrap gap-3 pt-4">
                <a
                  href="mailto:list@connect2kehilla.com"
                  className="inline-block bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-bold px-5 py-2.5 rounded-lg"
                >
                  📧 Contact the author
                </a>
                <Link
                  href="/glossary"
                  className="inline-block border border-white/30 hover:bg-white/10 text-white font-bold px-5 py-2.5 rounded-lg"
                >
                  📖 Niche glossary
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
