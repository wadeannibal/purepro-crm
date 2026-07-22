import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { Users, Plus, Trash2, Pencil, Check, X, ChevronLeft } from 'lucide-react'

const TRADES = ['Drywall', 'Painting', 'HVAC', 'Carpet / Flooring', 'Plumbing', 'Electrical', 'Roofing', 'General Contractor', 'Other']

const STATUS_COLORS = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
}

const BLANK = { name: '', trade: '', quotedAmount: '', actualAmount: '', paymentStatus: 'unpaid', notes: '' }

export default function SubcontractorManagement({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()
  const [form, setForm] = useState(BLANK)
  const [editId, setEditId] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [adding, setAdding] = useState(false)

  const job = selectedJobId ? state.jobs.find(j => j.id === selectedJobId) : null
  const subs = job?.subcontractors ?? []

  const totalQuoted = subs.reduce((s, x) => s + (x.quotedAmount ?? 0), 0)
  const totalActual = subs.reduce((s, x) => s + (x.actualAmount ?? 0), 0)

  const handleAdd = () => {
    if (!form.name.trim()) return
    dispatch({
      type: ACTIONS.ADD_SUBCONTRACTOR,
      payload: {
        jobId: selectedJobId,
        sub: {
          ...form,
          quotedAmount: parseFloat(form.quotedAmount) || 0,
          actualAmount: parseFloat(form.actualAmount) || 0,
        },
      },
    })
    setForm(BLANK)
    setAdding(false)
  }

  const startEdit = (sub) => {
    setEditId(sub.id)
    setEditRow({ ...sub, quotedAmount: sub.quotedAmount ?? '', actualAmount: sub.actualAmount ?? '' })
  }

  const saveEdit = () => {
    dispatch({
      type: ACTIONS.UPDATE_SUBCONTRACTOR,
      payload: {
        jobId: selectedJobId,
        sub: {
          ...editRow,
          quotedAmount: parseFloat(editRow.quotedAmount) || 0,
          actualAmount: parseFloat(editRow.actualAmount) || 0,
        },
      },
    })
    setEditId(null)
  }

  const deleteSub = (subId) => {
    if (!window.confirm('Delete this subcontractor record?')) return
    dispatch({ type: ACTIONS.DELETE_SUBCONTRACTOR, payload: { jobId: selectedJobId, subId } })
  }

  if (!selectedJobId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Users size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium text-sm mb-3">Select a job to manage subcontractors</p>
          <select onChange={e => setSelectedJobId(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
            <option value="">Choose a job…</option>
            {state.jobs.map(j => {
              const c = state.clients.find(x => x.id === j.clientId)
              return <option key={j.id} value={j.id}>{j.type} — {c?.name} — {j.stage}</option>
            })}
          </select>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-3 md:p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedJobId && navigateTo && (
            <button onClick={() => navigateTo('jobs', { jobId: selectedJobId })} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors mr-1 flex-shrink-0">
              <ChevronLeft size={14} /> Back to Job
            </button>
          )}
          <select value={selectedJobId} onChange={e => { setSelectedJobId(e.target.value); setEditId(null); setEditRow(null); setAdding(false) }} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
            {state.jobs.map(j => {
              const c = state.clients.find(x => x.id === j.clientId)
              return <option key={j.id} value={j.id}>{j.type} — {c?.name}</option>
            })}
          </select>
          <button onClick={() => setAdding(true)} className="ml-auto flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors">
            <Plus size={14} /> Add Subcontractor
          </button>
        </div>

        {/* Totals */}
        {subs.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Subcontractors</div>
              <div className="text-2xl font-bold text-gray-900">{subs.length}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Total Quoted</div>
              <div className="text-xl font-bold text-gray-900">{formatCurrency(totalQuoted)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Total Actual</div>
              <div className={`text-xl font-bold ${totalActual > totalQuoted ? 'text-red-700' : 'text-green-700'}`}>{formatCurrency(totalActual)}</div>
            </div>
          </div>
        )}

        {/* Add form */}
        {adding && (
          <div className="bg-white border border-red-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">New Subcontractor</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
                <input autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Company or person name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Trade</label>
                <select value={form.trade} onChange={e => setForm(f => ({ ...f, trade: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">Select trade…</option>
                  {TRADES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Quoted Amount</label>
                <input type="number" value={form.quotedAmount} onChange={e => setForm(f => ({ ...f, quotedAmount: e.target.value }))} placeholder="0.00" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Actual Amount</label>
                <input type="number" value={form.actualAmount} onChange={e => setForm(f => ({ ...f, actualAmount: e.target.value }))} placeholder="0.00" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Status</label>
                <select value={form.paymentStatus} onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Add Subcontractor</button>
              <button onClick={() => { setAdding(false); setForm(BLANK) }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* List */}
        {subs.length === 0 && !adding ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">No subcontractors logged</p>
            <p className="text-sm mt-1">Add subs to track quoted vs actual costs</p>
          </div>
        ) : (
          <div className="space-y-2">
            {subs.map(sub => (
              <div key={sub.id} className="bg-white border border-gray-200 rounded-xl p-4">
                {editId === sub.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input value={editRow.name} onChange={e => setEditRow(r => ({ ...r, name: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Name" />
                      <select value={editRow.trade} onChange={e => setEditRow(r => ({ ...r, trade: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                        <option value="">Trade…</option>
                        {TRADES.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <input type="number" value={editRow.quotedAmount} onChange={e => setEditRow(r => ({ ...r, quotedAmount: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Quoted" />
                      <input type="number" value={editRow.actualAmount} onChange={e => setEditRow(r => ({ ...r, actualAmount: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Actual" />
                      <select value={editRow.paymentStatus} onChange={e => setEditRow(r => ({ ...r, paymentStatus: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                      </select>
                      <input value={editRow.notes} onChange={e => setEditRow(r => ({ ...r, notes: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Notes" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"><Check size={12} /> Save</button>
                      <button onClick={() => setEditId(null)} className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg"><X size={12} /> Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{sub.name}</span>
                        {sub.trade && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{sub.trade}</span>}
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[sub.paymentStatus]}`}>{sub.paymentStatus}</span>
                      </div>
                      {sub.notes && <p className="text-xs text-gray-500 truncate">{sub.notes}</p>}
                    </div>
                    <div className="sm:text-right flex-shrink-0">
                      <div className="text-xs text-gray-400">Quoted / Actual</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(sub.quotedAmount)} / <span className={sub.actualAmount > sub.quotedAmount ? 'text-red-600' : 'text-green-700'}>{formatCurrency(sub.actualAmount)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(sub)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"><Pencil size={14} /></button>
                      <button onClick={() => deleteSub(sub.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
