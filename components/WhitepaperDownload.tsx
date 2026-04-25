'use client'

import { useState } from 'react'

interface Props {
  variant?: 'banner' | 'inline'
  source?: string
}

export default function WhitepaperDownload({ variant = 'banner', source = 'unknown' }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/whitepaper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, consent, source }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.error || 'Something went wrong')
      } else {
        setDownloadUrl(json.downloadUrl as string)
        // Auto-trigger the download
        const a = document.createElement('a')
        a.href = json.downloadUrl
        a.download = 'connect2kehilla-market-report-2026.pdf'
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const Trigger = (
    <button
      onClick={() => setOpen(true)}
      className={
        variant === 'banner'
          ? 'inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-lg'
          : 'inline-block bg-white hover:bg-gray-50 text-emerald-700 font-bold px-5 py-2.5 rounded-lg border-2 border-emerald-600'
      }
    >
      📑 Download Full Market Report 2026
    </button>
  )

  if (variant === 'banner' && !open) {
    return (
      <section className="bg-gradient-to-br from-emerald-50 via-white to-amber-50 border-y-2 border-emerald-200 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-emerald-700 font-bold uppercase tracking-widest text-xs mb-3">Free download</p>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            The Kosher Phone Market 2026 — Full Research Report
          </h2>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
            8-page PDF: world Jewish demographics, Haredi growth trajectory,
            kosher-phone adoption by region, expansion roadmap, and full source citations.
          </p>
          {Trigger}
          <p className="text-xs text-gray-500 mt-4">
            We&apos;ll email the link to your address. No spam — just the report.
          </p>
        </div>
      </section>
    )
  }

  if (variant === 'inline' && !open) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center my-10">
        <p className="text-emerald-800 font-bold uppercase tracking-wide text-xs mb-2">Free download</p>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Get the full Market Report 2026
        </h3>
        <p className="text-gray-700 text-sm mb-4">
          The complete 8-page PDF with all data tables, sources, and the global expansion roadmap.
        </p>
        {Trigger}
      </div>
    )
  }

  // Modal-ish open form
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            📑 Market Report 2026
          </h3>
          <button
            onClick={() => { setOpen(false); setError(null); setDownloadUrl(null) }}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close"
          >×</button>
        </div>

        {downloadUrl ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-800 font-semibold mb-2">Your download has started</p>
            <p className="text-sm text-gray-600 mb-4">
              We&apos;ve also emailed a copy of the link to <strong>{email}</strong>.
            </p>
            <a
              href={downloadUrl}
              download
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg"
            >
              Download again
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter your name and email to download. We&apos;ll send the link to your inbox too.
            </p>

            <div>
              <label htmlFor="wp-name" className="block text-sm font-semibold text-gray-700 mb-1">
                Your name
              </label>
              <input
                id="wp-name"
                type="text"
                required
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Yossi Cohen"
              />
            </div>

            <div>
              <label htmlFor="wp-email" className="block text-sm font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                id="wp-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="you@example.com"
              />
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="mt-1"
              />
              <span>
                It&apos;s OK for Connect2Kehilla to email me occasional updates about new research and product news. (Optional.)
              </span>
            </label>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-lg"
            >
              {submitting ? 'Preparing…' : '📑 Download PDF'}
            </button>
            <p className="text-xs text-gray-500 text-center">
              We don&apos;t share your address. Unsubscribe anytime.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
