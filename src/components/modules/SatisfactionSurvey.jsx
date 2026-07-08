import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { SmilePlus, Star, Copy, Check, CheckCircle, X } from 'lucide-react'

function StarRating({ value, onChange, readonly }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <Star
            size={24}
            className={n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
          />
        </button>
      ))}
    </div>
  )
}

function SurveyModal({ job, client, onClose }) {
  const { dispatch } = useApp()
  const [stars, setStars] = useState(0)
  const [wouldRefer, setWouldRefer] = useState(null)
  const [comments, setComments] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submit = () => {
    if (stars === 0) return
    dispatch({
      type: ACTIONS.SUBMIT_SURVEY_RESPONSE,
      payload: { jobId: job.id, stars, wouldRefer, comments },
    })
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="bg-gray-950 px-6 py-5 rounded-t-2xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
              </div>
              <span className="text-white font-bold text-sm">PurePro Restoration</span>
            </div>
            <div className="text-gray-400 text-xs mt-1">Job Satisfaction Survey</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
              <p className="font-semibold text-gray-900">Thank you, {client?.name?.split(' ')[0] ?? 'there'}!</p>
              <p className="text-sm text-gray-500 mt-1">Your feedback has been recorded.</p>
              <button onClick={onClose} className="mt-5 bg-gray-900 text-white text-sm font-semibold px-5 py-2 rounded-xl">Close</button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Hi {client?.name?.split(' ')[0] ?? 'there'}, how would you rate your experience with PurePro Restoration?
                </p>
                <StarRating value={stars} onChange={setStars} />
                {stars > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    {stars === 5 ? 'Excellent!' : stars === 4 ? 'Great!' : stars === 3 ? 'Good' : stars === 2 ? 'Fair' : 'Poor'}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Would you refer us to a friend or family member?</p>
                <div className="flex gap-3">
                  {[true, false].map(val => (
                    <button
                      key={String(val)}
                      onClick={() => setWouldRefer(val)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors
                        ${wouldRefer === val
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Any additional comments?</p>
                <textarea
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  placeholder="Optional — let us know how we did"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <button
                onClick={submit}
                disabled={stars === 0}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Submit Feedback
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function OutboundCard({ job, client }) {
  const { dispatch } = useApp()
  const [copied, setCopied] = useState(false)
  const [showSurvey, setShowSurvey] = useState(false)

  const firstName = client?.name?.split(' ')[0] ?? 'there'
  const script = `Hi ${firstName}, thank you so much for trusting PurePro Restoration with your ${job.type.toLowerCase()} project. We'd love to hear your feedback — it only takes a minute and helps us keep improving.

Could you fill out a quick satisfaction survey? Just reply "yes" and I'll walk you through it, or you can let me know how it went right here.

Thank you again — it was great working with you!
— PurePro Restoration`

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
    dispatch({ type: ACTIONS.MARK_SURVEY_SENT, payload: { jobId: job.id } })
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="font-semibold text-gray-900">{client?.name ?? 'Unknown'}</span>
            <span className="text-gray-400 text-sm ml-2">· {job.type} job · {job.address}</span>
          </div>
          <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2.5 py-1 rounded-full">Closed</span>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Survey Request Message</div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{script}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
          <button
            onClick={() => setShowSurvey(true)}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ml-auto"
          >
            <SmilePlus size={12} /> Fill In Survey Results
          </button>
        </div>
      </div>
      {showSurvey && <SurveyModal job={job} client={client} onClose={() => setShowSurvey(false)} />}
    </>
  )
}

export default function SatisfactionSurvey() {
  const { state } = useApp()

  const closedJobs = state.jobs.filter(j => j.stage === 'Closed')
  const toSend = closedJobs.filter(j => !j.survey?.markedSentAt)
  const responses = closedJobs.filter(j => j.survey?.completedAt)
  const avgStars = responses.length
    ? (responses.reduce((s, j) => s + (j.survey.stars ?? 0), 0) / responses.length).toFixed(1)
    : null

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">To Send</div>
            <div className="text-3xl font-bold text-gray-900">{toSend.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Responses</div>
            <div className="text-3xl font-bold text-gray-900">{responses.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Avg Rating</div>
            <div className="flex items-center gap-1.5">
              <div className="text-3xl font-bold text-yellow-500">{avgStars ?? '—'}</div>
              {avgStars && <Star size={18} className="text-yellow-400 fill-yellow-400 mt-0.5" />}
            </div>
          </div>
        </div>

        {/* To send */}
        {toSend.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ready to Send</h2>
            <div className="space-y-4">
              {toSend.map(job => {
                const client = state.clients.find(c => c.id === job.clientId)
                return <OutboundCard key={job.id} job={job} client={client} />
              })}
            </div>
          </div>
        )}

        {/* Responses */}
        {responses.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Survey Responses</h2>
            <div className="space-y-3">
              {responses.map(job => {
                const client = state.clients.find(c => c.id === job.clientId)
                return (
                  <div key={job.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">{client?.name ?? 'Unknown'}</div>
                        <div className="text-xs text-gray-400">{job.type} · {job.address}</div>
                      </div>
                      <StarRating value={job.survey.stars ?? 0} readonly />
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`font-medium ${job.survey.wouldRefer ? 'text-green-600' : 'text-gray-400'}`}>
                        {job.survey.wouldRefer === true ? '✓ Would refer' : job.survey.wouldRefer === false ? '✗ Would not refer' : ''}
                      </span>
                    </div>
                    {job.survey.comments && (
                      <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 italic">
                        "{job.survey.comments}"
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {closedJobs.length === 0 && (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl text-gray-400">
            <SmilePlus size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-gray-600">No closed jobs yet</p>
            <p className="text-sm mt-1">Survey requests appear when jobs move to Closed stage</p>
          </div>
        )}
      </div>
    </div>
  )
}
