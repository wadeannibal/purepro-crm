import { useState, useRef, useEffect, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatCurrency, isInvoiceOverdue, invoiceBalance } from '../../utils/helpers'
import { TrendingUp, Search, Bell, X, Briefcase, Users, AlertCircle, Clock, ShieldAlert, Calendar, Menu } from 'lucide-react'

const TITLES = {
  pipeline: 'Job Pipeline',
  crm: 'CRM / Clients',
  jobs: 'Job Records',
  communications: 'Communication Log',
  photos: 'Photo Attachments',
  documents: 'Document Storage',
  equipment: 'Equipment Tracker',
  timer: 'Job Timer',
  waivers: 'Liability Waivers',
  osha: 'OSHA Compliance',
  vip: 'VIP Clients',
  estimator: 'Estimator',
  proposals: 'Proposal Templates',
  quote: 'Quote Generator',
  followup: 'Estimate Follow-Up Tracker',
  invoicing: 'Invoicing',
  jobcosting: 'Job Costing',
  pl: 'P&L Snapshot',
  overhead: 'Overhead Calculator',
  cashflow: 'Cash Flow Forecast',
  insurance: 'Insurance & Claims',
  subs: 'Subcontractor Management',
  expenses: 'Expense Tracker',
  tax: 'Tax Estimator',
  scheduler: 'Scheduler',
  apptconfirm: 'Appointment Confirmations',
  moisture: 'Moisture Log',
  drying: 'Drying Log',
  portal: 'Client Portal',
  esign: 'E-Signature',
  survey: 'Satisfaction Survey',
  referral: 'Referral Ask',
  review: 'Google Review Requests',
  warranty: 'Warranty Tracking',
  checkin: 'Annual Check-In',
  partners: 'Referral Partners',
  scripts: 'Outreach Scripts',
  objections: 'Objection Handler',
  leadsource: 'Lead Sources',
  winloss: 'Win / Loss Tracker',
  followupengine: 'Follow-Up Engine',
  aicontent: 'AI Content Generator',
  seasonal: 'Seasonal Campaigns',
  competitors: 'Competitor Intel',
  gbp: 'GBP Optimizer',
  showcase: 'Before/After Showcase',
  certs: 'Certification Tracker',
  inventory: 'Inventory Tracker',
  docs: 'Document Library',
  onboarding: 'Employee Onboarding',
  expensesummary: 'Annual Expense Summary',
  operations: 'Operations Dashboard',
  marketing: 'Marketing Dashboard',
  kpi: 'KPI Goal Tracker',
  settings: 'Settings',
}

const JOB_VIEWS = ['jobs', 'photos', 'documents', 'timer', 'waivers', 'osha', 'estimator', 'quote', 'insurance', 'subs', 'expenses', 'jobcosting']

const NOTIF_COLOR = {
  red: 'bg-red-50 border-red-200 text-red-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
}

const NOTIF_ICON = { invoice: AlertCircle, warranty: ShieldAlert, appt: Calendar, followup: Clock }

