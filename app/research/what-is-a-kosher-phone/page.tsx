import type { Metadata } from 'next'
import ArticleLayout from '@/components/ArticleLayout'

const SLUG = 'what-is-a-kosher-phone'
const TITLE = 'What Is a Kosher Phone?'
const SUBTITLE = 'A simple technology with a profound purpose'
const ABSTRACT =
  'A kosher phone is a mobile device modified to remove or restrict features incompatible with Orthodox Jewish values. Born from a 2004 rabbinical commission in Israel, it has become the standard device for an estimated 1.5–1.8 million people worldwide.'

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
      publishedAt="2026-04-22"
      readingTime="6 min read"
    >
      <p>
        Walk through the neighborhoods of Crown Heights, Williamsburg, or Boro Park in Brooklyn —
        or through Jerusalem&apos;s Mea Shearim or Bnei Brak — and you will notice something
        unusual. People are on their phones, but the phones look different. Smaller. Simpler.
        Quieter. These are kosher phones.
      </p>

      <h2>The Definition</h2>
      <p>
        A kosher phone is a mobile device that has been modified — either by hardware design or
        software filtering — to remove or restrict features that are considered incompatible
        with Orthodox Jewish values. The term <em>kosher</em> (כָּשֵׁר), meaning fit or proper
        in Hebrew, is borrowed from the laws of Jewish dietary observance and applied here to
        technology.
      </p>
      <p>
        In its most basic form, a kosher phone does one thing: it allows voice calls. No
        internet. No camera. No social media. No texting in some models. No apps. It is, by
        design, a device stripped of everything except the ability to reach another human being
        by voice.
      </p>
      <p>
        In more advanced versions — sometimes called &quot;kosher smartphones&quot; — the device
        is a standard Android phone running a modified operating system that blocks social
        media, unrestricted web browsing, streaming, and adult content, while allowing approved
        apps such as navigation, banking, and Jewish religious databases.
      </p>

      <h2>How Did Kosher Phones Come About?</h2>
      <p>
        The story begins in Israel in the early 2000s. As smartphones became widespread and
        their capabilities expanded, rabbinic leaders in the ultra-Orthodox (Haredi) community
        grew alarmed. The open internet presented dangers they could not ignore: access to
        pornography, secular entertainment, and communication channels that could undermine the
        community&apos;s carefully maintained boundaries.
      </p>
      <p>
        In 2004, a special rabbinical commission approached Israel&apos;s cellular companies
        with an unusual request: develop a mobile phone that is only a phone. MIRS
        Communications, an Israeli subsidiary of Motorola, responded. Within months, the first
        certified kosher phone — carrying a rabbinical seal of approval — was on sale. By the
        summer of 2005, over 20,000 units had been sold.
      </p>
      <blockquote>
        &ldquo;They saw the future and were frightened,&rdquo; said Jacob Weinroth, the Israeli
        attorney who brokered the arrangement between the rabbinical commission and the
        cellular companies.
      </blockquote>
      <p>
        The concept spread rapidly. Other Israeli carriers launched their own certified models.
        The rabbinical authorities developed a formal certification system. Community
        inspectors — known as <em>badatz mashgichim</em> for technology — began visiting stores
        to verify compliance. A new ecosystem was born.
      </p>

      <h2>Two Types of Kosher Phones</h2>
      <p>Today there are essentially two categories:</p>
      <ul>
        <li>
          <strong>Basic kosher phones</strong> — voice calls only, no texting, no camera, no
          internet. Often older-model flip phones or simple bar phones. Favored by the most
          stringent communities, yeshiva students, and the elderly.
        </li>
        <li>
          <strong>Kosher smartphones</strong> — Android-based devices running filtered
          operating systems such as KosherOS (by SafeTelecom) or devices certified by carriers
          like Rami Levy Communications in Israel. These allow approved apps — banking, maps,
          health services — but block social media, browsers, and entertainment.
        </li>
      </ul>
      <p>
        The line between these two categories is constantly negotiating, as communities and
        their rabbinic authorities debate which technologies are permissible and under what
        conditions.
      </p>

      <h2>Who Uses Kosher Phones?</h2>
      <p>
        The primary users are members of the Haredi (ultra-Orthodox) Jewish community — a
        global population estimated at <strong>2.1 million people</strong>, with the largest
        concentrations in Israel (1.45 million) and the United States (approximately 700,000,
        mostly in the New York metropolitan area).
      </p>
      <p>
        Within these communities, kosher phone usage is nearly universal. A 2022 study by the
        Israel Democracy Institute found that <strong>84% of Haredi Jews in Israel</strong>{' '}
        used kosher phones. In communities like Hasidic Williamsburg in Brooklyn, field
        reporters describe the kosher phone as omnipresent — the smartphone a rare exception
        rather than the rule.
      </p>
      <p>
        But increasingly, kosher phones are attracting users from outside the Jewish community:
        parents seeking safer devices for children, professionals pursuing digital detox, and
        members of other conservative religious communities — including Muslims and evangelical
        Christians — who share similar concerns about technology&apos;s impact on family life.
      </p>

      <h2>A Technology Built on Values</h2>
      <p>
        What makes the kosher phone remarkable is not what it can do — it is what it
        deliberately cannot do. In a world that has spent twenty years engineering smartphones
        to capture and hold human attention, the kosher phone is engineered for exactly the
        opposite purpose: to be useful without being addictive.
      </p>
      <p>
        The kosher phone is not a rejection of modernity. It is a negotiation with it — one
        that thousands of families have been conducting quietly and successfully for two
        decades.
      </p>
      <p>
        This is why Connect2Kehilla was built for kosher phones. Our community information
        service — Zmanim, Minyan times, Simcha announcements, job listings, grocery specials —
        is delivered entirely by SMS. No app. No internet. No account. Just a text message to{' '}
        <a href="sms:+18885163399">(888) 516-3399</a>.
      </p>
      <p>
        Because if you want to serve a community, you must speak the language of that
        community. And for hundreds of thousands of Jews across America and the world, that
        language is the humble text message.
      </p>
    </ArticleLayout>
  )
}
