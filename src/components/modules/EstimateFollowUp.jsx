import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { formatCurrency, computeEstimateTotals } from '../../utils/helpers'
import { Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react'

const FOLLOW_UP_SCRIPTS = {
  first: `Hi [Name], just following up on the estimate we sent over. I wanted to make sure you received it and answer any questions. We're ready to get started as soon as you're ready — just say the word!`,
  second: `Hi [Name], I know you're busy — just a quick check-in on the estimate for the [type] work. We have availability this week and want to make sure we can get your property taken care of before anything gets worse. Happy to adjust the scope or walk you through it on a call.`,
  final: `Hi [Name], last follow-up from us on the estimate. If now isn't the right time, no worries — just let us know so we can close this out. If you do want to move forward, we're still here and ready to help.`,
}

function getScript(days) {
  if (days >= 7) return { label: 'Final Follow-Up', text: FOLLOW_UP_SCRIPTS.final, color: 'text-red-700 bg-red-50 border-red-200' }
  if (days >= 3) return { label: 'Second Follow-Up', text: FOLLOW_UP_SCRIPTS.second, color: 'text-yellow-800 bg-yellow-50 border-yellow-200' }
  return { label: 'First Follow-Up', text: FOLLOW_UP_SCRIPTS.first, color: 'text-blue-700 bg-blue-50 border-blue-200' }
}

function EstimateCard({ job, client, daysElapsed, totals, onApprove, onDecline }) {
  const [showScript, setShowScript] = useState(false)
  const script = getScript(daysElapsed)
  const firstName = client?.name?.split(' ')[0] ?? 'there'
  const personalized = script.text.replace('[Name]', firstName).replace('[type]', job.type.toLowerCase())

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">{client?.name ?? 'Unknown'}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{job.type}</span>
          </div>
          <div className="text-sm text-gray-500">
            Sent {daysElapsed >= 1 ? `${Math.floor(daysElapsed)} day${Math.floor(daysElapsed) !== 1 ? 's' : ''}` : `${Math.round(daysElapsed * 24)} hours`} ago
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Estimate Value</div>
          <div className="text-lg font-bold text-gray-900">{formatCurrency(totals.grandTotal)}</div>
        </div>
      </div>

      <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border mb-4 ${script.color}`}>
        <Clock size={13} />
        {script.label} Recommended
      </div>

      {showScript && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 mb-4 leading-relaxed italic">
          "{personalized}"
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button onClick={onApprove} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
          <CheckCircle size={13} /> Mark Approved
        </button>
        <button onClick={onDecline} className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
          <XCircle size={13} /> Mark Declined
        </button>
        <button onClick={() => setShowScript(s => !s)} className="ml-auto flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
          <MessageSquare size={13} /> {showScript ? 'Hide' : 'View'} Script
        </button>
      </div>
    </div>
  )
}

export default function EstimateFollowUp({ navigateTo }) {
  const { state, dispatch } = useApp()
  const now = new Date()

  const staleEstimates = state.jobs
    .filter(j => j.estimate?.status === 'Sent' && j.estimate?.sentAt)
    .map(j => {
      const client = state.clients.find(c => c.id === j.clientId)
      const daysElapsed = (now - new Date(j.estimate.sentAt)) / 86400000
      const totals = computeEstimateTotals(j.estimate)
      return { job: j, client, daysElapsed, totals }
    })
    .sort((a, b) => b.daysElapsed - a.daysElapsed)

  const urgent = staleEstimates.filter(x => x.daysElapsed >= 2)
  const recent = staleEstimates.filter(x => x.daysElapsed < 2)

  const markApproved = (job) =>
    dispatch({ type: ACTIONS.UPDATE_ESTIMATE_STATUS, payload: { jobId: job.id, status: 'Approved' } })

  const markDeclined = (job) =>
    dispatch({ type: ACTIONS.UPDATE_ESTIMATE_STATUS, payload: { jobId: job.id, status: 'Declined' } })

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Awaiting Response</div>
            <div className="text-3xl font-bold text-gray-900">{staleEstimates.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Needs Follow-Up</div>
            <div className="text-3xl font-bold text-red-700">{urgent.length}</div>
            <div className="text-xs text-gray-400">48+ hrs no response</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Value at Stake</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(staleEstimates.reduce((s, x) => s + x.totals.grandTotal, 0))}
            </div>
          </div>
        </div>

        {staleEstimates.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <CheckCircle size={40} className="mx-auto mb-3 text-green-400 opacity-60" />
            <p className="font-semibold text-gray-700">All caught up!</p>
            <p className="text-sm mt-1">No estimates are awaiting a response right now</p>
          </div>
        ) : (
          <>
            {urgent.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3">Needs Follow-Up (48+ hrs)</h2>
                <div className="space-y-3">
                  {urgent.map(({ job, client, daysElapsed, totals }) => (
                    <EstimateCard key={job.id} job={job} client={client} daysElapsed={daysElapsed} totals={totals} onApprove={() => markApproved(job)} onDecline={() => markDeclined(job)} />
                  ))}
                </div>
              </div>
            )}
            {recent.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Sent Recently (under 48 hrs)</h2>
                <div className="space-y-3">
                  {recent.map(({ job, client, daysElapsed, totals }) => (
                    <EstimateCard key={job.id} job={job} client={client} daysElapsed={daysElapsed} totals={totals} onApprove={() => markApproved(job)} onDecline={() => markDeclined(job)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
