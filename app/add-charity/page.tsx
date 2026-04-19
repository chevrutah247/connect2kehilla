'use client'
import { useState } from 'react'

export default function AddCharityPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())
    try {
      const res = await fetch('/api/charity-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) setStatus('success')
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') return (
    <main className="min-h-screen flex items-center justify-center bg-rose-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
        <div className="text-5xl mb-4">❤️</div>
        <h1 className="text-2xl font-bold text-rose-800 mb-2">Submitted for Review!</h1>
        <p className="text-gray-700 mb-3 font-medium">Thank you for reaching out.</p>
        <p className="text-gray-600 mb-6 text-sm">
          Our team will review your request and publish it within 24 hours. The community will then be able to offer help directly.
        </p>
        <a href="/" className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold inline-block">Back to Home</a>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 text-sm font-medium"
        >
          <span className="text-lg">←</span> Back to Home
        </a>

        <div className="text-center mb-8">
          <div className="text-5xl mb-2">❤️</div>
          <h1 className="text-3xl font-black text-gray-900">Request Tzedaka Help</h1>
          <p className="text-gray-500 mt-2">Post a charity request for the community to see and help</p>
        </div>

        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded mb-6">
          <p className="text-sm text-rose-900">
            <strong>Important:</strong> Your request will be reviewed by our team before being published.
            Once approved, community members can text CHARITY + your ZIP code to see your request and offer help directly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">Your Name <span className="text-rose-500">*</span></label>
            <input name="name" required className="w-full border-2 rounded-lg px-4 py-2 focus:border-rose-500 outline-none" placeholder="Full name" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">Phone Number <span className="text-rose-500">*</span></label>
            <input name="phone" required type="tel" className="w-full border-2 rounded-lg px-4 py-2 focus:border-rose-500 outline-none" placeholder="+1 718 555 1234" />
            <p className="text-xs text-gray-500 mt-1">Donors will contact you directly on this number</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1 text-gray-700">ZIP Code</label>
              <input name="zipCode" className="w-full border-2 rounded-lg px-4 py-2 focus:border-rose-500 outline-none" placeholder="11213" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 text-gray-700">Area / Neighborhood</label>
              <select name="area" className="w-full border-2 rounded-lg px-4 py-2 focus:border-rose-500 outline-none bg-white">
                <option value="">Select area...</option>
                <option value="Crown Heights">Crown Heights</option>
                <option value="Williamsburg">Williamsburg</option>
                <option value="Borough Park">Borough Park</option>
                <option value="Flatbush">Flatbush</option>
                <option value="Monsey">Monsey</option>
                <option value="Lakewood">Lakewood</option>
                <option value="Five Towns">Five Towns</option>
                <option value="Teaneck">Teaneck</option>
                <option value="Passaic">Passaic</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">What do you need help with? <span className="text-rose-500">*</span></label>
            <textarea
              name="description"
              required
              rows={4}
              className="w-full border-2 rounded-lg px-4 py-2 focus:border-rose-500 outline-none"
              placeholder="e.g. 'Behind on rent, need help for this month', 'Medical bills for surgery', 'Tuition for yeshiva'..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">Amount Needed</label>
            <input name="amount" className="w-full border-2 rounded-lg px-4 py-2 focus:border-rose-500 outline-none" placeholder="e.g. $500 or $1,000/mo" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">Payment Info (Zelle / Venmo / CashApp)</label>
            <input name="paymentInfo" className="w-full border-2 rounded-lg px-4 py-2 focus:border-rose-500 outline-none" placeholder="e.g. Zelle: name@email.com or CashApp: $username" />
            <p className="text-xs text-gray-500 mt-1">Optional — how donors can send funds directly</p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-rose-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-rose-700 disabled:opacity-50"
            >
              {status === 'loading' ? 'Submitting...' : 'Submit Request for Review'}
            </button>
            {status === 'error' && (
              <p className="text-red-500 text-sm mt-2 text-center">Something went wrong. Please try again or email list@connect2kehilla.com</p>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center pt-4 border-t">
            By submitting, you agree that your request will be visible to SMS users searching for charity in your area.
            Requests expire after 30 days.
          </p>
        </form>
      </div>
    </main>
  )
}
