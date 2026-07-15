import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { COMM_TYPES, formatDateTime, speedToLead } from '../../utils/helpers'
import { Phone, Mail, MessageSquare, Users, Trash2, Plus, Zap } from 'lucide-react'
import Modal from '../shared/Modal'

const COMM_ICONS = { Call: Phone, Email: Mail, Text: MessageSquare, 'In Person': Users }
const COMM_COLORS = { Call: 'bg-blue-100 text-blue-700', Email: 'bg-purple-100 text-purple-700', Text: 'bg-green-100 text-green-700', 'In Person': 'bg-orange-100 text-orange-700' }

const BLANK = { type: 'Call', notes: '', duration: '', jobId: '' }

export default function CommunicationLog({ selectedClientId, setSelectedClientId }) {
  const { state, dispatch } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(BLANK)

  const client = selectedClientId ? state.clients.find(c => c.id === selectedClientId) : null
  const comms = client ? [...(client.communications ?? [])].sort((a, b) => new Date(b.date) - new Date(a.date)) : []
  const stl = client ? speedToLead(client.createdAt, client.communications) : null

  const save = () => {
    if (!form.notes.trim() || !selectedClientId) return
    dispatch({
      type: ACTIONS.ADD_COMMUNICATION,
      payload: {
        clientId: selectedClientId,
        comm: { type: form.type, notes: form.notes.trim(), duration: form.duration ? Number(form.duration) : null, jobId: form.jobId || null },
      },
    })
    setForm(BLANK)
    setShowModal(false)
  }

  const del = (commId) => { if (!window.confirm('Delete this communication log entry?')) return; dispatch({ type: ACTIONS.DELETE_COMMUNICATION, payload: { clientId: selectedClientId, commId } }) }

  const f = (label, key, type = 'text', opts) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {opts
        ? <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">{opts.map(o => <option key={o.value ?? o}>{o.label ?? o}</option>)}</select>
        : <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
      }
    </div>
  )

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Client selector + toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <select
          value={selectedClientId ?? ''}
          onChange={e => setSelectedClientId(e.target.value || null)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Select client…</option>
          {state.clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
        </select>

        {client && stl && (
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            <Zap size={13} className="text-green-600" />
            <span className="text-xs font-semibold text-green-700">Speed-to-lead: {stl}</span>
          </div>
        )}
        {client && !stl && (
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
            <Zap size={13} className="text-red-500" />
            <span className="text-xs font-semibold text-red-600">No contact yet — call now!</span>
          </div>
        )}

        {client && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ml-auto"
          >
            <Plus size={14} /> Log Contact
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!client && (
          <div className="text-center py-16 text-gray-400">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-sm">Select a client to view their communication history</p>
          </div>
        )}

        {client && comms.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Phone size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">No communications logged yet</p>
            <p className="text-sm mt-1">Log the first contact using the button above</p>
          </div>
        )}

        {client && comms.length > 0 && (
          <div className="max-w-2xl space-y-3">
            {comms.map(comm => {
              const Icon = COMM_ICONS[comm.type] ?? MessageSquare
              const linkedJob = comm.jobId ? state.jobs.find(j => j.id === comm.jobId) : null
              return (
                <div key={comm.id} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 group hover:border-gray-300 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${COMM_COLORS[comm.type] ?? 'bg-gray-100'}`}>
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${COMM_COLORS[comm.type] ?? 'bg-gray-100 text-gray-600'}`}>{comm.type}</span>
                      {comm.duration && <span className="text-xs text-gray-400">{comm.duration} min</span>}
                      {linkedJob && <span className="text-xs text-blue-600 font-medium">{linkedJob.type} Job</span>}
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{comm.notes}</p>
                    <div className="text-xs text-gray-400 mt-1.5">{formatDateTime(comm.date)}</div>
                  </div>
                  <button
                    onClick={() => del(comm.id)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all self-start"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Log Communication" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {f('Type', 'type', 'text', COMM_TYPES)}
              {f('Duration (min, calls)', 'duration', 'number')}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Linked Job (optional)</label>
              <select value={form.jobId} onChange={e => setForm(f => ({ ...f, jobId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">None</option>
                {state.jobs.filter(j => j.clientId === selectedClientId).map(j => (
                  <option key={j.id} value={j.id}>{j.type} — {j.address} — {j.stage}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
              <textarea rows={4} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="What was discussed?" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600">Cancel</button>
              <button onClick={save} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Save</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
