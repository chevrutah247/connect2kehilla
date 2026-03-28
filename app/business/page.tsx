import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'List Your Business',
  description: 'Get your business listed in the Connect2Kehilla SMS directory and reach customers in the Jewish community.',
}

export default function BusinessPage() {
  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">List Your Business</h1>
        <p className="text-xl text-gray-600 mb-12">
          Reach customers in the Jewish community through our SMS directory.
        </p>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-blue-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Why Join Connect2Kehilla?</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="text-2xl" aria-hidden="true">📱</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Instant Visibility</h3>
                <p className="text-gray-600">
                  When community members text us looking for your type of service,
                  your business info is delivered directly to their phone.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-2xl" aria-hidden="true">🏘️</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Community Focused</h3>
                <p className="text-gray-600">
                  Our directory is built specifically for the Jewish community.
                  Your listing reaches the right audience.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-2xl" aria-hidden="true">💰</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Free Listing</h3>
                <p className="text-gray-600">
                  Basic listings are completely free. Get discovered by local customers
                  at no cost.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-900 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Listed?</h2>
          <p className="text-blue-100 mb-6">
            Text your business name, category, and contact info to get started.
          </p>
          <a
            href="sms:+18458686364?body=I%20want%20to%20list%20my%20business"
            aria-label="Send SMS to list your business"
            className="inline-block bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 focus:bg-blue-50 transition"
          >
            Text (845) 868-6364
          </a>
          <p className="text-blue-200 text-sm mt-4">
            Or email us at connect2kehilla@gmail.com
          </p>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">&larr; Back to Home</a>
        </div>
      </div>
    </main>
  )
}
