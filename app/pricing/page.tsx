'use client'

export default function PricingPage() {
  const plans = [
    { name: 'Free', price: '$0', period: 'Forever', position: 'Standard rotation', features: ['Basic listing', 'Shown in search results', 'Below paid listings'], color: '#6b7280', popular: false },
    { name: 'Standard', price: '$30', period: '8 days', position: 'Above Free listings', features: ['Priority placement', 'Above all free listings', 'Lead tracking', '8 calendar days'], color: '#2563eb', popular: false },
    { name: 'Premium', price: '$50', period: '8 days', position: 'Always on TOP', features: ['Top of all results', 'Maximum visibility', 'Lead tracking', 'Priority support', '8 calendar days'], color: '#C9A227', popular: true },
    { name: 'Specials', price: '$40', period: '8 days', position: 'Specials section', features: ['Featured in specials', 'Store deals promoted', 'SMS blast to subscribers', '8 calendar days'], color: '#059669', popular: false },
    { name: 'Ad Boost', price: '$7.99', period: '8 days', position: 'One-time boost', features: ['Temporary visibility boost', 'Great for events', 'Quick promotion', '8 calendar days'], color: '#8b5cf6', popular: false },
  ]

  return (
    <main className="min-h-screen bg-white">
      <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Pricing Plans</h1>
          <p className="text-xl text-blue-300 mb-2">Get found by thousands of kosher phone users</p>
          <p className="text-blue-400">All plans include 8 calendar days (7 + Shabbat)</p>
        </div>
      </section>

      <section className="py-16 px-4 -mt-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-4">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-white rounded-2xl shadow-xl border-2 p-6 relative ${plan.popular ? 'border-yellow-400 scale-105 z-10' : 'border-gray-200'}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-xl font-bold mb-1" style={{ color: plan.color }}>{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-black text-gray-900">{plan.price}</span>
                {plan.period !== 'Forever' && <span className="text-gray-500 text-sm">/{plan.period}</span>}
              </div>
              <p className="text-sm text-gray-600 mb-4 font-semibold">{plan.position}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <a href={plan.name === 'Free' ? '/add-business' : `mailto:list@connect2kehilla.com?subject=${plan.name} Plan`}
                className="block w-full text-center py-3 rounded-xl font-bold text-white transition hover:opacity-90"
                style={{ background: plan.color }}>
                {plan.name === 'Free' ? 'Add Free Listing' : 'Get Started'}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Two Types of Listings</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow border-2 border-blue-100">
              <div className="text-3xl mb-3">🏪</div>
              <h3 className="text-lg font-bold text-blue-800 mb-2">Business</h3>
              <p className="text-gray-600 text-sm">Stores, restaurants, offices, companies</p>
              <a href="/add-business" className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">Add Business →</a>
            </div>
            <div className="bg-white rounded-xl p-6 shadow border-2 border-emerald-100">
              <div className="text-3xl mb-3">🔧</div>
              <h3 className="text-lg font-bold text-emerald-800 mb-2">Service</h3>
              <p className="text-gray-600 text-sm">Plumber, electrician, tutor, driver, babysitter</p>
              <a href="/add-service" className="inline-block mt-4 bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700">Add Service →</a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 text-center" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
        <h2 className="text-2xl font-bold text-white mb-3">Questions?</h2>
        <p className="text-emerald-200 mb-6">Contact us for custom plans or help getting started</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="tel:+18885163399" className="bg-white text-emerald-800 font-bold px-8 py-3 rounded-xl hover:bg-emerald-50">📞 (888) 516-3399</a>
          <a href="mailto:list@connect2kehilla.com" className="border-2 border-white text-white font-bold px-8 py-3 rounded-xl hover:bg-white/10">📧 list@connect2kehilla.com</a>
        </div>
      </section>
    </main>
  )
}
