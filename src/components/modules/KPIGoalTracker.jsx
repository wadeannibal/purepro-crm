import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { Target, ChevronLeft, ChevronRight, Edit2, Check } from 'lucide-react'

const KPIS = [
  { key: 'jobs', label: 'Jobs Completed', unit: '', format: 'int', auto: true, color: 'bg-green-500' },
  { key: 'leads', label: 'New Leads', unit: '', format: 'int', auto: true, color: 'bg-blue-500' },
  { key: 'calls', label: 'Partner Outreach Calls', unit: '', format: 'int', auto: true, color: 'bg-purple-500' },
  { key: 'estimates', label: 'Estimates Sent', unit: '', format: 'int', auto: true, color: 'bg-indigo-500' },
  { key: 'revenue', label: 'Revenue Collected', unit: '$', format: 'money', auto: true, color: 'bg-emerald-500' },
  { key: 'reviews', label: 'Google Reviews Earned', unit: '', format: 'int', auto: false, color: 'bg-yellow-500' },
  { key: 'posts', label: 'Instagram Posts', unit: '', format: 'int', auto: false, color: 'bg-pink-500' },
  { key: 'winRate', label: 'Win Rate', unit: '%', format: 'pct', auto: true, color: 'bg-red-500' },
]

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(date) {
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}
function fmtVal(kpi, v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  if (kpi.format === 'money') return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (kpi.format === 'pct') return n + '%'
  return String(Math.round(n))
}

function computeActuals(state, monthDate) {
  const m = monthDate.getMonth()
  const y = monthDate.getFullYear()

  const inMonth = (dateStr) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    return d.getMonth() === m && d.getFullYear() === y
  }

  const jobs = state.jobs ?? []
  const partners = state.partners ?? []

  // Jobs Completed
  const completedJobs = jobs.filter(j =>
    (j.stage === 'Closed' || j.stage === 'Invoiced') && inMonth(j.updatedAt ?? j.createdAt)
  ).length

  // New Leads
  const newLeads = jobs.filter(j => inMonth(j.createdAt)).length

  // Partner Calls
  const partnerCalls = partners.reduce((sum, p) => {
    const calls = (p.contactHistory ?? []).filter(h =>
      (h.type ?? '').toLowerCase().includes('call') && inMonth(h.date)
    )
    return sum + calls.length
  }, 0)

  // Estimates Sent
  const estimatesSent = jobs.filter(j => inMonth(j.estimate?.sentAt)).length

  // Revenue (from payment dates on invoices)
  const revenue = (jobs ?? []).reduce((sum, j) => {
    return sum + (j.invoice?.payments ?? [])
      .filter(p => inMonth(p.date))
      .reduce((s, p) => s + (p.amount ?? 0), 0)
  }, 0)

  // Win Rate
  const wonInMonth = jobs.filter(j =>
    (j.stage === 'Closed' || j.stage === 'Invoiced') && inMonth(j.updatedAt ?? j.createdAt)
  ).length
  const lostInMonth = jobs.filter(j => j.stage === 'Lost' && inMonth(j.updatedAt ?? j.createdAt)).length
  const winRate = wonInMonth + lostInMonth > 0 ? Math.round((wonInMonth / (wonInMonth + lostInMonth)) * 100) : null

  return { jobs: completedJobs, leads: newLeads, calls: partnerCalls, estimates: estimatesSent, revenue, winRate }
}

