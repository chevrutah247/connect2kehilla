import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Connect2Kehilla privacy policy — how we handle your SMS data and personal information.',
}

export default function PrivacyPage() {
  return (
    <main id="main-content" className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: February 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Information We Collect</h2>
            <p className="text-gray-600">
              When you text our service at (845) 868-6364, we collect your phone number
              and the content of your text message (search query and location). This information
              is used solely to process your business directory search and deliver results.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>To process your search query and return relevant business contacts</li>
              <li>To improve our directory and search functionality</li>
              <li>To communicate service-related updates if necessary</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Data Retention</h2>
            <p className="text-gray-600">
              We retain your phone number and search history for up to 90 days to improve service
              quality. You may request deletion of your data at any time by texting STOP.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">SMS Communication</h2>
            <p className="text-gray-600">
              Message and data rates may apply. Message frequency varies based on your usage.
              Reply STOP to opt out of all messages. Reply HELP for assistance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Third-Party Sharing</h2>
            <p className="text-gray-600">
              We do not sell or share your personal information with third parties.
              Business listings displayed are from our community directory and are publicly available.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Contact Us</h2>
            <p className="text-gray-600">
              For privacy-related inquiries, text HELP to (845) 868-6364 or email us at
              connect2kehilla@gmail.com.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">&larr; Back to Home</a>
        </div>
      </div>
    </main>
  )
}
