import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { renderPdfToImages } from '../../lib/pdfUtils'
import { CheckCircle, AlertCircle, RotateCcw } from 'lucide-react'

function MiniSignPad({ label, onAccept }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.strokeStyle = '#1f2937'
    ctx.lineWidth = 2
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
  const move = e => { e.preventDefault(); if (!drawing.current) return; const c = canvasRef.current; const p = pos(e, c); const ctx = c.getContext('2d'); ctx.lineTo(p.x, p.y); ctx.stroke(); setHasDrawn(true) }
  const end = () => { drawing.current = false }
  const clear = () => { canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); setHasDrawn(false) }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between px-2 py-1 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-medium text-gray-500">{label} — draw below</span>
        <button onClick={clear} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"><RotateCcw size={10} /> Clear</button>
      </div>
      <canvas
        ref={canvasRef}
        width={500}
        height={120}
        className="w-full touch-none cursor-crosshair"
        style={{ touchAction: 'none' }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      {hasDrawn && (
        <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => onAccept(canvasRef.current.toDataURL('image/png'))}
            className="w-full text-xs font-bold bg-green-600 hover:bg-green-700 text-white py-1.5 rounded transition-colors"
          >
            Use this {label}
          </button>
        </div>
      )}
    </div>
  )
}

export default function SigningPage({ token }) {
  const [request, setRequest] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | already_signed | done | error
  const [pages, setPages] = useState([])
  const [values, setValues] = useState({})
  const [submitting, setSubmitting] = useState(false)
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

  const set = (id, val) => setValues(prev => ({ ...prev, [id]: val }))

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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-sm font-bold text-gray-900">{request.title}</div>
          <div className="text-xs text-gray-500">Fill all required fields, then click Sign</div>
        </div>
        <button
          onClick={submit}
          disabled={!allFilled() || submitting}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors"
        >
          {submitting ? 'Submitting…' : 'Sign Document'}
        </button>
      </div>

      <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
        {pages.map((page, pi) => {
          const pageFields = fields.filter(f => f.page === pi)
          return (
            <div key={pi} className="relative shadow-xl rounded-lg overflow-hidden bg-white select-none">
              <img src={page.dataUrl} alt={`Page ${pi + 1}`} className="w-full block" draggable={false} />
              {pageFields.map(field => (
                <div
                  key={field.id}
                  className="absolute"
                  style={{
                    left: `${field.x * 100}%`,
                    top: `${field.y * 100}%`,
                    width: `${field.width * 100}%`,
                    height: `${field.height * 100}%`,
                  }}
                >
                  {(field.type === 'Signature' || field.type === 'Initials') ? (
                    values[field.id] ? (
                      <div className="w-full h-full border-2 border-green-400 rounded-sm bg-white/90 relative">
                        <img src={values[field.id]} alt={field.type} className="w-full h-full object-contain p-0.5" />
                        <button
                          onClick={() => set(field.id, '')}
                          className="absolute top-0 right-0 text-[9px] bg-red-500 text-white px-1 leading-4 rounded-bl font-bold"
                        >redo</button>
                      </div>
                    ) : (
                      <MiniSignPad
                        label={field.type}
                        onAccept={dataUrl => set(field.id, dataUrl)}
                      />
                    )
                  ) : field.type === 'Date' ? (
                    <input
                      type="date"
                      value={values[field.id] ?? new Date().toISOString().slice(0, 10)}
                      onChange={e => set(field.id, e.target.value)}
                      className="w-full h-full border-2 border-blue-400 rounded-sm bg-blue-50 text-xs px-1 focus:outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={field.type}
                      value={values[field.id] ?? ''}
                      onChange={e => set(field.id, e.target.value)}
                      className="w-full h-full border-2 border-blue-400 rounded-sm bg-blue-50 text-xs px-1 focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          )
        })}

        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-xs text-gray-400 mb-3">By clicking "Sign Document" you agree that this electronic signature is the legal equivalent of your handwritten signature.</p>
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
