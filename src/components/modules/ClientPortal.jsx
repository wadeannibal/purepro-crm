import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { computeEstimateTotals, formatCurrency } from '../../utils/helpers'
import { Globe, Copy, Check, Eye, X, CheckCircle, Clock, ChevronRight, ChevronLeft, Send, Trash2, Image, MessageSquare } from 'lucide-react'
import { getCompanySettings } from '../../utils/companySettings'

const STAGE_ORDER = ['Lead', 'Inspection', 'Estimate Sent', 'Approved', 'Remediation', 'Post-Test', 'Invoiced', 'Closed']

function genCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase()
}

function PortalPreview({ job, client, events, onClose, onApprove }) {
  const estimate = job.estimate
  const totals = estimate ? computeEstimateTotals(estimate) : null
  const stageIdx = STAGE_ORDER.indexOf(job.stage)
  const jobEvents = events.filter(e => e.jobId === job.id).sort((a, b) => a.date.localeCompare(b.date))
  const updates = (job.portal?.updates ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="bg-gray-950 px-6 py-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
              </div>
              <div>
                <span className="text-red-500 font-black text-sm">PURE</span>
                <span className="text-white font-black text-sm">PRO</span>
                <span className="text-gray-400 text-sm"> Restoration</span>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
          </div>
          <div className="mt-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Job Portal — Preview</div>
            <div className="text-white font-semibold mt-1">{client?.name ?? 'Client'}</div>
            <div className="text-gray-400 text-sm">{job.address}</div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Status */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Job Status</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {STAGE_ORDER.map((stage, i) => (
                <div key={stage} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                    ${i < stageIdx ? 'bg-green-100 text-green-700' : ''}
                    ${i === stageIdx ? 'bg-red-600 text-white' : ''}
                    ${i > stageIdx ? 'bg-gray-100 text-gray-400' : ''}`}>
                    {i < stageIdx && <CheckCircle size={11} />}
                    {i === stageIdx && <Clock size={11} />}
                    {stage}
                  </div>
                  {i < STAGE_ORDER.length - 1 && <ChevronRight size={12} className="text-gray-300" />}
                </div>
              ))}
            </div>
          </div>

          {/* Updates */}
          {updates.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Updates from {getCompanySettings().companyName}</h3>
              <div className="space-y-3">
                {updates.map(u => (
                  <div key={u.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                    <div>
                      <p className="text-sm text-gray-800">{u.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appointments */}
          {jobEvents.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Scheduled Appointments</h3>
              <div className="space-y-2">
                {jobEvents.map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">{ev.eventType}</span>
                    <span className="text-gray-500">
                      {new Date(ev.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {ev.startTime && ` at ${ev.startTime}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimate */}
          {estimate && totals && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Estimate</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${job.portal?.estimateApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {job.portal?.estimateApproved ? 'Approved' : 'Pending'}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                {estimate.sqftItems?.map(i => <div key={i.id} className="flex justify-between text-gray-700"><span>{i.description}</span><span>{formatCurrency(i.sqft * i.ratePerSqft)}</span></div>)}
                {estimate.laborItems?.map(i => <div key={i.id} className="flex justify-between text-gray-700"><span>{i.trade}</span><span>{formatCurrency(i.hours * i.ratePerHour)}</span></div>)}
                {estimate.equipmentItems?.map(i => <div key={i.id} className="flex justify-between text-gray-700"><span>{i.name}</span><span>{formatCurrency(i.qty * i.unitPrice)}</span></div>)}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between font-bold text-gray-900">
                <span>Total</span><span>{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ClientPortal({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()
  const [copied, setCopied] = useState(false)
  const [preview, setPreview] = useState(false)
  const [updateText, setUpdateText] = useState('')
  const [posting, setPosting] = useState(false)

  const job = state.jobs.find(j => j.id === selectedJobId) ?? state.jobs[0] ?? null
  const client = job ? state.clients.find(c => c.id === job.clientId) : null
  const events = state.events ?? []

  const portal = job?.portal ?? null
  const portalUrl = portal?.code ? `${window.location.origin}/portal/${portal.code}` : null
  const updates = (portal?.updates ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const showcaseCount = (job?.photos ?? []).filter(p => p.isShowcase).length

  const savePortal = (updatedPortal) => {
    dispatch({ type: ACTIONS.SAVE_PORTAL, payload: { jobId: job.id, portal: updatedPortal } })
  }

  const generate = () => {
    if (!job) return
    savePortal({ code: genCode(), enabled: true, createdAt: new Date().toISOString(), updates: [] })
  }

  const revoke = () => {
    if (!job || !window.confirm('Disable this portal? The link will stop working for the client, but all data stays saved.')) return
    savePortal({ ...portal, enabled: false })
  }

  const reEnable = () => {
    if (!job) return
    savePortal({ ...portal, enabled: true })
  }

  const copyLink = async () => {
    if (!portalUrl) return
    try { await navigator.clipboard.writeText(portalUrl) } catch {
      const el = document.createElement('textarea'); el.value = portalUrl
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const postUpdate = () => {
    if (!updateText.trim() || !portal) return
    setPosting(true)
    const newUpdate = { id: crypto.randomUUID(), text: updateText.trim(), createdAt: new Date().toISOString() }
    savePortal({ ...portal, updates: [...(portal.updates ?? []), newUpdate] })
    setUpdateText('')
    setPosting(false)
  }

  const deleteUpdate = (id) => {
    if (!portal) return
    savePortal({ ...portal, updates: (portal.updates ?? []).filter(u => u.id !== id) })
  }

  const approveEstimate = () => {
    if (!job) return
    dispatch({ type: ACTIONS.CLIENT_APPROVE_ESTIMATE, payload: { jobId: job.id } })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-5">
        {selectedJobId && navigateTo && (
          <button onClick={() => navigateTo('jobs', { jobId: selectedJobId })} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors">
            <ChevronLeft size={14} /> Back to Job
          </button>
        )}

        {/* Job selector */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Select Job</label>
          {state.jobs.length === 0 ? (
            <p className="text-sm text-gray-400">No jobs found.</p>
          ) : (
            <select
              value={job?.id ?? ''}
              onChange={e => setSelectedJobId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {state.jobs.map(j => {
                const c = state.clients.find(cl => cl.id === j.clientId)
                return <option key={j.id} value={j.id}>{j.type} — {c?.name ?? 'Unknown'} ({j.stage})</option>
              })}
            </select>
          )}
        </div>

        {job && (
          <>
            {/* Portal link */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Globe size={17} className="text-blue-500" /> Client Portal
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">{client?.name} — {job.type}</p>
                </div>
                {portal?.enabled && (
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">Active</span>
                )}
              </div>

              {!portal?.code ? (
                <div className="text-center py-8">
                  <Globe size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-600 mb-1 font-medium">No portal generated yet</p>
                  <p className="text-xs text-gray-400 mb-5">Share a unique link with your client to show job status, estimates, photos, and updates</p>
                  <button onClick={generate} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
                    Generate Client Portal
                  </button>
                </div>
              ) : !portal?.enabled ? (
                <div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-yellow-800 mb-1">Portal is disabled</p>
                    <p className="text-xs text-yellow-700">The client link is inactive. All updates, photos, and estimate data are still saved — nothing was deleted.</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Portal Link (inactive)</div>
                    <div className="text-sm text-gray-400 font-mono break-all">{portalUrl}</div>
                  </div>
                  <button onClick={reEnable} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                    <Globe size={14} /> Re-enable Portal
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Portal Link</div>
                    <div className="text-sm text-gray-700 font-mono break-all">{portalUrl}</div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button onClick={copyLink}
                      className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-colors
                        ${copied ? 'bg-green-600 text-white' : 'bg-gray-900 hover:bg-gray-700 text-white'}`}>
                      {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
                    </button>
                    <button onClick={() => setPreview(true)}
                      className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                      <Eye size={14} /> Preview
                    </button>
                    {portal?.enabled && (
                      <button onClick={revoke}
                        className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium px-3 py-2 rounded-xl hover:bg-red-50 transition-colors ml-auto">
                        Revoke Access
                      </button>
                    )}
                  </div>

                  {portal?.estimateApproved && (
                    <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl text-sm">
                      <CheckCircle size={16} />
                      <span>Client approved the estimate via portal</span>
                      {portal.approvedAt && (
                        <span className="text-green-500 text-xs ml-auto">{new Date(portal.approvedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Post updates — only shown when portal is active */}
            {portal?.code && portal?.enabled && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-500" />
                  <h3 className="font-bold text-gray-900">Post Update to Client</h3>
                </div>
                <div className="space-y-2">
                  <textarea
                    value={updateText}
                    onChange={e => setUpdateText(e.target.value)}
                    placeholder="e.g. Air scrubbers are in place and running. We'll check readings in 48 hours."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={postUpdate}
                    disabled={!updateText.trim() || posting}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
                  >
                    <Send size={13} /> Post Update
                  </button>
                </div>

                {/* Posted updates */}
                {updates.length > 0 && (
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Posted Updates</div>
                    {updates.map(u => (
                      <div key={u.id} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">{u.text}</p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <button onClick={() => deleteUpdate(u.id)} className="text-gray-300 hover:text-red-500 flex-shrink-0 mt-0.5 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Showcase photos info */}
            {portal?.code && (
              <div className={`rounded-2xl border p-5 ${showcaseCount > 0 ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Image size={16} className={showcaseCount > 0 ? 'text-blue-500' : 'text-gray-400'} />
                  <h3 className="font-bold text-gray-900 text-sm">Photo Gallery</h3>
                  {showcaseCount > 0 && (
                    <span className="ml-auto text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {showcaseCount} visible to client
                    </span>
                  )}
                </div>
                {showcaseCount === 0 ? (
                  <p className="text-xs text-gray-500">
                    No photos are visible to the client yet. In the <strong>Job Photos</strong> section, mark photos as "Showcase" to display them here.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    {showcaseCount} photo{showcaseCount !== 1 ? 's' : ''} marked as showcase will appear in the client portal. Manage them in the <strong>Job Photos</strong> section.
                  </p>
                )}
              </div>
            )}

            {/* What client sees summary */}
            {portal?.code && portal?.enabled && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-blue-900 mb-3">What the client sees</h3>
                <ul className="space-y-1.5 text-sm text-blue-800">
                  <li className="flex items-center gap-2"><Check size={13} className="text-blue-500 flex-shrink-0" /> Job status and current stage</li>
                  <li className="flex items-center gap-2"><Check size={13} className="text-blue-500 flex-shrink-0" /> Scheduled appointments</li>
                  {updates.length > 0 && <li className="flex items-center gap-2"><Check size={13} className="text-blue-500 flex-shrink-0" /> {updates.length} update{updates.length !== 1 ? 's' : ''} from you</li>}
                  {showcaseCount > 0 && <li className="flex items-center gap-2"><Check size={13} className="text-blue-500 flex-shrink-0" /> {showcaseCount} showcase photo{showcaseCount !== 1 ? 's' : ''}</li>}
                  {job.estimate && <li className="flex items-center gap-2"><Check size={13} className="text-blue-500 flex-shrink-0" /> Estimate with one-click approval</li>}
                  <li className="flex items-center gap-2"><Check size={13} className="text-blue-500 flex-shrink-0" /> Job timeline</li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {preview && job && (
        <PortalPreview
          job={job}
          client={client}
          events={events}
          onClose={() => setPreview(false)}
          onApprove={() => { approveEstimate(); setPreview(false) }}
        />
      )}
    </div>
  )
}
