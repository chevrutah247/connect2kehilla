import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Our Service — All SMS Commands & How to Use Them',
  description:
    'Complete reference for every SMS command Connect2Kehilla supports — from finding a plumber to subscribing to Mazel Tov alerts, getting Zmanim, posting jobs, requesting Gmach, donating, and more. Just text (888) 516-3399.',
  alternates: { canonical: 'https://www.connect2kehilla.com/services' },
}

interface Command {
  cmd: string
  title: string
  desc: string
  examples: string[]
  alias?: string[]
  related?: { label: string; href: string }[]
  subscribe?: string
  detailHelp: string // What user gets when they text "<CMD> ?"
}

interface Group {
  heading: string
  emoji: string
  blurb: string
  commands: Command[]
}

const GROUPS: Group[] = [
  {
    heading: 'Find a Business or Service',
    emoji: '🔍',
    blurb:
      'Free text search across 18,000+ kosher businesses. Just type what you need plus a ZIP code or neighborhood.',
    commands: [
      {
        cmd: 'SEARCH',
        title: 'Find any business',
        desc:
          'Type a service or business name plus a ZIP or neighborhood. The AI parses your request and returns up to 5 matches with phone numbers and addresses.',
        examples: [
          'plumber 11213',
          'electrician 11225',
          'dentist Williamsburg',
          'pharmacy Crown Heights',
          'Lemofet Glass',
        ],
        related: [{ label: 'Add your business →', href: '/add-business' }],
        detailHelp: 'Text: SEARCH ? for in-message help',
      },
      {
        cmd: 'RESTAURANT',
        title: 'Find a kosher restaurant near you',
        desc:
          'Search for kosher restaurants, cafes, pizza shops, sushi spots, bakeries, takeout, caterers, and more — by ZIP code or neighborhood. Results include phone, address, and (where available) the hashgacha (kashrus certification: OU, Star-K, OK, Vaad Queens, Vaad 5T, CHK, etc.).',
        alias: ['RESTAURANTS', 'KOSHER FOOD', 'EAT'],
        examples: [
          'restaurant 11213',
          'kosher restaurant near me',
          'pizza 11225',
          'sushi Crown Heights',
          'dairy restaurant Monsey',
          'cafe Boro Park',
          'meat restaurant Five Towns',
        ],
        related: [{ label: 'Browse certified restaurants by hashgacha →', href: '/glossary#hashgacha' }],
        detailHelp: 'Text: RESTAURANT ? for in-message help. Tip — say what kind of food (dairy, meat, pareve, sushi, pizza) plus your area for the most relevant results.',
      },
      {
        cmd: 'A / H',
        title: 'Address & hours',
        desc:
          'After you receive a list of businesses, reply A or ADDRESS to get the full address. Reply H or HOURS to get the hours of operation.',
        alias: ['ADDRESS', 'HOURS'],
        examples: ['A', 'ADDRESS', 'H', 'HOURS'],
        detailHelp: 'These work right after any search result reply.',
      },
    ],
  },
  {
    heading: 'Community Events',
    emoji: '🎊',
    blurb:
      'Stay informed about simchas, l\u2019chaims, and other community announcements — and post your own.',
    commands: [
      {
        cmd: 'SIMCHA',
        title: 'Mazel Tovs & engagements',
        desc:
          'Get the latest engagements, weddings, births, bar/bat mitzvas in your area — or post your own.',
        examples: ['SIMCHA 11225', 'SIMCHA Crown Heights', 'ADD SIMCHA'],
        subscribe: 'SUBSCRIBE SIMCHA',
        related: [{ label: 'Post a Mazel Tov on the web →', href: '/add-mazel-tov' }],
        detailHelp: 'Text: SIMCHA ?',
      },
      {
        cmd: 'LECHAIM',
        title: 'L\u2019chaim events',
        desc:
          'Hear about every l\u2019chaim in your community — date, time, address. Post yours for free.',
        examples: ['LECHAIM 11225', 'LECHAIM Williamsburg', 'ADD LECHAIM'],
        subscribe: 'SUBSCRIBE LECHAIM',
        detailHelp: 'Text: LECHAIM ?',
      },
    ],
  },
  {
    heading: 'Davening, Zmanim & Calendar',
    emoji: '📅',
    blurb:
      'Halachic times, Shabbos candle-lighting, Sefiras Ha\u2019Omer, Rosh Chodesh, fasts, and Birkat Levana — all by ZIP.',
    commands: [
      {
        cmd: 'ZMANIM',
        title: 'Daily zmanim by ZIP',
        desc:
          'Sunrise (netz), shkiah, candle-lighting, plag haminchah, sof zman shema — calculated for your ZIP.',
        examples: ['ZMANIM 11225', 'ZMANIM Crown Heights'],
        related: [{ label: 'Web view →', href: '/calendar' }],
        detailHelp: 'Text: ZMANIM ?',
      },
      {
        cmd: 'CANDLE',
        title: 'Shabbos candle lighting',
        desc:
          'The exact candle-lighting time for this Erev Shabbos at your location, plus Motzei Shabbos.',
        examples: ['CANDLE 11225', 'CANDLE 11211'],
        detailHelp: 'Text: ZMANIM ?',
      },
      {
        cmd: 'SFIRA',
        title: 'Sefiras Ha\u2019Omer',
        desc:
          'Today\u2019s Omer count with the proper bracha text. Subscribe for a daily evening reminder.',
        examples: ['SFIRA'],
        subscribe: 'SUBSCRIBE SFIRA',
        detailHelp: 'No ZIP needed.',
      },
      {
        cmd: 'ROSH CHODESH',
        title: 'Next Rosh Chodesh',
        desc: 'Date and day(s) of the upcoming Rosh Chodesh. Subscribe for a monthly reminder.',
        examples: ['ROSH CHODESH'],
        alias: ['Note: write full words, not RC'],
        subscribe: 'SUBSCRIBE ROSH CHODESH',
        detailHelp: 'Text: ZMANIM ?',
      },
      {
        cmd: 'FAST',
        title: 'Next public fast',
        desc: 'The next fast day (Tzom Gedaliah, Asarah b\u2019Teves, Taanis Esther, Shiva Asar b\u2019Tammuz, Tisha B\u2019Av) with start and end times.',
        examples: ['FAST', 'FAST 11225'],
        detailHelp: 'Text: ZMANIM ?',
      },
      {
        cmd: 'BIRKAT LEVANA',
        title: 'Kiddush Levana window',
        desc: 'The opening and closing times of the current month\u2019s Kiddush Levana window.',
        examples: ['BIRKAT LEVANA'],
        alias: ['Note: write full words, not BL'],
        subscribe: 'SUBSCRIBE BIRKAT LEVANA',
        detailHelp: 'Text: ZMANIM ?',
      },
      {
        cmd: 'MINYAN',
        title: 'Minyan times — shacharis, mincha, maariv',
        desc:
          'Find the nearest minyan by ZIP, neighborhood, or shul name. You can also search by tefillah name directly.',
        examples: [
          'MINYAN 11225',
          'MINYAN 770 Eastern Pkwy',
          'shacharis Crown Heights',
          'mincha 11213',
          'maariv Williamsburg',
        ],
        related: [{ label: 'Add your shul: text ADD MINYAN', href: 'sms:+18885163399?body=ADD%20MINYAN' }],
        detailHelp: 'Text: MINYAN ?',
      },
    ],
  },
  {
    heading: 'Jobs & Workforce',
    emoji: '💼',
    blurb:
      'Find work or post a job. Free for both sides. ZIP-coded so notifications stay relevant.',
    commands: [
      {
        cmd: 'JOBS',
        title: 'Job board',
        desc:
          'Walks you through a menu: looking for work, hiring, or posting a job. Includes specialized categories like babysitter, cleaning, para, home attendant, cook, tutor, driver, mover, etc.',
        examples: ['JOBS', 'JOBS 11225', 'JOBS Crown Heights', 'ADD JOB', 'HIRE driver Crown Heights'],
        subscribe: 'SUBSCRIBE JOBS 11225',
        related: [{ label: 'Web view of all jobs →', href: '/jobs' }],
        detailHelp: 'Text: JOBS ?',
      },
    ],
  },
  {
    heading: 'Specials & Deals',
    emoji: '🏷️',
    blurb: 'Weekly grocery and store specials from the kosher supermarkets in your area.',
    commands: [
      {
        cmd: 'SPECIALS',
        title: 'Kosher grocery deals',
        desc:
          'Get a list of stores in your area. Reply with the store number to see this week\u2019s deals. Updated every Thursday morning before Shabbos shopping.',
        examples: [
          'SPECIALS 11225',
          'SPECIALS Williamsburg',
          'SPECIALS Lakewood',
        ],
        detailHelp: 'Text: SPECIALS ?',
      },
    ],
  },
  {
    heading: 'Charity, Gmach & Shidduch',
    emoji: '❤️',
    blurb:
      'Tzedaka, free-loan offers, and matchmaking services — all accessible by SMS.',
    commands: [
      {
        cmd: 'CHARITY',
        title: 'Tzedaka & donations',
        desc:
          'Search for charity organizations by category and area. List your nonprofit (free for registered organizations).',
        examples: [
          'CHARITY food 11225',
          'CHARITY medical Crown Heights',
          'DONATE [organization name]',
          'ADD CHARITY',
        ],
        subscribe: 'SUBSCRIBE CHARITY 11225',
        related: [{ label: 'Submit a charity →', href: '/add-charity' }],
        detailHelp: 'Text: CHARITY ?',
      },
      {
        cmd: 'GMACH',
        title: 'Free-loan services',
        desc:
          'Subscribe to nearby Gmach offers — baby items, wedding goods, money, medical, furniture, food, and more. Each offer includes a contact and pickup info.',
        examples: ['SUBSCRIBE GMACH 11225', 'UNSUBSCRIBE GMACH'],
        subscribe: 'SUBSCRIBE GMACH 11225',
        detailHelp: 'Text: GMACH ?',
      },
      {
        cmd: 'SHIDDUCH',
        title: 'Matchmaking & singles',
        desc:
          'Three options: looking for a shidduch, a shadchan registering, or submitting a resume. All info is kept private.',
        examples: ['SHIDDUCH', 'SHIDDUCHIM'],
        related: [
          { label: 'Full matchmaking site →', href: 'https://getashidduch.org' },
        ],
        detailHelp: 'Text: SHIDDUCH ?',
      },
    ],
  },
  {
    heading: 'Subscriptions & Account',
    emoji: '📬',
    blurb:
      'Subscribe to topical alerts. Manage what you receive. Stop anytime with a single keyword.',
    commands: [
      {
        cmd: 'SUBSCRIBE',
        title: 'Subscribe to alerts',
        desc:
          'Get notified when new items are posted in the categories you care about. All subscriptions are free.',
        alias: ['SUB <topic>'],
        examples: [
          'SUBSCRIBE SIMCHA',
          'SUBSCRIBE LECHAIM',
          'SUBSCRIBE GMACH 11225',
          'SUBSCRIBE JOBS 11225',
          'SUBSCRIBE CHARITY 11225',
          'SUBSCRIBE SFIRA',
          'SUBSCRIBE ROSH CHODESH',
          'SUBSCRIBE BIRKAT LEVANA',
        ],
        detailHelp: 'Text: SUBSCRIBE ?',
      },
      {
        cmd: 'MY SUBS',
        title: 'View your subscriptions',
        desc: 'Lists every alert topic you\u2019re currently subscribed to.',
        examples: ['MY SUBS'],
        detailHelp: 'No arguments needed.',
      },
      {
        cmd: 'UNSUBSCRIBE',
        title: 'Unsubscribe from a topic',
        desc:
          'Pass a topic to stop one feed, or send UNSUBSCRIBE alone to stop all alerts at once.',
        alias: ['UNSUB <topic>'],
        examples: ['UNSUBSCRIBE SIMCHA', 'UNSUB GMACH', 'UNSUBSCRIBE'],
        detailHelp: '',
      },
      {
        cmd: 'MENU',
        title: 'Show the main menu',
        desc:
          'Returns the full list of top-level commands. Also accepts START or ?.',
        alias: ['START', '?'],
        examples: ['MENU', 'START', '?'],
        detailHelp: '',
      },
      {
        cmd: 'HELP',
        title: 'Compliance auto-reply',
        desc:
          'Carrier-required help message: pointer to support and STOP/MENU keywords. Msg & data rates may apply.',
        examples: ['HELP'],
        detailHelp: '',
      },
      {
        cmd: 'STOP',
        title: 'Opt out completely',
        desc:
          'Stops every message from Connect2Kehilla. Send START to resubscribe.',
        examples: ['STOP', 'START'],
        detailHelp: '',
      },
    ],
  },
  {
    heading: 'List Your Business',
    emoji: '🏪',
    blurb:
      'Get into the directory so kosher-phone users can text-find you. Free basic listing.',
    commands: [
      {
        cmd: 'ADD BUSINESS',
        title: 'Submit a business by SMS',
        desc:
          'You\u2019ll get a step-by-step template asking for name, category, phone, address, email, hours, and whether you offer specials.',
        examples: ['ADD BUSINESS'],
        related: [
          { label: 'Submit on the web →', href: '/add-business' },
          { label: 'Add a service (handyman, driver, etc.) →', href: '/add-service' },
          { label: 'Pricing & premium →', href: '/pricing' },
        ],
        detailHelp: 'Email list@connect2kehilla.com for help.',
      },
    ],
  },
]

