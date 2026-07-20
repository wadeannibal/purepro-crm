import { useState, useRef, useEffect, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { renderPdfToImages, fileToBase64 } from '../../lib/pdfUtils'
import { supabase } from '../../lib/supabase'
import {
  PenLine, CheckCircle, Clock, Trash2, X, RotateCcw, ChevronLeft,
  Upload, Link, Copy, Check, MousePointer, ArrowLeft, ExternalLink,
} from 'lucide-react'

// ── Field type config ─────────────────────────────────────────────────────────
const FIELD_TYPES = ['Signature', 'Initials', 'Full Name', 'Date', 'Text']

const FIELD_STYLE = {
  Signature:   { bg: 'bg-red-100',    border: 'border-red-400',    text: 'text-red-700'    },
  Initials:    { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700' },
  'Full Name': { bg: 'bg-blue-100',   border: 'border-blue-400',   text: 'text-blue-700'   },
  Date:        { bg: 'bg-green-100',  border: 'border-green-400',  text: 'text-green-700'  },
  Text:        { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700' },
}

const FIELD_DEFAULTS = {
  Signature:   { width: 0.36, height: 0.08 },
  Initials:    { width: 0.12, height: 0.07 },
  'Full Name': { width: 0.30, height: 0.055 },
  Date:        { width: 0.18, height: 0.055 },
  Text:        { width: 0.26, height: 0.055 },
}

// ── In-person SignaturePad (unchanged from original) ──────────────────────────
function SignaturePad({ onSave, onCancel }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [signerName, setSignerName] = useState('')

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  }, [])

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const t = e.touches?.[0]
    return {
      x: ((t?.clientX ?? e.clientX) - rect.left) * (canvas.width / rect.width),
      y: ((t?.clientY ?? e.clientY) - rect.top) * (canvas.height / rect.height),
    }
  }

  const startDraw = (e) => { e.preventDefault(); drawing.current = true; const c = canvasRef.current; const p = getPos(e, c); c.getContext('2d').beginPath(); c.getContext('2d').moveTo(p.x, p.y) }
  const draw = (e) => { e.preventDefault(); if (!drawing.current) return; const c = canvasRef.current; const ctx = c.getContext('2d'); const p = getPos(e, c); ctx.lineTo(p.x, p.y); ctx.stroke(); setHasDrawn(true) }
  const endDraw = () => { drawing.current = false }
  const clear = () => { canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); setHasDrawn(false) }
  const save = () => { if (!hasDrawn || !signerName.trim()) return; onSave(canvasRef.current.toDataURL('image/png'), signerName.trim()) }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Signer Full Name</label>
        <input type="text" placeholder="e.g. Sarah Johnson" value={signerName} onChange={e => setSignerName(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Signature</label>
          <button onClick={clear} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"><RotateCcw size={11} /> Clear</button>
        </div>
        <canvas ref={canvasRef} width={480} height={140}
          className="border-2 border-dashed border-gray-300 rounded-xl w-full touch-none bg-white cursor-crosshair"
          style={{ touchAction: 'none' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        <p className="text-xs text-gray-400 mt-1.5">Draw signature above using mouse or finger</p>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={save} disabled={!hasDrawn || !signerName.trim()}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
          Sign & Submit
        </button>
        <button onClick={onCancel} className="px-4 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
      </div>
    </div>
  )
}

// ── Remote signing builder ────────────────────────────────────────────────────
function RemoteBuilder({ job, onDone }) {
  const { dispatch } = useApp()
  const [title, setTitle] = useState('')
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [pdfBase64, setPdfBase64] = useState(null)
  const [pdfFileName, setPdfFileName] = useState('')
  const [pages, setPages] = useState([])
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [fields, setFields] = useState([])
  const [activeType, setActiveType] = useState('Signature')
  const [generatedLink, setGeneratedLink] = useState(null)
  const [copied, setCopied] = useState(false)

  const pageRefs = useRef([])
  const dragging = useRef(null) // { id, page, offsetX, offsetY }
  const resizing = useRef(null) // { id, page, startMouseX, startMouseY, startW, startH }

  // Global drag + resize tracking
  useEffect(() => {
    const onMove = (e) => {
      if (dragging.current) {
        const el = pageRefs.current[dragging.current.page]
        if (!el) return
        const rect = el.getBoundingClientRect()
        const nx = (e.clientX - rect.left) / rect.width - dragging.current.offsetX
        const ny = (e.clientY - rect.top) / rect.height - dragging.current.offsetY
        setFields(prev => prev.map(f => f.id !== dragging.current.id ? f : {
          ...f,
          x: Math.max(0, Math.min(nx, 1 - f.width)),
          y: Math.max(0, Math.min(ny, 1 - f.height)),
        }))
      } else if (resizing.current) {
        const el = pageRefs.current[resizing.current.page]
        if (!el) return
        const rect = el.getBoundingClientRect()
        const dx = (e.clientX - resizing.current.startMouseX) / rect.width
        const dy = (e.clientY - resizing.current.startMouseY) / rect.height
        const minW = 0.04, minH = 0.03
        setFields(prev => prev.map(f => f.id !== resizing.current.id ? f : {
          ...f,
          width: Math.max(minW, Math.min(resizing.current.startW + dx, 1 - f.x)),
          height: Math.max(minH, Math.min(resizing.current.startH + dy, 1 - f.y)),
        }))
      }
    }
    const onUp = () => { dragging.current = null; resizing.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  const startResize = (e, field) => {
    e.stopPropagation()
    e.preventDefault()
    resizing.current = {
      id: field.id,
      page: field.page,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startW: field.width,
      startH: field.height,
    }
  }

  const handlePdfUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') return
    setPdfFileName(file.name)
    setLoadingPdf(true)
    setFields([])
    setGeneratedLink(null)
    try {
      const b64 = await fileToBase64(file)
      setPdfBase64(b64)
      const rendered = await renderPdfToImages(b64, 1.5)
      setPages(rendered)
    } catch (e) {
      alert('Could not render PDF. Please try a different file.')
    }
    setLoadingPdf(false)
  }

  const handlePageClick = (e, pageIndex) => {
    if (dragging.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = (e.clientX - rect.left) / rect.width
    const clickY = (e.clientY - rect.top) / rect.height
    const def = FIELD_DEFAULTS[activeType]
    setFields(prev => [...prev, {
      id: crypto.randomUUID(),
      type: activeType,
      page: pageIndex,
      x: Math.max(0, Math.min(clickX - def.width / 2, 1 - def.width)),
      y: Math.max(0, Math.min(clickY - def.height / 2, 1 - def.height)),
      ...def,
    }])
  }

  const startDrag = (e, field) => {
    e.stopPropagation()
    const el = pageRefs.current[field.page]
    if (!el) return
    const rect = el.getBoundingClientRect()
    dragging.current = {
      id: field.id,
      page: field.page,
      offsetX: (e.clientX - rect.left) / rect.width - field.x,
      offsetY: (e.clientY - rect.top) / rect.height - field.y,
    }
  }

  const removeField = (id) => setFields(prev => prev.filter(f => f.id !== id))

  const generateLink = () => {
    if (!title.trim() || !pdfBase64 || fields.length === 0) return
    const id = crypto.randomUUID()
    const token = crypto.randomUUID()
    const now = new Date().toISOString()
    const payload = {
      id,
      jobId: job.id,
      title: title.trim(),
      documentName: pdfFileName,
      documentData: pdfBase64,
      fields,
      signerName: signerName.trim(),
      signerEmail: signerEmail.trim(),
      token,
      createdAt: now,
    }
    dispatch({ type: ACTIONS.ADD_REMOTE_REQUEST, payload })
    setGeneratedLink(`${window.location.origin}/sign/${token}`)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (generatedLink) return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => setGeneratedLink(null)} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft size={13} /> New request
        </button>
        <button onClick={onDone} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
          View all requests
        </button>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle size={20} className="text-green-600" />
          <span className="font-bold text-green-800">Signing request created</span>
        </div>
        <p className="text-sm text-green-700">Copy this link and send it to <strong>{signerName || 'the signer'}</strong> via email or text. They can sign from any device — no account needed.</p>
        <div className="flex gap-2">
          <input readOnly value={generatedLink} className="flex-1 bg-white border border-green-300 rounded-xl px-3 py-2 text-sm text-gray-700 font-mono select-all" onClick={e => e.target.select()} />
          <button onClick={copyLink} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-gray-900 hover:bg-gray-700 text-white'}`}>
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
        <div className="text-xs text-green-600 space-y-1">
          <p>• Send this link manually via your Gmail, text, or any messaging app</p>
          <p>• The signer will see your PDF with the fields you placed</p>
          <p>• Their IP address and timestamp are automatically recorded when they sign</p>
          <p>• Once signed, check "Remote Requests" to view the completed document</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onDone} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft size={13} /> Back to requests
        </button>
      </div>

      {/* Form fields */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900">Document Details</h3>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Document Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Work Authorization Agreement"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Signer Name</label>
            <input value={signerName} onChange={e => setSignerName(e.target.value)} placeholder="Sarah Johnson"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Signer Email</label>
            <input type="email" value={signerEmail} onChange={e => setSignerEmail(e.target.value)} placeholder="sarah@email.com"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Upload PDF *</label>
          <label className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
            <Upload size={20} className="text-gray-400" />
            <div>
              <div className="text-sm font-semibold text-gray-700">{pdfFileName || 'Click to upload a PDF'}</div>
              <div className="text-xs text-gray-400">{pdfFileName ? 'Click to replace' : 'Any PDF document — contract, waiver, authorization, etc.'}</div>
            </div>
            <input type="file" accept="application/pdf" className="hidden" onChange={e => handlePdfUpload(e.target.files?.[0])} />
          </label>
        </div>
      </div>

      {/* Loading spinner */}
      {loadingPdf && (
        <div className="flex items-center gap-3 text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-4">
          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          Rendering PDF pages…
        </div>
      )}

      {/* PDF with field placement */}
      {pages.length > 0 && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Place Signature Fields</h3>
              <p className="text-xs text-gray-500">Select a field type below, then click anywhere on the document to place it. Drag to reposition. Click × to remove.</p>
            </div>
            {/* Field type palette */}
            <div className="flex flex-wrap gap-2">
              {FIELD_TYPES.map(type => {
                const s = FIELD_STYLE[type]
                const isActive = activeType === type
                return (
                  <button
                    key={type}
                    onClick={() => setActiveType(type)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                      isActive
                        ? `${s.bg} ${s.border} ${s.text} ring-2 ring-offset-1 ring-current`
                        : `bg-gray-50 border-gray-200 text-gray-500 hover:${s.bg} hover:${s.border} hover:${s.text}`
                    }`}
                  >
                    <MousePointer size={11} />
                    {type}
                  </button>
                )
              })}
            </div>
            {fields.length > 0 && (
              <div className="text-xs text-gray-500">
                {fields.length} field{fields.length !== 1 ? 's' : ''} placed
                {' '}·{' '}
                <button onClick={() => setFields([])} className="text-red-500 hover:underline">Clear all</button>
              </div>
            )}
          </div>

          {/* PDF pages */}
          {pages.map((page, pi) => (
            <div
              key={pi}
              ref={el => pageRefs.current[pi] = el}
              className="relative shadow-xl rounded-lg overflow-hidden bg-white select-none"
              style={{ cursor: 'crosshair' }}
              onClick={e => handlePageClick(e, pi)}
            >
              {pages.length > 1 && (
                <div className="absolute top-2 left-2 z-10 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
                  Page {pi + 1}
                </div>
              )}
              <img src={page.dataUrl} alt={`Page ${pi + 1}`} className="w-full block pointer-events-none" draggable={false} />
              {/* Field overlays */}
              {fields.filter(f => f.page === pi).map(field => {
                const s = FIELD_STYLE[field.type]
                return (
                  <div
                    key={field.id}
                    className={`absolute border-2 rounded-sm flex items-center justify-between px-1.5 ${s.bg} ${s.border} cursor-grab active:cursor-grabbing`}
                    style={{
                      left: `${field.x * 100}%`,
                      top: `${field.y * 100}%`,
                      width: `${field.width * 100}%`,
                      height: `${field.height * 100}%`,
                    }}
                    onMouseDown={e => startDrag(e, field)}
                    onClick={e => e.stopPropagation()}
                  >
                    <span className={`text-[10px] font-bold truncate ${s.text}`}>{field.type}</span>
                    <button
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); removeField(field.id) }}
                      className={`flex-shrink-0 ${s.text} hover:opacity-60`}
                    >
                      <X size={10} />
                    </button>
                    {/* Resize handle — bottom-right corner */}
                    <div
                      onMouseDown={e => startResize(e, field)}
                      className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
                      style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '2px 0 3px 0' }}
                    />
                  </div>
                )
              })}
            </div>
          ))}

          {/* Generate link button */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
            {fields.length === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
                Place at least one field on the document before generating the link.
              </p>
            )}
            <button
              onClick={generateLink}
              disabled={!title.trim() || fields.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              <Link size={15} /> Generate Signing Link
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Remote requests list ──────────────────────────────────────────────────────
function RemoteRequestsList({ job, requests, onNew, onRefresh }) {
  const { dispatch } = useApp()
  const [expanded, setExpanded] = useState(null)
  const [copied, setCopied] = useState(null)

  const jobRequests = requests.filter(r => r.jobId === job.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const copyLink = (token, id) => {
    navigator.clipboard.writeText(`${window.location.origin}/sign/${token}`)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const del = (id) => {
    if (!window.confirm('Delete this signing request?')) return
    dispatch({ type: ACTIONS.DELETE_REMOTE_REQUEST, payload: { id } })
  }

  const refreshStatus = async () => {
    if (!job) return
    const { data } = await supabase.from('signature_requests').select('*').eq('job_id', job.id)
    if (data) onRefresh(data)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Remote Signing Requests</h3>
          <p className="text-xs text-gray-500 mt-0.5">Send your PDF to anyone — they sign from a link, no account needed</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshStatus} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">Refresh</button>
          <button onClick={onNew} className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            + New Request
          </button>
        </div>
      </div>

      {jobRequests.length === 0 ? (
        <div className="text-center py-14 bg-white border border-gray-200 rounded-2xl">
          <Link size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-600">No requests yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Upload a PDF, place signature fields, and send a link</p>
          <button onClick={onNew} className="text-sm font-semibold text-red-600 hover:underline">Create first request →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobRequests.map(req => (
            <div key={req.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="flex items-start gap-3 p-4">
                <div className="mt-0.5">
                  {req.status === 'signed'
                    ? <CheckCircle size={18} className="text-green-500" />
                    : <Clock size={18} className="text-yellow-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{req.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {req.status === 'signed'
                      ? `Signed on ${new Date(req.signedAt).toLocaleDateString()} · IP: ${req.signerIp || 'n/a'}`
                      : `Created ${new Date(req.createdAt).toLocaleDateString()} · ${req.fields?.length ?? 0} fields · Awaiting signature`
                    }
                  </div>
                  {req.signerName && <div className="text-xs text-gray-400">Signer: {req.signerName}{req.signerEmail ? ` · ${req.signerEmail}` : ''}</div>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${req.status === 'signed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {req.status === 'signed' ? 'Signed' : 'Pending'}
                  </span>
                  {req.status !== 'signed' && (
                    <button
                      onClick={() => copyLink(req.token, req.id)}
                      title="Copy signing link"
                      className={`p-1.5 rounded-lg transition-colors ${copied === req.id ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                    >
                      {copied === req.id ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  )}
                  {req.status === 'signed' && (
                    <button
                      onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      title="View signed fields"
                    >
                      <ExternalLink size={13} />
                    </button>
                  )}
                  <button onClick={() => del(req.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Expand: show signed fields */}
              {expanded === req.id && req.status === 'signed' && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Signed Fields</div>
                  <div className="space-y-2">
                    {(req.signedFields ?? []).map((sf, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-xs text-gray-400 w-20 flex-shrink-0">{sf.type}</span>
                        {(sf.type === 'Signature' || sf.type === 'Initials') && sf.value ? (
                          <img src={sf.value} alt={sf.type} className="h-12 border border-gray-200 rounded bg-white p-1" />
                        ) : (
                          <span className="text-sm text-gray-700 font-medium">{sf.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main ESignature module ────────────────────────────────────────────────────
export default function ESignature({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()
  const [tab, setTab] = useState('remote') // 'remote' | 'inperson'
  const [view, setView] = useState('list') // 'list' | 'builder' (remote tab only)

  // In-person state
  const [signingId, setSigningId] = useState(null)
  const [newDoc, setNewDoc] = useState({ docType: 'Work Authorization', customText: '' })
  const [modal, setModal] = useState(null)

  const job = state.jobs.find(j => j.id === selectedJobId) ?? state.jobs[0] ?? null
  const client = job ? state.clients.find(c => c.id === job.clientId) : null
  const inPersonSigs = job?.signatures ?? []
  const remoteRequests = state.signatureRequests ?? []

  // Handle Supabase refresh of remote requests
  const handleRefresh = (rows) => {
    rows.forEach(r => {
      const existing = remoteRequests.find(x => x.id === r.id)
      if (existing && existing.status !== r.status) {
        // Status changed — reload the full state
        window.location.reload()
      }
    })
  }

  // In-person sign handlers (unchanged from original)
  const inPersonDocContent = (docType, customText) => {
    const templates = {
      'Work Authorization': `WORK AUTHORIZATION AGREEMENT\n\nThis Work Authorization is entered into between the Company and the property owner/authorized representative ("Client").\n\nClient authorizes the Company to perform the services at the property described below.\n\nSCOPE OF WORK: As outlined in the attached estimate. Client acknowledges that the scope may be adjusted based on conditions discovered during the work.\n\nPAYMENT TERMS: Payment is due upon completion of services unless otherwise agreed in writing.\n\nBy signing below, Client confirms they are authorized to approve work on the property.`,
      'Mold Disclosure': `MOLD DISCLOSURE AND ACKNOWLEDGMENT\n\nCLIENT DISCLOSURE: Mold has been identified at the above property. Client acknowledges:\n\n1. Mold can pose health risks, particularly to individuals with respiratory conditions.\n2. Occupants should vacate affected areas during remediation.\n3. Complete remediation requires addressing the moisture source.\n4. Post-remediation testing may be required to verify clearance.\n\nI authorize the Company to proceed with the recommended remediation scope.`,
      'Certificate of Satisfaction': `CERTIFICATE OF SATISFACTION\n\nThis Certificate confirms that the Company has completed the contracted services to the satisfaction of the client.\n\nSERVICES COMPLETED: All work was performed in accordance with the agreed scope of work and applicable industry standards (IICRC S500/S520 as applicable).\n\nBy signing below, I confirm that the described work has been completed to my satisfaction.`,
      'Estimate Approval': `ESTIMATE APPROVAL\n\nI, the undersigned, hereby approve the estimate provided by the Company for the work described therein.\n\nI understand that the total amount is as stated in the accompanying estimate, and work will commence upon receipt of any required deposit.\n\nBy signing, I authorize the Company to proceed with the approved scope of work.`,
      'Custom': customText,
    }
    return templates[docType] ?? ''
  }

  const createInPersonRequest = () => {
    if (!job) return
    dispatch({
      type: ACTIONS.ADD_SIGNATURE_REQUEST,
      payload: {
        jobId: job.id,
        request: {
          id: crypto.randomUUID(),
          docType: newDoc.docType,
          docContent: inPersonDocContent(newDoc.docType, newDoc.customText),
        },
      },
    })
    setModal(null)
    setNewDoc({ docType: 'Work Authorization', customText: '' })
  }

  const signInPerson = (sigData, signerName) => {
    dispatch({ type: ACTIONS.SIGN_DOCUMENT, payload: { jobId: job.id, signatureId: signingId, signatureData: sigData, signerName } })
    setSigningId(null)
  }

  const deleteInPerson = (signatureId) => {
    dispatch({ type: ACTIONS.DELETE_SIGNATURE_REQUEST, payload: { jobId: job.id, signatureId } })
  }

  const signingDoc = signingId ? inPersonSigs.find(s => s.id === signingId) : null

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
            <select value={job?.id ?? ''} onChange={e => { setSelectedJobId(e.target.value); setView('list') }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
              {state.jobs.map(j => {
                const c = state.clients.find(cl => cl.id === j.clientId)
                return <option key={j.id} value={j.id}>{j.type} — {c?.name ?? 'Unknown'} ({j.stage})</option>
              })}
            </select>
          )}
        </div>

        {job && (
          <>
            {/* Tab bar */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setTab('remote')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === 'remote' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Remote Signing
              </button>
              <button
                onClick={() => setTab('inperson')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === 'inperson' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                In-Person
              </button>
            </div>

            {/* Remote Signing tab */}
            {tab === 'remote' && (
              view === 'builder'
                ? <RemoteBuilder job={job} onDone={() => setView('list')} />
                : <RemoteRequestsList
                    job={job}
                    requests={remoteRequests}
                    onNew={() => setView('builder')}
                    onRefresh={handleRefresh}
                  />
            )}

            {/* In-Person tab */}
            {tab === 'inperson' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">In-Person Signing</p>
                    <p className="text-xs text-gray-500 mt-0.5">Collect a signature right here on screen</p>
                  </div>
                  <button onClick={() => setModal('create')} className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                    + New Document
                  </button>
                </div>

                {inPersonSigs.length === 0 ? (
                  <div className="text-center py-14 bg-white border border-gray-200 rounded-2xl">
                    <PenLine size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-semibold text-gray-600">No documents yet</p>
                    <p className="text-sm text-gray-400 mt-1">Create a signature request to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inPersonSigs.map(sig => (
                      <div key={sig.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {sig.status === 'signed' ? <CheckCircle size={18} className="text-green-500" /> : <Clock size={18} className="text-yellow-500" />}
                            <div>
                              <div className="font-semibold text-gray-900">{sig.docType}</div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {sig.status === 'signed' ? `Signed by ${sig.signerName} on ${new Date(sig.signedAt).toLocaleDateString()}` : `Created ${new Date(sig.createdAt).toLocaleDateString()} — awaiting signature`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sig.status === 'signed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {sig.status === 'signed' ? 'Signed' : 'Pending'}
                            </span>
                            {sig.status !== 'signed' && (
                              <button onClick={() => setSigningId(sig.id)} className="text-xs font-semibold bg-gray-900 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                                Open Pad
                              </button>
                            )}
                            <button onClick={() => deleteInPerson(sig.id)} className="text-gray-300 hover:text-red-500 transition-colors ml-1"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        {sig.status === 'signed' && sig.signatureData && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="text-xs text-gray-400 mb-2">Captured signature</div>
                            <img src={sig.signatureData} alt="Signature" className="max-w-[240px] border border-gray-200 rounded-lg bg-white p-2" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* In-person create modal */}
      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">New In-Person Document</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Document Type</label>
                <select value={newDoc.docType} onChange={e => setNewDoc(d => ({ ...d, docType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  {['Work Authorization', 'Mold Disclosure', 'Certificate of Satisfaction', 'Estimate Approval', 'Custom'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              {newDoc.docType === 'Custom' && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Document Text</label>
                  <textarea value={newDoc.customText} onChange={e => setNewDoc(d => ({ ...d, customText: e.target.value }))}
                    rows={8} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 font-mono focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
                </div>
              )}
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button onClick={createInPersonRequest} className="flex-1 bg-gray-900 hover:bg-gray-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Create</button>
              <button onClick={() => setModal(null)} className="px-4 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* In-person signing pad modal */}
      {signingId && signingDoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{signingDoc.docType}</h3>
              <button onClick={() => setSigningId(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">{signingDoc.docContent}</pre>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Sign Below</div>
                <SignaturePad onSave={signInPerson} onCancel={() => setSigningId(null)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
