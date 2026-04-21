'use client'
import { useState } from 'react'

const TYPES = [
  { value: 'mazel_tov', label: '🎊 Mazel Tov / General Simcha' },
  { value: 'engagement', label: '💍 Engagement' },
  { value: 'wedding', label: '👰 Wedding' },
  { value: 'birth', label: '👶 Birth' },
  { value: 'bar_mitzvah', label: '🎓 Bar Mitzvah' },
]

export default function AddMazelTovPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrMsg('')
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())
    try {
      const res = await fetch('/api/mazel-tov', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (res.ok) setStatus('success')
      else { setStatus('error'); setErrMsg(json.error || 'Something went wrong') }
    } catch {
      setStatus('error')
      setErrMsg('Network error — please try again')
    }
  }

  if (status === 'success') return (
    <main className="min-h-screen flex items-center justify-center bg-amber-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
        <div className="text-5xl mb-4">🎊</div>
        <h1 className="text-2xl font-bold text-amber-800 mb-2">Mazel Tov submitted!</h1>
        <p className="text-gray-700 mb-3 font-medium">Thank you for sharing your simcha.</p>
        <p className="text-gray-600 mb-6 text-sm">
          Our team will review and approve it shortly. Once approved it will be sent to all
          Connect2Kehilla subscribers who follow Mazel Tov updates.
        </p>
        <a href="/" className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold inline-block">Back to Home</a>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <a href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 text-sm font-medium">
          <span className="text-lg">←</span> Back to Home
        </a>

        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🎊</div>
          <h1 className="text-3xl font-black text-gray-900">Share a Simcha</h1>
          <p className="text-gray-500 mt-2">Send a Mazel Tov to the entire kehilla via SMS</p>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mb-6">
          <p className="text-sm text-amber-900">
            <strong>How it works:</strong> Your message will be reviewed by our team, then sent
            via SMS to everyone subscribed to Mazel Tov updates. Subscribers can text
            <code className="bg-white px-1 mx-1 rounded">UNSUB MAZEL TOV</code> to opt out anytime.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">Type of simcha <span className="text-amber-500">*</span></label>
            <select name="type" required className="w-full border-2 rounded-lg px-4 py-2 focus:border-amber-500 outline-none bg-white">
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">Your name <span className="text-gray-400 font-normal">(optional)</span></label>
            <input name="name" className="w-full border-2 rounded-lg px-4 py-2 focus:border-amber-500 outline-none" placeholder="Full name" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">Your phone <span className="text-amber-500">*</span></label>
            <input name="phone" required type="tel" className="w-full border-2 rounded-lg px-4 py-2 focus:border-amber-500 outline-none" placeholder="+1 718 555 1234" />
            <p className="text-xs text-gray-500 mt-1">For verification only — not published</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1 text-gray-700">ZIP <span className="text-gray-400 font-normal">(optional)</span></label>
              <input name="zipCode" className="w-full border-2 rounded-lg px-4 py-2 focus:border-amber-500 outline-none" placeholder="11213" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 text-gray-700">Area</label>
              <select name="area" className="w-full border-2 rounded-lg px-4 py-2 focus:border-amber-500 outline-none bg-white">
                <option value="">—</option>
                <option value="Crown Heights">Crown Heights</option>
                <option value="Williamsburg">Williamsburg</option>
                <option value="Borough Park">Borough Park</option>
                <option value="Flatbush">Flatbush</option>
                <option value="Monsey">Monsey</option>
                <option value="Lakewood">Lakewood</option>
                <option value="Five Towns">Five Towns</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">Mazel Tov message <span className="text-amber-500">*</span></label>
            <textarea
              name="text"
              required
              rows={5}
              maxLength={400}
              className="w-full border-2 rounded-lg px-4 py-2 focus:border-amber-500 outline-none"
              placeholder='e.g. "Mazel Tov to Yossi & Chaya Schwartz on the engagement of their daughter to David Goldberg of Crown Heights! May they build a bayis ne&apos;eman b&apos;Yisroel."'
            />
            <p className="text-xs text-gray-500 mt-1">Max 400 characters — keep it concise for SMS</p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-amber-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {status === 'loading' ? 'Submitting...' : '🎊 Submit Mazel Tov'}
            </button>
            {status === 'error' && (
              <p className="text-red-500 text-sm mt-2 text-center">{errMsg || 'Something went wrong. Please try again.'}</p>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center pt-4 border-t">
            By submitting, you agree your mazel tov will be reviewed and broadcast via SMS to community subscribers.
          </p>
        </form>
      </div>
    </main>
  )
}
