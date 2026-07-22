import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { BarChart2, Star, Edit2, Check } from 'lucide-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtMoney(n) {
  if (n == null || isNaN(n)) return '$0'
  if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'k'
  return '$' + Math.round(n)
}

function thisMonth() {
  const now = new Date()
  return { month: now.getMonth(), year: now.getFullYear() }
}

export default function MarketingDashboard({ navigateTo }) {
  const { state, dispatch } = useApp()
  const [editReview, setEditReview] = useState(false)
  const [reviewForm, setReviewForm] = useState({})

  const jobs = state.jobs ?? []
  const clients = state.clients ?? []
  const partners = state.partners ?? []
  const rt = state.reviewTracker ?? {}
  const { month: curMonth, year: curYear } = thisMonth()

  // ── Leads by Source ──────────────────────────────────────────
  const leadSourceStats = useMemo(() => {
    const map = {}
    jobs.forEach(j => {
      const src = j.leadSource || 'Unknown'
      if (!map[src]) map[src] = { count: 0, revenue: 0, won: 0, lost: 0 }
      map[src].count++
      if (j.stage === 'Closed' || j.stage === 'Invoiced') {
        map[src].won++
        map[src].revenue += Number(j.estimate?.grandTotal ?? j.revenue ?? 0)
      }
      if (j.stage === 'Lost') map[src].lost++
    })
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count)
  }, [jobs])

  const maxLeads = Math.max(...leadSourceStats.map(([, d]) => d.count), 1)
  const maxRevenue = Math.max(...leadSourceStats.map(([, d]) => d.revenue), 1)

  // ── Win/Loss ─────────────────────────────────────────────────
  const won = jobs.filter(j => j.stage === 'Closed' || j.stage === 'Invoiced').length
  const lost = jobs.filter(j => j.stage === 'Lost').length
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0

  // ── Referral Partner Leaderboard ─────────────────────────────
  const partnerBoard = useMemo(() => {
    return partners.map(p => {
      const referred = jobs.filter(j => j.leadSourcePartnerId === p.id)
      const revenue = referred
        .filter(j => j.stage === 'Closed' || j.stage === 'Invoiced')
        .reduce((s, j) => s + Number(j.estimate?.grandTotal ?? j.revenue ?? 0), 0)
      const lastContact = p.contactHistory?.slice(-1)[0]?.date ?? p.lastContactDate ?? p.createdAt ?? null
      const daysSince = lastContact ? Math.floor((Date.now() - new Date(lastContact)) / 86400000) : null
      return { ...p, referralCount: referred.length, referralRevenue: revenue, daysSince }
    })
      .filter(p => p.referralCount > 0 || p.contactHistory?.length > 0)
      .sort((a, b) => b.referralRevenue - a.referralRevenue)
      .slice(0, 10)
  }, [partners, jobs])

  // ── Conversion Rate by source ─────────────────────────────────
  const convRate = leadSourceStats.map(([src, d]) => ({
    src,
    rate: d.count > 0 ? Math.round((d.won / d.count) * 100) : 0,
    count: d.count,
  }))

  // ── Follow-up Engine Summary ──────────────────────────────────
  const unbooked = jobs.filter(j => ['Lead', 'Inspection', 'Estimate Sent'].includes(j.stage))
  const overdueFollowups = unbooked.filter(j => {
    const d = j.lastContactDate ?? j.createdAt
    if (!d) return false
    return Math.floor((Date.now() - new Date(d)) / 86400000) >= 3
  })

  // ── Monthly new leads trend ───────────────────────────────────
  const monthlyLeads = useMemo(() => {
    const map = {}
    jobs.forEach(j => {
      if (!j.createdAt) return
      const d = new Date(j.createdAt)
      if (d.getFullYear() !== curYear) return
      const m = d.getMonth()
      map[m] = (map[m] || 0) + 1
    })
    return MONTHS.map((label, i) => ({ label, count: map[i] ?? 0 }))
  }, [jobs, curYear])
  const maxMonthlyLeads = Math.max(...monthlyLeads.map(m => m.count), 1)

  const openReviewEdit = () => {
    setReviewForm({ sent: rt.sent ?? 0, received: rt.received ?? 0, rating: rt.rating ?? 0, posts: rt.posts ?? 0 })
    setEditReview(true)
  }
  const saveReview = () => {
    dispatch({
      type: ACTIONS.UPDATE_REVIEW_TRACKER,
      payload: { sent: Number(reviewForm.sent), received: Number(reviewForm.received), rating: Number(reviewForm.rating), posts: Number(reviewForm.posts) },
    })
    setEditReview(false)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-3 md:p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 size={18} className="text-red-500" /> Marketing Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Live data from all lead sources, referral partners, reviews, and pipeline.</p>
        </div>

        {/* Top summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-0.5">Total Leads</div>
            <div className="text-2xl font-bold text-gray-900">{jobs.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-0.5">Win Rate</div>
            <div className="text-2xl font-bold text-gray-900">{winRate}%</div>
            <div className="text-xs text-gray-400">{won}W / {lost}L</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-0.5">Reviews Received</div>
            <div className="text-2xl font-bold text-gray-900">{rt.received ?? 0}</div>
            {(rt.rating ?? 0) > 0 && <div className="text-xs text-yellow-500 flex items-center gap-0.5"><Star size={10} fill="currentColor" /> {Number(rt.rating).toFixed(1)} avg</div>}
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-0.5">Follow-Ups Overdue</div>
            <div className={`text-2xl font-bold ${overdueFollowups.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>{overdueFollowups.length}</div>
            <div className="text-xs text-gray-400">3+ days no contact</div>
          </div>
        </div>

        {/* Monthly New Leads */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">New Leads by Month — {curYear}</h3>
          <div className="flex items-end gap-1.5 h-24">
            {monthlyLeads.map(({ label, count }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end" style={{ height: '72px' }}>
                  <div className="w-full bg-red-500 rounded-t-sm transition-all"
                    style={{ height: `${Math.round((count / maxMonthlyLeads) * 100)}%`, minHeight: count > 0 ? '4px' : '0' }}
                    title={`${label}: ${count}`} />
                </div>
                <span className="text-[9px] text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Leads by Source */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Leads by Source</h3>
            {leadSourceStats.length === 0 ? (
              <p className="text-sm text-gray-400">No lead source data yet. Set lead source on jobs.</p>
            ) : (
              <div className="space-y-3">
                {leadSourceStats.map(([src, d]) => (
                  <div key={src} className="flex items-center gap-2">
                    <div className="w-28 flex-shrink-0 text-xs text-gray-600 font-medium truncate">{src}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.round((d.count / maxLeads) * 100)}%` }} />
                    </div>
                    <div className="text-xs font-bold text-gray-900 w-6 text-right">{d.count}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revenue by Source */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Revenue by Source</h3>
            {leadSourceStats.filter(([, d]) => d.revenue > 0).length === 0 ? (
              <p className="text-sm text-gray-400">No closed jobs with revenue yet.</p>
            ) : (
              <div className="space-y-3">
                {leadSourceStats.filter(([, d]) => d.revenue > 0).map(([src, d]) => (
                  <div key={src} className="flex items-center gap-2">
                    <div className="w-28 flex-shrink-0 text-xs text-gray-600 font-medium truncate">{src}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.round((d.revenue / maxRevenue) * 100)}%` }} />
                    </div>
                    <div className="text-xs font-bold text-gray-900 w-14 text-right">{fmtMoney(d.revenue)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Win/Loss + Conversion Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Conversion Rate by Source</h3>
            {convRate.filter(c => c.count > 0).length === 0 ? (
              <p className="text-sm text-gray-400">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {convRate.filter(c => c.count > 0).map(({ src, rate, count }) => (
                  <div key={src} className="flex items-center gap-2">
                    <div className="w-28 flex-shrink-0 text-xs text-gray-600 truncate">{src}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${rate >= 60 ? 'bg-green-500' : rate >= 30 ? 'bg-yellow-400' : 'bg-red-400'}`}
                        style={{ width: `${rate}%` }} />
                    </div>
                    <div className="text-xs font-bold text-gray-900 w-10 text-right">{rate}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Win / Loss Summary</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl font-black text-gray-900">{winRate}%</div>
              <div className="text-sm text-gray-500">win rate</div>
            </div>
            <div className="bg-gray-100 rounded-full h-3 mb-3">
              <div className="bg-green-500 h-3 rounded-full" style={{ width: `${winRate}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-green-700">{won}</div>
                <div className="text-xs text-gray-400">Won</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">{lost}</div>
                <div className="text-xs text-gray-400">Lost</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">{unbooked.length}</div>
                <div className="text-xs text-gray-400">Open</div>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Partner Leaderboard */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Referral Partner Leaderboard</h3>
          {partnerBoard.length === 0 ? (
            <p className="text-sm text-gray-400">No referral partners with contact history yet. Add partners in <button onClick={() => navigateTo?.('partners')} className="text-red-600 underline">Referral Partners</button>.</p>
          ) : (
            <div className="space-y-2">
              {partnerBoard.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0
                    ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-gray-300 text-gray-700' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.company ?? p.type ?? 'Partner'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{p.referralCount} referral{p.referralCount !== 1 ? 's' : ''}</div>
                    {p.referralRevenue > 0 && <div className="text-xs text-green-700">{fmtMoney(p.referralRevenue)}</div>}
                    {p.daysSince !== null && <div className={`text-xs ${p.daysSince > 30 ? 'text-red-500' : 'text-gray-400'}`}>{p.daysSince}d ago</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Tracker */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">Review Tracker</h3>
            <button onClick={editReview ? saveReview : openReviewEdit}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50">
              {editReview ? <><Check size={12} /> Save</> : <><Edit2 size={12} /> Update</>}
            </button>
          </div>
          {editReview ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[['sent', 'Requests Sent'], ['received', 'Reviews Received'], ['rating', 'Avg Rating (0-5)'], ['posts', 'IG Posts']].map(([k, label]) => (
                <div key={k}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input type="number" min="0" max={k === 'rating' ? 5 : undefined} step={k === 'rating' ? '0.1' : '1'}
                    value={reviewForm[k] ?? 0} onChange={e => setReviewForm(p => ({ ...p, [k]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{rt.sent ?? 0}</div>
                <div className="text-xs text-gray-400 mt-0.5">Requests Sent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{rt.received ?? 0}</div>
                <div className="text-xs text-gray-400 mt-0.5">Reviews Received</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500 flex items-center justify-center gap-1">
                  <Star size={16} fill="currentColor" />
                  {Number(rt.rating ?? 0).toFixed(1)}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Avg Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{rt.posts ?? 0}</div>
                <div className="text-xs text-gray-400 mt-0.5">IG Posts</div>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">Update this manually after each Google review request campaign or monthly social post count.</p>
        </div>

        {/* Follow-up Engine Summary */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">Follow-Up Engine</h3>
            <button onClick={() => navigateTo?.('followupengine')} className="text-xs text-red-600 font-semibold hover:underline">Open Engine</button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-lg font-bold text-gray-900">{unbooked.length}</div>
              <div className="text-xs text-gray-400">Unbooked Leads</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${overdueFollowups.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>{overdueFollowups.length}</div>
              <div className="text-xs text-gray-400">Overdue (3+ days)</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{unbooked.filter(j => !j.lastContactDate).length}</div>
              <div className="text-xs text-gray-400">Never Contacted</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
