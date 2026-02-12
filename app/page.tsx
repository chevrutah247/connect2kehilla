// app/page.tsx
// Landing page for Connect2Kehilla

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Connect2Kehilla
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          SMS Business Directory for the Jewish Community
        </p>
        
        {/* ===== A2P COMPLIANT CTA BLOCK ===== */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 border-2 border-blue-200">
          <p className="text-gray-600 mb-3 text-lg">
            Find local businesses instantly — just send a text!
          </p>
          
          {/* Phone Number - Prominent Display */}
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <p className="text-gray-500 mb-2 text-sm uppercase tracking-wide">Text us at:</p>
            <a 
              href="sms:+18458686364" 
              className="text-4xl md:text-5xl font-bold text-blue-600 hover:text-blue-700 transition"
            >
              (845) 868-6364
            </a>
          </div>

          {/* Example */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
            <p className="text-sm text-gray-500 mb-1">Example message:</p>
            <p className="font-mono text-lg text-gray-800">"plumber 11211"</p>
            <p className="text-sm text-gray-500 mt-2">→ Get plumbers near Williamsburg</p>
          </div>

          {/* Required Disclosures for A2P Compliance */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>By texting this number, you consent to receive SMS replies</strong> 
              {" "}with business contact information.
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Msg &amp; Data rates may apply. Message frequency varies.
            </p>
            <p className="text-sm text-gray-500 mb-3">
              Reply <span className="font-semibold">STOP</span> to opt out at any time. 
              Reply <span className="font-semibold">HELP</span> for assistance.
            </p>
            <p className="text-xs text-gray-400">
              View our{" "}
              <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>
              {" "}and{" "}
              <a href="/terms" className="underline hover:text-gray-600">Terms of Service</a>
            </p>
          </div>
        </div>
        {/* ===== END A2P COMPLIANT CTA BLOCK ===== */}

        {/* How It Works */}
        <div className="grid md:grid-cols-3 gap-8 text-left mb-16">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="font-bold text-lg mb-2">1. Send a Text</h3>
            <p className="text-gray-600">
              Text what you need + your ZIP code or neighborhood
            </p>
            <p className="text-sm text-gray-400 mt-2 italic">
              Example: "electrician 10952"
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="font-bold text-lg mb-2">2. We Search</h3>
            <p className="text-gray-600">
              Our system finds the best matches from our community directory
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl mb-4">✅</div>
            <h3 className="font-bold text-lg mb-2">3. Get Contacts</h3>
            <p className="text-gray-600">
              Receive business contacts instantly via SMS
            </p>
          </div>
        </div>

        {/* Shabbat Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-12">
          <h3 className="font-bold text-amber-800 mb-2">🕯️ Shabbat Mode</h3>
          <p className="text-amber-700">
            We observe Shabbat. Messages sent during Shabbat will be 
            processed after Havdalah. Gut Voch!
          </p>
        </div>

        {/* For Businesses */}
        <div className="bg-blue-900 text-white rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">For Business Owners</h2>
          <p className="mb-6 text-blue-100">
            Get found by customers in your community. 
            Join our directory and receive leads directly.
          </p>
          <a 
            href="/business" 
            className="inline-block bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            List Your Business →
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 text-center text-gray-500 text-sm">
        <p>© 2026 Connect2Kehilla. All rights reserved.</p>
        <div className="mt-4 space-x-4">
          <a href="/privacy" className="hover:text-gray-700 underline">Privacy Policy</a>
          <span>•</span>
          <a href="/terms" className="hover:text-gray-700 underline">Terms of Service</a>
        </div>
        <p className="mt-4 text-gray-400">
          SMS: (845) 868-6364 • Reply STOP to unsubscribe • Reply HELP for support
        </p>
      </footer>
    </main>
  )
}
