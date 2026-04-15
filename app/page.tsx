// app/page.tsx
// Landing page for Connect2Kehilla — Kosher Phone SMS Directory

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen bg-white">
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-green { 0%,100%{box-shadow:0 0 0 0 rgba(5,150,105,0.4)} 70%{box-shadow:0 0 0 15px rgba(5,150,105,0)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        .float { animation: float 3s ease-in-out infinite; }
        .pulse-btn { animation: pulse-green 2s infinite; }
        .slide-up { animation: slide-up 0.6s ease-out; }
      `}</style>

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
                17,000+ businesses at your fingertips. Just send a text — no apps, no internet, no smartphone needed.
              </p>

              {/* Phone number CTA */}
              <a href="sms:+18885163399" className="inline-block pulse-btn" style={{ background: 'linear-gradient(135deg, #059669, #047857)', padding: '16px 40px', borderRadius: '16px', textDecoration: 'none' }}>
                <p className="text-emerald-200 text-xs uppercase tracking-widest mb-1 text-center">Text Us Now</p>
                <p className="text-white text-3xl md:text-4xl font-black text-center">(888) 516-3399</p>
              </a>

              <p className="text-blue-400 text-sm mt-4">🌐 English • עברית • אידיש</p>
            </div>

            {/* Right — Phone image */}
            <div className="flex justify-center float">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=600&fit=crop"
                  alt="Kosher Phone"
                  className="rounded-3xl shadow-2xl"
                  style={{ maxHeight: '420px', objectFit: 'cover', border: '3px solid rgba(5,150,105,0.3)' }}
                  onError={(e: any) => { e.target.style.display = 'none' }}
                />
                {/* SMS bubble overlay */}
                <div className="absolute -left-4 top-16 bg-white rounded-2xl rounded-bl-none shadow-xl p-3 max-w-[200px]" style={{ animation: 'slide-up 1s ease-out 0.5s both' }}>
                  <p className="text-xs text-gray-500">You texted:</p>
                  <p className="font-bold text-gray-800 text-sm">plumber 11205</p>
                </div>
                <div className="absolute -right-4 top-40 bg-emerald-50 border border-emerald-200 rounded-2xl rounded-br-none shadow-xl p-3 max-w-[220px]" style={{ animation: 'slide-up 1s ease-out 1s both' }}>
                  <p className="text-xs text-emerald-600">Connect2Kehilla:</p>
                  <p className="text-sm text-gray-800">Found 3 plumber:</p>
                  <p className="text-xs text-gray-600">1. Goldstein Plumbing 📞</p>
                  <p className="text-xs text-gray-600">2. Quick Fix Plumber 📞</p>
                </div>
              </div>
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
            { val: '17,000+', lbl: 'Businesses Listed' },
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
        <div className="mt-4 space-x-4">
          <a href="/privacy" className="hover:text-white underline">Privacy Policy</a>
          <span>•</span>
          <a href="/terms" className="hover:text-white underline">Terms of Service</a>
        </div>
        <p className="mt-4 text-gray-500">
          SMS: (888) 516-3399 • Reply STOP to unsubscribe • Reply HELP for support
        </p>
      </footer>
    </main>
  )
}
