import type { Metadata } from 'next'
import ArticleLayout from '@/components/ArticleLayout'

const SLUG = 'sms-vs-apps-psychology'
const TITLE = 'The Psychology of Offline Communities: Why SMS Outperforms Apps in 2026'
const ABSTRACT =
  'While the world suffers from "app fatigue" and notification overload, the Haredi community has maintained a high-trust, high-attention communication channel: the SMS.'

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
      publishedAt="2026-04-15"
      readingTime="4 min read"
    >
      <p>
        In the general population, the average smartphone user is bombarded with thousands of
        digital impressions daily. In contrast, for a kosher phone user, an SMS is a high-priority
        event. Since these users cannot access websites, social media, or even WhatsApp in many
        cases, the text message remains the only &quot;digital&quot; link to their community.
      </p>

      <h2>The High-Trust Information Loop</h2>
      <p>
        Psychologically, this creates what we call a <em>high-trust information loop</em>. When a
        service like Connect2Kehilla delivers Zmanim, job listings, or communal news via SMS, it
        bypasses the noise of the internet. For a target audience of <strong>1.7–1.8 million
        users</strong>, the absence of infinite scroll means that every piece of information
        received is actually <em>processed</em>.
      </p>

      <h2>What This Looks Like in Numbers</h2>
      <table>
        <thead>
          <tr>
            <th>Channel</th>
            <th>Open / Read rate</th>
            <th>Average daily volume per user</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>SMS (general US)</td>
            <td>~98%</td>
            <td>~5–8 messages</td>
          </tr>
          <tr>
            <td>SMS (kosher-phone user)</td>
            <td>~98%</td>
            <td>~3–6 messages</td>
          </tr>
          <tr>
            <td>Email (general US)</td>
            <td>~20%</td>
            <td>~120 emails</td>
          </tr>
          <tr>
            <td>Push notification (US smartphone)</td>
            <td>~7%</td>
            <td>~46 notifications</td>
          </tr>
        </tbody>
      </table>

      <p className="text-sm text-gray-500">
        Sources: industry SMS benchmarks (Twilio, Esendex 2024); Pew Research smartphone use, 2025;
        Connect2Kehilla internal sample.
      </p>

      <h2>Implications for Service Design</h2>
      <p>
        The lesson is not nostalgic. In 2026, SMS isn&apos;t a legacy technology for this audience
        — it is a <strong>premium, distraction-free environment for community engagement</strong>.
        Services built for it have to embrace the constraints: 160 characters at a time, no
        embedded media, no app onboarding, no login.
      </p>

      <p>
        The constraints are the feature. A reply with three relevant businesses, a phone number,
        and a ZIP-coded address is more valuable to a Haredi user than a 30-tab search-results
        page would ever be — because they will read it, decide, and act.
      </p>

      <h2>Key Sources</h2>
      <ul>
        <li>18Forty, <em>What Haredim Can Teach Us About Getting Off Our Smartphones</em>, 2025.</li>
        <li>The Daily Beast, <em>Can a Kosher Phone Cure Your Tech Addiction?</em>, 2024.</li>
        <li>Connect2Kehilla, <em>Market Research Report</em>, Section 7, 2026.</li>
      </ul>
    </ArticleLayout>
  )
}
