import type { Metadata } from 'next'
import ArticleLayout from '@/components/ArticleLayout'

const SLUG = 'economy-of-trust'
const TITLE = 'The Economy of Trust'
const SUBTITLE = 'How SMS verification replaces the "Google search"'
const ABSTRACT =
  'A smartphone user can instantly Google a contractor, check Yelp, or verify a kashrus certificate. The kosher phone user cannot — which makes them a structural target for fraud. The same handset that protects the soul should also protect the wallet, and SMS verification is the way.'

export const metadata: Metadata = {
  title: TITLE,
  description: ABSTRACT,
  alternates: { canonical: `https://www.connect2kehilla.com/research/${SLUG}` },
  keywords: [
    'Consumer Protection',
    'Haredi Commerce',
    'Kosher Business Directory',
    'SMS Verification',
    'Connect2Kehilla',
    'Community Trust',
  ],
  openGraph: {
    title: TITLE,
    description: ABSTRACT,
    type: 'article',
    url: `https://www.connect2kehilla.com/research/${SLUG}`,
    authors: ['Levi Dombrovsky'],
  },
}

export default function Page() {
  return (
    <ArticleLayout
      slug={SLUG}
      title={TITLE}
      subtitle={SUBTITLE}
      abstract={ABSTRACT}
      publishedAt="2026-04-25"
      readingTime="5 min read"
    >
      <h2>The Vulnerability of the Unplugged</h2>
      <p>
        The Haredi community operates on a foundation of high interpersonal trust. However, in
        the modern marketplace, this trust is often exploited.
      </p>
      <p>
        A smartphone user can instantly &ldquo;Google&rdquo; a contractor, check Yelp reviews,
        or verify a company&apos;s legal status. A kosher phone user lacks this defense
        mechanism. Hebrew forums like <em>Behadrey Haredim</em> frequently report on{' '}
        <strong>sales scams</strong> and <strong>financial piracy</strong> that specifically
        target the Haredi street — perpetrators know these victims cannot easily verify claims
        online.
      </p>

      <h2>Censorship as a Shield, Information as a Sword</h2>
      <p>
        The informational vacuum creates a <em>security gap</em>. At Connect2Kehilla, we
        believe that the same phone that protects the soul from inappropriate content should
        also protect the wallet from fraud.
      </p>

      <h3>Building the &ldquo;safe perimeter&rdquo;</h3>
      <ul>
        <li>
          <strong>Vetted directory.</strong> Every business listed in the Connect2Kehilla
          directory (currently over 21,000 entries) undergoes an administrative review process.
          This creates a <em>white list</em> of community-approved vendors.
        </li>
        <li>
          <strong>SMS-based reviews.</strong> As proposed in our development roadmap,
          integrating user feedback via SMS allows the community to warn one another about
          unreliable services. If a business has a poor reputation, the kehilla knows it
          instantly via their handsets.
        </li>
        <li>
          <strong>Hashgacha verification.</strong> By partnering with rabbinical boards like
          the <strong>Beis Din of Crown Heights</strong>, we provide instant SMS verification
          for kashrus certificates. This eliminates the risk of forged certificates in
          restaurants and grocery stores.
        </li>
      </ul>

      <h2>Restoring the Balance</h2>
      <p>
        Connect2Kehilla isn&apos;t just a convenience — it is a consumer protection agency for
        the 21st-century Haredi world. We ensure that the choice to remain offline is a{' '}
        <em>position of strength</em>, not a position of vulnerability.
      </p>

      <h2>Sources</h2>
      <ul>
        <li>Israel Democracy Institute — <em>Consumer Habits and Financial Literacy in the Haredi Sector</em>, 2025.</li>
        <li>Beis Din of Crown Heights — guidelines for community technology and business standards.</li>
        <li>S. DellaPergola — <em>Jewish Population and Economic Trends</em>, Hebrew University of Jerusalem.</li>
      </ul>
    </ArticleLayout>
  )
}
