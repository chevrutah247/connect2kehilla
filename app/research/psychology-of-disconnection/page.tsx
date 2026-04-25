import type { Metadata } from 'next'
import ArticleLayout from '@/components/ArticleLayout'

const SLUG = 'psychology-of-disconnection'
const TITLE = 'The Psychology of Disconnection'
const SUBTITLE = 'Why "offline" shouldn\u2019t mean "out of the loop"'
const ABSTRACT =
  'The Haredi community is doubling every 20 years and represents a powerhouse of purchasing power — yet major brands and service providers treat them as ghosts. The problem is not the technology; it is the delivery system. SMS-based community infrastructure can transform the kosher phone from a tool of "no" into a productive tool of "yes."'

export const metadata: Metadata = {
  title: TITLE,
  description: ABSTRACT,
  alternates: { canonical: `https://www.connect2kehilla.com/research/${SLUG}` },
  keywords: [
    'Haredi Demographics',
    'Community Infrastructure',
    'SMS Information Hub',
    'Kosher Technology',
    'Rabbinical Approval',
    'Economic Empowerment',
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
      <h2>The Invisible Consumer</h2>
      <p>
        One of the deepest problems identified in Hebrew-language economic journals is the{' '}
        <em>invisibility</em> of the kosher phone user. Major brands and service providers
        assume that if you aren&apos;t on Instagram or Google, you don&apos;t exist.
      </p>
      <p>
        Yet, as noted in the DellaPergola/Hebrew University data, the Haredi population is
        doubling every 20 years. This demographic is a powerhouse of purchasing power, and
        they are treated as ghosts by the modern market.
      </p>
      <p>
        When a business in the community has a flash sale or a grand opening, they struggle to
        reach their own neighbors. The information vacuum creates a friction-filled economy
        where supply and demand are separated by a missing communication bridge.
      </p>

      <h2>The Religious Mandate for Efficiency</h2>
      <p>
        There is a common misconception that Haredi Judaism is anti-technology. This is
        incorrect. As reflected in the endorsement from{' '}
        <strong>Rabbi Yosef Yeshaya Braun</strong> and{' '}
        <strong>Rabbi Avrohom Osdoba</strong> of the Beis Din of Crown Heights, the community
        welcomes thoughtful and community-oriented tools that bring <em>brachah</em> and
        connection. The problem is not the technology itself, but the delivery system.
      </p>
      <p>
        Hebrew-language editorials often discuss <em>the stress of the unknown</em>. A father
        looking for a Minyan in a new city, or a family looking for a Gmach for medical
        supplies, experiences a level of stress that is foreign to the smartphone user. This
        <em> search friction</em> degrades the quality of life.
      </p>

      <h2>Bridging the Gap via SMS Ecosystems</h2>
      <p>
        Connect2Kehilla transforms the kosher phone from a limited tool of <em>&ldquo;no&rdquo;</em>{' '}
        into a productive tool of <em>&ldquo;yes.&rdquo;</em>
      </p>
      <ul>
        <li>
          <strong>Safety without sacrifice.</strong> We maintain a Shabbos-safe protocol — the
          vacuum is preserved when it is holy (Shabbos / Yom Tov) and filled when it is
          functional (the work week).
        </li>
        <li>
          <strong>Curation.</strong> Because every post is reviewed by an administrator, we
          eliminate the noise of the open internet, providing only high-value, community-
          appropriate data.
        </li>
        <li>
          <strong>Universality.</strong> SMS reaches every kosher phone — flip phone or
          filtered Android — without an app, an account, or a download.
        </li>
      </ul>

      <h2>The Future: A Connected Kehilla</h2>
      <p>
        By 2040, the Haredi community will represent a massive portion of the Jewish world. If
        we do not solve the information vacuum now, we risk a permanent socio-economic
        fracture. Connect2Kehilla is not just an SMS service — it is an infrastructure project
        for the 21st-century Haredi world, ensuring that <em>kosher</em> and <em>connected</em>{' '}
        are no longer mutually exclusive.
      </p>

      <h2>Sources</h2>
      <ul>
        <li>Beis Din of Crown Heights — official recommendation and standard guidelines.</li>
        <li>Pew Research Center — <em>The Future of World Religions</em>, 2025 update.</li>
        <li>The Jerusalem Post — <em>Bridging the Haredi Tech Gap</em> (analysis of internal community trends).</li>
        <li>Connect2Kehilla Research — Section 6: Market Addressability.</li>
      </ul>
    </ArticleLayout>
  )
}
