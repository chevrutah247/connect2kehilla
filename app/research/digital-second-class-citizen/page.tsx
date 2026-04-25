import type { Metadata } from 'next'
import ArticleLayout from '@/components/ArticleLayout'

const SLUG = 'digital-second-class-citizen'
const TITLE = 'The Digital Second-Class Citizen'
const SUBTITLE = 'Why government digitization threatens the kosher phone user'
const ABSTRACT =
  'When governments shift to online-only portals for healthcare, tax, and social services, kosher phone users are locked out — a "tech-smuggling" crisis where religious stringency now costs civil access. Connect2Kehilla bridges this by translating digital bureaucracy into SMS-accessible information.'

export const metadata: Metadata = {
  title: TITLE,
  description: ABSTRACT,
  alternates: { canonical: `https://www.connect2kehilla.com/research/${SLUG}` },
  keywords: [
    'Digital Inclusion',
    'Haredi Civil Rights',
    'Government Online Services',
    'Kosher Phone Limitations',
    'Connect2Kehilla',
    'Information Accessibility',
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
      <h2>The Rise of Digital-Only Governance</h2>
      <p>
        In the last five years, governments in Israel, the United States, and the UK have
        undergone a rapid &ldquo;digital transformation.&rdquo; While this shift toward
        online-only portals for healthcare (HMOs / <em>Kupat Cholim</em>), tax filings, and
        social security benefits is intended to increase efficiency, it has inadvertently
        created a new class of <strong>digital second-class citizens</strong>.
      </p>
      <p>
        According to a 2024 report by the Israeli State Comptroller, the rapid digitization of
        public services has left the ultra-Orthodox sector — where over 80% use kosher phones —
        at a significant disadvantage.
      </p>

      <h2>The Access Crisis</h2>
      <p>
        When a government department replaces a physical office or a telephone representative
        with an &ldquo;online portal,&rdquo; the kosher phone user is effectively locked out.
      </p>
      <blockquote>
        Hebrew-language activists (as reported in <em>Kikar HaShabbat</em>) point out that for
        a Haredi family, simply booking a doctor&apos;s appointment or renewing a driver&apos;s
        license now requires <em>tech-smuggling</em> — finding a neighbor with internet or
        visiting a public kiosk, which often contradicts their religious standards of privacy
        and tech-avoidance.
      </blockquote>
      <p>
        This is not a hypothetical inconvenience. It is a structural inequality, encoded into
        the design of public services that were once meant to be universally accessible.
      </p>

      <h2>The Connect2Kehilla Solution: The SMS Gateway</h2>
      <p>
        Connect2Kehilla addresses this systemic inequality by acting as a{' '}
        <strong>text-based gateway</strong>. Our mission is to translate complex digital
        bureaucracy into simple SMS commands.
      </p>
      <ul>
        <li>
          <strong>Instructional support.</strong> Instead of forcing a user to navigate a
          website, Connect2Kehilla provides the exact phone numbers and SMS codes needed to
          access government services via traditional channels.
        </li>
        <li>
          <strong>Empowerment through information.</strong> By providing direct links to
          community-based support organizations through our directory of over 21,000 entries,
          we ensure that religious stringency does not result in the loss of civil rights or
          essential services.
        </li>
      </ul>
      <p>
        The principle is simple: a citizen&apos;s ability to access public services should not
        depend on the kind of phone they carry. Where governments fail to provide a
        non-digital path, community infrastructure has to step in — and SMS is the only
        protocol that reaches every kosher phone uniformly.
      </p>

      <h2>Sources</h2>
      <ul>
        <li>State Comptroller of Israel — <em>Accessibility of Digital Public Services for the Haredi Sector</em>, 2024.</li>
        <li>Kikar HaShabbat — <em>The Silent Exclusion: How the Haredi Public is Left Behind by Digital Reform</em> (Hebrew analysis).</li>
        <li>Connect2Kehilla Market Research, 2026.</li>
      </ul>
    </ArticleLayout>
  )
}
