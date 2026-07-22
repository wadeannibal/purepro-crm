import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { Home, AlertCircle, CalendarDays, TrendingUp, Users, Clock, Zap, Package, BadgeCheck, ChevronRight } from 'lucide-react'

const JOB_STAGES = ['Lead', 'Inspection', 'Estimate Sent', 'Approved', 'Remediation', 'Post-Test', 'Invoiced', 'Closed', 'Lost']

function fmtMoney(n) {
  if (!n) return '$0'
  if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'k'
  return '$' + Math.round(n).toLocaleString()
}
function today() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function daysDiff(iso) {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso)) / 86400000)
}
function daysUntil(iso) {
  if (!iso) return null
  return Math.floor((new Date(iso) - Date.now()) / 86400000)
}

function weekStart(offset = 0) {
  const d = today()
  d.setDate(d.getDate() + offset * 7)
  return d
}

export default function OperationsDashboard({ navigateTo }) {
  const { state } = useApp()
  const jobs = state.jobs ?? []
  const clients = state.clients ?? []
  const partners = state.partners ?? []
  const events = state.events ?? []
  const certifications = state.certifications ?? []
  const inventory = state.inventory ?? []

  const now = new Date()
  const curMonth = now.getMonth()
  const curYear = now.getFullYear()

  const inMonth = (dateStr) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    return d.getMonth() === curMonth && d.getFullYear() === curYear
  }

  // ── Priorities ─────────────────────────────────────────────
  const priorities = useMemo(() => {
    const items = []

    // Overdue follow-ups (unbooked leads 3+ days no contact)
    const overdueLeads = jobs.filter(j => {
      if (!['Lead', 'Inspection', 'Estimate Sent'].includes(j.stage)) return false
      const d = daysDiff(j.lastContactDate ?? j.createdAt)
      return d !== null && d >= 3
    })
    if (overdueLeads.length > 0) {
      items.push({
        type: 'followup',
        priority: 1,
        label: `${overdueLeads.length} lead${overdueLeads.length !== 1 ? 's' : ''} overdue for follow-up`,
        detail: overdueLeads.slice(0, 2).map(j => {
          const c = clients.find(cl => cl.id === j.clientId)
          return c?.name ?? 'Unknown'
        }).join(', ') + (overdueLeads.length > 2 ? ` +${overdueLeads.length - 2} more` : ''),
        action: 'followupengine',
        urgency: 'high',
      })
    }

    // Estimates >48h not yet closed
    const stalePending = jobs.filter(j => {
      if (j.stage !== 'Estimate Sent') return false
      const d = daysDiff(j.estimate?.sentAt)
      return d !== null && d >= 2
    })
    if (stalePending.length > 0) {
      items.push({
        type: 'estimate',
        priority: 2,
        label: `${stalePending.length} estimate${stalePending.length !== 1 ? 's' : ''} awaiting decision (48h+)`,
        detail: stalePending.slice(0, 2).map(j => {
          const c = clients.find(cl => cl.id === j.clientId)
          return c?.name ?? 'Unknown'
        }).join(', ') + (stalePending.length > 2 ? ` +${stalePending.length - 2} more` : ''),
        action: 'followup',
        urgency: 'medium',
      })
    }

    // Overdue invoices
    const overdueInvoices = jobs.filter(j => {
      if (!j.invoice || j.invoice.status === 'Paid') return false
      if (!j.invoice.dueDate) return false
      return new Date(j.invoice.dueDate) < now
    })
    if (overdueInvoices.length > 0) {
      items.push({
        type: 'invoice',
        priority: 3,
        label: `${overdueInvoices.length} invoice${overdueInvoices.length !== 1 ? 's' : ''} past due`,
        detail: fmtMoney(overdueInvoices.reduce((s, j) => s + Number(j.invoice?.amountTotal ?? 0), 0)) + ' outstanding',
        action: 'invoicing',
        urgency: 'high',
      })
    }

    // Appointments today
    const todayDate = today()
    const todayAppts = events.filter(e => {
      if (!e.date) return false
      const d = new Date(e.date + 'T' + (e.startTime ?? '00:00'))
      return d.getDate() === todayDate.getDate() && d.getMonth() === todayDate.getMonth() && d.getFullYear() === todayDate.getFullYear()
    })
    if (todayAppts.length > 0) {
      items.push({
        type: 'appointment',
        priority: 0,
        label: `${todayAppts.length} appointment${todayAppts.length !== 1 ? 's' : ''} today`,
        detail: todayAppts.slice(0, 2).map(e => e.eventType ?? 'Appointment').join(', '),
        action: 'scheduler',
        urgency: 'high',
      })
    }

    // Expiring certs (from certifications module)
    const allCerts = certifications.length > 0 ? certifications : []
    const expiringCerts = allCerts.filter(c => {
      if (!c.expirationDate) return false
      const d = daysUntil(c.expirationDate)
      return d !== null && d >= 0 && d <= 90
    })
    if (expiringCerts.length > 0) {
      items.push({
        type: 'cert',
        priority: 4,
        label: `${expiringCerts.length} certification${expiringCerts.length !== 1 ? 's' : ''} expiring within 90 days`,
        detail: expiringCerts.slice(0, 2).map(c => c.name).join(', '),
        action: 'certs',
        urgency: 'medium',
      })
    }

    // Overdue partner follow-ups (30+ days)
    const overduePartners = partners.filter(p => {
      const last = p.contactHistory?.slice(-1)[0]?.date ?? p.lastContactDate ?? p.createdAt
      const d = daysDiff(last)
      return d !== null && d >= 30
    })
    if (overduePartners.length > 0) {
      items.push({
        type: 'partner',
        priority: 5,
        label: `${overduePartners.length} referral partner${overduePartners.length !== 1 ? 's' : ''} not contacted in 30+ days`,
        detail: overduePartners.slice(0, 2).map(p => p.name).join(', '),
        action: 'partners',
        urgency: 'medium',
      })
    }

    return items.sort((a, b) => a.priority - b.priority).slice(0, 3)
  }, [jobs, clients, partners, events, certifications])

  // ── Jobs by Stage ─────────────────────────────────────────
  const stageMap = useMemo(() => {
    const m = {}
    JOB_STAGES.forEach(s => { m[s] = 0 })
    jobs.forEach(j => { if (m[j.stage] !== undefined) m[j.stage]++ })
    return m
  }, [jobs])

  const activeStages = JOB_STAGES.filter(s => !['Closed', 'Lost'].includes(s))

  // ── Revenue This Month ────────────────────────────────────
  const monthlyRevenue = useMemo(() => {
    return jobs
      .filter(j => j.invoice?.status === 'Paid' && inMonth(j.invoice?.paidAt ?? j.invoice?.updatedAt))
      .reduce((s, j) => s + Number(j.invoice?.amountTotal ?? j.estimate?.grandTotal ?? j.revenue ?? 0), 0)
  }, [jobs])

  // Also count closed jobs this month
  const closedThisMonth = jobs.filter(j =>
    (j.stage === 'Closed' || j.stage === 'Invoiced') && inMonth(j.updatedAt ?? j.createdAt)
  ).length

  // ── Upcoming Appointments (7 days) ───────────────────────
  const upcoming = useMemo(() => {
    const limit = new Date(now.getTime() + 7 * 86400000)
    return events
      .filter(e => {
        if (!e.date) return false
        const d = new Date(e.date + 'T' + (e.startTime ?? '00:00'))
        return d >= now && d <= limit
      })
      .sort((a, b) => {
        const da = new Date(a.date + 'T' + (a.startTime ?? '00:00'))
        const db = new Date(b.date + 'T' + (b.startTime ?? '00:00'))
        return da - db
      })
      .slice(0, 5)
  }, [events])

  // ── Recent Activity Feed ──────────────────────────────────
  const activityFeed = useMemo(() => {
    const items = []
    const cutoff = new Date(now.getTime() - 30 * 86400000)

    jobs.forEach(j => {
      const c = clients.find(cl => cl.id === j.clientId)
      const name = c?.name ?? j.address ?? 'Unknown'
      if (j.createdAt && new Date(j.createdAt) > cutoff)
        items.push({ date: j.createdAt, label: `New ${j.type ?? 'job'} — ${name}`, icon: 'job', view: 'jobs' })
      if (j.estimate?.sentAt && new Date(j.estimate.sentAt) > cutoff)
        items.push({ date: j.estimate.sentAt, label: `Estimate sent — ${name}`, icon: 'estimate', view: 'estimator' })
      if (j.invoice?.paidAt && new Date(j.invoice.paidAt) > cutoff)
        items.push({ date: j.invoice.paidAt, label: `Invoice paid — ${name} (${fmtMoney(j.invoice.amountTotal)})`, icon: 'paid', view: 'invoicing' })
      if (j.survey?.completedAt && new Date(j.survey.completedAt) > cutoff)
        items.push({ date: j.survey.completedAt, label: `Survey completed — ${name} (${j.survey.stars ?? '?'}★)`, icon: 'survey', view: 'survey' })
    })

    partners.forEach(p => {
      ;(p.contactHistory ?? []).forEach(h => {
        if (h.date && new Date(h.date) > cutoff)
          items.push({ date: h.date, label: `Partner contact — ${p.name} (${h.type ?? 'contacted'})`, icon: 'partner', view: 'partners' })
      })
    })

    events.forEach(e => {
      if (e.createdAt && new Date(e.createdAt) > cutoff)
        items.push({ date: e.createdAt, label: `Appointment scheduled — ${e.eventType ?? 'Appointment'}`, icon: 'appt', view: 'scheduler' })
    })

    return items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)
  }, [jobs, clients, partners, events])

  // ── Warranty jobs ────────────────────────────────────────
  const warrantyJobs = useMemo(() => {
    return jobs.filter(j => j.warranty?.active || (j.stage === 'Closed' && j.warranty?.endDate && daysUntil(j.warranty.endDate) > 0))
  }, [jobs])

  // ── Low stock items ───────────────────────────────────────
  const lowStockItems = useMemo(() =>
    inventory.filter(i => i.threshold != null && Number(i.qty) <= Number(i.threshold)),
  [inventory])

  // ── Speed to Lead (avg days from lead to first contact) ──
  const speedToLead = useMemo(() => {
    const vals = jobs.filter(j => j.firstContactDate && j.createdAt).map(j =>
      Math.max(0, Math.floor((new Date(j.firstContactDate) - new Date(j.createdAt)) / 86400000))
    )
    if (vals.length === 0) return null
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
  }, [jobs])

  // ── Cash Flow Forecast (8 weeks) ─────────────────────────
  const cashForecast = useMemo(() => {
    const weeks = Array.from({ length: 8 }, (_, i) => ({
      label: i === 0 ? 'This Wk' : `+${i}w`,
      invoiced: 0,
      pipeline: 0,
    }))

    // Outstanding invoices due within 8 weeks
    jobs.forEach(j => {
      if (!j.invoice || j.invoice.status === 'Paid') return
      if (!j.invoice.dueDate) return
      const daysAway = daysUntil(j.invoice.dueDate)
      if (daysAway === null || daysAway < 0 || daysAway > 55) return
      const wk = Math.floor(daysAway / 7)
      weeks[wk].invoiced += Number(j.invoice.amountTotal ?? 0)
    })

    // Pipeline: in-progress jobs evenly spread over next 4 weeks
    const pipelineJobs = jobs.filter(j => ['Approved', 'Remediation', 'Post-Test'].includes(j.stage))
    const pipelineTotal = pipelineJobs.reduce((s, j) => s + Number(j.estimate?.grandTotal ?? j.revenue ?? 0), 0)
    const perWeek = pipelineTotal / 4
    for (let i = 0; i < 4; i++) weeks[i].pipeline += perWeek

    return weeks
  }, [jobs])

  const maxCash = Math.max(...cashForecast.map(w => w.invoiced + w.pipeline), 1)

  const urgencyColors = { high: 'bg-red-50 border-red-200 text-red-700', medium: 'bg-yellow-50 border-yellow-200 text-yellow-800' }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-5xl mx-auto p-3 md:p-5 space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Home size={18} className="text-red-500" /> Operations Dashboard
            </h2>
            <p className="text-sm text-gray-400">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-4 text-center">
            <div>
              <div className="text-2xl font-black text-gray-900">{jobs.filter(j => !['Closed', 'Lost'].includes(j.stage)).length}</div>
              <div className="text-xs text-gray-400">Active Jobs</div>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <div className="text-2xl font-black text-green-700">{fmtMoney(monthlyRevenue)}</div>
              <div className="text-xs text-gray-400">Revenue {now.toLocaleString('en-US', { month: 'short' })}</div>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <div className="text-2xl font-black text-gray-900">{clients.length}</div>
              <div className="text-xs text-gray-400">Total Clients</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* LEFT COLUMN */}
          <div className="md:col-span-2 space-y-5">

            {/* Top 3 Priorities */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <AlertCircle size={14} className="text-red-500" /> Today's Top Priorities
              </h3>
              {priorities.length === 0 ? (
                <div className="py-4 text-center text-sm text-green-600 font-medium">All clear — no urgent items!</div>
              ) : (
                <div className="space-y-2">
                  {priorities.map((p, i) => (
                    <div key={i} className={`flex items-center justify-between gap-3 border rounded-xl px-4 py-3 ${urgencyColors[p.urgency]}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{p.label}</div>
                        {p.detail && <div className="text-xs opacity-70 truncate mt-0.5">{p.detail}</div>}
                      </div>
                      <button onClick={() => navigateTo?.(p.action)} className="flex-shrink-0 text-xs font-bold opacity-70 hover:opacity-100 flex items-center gap-0.5">
                        Go <ChevronRight size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Jobs by Stage */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800">Active Jobs by Stage</h3>
                <button onClick={() => navigateTo?.('pipeline')} className="text-xs text-red-600 font-semibold hover:underline">View Pipeline</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {activeStages.map(stage => {
                  const count = stageMap[stage] ?? 0
                  const colors = {
                    Lead: 'bg-blue-50 text-blue-700',
                    Inspection: 'bg-indigo-50 text-indigo-700',
                    'Estimate Sent': 'bg-yellow-50 text-yellow-800',
                    Approved: 'bg-orange-50 text-orange-700',
                    Remediation: 'bg-red-50 text-red-700',
                    'Post-Test': 'bg-teal-50 text-teal-700',
                    Invoiced: 'bg-purple-50 text-purple-700',
                  }
                  return (
                    <div key={stage} className={`rounded-xl px-3 py-2.5 text-center ${colors[stage] ?? 'bg-gray-50 text-gray-600'}`}>
                      <div className="text-xl font-black">{count}</div>
                      <div className="text-[10px] font-semibold leading-tight mt-0.5">{stage}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cash Flow Forecast */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Cash Flow Forecast</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Invoices due + pipeline estimates — next 8 weeks</p>
                </div>
                <button onClick={() => navigateTo?.('cashflow')} className="text-xs text-red-600 font-semibold hover:underline">Full View</button>
              </div>
              <div className="flex items-end gap-1.5 h-28">
                {cashForecast.map((wk, i) => {
                  const total = wk.invoiced + wk.pipeline
                  const pct = Math.round((total / maxCash) * 100)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                        <div className="w-full flex flex-col" style={{ height: `${pct}%`, minHeight: total > 0 ? '8px' : '0' }}>
                          <div className="flex-1 bg-red-200 rounded-t-sm" style={{ flex: wk.pipeline / (total || 1) }} />
                          <div className="bg-red-500" style={{ flex: wk.invoiced / (total || 1) }} />
                        </div>
                      </div>
                      <div className="text-[9px] text-gray-400 text-center leading-tight">
                        <div>{wk.label}</div>
                        {total > 0 && <div className="font-semibold text-gray-600">{fmtMoney(total)}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500" /> Invoiced</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-200" /> Pipeline Est.</div>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Recent Activity</h3>
              {activityFeed.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No recent activity. Add jobs, send estimates, or log partner contacts.</p>
              ) : (
                <div className="space-y-2">
                  {activityFeed.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-700 truncate">{item.label}</div>
                      </div>
                      <div className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">

            {/* Quick stats */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Jobs Closed This Month</span>
                <span className="text-sm font-bold text-gray-900">{closedThisMonth}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Leads in Pipeline</span>
                <button onClick={() => navigateTo?.('pipeline')} className="text-sm font-bold text-blue-600 hover:underline">
                  {jobs.filter(j => !['Closed', 'Lost'].includes(j.stage)).length}
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Under Warranty</span>
                <button onClick={() => navigateTo?.('warranty')} className="text-sm font-bold text-gray-900 hover:text-red-600">
                  {warrantyJobs.length}
                </button>
              </div>
              {speedToLead !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Avg Speed to Lead</span>
                  <span className="text-sm font-bold text-gray-900">{speedToLead}d</span>
                </div>
              )}
              {lowStockItems.length > 0 && (
                <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                  <span className="text-xs text-red-600 font-semibold flex items-center gap-1">
                    <Package size={11} /> Low Stock
                  </span>
                  <button onClick={() => navigateTo?.('inventory')} className="text-xs font-bold text-red-600 hover:underline">
                    {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''}
                  </button>
                </div>
              )}
            </div>

            {/* Upcoming appointments */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <CalendarDays size={13} className="text-red-500" /> Next 7 Days
                </h3>
                <button onClick={() => navigateTo?.('scheduler')} className="text-xs text-red-600 font-semibold hover:underline">Calendar</button>
              </div>
              {upcoming.length === 0 ? (
                <p className="text-xs text-gray-400">No appointments in the next 7 days.</p>
              ) : (
                <div className="space-y-2">
                  {upcoming.map(e => {
                    const d = new Date(e.date + 'T' + (e.startTime ?? '00:00'))
                    return (
                      <div key={e.id} className="border-l-2 border-red-400 pl-3">
                        <div className="text-xs font-semibold text-gray-800 truncate">{e.eventType ?? 'Appointment'}</div>
                        <div className="text-[10px] text-gray-400">
                          {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {e.startTime && ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Overdue partner follow-ups */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Users size={13} className="text-red-500" /> Partner Follow-Ups
                </h3>
                <button onClick={() => navigateTo?.('partners')} className="text-xs text-red-600 font-semibold hover:underline">Manage</button>
              </div>
              {partners.length === 0 ? (
                <p className="text-xs text-gray-400">No partners yet.</p>
              ) : (() => {
                const overdue = partners.filter(p => {
                  const last = p.contactHistory?.slice(-1)[0]?.date ?? p.lastContactDate ?? p.createdAt
                  const d = daysDiff(last)
                  return d !== null && d >= 30
                })
                if (overdue.length === 0) return <p className="text-xs text-green-600 font-medium">All partners contacted recently.</p>
                return (
                  <div className="space-y-2">
                    {overdue.slice(0, 4).map(p => {
                      const last = p.contactHistory?.slice(-1)[0]?.date ?? p.lastContactDate ?? p.createdAt
                      const d = daysDiff(last)
                      return (
                        <div key={p.id} className="flex items-center justify-between">
                          <div className="text-xs text-gray-700 truncate max-w-[130px]">{p.name}</div>
                          <span className="text-[10px] font-bold text-red-600">{d}d ago</span>
                        </div>
                      )
                    })}
                    {overdue.length > 4 && <div className="text-xs text-gray-400">+{overdue.length - 4} more</div>}
                  </div>
                )
              })()}
            </div>

            {/* Cert expiry alerts */}
            {certifications.length > 0 && (() => {
              const expiring = certifications.filter(c => {
                if (!c.expirationDate) return false
                const d = daysUntil(c.expirationDate)
                return d !== null && d <= 90
              })
              if (expiring.length === 0) return null
              return (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                  <h3 className="text-xs font-bold text-yellow-800 mb-2 flex items-center gap-1.5">
                    <BadgeCheck size={13} /> Cert Alerts
                  </h3>
                  <div className="space-y-1.5">
                    {expiring.slice(0, 3).map(c => {
                      const d = daysUntil(c.expirationDate)
                      return (
                        <div key={c.id} className="flex items-center justify-between">
                          <div className="text-xs text-yellow-800 truncate max-w-[140px]">{c.name}</div>
                          <span className={`text-[10px] font-bold ${d < 0 ? 'text-red-600' : 'text-yellow-700'}`}>
                            {d < 0 ? 'Expired' : `${d}d`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <button onClick={() => navigateTo?.('certs')} className="text-xs text-yellow-700 font-semibold mt-2 hover:underline flex items-center gap-0.5">
                    View all <ChevronRight size={10} />
                  </button>
                </div>
              )
            })()}

            {/* KPI quick view */}
            <div className="bg-gray-900 text-white rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <TrendingUp size={12} /> This Month
                </h3>
                <button onClick={() => navigateTo?.('kpi')} className="text-xs text-red-400 font-semibold hover:text-red-300">KPIs</button>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'New Leads', val: jobs.filter(j => inMonth(j.createdAt)).length },
                  { label: 'Estimates Sent', val: jobs.filter(j => inMonth(j.estimate?.sentAt)).length },
                  { label: 'Jobs Closed', val: closedThisMonth },
                  { label: 'Revenue', val: fmtMoney(monthlyRevenue) },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{label}</span>
                    <span className="text-sm font-bold text-white">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
