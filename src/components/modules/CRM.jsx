import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { CLIENT_TYPES, formatDate, formatCurrency, clientTypeColor, jobTypeColor, stageColor } from '../../utils/helpers'
import Modal from '../shared/Modal'
import { Plus, Search, Star, Phone, Mail, MapPin, Briefcase, X, Edit2, Trash2, ChevronLeft, AlertTriangle } from 'lucide-react'

const BLANK = { name: '', type: 'Homeowner', email: '', phone: '', address: '', notes: '', isVIP: false }

function ClientCard({ client, jobs, onClick, onToggleVIP }) {
  const clientJobs = jobs.filter(j => j.clientId === client.id)
  const totalRev = clientJobs.reduce((s, j) => s + (j.revenue ?? 0), 0)
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-red-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{client.name}</h3>
            {client.isVIP && <Star size={13} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
          </div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${clientTypeColor(client.type)}`}>
            {client.type}
          </span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onToggleVIP() }}
          className={`p-1.5 rounded-lg transition-colors ${client.isVIP ? 'text-amber-400 bg-amber-50 hover:bg-amber-100' : 'text-gray-300 hover:text-amber-400 hover:bg-amber-50'}`}
        >
          <Star size={15} className={client.isVIP ? 'fill-amber-400' : ''} />
        </button>
      </div>
      <div className="space-y-1 text-xs text-gray-500 mb-3">
        {client.phone && <div className="flex items-center gap-1.5"><Phone size={11} />{client.phone}</div>}
        {client.email && <div className="flex items-center gap-1.5 truncate"><Mail size={11} /><span className="truncate">{client.email}</span></div>}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
        <span className="text-gray-500">{clientJobs.length} job{clientJobs.length !== 1 ? 's' : ''}</span>
        {totalRev > 0 && <span className="text-green-700 font-semibold">{formatCurrency(totalRev)}</span>}
      </div>
    </div>
  )
}

function ClientDetail({ client, jobs, onClose, onEdit, onDelete, navigateTo }) {
  const clientJobs = jobs.filter(j => j.clientId === client.id)
  return (
    <div className="bg-white border-l border-gray-200 w-full md:w-80 flex-shrink-0 flex flex-col h-full">
      <div className="md:hidden flex items-center gap-2 px-5 py-3 border-b border-gray-100 flex-shrink-0">
        <button onClick={onClose} className="flex items-center gap-1 text-red-600 font-semibold text-sm">
          <ChevronLeft size={16} /> Back
        </button>
      </div>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="font-semibold text-gray-900">{client.name}</h2>
            {client.isVIP && <Star size={14} className="text-amber-400 fill-amber-400" />}
          </div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${clientTypeColor(client.type)}`}>{client.type}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 size={14} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X size={14} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 space-y-3 border-b border-gray-100">
          {client.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-gray-400 flex-shrink-0" />
              <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">{client.phone}</a>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-gray-400 flex-shrink-0" />
              <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline truncate">{client.email}</a>
            </div>
          )}
          {client.address && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{client.address}</span>
            </div>
          )}
          <div className="text-xs text-gray-400">Client since {formatDate(client.createdAt)}</div>
        </div>

        {client.notes && (
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</div>
            <p className="text-sm text-gray-700 leading-relaxed">{client.notes}</p>
          </div>
        )}

        <div className="px-5 py-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Jobs ({clientJobs.length})
          </div>
          <div className="space-y-2">
            {clientJobs.length === 0 && <p className="text-xs text-gray-400">No jobs yet.</p>}
            {clientJobs.map(job => (
              <button
                key={job.id}
                onClick={() => navigateTo('jobs', { jobId: job.id })}
                className="w-full text-left p-2.5 rounded-lg border border-gray-200 hover:border-red-200 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${jobTypeColor(job.type)}`}>{job.type}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${stageColor(job.stage)}`}>{job.stage}</span>
                </div>
                <div className="text-xs text-gray-600 truncate">{job.address}</div>
                <div className="text-xs text-green-700 font-semibold mt-0.5">{formatCurrency(job.revenue)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CRM({ navigateTo }) {
  const { state, dispatch } = useApp()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [vipFilter, setVipFilter] = useState(false)
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)

  const filtered = state.clients.filter(c => {
    const q = search.toLowerCase()
    if (q && !c.name.toLowerCase().includes(q) && !(c.email ?? '').toLowerCase().includes(q) && !(c.phone ?? '').includes(q)) return false
    if (typeFilter !== 'All' && c.type !== typeFilter) return false
    if (vipFilter && !c.isVIP) return false
    return true
  })

  const openAdd = () => { setForm(BLANK); setEditing(null); setShowModal(true) }
  const openEdit = (c) => { setForm({ ...c }); setEditing(c.id); setShowModal(true) }

  const clientDupes = useMemo(() => {
    if (!showModal) return []
    const name = (form.name ?? '').toLowerCase().trim()
    const phone = (form.phone ?? '').replace(/\D/g, '')
    const email = (form.email ?? '').toLowerCase().trim()
    const results = []
    for (const c of state.clients) {
      if (c.id === editing) continue
      const reasons = []
      const cName = (c.name ?? '').toLowerCase().trim()
      if (name.length >= 4 && (cName === name || cName.includes(name) || name.includes(cName))) reasons.push('name')
      if (phone.length >= 7 && phone === (c.phone ?? '').replace(/\D/g, '')) reasons.push('phone')
      if (email.length >= 5 && email === (c.email ?? '').toLowerCase().trim()) reasons.push('email')
      if (reasons.length) results.push({ record: c, reasons })
    }
    return results
  }, [form.name, form.phone, form.email, state.clients, showModal, editing])

  const save = () => {
    if (!form.name) return
    if (editing) {
      dispatch({ type: ACTIONS.UPDATE_CLIENT, payload: { ...form, id: editing } })
      setSelected(editing)
    } else {
      const newId = crypto.randomUUID()
      dispatch({ type: ACTIONS.ADD_CLIENT, payload: { ...form, id: newId } })
      setSelected(newId)
    }
    setShowModal(false)
  }

  const deleteClient = (id) => {
    const linkedJobs = state.jobs.filter(j => j.clientId === id)
    const msg = linkedJobs.length > 0
      ? `Delete this client and their ${linkedJobs.length} linked job${linkedJobs.length > 1 ? 's' : ''}? This cannot be undone.`
      : 'Delete this client? This cannot be undone.'
    if (!window.confirm(msg)) return
    dispatch({ type: ACTIONS.DELETE_CLIENT, payload: { id } })
    setSelected(null)
  }

  const selectedClient = selected ? state.clients.find(c => c.id === selected) : null

  const f = (label, key, type = 'text', opts) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {opts
        ? <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        : <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
      }
    </div>
  )

  return (
    <div className="h-full flex overflow-hidden">
      {/* Main list */}
      <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-1 flex-col overflow-hidden`}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 px-3 md:px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex gap-1">
            {['All', ...CLIENT_TYPES].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${typeFilter === t ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {t === 'All' ? 'All' : t.split(' ')[0]}
              </button>
            ))}
          </div>
          <button onClick={() => setVipFilter(v => !v)} className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${vipFilter ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <Star size={11} /> VIP
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ml-auto">
            <Plus size={14} /> Add Client
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No clients found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => (
              <ClientCard
                key={c.id}
                client={c}
                jobs={state.jobs}
                onClick={() => setSelected(c.id)}
                onToggleVIP={() => dispatch({ type: ACTIONS.TOGGLE_VIP, payload: { id: c.id } })}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedClient && (
        <ClientDetail
          client={selectedClient}
          jobs={state.jobs}
          onClose={() => setSelected(null)}
          onEdit={() => openEdit(selectedClient)}
          onDelete={() => deleteClient(selectedClient.id)}
          navigateTo={navigateTo}
        />
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Client' : 'New Client'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            {f('Full Name / Company', 'name')}
            {f('Client Type', 'type', 'text', CLIENT_TYPES)}
            <div className="grid grid-cols-2 gap-3">
              {f('Phone', 'phone', 'tel')}
              {f('Email', 'email', 'email')}
            </div>
            {f('Address', 'address')}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
              <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isVIP} onChange={e => setForm(f => ({ ...f, isVIP: e.target.checked }))} className="accent-red-600" />
              <span className="text-sm font-medium text-gray-700">Mark as VIP Client</span>
            </label>
            {clientDupes.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-800">
                  <AlertTriangle size={12} /> Possible duplicate{clientDupes.length > 1 ? 's' : ''} found
                </div>
                {clientDupes.map(({ record, reasons }) => (
                  <div key={record.id} className="flex items-center justify-between">
                    <span className="text-xs font-medium text-yellow-900">{record.name}</span>
                    <span className="text-[10px] font-semibold text-yellow-600 uppercase tracking-wide">{reasons.join(' · ')}</span>
                  </div>
                ))}
                <p className="text-[10px] text-yellow-500">You can still save — this is just a heads up.</p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={save} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                {editing ? 'Save Changes' : 'Add Client'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
