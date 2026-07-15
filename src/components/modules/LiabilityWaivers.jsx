import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { formatDate } from '../../utils/helpers'
import { Shield, Plus, Trash2, CheckCircle, ChevronLeft } from 'lucide-react'
import Modal from '../shared/Modal'

const BLANK = { signedBy: '', signedDate: '', notes: '' }

export default function LiabilityWaivers({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(BLANK)

  const job = selectedJobId ? state.jobs.find(j => j.id === selectedJobId) : null
  const waivers = job?.waivers ?? []
  const client = job ? state.clients.find(c => c.id === job.clientId) : null

  const save = () => {
    if (!form.signedBy.trim() || !form.signedDate || !selectedJobId) return
    dispatch({ type: ACTIONS.ADD_WAIVER, payload: { jobId: selectedJobId, waiver: form } })
    setForm(BLANK)
    setShowModal(false)
  }

  const del = (waiverId) => { if (!window.confirm('Delete this waiver?')) return; dispatch({ type: ACTIONS.DELETE_WAIVER, payload: { jobId: selectedJobId, waiverId } }) }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        {selectedJobId && navigateTo && (
          <button onClick={() => navigateTo('jobs', { jobId: selectedJobId })} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors mr-1 flex-shrink-0">
            <ChevronLeft size={14} /> Back to Job
          </button>
        )}
        <select
          value={selectedJobId ?? ''}
          onChange={e => setSelectedJobId(e.target.value || null)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Select job…</option>
          {state.jobs.map(j => {
            const c = state.clients.find(x => x.id === j.clientId)
            return <option key={j.id} value={j.id}>{j.type} — {c?.name} — {j.stage}</option>
          })}
        </select>
        {selectedJobId && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ml-auto"
          >
            <Plus size={14} /> Log Waiver
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!selectedJobId ? (
          <div className="text-center py-16 text-gray-400">
            <Shield size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-sm">Select a job to view waivers</p>
          </div>
        ) : (
          <div className="max-w-2xl">
            {waivers.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Shield size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">No waivers logged for this job</p>
                {client && <p className="text-sm mt-1">Get {client.name} to sign a liability waiver before starting work</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {waivers.map(w => (
                  <div key={w.id} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 group hover:border-green-200 transition-colors">
                    <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={18} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{w.signedBy}</span>
                        <span className="text-xs text-gray-400">signed {formatDate(w.signedDate)}</span>
                      </div>
                      {w.notes && <p className="text-xs text-gray-600">{w.notes}</p>}
                    </div>
                    <button
                      onClick={() => del(w.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all self-start"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Log Signed Waiver" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Signed By</label>
              <input
                type="text"
                value={form.signedBy}
                onChange={e => setForm(f => ({ ...f, signedBy: e.target.value }))}
                placeholder={client?.name ?? 'Full name of signer'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date Signed</label>
              <input
                type="date"
                value={form.signedDate}
                onChange={e => setForm(f => ({ ...f, signedDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Original on file, copy provided to client, etc."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600">Cancel</button>
              <button onClick={save} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Save Waiver</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
