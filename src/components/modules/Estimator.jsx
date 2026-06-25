import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import {
  computeEstimateTotals, formatCurrency, formatCurrencyExact,
  estimateStatusColor,
} from '../../utils/helpers'
import {
  SQFT_RATE_PRESETS, EQUIPMENT_PRESETS, LAB_PRESETS,
  LABOR_PRESETS, STANDARD_TERMS,
} from '../../data/proposalTemplates'
import { Plus, Trash2, Send, CheckCircle, XCircle, FileText, ChevronRight, User } from 'lucide-react'

const BLANK_ESTIMATE = {
  status: 'Draft',
  sentAt: null,
  templateId: null,
  scopeNotes: '',
  termsNotes: STANDARD_TERMS,
  sqftItems: [],
  equipmentItems: [],
  labItems: [],
  materialItems: [],
  laborItems: [],
  xactimateItems: [],
  flatFeeItems: [],
  overheadMarginPct: 25,
  taxPct: 0,
}

const FLAT_FEE_PRESETS = [
  { _label: 'Dump Fee $125', description: 'Dump Fee', amount: 125 },
  { _label: 'Travel / Mobilization $75', description: 'Travel / Mobilization', amount: 75 },
  { _label: 'Permit $200', description: 'Permit', amount: 200 },
  { _label: 'Rush / Emergency $250', description: 'Rush / Emergency Service', amount: 250 },
  { _label: 'Equipment Storage $100', description: 'Equipment Storage', amount: 100 },
  { _label: 'Disposal Fee $150', description: 'Material Disposal Fee', amount: 150 },
]

const BLANK_EXISTING = { clientId: '', address: '', type: 'Mold' }

const BLANK_NEW = { name: '', phone: '', email: '', address: '', type: 'Mold' }

function uid() { return crypto.randomUUID() }

