import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { RefreshCw, Copy, Check, CheckCircle, Clock } from 'lucide-react'

const MS_PER_DAY = 86400000
const MS_PER_YEAR = 365 * MS_PER_DAY

function daysOverdue(job) {
  const closeDate = new Date(job.updatedAt ?? job.createdAt)
  const dueDate = new Date(closeDate.getTime() + MS_PER_YEAR)
  return Math.floor((Date.now() - dueDate.getTime()) / MS_PER_DAY)
}

function CheckInCard({ job, client, dispatch }) {
  const [copied, setCopied] = useState(false)
  const firstName = client?.name?.split(' ')[0] ?? 'there'
  const over = daysOverdue(job)

  const [script, setScript] = useState(
    `Hi ${firstName}, it's been about a year since PurePro Restoration completed your ${job.type.toLowerCase()} project at ${job.address}. We just wanted to check in and make sure everything is still looking great!

If you've noticed anything unusual — moisture, odors, or any concerns at all — please don't hesitate to reach out. Many issues are easiest and most affordable to address when caught early.

We also wanted to let you know we're still here for anything you need. If you have friends, neighbors, or family who ever run into water, mold, or fire damage, we'd love to help them too.

Thanks again for trusting us with your home!
— PurePro Restoration`
  )

  const copyScript = async () => {
    try { await navigator.clipboard.writeText(script) } catch {
      const el = document.createElement('textarea')
      el.value = script; document.body.appendChild(el); el.select()
      document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const markSent = () => {
    dispatch({ type: ACTIONS.MARK_ANNUAL_CHECKIN_SENT, payload: { jobId: job.id } })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold text-gray-900">{client?.name ?? 'Unknown'}</div>
          <div className="text-sm text-gray-400">{job.type} · {job.address}</div>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <div className={`text-xs font-semibold px-2.5 py-1 rounded-full
            ${over > 30 ? 'bg-red-100 text-red-700' : over > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
            {over > 0 ? `${over}d overdue` : 'Due now'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Closed {new Date(job.updatedAt ?? job.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Re-Engagement Message</div>
        <textarea
          value={script}
          onChange={e => setScript(e.target.value)}
          rows={8}
          className="w-full bg-transparent text-sm text-gray-700 leading-relaxed focus:outline-none resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={copyScript}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
            ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Approve & Copy</>}
        </button>
        <button
          onClick={markSent}
          className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <CheckCircle size={12} /> Mark as Sent
        </button>
      </div>
    </div>
  )
}

export default function AnnualCheckIn() {
  const { state, dispatch } = useApp()

  const now = Date.now()

  const duePending = state.jobs.filter(j =>
    j.stage === 'Closed' &&
    !j.annualCheckIn?.markedSentAt &&
    (now - new Date(j.updatedAt ?? j.createdAt).getTime()) >= MS_PER_YEAR
  ).sort((a, b) => daysOverdue(b) - daysOverdue(a))

  const sent = state.jobs.filter(j =>
    j.stage === 'Closed' &&
    j.annualCheckIn?.markedSentAt
  )

  const upcoming = state.jobs.filter(j => {
    if (j.stage !== 'Closed') return false
    if (j.annualCheckIn?.markedSentAt) return false
    const closeMs = new Date(j.updatedAt ?? j.createdAt).getTime()
    const daysToCheckIn = Math.ceil((closeMs + MS_PER_YEAR - now) / MS_PER_DAY)
    return daysToCheckIn > 0 && daysToCheckIn <= 60
  })

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Due Now</div>
            <div className="text-3xl font-bold text-red-600">{duePending.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Due in 60 Days</div>
            <div className="text-3xl font-bold text-yellow-600">{upcoming.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Check-Ins Sent</div>
            <div className="text-3xl font-bold text-green-600">{sent.length}</div>
          </div>
        </div>

        {duePending.length === 0 && upcoming.length === 0 && sent.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl text-gray-400">
            <RefreshCw size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-gray-600">No annual check-ins due yet</p>
            <p className="text-sm mt-1 max-w-xs mx-auto">
              This dashboard shows closed jobs that are approaching or past their 12-month mark.
            </p>
          </div>
        ) : (
          <>
            {duePending.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock size={13} /> Action Required
                </h2>
                <div className="space-y-4">
                  {duePending.map(job => {
                    const client = state.clients.find(c => c.id === job.clientId)
                    return <CheckInCard key={job.id} job={job} client={client} dispatch={dispatch} />
                  })}
                </div>
              </div>
            )}

            {upcoming.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-3">Coming Up (within 60 days)</h2>
                <div className="space-y-2">
                  {upcoming.map(job => {
                    const client = state.clients.find(c => c.id === job.clientId)
                    const closeMs = new Date(job.updatedAt ?? job.createdAt).getTime()
                    const days = Math.ceil((closeMs + MS_PER_YEAR - Date.now()) / MS_PER_DAY)
                    return (
                      <div key={job.id} className="bg-white border border-gray-100 rounded-xl px-5 py-3 flex items-center gap-3">
                        <Clock size={15} className="text-yellow-500 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">{client?.name ?? 'Unknown'}</span>
                          <span className="text-sm text-gray-400 ml-2">{job.type}</span>
                        </div>
                        <span className="text-xs text-yellow-600 font-semibold whitespace-nowrap">In {days} days</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {sent.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sent</h2>
                <div className="space-y-2">
                  {sent.map(job => {
                    const client = state.clients.find(c => c.id === job.clientId)
                    return (
                      <div key={job.id} className="bg-white border border-gray-100 rounded-xl px-5 py-3 flex items-center gap-3 opacity-60">
                        <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 font-medium">{client?.name ?? 'Unknown'}</span>
                        <span className="text-sm text-gray-400">{job.type}</span>
                        <span className="text-xs text-gray-400 ml-auto">
                          Sent {new Date(job.annualCheckIn.markedSentAt).toLocaleDateString()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
