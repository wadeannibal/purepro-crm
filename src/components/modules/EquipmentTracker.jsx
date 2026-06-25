import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { EQUIPMENT_TYPES, formatDate } from '../../utils/helpers'
import { Wrench, Plus, Edit2, Trash2, Package } from 'lucide-react'
import Modal from '../shared/Modal'

const STATUS_COLORS = {
  available: 'bg-green-100 text-green-700',
  deployed: 'bg-red-100 text-red-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
}

const BLANK = { name: '', type: 'Air Scrubber', serialNumber: '', status: 'available', jobId: '', placedDate: '', pickupDate: '' }

export default function EquipmentTracker() {
  const { state, dispatch } = useApp()
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)

  const equipment = state.equipment.filter(e => filter === 'all' || e.status === filter)

  const openAdd = () => { setForm(BLANK); setEditing(null); setShowModal(true) }
  const openEdit = (eq) => { setForm({ ...eq, jobId: eq.jobId ?? '', placedDate: eq.placedDate ?? '', pickupDate: eq.pickupDate ?? '' }); setEditing(eq.id); setShowModal(true) }

  const save = () => {
    if (!form.name) return
    const payload = {
      ...form,
      jobId: form.jobId || null,
      placedDate: form.placedDate || null,
      pickupDate: form.pickupDate || null,
    }
    if (editing) {
      dispatch({ type: ACTIONS.UPDATE_EQUIPMENT, payload: { ...payload, id: editing } })
    } else {
      dispatch({ type: ACTIONS.ADD_EQUIPMENT, payload })
    }
    setShowModal(false)
  }

  const del = (id) => {
    if (window.confirm('Delete this equipment record?'))
      dispatch({ type: ACTIONS.DELETE_EQUIPMENT, payload: { id } })
  }

  const getJobLabel = (jobId) => {
    const job = state.jobs.find(j => j.id === jobId)
    if (!job) return null
    const client = state.clients.find(c => c.id === job.clientId)
    return `${job.type} — ${client?.name ?? ''}`
  }

  const f = (label, key, type = 'text', opts) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {opts
        ? <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">{opts.map(o => <option key={o}>{o}</option>)}</select>
        : <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
      }
    </div>
  )

  const counts = {
    all: state.equipment.length,
    available: state.equipment.filter(e => e.status === 'available').length,
    deployed: state.equipment.filter(e => e.status === 'deployed').length,
    maintenance: state.equipment.filter(e => e.status === 'maintenance').length,
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex gap-1.5">
          {[['all', 'All'], ['available', 'Available'], ['deployed', 'Deployed'], ['maintenance', 'Maintenance']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${filter === val ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {label} <span className="opacity-60">({counts[val]})</span>
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ml-auto">
          <Plus size={14} /> Add Equipment
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {equipment.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">No equipment {filter !== 'all' ? `with status "${filter}"` : ''}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
            {equipment.map(eq => (
              <div key={eq.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wrench size={18} className="text-gray-500" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(eq)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"><Edit2 size={13} /></button>
                    <button onClick={() => del(eq.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="font-semibold text-gray-900 text-sm mb-0.5">{eq.name}</div>
                <div className="text-xs text-gray-500 mb-2">{eq.type} · {eq.serialNumber}</div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[eq.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {eq.status.charAt(0).toUpperCase() + eq.status.slice(1)}
                </span>
                {eq.jobId && (
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">Job:</span> {getJobLabel(eq.jobId)}
                    {eq.placedDate && <div>Placed: {formatDate(eq.placedDate)}</div>}
                    {eq.pickupDate && <div>Pickup: {formatDate(eq.pickupDate)}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit Equipment' : 'Add Equipment'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            {f('Equipment Name', 'name')}
            <div className="grid grid-cols-2 gap-3">
              {f('Type', 'type', 'text', EQUIPMENT_TYPES)}
              {f('Status', 'status', 'text', ['available', 'deployed', 'maintenance'])}
            </div>
            {f('Serial Number', 'serialNumber')}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Assigned to Job</label>
              <select value={form.jobId} onChange={e => setForm(f => ({ ...f, jobId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">Not assigned</option>
                {state.jobs.map(j => {
                  const c = state.clients.find(x => x.id === j.clientId)
                  return <option key={j.id} value={j.id}>{j.type} — {c?.name} — {j.stage}</option>
                })}
              </select>
            </div>
            {form.jobId && (
              <div className="grid grid-cols-2 gap-3">
                {f('Placed Date', 'placedDate', 'date')}
                {f('Pickup Date', 'pickupDate', 'date')}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600">Cancel</button>
              <button onClick={save} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                {editing ? 'Save Changes' : 'Add Equipment'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
