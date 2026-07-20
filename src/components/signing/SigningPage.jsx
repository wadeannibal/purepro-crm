import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { renderPdfToImages } from '../../lib/pdfUtils'
import { CheckCircle, AlertCircle, RotateCcw, X, PenLine } from 'lucide-react'

// ── Signature pad used inside the modal ───────────────────────────────────────
function SignPad({ label, onAccept, onCancel }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.strokeStyle = '#1f2937'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const pos = (e, canvas) => {
    const r = canvas.getBoundingClientRect()
    const t = e.touches?.[0]
    return {
      x: ((t?.clientX ?? e.clientX) - r.left) * (canvas.width / r.width),
      y: ((t?.clientY ?? e.clientY) - r.top) * (canvas.height / r.height),
    }
  }
  const start = e => { e.preventDefault(); drawing.current = true; const c = canvasRef.current; const p = pos(e, c); c.getContext('2d').beginPath(); c.getContext('2d').moveTo(p.x, p.y) }
  const move  = e => { e.preventDefault(); if (!drawing.current) return; const c = canvasRef.current; const p = pos(e, c); const ctx = c.getContext('2d'); ctx.lineTo(p.x, p.y); ctx.stroke(); setHasDrawn(true) }
  const end   = () => { drawing.current = false }
  const clear = () => { canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); setHasDrawn(false) }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white">
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-600">Draw your {label}</span>
          <button onClick={clear} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"><RotateCcw size={11} /> Clear</button>
        </div>
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-300 text-sm select-none">Sign here</span>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        <button
          onClick={() => hasDrawn && onAccept(canvasRef.current.toDataURL('image/png'))}
          disabled={!hasDrawn}
          className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors"
        >
          Accept {label}
        </button>
      </div>
    </div>
  )
}