function CommandCard({ c }: { c: Command }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-white hover:border-emerald-300 hover:shadow transition">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
        <h3 className="text-lg font-bold text-gray-900 font-mono tracking-tight">
          {c.cmd}
        </h3>
        {c.alias && (
          <span className="text-xs text-gray-500 font-mono">also: {c.alias.join(' / ')}</span>
        )}
      </div>
      <p className="text-sm font-semibold text-emerald-700 mb-2">{c.title}</p>
      <p className="text-gray-700 text-sm leading-relaxed mb-3">{c.desc}</p>

      {c.examples.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-3 mb-3">
          <p className="text-emerald-400 text-xs font-mono uppercase tracking-wider mb-1.5">Examples</p>
          <ul className="space-y-0.5">
            {c.examples.map(ex => (
              <li key={ex} className="text-emerald-100 font-mono text-sm">
                <span className="text-gray-500">▸</span> {ex}
              </li>
            ))}
          </ul>
        </div>
      )}

      {c.subscribe && (
        <div className="text-xs text-gray-600 mb-2">
          📬 Subscribe: <span className="font-mono text-emerald-700">{c.subscribe}</span>
        </div>
      )}

      {c.related && c.related.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm pt-2 border-t border-gray-100">
          {c.related.map(r => (
            <Link
              key={r.href}
              href={r.href}
              className="text-emerald-700 hover:text-emerald-800 font-medium"
            >
              {r.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ServicesPage() {
  const allCommands = GROUPS.flatMap(g => g.commands)
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to use Connect2Kehilla SMS commands',
    description:
      'Every SMS keyword Connect2Kehilla accepts and how to use it.',
    step: allCommands.map((c, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: c.cmd,
      text: c.desc,
    })),
  }

  return (
    <main id="main-content" className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-white font-black text-xl">
            Connect<span className="text-emerald-500">2</span>Kehilla
          </Link>
          <Link href="/" className="text-gray-300 hover:text-white text-sm">← Home</Link>
        </div>
      </nav>

      <header className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white py-14">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-emerald-200 font-semibold uppercase tracking-wider mb-3 text-sm">Our Service</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Every SMS command, in one place
          </h1>
          <p className="text-xl text-emerald-100 leading-relaxed">
            Text <a href="sms:+18885163399" className="underline font-bold">(888) 516-3399</a>{' '}
            with any of the keywords below. Add a ZIP code or neighborhood to make results local.
          </p>
        </div>
      </header>

      <section className="bg-gray-50 border-b border-gray-200 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Quick reference</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {GROUPS.flatMap(g => g.commands).map(c => (
              <a
                key={c.cmd}
                href={`#${c.cmd.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                className="block bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-emerald-400 hover:bg-emerald-50 transition"
              >
                <div className="font-mono font-bold text-gray-900 text-sm">{c.cmd}</div>
                <div className="text-xs text-gray-500 truncate">{c.title}</div>
              </a>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-5">
            <strong className="text-gray-700">Tip:</strong> add a question mark to any command for in-message help.
            Example: <span className="font-mono">JOBS ?</span>
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 space-y-14">
        {GROUPS.map(g => (
          <div key={g.heading}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl" aria-hidden="true">{g.emoji}</span>
              <h2 className="text-3xl font-bold text-gray-900">{g.heading}</h2>
            </div>
            <p className="text-gray-600 mb-6 max-w-3xl">{g.blurb}</p>
            <div className="grid md:grid-cols-2 gap-5">
              {g.commands.map(c => (
                <div
                  key={c.cmd}
                  id={c.cmd.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                  className="scroll-mt-24"
                >
                  <CommandCard c={c} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="bg-gray-900 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">Try it now</h2>
          <p className="text-blue-200 mb-6">
            Pick any command above. Text it to (888) 516-3399 and you&apos;ll get an answer in seconds — even on a kosher flip phone.
          </p>
          <a
            href="sms:+18885163399"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-xl text-lg"
          >
            📱 Text (888) 516-3399
          </a>
          <p className="text-xs text-gray-500 mt-6">
            Msg &amp; data rates may apply. Reply STOP to opt out, HELP for support.
          </p>
        </div>
      </section>
    </main>
  )
}
