import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { Plus, ChevronDown, ChevronUp, Edit2, Trash2, X, HelpCircle } from 'lucide-react'

const DEFAULT_OBJECTIONS = [
  {
    id: 'obj-1', isCustom: false,
    objection: "That's too expensive.",
    responses: [
      { id: 'r1a', text: "I understand budget is always a concern. The cost you're seeing now is a fraction of what mold can cost if it spreads — it can get into your HVAC, affect multiple rooms, and impact your family's air quality. Addressing it properly now protects your home's value and your health." },
      { id: 'r1b', text: "Let's look at the scope together and see if there's a way to phase the work. We can often structure payment to make it more manageable. What's your main concern — the total amount or the timing?" },
      { id: 'r1c', text: "I get it — it's a significant investment. Here's the thing: if the work isn't done to IICRC standards, there's a good chance it comes back. That's where people end up spending twice. Our clearance testing guarantees the job is done right." },
    ],
  },
  {
    id: 'obj-2', isCustom: false,
    objection: "My insurance won't cover it.",
    responses: [
      { id: 'r2a', text: "That's actually more common than you'd think, and we've helped clients navigate this exact situation. Let me document everything thoroughly — sometimes the issue is how the claim is presented, not whether it's actually covered." },
      { id: 'r2b', text: "Even if insurance doesn't cover the full amount, we can help you understand what's reasonable out-of-pocket versus what might qualify for a supplemental claim. We work with a public adjuster who's helped clients recover costs in similar situations." },
      { id: 'r2c', text: "Before we give up on the insurance route, let me look at your policy documentation. I've seen adjusters deny claims that were valid — and a well-documented remediation scope can change that outcome." },
    ],
  },
  {
    id: 'obj-3', isCustom: false,
    objection: "I need to get other quotes.",
    responses: [
      { id: 'r3a', text: "Absolutely — you should. When comparing, make sure each contractor specifies IICRC-certified protocols, ERMI or post-remediation testing, and exactly what's included. Some lower quotes don't include clearance testing, which means you can't verify the work was done right." },
      { id: 'r3b', text: "Of course. Just keep in mind that mold spreads — the longer the decision takes, the more you might be remediating. Once you have the other quotes, I'm happy to walk through them with you and explain any differences." },
      { id: 'r3c', text: "That makes sense. While you're getting quotes, ask each company whether they're IICRC-certified and whether clearance testing is included. A lot of companies skip that step, which can leave you with a problem that appears solved but isn't." },
    ],
  },
  {
    id: 'obj-4', isCustom: false,
    objection: "I need to think about it.",
    responses: [
      { id: 'r4a', text: "Of course — it's a big decision. Is there a specific concern I can answer right now that would help you feel more confident? Sometimes the hesitation is about something I can address quickly." },
      { id: 'r4b', text: "I completely understand. I'll put everything in writing so you can review it at your own pace. Just know that mold is an active organism — if the moisture source isn't addressed, it can spread to new areas while you're deciding." },
      { id: 'r4c', text: "Take all the time you need. Can I ask what the main thing is you need to think through? That way I can make sure you have the right information to make the best decision." },
    ],
  },
  {
    id: 'obj-5', isCustom: false,
    objection: "The last company said it wasn't that bad.",
    responses: [
      { id: 'r5a', text: "'Not that bad' isn't a measurable standard — ERMI and HERTSMI testing gives us actual spore counts. If you'd like, I can recommend an independent industrial hygienist to test first, so the data drives the decision rather than a visual guess." },
      { id: 'r5b', text: "The tricky thing with mold is that what's visible on the surface is often just a fraction of what's behind walls or under floors. I'd want to do a thorough moisture assessment before concluding anything is minor." },
      { id: 'r5c', text: "I don't want to oversell a problem any more than I want to undersell one. Let me do a proper assessment with moisture readings and we'll go from the actual data." },
    ],
  },
  {
    id: 'obj-6', isCustom: false,
    objection: "I'll just use bleach.",
    responses: [
      { id: 'r6a', text: "Totally understand why that seems like the right move. The challenge is that bleach kills surface mold but doesn't penetrate porous materials like drywall or wood framing. The roots stay in the material and it comes back, often worse." },
      { id: 'r6b', text: "Bleach also doesn't address the moisture source that's feeding the mold. Without fixing that, whatever you apply on the surface will just keep growing back within weeks." },
      { id: 'r6c', text: "A lot of our clients tried the bleach route first. Once mold is in porous materials, you can't bleach your way out — those materials have to be physically removed and replaced. Happy to come take a look and give you an honest assessment." },
    ],
  },
  {
    id: 'obj-7', isCustom: false,
    objection: "Can you do it cheaper?",
    responses: [
      { id: 'r7a', text: "I wish I could compete on price alone, but I'd be doing you a disservice. We include post-remediation ERMI testing in every job — without that, there's no way to know the work actually cleared the problem. That's a step a lot of cheaper providers skip." },
      { id: 'r7b', text: "Let me look at the scope with you. There might be some line items we can adjust or phase. I can't cut corners on the core remediation — that protects you and your family — but let's see what flexibility we have." },
      { id: 'r7c', text: "The best way I can save you money long-term is to do it right the first time. I've seen mold come back multiple times after cut-rate remediation, and those clients end up spending twice as much total. I'm always happy to work on timing and payment structure." },
    ],
  },
]

