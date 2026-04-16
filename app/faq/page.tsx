'use client'

import { useState, useEffect } from 'react'

// Phone mockup with animated SMS conversation — shows specific flow based on selected FAQ
const DEMO_FLOWS: Record<string, { type: 'sent' | 'received'; text: string; delay: number }[]> = {
  findService: [
    { type: 'sent', text: 'plumber 11211', delay: 800 },
    { type: 'received', text: 'Found 3 plumber:\n\n1. Goldstein Plumbing\n   📞 718-555-1234\n   📍 Williamsburg\n\n2. Quick Fix Plumbing\n   📞 347-555-9876\n   📍 Brooklyn', delay: 1500 },
  ],
  specials: [
    { type: 'sent', text: 'specials williamsburg', delay: 800 },
    { type: 'received', text: '🏷 Williamsburg Stores:\n1. Rosemary Kosher\n2. Pom People\n3. Southside Kosher\n\nReply 1-3 for specials', delay: 1500 },
    { type: 'sent', text: '1', delay: 2000 },
    { type: 'received', text: '🏷 Rosemary Kosher Specials:\n• Coca Cola 2L $1.99 (was $3.49)\n• Bamba $0.99 (was $1.49)\n• Grape Juice $4.99', delay: 1500 },
  ],
  registerWorker: [
    { type: 'sent', text: 'JOBS', delay: 800 },
    { type: 'received', text: '📋 JOBS & WORKERS\n\n1️⃣ Looking for work\n2️⃣ Hiring\n3️⃣ Post a job\n\nReply 1, 2 or 3', delay: 1500 },
    { type: 'sent', text: '1', delay: 2000 },
    { type: 'received', text: '👷 REGISTER AS WORKER\n\n1️⃣ Men jobs\n2️⃣ Women jobs', delay: 1500 },
    { type: 'sent', text: '2', delay: 2000 },
    { type: 'received', text: '👩 WOMEN JOBS:\n1️⃣ 👶 Babysitter\n2️⃣ 🧹 Cleaning\n3️⃣ 🧩 Para\n4️⃣ 🏠 Home Attendant\n5️⃣ 👩‍🍳 Cook\n6️⃣ 📚 Tutor', delay: 1500 },
    { type: 'sent', text: '3', delay: 2000 },
    { type: 'received', text: '📍 Para (Special Needs)\nIn which area?', delay: 1500 },
    { type: 'sent', text: 'Williamsburg', delay: 2000 },
    { type: 'received', text: '✅ Listed as Para in Williamsburg!\n⏰ Active until May 15, 2026\n\nReply with description:\nExperience, availability, pay', delay: 1500 },
  ],
  hiring: [
    { type: 'sent', text: 'HIRE driver Crown Heights', delay: 800 },
    { type: 'received', text: '👷 Found 3 Driver in Crown Heights:\n\n1. +17185551234\n   CDL license, box truck, evenings\n\n2. +13475555678\n   Moving, deliveries, 24/7\n\nCall directly — FREE!', delay: 1500 },
  ],
  help: [
    { type: 'sent', text: 'HELP', delay: 800 },
    { type: 'received', text: '📱 Connect2Kehilla\n\n🔍 Find: "plumber 11211"\n🏷 Deals: "specials"\n👷 Work: "JOBS"\n🕍 Minyan: "mincha 11225"\n\n17,000+ businesses', delay: 1500 },
  ],
}

type DemoKey = keyof typeof DEMO_FLOWS

