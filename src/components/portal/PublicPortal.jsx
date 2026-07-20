import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { computeEstimateTotals, formatCurrency } from '../../utils/helpers'
import { CheckCircle, Clock, ChevronRight, AlertCircle, Loader2 } from 'lucide-react'
import { getCompanySettings } from '../../utils/companySettings'

const STAGE_ORDER = ['Lead', 'Inspection', 'Estimate Sent', 'Approved', 'Remediation', 'Post-Test', 'Invoiced', 'Closed']

export default function PublicPortal({ code }) {
  const [status, setStatus]   = useState('loading') // loading | ready | not_found | error
  const [job, setJob]         = useState(null)
  const [clientName, setClientName] = useState('')
  const [events, setEvents]   = useState([])
  const [approving, setApproving] = useState(false)
  const { companyName, phone } = getCompanySettings()

  useEffect(() => {
    async function load() {
      // Find the job whose portal.code matches
      const { data: rows, error } = await supabase
        .from('jobs')
        .select('*')
        .not('portal', 'is', null)

      if (error) { setStatus('error'); return }

      const row = (rows ?? []).find(r => r.portal?.code === code && r.portal?.enabled)
      if (!row) { setStatus('not_found'); return }

      // Fetch client name
      if (row.client_id) {
        const { data: c } = await supabase.from('clients').select('name').eq('id', row.client_id).maybeSingle()
        if (c?.name) setClientName(c.name)
      }

      // Fetch events for this job
      const { data: evRows } = await supabase.from('events').select('*').eq('job_id', row.id).order('date')

      setJob({
        id: row.id,
        address: row.address ?? '',
        stage: row.stage ?? 'Lead',
        createdAt: row.created_at,
        estimate: row.estimate ?? null,
        portal: row.portal,
      })
      setEvents((evRows ?? []).map(e => ({
        id: e.id,
        eventType: e.event_type,
        date: e.date,
        startTime: e.start_time,
      })))
      setStatus('ready')
    }
    load()
  }, [code])

  const handleApprove = async () => {
    setApproving(true)
    const updatedPortal = { ...job.portal, estimateApproved: true, approvedAt: new Date().toISOString() }
    const { error } = await supabase.from('jobs').update({ portal: updatedPortal }).eq('id', job.id)
    if (!error) setJob(prev => ({ ...prev, portal: updatedPortal }))
    setApproving(false)
  }

  // ── Status screens ──────────────────────────────────────────────────────────
  if (status === 'loading') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin text-red-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading your portal…</p>
      </div>
    </div>
  )

  if (status === 'not_found' || status === 'error') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <AlertCircle size={44} className="mx-auto mb-4 text-red-400" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Portal Not Found</h1>
        <p className="text-gray-500 text-sm">This link may be invalid or expired. Please contact your service provider.</p>
      </div>
    </div>
  )

  const estimate = job.estimate
  const totals   = estimate ? computeEstimateTotals(estimate) : null
  const stageIdx = STAGE_ORDER.indexOf(job.stage)
  const estimateApproved = job.portal?.estimateApproved || estimate?.status === 'Approved'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gray-950 px-5 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          </div>
          <div>
            <div>
              <span className="text-red-500 font-black text-base">PURE</span>
              <span className="text-white font-black text-base">PRO</span>
              <span className="text-gray-400 text-base"> Restoration</span>
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Client Job Portal</div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto mt-4 border-t border-gray-800 pt-4">
          {clientName && <div className="text-white font-semibold">{clientName}</div>}
          <div className="text-gray-400 text-sm">{job.address}</div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">

        {/* Job status pipeline */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Job Status</h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            {STAGE_ORDER.map((stage, i) => (
              <div key={stage} className="flex items-center gap-1.5">
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                  ${i < stageIdx  ? 'bg-green-100 text-green-700' : ''}
                  ${i === stageIdx ? 'bg-red-600 text-white' : ''}
                  ${i > stageIdx  ? 'bg-gray-100 text-gray-400' : ''}
                `}>
                  {i < stageIdx && <CheckCircle size={10} />}
                  {i === stageIdx && <Clock size={10} />}
                  {stage}
                </div>
                {i < STAGE_ORDER.length - 1 && <ChevronRight size={11} className="text-gray-300 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled appointments */}
        {events.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Scheduled Appointments</h3>
            <div className="space-y-2">
              {events.map(ev => (
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
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Your Estimate</h3>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full
                ${estimateApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {estimateApproved ? 'Approved' : 'Pending Approval'}
              </span>
            </div>

            {estimate.scopeNotes && (
              <p className="text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">{estimate.scopeNotes}</p>
            )}

            <div className="space-y-1 text-sm">
              {estimate.sqftItems?.map(item => (
                <div key={item.id} className="flex justify-between text-gray-700">
                  <span>{item.description} ({item.sqft} sq ft)</span>
                  <span className="font-medium">{formatCurrency(item.sqft * item.ratePerSqft)}</span>
                </div>
              ))}
              {estimate.laborItems?.map(item => (
                <div key={item.id} className="flex justify-between text-gray-700">
                  <span>{item.trade} ({item.hours} hrs)</span>
                  <span className="font-medium">{formatCurrency(item.hours * item.ratePerHour)}</span>
                </div>
              ))}
              {estimate.equipmentItems?.map(item => (
                <div key={item.id} className="flex justify-between text-gray-700">
                  <span>{item.name} × {item.qty}</span>
                  <span className="font-medium">{formatCurrency(item.qty * item.unitPrice)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span>
              </div>
              {totals.overhead > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Overhead & margin</span><span>{formatCurrency(totals.overhead)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 pt-1">
                <span>Total</span><span>{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>

            {estimateApproved ? (
              <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-xl text-sm font-medium">
                <CheckCircle size={16} /> Estimate approved — thank you!
              </div>
            ) : (
              <button
                onClick={handleApprove}
                disabled={approving}
                className="mt-4 w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                {approving ? 'Saving…' : 'Approve Estimate'}
              </button>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Job Timeline</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-gray-500">{new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span className="text-gray-700 font-medium">Job opened</span>
            </div>
            {estimate?.sentAt && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-gray-500">{new Date(estimate.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span className="text-gray-700 font-medium">Estimate sent</span>
              </div>
            )}
            {events.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${new Date(ev.date) <= new Date() ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-gray-500">{new Date(ev.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span className="text-gray-700 font-medium">{ev.eventType}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 pb-4">
          Questions? Contact {companyName}{phone ? ` at ${phone}` : ''}.
        </div>
      </div>
    </div>
  )
}
