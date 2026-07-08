import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { Swords, Plus, Edit2, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react'

const BLANK = {
  name: '', website: '', serviceArea: '', certifications: '',
  pricing: '', strengths: '', weaknesses: '', talkingPoints: '', notes: ''
}

const FIELDS = [
  { key: 'website', label: 'Website' },
  { key: 'serviceArea', label: 'Service Area' },
  { key: 'certifications', label: 'Certifications / Claims' },
  { key: 'pricing', label: 'Pricing Notes' },
]

const DEFAULT_COMPETITORS = [
  {
    id: 'comp-servpro',
    name: 'SERVPRO (local franchise)',
    website: 'servpro.com',
    serviceArea: 'Metro Denver',
    certifications: 'IICRC, franchise-backed',
    pricing: 'High — national brand premium',
    strengths: 'Brand recognition, 24/7 availability, insurance relationships, large fleet',
    weaknesses: 'Franchise quality varies, less personalized, may sub out mold work, slower on clearance testing, less CIRS-focused',
    talkingPoints: `SERVPRO is a solid brand but franchise quality is inconsistent. We're owner-operated — when you work with PurePro, you work with Wade directly, start to finish.\n\nWe include ERMI clearance testing in every job. Ask SERVPRO if their estimate includes post-remediation testing. Often it doesn't.\n\nFor mold-sensitive or CIRS clients specifically, we have deep familiarity with ERMI/HERTSMI protocols and documentation that supports clinical care. That's not a franchise specialty.`,
    notes: 'Insurance adjusters often refer directly to SERVPRO. Counter with documentation quality and direct owner access.'
  },
  {
    id: 'comp-pauldevis',
    name: 'Paul Davis Restoration',
    website: 'pauldavis.com',
    serviceArea: 'Metro Denver',
    certifications: 'IICRC, franchise-backed',
    pricing: 'High — national brand premium',
    strengths: 'Brand recognition, full-service (restoration + rebuild), insurance billing, commercial capacity',
    weaknesses: 'Mold is a secondary service (primary is fire/flood restoration), less specialized, can feel corporate',
    talkingPoints: `Paul Davis is a full-service restoration company — mold isn't their specialty, it's one of many services. We focus exclusively on mold and water damage, which means deeper expertise and better outcomes.\n\nTheir rebuild capability is their selling point. Ours is remediation precision. If clearance testing matters to you — and it should — we're the right call.\n\nOwner-operated, you'll have Wade's direct cell, not a call center.`,
    notes: 'Often the second name insurance adjusters mention after SERVPRO. Position as: specialist vs generalist.'
  },
  {
    id: 'comp-roto',
    name: 'Roto-Rooter Restoration',
    website: 'rotorooter.com',
    serviceArea: 'Metro Denver + Front Range',
    certifications: 'Mixed — varies by tech',
    pricing: 'Moderate — volume pricing',
    strengths: 'Brand recognition from plumbing side, fast mobilization, large staff',
    weaknesses: 'Restoration is a secondary business (primary is plumbing), variable tech experience, less IICRC focus, minimal mold specialty',
    talkingPoints: `Roto-Rooter's core business is plumbing — restoration is an add-on service for them. When mold is the primary issue, you want a company where that IS the business.\n\nWe're IICRC-certified with specialized mold training. We include ERMI testing. We document everything for insurance and health records.\n\nAlso — we're a great referral partner FOR plumbers. If any of your plumber contacts use Roto-Rooter for referrals, we'd love to be the alternative that keeps them in front of their clients.`,
    notes: 'Competes most directly with us on water damage. Counter with mold specialty and documentation.'
  },
]

function CompetitorCard({ comp, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left">
        <div>
          <div className="font-semibold text-gray-900 text-sm">{comp.name}</div>
          {comp.serviceArea && <div className="text-xs text-gray-400 mt-0.5">{comp.serviceArea}</div>}
        </div>
        <div className="flex items-center gap-2">
          {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {FIELDS.filter(f => comp[f.key]).map(({ key, label }) => (
                <div key={key}>
                  <div className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">{label}</div>
                  <div className="text-xs text-gray-700">{comp[key]}</div>
                </div>
              ))}
            </div>

            {(comp.strengths || comp.weaknesses) && (
              <div className="grid grid-cols-2 gap-3">
                {comp.strengths && (
                  <div>
                    <div className="text-[10px] font-bold text-green-600 uppercase mb-1">Their Strengths</div>
                    <p className="text-xs text-gray-700 leading-relaxed">{comp.strengths}</p>
                  </div>
                )}
                {comp.weaknesses && (
                  <div>
                    <div className="text-[10px] font-bold text-red-600 uppercase mb-1">Weaknesses / Gaps</div>
                    <p className="text-xs text-gray-700 leading-relaxed">{comp.weaknesses}</p>
                  </div>
                )}
              </div>
            )}

            {comp.talkingPoints && (
              <div>
                <div className="text-[10px] font-bold text-blue-700 uppercase mb-2">Talking Points vs. This Competitor</div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-line">{comp.talkingPoints}</p>
                </div>
              </div>
            )}

            {comp.notes && (
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Notes</div>
                <p className="text-xs text-gray-600 italic">{comp.notes}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={onEdit} className="flex items-center gap-1 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                <Edit2 size={11} /> Edit
              </button>
              <button onClick={onDelete} className="flex items-center gap-1 text-xs font-semibold text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors">
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CompetitorForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? BLANK)
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'name', label: 'Competitor Name', full: true },
          { key: 'website', label: 'Website' },
          { key: 'serviceArea', label: 'Service Area' },
          { key: 'certifications', label: 'Certifications / Claims' },
          { key: 'pricing', label: 'Pricing Notes' },
        ].map(({ key, label, full }) => (
          <div key={key} className={full ? 'col-span-2' : ''}>
            <label className="text-[10px] font-bold text-blue-800 uppercase block mb-1">{label}</label>
            <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full border border-blue-200 bg-white rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        ))}
      </div>
      {[
        { key: 'strengths', label: 'Their Strengths', rows: 2 },
        { key: 'weaknesses', label: 'Weaknesses / Gaps', rows: 2 },
        { key: 'talkingPoints', label: 'Talking Points (vs. this competitor)', rows: 4 },
        { key: 'notes', label: 'Notes', rows: 2 },
      ].map(({ key, label, rows }) => (
        <div key={key}>
          <label className="text-[10px] font-bold text-blue-800 uppercase block mb-1">{label}</label>
          <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            rows={rows} className="w-full border border-blue-200 bg-white rounded-xl px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      ))}
      <div className="flex gap-2">
        <button onClick={() => onSave(form)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          Save
        </button>
        <button onClick={onCancel} className="bg-white border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  )
}

export default function CompetitorIntel() {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const competitors = state.competitors?.length > 0 ? state.competitors : DEFAULT_COMPETITORS

  const handleSave = (form) => {
    if (!form.name) return
    if (editingId) {
      dispatch({ type: ACTIONS.UPDATE_COMPETITOR, payload: { ...form, id: editingId } })
      setEditingId(null)
    } else {
      dispatch({ type: ACTIONS.ADD_COMPETITOR, payload: form })
    }
    setShowForm(false)
  }

  const handleEdit = (c) => {
    setEditingId(c.id)
    setShowForm(true)
  }

  const editingComp = editingId ? competitors.find(c => c.id === editingId) : null

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Swords size={18} className="text-red-500" /> Competitor Intelligence
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Know your competition. Build talking points for every situation.</p>
          </div>
          <button onClick={() => { setShowForm(s => !s); setEditingId(null) }}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            <Plus size={14} /> Add Competitor
          </button>
        </div>

        {showForm && (
          <CompetitorForm
            initial={editingComp ? { ...editingComp } : null}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingId(null) }}
          />
        )}

        <div className="space-y-3">
          {competitors.map(c => (
            <CompetitorCard
              key={c.id}
              comp={c}
              onEdit={() => handleEdit(c)}
              onDelete={() => { if (window.confirm(`Delete ${c.name}?`)) dispatch({ type: ACTIONS.DELETE_COMPETITOR, payload: { id: c.id } }) }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
