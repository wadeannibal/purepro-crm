import { useState, useRef, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { PenLine, CheckCircle, Clock, Trash2, X, RotateCcw } from 'lucide-react'

const uid = () => crypto.randomUUID()

const DOC_TYPES = {
  'Work Authorization': `WORK AUTHORIZATION AGREEMENT

This Work Authorization is entered into between PurePro Restoration ("Company") and the property owner/authorized representative ("Client").

Client authorizes PurePro Restoration to perform the following services at the property described below:

SCOPE OF WORK: As outlined in the attached estimate and scope of work document. Client acknowledges that the scope may be adjusted based on conditions discovered during the work.

PAYMENT TERMS: Payment is due upon completion of services unless otherwise agreed in writing. A deposit may be required prior to commencement.

CLIENT AUTHORIZATION: By signing below, Client confirms they are authorized to approve work on the property and agree to the terms of this authorization.

Property Address: [Property Address]
Date of Authorization: [Date]`,

  'Mold Disclosure': `MOLD DISCLOSURE AND ACKNOWLEDGMENT

Property Address: [Property Address]

CLIENT DISCLOSURE: PurePro Restoration has identified the presence of mold growth at the above property. Client acknowledges the following:

1. Mold can pose health risks, particularly to individuals with respiratory conditions, allergies, or compromised immune systems.
2. Occupants, especially those with health sensitivities, should vacate affected areas during remediation.
3. Complete remediation requires addressing the moisture source in addition to mold removal.
4. Post-remediation testing may be required to verify clearance.
5. Mold may return if the underlying moisture problem is not permanently resolved.

CLIENT ACKNOWLEDGMENT: I have been informed of the above risks and conditions and authorize PurePro Restoration to proceed with the recommended remediation scope.`,

  'Certificate of Satisfaction': `CERTIFICATE OF SATISFACTION

This Certificate confirms that PurePro Restoration has completed the contracted services at the property described below to the satisfaction of the client.

Property Address: [Property Address]
Completion Date: [Date]

SERVICES COMPLETED: All work was performed in accordance with the agreed scope of work and applicable industry standards (IICRC S500/S520 as applicable).

CLIENT CONFIRMATION: By signing below, I confirm that:
• The described work has been completed to my satisfaction
• Any warranty terms have been explained to me
• I have had the opportunity to inspect the completed work
• All questions and concerns have been addressed`,

  'Estimate Approval': `ESTIMATE APPROVAL

I, the undersigned, hereby approve the estimate provided by PurePro Restoration for the work described therein.

I understand that:
• The total amount is as stated in the accompanying estimate
• Work will commence upon receipt of any required deposit
• Additional work discovered during the project will be communicated before proceeding
• Payment in full is due upon completion unless otherwise arranged

By signing, I authorize PurePro Restoration to proceed with the approved scope of work.`,

  'Custom': `[Enter your custom document text here]`,
}

function SignaturePad({ onSave, onCancel }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [signerName, setSignerName] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#1f2937'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const touch = e.touches?.[0]
    return {
      x: ((touch?.clientX ?? e.clientX) - rect.left) * scaleX,
      y: ((touch?.clientY ?? e.clientY) - rect.top) * scaleY,
    }
  }

  const startDraw = (e) => {
    e.preventDefault()
    drawing.current = true
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasDrawn(true)
  }

  const endDraw = () => { drawing.current = false }

  const clear = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const save = () => {
    if (!hasDrawn || !signerName.trim()) return
    onSave(canvasRef.current.toDataURL('image/png'), signerName.trim())
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Signer Full Name</label>
        <input
          type="text"
          placeholder="e.g. Sarah Johnson"
          value={signerName}
          onChange={e => setSignerName(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Signature</label>
          <button onClick={clear} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <RotateCcw size={11} /> Clear
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={480}
          height={140}
          className="border-2 border-dashed border-gray-300 rounded-xl w-full touch-none bg-white cursor-crosshair"
          style={{ touchAction: 'none' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        <p className="text-xs text-gray-400 mt-1.5">Draw signature above using mouse or finger</p>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          onClick={save}
          disabled={!hasDrawn || !signerName.trim()}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          Sign & Submit
        </button>
        <button onClick={onCancel} className="px-4 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function ESignature({ selectedJobId, setSelectedJobId }) {
  const { state, dispatch } = useApp()
  const [modal, setModal] = useState(null)
  const [signingId, setSigningId] = useState(null)
  const [newDoc, setNewDoc] = useState({ docType: 'Work Authorization', customText: '' })

  const job = state.jobs.find(j => j.id === selectedJobId) ?? state.jobs[0] ?? null
  const client = job ? state.clients.find(c => c.id === job.clientId) : null
  const signatures = job?.signatures ?? []

  const docContent = (docType, customText) =>
    docType === 'Custom' ? customText : DOC_TYPES[docType] ?? ''

  const createRequest = () => {
    if (!job) return
    dispatch({
      type: ACTIONS.ADD_SIGNATURE_REQUEST,
      payload: {
        jobId: job.id,
        request: {
          id: uid(),
          docType: newDoc.docType,
          docContent: docContent(newDoc.docType, newDoc.customText),
        },
      },
    })
    setModal(null)
    setNewDoc({ docType: 'Work Authorization', customText: '' })
  }

  const signDoc = (sigData, signerName) => {
    dispatch({
      type: ACTIONS.SIGN_DOCUMENT,
      payload: { jobId: job.id, signatureId: signingId, signatureData: sigData, signerName },
    })
    setSigningId(null)
  }

  const deleteRequest = (signatureId) => {
    dispatch({ type: ACTIONS.DELETE_SIGNATURE_REQUEST, payload: { jobId: job.id, signatureId } })
  }

  const signingDoc = signingId ? signatures.find(s => s.id === signingId) : null

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <PenLine size={17} className="text-gray-700" /> E-Signature
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">{client?.name} — {job.type} job</p>
              </div>
              <button
                onClick={() => setModal('create')}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                + New Document
              </button>
            </div>

            {/* Signature list */}
            {signatures.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                <PenLine size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="font-semibold text-gray-600">No documents yet</p>
                <p className="text-sm text-gray-400 mt-1">Create a signature request to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {signatures.map(sig => (
                  <div key={sig.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {sig.status === 'signed'
                          ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                          : <Clock size={18} className="text-yellow-500 flex-shrink-0" />
                        }
                        <div>
                          <div className="font-semibold text-gray-900">{sig.docType}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {sig.status === 'signed'
                              ? `Signed by ${sig.signerName} on ${new Date(sig.signedAt).toLocaleDateString()}`
                              : `Created ${new Date(sig.createdAt).toLocaleDateString()} — awaiting signature`
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                          ${sig.status === 'signed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {sig.status === 'signed' ? 'Signed' : 'Pending'}
                        </span>
                        {sig.status === 'pending' && (
                          <button
                            onClick={() => setSigningId(sig.id)}
                            className="text-xs font-semibold bg-gray-900 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Open Signing Pad
                          </button>
                        )}
                        <button onClick={() => deleteRequest(sig.id)} className="text-gray-300 hover:text-red-500 transition-colors ml-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {sig.status === 'signed' && sig.signatureData && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-400 mb-2">Captured signature</div>
                        <img
                          src={sig.signatureData}
                          alt="Signature"
                          className="max-w-[240px] border border-gray-200 rounded-lg bg-white p-2"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create document modal */}
      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">New Signature Request</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Document Type</label>
                <select
                  value={newDoc.docType}
                  onChange={e => setNewDoc(d => ({ ...d, docType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {Object.keys(DOC_TYPES).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Document Preview</label>
                <textarea
                  value={newDoc.docType === 'Custom' ? newDoc.customText : docContent(newDoc.docType, '')}
                  onChange={e => newDoc.docType === 'Custom' && setNewDoc(d => ({ ...d, customText: e.target.value }))}
                  readOnly={newDoc.docType !== 'Custom'}
                  rows={8}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 font-mono focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
                {newDoc.docType !== 'Custom' && (
                  <p className="text-xs text-gray-400 mt-1">Customize this template in Job Records → Documents after saving.</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button onClick={createRequest} className="flex-1 bg-gray-900 hover:bg-gray-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Create Signature Request
              </button>
              <button onClick={() => setModal(null)} className="px-4 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signing pad modal */}
      {signingId && signingDoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{signingDoc.docType}</h3>
              <button onClick={() => setSigningId(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                  {signingDoc.docContent}
                </pre>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Sign Below</div>
                <SignaturePad
                  onSave={signDoc}
                  onCancel={() => setSigningId(null)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
