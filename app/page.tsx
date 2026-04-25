// app/page.tsx
// Landing page for Connect2Kehilla — Kosher Phone SMS Directory
'use client'

import { useEffect, useState } from 'react'
import WhitepaperDownload from '@/components/WhitepaperDownload'

// SMS conversation that plays on the phone mockup
const SMS_CONVERSATION = [
  { type: 'sent', text: 'plumber 11205', delay: 1000 },
  { type: 'received', text: 'Found 3 plumber:\n\n1. Goldstein Plumbing\n   📞 718-555-1234\n   📍 Williamsburg', delay: 2000 },
  { type: 'sent', text: 'specials', delay: 4000 },
  { type: 'received', text: '🏷 Kosher Store Specials:\n1. Rosemary Kosher\n2. KosherTown\n3. Empire Kosher\n\nReply 1-3 for deals', delay: 2500 },
  { type: 'sent', text: '1', delay: 2000 },
  { type: 'received', text: '🏷 Rosemary Kosher Specials:\n• Coca Cola 2L $1.99\n• Bamba $0.99\n• Grape Juice $4.99', delay: 2500 },
  { type: 'sent', text: 'rent a car', delay: 3000 },
  { type: 'received', text: 'Found 3 car rentals:\n\n1. Rent Smart Car\n   📞 718-948-0101\n2. Swefy Rent A Car\n   📞 718-963-1200', delay: 2000 },
]

