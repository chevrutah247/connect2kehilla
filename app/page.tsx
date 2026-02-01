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
        
        {/* Phone Number Display */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 inline-block">
          <p className="text-gray-500 mb-2">Text us at:</p>
          <p className="text-4xl font-bold text-blue-600">
            (XXX) XXX-XXXX
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Standard messaging rates apply
          </p>
        </div>

        {/* How It Works */}
        <div className="grid md:grid-cols-3 gap-8 text-left mb-16">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="font-bold text-lg mb-2">1. Send a Text</h3>
            <p className="text-gray-600">
              Text what you need + your ZIP code or neighborhood
            </p>
            <p className="text-sm text-gray-400 mt-2 italic">
              Example: "plumber 11211"
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="font-bold text-lg mb-2">2. We Search</h3>
            <p className="text-gray-600">
              Our AI finds the best matches from our community directory
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl mb-4">✅</div>
            <h3 className="font-bold text-lg mb-2">3. Get Contacts</h3>
            <p className="text-gray-600">
              Receive up to 3 business contacts instantly via SMS
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
        <p>© 2024 Connect2Kehilla. All rights reserved.</p>
        <p className="mt-2">
          <a href="/privacy" className="hover:text-gray-700">Privacy</a>
          {' • '}
          <a href="/terms" className="hover:text-gray-700">Terms</a>
          {' • '}
          Text HELP for support
        </p>
      </footer>
    </main>
  )
}
