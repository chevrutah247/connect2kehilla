import type { Metadata } from 'next'
import ArticleLayout from '@/components/ArticleLayout'

const SLUG = 'kosher-phone-market-2026'
const TITLE = 'The Kosher Phone Market: Size, Demographics & Opportunity'
const SUBTITLE = 'Connect2Kehilla Market Research Report — April 2026'
const ABSTRACT =
  'A full market analysis of the global Jewish population, the Haredi (ultra-Orthodox) community, and the prevalence of kosher phone usage — defining the total addressable market for an SMS-based community information service.'

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
      subtitle={SUBTITLE}
      abstract={ABSTRACT}
      publishedAt="2026-04-01"
      readingTime="14 min read"
    >
      <h2>1. Executive Summary</h2>
      <p>
        This report analyzes the global Jewish population, the Haredi (ultra-Orthodox) community,
        and the prevalence of kosher phone usage — to define the total addressable market for
        Connect2Kehilla, a free SMS-based community information service for kosher phone users.
      </p>

      <h3>Key Findings</h3>
      <ul>
        <li>There are approximately <strong>16.5 million Jews</strong> in the world as of 2026 (Wikipedia / Sergio DellaPergola, Hebrew University).</li>
        <li>Of these, roughly <strong>2.1 million — 14%</strong> — are Haredi (ultra-Orthodox) (JPR, 2022).</li>
        <li>In Israel, <strong>84% of Haredim use kosher phones</strong> (Israel Democracy Institute, 2022).</li>
        <li>In the US, an estimated <strong>700,000 Haredim</strong> live mainly in the New York metropolitan area.</li>
        <li>The Haredi population is the fastest-growing Jewish demographic: <strong>3.5–4% annually</strong>, doubling every 20 years.</li>
        <li>There is currently <strong>no equivalent SMS information service</strong> for kosher phone users anywhere in the world.</li>
      </ul>

      <h2>2. World Jewish Population</h2>
      <p>
        The following table shows the distribution of Jews by major country as of 2026, based on
        data from the Jewish Virtual Library, Pew Research Center (2025), and Hebrew University
        demographer Sergio DellaPergola.
      </p>

      <table>
        <thead>
          <tr>
            <th>Country</th>
            <th>Jewish Population</th>
            <th>% of World Jews</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Israel</td><td>7,760,000</td><td>47.0%</td><td>Largest Jewish country</td></tr>
          <tr><td>United States</td><td>6,300,000</td><td>38.2%</td><td>NY area: 1.73M</td></tr>
          <tr><td>France</td><td>438,500</td><td>2.7%</td><td>Paris-based</td></tr>
          <tr><td>Canada</td><td>398,000</td><td>2.4%</td><td>Toronto–Montreal</td></tr>
          <tr><td>United Kingdom</td><td>312,000</td><td>1.9%</td><td>London, Manchester</td></tr>
          <tr><td>Argentina</td><td>171,000</td><td>1.0%</td><td>Buenos Aires</td></tr>
          <tr><td>Russia</td><td>132,000</td><td>0.8%</td><td>Moscow, St. Petersburg</td></tr>
          <tr><td>Germany</td><td>125,000</td><td>0.8%</td><td>Berlin, Frankfurt</td></tr>
          <tr><td>Australia</td><td>117,200</td><td>0.7%</td><td>Sydney, Melbourne</td></tr>
          <tr><td>Belgium</td><td>30,000</td><td>0.2%</td><td>Antwerp: major Haredi hub</td></tr>
          <tr><td><strong>World total</strong></td><td><strong>~16,500,000</strong></td><td><strong>100%</strong></td><td>Wikipedia 2026</td></tr>
        </tbody>
      </table>
      <p className="text-sm text-gray-500">
        Sources: Wikipedia (Jewish population by country, 2026); Pew Research Center (June 2025);
        Sergio DellaPergola, Hebrew University; Jewish Virtual Library; American Jewish Year Book 2025.
      </p>

      <h2>3. The Haredi (Ultra-Orthodox) Population</h2>
      <p>
        The Haredi community is the primary target market for Connect2Kehilla, as they are the
        principal users of kosher phones and have the greatest need for community information
        services that do not require internet access.
      </p>

      <table>
        <thead>
          <tr>
            <th>Country / Region</th>
            <th>Haredi Population</th>
            <th>% of Local Jews</th>
            <th>Key Communities</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Israel</td><td>1,452,350</td><td>14.3% of Israelis</td><td>Jerusalem, Bnei Brak, Beit Shemesh</td></tr>
          <tr><td>United States</td><td>~700,000</td><td>~11% of US Jews</td><td>Brooklyn, Lakewood NJ, Monsey NY, Monroe NY</td></tr>
          <tr><td>United Kingdom</td><td>~76,000</td><td>~25% of UK Jews</td><td>Stamford Hill (London), Manchester, Gateshead</td></tr>
          <tr><td>Belgium</td><td>~15,000</td><td>~50% of Belgian Jews</td><td>Antwerp Diamond District</td></tr>
          <tr><td>Canada</td><td>~30,000</td><td>~8% of Canadian Jews</td><td>Montreal, Toronto</td></tr>
          <tr><td>France</td><td>~12,000</td><td>~3% of French Jews</td><td>Paris, Strasbourg</td></tr>
        </tbody>
      </table>
      <p className="text-sm text-gray-500">
        Sources: Institute for Jewish Policy Research (JPR), <em>Haredim in the World</em> (2022);
        Israel Democracy Institute (2025); American Jewish Year Book 2025.
      </p>

      <h2>4. Kosher Phone Adoption</h2>
      <p>
        The Israel Democracy Institute&apos;s 2025 annual statistical report on the ultra-Orthodox
        community, paired with primary reporting from 18Forty and The Daily Beast, gives a fairly
        consistent picture: kosher phone adoption is high and rising in every major Haredi hub.
      </p>

      <table>
        <thead>
          <tr>
            <th>Community</th>
            <th>Kosher Phone Adoption</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Israel — Haredi sector</td><td>84%</td><td>IDI Statistical Report, 2025</td></tr>
          <tr><td>Williamsburg, Brooklyn</td><td>Near 100%</td><td>18Forty / Daily Beast, 2024–2025</td></tr>
          <tr><td>Crown Heights, Brooklyn</td><td>Very high</td><td>Connect2Kehilla / community observation</td></tr>
          <tr><td>Stamford Hill, London</td><td>Majority</td><td>JPR UK, 2022</td></tr>
          <tr><td>Antwerp, Belgium</td><td>Majority</td><td>JPR European Haredi report, 2022</td></tr>
          <tr><td>Lakewood, NJ</td><td>Very high</td><td>KosherCell Inc. / 18Forty interview, 2025</td></tr>
        </tbody>
      </table>

      <h2>5. Growth Forecast — A Rapidly Expanding Market</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Now (2025)</th>
            <th>2040 forecast</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Global Haredi population</td><td>~2.1M</td><td>~4.2M</td><td>Doubles every 20 years (JPR, 2022)</td></tr>
          <tr><td>Israel Haredi population</td><td>1.45M (14.3%)</td><td>~2M (16%)</td><td>Israel CBS forecast, IDI 2025</td></tr>
          <tr><td>Haredi share of world Jewry</td><td>14%</td><td>&gt;20%</td><td>1 in 5 Jews will be Haredi by 2040</td></tr>
          <tr><td>Annual Haredi growth rate</td><td>3.5–4%</td><td>3.5–4%</td><td>vs. 0.7% for the rest of world Jewry</td></tr>
          <tr><td>Kosher phone users (estimate)</td><td>~1.5–1.8M</td><td>~3–4M</td><td>Based on Israel 84% + US + EU</td></tr>
        </tbody>
      </table>

      <h2>6. Opportunities for Connect2Kehilla</h2>
      <table>
        <thead>
          <tr>
            <th>Market segment</th>
            <th>Population (estimate)</th>
            <th>Kosher-phone users</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>NY (Brooklyn, Monsey, Lakewood NJ)</td><td>~350,000</td><td>200–280,000</td><td>Current market — <strong>active</strong></td></tr>
          <tr><td>Other US communities</td><td>~350,000</td><td>200–250,000</td><td>Expansion, Phase 1</td></tr>
          <tr><td>Israel (Haredi, SMS)</td><td>~1,450,000</td><td>~1.2M</td><td>Expansion, Phase 2</td></tr>
          <tr><td>UK + Belgium</td><td>~91,000</td><td>~60,000</td><td>Expansion, Phase 3</td></tr>
          <tr><td>Canada + Australia + others</td><td>~60,000</td><td>~30,000</td><td>Expansion, Phase 4</td></tr>
          <tr><td><strong>Total addressable market</strong></td><td><strong>~2,300,000</strong></td><td><strong>~1.7–1.8M</strong></td><td>Kosher-phone users only</td></tr>
        </tbody>
      </table>

      <h2>7. Why There Are No Competitors</h2>
      <ul>
        <li>Kosher phone users cannot use apps, websites, or social media.</li>
        <li>WhatsApp and other messengers are unavailable on most kosher phones.</li>
        <li>No existing SMS service offers the full bundle — Zmanim, Minyanim, Simchas, Specials, Jobs, Gmach — in one place.</li>
        <li>Connect2Kehilla is Shabbos-aware. No competitor has accounted for this.</li>
      </ul>

      <h2>8. Sources</h2>
      <ol>
        <li>Wikipedia — <em>Jewish population by country</em>, 2026. Data from Prof. Sergio DellaPergola, Hebrew University of Jerusalem.</li>
        <li>Pew Research Center — <em>Changes in the global religious landscape, 2010–2020</em>, June 2025.</li>
        <li>Institute for Jewish Policy Research (JPR) — <em>Haredim in the World: Demographic Trends</em>, Dr. Daniel Staetsky, 2022.</li>
        <li>Israel Democracy Institute (IDI) — <em>Statistical Report on the Ultra-Orthodox Society of Israel 2025</em>.</li>
        <li>18Forty — <em>What Haredim Can Teach Us: Kosher Phones</em>, December 2025.</li>
        <li>The Daily Beast — <em>Can a Kosher Phone Cure Your Tech Addiction?</em>, September 2024.</li>
        <li>Times of Israel — <em>By 2050, almost one in four Israelis will be ultra-Orthodox</em>, February 2026.</li>
        <li>WorldPopulationReview.com — <em>Jewish population in the world 2026</em>.</li>
        <li>TheWorldData.com — <em>World Jewish population 2025: statistics and facts</em>.</li>
        <li>Jerusalem Post — <em>One in seven Jews worldwide is ultra-Orthodox</em>, May 2022.</li>
      </ol>
    </ArticleLayout>
  )
}