// ── Modal for filling a single field ─────────────────────────────────────────
function FieldModal({ field, currentValue, onAccept, onCancel }) {
  const [text, setText] = useState(currentValue ?? '')
  const [date, setDate] = useState(currentValue ?? new Date().toISOString().slice(0, 10))

  const isDrawType = field.type === 'Signature' || field.type === 'Initials'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <PenLine size={16} className="text-gray-500" />
            <span className="font-bold text-gray-900">{field.type}</span>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="p-5">
          {isDrawType ? (
            <SignPad label={field.type} onAccept={onAccept} onCancel={onCancel} />
          ) : field.type === 'Date' ? (
            <div className="space-y-4">
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border-2 border-blue-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={() => onAccept(date)} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold">Confirm Date</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder={`Enter ${field.type}`}
                value={text}
                onChange={e => setText(e.target.value)}
                autoFocus
                className="w-full border-2 border-blue-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button
                  onClick={() => text.trim() && onAccept(text.trim())}
                  disabled={!text.trim()}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main signing page ─────────────────────────────────────────────────────────
export default function SigningPage({ token }) {
  const [request, setRequest]   = useState(null)
  const [status, setStatus]     = useState('loading')
  const [pages, setPages]       = useState([])
  const [values, setValues]     = useState({})
  const [activeField, setActiveField] = useState(null)
  const [submitting, setSubmitting]   = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    supabase.from('signature_requests').select('*').eq('token', token).maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) { setStatus('error'); setErrorMsg('Signing link not found or expired.'); return }
        setRequest(data)
        if (data.status === 'signed') { setStatus('already_signed'); return }
        renderPdfToImages(data.document_data, 1.5)
          .then(p => { setPages(p); setStatus('ready') })
          .catch(() => { setStatus('error'); setErrorMsg('Could not load the PDF document.') })
      })
  }, [token])

  const accept = (id, val) => {
    setValues(prev => ({ ...prev, [id]: val }))
    setActiveField(null)
  }

  const allFilled = () => request && (request.fields ?? []).every(f => {
    const v = values[f.id]
    return v && (typeof v === 'string' ? v.trim().length > 0 : true)
  })

  const submit = async () => {
    if (!allFilled() || submitting) return
    setSubmitting(true)
    let ip = ''
    try { ip = (await (await fetch('https://api.ipify.org?format=json')).json()).ip } catch {}
    const signedFields = (request.fields ?? []).map(f => ({ id: f.id, type: f.type, value: values[f.id] ?? '' }))
    const { error } = await supabase.from('signature_requests').update({
      status: 'signed',
      signed_at: new Date().toISOString(),
      signer_ip: ip,
      signed_fields: signedFields,
    }).eq('token', token)
    if (error) { setErrorMsg('Submission failed. Please try again.'); setSubmitting(false) }
    else setStatus('done')
  }

  // ── Status screens ──────────────────────────────────────────────────────────
  if (status === 'loading') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading document…</p>
      </div>
    </div>
  )

  if (status === 'error') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <AlertCircle size={44} className="mx-auto mb-4 text-red-400" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Link Error</h1>
        <p className="text-gray-500 text-sm">{errorMsg}</p>
      </div>
    </div>
  )

  if (status === 'already_signed') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <CheckCircle size={44} className="mx-auto mb-4 text-green-500" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Already Signed</h1>
        <p className="text-gray-500 text-sm">
          This document was signed on {new Date(request.signed_at).toLocaleString()}. No further action needed.
        </p>
      </div>
    </div>
  )

  if (status === 'done') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <CheckCircle size={56} className="mx-auto mb-4 text-green-500" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Document Signed</h1>
        <p className="text-gray-500 text-sm mb-4">Your signature has been recorded. You may close this window.</p>
        <div className="bg-gray-100 rounded-xl p-4 text-left text-sm text-gray-600 space-y-1">
          <div><span className="font-semibold">Document:</span> {request.title}</div>
          <div><span className="font-semibold">Signed:</span> {new Date().toLocaleString()}</div>
        </div>
      </div>
    </div>
  )

  const fields = request?.fields ?? []

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Modal */}
      {activeField && (
        <FieldModal
          field={activeField}
          currentValue={values[activeField.id]}
          onAccept={val => accept(activeField.id, val)}
          onCancel={() => setActiveField(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-sm font-bold text-gray-900">{request.title}</div>
          <div className="text-xs text-gray-500">
            {Object.keys(values).length}/{fields.length} fields completed — tap any box to fill it
          </div>
        </div>
        <button
          onClick={submit}
          disabled={!allFilled() || submitting}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors"
        >
          {submitting ? 'Submitting…' : 'Sign Document'}
        </button>
      </div>

      {/* Pages */}
      <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
        {pages.map((page, pi) => {
          const pageFields = fields.filter(f => f.page === pi)
          return (
            <div key={pi} className="relative shadow-xl rounded-lg overflow-hidden bg-white select-none">
              <img src={page.dataUrl} alt={`Page ${pi + 1}`} className="w-full block" draggable={false} />
              {pageFields.map(field => {
                const filled = !!values[field.id]
                const isDrawType = field.type === 'Signature' || field.type === 'Initials'
                return (
                  <button
                    key={field.id}
                    onClick={() => setActiveField(field)}
                    className={`absolute rounded-sm border-2 transition-all overflow-hidden
                      ${filled
                        ? 'border-green-400 bg-green-50/80'
                        : 'border-blue-400 bg-blue-50/80 hover:bg-blue-100/90 animate-pulse-subtle'
                      }`}
                    style={{
                      left: `${field.x * 100}%`,
                      top: `${field.y * 100}%`,
                      width: `${field.width * 100}%`,
                      height: `${field.height * 100}%`,
                    }}
                  >
                    {filled ? (
                      isDrawType ? (
                        <img src={values[field.id]} alt={field.type} className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <span className="text-[10px] font-semibold text-green-800 px-1 truncate block w-full text-left leading-none" style={{ marginTop: '2px' }}>
                          {values[field.id]}
                        </span>
                      )
                    ) : (
                      <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wide px-1 truncate block w-full text-left leading-none" style={{ marginTop: '2px' }}>
                        {field.type}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}

        {/* Footer */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-xs text-gray-400 mb-3">
            By clicking "Sign Document" you agree this electronic signature is the legal equivalent of your handwritten signature.
          </p>
          <button
            onClick={submit}
            disabled={!allFilled() || submitting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            {submitting ? 'Submitting…' : 'Sign Document'}
          </button>
          {!allFilled() && <p className="text-xs text-red-400 mt-2">Please complete all fields above before signing</p>}
          {errorMsg && <p className="text-xs text-red-500 mt-2">{errorMsg}</p>}
        </div>
      </div>
    </div>
  )
}
