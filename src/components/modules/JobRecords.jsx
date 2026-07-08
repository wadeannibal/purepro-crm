import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import {
  JOB_STAGES, JOB_TYPES, formatCurrency, formatDate, formatDateTime,
  jobTypeColor, stageColor, getChecklistForJobType, OSHA_CHECKLIST
} from '../../utils/helpers'
import { Search, ChevronRight, Send, Camera, Folder, Clock, Shield, ShieldCheck, Trash2 } from 'lucide-react'
import Modal from '../shared/Modal'

const TABS = ['Details', 'Notes', 'Checklist', 'OSHA']

export default function JobRecords({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [tab, setTab] = useState('Details')
  const [noteText, setNoteText] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({})

  const jobs = state.jobs.filter(j => {
    const q = search.toLowerCase()
    if (typeFilter !== 'All' && j.type !== typeFilter) return false
    if (q) {
      const client = state.clients.find(c => c.id === j.clientId)
      if (!j.address.toLowerCase().includes(q) && !(client?.name ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const job = selectedJobId ? state.jobs.find(j => j.id === selectedJobId) : null
  const client = job ? state.clients.find(c => c.id === job.clientId) : null
  const checklist = job ? getChecklistForJobType(job.type) : []
  const completedItems = checklist.filter(item => job?.checklist?.[item]).length

  const addNote = () => {
    if (!noteText.trim() || !job) return
    dispatch({ type: ACTIONS.ADD_JOB_NOTE, payload: { jobId: job.id, text: noteText.trim() } })
    setNoteText('')
  }

  const deleteJob = () => {
    if (!window.confirm(`Delete this job for ${client?.name ?? 'Unknown'}? This cannot be undone.`)) return
    dispatch({ type: ACTIONS.DELETE_JOB, payload: { id: job.id } })
    setSelectedJobId(null)
  }

  const openEdit = () => {
    setEditForm({ ...job })
    setShowEditModal(true)
  }
  const saveEdit = () => {
    dispatch({ type: ACTIONS.UPDATE_JOB, payload: { ...editForm, id: job.id, revenue: Number(editForm.revenue) || 0 } })
    setShowEditModal(false)
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Job list */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-gray-200 bg-white">
        <div className="p-3 border-b border-gray-200 space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs…" className="w-full pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
          <div className="flex gap-1">
            {['All', ...JOB_TYPES].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`px-2 py-0.5 text-[11px] font-semibold rounded-full transition-colors ${typeFilter === t ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {jobs.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No jobs found</p>}
          {jobs.map(j => {
            const c = state.clients.find(x => x.id === j.clientId)
            const active = j.id === selectedJobId
            return (
              <button
                key={j.id}
                onClick={() => { setSelectedJobId(j.id); setTab('Details') }}
                className={`w-full text-left px-3 py-3 border-b border-gray-100 transition-colors ${active ? 'bg-red-50 border-l-2 border-l-red-500' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${jobTypeColor(j.type)}`}>{j.type}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${stageColor(j.stage)}`}>{j.stage}</span>
                </div>
                <div className="text-xs font-semibold text-gray-900 truncate">{c?.name ?? 'Unknown'}</div>
                <div className="text-[11px] text-gray-500 truncate">{j.address}</div>
                <div className="text-[11px] text-green-700 font-semibold mt-0.5">{formatCurrency(j.revenue)}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail */}
      {!job ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <ChevronRight size={40} className="mx-auto mb-2 opacity-20" />
            <p className="font-medium text-sm">Select a job to view details</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Job header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${jobTypeColor(job.type)}`}>{job.type}</span>
                  <ChevronRight size={14} className="text-gray-400" />
                  <select
                    value={job.stage}
                    onChange={e => dispatch({ type: ACTIONS.UPDATE_JOB, payload: { id: job.id, stage: e.target.value } })}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 ${stageColor(job.stage)}`}
                  >
                    {JOB_STAGES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <h2 className="text-base font-bold text-gray-900">{client?.name ?? 'Unknown Client'}</h2>
                <p className="text-sm text-gray-500">{job.address}</p>
              </div>
              <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                <div className="text-xl font-black text-green-700">{formatCurrency(job.revenue)}</div>
                <div className="flex items-center gap-3">
                  <button onClick={openEdit} className="text-xs text-gray-400 hover:text-red-600 underline">Edit Job</button>
                  <button onClick={deleteJob} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-0.5 rounded-lg transition-colors">
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Stage progress */}
            <div className="mt-3 flex gap-0.5">
              {JOB_STAGES.map((s, i) => {
                const stageIdx = JOB_STAGES.indexOf(job.stage)
                const filled = i <= stageIdx
                return <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${filled ? 'bg-red-500' : 'bg-gray-200'}`} title={s} />
              })}
            </div>

            {/* Quick nav buttons */}
            <div className="flex gap-2 mt-3">
              {[
                { label: 'Photos', icon: Camera, view: 'photos' },
                { label: 'Docs', icon: Folder, view: 'documents' },
                { label: 'Timer', icon: Clock, view: 'timer' },
                { label: 'Waivers', icon: Shield, view: 'waivers' },
                { label: 'OSHA', icon: ShieldCheck, view: 'osha' },
              ].map(({ label, icon: Icon, view }) => (
                <button
                  key={view}
                  onClick={() => navigateTo(view, { jobId: job.id })}
                  className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-red-50 hover:text-red-600 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Icon size={12} />{label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 py-2 bg-white border-b border-gray-200 flex-shrink-0">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${tab === t ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
              >
                {t}
                {t === 'Checklist' && checklist.length > 0 && (
                  <span className="ml-1 opacity-70">{completedItems}/{checklist.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">

            {tab === 'Details' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Description</div>
                  <p className="text-sm text-gray-700 leading-relaxed">{job.description || <span className="text-gray-400 italic">No description</span>}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-xs text-gray-500 block mb-0.5">Created</span><span className="font-medium text-gray-800">{formatDate(job.createdAt)}</span></div>
                  <div><span className="text-xs text-gray-500 block mb-0.5">Last Updated</span><span className="font-medium text-gray-800">{formatDate(job.updatedAt)}</span></div>
                  <div><span className="text-xs text-gray-500 block mb-0.5">Revenue</span><span className="font-medium text-green-700">{formatCurrency(job.revenue)}</span></div>
                  <div><span className="text-xs text-gray-500 block mb-0.5">Client Type</span><span className="font-medium text-gray-800">{client?.type ?? '—'}</span></div>
                </div>
                {client && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Client Contact</div>
                    <div className="text-sm font-semibold text-gray-900 mb-1">{client.name}</div>
                    {client.phone && <div className="text-sm text-gray-600">{client.phone}</div>}
                    {client.email && <div className="text-sm text-gray-600">{client.email}</div>}
                  </div>
                )}
              </div>
            )}

            {tab === 'Notes' && (
              <div className="max-w-2xl space-y-4">
                <div className="flex gap-2">
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addNote() }}
                    placeholder="Add a note… (Cmd+Enter to save)"
                    rows={3}
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                  <button onClick={addNote} className="self-end p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors">
                    <Send size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  {[...job.notes].reverse().map(note => (
                    <div key={note.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <p className="text-sm text-gray-800 leading-relaxed">{note.text}</p>
                      <div className="text-xs text-gray-400 mt-2">{formatDateTime(note.createdAt)}</div>
                    </div>
                  ))}
                  {job.notes.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No notes yet. Add the first one above.</p>}
                </div>
              </div>
            )}

            {tab === 'Checklist' && (
              <div className="max-w-xl">
                {checklist.length === 0 ? (
                  <p className="text-sm text-gray-400">No checklist available for this job type.</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-700">{job.type} Job Checklist</span>
                      <span className="text-sm text-gray-500">{completedItems} of {checklist.length} complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${checklist.length > 0 ? (completedItems / checklist.length) * 100 : 0}%` }} />
                    </div>
                    {checklist.map(item => (
                      <label key={item} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!job.checklist?.[item]}
                          onChange={e => dispatch({ type: ACTIONS.UPDATE_CHECKLIST_ITEM, payload: { jobId: job.id, item, checked: e.target.checked } })}
                          className="w-4 h-4 accent-red-600 rounded"
                        />
                        <span className={`text-sm ${job.checklist?.[item] ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'OSHA' && (
              <div className="max-w-xl">
                {job.type === 'Water' ? (
                  <div className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    OSHA compliance checklist applies to Mold and Fire jobs. Water damage jobs typically don't require this checklist.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-700 mb-4">OSHA Compliance — {job.type}</div>
                    {OSHA_CHECKLIST.map(item => {
                      const checked = !!job.oshaChecklist?.[item]
                      return (
                        <label key={item} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${checked ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50 border-transparent'}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={e => dispatch({ type: ACTIONS.UPDATE_OSHA_ITEM, payload: { jobId: job.id, item, checked: e.target.checked } })}
                            className="w-4 h-4 accent-red-600 rounded"
                          />
                          <span className={`text-sm ${checked ? 'text-green-700' : 'text-gray-800'}`}>{item}</span>
                          {checked && <span className="ml-auto text-green-500 text-xs font-semibold">✓</span>}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showEditModal && (
        <Modal title="Edit Job" onClose={() => setShowEditModal(false)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Job Type</label>
                <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Stage</label>
                <select value={editForm.stage} onChange={e => setEditForm(f => ({ ...f, stage: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  {JOB_STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Revenue ($)</label>
              <input type="number" value={editForm.revenue} onChange={e => setEditForm(f => ({ ...f, revenue: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
              <input type="text" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea rows={4} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600">Cancel</button>
              <button onClick={saveEdit} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Save Changes</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