export default function Header({ currentView, selectedJobId, navigateTo, onMenuClick }) {
  const { state } = useApp()
  const [searchQ, setSearchQ] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const searchRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const activeJobs = state.jobs.filter(j => j.stage !== 'Closed')
  const totalPipeline = activeJobs.reduce((sum, j) => sum + (j.revenue ?? 0), 0)
  const selectedJob = selectedJobId ? state.jobs.find(j => j.id === selectedJobId) : null
  const selectedClient = selectedJob ? state.clients.find(c => c.id === selectedJob.clientId) : null

  // Global search
  const searchResults = useMemo(() => {
    const q = searchQ.trim().toLowerCase()
    if (q.length < 2) return []
    const results = []

    state.clients.forEach(c => {
      if (results.length >= 4) return
      if (c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q) || c.address?.toLowerCase().includes(q)) {
        results.push({ type: 'client', id: c.id, label: c.name, sub: c.phone || c.email || '', clientId: c.id, view: 'crm' })
      }
    })

    state.jobs.forEach(j => {
      if (results.length >= 8) return
      const client = state.clients.find(c => c.id === j.clientId)
      if (j.address?.toLowerCase().includes(q) || j.type?.toLowerCase().includes(q) || j.stage?.toLowerCase().includes(q) || client?.name?.toLowerCase().includes(q)) {
        results.push({ type: 'job', id: j.id, label: `${j.type} — ${client?.name ?? 'Unknown'}`, sub: `${j.address} · ${j.stage}`, jobId: j.id, view: 'jobs' })
      }
    })

    return results
  }, [searchQ, state.clients, state.jobs])

  const handleResult = (r) => {
    setSearchQ('')
    setSearchOpen(false)
    if (!navigateTo) return
    if (r.jobId) navigateTo(r.view, { jobId: r.jobId })
    else if (r.clientId) navigateTo(r.view, { clientId: r.clientId })
    else navigateTo(r.view)
  }

  // Notifications
  const notifications = useMemo(() => {
    const items = []
    const today = new Date(); today.setHours(0, 0, 0, 0)

    state.jobs.forEach(j => {
      const client = state.clients.find(c => c.id === j.clientId)
      const name = client?.name ?? 'Unknown'

      // Overdue invoices
      if (j.invoice && isInvoiceOverdue(j.invoice) && j.invoice.status !== 'Paid') {
        const { balance } = invoiceBalance(j.invoice)
        if (balance > 0) {
          items.push({ type: 'invoice', label: `Overdue invoice — ${name}`, sub: `${formatCurrency(balance)} past due`, view: 'invoicing', jobId: j.id, color: 'red' })
        }
      }

      // Warranties expiring within 90 days
      if (j.warranty?.expirationDate) {
        const days = Math.ceil((new Date(j.warranty.expirationDate + 'T00:00') - today) / 86400000)
        if (days >= 0 && days <= 90) {
          items.push({ type: 'warranty', label: `Warranty expiring — ${name}`, sub: days === 0 ? 'Expires today' : `In ${days} days`, view: 'warranty', jobId: j.id, color: 'orange' })
        }
      }

      // Estimates needing follow-up (7+ days at Estimate Sent)
      if (j.stage === 'Estimate Sent') {
        const since = Math.ceil((today - new Date(j.updatedAt ?? j.createdAt)) / 86400000)
        if (since >= 7) {
          items.push({ type: 'followup', label: `Follow up needed — ${name}`, sub: `Estimate sent ${since}d ago`, view: 'followup', jobId: j.id, color: 'blue' })
        }
      }
    })

    // Unconfirmed appointments today or tomorrow
    ;(state.events ?? []).forEach(e => {
      const daysUntil = Math.ceil((new Date(e.date + 'T00:00') - today) / 86400000)
      if ((daysUntil === 0 || daysUntil === 1) && !e.confirmationSent) {
        items.push({ type: 'appt', label: `Unconfirmed — ${e.eventType}`, sub: daysUntil === 0 ? 'Today' : 'Tomorrow', view: 'apptconfirm', color: 'yellow' })
      }
    })

    return items
  }, [state.jobs, state.clients, state.events])

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 md:px-6 gap-3 md:gap-4 flex-shrink-0">
      {/* Hamburger — mobile only */}
      <button onClick={onMenuClick} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0">
        <Menu size={20} />
      </button>

      {/* Title */}
      <div className="flex-shrink-0 min-w-0 w-32 md:w-48">
        <h1 className="text-base font-semibold text-gray-900 truncate">{TITLES[currentView] ?? currentView}</h1>
        {selectedJob && JOB_VIEWS.includes(currentView) && (
          <div className="text-xs text-gray-500 truncate">
            {selectedJob.type} Job — {selectedClient?.name ?? 'Unknown'}
            <span className="mx-1.5 text-gray-300">·</span>
            {selectedJob.stage}
          </div>
        )}
      </div>

      {/* Global search */}
      <div ref={searchRef} className="flex-1 relative max-w-md">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQ}
            onChange={e => { setSearchQ(e.target.value); setSearchOpen(true) }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search clients, jobs, addresses…"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-8 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
          />
          {searchQ && (
            <button onClick={() => { setSearchQ(''); setSearchOpen(false) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        {searchOpen && searchResults.length > 0 && (
          <div className="absolute top-full mt-1.5 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            {searchResults.map((r, i) => (
              <button
                key={r.id + i}
                onClick={() => handleResult(r)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
              >
                {r.type === 'client'
                  ? <Users size={14} className="text-blue-500 flex-shrink-0" />
                  : <Briefcase size={14} className="text-red-500 flex-shrink-0" />
                }
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">{r.label}</div>
                  <div className="text-xs text-gray-400 truncate">{r.sub}</div>
                </div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase flex-shrink-0">{r.type}</span>
              </button>
            ))}
          </div>
        )}

        {searchOpen && searchQ.length >= 2 && searchResults.length === 0 && (
          <div className="absolute top-full mt-1.5 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 px-4 py-3 text-sm text-gray-400">
            No results for "{searchQ}"
          </div>
        )}
      </div>

      {/* Notifications */}
      <div ref={notifRef} className="relative flex-shrink-0">
        <button
          onClick={() => setNotifOpen(o => !o)}
          className={`relative p-2 rounded-lg transition-colors ${notifOpen ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
        >
          <Bell size={18} className={notifications.length > 0 ? 'text-red-500' : 'text-gray-400'} />
          {notifications.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {notifications.length}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute top-full right-0 mt-1.5 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notifications</span>
              {notifications.length > 0 && (
                <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{notifications.length} items</span>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                All caught up — nothing needs attention
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.map((n, i) => {
                  const Icon = NOTIF_ICON[n.type] ?? Bell
                  return (
                    <button
                      key={i}
                      onClick={() => { setNotifOpen(false); if (navigateTo) navigateTo(n.view, n.jobId ? { jobId: n.jobId } : {}) }}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded-lg border ${NOTIF_COLOR[n.color]}`}>
                        <Icon size={12} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">{n.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{n.sub}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pipeline total */}
      <div className="hidden md:flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 flex-shrink-0">
        <TrendingUp size={14} className="text-red-500" />
        <span className="text-xs font-semibold text-gray-700">{formatCurrency(totalPipeline)}</span>
        <span className="text-xs text-gray-400">active pipeline</span>
      </div>
    </header>
  )
}
