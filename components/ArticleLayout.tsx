import Link from 'next/link'
import WhitepaperDownload from './WhitepaperDownload'

interface Props {
  title: string
  subtitle?: string
  abstract?: string
  publishedAt: string // ISO date
  readingTime?: string
  slug: string
  children: React.ReactNode
}

const AUTHOR = {
  name: 'Levi Dombrovsky',
  url: 'https://www.connect2kehilla.com/research',
  jobTitle: 'Market Research Lead, Connect2Kehilla',
}

export default function ArticleLayout({ title, subtitle, abstract, publishedAt, readingTime, slug, children }: Props) {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: abstract,
    datePublished: publishedAt,
    dateModified: publishedAt,
    author: {
      '@type': 'Person',
      name: AUTHOR.name,
      jobTitle: AUTHOR.jobTitle,
      url: AUTHOR.url,
      worksFor: {
        '@type': 'Organization',
        name: 'Connect2Kehilla',
        url: 'https://www.connect2kehilla.com',
      },
    },
    publisher: {
      '@type': 'Organization',
      name: 'Connect2Kehilla',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.connect2kehilla.com/favicon.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.connect2kehilla.com/research/${slug}`,
    },
  }

  return (
    <main id="main-content" className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-white font-black text-xl">
            Connect<span className="text-emerald-500">2</span>Kehilla
          </Link>
          <Link href="/research" className="text-gray-300 hover:text-white text-sm">
            ← All Research
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-10">
          <p className="text-sm text-emerald-700 font-semibold uppercase tracking-wide mb-3">
            Research &amp; Insights
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-4">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl text-gray-600 mb-6">{subtitle}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 border-y border-gray-200 py-3">
            <span>By <strong className="text-gray-900">{AUTHOR.name}</strong></span>
            <span>•</span>
            <time dateTime={publishedAt}>
              {new Date(publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
            {readingTime && (<><span>•</span><span>{readingTime}</span></>)}
          </div>
          {abstract && (
            <p className="mt-6 text-lg text-gray-700 italic border-l-4 border-emerald-500 pl-4">
              {abstract}
            </p>
          )}
        </header>

        <div className="prose prose-lg prose-gray max-w-none
          prose-headings:font-bold prose-headings:text-gray-900
          prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
          prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-gray-700 prose-p:leading-relaxed
          prose-a:text-emerald-700 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-gray-900
          prose-table:text-sm
          prose-th:bg-gray-100 prose-th:text-left prose-th:font-semibold prose-th:px-3 prose-th:py-2 prose-th:border prose-th:border-gray-300
          prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-gray-200
          prose-li:text-gray-700">
          {children}
        </div>

        <footer className="mt-16 pt-8 border-t border-gray-200">
          <WhitepaperDownload variant="inline" source={`article:${slug}`} />

          <div className="flex items-start gap-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xl">
              LD
            </div>
            <div>
              <p className="font-bold text-gray-900">{AUTHOR.name}</p>
              <p className="text-sm text-gray-600">{AUTHOR.jobTitle}</p>
              <p className="text-sm text-gray-500 mt-1">
                Researches the intersection of Haredi demographics and offline-first technology.
              </p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              See the underlying SMS service in action
            </h3>
            <p className="text-gray-700 mb-4">
              Connect2Kehilla powers a free directory for 1.7M+ kosher-phone users.
            </p>
            <a
              href="sms:+18885163399"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-lg"
            >
              📱 Text (888) 516-3399
            </a>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            <Link href="/research" className="hover:text-gray-700">← Back to Research &amp; Insights</Link>
          </p>
        </footer>
      </article>
    </main>
  )
}
