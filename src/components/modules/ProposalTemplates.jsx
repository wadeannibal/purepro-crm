import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { PROPOSAL_TEMPLATES } from '../../data/proposalTemplates'
import { computeEstimateTotals, formatCurrency } from '../../utils/helpers'
import { Edit2, Plus, Trash2, ChevronRight, X } from 'lucide-react'

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
  sqftItems: [],
  equipmentItems: [],
  labItems: [],
  materialItems: [],
  laborItems: [],
  xactimateItems: [],
  flatFeeItems: [],
}

const uid = () => crypto.randomUUID()
const InputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500'

// Compact inline add row for template line items
function MiniAdd({ fields, onAdd }) {
  const [vals, setVals] = useState(() => Object.fromEntries(fields.map(f => [f.key, ''])))
  const [open, setOpen] = useState(false)

  const handleAdd = () => {
    if (!vals[fields[0].key]) return
    onAdd(vals)
    setVals(Object.fromEntries(fields.map(f => [f.key, ''])))
    setOpen(false)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 mt-1.5">
      <Plus size={11} /> Add
    </button>
  )

  return (
    <div className="mt-2 flex gap-1 items-end flex-wrap">
      {fields.map(f => (
        <input
          key={f.key}
          type={f.type ?? 'text'}
          value={vals[f.key]}
          onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))}
          placeholder={f.placeholder}
          className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
          style={{ width: f.width ?? '120px' }}
        />
      ))}
      <button onClick={handleAdd} className="bg-red-600 text-white text-xs px-2 py-1 rounded">OK</button>
      <button onClick={() => setOpen(false)} className="text-gray-400 text-xs px-1 py-1 hover:text-gray-600">✕</button>
    </div>
  )
}

