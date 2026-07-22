import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import {
  JOB_STAGES, JOB_TYPES, LEAD_SOURCES, LOSS_REASONS, formatCurrency, formatDate, formatDateTime,
  jobTypeColor, stageColor, getChecklistForJobType, OSHA_CHECKLIST
} from '../../utils/helpers'
import { Search, ChevronLeft, ChevronRight, Send, Camera, Folder, Clock, Shield, ShieldCheck, Trash2, X, ExternalLink, Archive, ArchiveRestore } from 'lucide-react'
import Modal from '../shared/Modal'

const TABS = ['Details', 'Notes', 'Photos', 'Checklist', 'OSHA']

export default function JobRecords({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [tab, setTab] = useState('Details')
  const [noteText, setNoteText] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [lightbox, setLightbox] = useState(null)
  const [lossModal, setLossModal] = useState(null)
  const [lossForm, setLossForm] = useState({ lostReason: 'Price too high', lostCompetitor: '' })
  const [showArchived, setShowArchived] = useState(false)

  const archivedCount = state.jobs.filter(j => j.archived).length

  const jobs = state.jobs.filter(j => {
    if (showArchived ? !j.archived : j.archived) return false
    const q = search.toLowerCase()
    if (typeFilter !== 'All' && j.type !== typeFilter) return false
    if (q) {
      const client = state.clients.find(c => c.id === j.clientId)
      if (!(j.address ?? '').toLowerCase().includes(q) && !(client?.name ?? '').toLowerCase().includes(q)) return false
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

  const toggleArchive = () => {
    if (!job) return
    if (!window.confirm(job.archived ? 'Restore this job?' : 'Archive this job? It will be hidden from the main list.')) return
    dispatch({ type: ACTIONS.ARCHIVE_JOB, payload: { id: job.id, archived: !job.archived } })
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
      <div className={`${selectedJobId ? 'hidden md:flex' : 'flex'} w-full md:w-72 flex-col flex-shrink-0 border-r border-gray-200 bg-white overflow-hidden`}>
        <div className="p-3 border-b border-gray-200 space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs…" className="w-full pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {['All', ...JOB_TYPES].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`px-2 py-0.5 text-[11px] font-semibold rounded-full transition-colors ${typeFilter === t ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t}</button>
            ))}
          </div>
          <button
            onClick={() => { setShowArchived(a => !a); setSelectedJobId(null) }}
            className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${showArchived ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <Archive size={11} />
            {showArchived ? 'Hide Archived' : `Archived Jobs${archivedCount > 0 ? ` (${archivedCount})` : ''}`}
          </button>
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
                <div className="text-[11px] text-green-700 font-semibold mt-0.5">{formatCurrency(j.estimate?.grandTotal ?? j.revenue ?? 0)}</div>
              </button>
            )
          })}
        </div>
      </div>

      {!job && (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-400">
          <div className="text-center">
            <ChevronRight size={40} className="mx-auto mb-2 opacity-20" />
            <p className="font-medium text-sm">Select a job to view details</p>
          </div>
        </div>
      )}
      {job && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <button onClick={() => setSelectedJobId(null)} className="flex items-center gap-1 text-red-600 font-semibold text-sm">
              <ChevronLeft size={16} /> Back
            </button>
          </div>
          {/* Job header */}
          <div className="bg-white border-b border-gray-200 px-3 md:px-6 py-4 flex-shrink-0">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${jobTypeColor(job.type)}`}>{job.type}</span>
                  <ChevronRight size={14} className="text-gray-400" />
                  <select
                    value={job.stage}
                    onChange={e => {
                      const s = e.target.value
                      if (s === 'Lost') { setLossForm({ lostReason: 'Price too high', lostCompetitor: '' }); setLossModal(job.id) }
                      else dispatch({ type: ACTIONS.UPDATE_JOB, payload: { id: job.id, stage: s } })
                    }}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 ${stageColor(job.stage)}`}
                  >
                    {JOB_STAGES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <h2 className="text-base font-bold text-gray-900">{client?.name ?? 'Unknown Client'}</h2>
                <p className="text-sm text-gray-500">{job.address}</p>
              </div>
              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-2 flex-shrink-0">
                <div className="text-xl font-black text-green-700">{formatCurrency(job.estimate?.grandTotal ?? job.revenue ?? 0)}</div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button onClick={openEdit} className="text-xs text-gray-400 hover:text-red-600 underline">Edit</button>
                  <button onClick={toggleArchive} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors">
                    {job.archived ? <><ArchiveRestore size={11} /> Unarchive</> : <><Archive size={11} /> Archive</>}
                  </button>
                  <button onClick={deleteJob} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Stage progress */}
            <div className="mt-3">
              {job.stage === 'Lost' ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">Lost</span>
                  {job.lostReason && <span className="text-xs text-gray-500">{job.lostReason}</span>}
                </div>
              ) : (
                <div className="flex gap-0.5">
                  {JOB_STAGES.map((s, i) => {
                    const stageIdx = JOB_STAGES.indexOf(job.stage)
                    const filled = i <= stageIdx
                    return <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${filled ? 'bg-red-500' : 'bg-gray-200'}`} title={s} />
                  })}
                </div>
              )}
            </div>

            {/* Quick nav buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
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
          <div className="overflow-x-auto flex-shrink-0 bg-white border-b border-gray-200">
            <div className="flex gap-1 px-6 py-2 min-w-max md:min-w-0">
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
                  {t === 'Photos' && (job?.photos?.length ?? 0) > 0 && (
                    <span className="ml-1 opacity-70">{job.photos.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6">

            {tab === 'Details' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Description</div>
                  <p className="text-sm text-gray-700 leading-relaxed">{job.description || <span className="text-gray-400 italic">No description</span>}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-xs text-gray-500 block mb-0.5">Created</span><span className="font-medium text-gray-800">{formatDate(job.createdAt)}</span></div>
                  <div><span className="text-xs text-gray-500 block mb-0.5">Last Updated</span><span className="font-medium text-gray-800">{formatDate(job.updatedAt)}</span></div>
                  <div><span className="text-xs text-gray-500 block mb-0.5">Revenue</span><span className="font-medium text-green-700">{formatCurrency(job.estimate?.grandTotal ?? job.revenue ?? 0)}</span></div>
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
                  {[...(job.notes ?? [])].reverse().map(note => (
                    <div key={note.id} className="bg-white rounded-xl border border-gray-200 p-4 group">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-gray-800 leading-relaxed flex-1">{note.text}</p>
                        <button
                          onClick={() => { if (window.confirm('Delete this note?')) dispatch({ type: ACTIONS.DELETE_JOB_NOTE, payload: { jobId: job.id, noteId: note.id } }) }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all flex-shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">{formatDateTime(note.createdAt)}</div>
                    </div>
                  ))}
                  {(job.notes ?? []).length === 0 && <p className="text-sm text-gray-400 text-center py-8">No notes yet. Add the first one above.</p>}
                </div>
              </div>
            )}

            {tab === 'Photos' && (
              <div className="max-w-2xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-700">
                    {job.photos?.length ?? 0} photo{(job.photos?.length ?? 0) !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => navigateTo('photos', { jobId: job.id })}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <ExternalLink size={12} /> Upload / Manage
                  </button>
                </div>

                {!job.photos?.length ? (
                  <div className="text-center py-12">
                    <Camera size={36} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500 font-medium">No photos yet</p>
                    <p className="text-xs text-gray-400 mt-1 mb-4">Upload before/after, progress, or documentation photos</p>
                    <button
                      onClick={() => navigateTo('photos', { jobId: job.id })}
                      className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition-colors"
                    >
                      Go to Photos
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[...job.photos].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).map(photo => (
                      <div
                        key={photo.id}
                        className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                        onClick={() => setLightbox(photo)}
                      >
                        <img
                          src={photo.data}
                          alt={photo.name}
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                        {(photo.photoType || photo.room) && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                            <p className="text-white text-[10px] font-semibold truncate">
                              {[photo.photoType, photo.room].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        )}
                        {((state.showcasePhotos ?? {})[photo.id] ?? photo.isShowcase) && (
                          <div className="absolute top-1.5 right-1.5 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            In Portal
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.data}
            alt={lightbox.name}
            className="max-w-full max-h-[80vh] rounded-xl object-contain"
          />
          <div className="mt-4 flex items-center gap-3" onClick={e => e.stopPropagation()}>
            {(lightbox.photoType || lightbox.room) && (
              <span className="text-gray-400 text-sm">{[lightbox.photoType, lightbox.room].filter(Boolean).join(' · ')}</span>
            )}
            <button
              onClick={() => setLightbox(null)}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl backdrop-blur-sm transition-colors"
            >
              <X size={14} /> Close
            </button>
          </div>
        </div>
      )}

      {lossModal && (
        <Modal title="Mark as Lost" onClose={() => setLossModal(null)}>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">What was the reason this job was lost?</p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Loss Reason</label>
              <select value={lossForm.lostReason} onChange={e => setLossForm(f => ({ ...f, lostReason: e.target.value, lostCompetitor: e.target.value !== 'Went with competitor' ? '' : f.lostCompetitor }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                {LOSS_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            {lossForm.lostReason === 'Went with competitor' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Competitor Name</label>
                <input type="text" placeholder="e.g. ServPro, Paul Davis…" value={lossForm.lostCompetitor} onChange={e => setLossForm(f => ({ ...f, lostCompetitor: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setLossModal(null)} className="px-4 py-2 text-sm font-medium text-gray-600">Cancel</button>
              <button onClick={() => { dispatch({ type: ACTIONS.UPDATE_JOB, payload: { id: lossModal, stage: 'Lost', ...lossForm } }); setLossModal(null) }} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Confirm Lost</button>
            </div>
          </div>
        </Modal>
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
                <select value={editForm.stage} onChange={e => setEditForm(f => ({ ...f, stage: e.target.value, lostReason: e.target.value === 'Lost' ? (f.lostReason || 'Price too high') : f.lostReason, lostCompetitor: e.target.value !== 'Lost' ? '' : f.lostCompetitor }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  {JOB_STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {editForm.stage === 'Lost' && (
              <div className="space-y-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold text-red-700 mb-1">Loss Reason</label>
                  <select value={editForm.lostReason ?? 'Price too high'} onChange={e => setEditForm(f => ({ ...f, lostReason: e.target.value, lostCompetitor: e.target.value !== 'Went with competitor' ? '' : f.lostCompetitor }))} className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                    {LOSS_REASONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                {editForm.lostReason === 'Went with competitor' && (
                  <div>
                    <label className="block text-xs font-semibold text-red-700 mb-1">Competitor Name</label>
                    <input type="text" placeholder="e.g. ServPro, Paul Davis…" value={editForm.lostCompetitor ?? ''} onChange={e => setEditForm(f => ({ ...f, lostCompetitor: e.target.value }))} className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Revenue ($)</label>
              <input type="number" value={editForm.revenue ?? ''} onChange={e => setEditForm(f => ({ ...f, revenue: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
              <input type="text" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Lead Source</label>
                <select value={editForm.leadSource ?? ''} onChange={e => setEditForm(f => ({ ...f, leadSource: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">— Not Tagged —</option>
                  {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Referral Partner</label>
                <select value={editForm.leadSourcePartnerId ?? ''} onChange={e => setEditForm(f => ({ ...f, leadSourcePartnerId: e.target.value || null }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">— None —</option>
                  {(state.partners ?? []).map(p => <option key={p.id} value={p.id}>{p.name} ({p.partnerType})</option>)}
                </select>
              </div>
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