function PhoneMockup({ flow }: { flow: DemoKey }) {
  const [messages, setMessages] = useState<typeof DEMO_FLOWS.findService>([])
  const [idx, setIdx] = useState(0)
  const conversation = DEMO_FLOWS[flow]

  useEffect(() => {
    setMessages([])
    setIdx(0)
  }, [flow])

  useEffect(() => {
    if (idx >= conversation.length) {
      const t = setTimeout(() => { setMessages([]); setIdx(0) }, 5000)
      return () => clearTimeout(t)
    }
    const msg = conversation[idx]
    const t = setTimeout(() => {
      setMessages(prev => [...prev, msg])
      setIdx(prev => prev + 1)
    }, msg.delay)
    return () => clearTimeout(t)
  }, [idx, conversation])

  return (
    <div className="relative mx-auto sticky top-4" style={{ width: '260px' }}>
      {/* Top screen */}
      <div className="rounded-t-[24px] bg-gray-800 border-2 border-gray-600 shadow-2xl overflow-hidden" style={{ borderBottom: 'none' }}>
        <div className="h-1 bg-gray-600" />
        <div className="mx-3 mt-2 mb-1 rounded-lg bg-black overflow-hidden" style={{ height: '340px' }}>
          <div className="flex justify-between items-center px-2 py-1 text-white text-[9px] bg-gray-900">
            <span>📶</span>
            <span className="font-bold text-emerald-400">Connect2Kehilla</span>
            <span>🔋</span>
          </div>
          <div className="bg-emerald-700 px-2 py-1 text-center">
            <p className="text-white font-bold text-[11px]">(888) 516-3399</p>
          </div>
          <div className="px-1.5 py-1 space-y-1 overflow-y-auto" style={{ height: '295px' }}>
            {messages.slice(-8).map((msg, i) => (
              <div key={i} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                   style={{ animation: 'slide-up 0.3s ease-out' }}>
                <div className={`max-w-[90%] px-2 py-1 rounded-lg text-[10px] leading-tight whitespace-pre-line ${
                  msg.type === 'sent' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                }`}>{msg.text}</div>
              </div>
            ))}
            {idx < conversation.length && messages.length > 0 && (
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
      <div className="rounded-b-[24px] bg-gray-800 border-2 border-gray-600 border-t-0 px-3 py-3 shadow-2xl">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-500" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {['1','2 ABC','3 DEF','4 GHI','5 JKL','6 MNO','7 PQRS','8 TUV','9 WXYZ','* +','0','#'].map((key, i) => (
            <div key={i} className="bg-gray-700 rounded py-1 text-center">
              <span className="text-white text-[10px] font-bold">{key.split(' ')[0]}</span>
              {key.split(' ')[1] && <span className="text-gray-400 text-[6px] block">{key.split(' ')[1]}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// FAQ Item component
function FaqItem({ q, a, expanded, onToggle, demoKey, onDemoChange }: {
  q: string; a: React.ReactNode; expanded: boolean; onToggle: () => void; demoKey: DemoKey; onDemoChange: (k: DemoKey) => void
}) {
  return (
    <div className={`bg-white rounded-xl shadow-md border-2 overflow-hidden transition-all ${expanded ? 'border-emerald-300 shadow-xl' : 'border-gray-200'}`}>
      <button
        onClick={() => { onToggle(); if (!expanded) onDemoChange(demoKey) }}
        className={`w-full text-left px-6 py-4 flex justify-between items-center transition ${expanded ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
      >
        <h3 className={`font-bold text-lg ${expanded ? 'text-emerald-800' : 'text-gray-800'}`}>{q}</h3>
        <span className={`text-2xl transition-transform ${expanded ? 'rotate-180 text-emerald-600' : 'text-gray-400'}`}>▼</span>
      </button>
      {expanded && <div className="px-6 py-4 border-t border-gray-100 text-gray-700 leading-relaxed">{a}</div>}
    </div>
  )
}

export default function FaqPage() {
  const [activeDemoKey, setActiveDemoKey] = useState<DemoKey>('findService')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0)

  const faqs: { q: string; demoKey: DemoKey; a: React.ReactNode }[] = [
    {
      q: '📱 What is Connect2Kehilla?',
      demoKey: 'help',
      a: (
        <div className="space-y-3">
          <p><strong>Connect2Kehilla</strong> is an SMS-based community directory designed specifically for <strong>kosher phone users</strong> — people who use flip phones or basic feature phones that <strong>don&apos;t have internet access</strong>.</p>
          <p>A kosher phone is <strong>NOT a smartphone</strong>. It cannot browse websites, download apps, or access Google. Our service works entirely through SMS text messages.</p>
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded">
            <p className="font-bold text-emerald-800">✅ Works on:</p>
            <p>Any flip phone, feature phone, or kosher phone that can send and receive SMS messages.</p>
          </div>
        </div>
      ),
    },
    {
      q: '🔍 How do I find a business or service?',
      demoKey: 'findService',
      a: (
        <div className="space-y-3">
          <p>Simply text <strong>what you need + your area or ZIP code</strong> to <strong>(888) 516-3399</strong>.</p>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-emerald-400 space-y-2">
            <div>TEXT: <span className="text-white">plumber 11211</span></div>
            <div>TEXT: <span className="text-white">electrician Monsey</span></div>
            <div>TEXT: <span className="text-white">shower door Williamsburg</span></div>
            <div>TEXT: <span className="text-white">kosher restaurant Crown Heights</span></div>
          </div>
          <p>You&apos;ll receive up to 3 matching businesses with their names, phone numbers, and locations within seconds.</p>
          <p className="text-sm text-gray-500">💡 Tip: You can text with typos — our system understands common misspellings.</p>
        </div>
      ),
    },
    {
      q: '🏷 How do I see store specials and deals?',
      demoKey: 'specials',
      a: (
        <div className="space-y-3">
          <p>Text <strong>SPECIALS</strong> to see all kosher grocery stores with deals, or specify an area:</p>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-emerald-400 space-y-2">
            <div>TEXT: <span className="text-white">specials</span></div>
            <div>TEXT: <span className="text-white">specials williamsburg</span></div>
            <div>TEXT: <span className="text-white">specials crown heights</span></div>
          </div>
          <p>You&apos;ll get a numbered list of stores. Reply with the number to see that store&apos;s current deals.</p>
          <p>Prices update daily at 7am EST automatically.</p>
        </div>
      ),
    },
    {
      q: '👷 How do I register as available for work?',
      demoKey: 'registerWorker',
      a: (
        <div className="space-y-3">
          <p>If you&apos;re looking for work and want employers to find you, text <strong>JOBS</strong> and follow the interactive menu:</p>
          <ol className="list-decimal ml-6 space-y-2">
            <li>Text <strong>JOBS</strong> to (888) 516-3399</li>
            <li>Reply <strong>1</strong> (Looking for work)</li>
            <li>Pick <strong>1</strong> (Men) or <strong>2</strong> (Women)</li>
            <li>Pick your category number (Babysitter, Driver, etc.)</li>
            <li>Type your area (e.g., Williamsburg)</li>
            <li>Send a description of your experience and availability</li>
          </ol>
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded">
            <p className="font-bold text-emerald-800">✅ You&apos;re listed for 30 days — FREE!</p>
            <p>The system will show you the exact date your listing expires. Text <strong>WORK RENEW</strong> to extend another 30 days.</p>
          </div>
        </div>
      ),
    },
    {
      q: '🏢 How do I find workers to hire?',
      demoKey: 'hiring',
      a: (
        <div className="space-y-3">
          <p>If you need to hire someone, text <strong>HIRE + category + area</strong>:</p>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-emerald-400 space-y-2">
            <div>TEXT: <span className="text-white">HIRE babysitter Williamsburg</span></div>
            <div>TEXT: <span className="text-white">HIRE cleaning Flatbush</span></div>
            <div>TEXT: <span className="text-white">HIRE driver 11213</span></div>
            <div>TEXT: <span className="text-white">HIRE para Crown Heights</span></div>
          </div>
          <p>You&apos;ll get a list of available workers with their phone numbers and descriptions. Call them directly — it&apos;s FREE!</p>
        </div>
      ),
    },
    {
      q: '👩 What job categories are available?',
      demoKey: 'registerWorker',
      a: (
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-pink-700 mb-2">Women&apos;s Categories:</h4>
            <ul className="space-y-1 text-sm">
              <li>👶 <strong>Babysitter / Nanny</strong></li>
              <li>🧹 <strong>Cleaning Lady / Housekeeper</strong></li>
              <li>🧩 <strong>Para (Special Needs Assistant)</strong> — for children with special needs</li>
              <li>🏠 <strong>Home Attendant / Aide</strong> — for elderly or disabled care</li>
              <li>👩‍🍳 <strong>Cook / Chef</strong></li>
              <li>📚 <strong>Tutor / Teacher</strong></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-blue-700 mb-2">Men&apos;s Categories:</h4>
            <ul className="space-y-1 text-sm">
              <li>🚗 <strong>Driver / Delivery</strong></li>
              <li>📦 <strong>Mover / Hauler</strong></li>
              <li>🔧 <strong>Handyman</strong></li>
              <li>🎨 <strong>Painter</strong></li>
              <li>💪 <strong>Helper / General Labor</strong></li>
              <li>📚 <strong>Tutor / Teacher</strong></li>
            </ul>
          </div>
          <p className="text-sm text-gray-500">Don&apos;t see your category? Email <a href="mailto:list@connect2kehilla.com" className="text-blue-600 underline">list@connect2kehilla.com</a></p>
        </div>
      ),
    },
    {
      q: '📋 How do I post a job opening?',
      demoKey: 'registerWorker',
      a: (
        <div className="space-y-3">
          <p>To post a job for others to see, text <strong>JOBS</strong> and follow the menu:</p>
          <ol className="list-decimal ml-6 space-y-1">
            <li>Text <strong>JOBS</strong></li>
            <li>Reply <strong>3</strong> (Post a job)</li>
            <li>Pick Men&apos;s or Women&apos;s category</li>
            <li>Pick the specific role</li>
            <li>Type the area</li>
            <li>Pick job type: Full-time, Part-time, One-time, or Hourly</li>
            <li>Send details: hours, pay rate, requirements</li>
          </ol>
          <p>Your job will be active for 30 days. Workers in that area will see it when they search.</p>
        </div>
      ),
    },
    {
      q: '🕍 How do I find minyan / shul times?',
      demoKey: 'findService',
      a: (
        <div className="space-y-3">
          <p>Text the service you need + area:</p>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-emerald-400 space-y-2">
            <div>TEXT: <span className="text-white">mincha 11225</span></div>
            <div>TEXT: <span className="text-white">shacharis Crown Heights</span></div>
            <div>TEXT: <span className="text-white">maariv Williamsburg</span></div>
            <div>TEXT: <span className="text-white">770</span> (for Nosson&apos;s Shul)</div>
          </div>
        </div>
      ),
    },
    {
      q: '❌ How do I stop receiving messages?',
      demoKey: 'help',
      a: (
        <div className="space-y-3">
          <p>You can stop anytime by texting:</p>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-red-400">
            <div>TEXT: <span className="text-white">STOP</span></div>
          </div>
          <p>You can come back anytime by texting <strong>START</strong>.</p>
          <p>To remove yourself from the workers list: text <strong>WORK STOP</strong></p>
        </div>
      ),
    },
    {
      q: '💰 How much does it cost?',
      demoKey: 'help',
      a: (
        <div className="space-y-3">
          <p className="text-lg"><strong>Connect2Kehilla is FREE for users</strong> — search, find workers, find jobs. No subscription, no fees.</p>
          <p>Standard SMS rates from your carrier apply (usually free on most plans).</p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="font-bold text-blue-800">For Businesses:</p>
            <p className="text-sm">Free basic listing. Premium plans available:</p>
            <ul className="text-sm space-y-1 mt-2">
              <li>• <strong>Free</strong> — basic listing, rotation</li>
              <li>• <strong>Standard $30/8 days</strong> — above free listings</li>
              <li>• <strong>Premium $50/8 days</strong> — always on top</li>
              <li>• <strong>Specials $40/8 days</strong> — featured in specials</li>
            </ul>
            <a href="/pricing" className="text-blue-600 underline text-sm mt-2 inline-block">View all pricing →</a>
          </div>
        </div>
      ),
    },
    {
      q: '🌐 Can I use Hebrew or Yiddish?',
      demoKey: 'help',
      a: (
        <div className="space-y-3">
          <p>Yes! The system understands three languages:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>English</strong> — &quot;plumber 11211&quot;</li>
            <li><strong>עברית (Hebrew)</strong> — &quot;עבודה נהג וויליאמסבורג&quot;</li>
            <li><strong>אידיש (Yiddish)</strong> — &quot;ארבעט פארער וויליאמסבורג&quot;</li>
          </ul>
          <p>You can mix languages in the same message. The system automatically detects the language.</p>
        </div>
      ),
    },
    {
      q: '🏪 How do I add my business to the directory?',
      demoKey: 'help',
      a: (
        <div className="space-y-3">
          <p>Three easy ways:</p>
          <ol className="list-decimal ml-6 space-y-2">
            <li>📞 <strong>Call us:</strong> <a href="tel:+18885163399" className="text-blue-600 underline">(888) 516-3399</a></li>
            <li>📧 <strong>Email:</strong> <a href="mailto:list@connect2kehilla.com" className="text-blue-600 underline">list@connect2kehilla.com</a></li>
            <li>🌐 <strong>Online form:</strong> <a href="/add-business" className="text-blue-600 underline">/add-business</a> (for businesses) or <a href="/add-service" className="text-blue-600 underline">/add-service</a> (for individual services)</li>
          </ol>
          <p>We&apos;ll review and add your business within 24 hours.</p>
        </div>
      ),
    },
    {
      q: '🔒 Is my information private?',
      demoKey: 'help',
      a: (
        <div className="space-y-3">
          <p>Yes! Your privacy is important to us:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Your phone number is <strong>hashed</strong> (encrypted) — never stored in plain text</li>
            <li>We don&apos;t share your number with third parties</li>
            <li>Your searches are logged anonymously for quality improvement only</li>
            <li>When you register as a worker, only your phone number is shown (so employers can call you)</li>
          </ul>
          <p className="text-sm text-gray-500">Read our full <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a>.</p>
        </div>
      ),
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <section className="py-12 px-4" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block bg-emerald-500/20 border border-emerald-500/40 rounded-full px-4 py-1.5 mb-4">
            <span className="text-emerald-400 font-semibold text-sm">❓ FAQ & HOW-TO GUIDE</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3">Frequently Asked Questions</h1>
          <p className="text-lg text-blue-300">Everything you need to know about Connect2Kehilla</p>
          <p className="text-sm text-emerald-400 mt-3">📱 For kosher phone users — no internet required!</p>
        </div>
      </section>

      {/* Content + Phone Mockup */}
      <section className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-3 gap-8">
        {/* FAQ List */}
        <div className="lg:col-span-2 space-y-3">
          {faqs.map((faq, i) => (
            <FaqItem
              key={i}
              q={faq.q}
              a={faq.a}
              expanded={expandedIdx === i}
              onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
              demoKey={faq.demoKey}
              onDemoChange={setActiveDemoKey}
            />
          ))}

          {/* CTA */}
          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border-2 border-emerald-200 mt-8">
            <h3 className="font-bold text-emerald-800 text-xl mb-2">Still have questions?</h3>
            <p className="text-gray-600 mb-4">Call or email us — we&apos;re here to help!</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="tel:+18885163399" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-center hover:bg-emerald-700">📞 (888) 516-3399</a>
              <a href="mailto:info@connect2kehilla.com" className="border-2 border-emerald-600 text-emerald-700 px-6 py-3 rounded-xl font-bold text-center hover:bg-emerald-50">📧 info@connect2kehilla.com</a>
            </div>
          </div>
        </div>

        {/* Phone Mockup — Sticky on desktop */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <div className="bg-gray-900 rounded-2xl p-4 text-center mb-4">
              <p className="text-emerald-400 text-sm font-bold">📱 HOW IT LOOKS</p>
              <p className="text-white text-xs mt-1">Click any question to see demo</p>
            </div>
            <PhoneMockup flow={activeDemoKey} />
            <p className="text-center text-xs text-gray-500 mt-4">
              ⚠️ Kosher phone = flip phone (NOT a smartphone)<br/>
              No internet • Only SMS
            </p>
          </div>
        </div>
      </section>

      {/* Style for animation */}
      <style>{`
        @keyframes slide-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </main>
  )
}
