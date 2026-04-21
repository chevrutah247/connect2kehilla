'use client'

import { useEffect, useState } from 'react'

// ============================================
// Admin Dashboard — queries log + statistics
// ============================================

interface Analytics {
  date: string
  kpi: { totalQueries: number; uniqueUsers: number; newUsers: number; searchQueries: number; successQueries: number; successRate: number }
  intents: { intent: string; count: number }[]
  zmanimCount: number
  minyanCount: number
  topCategories: { category: string; count: number }[]
  activeAreas: { area: string; count: number }[]
  activeZips: { zip: string; count: number }[]
  inactiveAreas30d: { area: string; count: number }[]
  hourly: { hour: number; count: number }[]
  logs: Array<{
    id: string; at: string; from: string; message: string;
    category: string | null; zip: string | null; area: string | null;
    intent: string; results: number; response: string | null;
  }>
  customers: { total: number; active: number; optedOut: number }
}

function todayLocalISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [pwInput, setPwInput] = useState('')
  const [date, setDate] = useState(todayLocalISO())
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [tab, setTab] = useState<'dashboard' | 'logs' | 'pending'>('dashboard')
  const [searchFilter, setSearchFilter] = useState('')
  const [pendingData, setPendingData] = useState<{ businesses: any[]; charityRequests: any[]; announcements: any[]; counts: any } | null>(null)
  const [pendingLoading, setPendingLoading] = useState(false)
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  // Load token from localStorage on mount
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('c2k_admin_token') : null
    if (saved) setToken(saved)
  }, [])

  // Fetch analytics when token or date changes
  useEffect(() => {
    if (!token) return
    setLoading(true)
    setErr('')
    fetch(`/api/admin/analytics?date=${date}&limit=500`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async r => {
        if (r.status === 401) {
          localStorage.removeItem('c2k_admin_token')
          setToken(null)
          throw new Error('Invalid password')
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setData)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [token, date])

  // Fetch pending items
  function loadPending() {
    if (!token) return
    setPendingLoading(true)
    fetch('/api/admin/pending', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setPendingData(d)
        setPendingCount(d.counts?.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setPendingLoading(false))
  }
  useEffect(() => {
    if (!token) return
    loadPending()
  }, [token])
  useEffect(() => {
    if (tab === 'pending') loadPending()
  }, [tab])

  async function handleApprove(type: 'business' | 'charity' | 'announcement', id: string) {
    if (!token) return
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type, id, action: 'approve' }),
    })
    if (res.ok) loadPending()
  }

  async function handleReject(type: 'business' | 'charity' | 'announcement', id: string) {
    if (!token) return
    const reason = window.prompt('Reason for rejection (optional):')
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type, id, action: 'reject', reason: reason || undefined }),
    })
    if (res.ok) loadPending()
  }

  // Login form
  if (!token) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', fontFamily: 'system-ui' }}>
        <form
          onSubmit={e => {
            e.preventDefault()
            if (pwInput) {
              localStorage.setItem('c2k_admin_token', pwInput)
              setToken(pwInput)
            }
          }}
          style={{ background: 'white', padding: 40, borderRadius: 12, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        >
          <h1 style={{ marginTop: 0, color: '#0f172a' }}>🔐 Admin Access</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Enter admin password</p>
          <input
            type="password"
            value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            placeholder="Password"
            autoFocus
            style={{ width: '100%', padding: '12px 16px', fontSize: 16, border: '1px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ marginTop: 16, width: '100%', padding: 12, background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            Log in
          </button>
        </form>
      </main>
    )
  }

  const logout = () => {
    localStorage.removeItem('c2k_admin_token')
    setToken(null)
  }

  const filteredLogs = data?.logs.filter(l => {
    if (!searchFilter) return true
    const s = searchFilter.toLowerCase()
    return l.message.toLowerCase().includes(s)
      || l.from.toLowerCase().includes(s)
      || (l.category || '').toLowerCase().includes(s)
      || (l.area || '').toLowerCase().includes(s)
      || (l.zip || '').includes(s)
  }) || []

  return (
    <main style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui', color: '#0f172a' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#1e3a5f,#2d5a87)', color: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 22, flex: 1 }}>📊 Connect2Kehilla Admin</h1>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: 'none', fontSize: 14 }}
        />
        <button onClick={() => setDate(todayLocalISO())} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, cursor: 'pointer' }}>
          Today
        </button>
        <button onClick={logout} style={{ padding: '8px 12px', background: 'rgba(220,38,38,0.8)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Logout
        </button>
      </header>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 24px', display: 'flex', gap: 4 }}>
        <button
          onClick={() => setTab('dashboard')}
          style={{ padding: '14px 20px', background: tab === 'dashboard' ? '#f1f5f9' : 'transparent', border: 'none', borderBottom: tab === 'dashboard' ? '3px solid #2563eb' : '3px solid transparent', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: tab === 'dashboard' ? '#2563eb' : '#64748b' }}
        >
          📈 Dashboard
        </button>
        <button
          onClick={() => setTab('pending')}
          style={{ padding: '14px 20px', background: tab === 'pending' ? '#f1f5f9' : 'transparent', border: 'none', borderBottom: tab === 'pending' ? '3px solid #dc2626' : '3px solid transparent', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: tab === 'pending' ? '#dc2626' : '#64748b', position: 'relative' }}
        >
          🔔 Pending Review
          {pendingCount !== null && pendingCount > 0 && (
            <span style={{ marginLeft: 6, background: '#dc2626', color: 'white', borderRadius: 10, padding: '2px 8px', fontSize: 12 }}>
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('logs')}
          style={{ padding: '14px 20px', background: tab === 'logs' ? '#f1f5f9' : 'transparent', border: 'none', borderBottom: tab === 'logs' ? '3px solid #2563eb' : '3px solid transparent', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: tab === 'logs' ? '#2563eb' : '#64748b' }}
        >
          📜 Event Log {data ? `(${data.logs.length})` : ''}
        </button>
      </div>

      <div style={{ padding: 24, maxWidth: 1300, margin: '0 auto' }}>
        {err && <div style={{ background: '#fee2e2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16 }}>⚠️ {err}</div>}
        {loading && tab !== 'pending' && <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading…</div>}
        {!loading && data && tab === 'dashboard' && <Dashboard data={data} />}
        {tab === 'pending' && (
          <PendingTab
            data={pendingData}
            loading={pendingLoading}
            onApprove={handleApprove}
            onReject={handleReject}
            onRefresh={loadPending}
          />
        )}
        {!loading && data && tab === 'logs' && (
          <LogTab
            logs={filteredLogs}
            totalCount={data.logs.length}
            filter={searchFilter}
            setFilter={setSearchFilter}
          />
        )}
      </div>
    </main>
  )
}

// ============================================
// Pending Review tab
// ============================================
function PendingTab({
  data,
  loading,
  onApprove,
  onReject,
  onRefresh,
}: {
  data: { businesses: any[]; charityRequests: any[]; announcements: any[]; counts: any } | null
  loading: boolean
  onApprove: (type: 'business' | 'charity' | 'announcement', id: string) => void
  onReject: (type: 'business' | 'charity' | 'announcement', id: string) => void
  onRefresh: () => void
}) {
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading pending items…</div>
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No data</div>

  const { businesses = [], charityRequests = [], announcements = [] } = data
  const total = businesses.length + charityRequests.length + announcements.length

  if (total === 0) {
    return (
      <div style={{ background: 'white', borderRadius: 12, padding: 60, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ margin: 0, color: '#059669' }}>All caught up!</h2>
        <p style={{ color: '#64748b', marginTop: 8 }}>No pending submissions to review.</p>
        <button
          onClick={onRefresh}
          style={{ marginTop: 16, padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          🔄 Refresh
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>🔔 {total} item{total !== 1 ? 's' : ''} pending review</h2>
        <button
          onClick={onRefresh}
          style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          🔄 Refresh
        </button>
      </div>

      {businesses.length > 0 && (
        <div>
          <h3 style={{ color: '#1e293b', marginBottom: 12 }}>🏪 Businesses & Services ({businesses.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {businesses.map((b: any) => (
              <div key={b.id} style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ background: b.listingType === 'SERVICE' ? '#059669' : '#2563eb', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                        {b.listingType || 'BUSINESS'}
                      </span>
                      <span style={{ background: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                        {b.status || 'FREE'}
                      </span>
                      <span style={{ color: '#64748b', fontSize: 12 }}>
                        Submitted {new Date(b.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: 18, color: '#0f172a' }}>{b.name}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 14, color: '#475569' }}>
                      <div>📞 {b.phone}</div>
                      {b.address && <div>📍 {b.address}</div>}
                      {b.area && <div>🏘 {b.area}</div>}
                      {b.zipCode && <div>🗺 {b.zipCode}</div>}
                      {b.email && <div>📧 {b.email}</div>}
                      {b.website && <div>🌐 {b.website}</div>}
                    </div>
                    {b.categories && b.categories.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {b.categories.map((c: string) => (
                          <span key={c} style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: 12, color: '#475569' }}>{c}</span>
                        ))}
                      </div>
                    )}
                    {b.description && (
                      <p style={{ marginTop: 10, padding: 8, background: '#f8fafc', borderRadius: 6, fontSize: 13, color: '#475569' }}>
                        {b.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 120 }}>
                    <button
                      onClick={() => onApprove('business', b.id)}
                      style={{ padding: '10px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => onReject('business', b.id)}
                      style={{ padding: '10px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {charityRequests.length > 0 && (
        <div>
          <h3 style={{ color: '#1e293b', marginBottom: 12 }}>❤️ Charity Requests ({charityRequests.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {charityRequests.map((c: any) => (
              <div key={c.id} style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #fecaca' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ background: '#dc2626', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>CHARITY</span>
                      <span style={{ color: '#64748b', fontSize: 12 }}>
                        Submitted {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: 18, color: '#0f172a' }}>{c.name}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 14, color: '#475569' }}>
                      <div>📞 {c.phone}</div>
                      {c.area && <div>🏘 {c.area}</div>}
                      {c.zipCode && <div>🗺 {c.zipCode}</div>}
                      {c.amount && <div>💵 {c.amount}</div>}
                    </div>
                    {c.paymentInfo && (
                      <div style={{ marginTop: 8, fontSize: 13, color: '#475569' }}>
                        💳 {c.paymentInfo}
                      </div>
                    )}
                    <p style={{ marginTop: 10, padding: 8, background: '#fef2f2', borderRadius: 6, fontSize: 13, color: '#475569' }}>
                      {c.description}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 120 }}>
                    <button
                      onClick={() => onApprove('charity', c.id)}
                      style={{ padding: '10px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => onReject('charity', c.id)}
                      style={{ padding: '10px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {announcements.length > 0 && (
        <div>
          <h3 style={{ color: '#1e293b', marginBottom: 12 }}>🎊 Mazel Tov / Simcha ({announcements.length})</h3>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: -8, marginBottom: 12 }}>
            ⚠️ Approving will <strong>immediately broadcast</strong> via SMS to all Mazel Tov subscribers.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {announcements.map((a: any) => (
              <div key={a.id} style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #fde68a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ background: '#C9A227', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                        {a.type?.toUpperCase().replace(/_/g, ' ') || 'MAZEL TOV'}
                      </span>
                      <span style={{ color: '#64748b', fontSize: 12 }}>
                        Submitted {new Date(a.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ marginTop: 0, padding: 12, background: '#fffbeb', borderRadius: 6, fontSize: 14, color: '#1e293b', lineHeight: 1.5, whiteSpace: 'pre-wrap', borderLeft: '4px solid #C9A227' }}>
                      {a.text}
                    </p>
                    <div style={{ marginTop: 8, fontSize: 13, color: '#475569', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {a.submittedByName && <span>👤 {a.submittedByName}</span>}
                      {a.submittedByPhone && <span>📞 {a.submittedByPhone}</span>}
                      {a.area && <span>🏘 {a.area}</span>}
                      {a.zipCode && <span>🗺 {a.zipCode}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 120 }}>
                    <button
                      onClick={() => onApprove('announcement', a.id)}
                      style={{ padding: '10px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                    >
                      ✓ Approve & Send
                    </button>
                    <button
                      onClick={() => onReject('announcement', a.id)}
                      style={{ padding: '10px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Dashboard tab
// ============================================
function Dashboard({ data }: { data: Analytics }) {
  const card = (value: string | number, label: string, color: string) => (
    <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{label}</div>
    </div>
  )

  const panel = (title: string, icon: string, children: React.ReactNode) => (
    <section style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <h3 style={{ marginTop: 0, marginBottom: 16, color: '#0f172a' }}>{icon} {title}</h3>
      {children}
    </section>
  )

  const bar = (value: number, max: number, color: string = '#2563eb') => {
    const w = max > 0 ? Math.max(2, (value / max) * 100) : 0
    return <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}><div style={{ width: `${w}%`, height: '100%', background: color }} /></div>
  }

  const maxCat = Math.max(...data.topCategories.map(c => c.count), 1)
  const maxArea = Math.max(...data.activeAreas.map(a => a.count), 1)
  const maxHour = Math.max(...data.hourly.map(h => h.count), 1)

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {card(data.kpi.totalQueries, 'Total Queries', '#1e3a5f')}
        {card(data.kpi.uniqueUsers, 'Unique Users', '#6366f1')}
        {card(data.kpi.newUsers, 'New Users', '#059669')}
        {card(data.kpi.successRate + '%', 'Success Rate', data.kpi.successRate >= 70 ? '#059669' : '#dc2626')}
        {card(data.customers.total, 'Total Customers', '#0891b2')}
        {card(data.customers.active, 'Active (not blocked)', '#059669')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16 }}>
        {/* Intents */}
        {panel('Intent Breakdown', '📋', (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {data.intents.map(i => (
                <tr key={i.intent}>
                  <td style={{ padding: '6px 4px', borderBottom: '1px solid #f1f5f9' }}>{i.intent}</td>
                  <td style={{ padding: '6px 4px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 600 }}>{i.count}</td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: '6px 4px', color: '#64748b' }}>— Zmanim</td>
                <td style={{ padding: '6px 4px', textAlign: 'right' }}>{data.zmanimCount}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 4px', color: '#64748b' }}>— Minyan</td>
                <td style={{ padding: '6px 4px', textAlign: 'right' }}>{data.minyanCount}</td>
              </tr>
            </tbody>
          </table>
        ))}

        {/* Top categories */}
        {panel('Top Categories (most popular)', '🏆', (
          data.topCategories.length === 0 ? <p style={{ color: '#64748b' }}>No data</p> : (
            <div>
              {data.topCategories.map(c => (
                <div key={c.category} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>{c.category}</span>
                    <strong>{c.count}</strong>
                  </div>
                  {bar(c.count, maxCat)}
                </div>
              ))}
            </div>
          )
        ))}

        {/* Active areas */}
        {panel('Most Active Areas', '🌍', (
          data.activeAreas.length === 0 ? <p style={{ color: '#64748b' }}>No data</p> : (
            <div>
              {data.activeAreas.map(a => (
                <div key={a.area} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>📍 {a.area}</span>
                    <strong>{a.count}</strong>
                  </div>
                  {bar(a.count, maxArea, '#059669')}
                </div>
              ))}
            </div>
          )
        ))}

        {/* Active ZIPs */}
        {panel('Most Active ZIPs', '🗺', (
          data.activeZips.length === 0 ? <p style={{ color: '#64748b' }}>No data</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {data.activeZips.map(z => (
                  <tr key={z.zip}>
                    <td style={{ padding: '6px 4px', borderBottom: '1px solid #f1f5f9' }}>{z.zip}</td>
                    <td style={{ padding: '6px 4px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 600 }}>{z.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ))}

        {/* Low-activity areas (30d) */}
        {panel('Low-Activity Areas (30 days)', '🔕', (
          data.inactiveAreas30d.length === 0 ? <p style={{ color: '#64748b' }}>No data</p> : (
            <div>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 0 }}>Areas with fewest queries in last 30 days — opportunities for outreach/marketing.</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {data.inactiveAreas30d.map(a => (
                    <tr key={a.area}>
                      <td style={{ padding: '4px', borderBottom: '1px solid #f1f5f9', color: '#dc2626' }}>{a.area}</td>
                      <td style={{ padding: '4px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{a.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ))}

        {/* Hourly distribution */}
        {panel('When Queries Arrive (Hourly, EST)', '🕐', (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
              {Array.from({ length: 24 }, (_, h) => {
                const item = data.hourly.find(x => x.hour === h)
                const count = item?.count || 0
                const height = maxHour > 0 ? (count / maxHour) * 100 : 0
                return (
                  <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }} title={`${h}:00 — ${count} queries`}>
                    <div style={{ height: `${height}%`, width: '100%', background: count > 0 ? '#2563eb' : '#e2e8f0', minHeight: count > 0 ? 2 : 0, borderRadius: '2px 2px 0 0' }} />
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', fontSize: 10, color: '#64748b', marginTop: 4 }}>
              {[0, 6, 12, 18, 23].map(h => <div key={h} style={{ flex: h === 23 ? 0 : 1, paddingLeft: h === 0 ? 0 : `${((h - (h > 0 ? [0, 6, 12, 18, 23][[0, 6, 12, 18, 23].indexOf(h) - 1] : 0)) / 24) * 100}%` }}>{h}:00</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// Logs tab
// ============================================
function LogTab({ logs, totalCount, filter, setFilter }: {
  logs: Analytics['logs']
  totalCount: number
  filter: string
  setFilter: (s: string) => void
}) {
  const fmt = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'America/New_York' })

  return (
    <div>
      <div style={{ background: 'white', padding: '12px 16px', borderRadius: 8, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="text"
          placeholder="🔍 Filter by message, phone, category, area, ZIP…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
        />
        <span style={{ fontSize: 13, color: '#64748b' }}>
          Showing {logs.length} of {totalCount}
        </span>
      </div>

      <div style={{ background: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: '#f1f5f9' }}>
            <tr>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Time (EST)</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>From</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Message</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Category</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>ZIP / Area</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Intent</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Results</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No queries this day</td></tr>
            )}
            {logs.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap', color: '#64748b' }}>{fmt(l.at)}</td>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }}>{l.from}</td>
                <td style={{ padding: '8px 12px', maxWidth: 300, wordBreak: 'break-word' }}>{l.message.replace(/__[A-Z_]+__/, '[state]').slice(0, 140)}</td>
                <td style={{ padding: '8px 12px', fontSize: 12 }}>{l.category || '—'}</td>
                <td style={{ padding: '8px 12px', fontSize: 12 }}>{l.zip || l.area || '—'}</td>
                <td style={{ padding: '8px 12px', fontSize: 11 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, background: l.intent === 'SEARCH' ? '#dbeafe' : l.intent === 'JOBS' ? '#fef3c7' : l.intent === 'HELP' ? '#f3e8ff' : l.intent === 'UNKNOWN' ? '#fee2e2' : '#f1f5f9', color: '#0f172a' }}>
                    {l.intent}
                  </span>
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: l.results > 0 ? '#059669' : '#94a3b8' }}>{l.results}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
