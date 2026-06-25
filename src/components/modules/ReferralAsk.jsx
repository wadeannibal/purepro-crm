import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { UserPlus, Star, Copy, Check, CheckCircle } from 'lucide-react'

export default function ReferralAsk() {
  const { state, dispatch } = useApp()

  const eligible = state.jobs.filter(j =>
    j.stage === 'Closed' &&
    (j.survey?.stars ?? 0) >= 4 &&
    !j.referralAsk?.markedSentAt
  )

  const sent = state.jobs.filter(j =>
    j.stage === 'Closed' &&
    (j.survey?.stars ?? 0) >= 4 &&
    j.referralAsk?.markedSentAt
  )

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Ready to Ask</div>
            <div className="text-3xl font-bold text-gray-900">{eligible.length}</div>
            <div className="text-xs text-gray-400 mt-1">4–5 star jobs, referral not yet sent</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Referrals Requested</div>
            <div className="text-3xl font-bold text-green-600">{sent.length}</div>
          </div>
        </div>

        {eligible.length === 0 && sent.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl text-gray-400">
            <UserPlus size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-gray-600">No referral asks ready yet</p>
            <p className="text-sm mt-1 max-w-xs mx-auto">
              Referral asks appear here when a closed job has a 4 or 5 star satisfaction survey response.
            </p>
          </div>
        ) : (
          <>
            {eligible.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ready to Ask</h2>
                <div className="space-y-4">
                  {eligible.map(job => {
                    const client = state.clients.find(c => c.id === job.clientId)
                    return <ReferralCard key={job.id} job={job} client={client} dispatch={dispatch} />
                  })}
                </div>
              </div>
            )}
            {sent.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Referral Ask Sent</h2>
                <div className="space-y-2">
                  {sent.map(job => {
                    const client = state.clients.find(c => c.id === job.clientId)
                    return (
                      <div key={job.id} className="bg-white border border-gray-100 rounded-xl px-5 py-3 flex items-center gap-3 opacity-70">
                        <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 font-medium">{client?.name ?? 'Unknown'}</span>
                        <div className="flex gap-0.5 ml-1">
                          {Array.from({ length: job.survey?.stars ?? 0 }).map((_, i) => (
                            <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400 ml-auto">
                          Sent {new Date(job.referralAsk.markedSentAt).toLocaleDateString()}
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

function ReferralCard({ job, client, dispatch }) {
  const [copied, setCopied] = useState(false)
  const firstName = client?.name?.split(' ')[0] ?? 'there'
  const stars = job.survey?.stars ?? 0

  const [script, setScript] = useState(
    `Hi ${firstName}, we really appreciate your kind feedback${stars === 5 ? ' and the 5-star review' : ''}! We're so glad we could help with your ${job.type.toLowerCase()} project.

If you know anyone — a neighbor, friend, or family member — who ever needs water, mold, or fire restoration work, we'd be so grateful if you kept us in mind. A personal referral means everything to a small business like ours.

Thank you again for trusting PurePro Restoration!
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

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="font-semibold text-gray-900">{client?.name ?? 'Unknown'}</span>
          <span className="text-gray-400 text-sm ml-2">· {job.type}</span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: stars }).map((_, i) => (
            <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
        <div className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-2">Referral Ask Message</div>
        <textarea
          value={script}
          onChange={e => setScript(e.target.value)}
          rows={6}
          className="w-full bg-transparent text-sm text-yellow-900 leading-relaxed focus:outline-none resize-none"
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
          onClick={() => dispatch({ type: ACTIONS.MARK_REFERRAL_SENT, payload: { jobId: job.id } })}
          className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <CheckCircle size={12} /> Mark as Sent
        </button>
      </div>
    </div>
  )
}
