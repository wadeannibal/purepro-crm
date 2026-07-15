import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { PROPOSAL_TEMPLATES } from '../../data/proposalTemplates'
import { CATEGORIES, BUILT_IN_PRESETS, catLabel, catColor } from '../../data/lineItemLibrary'
import { computeEstimateTotals, formatCurrency, formatCurrencyExact } from '../../utils/helpers'
import { Edit2, Plus, Trash2, ChevronRight, X, Search, BookOpen } from 'lucide-react'

const JOB_TYPE_BADGE = {
  Mold: 'bg-green-100 text-green-800',
  Water: 'bg-blue-100 text-blue-800',
  Fire: 'bg-orange-100 text-orange-800',
}

const BLANK_TEMPLATE = {
  name: 'New Template',
  jobType: 'Mold',
  description: '',
  scopeNotes: '',
  termsNotes: '',
  lineItems: [],
}

const uid = () => crypto.randomUUID()
const InputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500'

// Convert old-format templates (still in saved state) to lineItems on apply
function convertOldToLineItems(template) {
  const items = []
  ;(template.equipmentItems ?? []).forEach(i => items.push({
    id: uid(), category: 'equipment', name: i.name ?? '', qty: i.qty ?? 1, unit: i.unit ?? 'EA', unitPrice: i.unitPrice ?? 0,
  }))
  ;(template.labItems ?? []).forEach(i => items.push({
    id: uid(), category: 'lab', name: i.description ?? i.name ?? '', qty: i.qty ?? 1, unit: 'EA', unitPrice: i.unitPrice ?? 0,
  }))
  ;(template.materialItems ?? []).forEach(i => items.push({
    id: uid(), category: 'materials', name: i.description ?? i.name ?? '', qty: i.qty ?? 1, unit: 'EA', unitPrice: i.unitPrice ?? 0,
  }))
  ;(template.laborItems ?? []).forEach(i => items.push({
    id: uid(), category: 'labor', name: i.trade ?? '', qty: i.hours ?? 0, unit: 'HR', unitPrice: i.ratePerHour ?? 0,
  }))
  ;(template.flatFeeItems ?? []).forEach(i => items.push({
    id: uid(), category: 'fees', name: i.description ?? '', qty: 1, unit: 'EA', unitPrice: i.amount ?? 0,
  }))
  ;(template.sqftItems ?? []).forEach(i => items.push({
    id: uid(), category: 'cleaning', name: i.description ?? '', qty: i.sqft ?? 0, unit: 'SF', unitPrice: i.ratePerSqft ?? 0,
  }))
  return items
}

