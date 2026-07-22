import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { PARTNER_TYPES } from '../../utils/helpers'
import { Copy, Check, CheckCircle, Plus, Edit2, Trash2, X, ScrollText } from 'lucide-react'
import { getCompanySettings } from '../../utils/companySettings'

function getDefaultScripts() {
  const { companyName, ownerName, city } = getCompanySettings()
  return [
    {
      id: 'script-plumber-cold',
      title: 'Cold Outreach — Plumber',
      partnerType: 'Plumber',
      isCustom: false,
      sentHistory: [],
      content: `Hi [Name], this is ${ownerName} with ${companyName} in ${city}. I work specifically in mold and water damage remediation, and I know plumbers are often the first ones on scene when water damage happens.

I'd love to set up a referral partnership — any time you run into a job with mold or water damage beyond your scope, I'll take great care of your clients and make sure they know you sent them to the right place.

Would you be open to a 10-minute call this week? I can work around your schedule.
— ${ownerName}, ${companyName}`,
    },
    {
      id: 'script-realtor-warm',
      title: 'Warm Follow-Up — Real Estate Agent',
      partnerType: 'Real Estate Agent',
      isCustom: false,
      sentHistory: [],
      content: `Hi [Name], ${ownerName} from ${companyName} following up!

Just wanted to stay on your radar heading into the season. We've been handling a lot of pre-sale mold inspections and clearance letters in the ${city} area — usually able to turn those around within 48-72 hours when you're up against a closing deadline.

If any of your buyers or sellers run into moisture or mold issues, I'd love to be your go-to call. Happy to set up a preferred vendor arrangement — we'll always make you look good with your clients.

Want to grab coffee sometime?
— ${ownerName}, ${companyName}`,
    },
    {
      id: 'script-doctor-intro',
      title: 'Introduction — Functional Medicine / CIRS Doctor',
      partnerType: 'Functional Medicine / CIRS Doctor',
      isCustom: false,
      sentHistory: [],
      content: `Hi Dr. [Name], my name is ${ownerName} with ${companyName}. I specialize in mold remediation for CIRS and mold-sensitive patients in the ${city} area, and I wanted to reach out because I understand how critical proper environmental remediation is for your patients' recovery.

I'm familiar with ERMI/HERTSMI protocols, IICRC S520 remediation standards, and the importance of clearance testing. I take a very thorough, documentation-heavy approach that supports the clinical process.

Would you be open to a brief introduction call? I'd love to be a resource for your patients who need environmental support.
— ${ownerName}, ${companyName}`,
    },
    {
      id: 'script-adjuster-followup',
      title: 'Follow-Up — Insurance Adjuster',
      partnerType: 'Insurance Adjuster',
      isCustom: false,
      sentHistory: [],
      content: `Hi [Name], ${ownerName} with ${companyName}. I wanted to follow up and make sure our documentation for [Claim # / Job] has everything you need for the review.

We always provide ERMI testing results, detailed scope of work, and post-remediation clearance documentation — I know thorough documentation makes your approval process much smoother.

If you're ever in a bind on a tight-timeline claim and need a quick mobilization or scope assessment, we can typically respond same-day. Let me know how I can make your job easier.
— ${ownerName}, ${companyName}`,
    },
    {
      id: 'script-cold-reengage',
      title: 'Re-Engagement — Cold Partner',
      partnerType: 'Plumber',
      isCustom: false,
      sentHistory: [],
      content: `Hi [Name], it's ${ownerName} with ${companyName} — it's been a while and I just wanted to check in!

We've been staying busy this season with some great projects around ${city} and always keep you in mind when clients come our way who might need your help.

Wanted to make sure the connection stays warm. If you have any clients dealing with water damage or mold issues, we're still your best call in the metro — quick response, IICRC-certified, and we always make sure the referring partner looks good.

Hope everything's going well. Let me know if there's anything I can do for you!
— ${ownerName}, ${companyName}`,
    },
  ]
}

const BLANK = { title: '', partnerType: 'Plumber', content: '' }

