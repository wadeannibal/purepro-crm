import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { BadgeCheck, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react'

const BLANK = { name: '', holder: 'Wade Annibal', issuingBody: '', certNumber: '', issueDate: '', expirationDate: '', notes: '' }

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.floor((new Date(dateStr) - Date.now()) / 86400000)
}

function certStatus(days) {
  if (days === null) return { label: 'No Expiry', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' }
  if (days < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' }
  if (days <= 90) return { label: `Expires in ${days}d`, color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' }
  return { label: 'Valid', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' }
}

const SEED_CERTS = [
  { name: 'Water Restoration Technician (WRT)', holder: 'Wade Annibal', issuingBody: 'IICRC', certNumber: 'WRT-00000', issueDate: '2022-03-15', expirationDate: '2025-03-15', notes: 'Renewal requires 14 CECs' },
  { name: 'Applied Microbial Remediation Technician (AMRT)', holder: 'Wade Annibal', issuingBody: 'IICRC', certNumber: 'AMRT-00000', issueDate: '2022-06-01', expirationDate: '2025-06-01', notes: '' },
  { name: 'Applied Structural Drying (ASD)', holder: 'Wade Annibal', issuingBody: 'IICRC', certNumber: 'ASD-00000', issueDate: '2023-01-20', expirationDate: '2026-01-20', notes: '' },
]

export default function CertificationTracker() {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [editId, setEditId] = useState(null)

  const certs = state.certifications?.length > 0 ? state.certifications : null

  const displayCerts = certs ?? SEED_CERTS

  const expiring = displayCerts.filter(c => { const d = daysUntil(c.expirationDate); return d !== null && d <= 90 })
  const expired = displayCerts.filter(c => { const d = daysUntil(c.expirationDate); return d !== null && d < 0 })

  const save = () => {
    if (!form.name) return
    if (editId) {
      dispatch({ type: ACTIONS.UPDATE_CERTIFICATION, payload: { id: editId, ...form } })
      setEditId(null)
    } else {
      dispatch({ type: ACTIONS.ADD_CERTIFICATION, payload: form })
    }
    setForm(BLANK)
    setShowForm(false)
  }

  const startEdit = (c) => { setForm({ name: c.name, holder: c.holder, issuingBody: c.issuingBody, certNumber: c.certNumber, issueDate: c.issueDate, expirationDate: c.expirationDate, notes: c.notes ?? '' }); setEditId(c.id ?? null); setShowForm(true) }

  const del = (id) => { if (!id) return; if (window.confirm('Delete this certification?')) dispatch({ type: ACTIONS.DELETE_CERTIFICATION, payload: { id } }) }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BadgeCheck size={18} className="text-red-500" /> Certification Tracker
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Track all professional certifications with expiration alerts.</p>
          </div>
          <button onClick={() => { setForm(BLANK); setEditId(null); setShowForm(s => !s) }}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl">
            <Plus size={14} /> Add Cert
          </button>
        </div>

        {(expiring.length > 0 || expired.length > 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <span className="font-bold">Attention: </span>
              {expired.length > 0 && <span>{expired.length} cert{expired.length !== 1 ? 's' : ''} expired. </span>}
              {expiring.filter(c => daysUntil(c.expirationDate) >= 0).length > 0 && <span>{expiring.filter(c => daysUntil(c.expirationDate) >= 0).length} cert{expiring.filter(c => daysUntil(c.expirationDate) >= 0).length !== 1 ? 's' : ''} expiring within 90 days.</span>}
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-blue-900">{editId ? 'Edit Certification' : 'New Certification'}</h3>
              <button onClick={() => { setShowForm(false); setEditId(null) }}><X size={16} className="text-blue-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Certification Name</label>
                <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Water Restoration Technician (WRT)"
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Holder Name</label>
                <input value={form.holder} onChange={e => f('holder', e.target.value)}
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Issuing Body</label>
                <input value={form.issuingBody} onChange={e => f('issuingBody', e.target.value)} placeholder="e.g. IICRC, OSHA, EPA"
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Certificate Number</label>
                <input value={form.certNumber} onChange={e => f('certNumber', e.target.value)}
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Issue Date</label>
                <input type="date" value={form.issueDate} onChange={e => f('issueDate', e.target.value)}
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Expiration Date</label>
                <input type="date" value={form.expirationDate} onChange={e => f('expirationDate', e.target.value)}
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Notes</label>
                <input value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Renewal requirements, CECs needed, etc."
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl">
                {editId ? 'Save Changes' : 'Add Certification'}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null) }} className="bg-white border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {displayCerts.map((c, idx) => {
            const days = daysUntil(c.expirationDate)
            const st = certStatus(days)
            return (
              <div key={c.id ?? idx} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${st.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">{c.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{c.holder} · {c.issuingBody}{c.certNumber ? ` · #${c.certNumber}` : ''}</div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        {c.issueDate && <span>Issued: {new Date(c.issueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                        {c.expirationDate && <span>Expires: {new Date(c.expirationDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                      </div>
                      {c.notes && <div className="text-xs text-gray-400 mt-1 italic">{c.notes}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${st.color}`}>{st.label}</span>
                    <button onClick={() => startEdit(c)} className="p-1.5 text-gray-400 hover:text-gray-700"><Edit2 size={13} /></button>
                    {c.id && <button onClick={() => del(c.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>}
                  </div>
                </div>
              </div>
            )
          })}
          {displayCerts.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <BadgeCheck size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No certifications added yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
