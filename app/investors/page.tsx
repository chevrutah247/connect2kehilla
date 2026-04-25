import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'For Investors & Partners — Connect2Kehilla',
  description:
    'Connect2Kehilla operates the only SMS-based information hub for the world\u2019s 1.7\u20131.8 million kosher-phone users \u2014 a high-trust, Haredi-Orthodox audience growing 3.5\u20134% annually. Unserved by apps, WhatsApp, and Google. Investment thesis, market sizing, expansion roadmap.',
  alternates: { canonical: 'https://www.connect2kehilla.com/investors' },
}

const STAT_PILLS = [
  { label: 'Total addressable market', value: '1.7\u20131.8M', sub: 'kosher-phone users globally' },
  { label: 'Annual growth', value: '3.5\u20134%', sub: 'doubling every 20 years' },
  { label: 'Direct competitors', value: '0', sub: 'no equivalent SMS service' },
  { label: 'Adoption in Israel', value: '84%', sub: 'of Haredim use kosher phones' },
]

interface Phase {
  num: string
  region: string
  status: 'Active' | 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Phase 4'
  population: string
  users: string
  notes: string
}

const PHASES: Phase[] = [
  {
    num: '01',
    region: 'New York Metro (Brooklyn, Monsey, Lakewood NJ)',
    status: 'Active',
    population: '~350,000',
    users: '200\u2013280,000',
    notes:
      'Current operating market. 18,000+ businesses indexed, daily SMS traffic, Beis Din of Crown Heights recognition.',
  },
  {
    num: '02',
    region: 'Other US Haredi communities',
    status: 'Phase 1',
    population: '~350,000',
    users: '200\u2013250,000',
    notes:
      'Five Towns, Far Rockaway, Passaic, Teaneck, Baltimore, Cleveland, Los Angeles, Miami. Same SMS infrastructure, region-specific business data.',
  },
  {
    num: '03',
    region: 'Israel',
    status: 'Phase 2',
    population: '~1,450,000',
    users: '~1.2M',
    notes:
      'Largest single addressable region. Hebrew + Yiddish SMS already live in core architecture. 84% kosher-phone adoption per IDI 2025.',
  },
  {
    num: '04',
    region: 'United Kingdom + Belgium',
    status: 'Phase 3',
    population: '~91,000',
    users: '~60,000',
    notes:
      'Stamford Hill, Manchester, Gateshead, Antwerp Diamond District. High kosher-phone density.',
  },
  {
    num: '05',
    region: 'Canada + Australia + others',
    status: 'Phase 4',
    population: '~60,000',
    users: '~30,000',
    notes:
      'Montreal, Toronto, Sydney, Melbourne. Long-tail rollout once core English-speaking markets are established.',
  },
]