function ScriptCard({ script, onCopy, onMarkSent, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false)
  const lastSent = script.sentHistory?.length > 0
    ? script.sentHistory[script.sentHistory.length - 1].sentAt
    : null

  const copy = async () => {
    try { await navigator.clipboard.writeText(script.content) } catch {
      const el = document.createElement('textarea')
      el.value = script.content
      document.body.appendChild(el); el.select()
      document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <div className="font-semibold text-gray-900 text-sm">{script.title}</div>
          <div className="text-[11px] font-semibold text-purple-700 bg-purple-50 inline-block px-2 py-0.5 rounded-full mt-1">
            {script.partnerType}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!script.isCustom && <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Built-in</span>}
          <button onClick={onEdit} className="p-1 text-gray-400 hover:text-gray-700"><Edit2 size={13} /></button>
          {script.isCustom && <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>}
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">{script.content}</p>
        {lastSent && (
          <p className="text-[10px] text-gray-400 mt-2">
            Last sent: {new Date(lastSent).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' '}({script.sentHistory.length} total)
          </p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <button onClick={copy}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
              ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Approve & Copy</>}
          </button>
          <button onClick={onMarkSent}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            <CheckCircle size={12} /> Mark as Sent
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OutreachScripts() {
  const { state, dispatch } = useApp()
  const [filterType, setFilterType] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    // INIT_SCRIPTS is a no-op if scripts already exist in state (reducer guard: if (state.scripts) return state).
    // Built-in scripts embed the company name from settings at first initialization.
    // To update script content after changing company settings, edit each script manually.
    dispatch({ type: ACTIONS.INIT_SCRIPTS, payload: getDefaultScripts() })
  }, [])

  const scripts = state.scripts ?? getDefaultScripts()

  const filtered = scripts.filter(s => filterType === 'All' || s.partnerType === filterType)

  const save = () => {
    if (!form.title || !form.content) return
    if (editingId) {
      dispatch({ type: ACTIONS.UPDATE_SCRIPT, payload: { id: editingId, ...form } })
      setEditingId(null)
    } else {
      dispatch({ type: ACTIONS.ADD_SCRIPT, payload: form })
    }
    setForm(BLANK)
    setShowForm(false)
  }

  const openEdit = (s) => {
    setForm({ title: s.title, partnerType: s.partnerType, content: s.content })
    setEditingId(s.id)
    setShowForm(true)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-3 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ScrollText size={18} className="text-red-500" /> Outreach Script Library
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Pre-written scripts by partner type. Copy, send manually, mark as sent.</p>
          </div>
          <button onClick={() => { setForm(BLANK); setEditingId(null); setShowForm(s => !s) }}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            <Plus size={14} /> Custom Script
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {['All', ...PARTNER_TYPES].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${filterType === t ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Custom script form */}
        {showForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-blue-900">{editingId ? 'Edit Script' : 'New Custom Script'}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null) }}><X size={16} className="text-blue-400" /></button>
            </div>
            <div>
              <label className="text-xs font-bold text-blue-800 uppercase tracking-wide block mb-1">Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Follow-Up — Property Manager"
                className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-blue-800 uppercase tracking-wide block mb-1">Partner Type</label>
              <select value={form.partnerType} onChange={e => setForm(f => ({ ...f, partnerType: e.target.value }))}
                className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PARTNER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-blue-800 uppercase tracking-wide block mb-1">Script Content</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={8} placeholder="Write your outreach script here…"
                className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                {editingId ? 'Save Changes' : 'Save Script'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null) }}
                className="bg-white border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        {/* Scripts */}
        <div className="space-y-4">
          {filtered.map(s => (
            <ScriptCard
              key={s.id}
              script={s}
              onMarkSent={() => dispatch({ type: ACTIONS.MARK_SCRIPT_SENT, payload: { id: s.id } })}
              onEdit={() => openEdit(s)}
              onDelete={() => { if (window.confirm('Delete this script?')) dispatch({ type: ACTIONS.DELETE_SCRIPT, payload: { id: s.id } }) }}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <ScrollText size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No scripts match this filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