const BLANK = { objection: '', responses: [{ id: 'new-1', text: '' }] }

function ObjectionCard({ obj, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-start gap-3">
          <HelpCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <span className="font-semibold text-gray-900 text-sm">{obj.objection}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-gray-400">{obj.responses.length} response{obj.responses.length !== 1 ? 's' : ''}</span>
          {obj.isCustom && <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Custom</span>}
          {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-gray-100">
          <div className="px-5 py-4 space-y-3">
            {obj.responses.map((r, i) => (
              <div key={r.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Response {i + 1}</div>
                <p className="text-sm text-gray-700 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
          <div className="px-5 pb-4 flex gap-2">
            <button onClick={onEdit} className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              <Edit2 size={11} /> Edit
            </button>
            {obj.isCustom && (
              <button onClick={onDelete} className="flex items-center gap-1 text-xs font-semibold text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors">
                <Trash2 size={11} /> Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ObjectionHandler() {
  const { state, dispatch } = useApp()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    dispatch({ type: ACTIONS.INIT_OBJECTIONS, payload: DEFAULT_OBJECTIONS })
  }, [])

  const objections = state.objections ?? DEFAULT_OBJECTIONS

  const filtered = objections.filter(o =>
    !search || o.objection.toLowerCase().includes(search.toLowerCase()) ||
    o.responses.some(r => r.text.toLowerCase().includes(search.toLowerCase()))
  )

  const addResponse = () => {
    setForm(f => ({ ...f, responses: [...f.responses, { id: `new-${Date.now()}`, text: '' }] }))
  }

  const updateResponse = (id, text) => {
    setForm(f => ({ ...f, responses: f.responses.map(r => r.id === id ? { ...r, text } : r) }))
  }

  const removeResponse = (id) => {
    setForm(f => ({ ...f, responses: f.responses.filter(r => r.id !== id) }))
  }

  const save = () => {
    if (!form.objection || form.responses.every(r => !r.text)) return
    const cleanResponses = form.responses.filter(r => r.text).map((r, i) => ({ id: r.id || `r-${i}-${Date.now()}`, text: r.text }))
    if (editingId) {
      dispatch({ type: ACTIONS.UPDATE_OBJECTION, payload: { id: editingId, objection: form.objection, responses: cleanResponses, isCustom: true } })
      setEditingId(null)
    } else {
      dispatch({ type: ACTIONS.ADD_OBJECTION, payload: { objection: form.objection, responses: cleanResponses } })
    }
    setForm(BLANK)
    setShowForm(false)
  }

  const openEdit = (o) => {
    setForm({ objection: o.objection, responses: o.responses.length > 0 ? o.responses : [{ id: 'new-1', text: '' }] })
    setEditingId(o.id)
    setShowForm(true)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle size={18} className="text-red-500" /> Objection Handler
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Restoration-specific responses to common sales objections.</p>
          </div>
          <button onClick={() => { setForm(BLANK); setEditingId(null); setShowForm(s => !s) }}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            <Plus size={14} /> Add Objection
          </button>
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search objections and responses…"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />

        {showForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-blue-900">{editingId ? 'Edit Objection' : 'New Objection'}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null) }}><X size={16} className="text-blue-400" /></button>
            </div>
            <div>
              <label className="text-xs font-bold text-blue-800 uppercase tracking-wide block mb-1">Objection</label>
              <input value={form.objection} onChange={e => setForm(f => ({ ...f, objection: e.target.value }))}
                placeholder="e.g. I need to think about it."
                className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-800 uppercase tracking-wide block">Responses</label>
              {form.responses.map((r, i) => (
                <div key={r.id} className="flex gap-2">
                  <div className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold mt-2">{i + 1}</div>
                  <textarea value={r.text} onChange={e => updateResponse(r.id, e.target.value)}
                    rows={3} placeholder={`Response option ${i + 1}…`}
                    className="flex-1 border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {form.responses.length > 1 && (
                    <button onClick={() => removeResponse(r.id)} className="p-1 text-blue-300 hover:text-red-500 mt-2"><X size={14} /></button>
                  )}
                </div>
              ))}
              {form.responses.length < 3 && (
                <button onClick={addResponse} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <Plus size={12} /> Add another response
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                {editingId ? 'Save Changes' : 'Save Objection'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null) }}
                className="bg-white border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map(o => (
            <ObjectionCard
              key={o.id}
              obj={o}
              onEdit={() => openEdit(o)}
              onDelete={() => { if (window.confirm('Delete this objection?')) dispatch({ type: ACTIONS.DELETE_OBJECTION, payload: { id: o.id } }) }}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <HelpCircle size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No objections match your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