// Mini library panel inside the template editor
function MiniLibrary({ onAdd }) {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')

  const filtered = BUILT_IN_PRESETS.filter(p => {
    const matchCat = filterCat === 'all' || p.category === filterCat
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={12} className="text-red-500 shrink-0" />
        <span className="text-xs font-bold text-gray-700">Add from Library</span>
        <span className="text-[10px] text-gray-400">— click any item to add</span>
      </div>
      <div className="relative mb-2">
        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search items…"
          className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
        />
      </div>
      <div className="flex gap-1 flex-wrap mb-2">
        <button onClick={() => setFilterCat('all')} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${filterCat === 'all' ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setFilterCat(c.id)} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${filterCat === c.id ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="max-h-44 overflow-y-auto space-y-0.5">
        {filtered.length === 0 && <div className="text-xs text-gray-400 py-2 text-center">No items match</div>}
        {filtered.map((p, i) => (
          <div
            key={i}
            onClick={() => onAdd({ id: uid(), category: p.category, name: p.name, unit: p.unit, unitPrice: p.unitPrice, qty: 1 })}
            className="flex items-center gap-2 bg-white hover:bg-red-50 border border-gray-100 hover:border-red-200 rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors"
          >
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${catColor(p.category)}`}>{catLabel(p.category)}</span>
            <span className="text-xs text-gray-800 flex-1 truncate">{p.name}</span>
            <span className="text-[10px] text-gray-400 shrink-0">{formatCurrencyExact(p.unitPrice)}/{p.unit}</span>
            <span className="text-[10px] font-semibold text-red-600 shrink-0">+ Add</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TemplateEditor({ template, onSave, onCancel, onDelete, isNew }) {
  const [form, setForm] = useState({ ...template })
  const [showLib, setShowLib] = useState(false)
  const [customForm, setCustomForm] = useState({ category: 'containment', name: '', unit: 'EA', unitPrice: '' })
  const [showCustom, setShowCustom] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const lineItems = form.lineItems ?? []

  const addItem = (item) => set('lineItems', [...lineItems, item])
  const removeItem = (id) => set('lineItems', lineItems.filter(i => i.id !== id))
  const updateItem = (id, patch) => set('lineItems', lineItems.map(i => i.id === id ? { ...i, ...patch } : i))

  const handleAddCustom = () => {
    if (!customForm.name.trim()) return
    addItem({ id: uid(), category: customForm.category, name: customForm.name.trim(), unit: customForm.unit || 'EA', unitPrice: parseFloat(customForm.unitPrice) || 0, qty: 1 })
    setCustomForm({ category: 'containment', name: '', unit: 'EA', unitPrice: '' })
    setShowCustom(false)
  }

  const subtotal = lineItems.reduce((s, i) => s + (i.qty ?? 0) * (i.unitPrice ?? 0), 0)

  return (
    <div className="border-t border-gray-100 pt-5 mt-2 space-y-4">
      {/* Name / Type / Description */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Template Name</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} className={InputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Job Type</label>
          <select value={form.jobType} onChange={e => set('jobType', e.target.value)} className={InputCls}>
            {['Mold', 'Water', 'Fire'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
        <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of when to use this template" className={InputCls} />
      </div>

      {/* Scope & Terms */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Scope of Work</label>
        <textarea value={form.scopeNotes} onChange={e => set('scopeNotes', e.target.value)} rows={5} className={`${InputCls} resize-none`} placeholder="Describe the typical scope for this job type…" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Terms & Conditions</label>
        <textarea value={form.termsNotes} onChange={e => set('termsNotes', e.target.value)} rows={3} className={`${InputCls} resize-none`} placeholder="Payment terms, warranty, deposit requirements…" />
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-gray-700">
            Default Line Items
            {lineItems.length > 0 && <span className="ml-1.5 text-gray-400 font-normal">({lineItems.length} items · {formatCurrencyExact(subtotal)})</span>}
          </div>
          <button
            onClick={() => { setShowLib(l => !l); setShowCustom(false) }}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${showLib ? 'bg-red-600 text-white' : 'border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600'}`}
          >
            <Plus size={11} /> Add from Library
          </button>
        </div>

        {showLib && <MiniLibrary onAdd={item => { addItem(item); setShowLib(false) }} />}

        {/* Current line items */}
        {lineItems.length === 0 && !showLib && (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400">
            No items — click "Add from Library" to build your template
          </div>
        )}
        {lineItems.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-3 py-1.5 grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <span style={{ minWidth: '64px' }}>Category</span>
              <span>Description</span>
              <span className="text-right w-10">Qty</span>
              <span className="text-center w-8">Unit</span>
              <span className="text-right w-16">Total</span>
              <span className="w-5" />
            </div>
            {lineItems.map(item => {
              const total = (item.qty ?? 0) * (item.unitPrice ?? 0)
              return (
                <div key={item.id} className="px-3 py-2 grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 items-center border-t border-gray-100 first:border-t-0">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${catColor(item.category)}`} style={{ minWidth: '64px' }}>
                    {catLabel(item.category)}
                  </span>
                  <span className="text-xs text-gray-800 truncate">{item.name}</span>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={e => updateItem(item.id, { qty: parseFloat(e.target.value) || 0 })}
                    className="w-10 text-xs text-right border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-red-400"
                  />
                  <span className="text-[10px] text-gray-400 w-8 text-center">{item.unit}</span>
                  <span className={`text-xs font-medium w-16 text-right ${total < 0 ? 'text-green-700' : 'text-gray-700'}`}>{formatCurrencyExact(total)}</span>
                  <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 w-5 flex justify-center">
                    <X size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Custom item form */}
        <div className="mt-2">
          {showCustom ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
              <div className="text-xs font-bold text-gray-700">Add Custom Item</div>
              <input
                autoFocus
                value={customForm.name}
                onChange={e => setCustomForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Item name *"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
              />
              <div className="grid grid-cols-3 gap-2">
                <select value={customForm.category} onChange={e => setCustomForm(f => ({ ...f, category: e.target.value }))} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500">
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <input value={customForm.unit} onChange={e => setCustomForm(f => ({ ...f, unit: e.target.value.toUpperCase() }))} placeholder="Unit" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-red-500" />
                <input type="number" value={customForm.unitPrice} onChange={e => setCustomForm(f => ({ ...f, unitPrice: e.target.value }))} placeholder="Price $" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddCustom} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1.5 rounded-lg">Add Item</button>
                <button onClick={() => setShowCustom(false)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setShowCustom(true); setShowLib(false) }} className="text-xs text-gray-500 hover:text-red-600 font-semibold flex items-center gap-1 mt-1">
              <Plus size={11} /> Add custom item
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button onClick={() => onSave(form)} className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-4 py-2 rounded-lg">
          Save Template
        </button>
        <button onClick={onCancel} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm px-4 py-2 rounded-lg">
          Cancel
        </button>
        {!isNew && (
          <button onClick={onDelete} className="ml-auto text-red-600 hover:bg-red-50 font-semibold text-sm px-4 py-2 rounded-lg border border-red-200">
            Delete Template
          </button>
        )}
      </div>
    </div>
  )
}

export default function ProposalTemplates({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()
  const [editingId, setEditingId] = useState(null)
  const [newForm, setNewForm] = useState(null)
  const [appliedId, setAppliedId] = useState(null)

  useEffect(() => {
    if (!state.proposalTemplates) {
      dispatch({ type: ACTIONS.INIT_TEMPLATES, payload: PROPOSAL_TEMPLATES })
    }
  }, [])

  const templates = state.proposalTemplates ?? PROPOSAL_TEMPLATES
  const job = selectedJobId ? state.jobs.find(j => j.id === selectedJobId) : null
  const client = job ? state.clients.find(c => c.id === job.clientId) : null

  const saveTemplate = (form) => {
    dispatch({ type: ACTIONS.SAVE_TEMPLATE, payload: form })
    setEditingId(null)
  }

  const addTemplate = (form) => {
    dispatch({ type: ACTIONS.ADD_TEMPLATE, payload: form })
    setNewForm(null)
  }

  const deleteTemplate = (id) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Delete this template? This cannot be undone.')) return
    dispatch({ type: ACTIONS.DELETE_TEMPLATE, payload: { id } })
    setEditingId(null)
  }

  const applyTemplate = (template) => {
    if (!selectedJobId) return
    // Support new lineItems format and old per-category format (legacy saved templates)
    const lineItems = Array.isArray(template.lineItems)
      ? template.lineItems
      : convertOldToLineItems(template)
    const estimate = {
      status: job.estimate?.status ?? 'Draft',
      sentAt: job.estimate?.sentAt ?? null,
      templateId: template.id,
      scopeNotes: template.scopeNotes,
      termsNotes: template.termsNotes,
      lineItems,
      overheadMarginPct: job.estimate?.overheadMarginPct ?? 25,
      taxPct: job.estimate?.taxPct ?? 0,
      discountPct: job.estimate?.discountPct ?? 0,
    }
    dispatch({ type: ACTIONS.SAVE_ESTIMATE, payload: { jobId: selectedJobId, estimate } })
    setAppliedId(template.id)
    setTimeout(() => setAppliedId(null), 2000)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-5">
        {/* Job selector */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-xs font-semibold text-gray-600 mb-2">Apply template to job</div>
          <div className="flex items-center gap-3">
            <select
              value={selectedJobId ?? ''}
              onChange={e => setSelectedJobId(e.target.value || null)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select a job to apply template to…</option>
              {state.jobs.map(j => {
                const c = state.clients.find(x => x.id === j.clientId)
                return <option key={j.id} value={j.id}>{j.type} — {c?.name} — {j.stage}</option>
              })}
            </select>
            {job && (
              <button onClick={() => navigateTo?.('estimator')} className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-semibold whitespace-nowrap">
                Open Estimator <ChevronRight size={13} />
              </button>
            )}
          </div>
          {job && (
            <div className="mt-2 text-xs text-gray-500">
              {client?.name} — Current estimate: {job.estimate ? `${job.estimate.status} (${formatCurrency(computeEstimateTotals(job.estimate).grandTotal)})` : 'None'}
            </div>
          )}
        </div>

        {/* Templates header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Templates ({templates.length})</h2>
          <button
            onClick={() => setNewForm({ ...BLANK_TEMPLATE, id: uid() })}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
          >
            <Plus size={13} /> New Template
          </button>
        </div>

        {/* New template editor */}
        {newForm && (
          <div className="bg-white border-2 border-red-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900 text-sm">New Template</h3>
              <button onClick={() => setNewForm(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={14} /></button>
            </div>
            <TemplateEditor
              template={newForm}
              isNew={true}
              onSave={addTemplate}
              onCancel={() => setNewForm(null)}
              onDelete={() => {}}
            />
          </div>
        )}

        {/* Template cards */}
        <div className="space-y-4">
          {templates.map(template => {
            const totals = computeEstimateTotals({ ...template, overheadMarginPct: 0, taxPct: 0, discountPct: 0 })
            const isApplied = appliedId === template.id
            const isEditing = editingId === template.id
            const isNewFormat = Array.isArray(template.lineItems)
            const itemCount = isNewFormat ? (template.lineItems?.length ?? 0) : (
              (template.equipmentItems?.length ?? 0) + (template.labItems?.length ?? 0) +
              (template.materialItems?.length ?? 0) + (template.laborItems?.length ?? 0) +
              (template.flatFeeItems?.length ?? 0) + (template.sqftItems?.length ?? 0)
            )

            return (
              <div key={template.id} className={`bg-white border rounded-2xl overflow-hidden ${isEditing ? 'border-red-300 shadow-sm' : 'border-gray-200'}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{template.name}</h3>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${JOB_TYPE_BADGE[template.jobType] ?? 'bg-gray-100 text-gray-600'}`}>{template.jobType}</span>
                      </div>
                      <p className="text-sm text-gray-500">{template.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Starting from</div>
                        <div className="text-lg font-bold text-gray-900">{formatCurrency(totals.subtotal)}</div>
                      </div>
                      <button
                        onClick={() => setEditingId(isEditing ? null : template.id)}
                        title={isEditing ? 'Close editor' : 'Edit template'}
                        className={`p-2 rounded-lg transition-colors ${isEditing ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>

                  {!isEditing && (
                    <>
                      <div className="flex gap-2 mb-4 flex-wrap">
                        <div className="bg-gray-50 rounded-lg px-3 py-2 text-center min-w-[72px]">
                          <div className="text-base font-bold text-gray-900">{itemCount}</div>
                          <div className="text-[10px] text-gray-500">Line Items</div>
                        </div>
                        {totals.subtotal > 0 && (
                          <div className="bg-gray-50 rounded-lg px-3 py-2 text-center min-w-[72px]">
                            <div className="text-base font-bold text-gray-900">{formatCurrency(totals.subtotal)}</div>
                            <div className="text-[10px] text-gray-500">Base Price</div>
                          </div>
                        )}
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 mb-4">
                        <div className="text-xs font-semibold text-gray-600 mb-1">Scope Preview</div>
                        <p className="text-xs text-gray-600 line-clamp-3">{template.scopeNotes || <em className="text-gray-400">No scope notes</em>}</p>
                      </div>
                      <button
                        onClick={() => applyTemplate(template)}
                        disabled={!selectedJobId}
                        className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                          isApplied ? 'bg-green-600 text-white'
                            : selectedJobId ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isApplied ? '✓ Template Applied!'
                          : selectedJobId ? `Apply to ${client?.name ?? 'Selected Job'}`
                          : 'Select a job above to apply'}
                      </button>
                    </>
                  )}

                  {isEditing && (
                    <TemplateEditor
                      template={template}
                      isNew={false}
                      onSave={saveTemplate}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => deleteTemplate(template.id)}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
          Applying a template pre-fills the Estimator with line items, scope notes, and terms. Customize all quantities and rates in the Estimator before sending.
        </div>
      </div>
    </div>
  )
}