// Inline editor for a template
function TemplateEditor({ template, onSave, onCancel, onDelete, isNew }) {
  const [form, setForm] = useState({ ...template })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const addItem = (cat, item) => set(cat, [...(form[cat] ?? []), { id: uid(), ...item }])
  const removeItem = (cat, id) => set(cat, (form[cat] ?? []).filter(i => i.id !== id))

  const CATEGORIES = [
    {
      key: 'sqftItems',
      label: 'Sq Footage',
      renderRow: i => <><span className="truncate flex-1 mr-2">{i.description}</span><span className="text-gray-400 mr-2 text-[11px]">${i.ratePerSqft}/sf</span></>,
      addFields: [
        { key: 'description', placeholder: 'Description', width: '140px' },
        { key: 'ratePerSqft', placeholder: '$/sf', type: 'number', width: '60px' },
      ],
      onAdd: v => addItem('sqftItems', { description: v.description, ratePerSqft: parseFloat(v.ratePerSqft) || 0 }),
    },
    {
      key: 'equipmentItems',
      label: 'Equipment',
      renderRow: i => <><span className="truncate flex-1 mr-2">{i.name}</span><span className="text-gray-400 mr-2 text-[11px]">${i.unitPrice}/{i.unit}</span></>,
      addFields: [
        { key: 'name', placeholder: 'Equipment', width: '110px' },
        { key: 'unitPrice', placeholder: '$/unit', type: 'number', width: '60px' },
        { key: 'unit', placeholder: 'unit', width: '50px' },
      ],
      onAdd: v => addItem('equipmentItems', { name: v.name, qty: 1, unit: v.unit || 'day', unitPrice: parseFloat(v.unitPrice) || 0 }),
    },
    {
      key: 'labItems',
      label: 'Lab Testing',
      renderRow: i => <><span className="truncate flex-1 mr-2">{i.description}</span><span className="text-gray-400 mr-2 text-[11px]">${i.unitPrice}</span></>,
      addFields: [
        { key: 'description', placeholder: 'Test name', width: '130px' },
        { key: 'unitPrice', placeholder: 'Price', type: 'number', width: '60px' },
      ],
      onAdd: v => addItem('labItems', { description: v.description, qty: 1, unitPrice: parseFloat(v.unitPrice) || 0 }),
    },
    {
      key: 'materialItems',
      label: 'Materials',
      renderRow: i => <><span className="truncate flex-1 mr-2">{i.description}</span><span className="text-gray-400 mr-2 text-[11px]">${i.unitPrice}</span></>,
      addFields: [
        { key: 'description', placeholder: 'Material', width: '130px' },
        { key: 'unitPrice', placeholder: 'Price', type: 'number', width: '60px' },
      ],
      onAdd: v => addItem('materialItems', { description: v.description, qty: 1, unitPrice: parseFloat(v.unitPrice) || 0 }),
    },
    {
      key: 'laborItems',
      label: 'Labor',
      renderRow: i => <><span className="truncate flex-1 mr-2">{i.trade}</span><span className="text-gray-400 mr-2 text-[11px]">${i.ratePerHour}/hr</span></>,
      addFields: [
        { key: 'trade', placeholder: 'Trade / Role', width: '120px' },
        { key: 'ratePerHour', placeholder: '$/hr', type: 'number', width: '60px' },
      ],
      onAdd: v => addItem('laborItems', { trade: v.trade, hours: 0, ratePerHour: parseFloat(v.ratePerHour) || 0 }),
    },
    {
      key: 'flatFeeItems',
      label: 'Flat Fees',
      renderRow: i => <><span className="truncate flex-1 mr-2">{i.description}</span><span className="text-gray-400 mr-2 text-[11px]">${i.amount}</span></>,
      addFields: [
        { key: 'description', placeholder: 'Dump Fee', width: '120px' },
        { key: 'amount', placeholder: 'Amount', type: 'number', width: '60px' },
      ],
      onAdd: v => addItem('flatFeeItems', { description: v.description, amount: parseFloat(v.amount) || 0 }),
    },
  ]

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

      {/* Line items */}
      <div>
        <div className="text-xs font-bold text-gray-700 mb-2">Default Line Items</div>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(cat => (
            <div key={cat.key} className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs font-bold text-gray-700 mb-2">{cat.label}</div>
              {(form[cat.key] ?? []).length === 0 && <div className="text-[11px] text-gray-400 mb-1">None</div>}
              {(form[cat.key] ?? []).map(i => (
                <div key={i.id} className="flex items-center text-xs py-0.5">
                  {cat.renderRow(i)}
                  <button onClick={() => removeItem(cat.key, i.id)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                    <X size={11} />
                  </button>
                </div>
              ))}
              <MiniAdd fields={cat.addFields} onAdd={cat.onAdd} />
            </div>
          ))}
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
    const estimate = {
      status: job.estimate?.status ?? 'Draft',
      sentAt: job.estimate?.sentAt ?? null,
      templateId: template.id,
      scopeNotes: template.scopeNotes,
      termsNotes: template.termsNotes,
      sqftItems: template.sqftItems ?? [],
      equipmentItems: template.equipmentItems ?? [],
      labItems: template.labItems ?? [],
      materialItems: template.materialItems ?? [],
      laborItems: template.laborItems ?? [],
      xactimateItems: template.xactimateItems ?? [],
      flatFeeItems: template.flatFeeItems ?? [],
      overheadMarginPct: job.estimate?.overheadMarginPct ?? 25,
      taxPct: job.estimate?.taxPct ?? 0,
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
            const totals = computeEstimateTotals({ ...template, overheadMarginPct: 25, taxPct: 0 })
            const isApplied = appliedId === template.id
            const isEditing = editingId === template.id

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
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          { label: 'Sq Ft', count: template.sqftItems?.length ?? 0 },
                          { label: 'Equipment', count: template.equipmentItems?.length ?? 0 },
                          { label: 'Lab Testing', count: template.labItems?.length ?? 0 },
                          { label: 'Materials', count: template.materialItems?.length ?? 0 },
                          { label: 'Labor', count: template.laborItems?.length ?? 0 },
                          { label: 'Flat Fees', count: template.flatFeeItems?.length ?? 0 },
                        ].filter(i => i.count > 0).map(item => (
                          <div key={item.label} className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                            <div className="text-base font-bold text-gray-900">{item.count}</div>
                            <div className="text-[10px] text-gray-500">{item.label}</div>
                          </div>
                        ))}
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
          Applying a template pre-fills the Estimator with line items, scope notes, and terms. You can customize all quantities and rates in the Estimator before sending.
        </div>
      </div>
    </div>
  )
}
