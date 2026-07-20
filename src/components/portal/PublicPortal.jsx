import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { computeEstimateTotals, formatCurrency } from '../../utils/helpers'
import { CheckCircle, Clock, ChevronRight, AlertCircle, Loader2, Image, MessageSquare, Calendar, FileText } from 'lucide-react'
import { getCompanySettings } from '../../utils/companySettings'

const STAGE_ORDER = ['Lead', 'Inspection', 'Estimate Sent', 'Approved', 'Remediation', 'Post-Test', 'Invoiced', 'Closed']

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        {Icon && <Icon size={13} className="text-gray-400" />}
        {title}
      </h3>
      {children}
    </div>
  )
}

export default function PublicPortal({ code }) {
  const [status, setStatus]         = useState('loading')
  const [job, setJob]               = useState(null)
  const [clientName, setClientName] = useState('')
  const [events, setEvents]         = useState([])
  const [photos, setPhotos]         = useState([])
  const [lightbox, setLightbox]     = useState(null)
  const [approving, setApproving]   = useState(false)
  const { companyName, phone, email } = getCompanySettings()

  useEffect(() => {
    async function load() {
      const { data: rows, error } = await supabase
        .from('jobs')
        .select('*')
        .not('portal', 'is', null)

      if (error) { setStatus('error'); return }

      const row = (rows ?? []).find(r => r.portal?.code === code && r.portal?.enabled)
      if (!row) { setStatus('not_found'); return }

      if (row.client_id) {
        const { data: c } = await supabase.from('clients').select('name').eq('id', row.client_id).maybeSingle()
        if (c?.name) setClientName(c.name)
      }

      const [{ data: evRows }, { data: photoRows }] = await Promise.all([
        supabase.from('events').select('*').eq('job_id', row.id).order('date'),
        supabase.from('job_photos').select('*').eq('job_id', row.id).eq('is_showcase', true).order('created_at'),
      ])

      setJob({
        id: row.id,
        address: row.address ?? '',
        stage: row.stage ?? 'Lead',
        type: row.type ?? '',
        createdAt: row.created_at,
        estimate: row.estimate ?? null,
        portal: row.portal,
      })
      setEvents((evRows ?? []).map(e => ({
        id: e.id, eventType: e.event_type, date: e.date, startTime: e.start_time,
      })))
      setPhotos(photoRows ?? [])
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

  if (status !== 'ready') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <AlertCircle size={44} className="mx-auto mb-4 text-red-400" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Portal Not Found</h1>
        <p className="text-gray-500 text-sm">This link may be invalid or expired. Contact your service provider.</p>
      </div>
    </div>
  )

  const estimate          = job.estimate
  const totals            = estimate ? computeEstimateTotals(estimate) : null
  const stageIdx          = STAGE_ORDER.indexOf(job.stage)
  const estimateApproved  = job.portal?.estimateApproved || estimate?.status === 'Approved'
  const updates           = (job.portal?.updates ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const upcomingEvents    = events.filter(e => new Date(e.date + 'T23:59') >= new Date())
  const pastEvents        = events.filter(e => new Date(e.date + 'T23:59') < new Date())

  const fmtDate = (d, opts) => new Date(d + 'T12:00').toLocaleDateString('en-US', opts ?? { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Photo" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}

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

      <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">

        {/* Job status */}
        <Section title="Job Status">
          <div className="flex items-center gap-1.5 flex-wrap">
            {STAGE_ORDER.map((stage, i) => (
              <div key={stage} className="flex items-center gap-1.5">
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                  ${i < stageIdx  ? 'bg-green-100 text-green-700' : ''}
                  ${i === stageIdx ? 'bg-red-600 text-white' : ''}
                  ${i > stageIdx  ? 'bg-gray-100 text-gray-400' : ''}`}>
                  {i < stageIdx && <CheckCircle size={10} />}
                  {i === stageIdx && <Clock size={10} />}
                  {stage}
                </div>
                {i < STAGE_ORDER.length - 1 && <ChevronRight size={11} className="text-gray-300 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </Section>

        {/* Updates from contractor */}
        {updates.length > 0 && (
          <Section icon={MessageSquare} title={`Updates from ${companyName}`}>
            <div className="space-y-4">
              {updates.map(u => (
                <div key={u.id} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                  <div>
                    <p className="text-sm text-gray-800 leading-relaxed">{u.text}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Upcoming appointments */}
        {upcomingEvents.length > 0 && (
          <Section icon={Calendar} title="Upcoming Appointments">
            <div className="space-y-3">
              {upcomingEvents.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-gray-900">{ev.eventType}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {fmtDate(ev.date)}{ev.startTime && ` at ${ev.startTime}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Photo gallery */}
        {photos.length > 0 && (
          <Section icon={Image} title="Job Photos">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {photos.map(p => (
                <button
                  key={p.id}
                  onClick={() => setLightbox(p.storage_path)}
                  className="aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
                >
                  <img
                    src={p.storage_path}
                    alt={p.name ?? 'Job photo'}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Tap any photo to enlarge</p>
          </Section>
        )}

        {/* Estimate */}
        {estimate && totals && (
          <Section icon={FileText} title="Your Estimate">
            <div className="flex items-center justify-between mb-4 -mt-1">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                ${estimateApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {estimateApproved ? 'Approved' : 'Pending Your Approval'}
              </span>
            </div>

            {estimate.scopeNotes && (
              <p className="text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100 leading-relaxed">{estimate.scopeNotes}</p>
            )}

            <div className="space-y-2 text-sm">
              {estimate.sqftItems?.map(item => (
                <div key={item.id} className="flex justify-between text-gray-700">
                  <span>{item.description}{item.sqft ? ` (${item.sqft} sq ft)` : ''}</span>
                  <span className="font-medium ml-4 flex-shrink-0">{formatCurrency(item.sqft * item.ratePerSqft)}</span>
                </div>
              ))}
              {estimate.laborItems?.map(item => (
                <div key={item.id} className="flex justify-between text-gray-700">
                  <span>{item.trade}{item.hours ? ` (${item.hours} hrs)` : ''}</span>
                  <span className="font-medium ml-4 flex-shrink-0">{formatCurrency(item.hours * item.ratePerHour)}</span>
                </div>
              ))}
              {estimate.equipmentItems?.map(item => (
                <div key={item.id} className="flex justify-between text-gray-700">
                  <span>{item.name}{item.qty > 1 ? ` × ${item.qty}` : ''}</span>
                  <span className="font-medium ml-4 flex-shrink-0">{formatCurrency(item.qty * item.unitPrice)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span>
              </div>
              {totals.overhead > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Overhead & margin</span><span>{formatCurrency(totals.overhead)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-100">
                <span>Total</span><span>{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>

            {estimateApproved ? (
              <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-xl text-sm font-medium">
                <CheckCircle size={16} /> Estimate approved — thank you!
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  {approving ? 'Saving…' : 'Approve Estimate'}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  By approving you authorize {companyName} to proceed with the work above.
                </p>
              </div>
            )}
          </Section>
        )}

        {/* Timeline */}
        <Section title="Job Timeline">
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
              <div>
                <span className="text-gray-700 font-medium">Job opened</span>
                <span className="text-gray-400 text-xs ml-2">
                  {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
            {estimate?.sentAt && (
              <div className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                <div>
                  <span className="text-gray-700 font-medium">Estimate sent</span>
                  <span className="text-gray-400 text-xs ml-2">{fmtDate(estimate.sentAt.slice(0, 10), { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            )}
            {estimateApproved && job.portal?.approvedAt && (
              <div className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                <div>
                  <span className="text-gray-700 font-medium">Estimate approved</span>
                  <span className="text-gray-400 text-xs ml-2">{fmtDate(job.portal.approvedAt.slice(0, 10), { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            )}
            {pastEvents.map(ev => (
              <div key={ev.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                <div>
                  <span className="text-gray-700 font-medium">{ev.eventType}</span>
                  <span className="text-gray-400 text-xs ml-2">{fmtDate(ev.date, { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))}
            {upcomingEvents.map(ev => (
              <div key={ev.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0 mt-1.5" />
                <div>
                  <span className="text-gray-500">{ev.eventType}</span>
                  <span className="text-gray-400 text-xs ml-2">{fmtDate(ev.date, { month: 'short', day: 'numeric' })} — upcoming</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Contact footer */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center space-y-1">
          <p className="text-sm font-semibold text-gray-900">{companyName}</p>
          {phone && <p className="text-sm text-gray-500">{phone}</p>}
          {email && <a href={`mailto:${email}`} className="text-sm text-blue-600 hover:underline block">{email}</a>}
          <p className="text-xs text-gray-400 pt-2">Questions about your job? Reach out anytime.</p>
        </div>

      </div>
    </div>
  )
}
