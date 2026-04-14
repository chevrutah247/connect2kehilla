import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Connect2Kehilla terms of service for our SMS business directory service.',
}

export default function TermsPage() {
  return (
    <main id="main-content" className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: February 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Service Description</h2>
            <p className="text-gray-600">
              Connect2Kehilla provides an SMS-based business directory service. By texting
              (888) 516-3399, you can search for local businesses in the Jewish community
              and receive contact information via text message.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">SMS Terms</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>By texting our number, you consent to receive SMS replies with business information</li>
              <li>Message and data rates may apply depending on your carrier plan</li>
              <li>Message frequency varies based on your searches</li>
              <li>Reply STOP at any time to opt out of all messages</li>
              <li>Reply HELP for customer support information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Accuracy of Information</h2>
            <p className="text-gray-600">
              While we strive to maintain accurate and up-to-date business listings,
              Connect2Kehilla does not guarantee the accuracy, completeness, or reliability
              of any business information provided. Users should independently verify
              business details before engaging services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Shabbat Observance</h2>
            <p className="text-gray-600">
              Our service observes Shabbat and Jewish holidays. Messages received during these
              times will be processed after the conclusion of Shabbat/holiday.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Limitation of Liability</h2>
            <p className="text-gray-600">
              Connect2Kehilla is provided &quot;as is&quot; without warranties of any kind.
              We are not liable for any damages arising from the use of our service or
              reliance on the business information provided.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">For Business Owners</h2>
            <p className="text-gray-600">
              Business owners may request to be listed or removed from our directory
              by contacting us. Listing in our directory is free and does not constitute
              an endorsement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Prohibited Activities</h2>
            <p className="text-gray-600">
              You agree not to engage in any of the following prohibited activities:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-2">
              <li>Scraping, crawling, or using automated means to access, collect, or download data from our service, website, or APIs</li>
              <li>Data mining, harvesting, or extracting business listings or any other content from our platform</li>
              <li>Reproducing, duplicating, copying, selling, or exploiting any portion of our directory data without express written permission</li>
              <li>Using bots, scripts, or other automated tools to interact with our service</li>
              <li>Attempting to gain unauthorized access to our systems, databases, or APIs</li>
              <li>Reverse engineering, decompiling, or disassembling any part of our service</li>
              <li>Interfering with or disrupting the integrity or performance of our service</li>
            </ul>
            <p className="text-gray-600 mt-3">
              Violation of these terms may result in immediate termination of access
              and may subject the violator to civil and criminal penalties under applicable law,
              including but not limited to the Computer Fraud and Abuse Act (CFAA).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Intellectual Property</h2>
            <p className="text-gray-600">
              All content, data, and materials available through Connect2Kehilla, including
              but not limited to business listings, categorization, and directory compilation,
              are the proprietary property of Connect2Kehilla and are protected by copyright,
              trademark, and other intellectual property laws. Unauthorized use, reproduction,
              or distribution of our content is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Contact</h2>
            <p className="text-gray-600">
              For questions about these terms, text HELP to (888) 516-3399 or email
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
