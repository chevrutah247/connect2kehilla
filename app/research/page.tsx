import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Research & Insights — Kosher Phone & Haredi Market',
  description:
    'Deep-dive market research on the global Haredi (ultra-Orthodox) population, kosher phone adoption, and offline-first technology — from Connect2Kehilla.',
  alternates: { canonical: 'https://www.connect2kehilla.com/research' },
}

interface ArticleMeta {
  slug: string
  title: string
  abstract: string
  publishedAt: string
  readingTime: string
  category: 'Market Report' | 'Analysis' | 'Demographics'
}

const ARTICLES: ArticleMeta[] = [
  {
    slug: 'kosher-phone-market-2026',
    title: 'The Kosher Phone Market: Size, Demographics & Opportunity',
    abstract:
      'A full market report on the global Jewish population, the Haredi community, and the prevalence of kosher phone usage — defining the total addressable market for offline-first SMS services.',
    publishedAt: '2026-04-01',
    readingTime: '14 min read',
    category: 'Market Report',
  },
  {
    slug: 'evolution-of-kosher-tech',
    title: 'The Evolution of Kosher Tech: From Blockades to Ecosystems',
    abstract:
      'For decades the "Kosher Phone" was defined by what it couldn\'t do. Today, technology is being redesigned to serve a community that rejects the open internet but demands efficient communication.',
    publishedAt: '2026-04-10',
    readingTime: '5 min read',
    category: 'Analysis',
  },
  {
    slug: 'sms-vs-apps-psychology',
    title: 'The Psychology of Offline Communities: Why SMS Outperforms Apps in 2026',
    abstract:
      'While the world suffers from "app fatigue" and notification overload, the Haredi community has maintained a high-trust, high-attention communication channel: the SMS.',
    publishedAt: '2026-04-15',
    readingTime: '4 min read',
    category: 'Analysis',
  },
  {
    slug: 'haredi-economic-potential',
    title: 'The Economic Potential of the Haredi Economy: The Invisible $Billions',
    abstract:
      'Businesses often overlook the Haredi sector due to a lack of digital footprints. With the population doubling every 20 years, the purchasing power of this community is becoming impossible to ignore.',
    publishedAt: '2026-04-20',
    readingTime: '4 min read',
    category: 'Demographics',
  },
]

const CATEGORY_COLORS: Record<ArticleMeta['category'], string> = {
  'Market Report': 'bg-emerald-100 text-emerald-800',
  Analysis: 'bg-blue-100 text-blue-800',
  Demographics: 'bg-purple-100 text-purple-800',
}

export default function ResearchHubPage() {
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-white font-black text-xl">
            Connect<span className="text-emerald-500">2</span>Kehilla
          </Link>
          <Link href="/" className="text-gray-300 hover:text-white text-sm">
            ← Home
          </Link>
        </div>
      </nav>

      <header className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-emerald-200 font-semibold uppercase tracking-wider mb-3 text-sm">
            Research &amp; Insights
          </p>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Market research on the world&apos;s most offline-connected community
          </h1>
          <p className="text-xl text-emerald-100 leading-relaxed">
            Original analysis from Connect2Kehilla on Haredi demographics, kosher phone adoption,
            and the economic potential of an audience that operates outside the open internet.
          </p>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          {ARTICLES.map(a => (
            <Link
              key={a.slug}
              href={`/research/${a.slug}`}
              className="group block bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-emerald-400 hover:shadow-xl transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded ${CATEGORY_COLORS[a.category]}`}>
                  {a.category}
                </span>
                <span className="text-xs text-gray-500">{a.readingTime}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition mb-3 leading-snug">
                {a.title}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {a.abstract}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <time dateTime={a.publishedAt}>
                  {new Date(a.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </time>
                <span className="text-emerald-700 font-semibold group-hover:translate-x-0.5 transition">
                  Read →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Why this research exists</h2>
          <p className="text-gray-700 max-w-2xl mx-auto leading-relaxed">
            The Haredi community is the fastest-growing Jewish demographic — yet it&apos;s almost
            invisible to digital marketers, investors, and policy researchers. Connect2Kehilla
            operates inside this community as an SMS information hub, and we publish what we
            learn.
          </p>
          <Link
            href="/glossary"
            className="inline-block mt-6 text-emerald-700 font-bold hover:text-emerald-800"
          >
            Browse the niche glossary →
          </Link>
        </div>
      </section>
    </main>
  )
}
