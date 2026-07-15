import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { Star, Copy, Check, CheckCircle, ExternalLink } from 'lucide-react'
import { getCompanySettings } from '../../utils/companySettings'

const GOOGLE_LINK_PLACEHOLDER = '[YOUR_GOOGLE_REVIEW_LINK]'

function ReviewCard({ job, client, dispatch }) {
  const [copied, setCopied] = useState(false)
  const firstName = client?.name?.split(' ')[0] ?? 'there'

  const { companyName } = getCompanySettings()
  const [script, setScript] = useState(
    `Hi ${firstName}, it was great working with you on your recent ${job.type.toLowerCase()} project at ${job.address}!

If you have a moment, we'd really appreciate it if you could leave us a Google review. It helps other homeowners find us when they need help most, and it means a lot to our small team.

Here's the link — it only takes 2 minutes:
${GOOGLE_LINK_PLACEHOLDER}

Thank you so much for trusting ${companyName}!
— ${companyName}`
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
          <span className="text-sm text-gray-400 ml-2">· {job.type} · {job.address}</span>
        </div>
        {job.survey?.stars && (
          <div className="flex gap-0.5">
            {Array.from({ length: job.survey.stars }).map((_, i) => (
              <Star key={i} size={13} className="text-yellow-400 fill-yellow-400" />
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Review Request Message</div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <ExternalLink size={11} />
            Replace placeholder with your Google Business link
          </div>
        </div>
        <textarea
          value={script}
          onChange={e => setScript(e.target.value)}
          rows={7}
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
          onClick={() => dispatch({ type: ACTIONS.MARK_REVIEW_REQUEST_SENT, payload: { jobId: job.id } })}
          className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <CheckCircle size={12} /> Mark as Sent
        </button>
      </div>
    </div>
  )
}

export default function GoogleReviewRequest() {
  const { state, dispatch } = useApp()

  const toRequest = state.jobs.filter(j =>
    j.stage === 'Closed' && !j.reviewRequest?.markedSentAt
  )

  const requested = state.jobs.filter(j =>
    j.stage === 'Closed' && j.reviewRequest?.markedSentAt
  )

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Info banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Star size={18} className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-yellow-900">How this works</div>
            <div className="text-xs text-yellow-700 mt-0.5">
              Review your message, click Approve & Copy, send it manually via text or email, then click Mark as Sent to track it.
              Replace <code className="bg-yellow-100 px-1 rounded">[YOUR_GOOGLE_REVIEW_LINK]</code> with your actual Google Business Profile review link.
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Review Requests Pending</div>
            <div className="text-3xl font-bold text-gray-900">{toRequest.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Requests Sent</div>
            <div className="text-3xl font-bold text-green-600">{requested.length}</div>
          </div>
        </div>

        {toRequest.length === 0 && requested.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl text-gray-400">
            <Star size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-gray-600">No review requests yet</p>
            <p className="text-sm mt-1">Review requests appear when jobs move to Closed stage</p>
          </div>
        ) : (
          <>
            {toRequest.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Pending Review Requests</h2>
                <div className="space-y-4">
                  {toRequest.map(job => {
                    const client = state.clients.find(c => c.id === job.clientId)
                    return <ReviewCard key={job.id} job={job} client={client} dispatch={dispatch} />
                  })}
                </div>
              </div>
            )}

            {requested.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Sent</h2>
                <div className="space-y-2">
                  {requested.map(job => {
                    const client = state.clients.find(c => c.id === job.clientId)
                    return (
                      <div key={job.id} className="bg-white border border-gray-100 rounded-xl px-5 py-3 flex items-center gap-3 opacity-70">
                        <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 font-medium">{client?.name ?? 'Unknown'}</span>
                        <span className="text-sm text-gray-400 ml-1">{job.type}</span>
                        <span className="text-xs text-gray-400 ml-auto">
                          Sent {new Date(job.reviewRequest.markedSentAt).toLocaleDateString()}
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
