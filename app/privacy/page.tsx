export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: February 3, 2026</p>
      <section className="space-y-6 text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
          <p>When you use Connect2Kehilla, we collect: your phone number, the business category and ZIP code you send, and usage timestamps. We do not collect names, email addresses, or location data.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">2. How We Use Your Information</h2>
          <p>We use your information solely to respond to your directory queries, process opt-out requests, and improve our service. We do not use your information for marketing or advertising.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">3. Information Sharing</h2>
          <p>We do not sell, rent, or share your personal information with third parties, except as required by law. Our SMS provider Twilio processes messages on our behalf. Your phone number is never shared with listed businesses.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">4. Data Retention</h2>
          <p>We retain your data only as long as necessary to provide the service. If you opt out by texting STOP, we retain only the minimum information needed to honor your preference.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">5. SMS Privacy</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>We only send SMS in response to your requests</li>
            <li>We never send unsolicited messages</li>
            <li>Your phone number is never shared with businesses</li>
            <li>Reply <strong>STOP</strong> to stop all messages</li>
            <li>Reply <strong>HELP</strong> for assistance</li>
            <li>Message and data rates may apply</li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">6. Contact</h2>
          <p>For privacy questions, text <strong>HELP</strong> to (845) 868-6364.</p>
        </div>
      </section>
    </main>
  );
}