// ── Totals sidebar ────────────────────────────────────────────────────────────
function TotalsPanel({ estimate, onMarginChange, onTaxChange }) {
  const t = computeEstimateTotals(estimate)
  const rows = [
    { label: 'Sq Ft / Area', val: t.sqftTotal },
    { label: 'Equipment', val: t.equipTotal },
    { label: 'Lab Testing', val: t.labTotal },
    { label: 'Materials', val: t.matTotal },
    { label: 'Labor', val: t.laborTotal },
    { label: 'Xactimate', val: t.xactTotal },
    { label: 'Flat Fees', val: t.flatTotal },
  ].filter(r => r.val > 0)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 sticky top-4">
      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Estimate Totals</h3>
      {rows.map(r => (
        <div key={r.label} className="flex justify-between text-sm">
          <span className="text-gray-500">{r.label}</span>
          <span className="text-gray-700">{formatCurrency(r.val)}</span>
        </div>
      ))}
      {rows.length > 0 && (
        <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2">
          <span className="text-gray-700">Subtotal</span>
          <span className="text-gray-900">{formatCurrency(t.subtotal)}</span>
        </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Margin</span>
        <div className="flex items-center gap-1">
          <input
            type="number" min="0" max="100"
            value={estimate.overheadMarginPct ?? 25}
            onChange={e => onMarginChange(Number(e.target.value))}
            className="w-14 border border-gray-200 rounded px-2 py-0.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-red-400"
          />
          <span className="text-xs text-gray-400">%</span>
          <span className="text-gray-700 w-20 text-right">{t.margin > 0 ? formatCurrency(t.margin) : '—'}</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Tax</span>
        <div className="flex items-center gap-1">
          <input
            type="number" min="0" max="20"
            value={estimate.taxPct ?? 0}
            onChange={e => onTaxChange(Number(e.target.value))}
            className="w-14 border border-gray-200 rounded px-2 py-0.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-red-400"
          />
          <span className="text-xs text-gray-400">%</span>
          <span className="text-gray-700 w-20 text-right">{t.tax > 0 ? formatCurrency(t.tax) : '—'}</span>
        </div>
      </div>
      <div className="flex justify-between text-base font-black border-t-2 border-gray-900 pt-2">
        <span className="text-gray-900">Grand Total</span>
        <span className="text-red-700">{formatCurrencyExact(t.grandTotal)}</span>
      </div>
    </div>
  )
}

// ── Line item table ───────────────────────────────────────────────────────────
function LineTable({ rows, columns, onDelete }) {
  if (!rows?.length) return null
  return (
    <table className="w-full text-sm mb-3">
      <thead>
        <tr>
          {columns.map(c => (
            <th key={c.key} className={`text-xs font-semibold text-gray-400 pb-1.5 ${c.align === 'right' ? 'text-right' : 'text-left'}`}>{c.label}</th>
          ))}
          <th className="w-8" />
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((row, i) => (
          <tr key={row.id ?? i} className="group">
            {columns.map(c => (
              <td key={c.key} className={`py-2 text-gray-700 ${c.align === 'right' ? 'text-right pr-2' : 'pr-4'}`}>
                {c.format ? c.format(row[c.key], row) : row[c.key]}
              </td>
            ))}
            <td className="py-2 text-right">
              <button onClick={() => onDelete(row.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1">
                <Trash2 size={13} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Add row form ──────────────────────────────────────────────────────────────
function AddRow({ fields, onAdd, presets = [] }) {
  const [form, setForm] = useState(() => Object.fromEntries(fields.map(f => [f.key, f.default ?? ''])))
  const [open, setOpen] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleAdd = () => {
    const hasRequired = fields.filter(f => f.required).every(f => form[f.key])
    if (!hasRequired) return
    onAdd(form)
    setForm(Object.fromEntries(fields.map(f => [f.key, f.default ?? ''])))
    setOpen(false)
  }

  const applyPreset = (preset) => {
    setForm(f => ({ ...f, ...preset }))
    setOpen(true)
  }

  return (
    <div>
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {presets.map((p, i) => (
            <button key={i} onClick={() => applyPreset(p)} className="text-xs bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-600 px-2.5 py-1 rounded-full transition-colors">
              + {p._label}
            </button>
          ))}
        </div>
      )}
      {open ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(fields.length, 4)}, 1fr)` }}>
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">{f.label}{f.required ? ' *' : ''}</label>
                <input
                  type={f.type ?? 'text'}
                  value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder ?? ''}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={handleAdd} className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">Add</button>
            <button onClick={() => setOpen(false)} className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-semibold py-1">
          <Plus size={13} /> Add Line Item
        </button>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'sqft', label: 'Sq Footage' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'lab', label: 'Lab Testing' },
  { id: 'materials', label: 'Materials' },
  { id: 'labor', label: 'Labor' },
  { id: 'xactimate', label: 'Xactimate' },
  { id: 'flatfees', label: 'Flat Fees' },
  { id: 'scope', label: 'Scope & Terms' },
]

export default function Estimator({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()
  const [local, setLocal] = useState(null)
  const [activeTab, setActiveTab] = useState('sqft')
  const [saved, setSaved] = useState(false)
  const [newForm, setNewForm] = useState(BLANK_NEW)
  const [showNewForm, setShowNewForm] = useState(false)
  const [landingMode, setLandingMode] = useState('new')
  const [existingForm, setExistingForm] = useState(BLANK_EXISTING)

  const job = selectedJobId ? state.jobs.find(j => j.id === selectedJobId) : null
  const client = job ? state.clients.find(c => c.id === job.clientId) : null
  const jobType = job?.type ?? 'Mold'

  useEffect(() => {
    if (job) setLocal({ ...BLANK_ESTIMATE, ...(job.estimate ?? {}) })
    else setLocal(null)
  }, [selectedJobId, job?.estimate?.updatedAt])

  const update = useCallback((patch) => {
    setLocal(e => ({ ...e, ...patch }))
    setSaved(false)
  }, [])

  const save = useCallback(() => {
    if (!local || !selectedJobId) return
    const totals = computeEstimateTotals(local)
    dispatch({ type: ACTIONS.SAVE_ESTIMATE, payload: { jobId: selectedJobId, estimate: { ...local, grandTotal: totals.grandTotal } } })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [local, selectedJobId, dispatch])

  const addItem = (category, item) => update({ [category]: [...(local?.[category] ?? []), { id: uid(), ...item }] })
  const deleteItem = (category, id) => update({ [category]: (local?.[category] ?? []).filter(r => r.id !== id) })

  const sendEstimate = () => {
    save()
    const sentAt = new Date().toISOString()
    dispatch({ type: ACTIONS.UPDATE_ESTIMATE_STATUS, payload: { jobId: selectedJobId, status: 'Sent', sentAt } })
    setLocal(e => ({ ...e, status: 'Sent', sentAt }))
  }

  const startExisting = () => {
    if (!existingForm.clientId) return
    const jobId = uid()
    dispatch({
      type: ACTIONS.ADD_JOB,
      payload: { id: jobId, clientId: existingForm.clientId, type: existingForm.type, address: existingForm.address, stage: 'Lead', revenue: 0 },
    })
    setSelectedJobId(jobId)
    setExistingForm(BLANK_EXISTING)
  }

  const startNew = () => {
    if (!newForm.name.trim()) return
    const clientId = uid()
    const jobId = uid()
    dispatch({
      type: ACTIONS.ADD_CLIENT,
      payload: { id: clientId, name: newForm.name.trim(), phone: newForm.phone, email: newForm.email, type: 'Homeowner', communications: [], isVIP: false },
    })
    dispatch({
      type: ACTIONS.ADD_JOB,
      payload: { id: jobId, clientId, type: newForm.type, address: newForm.address, stage: 'Lead', revenue: 0, notes: [], photos: [], documents: [], waivers: [], timeLogs: [], checklist: [], oshaChecklist: [], estimate: null, invoice: null, insurance: null, subcontractors: [], expenses: [] },
    })
    setSelectedJobId(jobId)
    setShowNewForm(false)
    setNewForm(BLANK_NEW)
  }

  // ── Sqft presets — SQFT_RATE_PRESETS is an object keyed by job type ──
  const sqftPresets = (SQFT_RATE_PRESETS[jobType] ?? []).map(p => ({
    _label: p.description,
    description: p.description,
    ratePerSqft: p.ratePerSqft,
    sqft: '',
  }))

  // ── Equipment presets ──
  const equipPresets = EQUIPMENT_PRESETS.map(p => ({
    _label: `${p.name} / ${p.unit}`,
    name: p.name,
    qty: 1,
    unit: p.unit,
    unitPrice: p.unitPrice,
  }))

  // ── Lab presets ──
  const labPresets = LAB_PRESETS.map(p => ({
    _label: p.description,
    description: p.description,
    qty: 1,
    unitPrice: p.unitPrice,
  }))

  // ── Labor presets ──
  const laborPresets = LABOR_PRESETS.map(p => ({
    _label: `${p.trade} ($${p.ratePerHour}/hr)`,
    trade: p.trade,
    hours: '',
    ratePerHour: p.ratePerHour,
  }))

  // ── No job selected: landing screen ──────────────────────────────────────
  if (!selectedJobId || !local) {
    const InputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500'
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-xl mx-auto p-8 space-y-6">
          {/* Mode toggle */}
          <div className="flex gap-2">
            {[{ id: 'new', label: 'New Customer' }, { id: 'existing', label: 'Existing Customer' }].map(m => (
              <button
                key={m.id}
                onClick={() => { setLandingMode(m.id); setShowNewForm(false) }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors ${landingMode === m.id ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* New Customer form */}
          {landingMode === 'new' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-base font-bold text-gray-900 mb-1">Start a New Estimate</h2>
              <p className="text-sm text-gray-500 mb-5">Enter customer info — we'll create the job record for you</p>
              {!showNewForm ? (
                <button onClick={() => setShowNewForm(true)} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-3 rounded-xl transition-colors">
                  <Plus size={16} /> New Estimate
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Customer Name *</label>
                    <input autoFocus value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="John & Jane Smith" className={InputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                      <input value={newForm.phone} onChange={e => setNewForm(f => ({ ...f, phone: e.target.value }))} placeholder="(720) 555-0000" className={InputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                      <input value={newForm.email} onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className={InputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Property Address</label>
                    <input value={newForm.address} onChange={e => setNewForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St, Denver CO" className={InputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Job Type</label>
                    <div className="flex gap-2">
                      {['Mold', 'Water', 'Fire'].map(t => (
                        <button key={t} onClick={() => setNewForm(f => ({ ...f, type: t }))} className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${newForm.type === t ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={startNew} disabled={!newForm.name.trim()} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-sm py-2.5 rounded-xl transition-colors">Start Estimating</button>
                    <button onClick={() => { setShowNewForm(false); setNewForm(BLANK_NEW) }} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Existing Customer form */}
          {landingMode === 'existing' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-base font-bold text-gray-900 mb-1">Estimate for Existing Customer</h2>
              <p className="text-sm text-gray-500 mb-5">Select a customer from your CRM — we'll create a new job for them</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Customer *</label>
                  <select value={existingForm.clientId} onChange={e => setExistingForm(f => ({ ...f, clientId: e.target.value }))} className={InputCls}>
                    <option value="">Choose a customer…</option>
                    {state.clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Property Address</label>
                  <input value={existingForm.address} onChange={e => setExistingForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St, Denver CO" className={InputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Job Type</label>
                  <div className="flex gap-2">
                    {['Mold', 'Water', 'Fire'].map(t => (
                      <button key={t} onClick={() => setExistingForm(f => ({ ...f, type: t }))} className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${existingForm.type === t ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <button onClick={startExisting} disabled={!existingForm.clientId} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-sm py-2.5 rounded-xl transition-colors">
                  Start Estimating
                </button>
              </div>
            </div>
          )}

          {/* Open existing job */}
          {state.jobs.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Open Existing Job Estimate</h3>
              <select onChange={e => setSelectedJobId(e.target.value || null)} className={InputCls}>
                <option value="">Select a job…</option>
                {state.jobs.map(j => {
                  const c = state.clients.find(x => x.id === j.clientId)
                  const hasEst = j.estimate ? ` (${j.estimate.status})` : ' (no estimate)'
                  return <option key={j.id} value={j.id}>{j.type} — {c?.name}{hasEst}</option>
                })}
              </select>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Job selected: estimator ───────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex gap-6">
          {/* Main panel */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Job selector + status */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                <span className="font-semibold text-gray-900 text-sm">{client?.name}</span>
                <span className="text-xs text-gray-500">— {job.type}</span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${estimateStatusColor(local.status)}`}>{local.status}</span>
              <div className="ml-auto flex gap-2">
                <button onClick={() => setSelectedJobId(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100">← Back</button>
                <button onClick={() => navigateTo?.('proposals')} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100">Templates</button>
                <button
                  onClick={save}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${saved ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  {saved ? '✓ Saved' : 'Save Draft'}
                </button>
              </div>
            </div>

            {/* Status action bar */}
            {local.status === 'Draft' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-blue-800">After delivering the quote manually, log it here.</span>
                <button onClick={sendEstimate} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                  <Send size={13} /> Mark as Sent
                </button>
              </div>
            )}
            {local.status === 'Sent' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-yellow-800">Waiting for client response…</span>
                <div className="flex gap-2">
                  <button onClick={() => { dispatch({ type: ACTIONS.UPDATE_ESTIMATE_STATUS, payload: { jobId: selectedJobId, status: 'Approved' } }); setLocal(e => ({ ...e, status: 'Approved' })) }} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                    <CheckCircle size={12} /> Approved
                  </button>
                  <button onClick={() => { dispatch({ type: ACTIONS.UPDATE_ESTIMATE_STATUS, payload: { jobId: selectedJobId, status: 'Declined' } }); setLocal(e => ({ ...e, status: 'Declined' })) }} className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                    <XCircle size={12} /> Declined
                  </button>
                </div>
              </div>
            )}
            {local.status === 'Approved' && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-green-800 font-semibold">Estimate approved — {formatCurrencyExact(computeEstimateTotals(local).grandTotal)}</span>
                <button onClick={() => navigateTo?.('invoicing')} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                  Convert to Invoice <ChevronRight size={13} />
                </button>
              </div>
            )}

            {/* Category tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              {activeTab === 'sqft' && (
                <>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Square Footage / Area Pricing</h3>
                  <LineTable
                    rows={local.sqftItems}
                    columns={[
                      { key: 'description', label: 'Description' },
                      { key: 'sqft', label: 'Sq Ft', align: 'right', format: v => (v ?? 0).toLocaleString() },
                      { key: 'ratePerSqft', label: 'Rate/SF', align: 'right', format: v => formatCurrencyExact(v) },
                      { key: '_total', label: 'Total', align: 'right', format: (_, r) => formatCurrency((r.sqft ?? 0) * (r.ratePerSqft ?? 0)) },
                    ]}
                    onDelete={id => deleteItem('sqftItems', id)}
                  />
                  <AddRow
                    presets={sqftPresets}
                    fields={[
                      { key: 'description', label: 'Description', required: true, placeholder: 'Mold remediation — basement' },
                      { key: 'sqft', label: 'Sq Ft', type: 'number', placeholder: '0' },
                      { key: 'ratePerSqft', label: 'Rate / SF ($)', type: 'number', placeholder: '0.00' },
                    ]}
                    onAdd={item => addItem('sqftItems', { description: item.description, sqft: parseFloat(item.sqft) || 0, ratePerSqft: parseFloat(item.ratePerSqft) || 0 })}
                  />
                </>
              )}

              {activeTab === 'equipment' && (
                <>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Equipment</h3>
                  <LineTable
                    rows={local.equipmentItems}
                    columns={[
                      { key: 'name', label: 'Equipment' },
                      { key: 'qty', label: 'Qty', align: 'right' },
                      { key: 'unit', label: 'Unit' },
                      { key: 'unitPrice', label: 'Unit Price', align: 'right', format: v => formatCurrencyExact(v) },
                      { key: '_total', label: 'Total', align: 'right', format: (_, r) => formatCurrency((r.qty ?? 0) * (r.unitPrice ?? 0)) },
                    ]}
                    onDelete={id => deleteItem('equipmentItems', id)}
                  />
                  <AddRow
                    presets={equipPresets}
                    fields={[
                      { key: 'name', label: 'Equipment Name', required: true, placeholder: 'Dehumidifier' },
                      { key: 'qty', label: 'Qty', type: 'number', placeholder: '1' },
                      { key: 'unit', label: 'Unit', placeholder: 'day' },
                      { key: 'unitPrice', label: 'Unit Price ($)', type: 'number', placeholder: '0.00' },
                    ]}
                    onAdd={item => addItem('equipmentItems', { name: item.name, qty: parseFloat(item.qty) || 0, unit: item.unit, unitPrice: parseFloat(item.unitPrice) || 0 })}
                  />
                </>
              )}

              {activeTab === 'lab' && (
                <>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Lab Testing</h3>
                  <LineTable
                    rows={local.labItems}
                    columns={[
                      { key: 'description', label: 'Test Type' },
                      { key: 'qty', label: 'Qty', align: 'right' },
                      { key: 'unitPrice', label: 'Unit Price', align: 'right', format: v => formatCurrencyExact(v) },
                      { key: '_total', label: 'Total', align: 'right', format: (_, r) => formatCurrency((r.qty ?? 0) * (r.unitPrice ?? 0)) },
                    ]}
                    onDelete={id => deleteItem('labItems', id)}
                  />
                  <AddRow
                    presets={labPresets}
                    fields={[
                      { key: 'description', label: 'Test Description', required: true, placeholder: 'ERMI Test' },
                      { key: 'qty', label: 'Qty', type: 'number', placeholder: '1' },
                      { key: 'unitPrice', label: 'Price ($)', type: 'number', placeholder: '0.00' },
                    ]}
                    onAdd={item => addItem('labItems', { description: item.description, qty: parseFloat(item.qty) || 0, unitPrice: parseFloat(item.unitPrice) || 0 })}
                  />
                </>
              )}

              {activeTab === 'materials' && (
                <>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Materials</h3>
                  <LineTable
                    rows={local.materialItems}
                    columns={[
                      { key: 'description', label: 'Material' },
                      { key: 'qty', label: 'Qty', align: 'right' },
                      { key: 'unitPrice', label: 'Unit Price', align: 'right', format: v => formatCurrencyExact(v) },
                      { key: '_total', label: 'Total', align: 'right', format: (_, r) => formatCurrency((r.qty ?? 0) * (r.unitPrice ?? 0)) },
                    ]}
                    onDelete={id => deleteItem('materialItems', id)}
                  />
                  <AddRow
                    presets={[]}
                    fields={[
                      { key: 'description', label: 'Material Description', required: true, placeholder: 'Antimicrobial spray' },
                      { key: 'qty', label: 'Qty', type: 'number', placeholder: '1' },
                      { key: 'unitPrice', label: 'Unit Price ($)', type: 'number', placeholder: '0.00' },
                    ]}
                    onAdd={item => addItem('materialItems', { description: item.description, qty: parseFloat(item.qty) || 0, unitPrice: parseFloat(item.unitPrice) || 0 })}
                  />
                </>
              )}

              {activeTab === 'labor' && (
                <>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Labor</h3>
                  <LineTable
                    rows={local.laborItems}
                    columns={[
                      { key: 'trade', label: 'Trade / Role' },
                      { key: 'hours', label: 'Hours', align: 'right' },
                      { key: 'ratePerHour', label: 'Rate/Hr', align: 'right', format: v => formatCurrencyExact(v) },
                      { key: '_total', label: 'Total', align: 'right', format: (_, r) => formatCurrency((r.hours ?? 0) * (r.ratePerHour ?? 0)) },
                    ]}
                    onDelete={id => deleteItem('laborItems', id)}
                  />
                  <AddRow
                    presets={laborPresets}
                    fields={[
                      { key: 'trade', label: 'Trade / Role', required: true, placeholder: 'Lead Technician' },
                      { key: 'hours', label: 'Hours', type: 'number', placeholder: '8' },
                      { key: 'ratePerHour', label: 'Rate/Hr ($)', type: 'number', placeholder: '75.00' },
                    ]}
                    onAdd={item => addItem('laborItems', { trade: item.trade, hours: parseFloat(item.hours) || 0, ratePerHour: parseFloat(item.ratePerHour) || 0 })}
                  />
                </>
              )}

              {activeTab === 'xactimate' && (
                <>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Xactimate Line Items</h3>
                  <LineTable
                    rows={local.xactimateItems}
                    columns={[
                      { key: 'code', label: 'Code' },
                      { key: 'description', label: 'Description' },
                      { key: 'qty', label: 'Qty', align: 'right' },
                      { key: 'unit', label: 'Unit' },
                      { key: 'unitPrice', label: 'Unit Price', align: 'right', format: v => formatCurrencyExact(v) },
                      { key: '_total', label: 'Total', align: 'right', format: (_, r) => formatCurrency((r.qty ?? 0) * (r.unitPrice ?? 0)) },
                    ]}
                    onDelete={id => deleteItem('xactimateItems', id)}
                  />
                  <AddRow
                    presets={[]}
                    fields={[
                      { key: 'code', label: 'Xact Code', placeholder: 'WTR DRYOUT' },
                      { key: 'description', label: 'Description', required: true, placeholder: 'Water dryout — per room' },
                      { key: 'qty', label: 'Qty', type: 'number', placeholder: '1' },
                      { key: 'unit', label: 'Unit', placeholder: 'EA' },
                      { key: 'unitPrice', label: 'Unit Price ($)', type: 'number', placeholder: '0.00' },
                    ]}
                    onAdd={item => addItem('xactimateItems', { code: item.code, description: item.description, qty: parseFloat(item.qty) || 0, unit: item.unit, unitPrice: parseFloat(item.unitPrice) || 0 })}
                  />
                </>
              )}

              {activeTab === 'flatfees' && (
                <>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Flat Fees</h3>
                  <p className="text-xs text-gray-500 mb-3">Fixed charges like dump fees, travel, permits, or rush charges. These are added directly to the subtotal.</p>
                  <LineTable
                    rows={local.flatFeeItems}
                    columns={[
                      { key: 'description', label: 'Description' },
                      { key: 'amount', label: 'Amount', align: 'right', format: v => formatCurrencyExact(v) },
                    ]}
                    onDelete={id => deleteItem('flatFeeItems', id)}
                  />
                  <AddRow
                    presets={FLAT_FEE_PRESETS}
                    fields={[
                      { key: 'description', label: 'Description', required: true, placeholder: 'Dump Fee' },
                      { key: 'amount', label: 'Amount ($)', type: 'number', placeholder: '125.00' },
                    ]}
                    onAdd={item => addItem('flatFeeItems', { description: item.description, amount: parseFloat(item.amount) || 0 })}
                  />
                </>
              )}

              {activeTab === 'scope' && (
                <>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Scope of Work</h3>
                  <textarea
                    value={local.scopeNotes}
                    onChange={e => update({ scopeNotes: e.target.value })}
                    rows={8}
                    placeholder="Describe the full scope of work to be performed…"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-5"
                  />
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Terms & Conditions</h3>
                  <textarea
                    value={local.termsNotes}
                    onChange={e => update({ termsNotes: e.target.value })}
                    rows={8}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                </>
              )}
            </div>

            {/* Bottom save + quote buttons */}
            <div className="flex gap-3 flex-wrap">
              <button onClick={save} className={`font-semibold text-sm px-5 py-2 rounded-lg transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                {saved ? '✓ Saved' : 'Save Estimate'}
              </button>
              <button onClick={() => { save(); navigateTo?.('quote') }} className="flex items-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold text-sm px-4 py-2 rounded-lg">
                <FileText size={14} /> Generate Quote PDF
              </button>
            </div>
          </div>

          {/* Totals sidebar */}
          <div className="w-64 flex-shrink-0">
            <TotalsPanel
              estimate={local}
              onMarginChange={v => update({ overheadMarginPct: v })}
              onTaxChange={v => update({ taxPct: v })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