export default function KPIGoalTracker() {
  const { state, dispatch } = useApp()
  const [offset, setOffset] = useState(0) // 0 = current month, -1 = last month, etc.
  const [editMode, setEditMode] = useState(false)
  const [goalForm, setGoalForm] = useState({})
  const [manualForm, setManualForm] = useState({})
  const [showHistory, setShowHistory] = useState(false)

  const now = new Date()
  const viewDate = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const mKey = monthKey(viewDate)
  const mLabel = monthLabel(viewDate)
  const isCurrent = offset === 0

  const savedGoals = state.kpiGoals?.[mKey] ?? {}
  const autoActuals = useMemo(() => computeActuals(state, viewDate), [state, offset])

  const startEdit = () => {
    const gf = {}
    const mf = {}
    KPIS.forEach(kpi => {
      gf[kpi.key] = String(savedGoals['goal_' + kpi.key] ?? '')
      if (!kpi.auto) mf[kpi.key] = String(savedGoals['actual_' + kpi.key] ?? '')
    })
    setGoalForm(gf)
    setManualForm(mf)
    setEditMode(true)
  }

  const saveEdit = () => {
    const updates = {}
    KPIS.forEach(kpi => {
      if (goalForm[kpi.key] !== '') updates['goal_' + kpi.key] = Number(goalForm[kpi.key])
      if (!kpi.auto && manualForm[kpi.key] !== '') updates['actual_' + kpi.key] = Number(manualForm[kpi.key])
    })
    dispatch({ type: ACTIONS.SET_KPI_GOAL, payload: { month: mKey, goals: updates } })
    setEditMode(false)
  }

  const getActual = (kpi) => {
    if (kpi.auto) return autoActuals[kpi.key]
    const saved = savedGoals['actual_' + kpi.key]
    return saved !== undefined ? saved : null
  }

  const getGoal = (kpi) => {
    const g = savedGoals['goal_' + kpi.key]
    return g !== undefined ? g : null
  }

  const pct = (actual, goal) => {
    if (!goal || !actual) return 0
    return Math.min(100, Math.round((Number(actual) / Number(goal)) * 100))
  }

  // Year-to-date aggregation
  const ytd = useMemo(() => {
    const result = {}
    for (let mo = 0; mo <= 11; mo++) {
      const d = new Date(now.getFullYear(), mo, 1)
      if (d > now) break
      const actuals = computeActuals(state, d)
      KPIS.forEach(kpi => {
        if (!kpi.auto) return
        if (kpi.format === 'pct') return
        result[kpi.key] = (result[kpi.key] ?? 0) + (actuals[kpi.key] ?? 0)
      })
    }
    return result
  }, [state])

  // Historical month keys (oldest to newest, excluding current)
  const historyKeys = useMemo(() => {
    const allKeys = new Set(Object.keys(state.kpiGoals ?? {}))
    return Array.from(allKeys).filter(k => k !== monthKey(now)).sort()
  }, [state.kpiGoals])

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-3 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Target size={18} className="text-red-500" /> KPI Goal Tracker
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Monthly performance goals vs actuals. Auto-computed where possible.</p>
          </div>
          <button onClick={editMode ? saveEdit : startEdit}
            className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-colors
              ${editMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
            {editMode ? <><Check size={14} /> Save Goals</> : <><Edit2 size={14} /> Set Goals</>}
          </button>
        </div>

        {/* Month navigator */}
        <div className="flex items-center justify-center gap-4 bg-white border border-gray-200 rounded-2xl px-5 py-3">
          <button onClick={() => setOffset(o => o - 1)} className="p-1.5 text-gray-400 hover:text-gray-700"><ChevronLeft size={16} /></button>
          <div className="text-sm font-bold text-gray-900 min-w-[160px] text-center">{mLabel}</div>
          <button onClick={() => setOffset(o => Math.min(0, o + 1))} disabled={offset === 0}
            className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>

        {editMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700">
            <strong>Edit mode:</strong> Set monthly goals and enter manual actuals for reviews and posts. Auto-computed fields (green labels) pull from your job and partner data.
          </div>
        )}

        {/* KPI grid */}
        <div className="space-y-3">
          {KPIS.map(kpi => {
            const actual = getActual(kpi)
            const goal = getGoal(kpi)
            const progress = pct(actual, goal)
            const met = goal !== null && actual !== null && Number(actual) >= Number(goal)

            return (
              <div key={kpi.key} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{kpi.label}</div>
                    {kpi.auto
                      ? <div className="text-[10px] text-green-600 font-medium mt-0.5">Auto-computed from your data</div>
                      : <div className="text-[10px] text-gray-400 font-medium mt-0.5">Manual entry</div>}
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-black ${met ? 'text-green-600' : 'text-gray-900'}`}>
                      {kpi.format === 'money' && actual !== null && actual !== undefined ? '$' + Number(actual).toLocaleString('en-US', { maximumFractionDigits: 0 }) : fmtVal(kpi, actual)}
                    </div>
                    {goal !== null && <div className="text-xs text-gray-400">Goal: {fmtVal(kpi, goal)}</div>}
                  </div>
                </div>

                {editMode ? (
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Goal</label>
                      <input
                        type="number" min="0" value={goalForm[kpi.key] ?? ''}
                        onChange={e => setGoalForm(p => ({ ...p, [kpi.key]: e.target.value }))}
                        placeholder="Set goal..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    {!kpi.auto && (
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Actual (manual)</label>
                        <input
                          type="number" min="0" value={manualForm[kpi.key] ?? ''}
                          onChange={e => setManualForm(p => ({ ...p, [kpi.key]: e.target.value }))}
                          placeholder="Enter actual..."
                          className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    )}
                  </div>
                ) : (
                  goal !== null ? (
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{progress}% of goal</span>
                        {met && <span className="text-green-600 font-bold">Goal Met!</span>}
                      </div>
                      <div className="bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${met ? 'bg-green-500' : kpi.color}`}
                          style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic">No goal set — click "Set Goals" to add one</div>
                  )
                )}
              </div>
            )
          })}
        </div>

        {/* Year-to-date */}
        <div className="bg-gray-900 text-white rounded-2xl p-5">
          <h3 className="text-sm font-bold mb-4">Year-to-Date — {now.getFullYear()}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {KPIS.filter(k => k.auto && k.format !== 'pct').map(kpi => (
              <div key={kpi.key}>
                <div className="text-[11px] text-gray-400 mb-0.5">{kpi.label}</div>
                <div className="text-lg font-bold text-white">
                  {kpi.format === 'money'
                    ? '$' + (ytd[kpi.key] ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })
                    : (ytd[kpi.key] ?? 0)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        {historyKeys.length > 0 && (
          <div>
            <button onClick={() => setShowHistory(s => !s)} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
              <ChevronRight size={14} className={`transition-transform ${showHistory ? 'rotate-90' : ''}`} />
              Previous Month Archives ({historyKeys.length})
            </button>
            {showHistory && (
              <div className="mt-3 space-y-2">
                {[...historyKeys].reverse().map(key => {
                  const [y, mo] = key.split('-').map(Number)
                  const label = new Date(y, mo - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
                  const saved = state.kpiGoals[key]
                  return (
                    <div key={key} className="bg-white border border-gray-200 rounded-2xl px-5 py-3">
                      <div className="text-sm font-bold text-gray-800 mb-2">{label}</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {KPIS.slice(0, 4).map(kpi => (
                          <div key={kpi.key}>
                            <div className="text-[10px] text-gray-400">{kpi.label}</div>
                            <div className="text-sm font-semibold text-gray-700">
                              Goal: {fmtVal(kpi, saved['goal_' + kpi.key])}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
