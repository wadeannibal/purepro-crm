import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { formatDate } from '../../utils/helpers'
import { Zap, Copy, Check, CheckCircle, Clock, Phone, Mail } from 'lucide-react'

const UNBOOKED = ['Lead', 'Inspection', 'Estimate Sent']

function daysSince(iso) {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso)) / 86400000)
}

function getTemplate(dayCount, job, client) {
  const name = client?.name?.split(' ')[0] ?? 'there'
  if (dayCount <= 1) {
    return `Hi ${name}, this is Wade with PurePro Restoration. I wanted to quickly follow up from our conversation about the ${job.type?.toLowerCase() ?? 'moisture'} issue at ${job.address ?? 'your property'}.

I know these situations can feel overwhelming, and I want to make sure you have everything you need to make a decision. If you have any questions about the scope or process, I'm happy to walk through it with you again.

Looking forward to hearing from you!
— Wade, PurePro Restoration`
  }
  if (dayCount <= 3) {
    return `Hi ${name}, Wade here from PurePro Restoration — just circling back on the ${job.type?.toLowerCase() ?? 'remediation'} assessment at ${job.address ?? 'your property'}.

I understand you may be weighing your options, and that's completely fine. I just want to make sure the situation isn't getting worse while you decide. Mold can spread quickly if there's still an active moisture source.

If timing or budget is a concern, I'm open to discussing options. Would love to help you get this resolved.
— Wade, PurePro Restoration`
  }
  return `Hi ${name}, it's been about a week since we last spoke and I wanted to do one final check-in about the ${job.type?.toLowerCase() ?? 'remediation'} work at ${job.address ?? 'your property'}.

I don't want to be a bother — if you've moved in a different direction, I completely understand. But if you're still considering it, I'd love to earn your business and get your home protected.

Just reply or call anytime — I'm here when you're ready.
— Wade, PurePro Restoration`
}

function getBadge(days) {
  if (days === null) return { label: 'No contact', color: 'bg-gray-100 text-gray-500' }
  if (days === 0) return { label: 'Today', color: 'bg-blue-100 text-blue-700' }
  if (days <= 1) return { label: 'Day 1', color: 'bg-green-100 text-green-700' }
  if (days <= 3) return { label: 'Day 3', color: 'bg-yellow-100 text-yellow-800' }
  return { label: `Day ${days}`, color: days >= 7 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700' }
}

function FollowUpCard({ job, client, days, dispatch }) {
  const [preview, setPreview] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState(false)
  const message = getTemplate(days ?? 0, job, client)
  const badge = getBadge(days)

  const copy = async () => {
    try { await navigator.clipboard.writeText(message) } catch {
      const el = document.createElement('textarea'); el.value = message
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const markSent = () => {
    dispatch({ type: ACTIONS.UPDATE_JOB, payload: { ...job, lastContactDate: new Date().toISOString() } })
    setSent(true)
  }

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden ${days !== null && days >= 7 ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm">{client?.name ?? 'Unknown Client'}</div>
            <div className="text-xs text-gray-500 truncate">{job.address ?? '—'}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
            <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{job.stage}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          {client?.phone && <span className="flex items-center gap-1"><Phone size={10} />{client.phone}</span>}
          {client?.email && <span className="flex items-center gap-1"><Mail size={10} />{client.email}</span>}
          <span className="flex items-center gap-1"><Clock size={10} />{days !== null ? `${days} day${days !== 1 ? 's' : ''} since contact` : 'Never contacted'}</span>
        </div>
      </div>

      {preview ? (
        <div className="border-t border-gray-100 px-5 pb-4">
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 my-3">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{message}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={copy}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
              {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Approve & Copy</>}
            </button>
            {!sent ? (
              <button onClick={markSent}
                className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                <CheckCircle size={12} /> Mark as Sent
              </button>
            ) : (
              <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                <CheckCircle size={12} /> Sent — contact date updated
              </span>
            )}
            <button onClick={() => setPreview(false)}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
              Collapse
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-2">
          <button onClick={() => setPreview(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
            <Zap size={11} /> Generate Follow-Up
          </button>
          <span className="text-[11px] text-gray-400">
            {days === null ? 'First contact template' : days <= 1 ? 'Day 1 template' : days <= 3 ? 'Day 3 template' : 'Day 7 template'}
          </span>
        </div>
      )}
    </div>
  )
}

export default function FollowUpEngine({ navigateTo }) {
  const { state, dispatch } = useApp()
  const [sortBy, setSortBy] = useState('days')

  const jobs = state.jobs ?? []
  const clients = state.clients ?? []

  const unbookedLeads = useMemo(() => {
    return jobs
      .filter(j => UNBOOKED.includes(j.stage))
      .map(j => {
        const client = clients.find(c => c.id === j.clientId)
        const days = daysSince(j.lastContactDate ?? j.createdAt)
        return { job: j, client, days }
      })
      .sort((a, b) => {
        if (sortBy === 'days') return (b.days ?? -1) - (a.days ?? -1)
        return (a.client?.name ?? '').localeCompare(b.client?.name ?? '')
      })
  }, [jobs, clients, sortBy])

  const overdue = unbookedLeads.filter(l => l.days !== null && l.days >= 3)
  const fresh = unbookedLeads.filter(l => l.days === null || l.days < 3)

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Zap size={18} className="text-red-500" /> Follow-Up Engine
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Unbooked leads sorted by days since last contact. Generates day 1, 3, and 7 templates.
            </p>
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
            <option value="days">Sort: Oldest First</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-0.5">Unbooked Leads</div>
            <div className="text-xl font-bold text-gray-900">{unbookedLeads.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-0.5">Need Follow-Up (3+ days)</div>
            <div className="text-xl font-bold text-orange-600">{overdue.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-0.5">Fresh / Recent</div>
            <div className="text-xl font-bold text-green-700">{fresh.length}</div>
          </div>
        </div>

        {/* 5-step instructions */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-blue-800 uppercase mb-2">How to use</p>
          <div className="text-xs text-blue-700 space-y-1">
            <p>1. Click <strong>Generate Follow-Up</strong> — message preview appears</p>
            <p>2. Review and customize the message text</p>
            <p>3. Click <strong>Approve &amp; Copy</strong> — message is copied to clipboard</p>
            <p>4. Send manually via your own phone, Gmail, or messaging app</p>
            <p>5. Update the job's Last Contact Date in Job Records once sent</p>
          </div>
        </div>

        {unbookedLeads.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400">
            <Zap size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-gray-600">No unbooked leads</p>
            <p className="text-sm mt-1">All leads are either booked or lost. Great work!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {unbookedLeads.map(({ job, client, days }) => (
              <FollowUpCard key={job.id} job={job} client={client} days={days} dispatch={dispatch} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
