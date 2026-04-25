import type { Metadata } from 'next'
import ArticleLayout from '@/components/ArticleLayout'

const SLUG = 'why-the-kosher-phone-market-matters'
const TITLE = 'Why the Kosher Phone Market Matters'
const SUBTITLE = 'A community invisible to the digital world'
const ABSTRACT =
  'There is a community of over 1.5 million observant Jews using kosher phones who are systematically invisible to the modern digital economy. They cannot use apps, cannot browse websites, and cannot access the services the rest of the world takes for granted. That invisibility represents an opportunity almost no one has recognized.'

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
      publishedAt="2026-04-23"
      readingTime="6 min read"
    >
      <p>
        There is a community of over one and a half million people — observant Jews using
        kosher phones — who are systematically invisible to the modern digital economy. They
        cannot use apps. They cannot browse websites. They cannot access the services that the
        rest of the world takes for granted. For any business or service that operates
        exclusively online, these people simply do not exist. That invisibility has
        consequences — and it represents an opportunity that almost no one has recognized.
      </p>

      <h2>The Scale of Invisibility</h2>
      <p>
        Let us start with numbers. According to research by the Institute for Jewish Policy
        Research, there are approximately <strong>2.1 million Haredi Jews</strong> worldwide.
        Of these, studies show that <strong>84% in Israel</strong> use kosher phones — devices
        without internet access. In the United States, where roughly{' '}
        <strong>700,000 Haredi Jews</strong> live — concentrated in Brooklyn, Lakewood NJ,
        Monsey NY, and Monroe NY — the figure is comparable, especially in the most observant
        Hasidic communities.
      </p>
      <p>
        This means we are talking about a community of roughly{' '}
        <strong>1.5 to 1.8 million people</strong> who cannot access any digital service that
        requires an internet connection. They cannot use Google Maps to find a local business.
        They cannot check a restaurant&apos;s hours on Yelp. They cannot read community
        announcements on Facebook. They cannot receive alerts on WhatsApp.
      </p>
      <p>They are, from the perspective of the digital world, ghosts.</p>

      <h2>What This Community Actually Needs</h2>
      <p>
        The irony is that this is one of the most information-hungry communities in existence.
        Observant Jewish life is governed by a complex, time-sensitive calendar. Every day
        brings halakhic questions: What time does Shabbat begin? Is it time to say Mincha?
        Where is the nearest Minyan? Is this week&apos;s candle lighting at 7:15 or 7:28?
      </p>
      <p>
        Beyond the religious calendar, daily life in these communities generates constant
        information needs:
      </p>
      <ul>
        <li>Which kosher grocery stores have sales this week?</li>
        <li>Who is looking for a babysitter or a plumber?</li>
        <li>Whose daughter just got engaged?</li>
        <li>Where is tonight&apos;s L&apos;Chaim celebration?</li>
        <li>Which Gmach lends wedding equipment in my neighborhood?</li>
      </ul>
      <p>
        These questions are answered today through word of mouth, community bulletin boards,
        and phone calls. The information exists — it just has no efficient delivery mechanism
        for people without internet access.
      </p>

      <h2>The Gap That No One Is Filling</h2>
      <p>
        Here is what makes this situation remarkable: despite the size of this community and
        the clarity of its information needs, there is currently no service anywhere in the
        world that systematically delivers community information to kosher phone users via
        SMS.
      </p>
      <p>
        Every Jewish app — Chabad.org, Sefaria, TorahAnytime, local community portals —
        requires internet. Every community WhatsApp group requires WhatsApp. Every digital
        announcement platform requires a smartphone. The entire infrastructure of modern
        information delivery is built on an assumption that makes it structurally inaccessible
        to this community: <em>that everyone has internet</em>.
      </p>
      <blockquote>
        We have spent twenty years building the most sophisticated information delivery
        infrastructure in human history — and we forgot that not everyone is connected to it.
      </blockquote>
      <p>
        This is not a niche problem. A community of 1.5 million information-hungry people with
        no digital service infrastructure is not a footnote. It is a market waiting to be
        born.
      </p>

      <h2>Why SMS Is the Answer</h2>
      <p>
        SMS — the simple text message — works on every mobile phone ever made. It requires no
        internet connection, no app, no account, no data plan. It works on a basic kosher flip
        phone just as well as on the latest iPhone. It is, in the language of technology, a
        universal protocol.
      </p>
      <p>
        This makes SMS the only technology that can reach kosher phone users where they are,
        on the device they have chosen. There is no alternative. You cannot build an app for
        people who cannot run apps. You cannot create a website for people who cannot browse
        the web. But you can send a text message to anyone with a phone.
      </p>
      <p>
        This is the foundation on which Connect2Kehilla is built. Our service — reachable at{' '}
        <a href="sms:+18885163399">(888) 516-3399</a> — delivers everything a member of this
        community might need: Zmanim, Minyan times, Simcha announcements, weekly kosher
        grocery specials, job listings, Gmach directories, Tzedaka requests, and more. All via
        text message. No internet required.
      </p>

      <h2>The Broader Significance</h2>
      <p>
        Beyond the Jewish community specifically, the kosher phone market represents something
        important for anyone thinking about technology and society: the recognition that{' '}
        <em>digital inclusion is not the same as smartphone adoption</em>.
      </p>
      <p>
        There are communities around the world — religious, elderly, economically marginalized
        — that have legitimate reasons for not using smartphones or internet. The assumption
        that these communities can simply be served &quot;when they get online&quot; is both
        wrong and patronizing. They are here now. They have needs now. And they deserve
        services designed for the technology they actually use.
      </p>
      <p>
        The kosher phone community has made a deliberate, values-based choice about their
        relationship with technology. They have not been left behind — they have chosen a
        different path. The question is whether anyone will build services that meet them on
        that path.
      </p>
      <p>
        Connect2Kehilla is one answer. There will be others. And the communities that figure
        this out first will have something genuinely rare in the technology world: a loyal,
        underserved, and growing user base with no competition.
      </p>
    </ArticleLayout>
  )
}
