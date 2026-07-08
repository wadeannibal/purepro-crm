import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { Award, Plus, CheckCircle, AlertTriangle, Clock, Trash2, ChevronLeft } from 'lucide-react'

const PERIODS = [
  { label: '1 Year', months: 12 },
  { label: '2 Years', months: 24 },
  { label: '6 Months', months: 6 },
  { label: 'Custom', months: null },
]

const addMonths = (dateStr, months) => {
  const d = new Date(dateStr + 'T12:00')
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

const daysUntil = (dateStr) => {
  const today = new Date(); today.setHours(0,0,0,0)
  return Math.ceil((new Date(dateStr + 'T00:00') - today) / 86400000)
}

function WarrantyCard({ job, client, onSelect, active }) {
  const w = job.warranty
  if (!w) return null
  const days = daysUntil(w.expirationDate)
  const expired = days < 0
  const expiringSoon = !expired && days <= 90
  const openClaims = (w.claims ?? []).filter(c => c.status === 'open').length

  return (
    <div
      onClick={onSelect}
      className={`bg-white border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md
        ${active ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'}
        ${expired ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-semibold text-gray-900">{client?.name ?? 'Unknown'}</div>
          <div className="text-xs text-gray-400">{job.type} · {job.address}</div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0
          ${expired ? 'bg-gray-100 text-gray-500' :
            expiringSoon ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'}`}>
          {expired ? 'Expired' : expiringSoon ? `${days}d left` : 'Active'}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
        <span>Expires {new Date(w.expirationDate + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        <span>{w.label}</span>
        {openClaims > 0 && (
          <span className="text-orange-600 font-semibold flex items-center gap-1">
            <AlertTriangle size={11} /> {openClaims} open claim{openClaims > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}

export default function WarrantyTracking({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()
  const [view, setView] = useState('dashboard')
  const [claimForm, setClaimForm] = useState('')
  const [warranty, setWarranty] = useState({ period: '1 Year', customMonths: '', startDate: new Date().toISOString().slice(0, 10) })
  const [showAdd, setShowAdd] = useState(false)

  const job = state.jobs.find(j => j.id === selectedJobId) ?? null
  const client = job ? state.clients.find(c => c.id === job.clientId) : null

  const jobsWithWarranty = state.jobs.filter(j => j.warranty?.expirationDate)
  const activeWarranties = jobsWithWarranty.filter(j => daysUntil(j.warranty.expirationDate) >= 0)
  const expiredWarranties = jobsWithWarranty.filter(j => daysUntil(j.warranty.expirationDate) < 0)

  const saveWarranty = () => {
    if (!job) return
    const period = PERIODS.find(p => p.label === warranty.period)
    const months = period?.months ?? parseInt(warranty.customMonths) ?? 12
    const expDate = addMonths(warranty.startDate, months)
    dispatch({
      type: ACTIONS.SAVE_WARRANTY,
      payload: {
        jobId: job.id,
        warranty: { label: warranty.period === 'Custom' ? `${warranty.customMonths} months` : warranty.period, startDate: warranty.startDate, expirationDate: expDate, periodMonths: months },
      },
    })
    setShowAdd(false)
  }

  const addClaim = () => {
    if (!job || !claimForm.trim()) return
    dispatch({ type: ACTIONS.ADD_WARRANTY_CLAIM, payload: { jobId: job.id, claim: { description: claimForm.trim() } } })
    setClaimForm('')
  }

  const resolveClaim = (claimId) => {
    dispatch({ type: ACTIONS.RESOLVE_WARRANTY_CLAIM, payload: { jobId: job.id, claimId } })
  }

  const warrantyClaims = job?.warranty?.claims ?? []

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {selectedJobId && navigateTo && (
          <button onClick={() => navigateTo('jobs', { jobId: selectedJobId })} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors">
            <ChevronLeft size={14} /> Back to Job
          </button>
        )}
        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setView('dashboard')}
            className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${view === 'dashboard' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Dashboard
          </button>
          <button onClick={() => setView('job')}
            className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${view === 'job' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Per Job
          </button>
        </div>

        {view === 'dashboard' ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="text-xs text-gray-500 mb-1">Active Warranties</div>
                <div className="text-3xl font-bold text-green-600">{activeWarranties.length}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="text-xs text-gray-500 mb-1">Expiring in 90 Days</div>
                <div className="text-3xl font-bold text-yellow-600">
                  {activeWarranties.filter(j => daysUntil(j.warranty.expirationDate) <= 90).length}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="text-xs text-gray-500 mb-1">Open Claims</div>
                <div className="text-3xl font-bold text-orange-600">
                  {jobsWithWarranty.reduce((s, j) => s + (j.warranty?.claims ?? []).filter(c => c.status === 'open').length, 0)}
                </div>
              </div>
            </div>

            {activeWarranties.length === 0 && expiredWarranties.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl text-gray-400">
                <Award size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-gray-600">No warranties tracked yet</p>
                <p className="text-sm mt-1">Switch to "Per Job" to add warranty info to a job</p>
              </div>
            ) : (
              <>
                {activeWarranties.length > 0 && (
                  <div>
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Active Warranties</h2>
                    <div className="space-y-3">
                      {activeWarranties
                        .sort((a, b) => daysUntil(a.warranty.expirationDate) - daysUntil(b.warranty.expirationDate))
                        .map(j => {
                          const c = state.clients.find(cl => cl.id === j.clientId)
                          return (
                            <WarrantyCard
                              key={j.id} job={j} client={c}
                              active={j.id === selectedJobId}
                              onSelect={() => { setSelectedJobId(j.id); setView('job') }}
                            />
                          )
                        })}
                    </div>
                  </div>
                )}
                {expiredWarranties.length > 0 && (
                  <div>
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Expired</h2>
                    <div className="space-y-3">
                      {expiredWarranties.map(j => {
                        const c = state.clients.find(cl => cl.id === j.clientId)
                        return (
                          <WarrantyCard
                            key={j.id} job={j} client={c}
                            active={j.id === selectedJobId}
                            onSelect={() => { setSelectedJobId(j.id); setView('job') }}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {/* Job selector */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Select Job</label>
              <select
                value={job?.id ?? ''}
                onChange={e => setSelectedJobId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select a job…</option>
                {state.jobs.map(j => {
                  const c = state.clients.find(cl => cl.id === j.clientId)
                  return <option key={j.id} value={j.id}>{j.type} — {c?.name ?? 'Unknown'} ({j.stage})</option>
                })}
              </select>
            </div>

            {job && (
              <>
                {/* Warranty info */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Award size={16} className="text-gray-500" /> Warranty
                    </h3>
                    {!job.warranty && (
                      <button onClick={() => setShowAdd(s => !s)}
                        className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        <Plus size={12} /> Set Warranty
                      </button>
                    )}
                  </div>

                  {showAdd && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Warranty Period</label>
                          <select value={warranty.period} onChange={e => setWarranty(w => ({ ...w, period: e.target.value }))}
                            className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                            {PERIODS.map(p => <option key={p.label}>{p.label}</option>)}
                          </select>
                        </div>
                        {warranty.period === 'Custom' && (
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Months</label>
                            <input type="number" min="1" value={warranty.customMonths}
                              onChange={e => setWarranty(w => ({ ...w, customMonths: e.target.value }))}
                              className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                          </div>
                        )}
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Warranty Start Date</label>
                          <input type="date" value={warranty.startDate}
                            onChange={e => setWarranty(w => ({ ...w, startDate: e.target.value }))}
                            className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveWarranty} className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                          Save Warranty
                        </button>
                        <button onClick={() => setShowAdd(false)} className="border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {job.warranty ? (
                    <div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-400">Period</div>
                          <div className="font-semibold text-gray-900 mt-0.5">{job.warranty.label}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">Start</div>
                          <div className="font-semibold text-gray-900 mt-0.5">
                            {new Date(job.warranty.startDate + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">Expires</div>
                          <div className={`font-semibold mt-0.5 ${daysUntil(job.warranty.expirationDate) < 0 ? 'text-red-600' : daysUntil(job.warranty.expirationDate) <= 90 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {new Date(job.warranty.expirationDate + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {daysUntil(job.warranty.expirationDate) >= 0 && (
                              <span className="text-xs font-normal text-gray-400 ml-1">({daysUntil(job.warranty.expirationDate)}d)</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setShowAdd(true)} className="text-xs text-gray-400 hover:text-gray-600 underline">
                        Update warranty
                      </button>
                    </div>
                  ) : !showAdd && (
                    <p className="text-sm text-gray-400">No warranty set. Click "Set Warranty" to add warranty tracking.</p>
                  )}
                </div>

                {/* Claims */}
                {job.warranty && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">Warranty Claims</h3>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder="Describe the claim..."
                        value={claimForm}
                        onChange={e => setClaimForm(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addClaim()}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <button onClick={addClaim} className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors">
                        <Plus size={14} /> Log Claim
                      </button>
                    </div>

                    {warrantyClaims.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No claims logged</p>
                    ) : (
                      <div className="space-y-2">
                        {warrantyClaims.map(claim => (
                          <div key={claim.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100">
                            {claim.status === 'open'
                              ? <AlertTriangle size={15} className="text-orange-500 flex-shrink-0 mt-0.5" />
                              : <CheckCircle size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                            }
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${claim.status === 'resolved' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                {claim.description}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Reported {new Date(claim.reportedAt).toLocaleDateString()}
                                {claim.resolvedAt && ` · Resolved ${new Date(claim.resolvedAt).toLocaleDateString()}`}
                              </p>
                            </div>
                            {claim.status === 'open' && (
                              <button onClick={() => resolveClaim(claim.id)}
                                className="text-xs font-semibold text-green-600 hover:text-green-700 whitespace-nowrap">
                                Resolve
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
