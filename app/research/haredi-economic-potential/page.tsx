import type { Metadata } from 'next'
import ArticleLayout from '@/components/ArticleLayout'

const SLUG = 'haredi-economic-potential'
const TITLE = 'The Economic Potential of the Haredi Economy: The Invisible $Billions'
const ABSTRACT =
  'Businesses often overlook the Haredi sector due to a lack of digital footprints. With the population doubling every 20 years, the purchasing power of this community is becoming impossible to ignore.'

export const metadata: Metadata = {
  title: TITLE,
  description: ABSTRACT,
  alternates: { canonical: `https://www.connect2kehilla.com/research/${SLUG}` },
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
      abstract={ABSTRACT}
      publishedAt="2026-04-20"
      readingTime="4 min read"
    >
      <p>
        The Haredi population is the fastest-growing Jewish demographic, increasing at{' '}
        <strong>3.5–4% annually</strong>. By 2040, one in five Jews globally will be Haredi. This
        demographic shift is concentrated in high-density economic zones — the New York metro
        area (~700,000 people) and Israel (1.45M people) — and it is happening largely outside
        the reach of conventional digital advertising.
      </p>

      <h2>Where the Population Lives Today</h2>
      <table>
        <thead>
          <tr>
            <th>Region</th>
            <th>Haredi population</th>
            <th>Share of local Jewish community</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Israel</td><td>1,452,350</td><td>14.3% of Israelis</td></tr>
          <tr><td>United States</td><td>~700,000</td><td>~11% of US Jews</td></tr>
          <tr><td>United Kingdom</td><td>~76,000</td><td>~25% of UK Jews</td></tr>
          <tr><td>Belgium</td><td>~15,000</td><td>~50% of Belgian Jews</td></tr>
          <tr><td>Canada</td><td>~30,000</td><td>~8% of Canadian Jews</td></tr>
        </tbody>
      </table>
      <p className="text-sm text-gray-500">
        Source: JPR (2022), IDI (2025), Pew Research Center (2025).
      </p>

      <h2>Why It&apos;s Invisible</h2>
      <p>
        The kosher phone user — estimated at <strong>1.7 to 1.8 million individuals</strong> —
        does not see Facebook ads, Google search results, Instagram reels, or YouTube
        pre-roll. From the perspective of conventional digital marketing, this audience does
        not exist. The result is an unintentional moat: brands that figure out how to reach the
        community capture mindshare with effectively zero competition.
      </p>

      <h2>Where the Spend Concentrates</h2>
      <p>
        Haredi households are typically large (5–8 children average), centered around
        community institutions, and spend disproportionately on:
      </p>
      <ul>
        <li><strong>Kosher groceries</strong> — multiple weekly supermarket visits per family</li>
        <li><strong>Education</strong> — yeshiva and school tuition is a major line item</li>
        <li><strong>Apparel</strong> — modest dress codes drive a specialty retail sector</li>
        <li><strong>Simchas</strong> — weddings, bar mitzvahs, and brisses sustain a full event-services economy (catering, halls, photographers, gowns)</li>
        <li><strong>Real estate</strong> — community geography drives concentrated demand in Williamsburg, Boro Park, Lakewood, Monsey, Five Towns, and similar enclaves</li>
      </ul>

      <h2>The Trajectory</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>2025</th>
            <th>2040 (projected)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Global Haredi population</td><td>~2.1M</td><td>~4.2M</td></tr>
          <tr><td>Israel Haredi share</td><td>14.3%</td><td>~16%</td></tr>
          <tr><td>Haredi share of world Jewry</td><td>14%</td><td>&gt;20%</td></tr>
          <tr><td>Estimated kosher-phone users</td><td>1.5–1.8M</td><td>3–4M</td></tr>
        </tbody>
      </table>
      <p className="text-sm text-gray-500">
        Source: JPR (2022), Israel CBS / IDI (2025), DellaPergola (Hebrew University), Pew (2025).
      </p>

      <h2>The Opportunity</h2>
      <p>
        Investing in this niche means gaining access to a loyal, family-oriented consumer base
        that relies on SMS directories for everything from <em>Gmach</em> (community loans) to
        retail <em>Specials</em>. The economic potential lies in bridging the gap between
        traditional commerce and an offline-first audience — and doing it before the moat closes.
      </p>

      <h2>Key Sources</h2>
      <ul>
        <li>Sergio DellaPergola, Hebrew University of Jerusalem.</li>
        <li>Times of Israel, <em>By 2050, almost one in four Israelis will be ultra-Orthodox</em>, 2026.</li>
        <li>Pew Research Center, <em>Religious Composition of the World 2010–2020</em>, 2025.</li>
      </ul>
    </ArticleLayout>
  )
}