export default function InvestorsPage() {
  const investorSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'For Investors & Partners — Connect2Kehilla',
    description: metadata.description,
    about: {
      '@type': 'Organization',
      name: 'Connect2Kehilla',
      '@id': 'https://www.connect2kehilla.com/#organization',
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: 'https://www.connect2kehilla.com/opengraph-image',
    },
  }

  return (
    <main id="main-content" className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(investorSchema) }} />

      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-white font-black text-xl">
            Connect<span className="text-emerald-500">2</span>Kehilla
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/research" className="text-gray-300 hover:text-white">Research</Link>
            <Link href="/" className="text-gray-300 hover:text-white">Home</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="bg-gradient-to-br from-slate-900 via-blue-950 to-emerald-950 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-emerald-300 font-bold uppercase tracking-widest text-sm mb-4">
            For Investors &amp; Partners
          </p>
          <h1 className="text-4xl md:text-6xl font-black mb-5 leading-tight">
            The world&apos;s last large, growing audience —{' '}
            <span className="text-emerald-400">unreachable by every other channel.</span>
          </h1>
          <p className="text-xl text-blue-100 leading-relaxed max-w-3xl mb-8">
            Connect2Kehilla is the only SMS-based information hub serving the global Haredi
            community&apos;s 1.7&ndash;1.8 million kosher-phone users — a high-trust, family-driven
            audience with no Facebook ads, no Google search, no WhatsApp, and no app store.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:list@connect2kehilla.com?subject=Connect2Kehilla%20%E2%80%94%20Investor%20enquiry"
              className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-6 py-3 rounded-lg"
            >
              📧 Contact for partnerships
            </a>
            <Link
              href="/research/kosher-phone-market-2026"
              className="inline-block bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-6 py-3 rounded-lg"
            >
              📑 Read the full market report
            </Link>
          </div>
        </div>
      </header>

      {/* Stat pills */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STAT_PILLS.map(s => (
            <div key={s.label} className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
              <p className="text-xs uppercase tracking-wide text-emerald-700 font-bold mb-2">{s.label}</p>
              <p className="text-3xl md:text-4xl font-black text-gray-900 mb-1">{s.value}</p>
              <p className="text-xs text-gray-600">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Three thesis pillars */}
      <section className="bg-gray-50 border-y border-gray-200 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-12 text-center">
            Investment thesis
          </h2>

          <div className="space-y-10">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="text-4xl flex-shrink-0">🎯</div>
                <div>
                  <p className="text-emerald-700 font-bold uppercase tracking-wide text-xs mb-1">Pillar 1</p>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Unserved market</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    Kosher-phone users cannot use websites, apps, social media, or WhatsApp. The
                    entire $100B+ digital advertising stack — Meta, Google, TikTok, programmatic —
                    is invisible to them. No competitor can buy traffic to reach this audience,
                    because there is no traffic to buy.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Connect2Kehilla operates inside the SMS layer that this community already
                    uses daily. We are not competing with apps; we are the only channel that
                    works.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="text-4xl flex-shrink-0">📈</div>
                <div>
                  <p className="text-emerald-700 font-bold uppercase tracking-wide text-xs mb-1">Pillar 2</p>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Growth — fastest-growing Jewish demographic
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    The Haredi population grows 3.5&ndash;4% annually, doubling every 20 years.
                    By 2040, one in five Jews globally will be Haredi (JPR, 2022). The kosher-phone
                    user count rises in parallel — projected to roughly double to 3&ndash;4 million
                    by 2040.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Family sizes average 5&ndash;8 children. Generational adoption is automatic.
                    The audience is not just stable — it&apos;s compounding.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="text-4xl flex-shrink-0">🌍</div>
                <div>
                  <p className="text-emerald-700 font-bold uppercase tracking-wide text-xs mb-1">Pillar 3</p>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Scalability — same SMS protocol, every market
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    The infrastructure works in any country with a GSM network and a Twilio
                    presence. The expansion challenge is local data, not new technology. We
                    already support English, Hebrew, and Yiddish.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Roadmap: New York → US-wide → Israel → UK + Belgium → Canada + Australia.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expansion table */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 text-center">
          Geographic roadmap
        </h2>
        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
          The scaling sequence reflects market size, kosher-phone adoption, and language coverage.
        </p>

        <div className="space-y-3">
          {PHASES.map(p => (
            <div
              key={p.num}
              className="grid grid-cols-12 gap-4 items-center bg-white border border-gray-200 rounded-xl p-5 hover:border-emerald-300 transition"
            >
              <div className="col-span-2 md:col-span-1 text-center">
                <div className="text-3xl font-black text-emerald-600">{p.num}</div>
              </div>
              <div className="col-span-7 md:col-span-5">
                <h3 className="font-bold text-gray-900 leading-tight">{p.region}</h3>
                <p className="text-sm text-gray-600 mt-1">{p.notes}</p>
              </div>
              <div className="col-span-3 md:col-span-2 text-right md:text-left">
                <span
                  className={`inline-block text-xs font-bold uppercase px-2 py-1 rounded ${
                    p.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <div className="hidden md:block md:col-span-2 text-sm">
                <p className="text-gray-500 text-xs">Population</p>
                <p className="font-semibold text-gray-900">{p.population}</p>
              </div>
              <div className="hidden md:block md:col-span-2 text-sm">
                <p className="text-gray-500 text-xs">Kosher-phone users</p>
                <p className="font-semibold text-gray-900">{p.users}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          Source figures: JPR (2022), IDI (2025), DellaPergola (Hebrew University), Pew Research (2025).
          Full citations in the{' '}
          <Link href="/research/kosher-phone-market-2026" className="text-emerald-700 hover:underline font-semibold">
            market report
          </Link>.
        </p>
      </section>

      {/* What we offer partners */}
      <section className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-3">What partnership looks like</h2>
          <p className="text-emerald-100 mb-10 text-lg">
            We are open to strategic, distribution, and capital partnerships from organizations
            that take this market seriously.
          </p>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                emoji: '🤝',
                title: 'Strategic partners',
                desc:
                  'Kosher carriers, kashrus agencies, community organizations, and rabbinical bodies looking to extend their reach via SMS.',
              },
              {
                emoji: '📣',
                title: 'Brand placements',
                desc:
                  'Premium SMS listings, sponsored Specials, and category sponsorships for businesses serving the Haredi market.',
              },
              {
                emoji: '💰',
                title: 'Capital partners',
                desc:
                  'Operators and investors who understand offline-first infrastructure and want to participate in the international rollout.',
              },
            ].map(p => (
              <div key={p.title} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
                <div className="text-4xl mb-3">{p.emoji}</div>
                <h3 className="text-xl font-bold mb-2">{p.title}</h3>
                <p className="text-emerald-100 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
          Want to talk?
        </h2>
        <p className="text-gray-700 mb-8 leading-relaxed">
          We respond personally to every serious enquiry. Tell us who you represent and what
          you&apos;d like to explore.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:list@connect2kehilla.com?subject=Connect2Kehilla%20%E2%80%94%20Investor%2FPartner%20enquiry"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-3.5 rounded-lg"
          >
            📧 list@connect2kehilla.com
          </a>
          <a
            href="tel:+18885163399"
            className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-7 py-3.5 rounded-lg border border-gray-300"
          >
            📞 (888) 516-3399
          </a>
        </div>
        <p className="text-sm text-gray-500 mt-8">
          Prefer to start with the data?{' '}
          <Link href="/research" className="text-emerald-700 hover:underline font-semibold">
            Browse our research →
          </Link>
        </p>
      </section>
    </main>
  )
}
