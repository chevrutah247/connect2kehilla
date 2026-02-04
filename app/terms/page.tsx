export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: February 3, 2026</p>
      <section className="space-y-6 text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Service Description</h2>
          <p>Connect2Kehilla is a free SMS-based community business directory service. Users text a business category and ZIP code to our phone number and receive relevant local business contact information in response. This is a user-initiated conversational service.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">2. SMS Terms and Consent</h2>
          <p>By texting our service number <strong>(845) 868-6364</strong>, you consent to receive SMS replies containing business directory information in response to your requests. You will only receive messages in direct response to texts you send to us. We never send unsolicited, promotional, or marketing messages.</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Message frequency depends on your requests</li>
            <li>Message and data rates may apply</li>
            <li>Reply <strong>STOP</strong> at any time to opt out</li>
            <li>Reply <strong>HELP</strong> for assistance</li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">3. Opt-Out</h2>
          <p>You may opt out at any time by replying <strong>STOP</strong> to any message. After opting out, you will receive a confirmation and no further messages will be sent unless you reply <strong>START</strong> to resubscribe.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">4. Information Accuracy</h2>
          <p>We make reasonable efforts to maintain accurate business listings but do not guarantee accuracy or completeness. We are not responsible for the quality of services provided by listed businesses.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">5. Limitation of Liability</h2>
          <p>Connect2Kehilla is provided as-is without warranties. We shall not be liable for any damages arising from the use of this service.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">6. Contact</h2>
          <p>For questions, text <strong>HELP</strong> to (845) 868-6364.</p>
        </div>
      </section>
    </main>
  );
}