function PhoneMockup() {
  const [messages, setMessages] = useState<typeof SMS_CONVERSATION>([])
  const [currentIdx, setCurrentIdx] = useState(0)

  useEffect(() => {
    if (currentIdx >= SMS_CONVERSATION.length) {
      // Reset after pause
      const t = setTimeout(() => { setMessages([]); setCurrentIdx(0) }, 5000)
      return () => clearTimeout(t)
    }
    const msg = SMS_CONVERSATION[currentIdx]
    const t = setTimeout(() => {
      setMessages(prev => [...prev, msg])
      setCurrentIdx(prev => prev + 1)
    }, msg.delay)
    return () => clearTimeout(t)
  }, [currentIdx])

  return (
    <div className="relative mx-auto" style={{ width: '240px' }}>
      {/* Flip phone — top screen part */}
      <div className="rounded-t-[28px] bg-gray-800 border-2 border-gray-600 shadow-2xl overflow-hidden" style={{ borderBottom: 'none' }}>
        {/* Hinge line */}
        <div className="h-1 bg-gray-600" />
        {/* Small screen area */}
        <div className="mx-3 mt-2 mb-1 rounded-lg bg-black overflow-hidden" style={{ height: '320px' }}>
          {/* Status bar */}
          <div className="flex justify-between items-center px-2 py-1 text-white text-[9px] bg-gray-900">
            <span>📶</span>
            <span className="font-bold text-emerald-400">Connect2Kehilla</span>
            <span>🔋</span>
          </div>
          {/* Header */}
          <div className="bg-emerald-700 px-2 py-1 text-center">
            <p className="text-white font-bold text-[11px]">(888) 516-3399</p>
          </div>
          {/* Messages */}
          <div className="px-1.5 py-1 space-y-1 overflow-hidden" style={{ height: '270px' }}>
            {messages.slice(-6).map((msg, i) => (
              <div key={i} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                   style={{ animation: 'slide-up 0.3s ease-out' }}>
                <div className={`max-w-[88%] px-2 py-1 rounded-lg text-[10px] leading-tight whitespace-pre-line ${
                  msg.type === 'sent'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {currentIdx < SMS_CONVERSATION.length && messages.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-gray-400 text-[10px]">
                  <span className="animate-pulse">●●●</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="h-2" />
      </div>

      {/* Hinge */}
      <div className="h-3 bg-gray-700 border-x-2 border-gray-600 flex items-center justify-center">
        <div className="w-16 h-1 bg-gray-500 rounded-full" />
      </div>

      {/* Keypad */}
      <div className="rounded-b-[28px] bg-gray-800 border-2 border-gray-600 border-t-0 px-4 py-3 shadow-2xl">
        {/* D-pad */}
        <div className="flex justify-center mb-2">
          <div className="w-14 h-14 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
          </div>
        </div>
        {/* Number keys */}
        <div className="grid grid-cols-3 gap-1.5">
          {['1','2 ABC','3 DEF','4 GHI','5 JKL','6 MNO','7 PQRS','8 TUV','9 WXYZ','* +','0','#'].map((key, i) => (
            <div key={i} className="bg-gray-700 hover:bg-gray-600 rounded-lg py-1.5 text-center cursor-default transition">
              <span className="text-white text-xs font-bold">{key.split(' ')[0]}</span>
              {key.split(' ')[1] && <span className="text-gray-400 text-[7px] block">{key.split(' ')[1]}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [counts, setCounts] = useState<{ businesses: number; shuls: number; total: number } | null>(null)
  useEffect(() => {
    fetch('/api/stats/count')
      .then(r => r.json())
      .then(d => setCounts({ businesses: d.businesses || 0, shuls: d.shuls || 0, total: d.total || 0 }))
      .catch(() => {})
  }, [])
  const businessesLabel = counts ? counts.businesses.toLocaleString() : '9,000'
  const totalLabel = counts ? counts.total.toLocaleString() : '9,000'

  return (
    <main id="main-content" className="min-h-screen bg-white">
      <style>{`
        @keyframes pulse-green { 0%,100%{box-shadow:0 0 0 0 rgba(5,150,105,0.4)} 70%{box-shadow:0 0 0 15px rgba(5,150,105,0)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .pulse-btn { animation: pulse-green 2s infinite; }
      `}</style>

      {/* ═══ TOP NAVIGATION ═══ */}
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="text-white font-black text-xl">Connect<span className="text-emerald-500">2</span>Kehilla</a>
          <div className="hidden md:flex gap-6 text-sm">
            <a href="/services" className="text-gray-300 hover:text-white transition">📱 Our Service</a>
            <a href="/research" className="text-gray-300 hover:text-white transition">📊 Research</a>
            <a href="/investors" className="text-gray-300 hover:text-white transition">💼 For Investors</a>
            <a href="/faq" className="text-gray-300 hover:text-white transition">❓ FAQ</a>
            <a href="/pricing" className="text-gray-300 hover:text-white transition">💰 Pricing</a>
            <a href="/add-business" className="text-gray-300 hover:text-white transition">🏪 Add Business</a>
          </div>
          <a href="sms:+18885163399" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold">📱 Text Us</a>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden border-t border-gray-800 px-4 py-2 flex flex-wrap gap-3 text-xs">
          <a href="/services" className="text-gray-300">Our Service</a>
          <a href="/research" className="text-gray-300">Research</a>
          <a href="/investors" className="text-gray-300">Investors</a>
          <a href="/faq" className="text-gray-300">FAQ</a>
          <a href="/pricing" className="text-gray-300">Pricing</a>
          <a href="/add-business" className="text-gray-300">Add Business</a>
        </div>
      </nav>

      {/* ═══ HERO — Dark gradient with phone image ═══ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #1e4d6e 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(5,150,105,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-50px] left-[-50px] w-[300px] h-[300px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(201,162,39,0.1) 0%, transparent 70%)' }} />

        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left — Text */}
            <div className="text-center md:text-left slide-up">
              <div className="inline-block bg-emerald-500/20 border border-emerald-500/40 rounded-full px-4 py-1.5 mb-6">
                <span className="text-emerald-400 font-semibold text-sm tracking-wide">📱 KOSHER PHONE SERVICE</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
                Connect<span style={{ color: '#059669' }}>2</span>Kehilla
              </h1>

              <p className="text-xl md:text-2xl text-blue-200 mb-2 font-light">
                The Community Directory That Works
              </p>
              <p className="text-2xl md:text-3xl font-bold mb-8" style={{ color: '#C9A227' }}>
                WITHOUT Internet!
              </p>

              <p className="text-blue-300 text-lg mb-8 max-w-md mx-auto md:mx-0">
                {businessesLabel}+ businesses at your fingertips. Just send a text — no apps, no internet, no smartphone needed.
              </p>

              {/* Phone number CTA */}
              <a href="sms:+18885163399" className="inline-block pulse-btn" style={{ background: 'linear-gradient(135deg, #059669, #047857)', padding: '16px 40px', borderRadius: '16px', textDecoration: 'none' }}>
                <p className="text-emerald-200 text-xs uppercase tracking-widest mb-1 text-center">Text Us Now</p>
                <p className="text-white text-3xl md:text-4xl font-black text-center">(888) 516-3399</p>
              </a>

              <p className="text-blue-400 text-sm mt-4">🌐 English • עברית • אידיש</p>
            </div>

            {/* Right — Animated Kosher Phone */}
            <div className="flex justify-center">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ QUICK LINKS ═══ */}
      <section className="py-10 px-4 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <a href="/faq" className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 rounded-xl p-4 hover:border-blue-400 hover:shadow-lg transition text-center">
              <div className="text-3xl mb-2">❓</div>
              <div className="font-bold text-gray-800 text-sm">FAQ</div>
              <div className="text-xs text-gray-500 mt-1">How to use</div>
            </a>
            <a href="/pricing" className="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-100 rounded-xl p-4 hover:border-yellow-400 hover:shadow-lg transition text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="font-bold text-gray-800 text-sm">Pricing</div>
              <div className="text-xs text-gray-500 mt-1">5 plans</div>
            </a>
            <a href="/jobs" className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-100 rounded-xl p-4 hover:border-purple-400 hover:shadow-lg transition text-center">
              <div className="text-3xl mb-2">📋</div>
              <div className="font-bold text-gray-800 text-sm">Jobs Board</div>
              <div className="text-xs text-gray-500 mt-1">Hire & work</div>
            </a>
            <a href="/add-business" className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-100 rounded-xl p-4 hover:border-emerald-400 hover:shadow-lg transition text-center">
              <div className="text-3xl mb-2">🏪</div>
              <div className="font-bold text-gray-800 text-sm">Add Business</div>
              <div className="text-xs text-gray-500 mt-1">Store/Office</div>
            </a>
            <a href="/add-service" className="bg-gradient-to-br from-orange-50 to-white border-2 border-orange-100 rounded-xl p-4 hover:border-orange-400 hover:shadow-lg transition text-center">
              <div className="text-3xl mb-2">🔧</div>
              <div className="font-bold text-gray-800 text-sm">Add Service</div>
              <div className="text-xs text-gray-500 mt-1">Individual</div>
            </a>
          </div>
        </div>
      </section>

      {/* ═══ RABBINICAL APPROVAL ═══ */}
      <section className="py-12 px-4 bg-gradient-to-br from-stone-50 to-amber-50 border-y-2 border-amber-200" aria-labelledby="rabbinical-approval-heading">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              '@id': 'https://www.connect2kehilla.com/#organization',
              award: 'Recognized by the Beis Din of Crown Heights as a valuable and appropriate service for the community',
              hasCredential: {
                '@type': 'EducationalOccupationalCredential',
                credentialCategory: 'Rabbinical Approval',
                name: 'Recognition by the Beis Din of Crown Heights',
                description:
                  'Connect2Kehilla is recognized by the Beis Din of Crown Heights as a valuable and appropriate service for the Jewish community, maintaining the highest standards of technology use as outlined by our Rabbonim.',
                recognizedBy: {
                  '@type': 'Organization',
                  name: 'Beis Din of Crown Heights',
                  alternateName: ['Beth Din of Crown Heights', 'Vaad Hakashrus of Crown Heights'],
                  areaServed: { '@type': 'Place', name: 'Crown Heights, Brooklyn' },
                },
              },
            }),
          }}
        />
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md border border-amber-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-700 to-amber-800 text-white px-6 py-3 flex items-center justify-center gap-2">
              <span className="text-2xl" aria-hidden="true">🕍</span>
              <h2 id="rabbinical-approval-heading" className="text-lg md:text-xl font-bold tracking-wide uppercase">
                Rabbinical Approval
              </h2>
              <span className="text-2xl" aria-hidden="true">🕍</span>
            </div>
            <div className="p-6 md:p-8 text-center">
              <p className="text-gray-800 text-lg md:text-xl leading-relaxed font-medium">
                Connect2Kehilla is proud to be recognized by the{' '}
                <strong className="text-amber-900">Beis Din of Crown Heights</strong>{' '}
                as a valuable and appropriate service for the community.
              </p>
              <p className="text-gray-700 mt-3 text-base md:text-lg">
                We maintain the highest standards of technology use as outlined by our Rabbonim.
              </p>
              <p className="text-xs text-gray-500 mt-6 italic">
                Official signed certificate to be displayed here once received.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS — 4 Examples ═══ */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-2">How It Works</h2>
          <p className="text-center text-gray-500 mb-12">Just text what you need — get answers instantly</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🔧', cmd: 'plumber 11205', result: 'Find plumbers in Williamsburg' },
              { icon: '🏷️', cmd: 'specials williamsburg', result: 'Grocery store deals & prices' },
              { icon: '🕍', cmd: 'mincha 11225', result: 'Minyan times near you' },
              { icon: '🚗', cmd: 'rent a car', result: 'Car rental options instantly' },
            ].map((ex, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-lg border-2 border-gray-100 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 text-center">
                <div className="text-4xl mb-3">{ex.icon}</div>
                <div className="bg-gray-900 rounded-lg px-3 py-2 mb-3 inline-block">
                  <p className="text-emerald-400 font-mono text-xs">TXT</p>
                  <p className="text-white font-bold text-sm">&quot;{ex.cmd}&quot;</p>
                </div>
                <p className="text-gray-600 text-sm">{ex.result}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f172a)' }} className="py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 px-4 text-center">
          {[
            { val: `${totalLabel}+`, lbl: 'Businesses Listed' },
            { val: '🏷️', lbl: 'Store Specials' },
            { val: '🕍', lbl: 'Minyan Times' },
            { val: '📱', lbl: 'Works on Any Kosher Phone' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-2xl md:text-3xl font-black" style={{ color: '#C9A227' }}>{s.val}</p>
              <p className="text-blue-300 text-sm mt-1">{s.lbl}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ A2P COMPLIANCE + CTA ═══ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-3xl shadow-xl p-8 border-2 border-emerald-100">
            <p className="text-gray-600 mb-4 text-lg">
              Find local businesses instantly — just send a text!
            </p>

            <div className="rounded-2xl p-6 mb-6" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
              <p className="text-emerald-200 mb-1 text-xs uppercase tracking-widest">Text us at:</p>
              <a
                href="sms:+18885163399"
                aria-label="Send SMS to Connect2Kehilla at (888) 516-3399"
                className="text-4xl md:text-5xl font-black text-white hover:text-emerald-100 transition block"
              >
                (888) 516-3399
              </a>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 mb-6 text-left max-w-sm mx-auto">
              <p className="text-emerald-400 text-xs font-mono mb-1">Example message:</p>
              <p className="font-mono text-lg text-white">&quot;plumber 11211&quot;</p>
              <p className="text-emerald-400/70 text-sm mt-1">→ Get plumbers near Williamsburg</p>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>By texting this number, you consent to receive SMS replies</strong>
                {" "}with business contact information.
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Msg &amp; Data rates may apply. Message frequency varies.
              </p>
              <p className="text-sm text-gray-500 mb-3">
                Reply <span className="font-bold text-gray-700">STOP</span> to opt out.
                Reply <span className="font-bold text-gray-700">HELP</span> for assistance.
              </p>
              <p className="text-xs text-gray-400">
                <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>
                {" • "}
                <a href="/terms" className="underline hover:text-gray-600">Terms of Service</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHITE PAPER DOWNLOAD ═══ */}
      <WhitepaperDownload variant="banner" source="homepage" />

      {/* ═══ USER REVIEWS ═══ */}
      <section className="py-16 px-4 bg-gradient-to-br from-amber-50 via-white to-emerald-50" aria-labelledby="reviews-heading">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Service',
              '@id': 'https://www.connect2kehilla.com/#service',
              name: 'Connect2Kehilla SMS Directory',
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '5',
                bestRating: '5',
                worstRating: '5',
                ratingCount: '4',
                reviewCount: '4',
              },
              review: [
                {
                  '@type': 'Review',
                  author: { '@type': 'Person', name: 'Luzy S.' },
                  reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
                  reviewBody: "Keeping track of the latest specials and discounts at local stores has become much easier with this service. I used to rely on paper flyers that weren't always around, but now all the info comes straight to my phone via SMS. It's a real baleboosteh's dream for saving time and money.",
                },
                {
                  '@type': 'Review',
                  author: { '@type': 'Person', name: 'Duvid G.' },
                  reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
                  reviewBody: "Finding a specific business or service within the kehilla has become significantly simpler. Whether I'm looking for a job or a gmach, everything is available through a single request. The database is impressive; I'd just love to see more user reviews integrated so we can share our experiences with different local vendors.",
                },
                {
                  '@type': 'Review',
                  author: { '@type': 'Person', name: 'Yoel H.' },
                  reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
                  reviewBody: "This is an essential tool for anyone who travels. When you're in an unfamiliar area, you can easily find a kosher restaurant or a cafe with the specific hechsher you trust. It gives you peace of mind knowing you can find a place to eat that meets your standards, no matter where you are.",
                },
                {
                  '@type': 'Review',
                  author: { '@type': 'Person', name: 'Ari K.' },
                  reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
                  reviewBody: "The ability to verify the active kashrus status of a product or establishment via a simple SMS is nothing short of incredible! For a kosher phone user with no internet access, having this information available mamesh on the spot is a game-changer.",
                },
              ],
            }),
          }}
        />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-emerald-700 font-bold uppercase tracking-widest text-sm mb-2">What users say</p>
            <h2 id="reviews-heading" className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              Trusted by the Kehilla
            </h2>
            <div className="flex items-center justify-center gap-1 text-amber-500 text-2xl">
              ★★★★★
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: 'Luzy S.',
                initials: 'LS',
                color: 'bg-emerald-600',
                quote:
                  "Keeping track of the latest specials and discounts at local stores has become much easier with this service. I used to rely on paper flyers that weren't always around, but now all the info comes straight to my phone via SMS. It's a real baleboosteh's dream for saving time and money.",
              },
              {
                name: 'Duvid G.',
                initials: 'DG',
                color: 'bg-blue-600',
                quote:
                  "Finding a specific business or service within the kehilla has become significantly simpler. Whether I'm looking for a job or a gmach, everything is available through a single request. The database is impressive; I'd just love to see more user reviews integrated so we can share our experiences with different local vendors.",
              },
              {
                name: 'Yoel H.',
                initials: 'YH',
                color: 'bg-purple-600',
                quote:
                  "This is an essential tool for anyone who travels. When you're in an unfamiliar area, you can easily find a kosher restaurant or a cafe with the specific hechsher you trust. It gives you peace of mind knowing you can find a place to eat that meets your standards, no matter where you are.",
              },
              {
                name: 'Ari K.',
                initials: 'AK',
                color: 'bg-amber-600',
                quote:
                  "The ability to verify the active kashrus status of a product or establishment via a simple SMS is nothing short of incredible! For a kosher phone user with no internet access, having this information available mamesh on the spot is a game-changer.",
              },
            ].map(r => (
              <figure
                key={r.name}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col"
              >
                <div className="flex items-center gap-1 text-amber-500 mb-3">
                  <span aria-label="5 out of 5 stars">★★★★★</span>
                </div>
                <blockquote className="text-gray-700 leading-relaxed flex-grow">
                  <span className="text-emerald-300 text-3xl leading-none align-top mr-1">&ldquo;</span>
                  {r.quote}
                </blockquote>
                <figcaption className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                  <div className={`w-10 h-10 rounded-full ${r.color} text-white flex items-center justify-center font-bold text-sm`}>
                    {r.initials}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-500">Verified user</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOR BUSINESSES ═══ */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-emerald-500/20 border border-emerald-500/40 rounded-full px-4 py-1.5 mb-4">
            <span className="text-emerald-400 font-semibold text-sm">FOR BUSINESS OWNERS</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            Reach Customers Who <span style={{ color: '#C9A227' }}>CAN&apos;T</span> Google You
          </h2>
          <p className="text-blue-300 text-lg mb-8 max-w-2xl mx-auto">
            Thousands of kosher phone users search for services every day.
            Make sure they find YOUR business.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: '📲', title: 'SMS Results', desc: 'Customers text a keyword — your business shows up' },
              { icon: '⭐', title: 'Premium Listing', desc: 'Always appear FIRST above free listings' },
              { icon: '📊', title: 'Lead Tracking', desc: 'See how many customers found you' },
            ].map((b, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/10">
                <div className="text-3xl mb-2">{b.icon}</div>
                <h3 className="text-white font-bold mb-1">{b.title}</h3>
                <p className="text-blue-300 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="tel:+18885163399" className="inline-block text-white font-bold px-8 py-4 rounded-xl text-lg transition hover:opacity-90" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
              📞 Call (888) 516-3399
            </a>
            <a href="mailto:list@connect2kehilla.com" className="inline-block bg-white/10 border-2 border-white/30 text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-white/20 transition">
              📧 list@connect2kehilla.com
            </a>
          </div>
          <p className="text-emerald-400 text-sm mt-4 font-semibold">Free Basic Listing • Premium Plans Available</p>
        </div>
      </section>

      {/* ═══ TAGLINE ═══ */}
      <section className="py-8 text-center" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
        <p className="text-3xl md:text-4xl font-black text-white tracking-wide">
          Text. Find. Connect.
        </p>
        <p className="text-emerald-200 mt-2">Works on any kosher phone — no internet required</p>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-gray-900 py-8 text-center text-gray-400 text-sm">
        <p className="font-semibold text-white mb-2">
          Connect2Kehilla — Kosher Phone SMS Directory
        </p>
        <p className="mb-1">
          Phone: <a href="tel:+18885163399" className="hover:text-white underline">(888) 516-3399</a>
        </p>
        <p className="mb-4">
          <a href="mailto:info@connect2kehilla.com" className="hover:text-white underline">
            info@connect2kehilla.com
          </a>
        </p>
        <p className="text-gray-500">© 2026 Connect2Kehilla. All rights reserved.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
          <a href="/faq" className="hover:text-white underline">FAQ</a>
          <span>•</span>
          <a href="/pricing" className="hover:text-white underline">Pricing</a>
          <span>•</span>
          <a href="/jobs" className="hover:text-white underline">Jobs</a>
          <span>•</span>
          <a href="/add-business" className="hover:text-white underline">Add Business</a>
          <span>•</span>
          <a href="/add-service" className="hover:text-white underline">Add Service</a>
          <span>•</span>
          <a href="/privacy" className="hover:text-white underline">Privacy</a>
          <span>•</span>
          <a href="/terms" className="hover:text-white underline">Terms</a>
        </div>
        <p className="mt-4 text-gray-500">
          SMS: (888) 516-3399 • Reply STOP to unsubscribe • Reply HELP for support
        </p>
      </footer>
    </main>
  )
}
