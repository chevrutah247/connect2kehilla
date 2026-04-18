'use client'
import { useState, useEffect } from 'react'

interface Job { id: string; title: string; description: string; category: string; area: string | null; salary: string | null; type: string; phone: string; createdAt: string; expiresAt: string }

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [tab, setTab] = useState<'OFFERING' | 'SEEKING'>('OFFERING')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/jobs?type=${tab}`).then(r => r.json()).then(d => { setJobs(d); setLoading(false) }).catch(() => setLoading(false))
  }, [tab])

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="py-12 px-4" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
        <div className="max-w-4xl mx-auto">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-blue-300 hover:text-white transition mb-6 text-sm font-medium"
          >
            <span className="text-lg">←</span> Back to Home
          </a>
          <div className="text-center">
            <h1 className="text-4xl font-black text-white mb-2">📋 Job Board</h1>
            <p className="text-blue-300">Find work or hire in the community</p>
            <p className="text-blue-400 text-sm mt-2">SMS: Text <span className="font-bold text-white">JOBS 11211</span> to (888) 516-3399</p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6 justify-center">
          <button onClick={() => { setTab('OFFERING'); setLoading(true) }} className={`px-6 py-3 rounded-xl font-bold transition ${tab === 'OFFERING' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border-2 border-gray-200'}`}>
            🏢 Hiring
          </button>
          <button onClick={() => { setTab('SEEKING'); setLoading(true) }} className={`px-6 py-3 rounded-xl font-bold transition ${tab === 'SEEKING' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border-2 border-gray-200'}`}>
            👤 Looking for Work
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-500 mb-4">No {tab === 'OFFERING' ? 'job openings' : 'job seekers'} right now</p>
            <a href="/jobs/post" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">Post a Job →</a>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white rounded-xl shadow p-5 border-2 border-gray-100 hover:border-blue-200 transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                  {job.salary && <span className="bg-emerald-100 text-emerald-700 text-sm font-bold px-3 py-1 rounded-full">{job.salary}</span>}
                </div>
                <p className="text-gray-600 text-sm mb-3">{job.description}</p>
                <div className="flex gap-4 text-sm text-gray-500">
                  {job.area && <span>📍 {job.area}</span>}
                  <span>📁 {job.category}</span>
                  <span>⏰ Expires {new Date(job.expiresAt).toLocaleDateString()}</span>
                </div>
                <a href={`tel:${job.phone}`} className="inline-block mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">📞 Contact</a>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <a href="mailto:list@connect2kehilla.com?subject=Post a Job" className="inline-block bg-gray-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-800">Post a Job — $30/8 days</a>
        </div>

        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition"
          >
            <span className="text-xl">←</span> Back to Home
          </a>
        </div>
      </section>
    </main>
  )
}
