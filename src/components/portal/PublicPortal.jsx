import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { computeEstimateTotals, formatCurrency } from '../../utils/helpers'
import { CheckCircle, Clock, ChevronRight, AlertCircle, Loader2, Image, MessageSquare, Calendar, FileText, Download, Printer } from 'lucide-react'
import { getCompanySettings } from '../../utils/companySettings'
import JSZip from 'jszip'

async function downloadBlob(url, filename) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const ext = blob.type.split('/')[1]?.split(';')[0] || 'jpg'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename ? filename : `photo.${ext}`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  } catch {
    window.open(url, '_blank')
  }
}

async function downloadZip(items, zipName) {
  const zip = new JSZip()
  const usedNames = {}
  await Promise.all(items.map(async ({ url, name }) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      // deduplicate filenames
      let fname = name || 'file'
      if (usedNames[fname]) {
        const dot = fname.lastIndexOf('.')
        const base = dot > 0 ? fname.slice(0, dot) : fname
        const ext  = dot > 0 ? fname.slice(dot) : ''
        fname = `${base}-${++usedNames[name]}${ext}`
      } else {
        usedNames[fname] = 1
      }
      zip.file(fname, blob)
    } catch { /* skip failed files */ }
  }))
  const content = await zip.generateAsync({ type: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(content)
  a.download = zipName
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
}

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
  const [zippingPhotos, setZippingPhotos] = useState(false)
  const [zippingDocs, setZippingDocs]     = useState(false)
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
  const portalDocs        = job.portal?.documents ?? []
  const upcomingEvents    = events.filter(e => new Date(e.date + 'T23:59') >= new Date())
  const pastEvents        = events.filter(e => new Date(e.date + 'T23:59') < new Date())

  const fmtDate = (d, opts) => new Date(d + 'T12:00').toLocaleDateString('en-US', opts ?? { weekday: 'short', month: 'short', day: 'numeric' })
  const esc = s => (s ?? '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (!win) return
    const printDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const fp = d => new Date(d + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    const stagesHtml = STAGE_ORDER.map((s, i) => {
      const cls = i < stageIdx ? 'sdone' : i === stageIdx ? 'scur' : 'spend'
      const pfx = i < stageIdx ? '✓ ' : i === stageIdx ? '● ' : ''
      return `<span class="${cls}">${pfx}${esc(s)}</span>${i < STAGE_ORDER.length - 1 ? '<span class="arr"> › </span>' : ''}`
    }).join('')

    const updHtml = updates.length === 0 ? '' : `<div class="sec"><div class="sec-t">Updates from ${esc(companyName)}</div>${updates.map(u => `<div class="upd"><div>${esc(u.text)}</div><div class="sub">${new Date(u.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div></div>`).join('')}</div>`

    const apptHtml = events.length === 0 ? '' : `<div class="sec"><div class="sec-t">Appointments</div>${[...pastEvents, ...upcomingEvents].map(ev => {
      const up = upcomingEvents.find(e => e.id === ev.id)
      return `<div class="appt"><div class="dot${up ? ' up' : ''}"></div><b>${esc(ev.eventType)}</b> <span class="sub">${fmtDate(ev.date)}${ev.startTime ? ' at ' + esc(ev.startTime) : ''}${up ? ' — upcoming' : ''}</span></div>`
    }).join('')}</div>`

    const photosHtml = photos.length === 0 ? '' : `<div class="sec"><div class="sec-t">Job Photos (${photos.length})</div><div class="pgrid">${photos.slice(0, 12).map(p => `<img src="${esc(p.storage_path)}" />`).join('')}</div>${photos.length > 12 ? `<div class="sub" style="margin-top:4px;">+${photos.length - 12} more photos available in portal</div>` : ''}</div>`

    const docsHtml = portalDocs.length === 0 ? '' : `<div class="sec"><div class="sec-t">Documents</div>${portalDocs.map(d => `<div class="docr">📄 ${esc(d.name)}</div>`).join('')}</div>`

    let estHtml = ''
    if (estimate && totals) {
      const lines = [
        ...(estimate.sqftItems?.map(i => [i.description + (i.sqft ? ` (${i.sqft} sq ft)` : ''), i.sqft * i.ratePerSqft]) ?? []),
        ...(estimate.laborItems?.map(i => [i.trade + (i.hours ? ` (${i.hours} hrs)` : ''), i.hours * i.ratePerHour]) ?? []),
        ...(estimate.equipmentItems?.map(i => [i.name + (i.qty > 1 ? ` × ${i.qty}` : ''), i.qty * i.unitPrice]) ?? []),
      ]
      estHtml = `<div class="sec"><div class="sec-t">Estimate${estimateApproved ? ' — Approved ✓' : ' — Pending Approval'}</div>${estimate.scopeNotes ? `<div class="scope">${esc(estimate.scopeNotes)}</div>` : ''}${lines.map(([d, a]) => `<div class="row"><span>${esc(d)}</span><span>${formatCurrency(a)}</span></div>`).join('')}${totals.overhead > 0 ? `<div class="row sub"><span>Subtotal</span><span>${formatCurrency(totals.subtotal)}</span></div><div class="row sub"><span>Overhead & margin</span><span>${formatCurrency(totals.overhead)}</span></div>` : ''}<div class="total"><span>Total</span><span>${formatCurrency(totals.grandTotal)}</span></div></div>`
    }

    const tlItems = [
      { date: job.createdAt.slice(0, 10), text: 'Job opened', done: true },
      ...(estimate?.sentAt ? [{ date: estimate.sentAt.slice(0, 10), text: 'Estimate sent', done: true }] : []),
      ...(estimateApproved && job.portal?.approvedAt ? [{ date: job.portal.approvedAt.slice(0, 10), text: 'Estimate approved', done: true }] : []),
      ...pastEvents.map(e => ({ date: e.date, text: e.eventType, done: true })),
      ...upcomingEvents.map(e => ({ date: e.date, text: e.eventType + ' (upcoming)', done: false })),
    ].sort((a, b) => a.date.localeCompare(b.date))

    const tlHtml = `<div class="sec"><div class="sec-t">Timeline</div>${tlItems.map(t => `<div class="tl"><span class="tldot${t.done ? '' : ' pend'}">${t.done ? '●' : '○'}</span><span>${esc(t.text)}</span><span class="sub">${fp(t.date)}</span></div>`).join('')}</div>`

    win.document.write(`<!DOCTYPE html><html><head><title>${esc(companyName)} — Job Portal</title><style>
*{box-sizing:border-box;margin:0;padding:0;}
@page{margin:.55in;size:letter;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937;font-size:12px;line-height:1.6;background:white;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;margin-bottom:18px;border-bottom:3px solid #dc2626;}
.logo{font-size:18px;font-weight:900;}.logo span{color:#dc2626;}
.co-sub{font-size:9.5px;color:#9ca3af;text-transform:uppercase;letter-spacing:.09em;margin-top:2px;}
.hdr-r{text-align:right;font-size:11px;color:#6b7280;}
.hdr-name{font-size:14px;font-weight:700;color:#111;margin-bottom:2px;}
.sec{margin-bottom:16px;page-break-inside:avoid;}
.sec-t{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;padding-bottom:4px;border-bottom:1px solid #e5e7eb;margin-bottom:8px;}
.stages{display:flex;flex-wrap:wrap;align-items:center;gap:3px;}
.sdone{background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:99px;font-size:9.5px;font-weight:600;}
.scur{background:#dc2626;color:white;padding:2px 8px;border-radius:99px;font-size:9.5px;font-weight:700;}
.spend{background:#f3f4f6;color:#9ca3af;padding:2px 8px;border-radius:99px;font-size:9.5px;}
.arr{color:#d1d5db;font-size:10px;}
.upd{border-left:2px solid #dc2626;padding-left:8px;margin-bottom:8px;font-size:11.5px;}
.appt{display:flex;align-items:center;gap:7px;padding:3px 0;font-size:11.5px;}
.dot{width:7px;height:7px;border-radius:50%;background:#22c55e;flex-shrink:0;}
.dot.up{background:#3b82f6;}
.pgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;}
.pgrid img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:4px;}
.docr{padding:3px 0;border-bottom:1px dotted #f3f4f6;font-size:11.5px;}
.row{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px dotted #f3f4f6;font-size:11.5px;}
.row.sub{color:#6b7280;font-size:11px;}
.scope{font-size:11px;color:#4b5563;font-style:italic;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f3f4f6;}
.total{display:flex;justify-content:space-between;font-weight:700;font-size:13px;padding-top:7px;border-top:2px solid #1f2937;margin-top:4px;}
.tl{display:flex;align-items:baseline;gap:6px;padding:2.5px 0;font-size:11.5px;}
.tldot{color:#dc2626;font-size:9px;width:10px;flex-shrink:0;}.tldot.pend{color:#d1d5db;}
.sub{color:#9ca3af;font-size:10px;margin-left:4px;}
.footer{margin-top:20px;padding-top:10px;border-top:2px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;font-size:10.5px;color:#6b7280;}
.fn{font-weight:700;color:#1f2937;font-size:12px;}
</style></head><body>
<div class="hdr"><div><div class="logo"><span>PURE</span>PRO Restoration</div><div class="co-sub">Client Job Portal</div></div><div class="hdr-r"><div class="hdr-name">${esc(clientName)}</div><div>${esc(job.address)}</div><div style="margin-top:3px;">${esc(job.type)} Job · ${esc(job.stage)}</div></div></div>
<div class="sec"><div class="sec-t">Job Status</div><div class="stages">${stagesHtml}</div></div>
${updHtml}${apptHtml}${photosHtml}${docsHtml}${estHtml}${tlHtml}
<div class="footer"><div><div class="fn">${esc(companyName)}</div><div>${[phone, email].filter(Boolean).map(esc).join(' · ')}</div></div><div>Generated ${printDate}</div></div>
</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 700)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Photo" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => downloadBlob(lightbox, 'photo.jpg')}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl backdrop-blur-sm transition-colors"
            >
              <Download size={14} /> Download
            </button>
            <button
              onClick={() => setLightbox(null)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl backdrop-blur-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-950 px-5 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <Printer size={13} /> Save as PDF
          </button>
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
            <button
              onClick={() => {
                const lines = [
                  `Job Updates — ${companyName}`,
                  `Client: ${clientName}`,
                  `Address: ${job.address}`,
                  `Downloaded: ${new Date().toLocaleDateString()}`,
                  '',
                  ...updates.map(u => `[${new Date(u.createdAt).toLocaleDateString()}]\n${u.text}`),
                ]
                const blob = new Blob([lines.join('\n\n')], { type: 'text/plain' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = 'job-updates.txt'
                a.click()
                setTimeout(() => URL.revokeObjectURL(a.href), 2000)
              }}
              className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-xl transition-colors"
            >
              <Download size={12} /> Download Updates
            </button>
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
                <div key={p.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={p.storage_path}
                    alt={p.name ?? 'Job photo'}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setLightbox(p.storage_path)}
                  />
                  <button
                    onClick={() => downloadBlob(p.storage_path, p.name || `photo-${p.id}.jpg`)}
                    className="absolute bottom-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Download photo"
                  >
                    <Download size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-400">Tap any photo to enlarge</p>
              {photos.length > 1 && (
                <button
                  disabled={zippingPhotos}
                  onClick={async () => {
                    setZippingPhotos(true)
                    await downloadZip(
                      photos.map((p, i) => ({ url: p.storage_path, name: p.name || `photo-${i + 1}.jpg` })),
                      'job-photos.zip'
                    )
                    setZippingPhotos(false)
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-50 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-xl transition-colors"
                >
                  {zippingPhotos
                    ? <><Loader2 size={12} className="animate-spin" /> Zipping…</>
                    : <><Download size={12} /> Download All ({photos.length})</>
                  }
                </button>
              )}
            </div>
          </Section>
        )}

        {/* Documents */}
        {portalDocs.length > 0 && (
          <Section icon={FileText} title="Documents">
            <div className="space-y-2">
              {portalDocs.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <FileText size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                    {doc.size && (
                      <p className="text-xs text-gray-400">{(doc.size / 1024).toFixed(0)} KB</p>
                    )}
                  </div>
                  <button
                    onClick={() => downloadBlob(doc.url, doc.name)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Download size={12} /> Download
                  </button>
                </div>
              ))}
            </div>
            {portalDocs.length > 1 && (
              <button
                disabled={zippingDocs}
                onClick={async () => {
                  setZippingDocs(true)
                  await downloadZip(
                    portalDocs.map(d => ({ url: d.url, name: d.name })),
                    'job-documents.zip'
                  )
                  setZippingDocs(false)
                }}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-50 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-xl transition-colors"
              >
                {zippingDocs
                  ? <><Loader2 size={12} className="animate-spin" /> Zipping…</>
                  : <><Download size={12} /> Download All ({portalDocs.length})</>
                }
              </button>
            )}
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
