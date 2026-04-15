'use client'
import { useState } from 'react'

export default function AddBusinessPage() {
  const [form, setForm] = useState({ name: '', phone: '', address: '', hoursOfWork: '', website: '', email: '', area: '', zipCode: '', categories: '', plan: 'FREE' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, categories: form.categories.split(',').map(c => c.trim().toLowerCase()).filter(Boolean), listingType: 'BUSINESS' }),
      })
      if (res.ok) setStatus('success')
      else setStatus('error')
    } catch { setStatus('error') }
  }

  if (status === 'success') return (
    <main className="min-h-screen flex items-center justify-center bg-emerald-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-emerald-800 mb-2">Business Listed!</h1>
        <p className="text-gray-600 mb-6">Your business has been added to Connect2Kehilla directory.</p>
        <a href="/" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold inline-block">Back to Home</a>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900">🏪 Add Your Business</h1>
          <p className="text-gray-500 mt-2">List your business on Connect2Kehilla SMS directory</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Business Name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" placeholder="e.g. Goldstein Plumbing" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number *</label>
            <input required value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" placeholder="718-555-1234" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Area</label>
              <select value={form.area} onChange={e => setForm(f => ({...f, area: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none">
                <option value="">Select area</option>
                {['Williamsburg', 'Borough Park', 'Crown Heights', 'Flatbush', 'Monsey', 'Lakewood', 'Five Towns', 'Teaneck', 'Passaic'].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">ZIP Code</label>
              <input value={form.zipCode} onChange={e => setForm(f => ({...f, zipCode: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" placeholder="11211" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
            <input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" placeholder="123 Broadway, Brooklyn NY" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Categories (comma separated)</label>
            <input value={form.categories} onChange={e => setForm(f => ({...f, categories: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" placeholder="plumber, emergency, residential" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Hours of Work</label>
              <input value={form.hoursOfWork} onChange={e => setForm(f => ({...f, hoursOfWork: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" placeholder="Mon-Fri 9-5" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Website</label>
              <input value={form.website} onChange={e => setForm(f => ({...f, website: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" placeholder="www.example.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" placeholder="info@business.com" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Plan</label>
            <select value={form.plan} onChange={e => setForm(f => ({...f, plan: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none">
              <option value="FREE">Free — $0</option>
              <option value="STANDARD">Standard — $30/8 days</option>
              <option value="PREMIUM">Premium — $50/8 days (Top position)</option>
              <option value="AD_BOOST">Ad Boost — $7.99/8 days</option>
            </select>
          </div>

          <button type="submit" disabled={status === 'loading'} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-700 transition disabled:opacity-50">
            {status === 'loading' ? 'Submitting...' : 'Add Business'}
          </button>
          {status === 'error' && <p className="text-red-500 text-center">Something went wrong. Please try again.</p>}
          <p className="text-center text-sm text-gray-400">For paid plans, we will contact you for payment. <a href="/pricing" className="underline">View pricing</a></p>
        </form>
      </div>
    </main>
  )
}
