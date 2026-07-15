import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { formatCurrency } from '../../utils/helpers'
import { OVERHEAD_DEFAULTS } from '../../data/proposalTemplates'
import { Percent, Plus, Trash2, Pencil, Check, X } from 'lucide-react'

const WORK_HOURS_PER_MONTH = 160

export default function OverheadCalculator() {
  const { state, dispatch } = useApp()
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', amount: '' })
  const [editId, setEditId] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [targetMargin, setTargetMargin] = useState(30)
  const [avgJobSize, setAvgJobSize] = useState(4000)

  const items = state.overheadItems ?? []
  const totalMonthly = items.reduce((s, o) => s + (o.amount ?? 0), 0)
  const hourlyBreakEven = totalMonthly / WORK_HOURS_PER_MONTH
  const minJobPrice = totalMonthly / Math.max(1, avgJobSize)
  const recommendedMarkup = targetMargin / (1 - targetMargin / 100)

  const handleAdd = () => {
    if (!newItem.name.trim() || !newItem.amount) return
    dispatch({ type: ACTIONS.ADD_OVERHEAD_ITEM, payload: { name: newItem.name.trim(), amount: parseFloat(newItem.amount) || 0 } })
    setNewItem({ name: '', amount: '' })
    setAdding(false)
  }

  const handleDelete = (id) => { if (!window.confirm('Delete this overhead item?')) return; dispatch({ type: ACTIONS.DELETE_OVERHEAD_ITEM, payload: { id } }) }

  const startEdit = (o) => { setEditId(o.id); setEditRow({ name: o.name, amount: o.amount }) }

  const saveEdit = () => {
    dispatch({ type: ACTIONS.UPDATE_OVERHEAD_ITEM, payload: { id: editId, name: editRow.name, amount: parseFloat(editRow.amount) || 0 } })
    setEditId(null)
  }

  const loadDefaults = () => {
    if (items.length > 0 && !confirm('Replace current overhead items with defaults?')) return
    items.forEach(o => dispatch({ type: ACTIONS.DELETE_OVERHEAD_ITEM, payload: { id: o.id } }))
    OVERHEAD_DEFAULTS.forEach(d => dispatch({ type: ACTIONS.ADD_OVERHEAD_ITEM, payload: { name: d.name, amount: d.amount } }))
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Output cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Monthly Overhead</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalMonthly)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Hourly Break-Even</div>
            <div className="text-2xl font-bold text-red-700">${hourlyBreakEven.toFixed(0)}/hr</div>
            <div className="text-xs text-gray-400 mt-1">at {WORK_HOURS_PER_MONTH}h/mo</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Min Billable Rate</div>
            <div className="text-2xl font-bold text-orange-700">${(hourlyBreakEven * 1.15).toFixed(0)}/hr</div>
            <div className="text-xs text-gray-400 mt-1">break-even + 15%</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Recommended Markup</div>
            <div className="text-2xl font-bold text-green-700">{recommendedMarkup.toFixed(1)}%</div>
            <div className="text-xs text-gray-400 mt-1">for {targetMargin}% margin</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Target Gross Margin %</label>
            <div className="flex items-center gap-2">
              <input type="range" min="10" max="60" value={targetMargin} onChange={e => setTargetMargin(Number(e.target.value))} className="flex-1 accent-red-600" />
              <span className="text-sm font-bold text-gray-900 w-10 text-right">{targetMargin}%</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">Markup = {recommendedMarkup.toFixed(1)}% on cost</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Average Job Revenue</label>
            <input type="number" value={avgJobSize} onChange={e => setAvgJobSize(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            <div className="text-xs text-gray-400 mt-1">Min jobs/mo to cover overhead: {(totalMonthly / Math.max(avgJobSize, 1)).toFixed(1)}</div>
          </div>
        </div>

        {/* Overhead items */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Monthly Fixed Costs</h2>
            <div className="flex gap-2">
              <button onClick={loadDefaults} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors">Load Defaults</button>
              <button onClick={() => setAdding(true)} className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                <Plus size={12} /> Add Cost
              </button>
            </div>
          </div>

          {adding && (
            <div className="px-5 py-4 border-b border-gray-100 bg-red-50">
              <div className="flex gap-2">
                <input autoFocus value={newItem.name} onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))} placeholder="Cost name (e.g. Insurance)" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                <input type="number" value={newItem.amount} onChange={e => setNewItem(n => ({ ...n, amount: e.target.value }))} placeholder="Monthly $" className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                <button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold">Add</button>
                <button onClick={() => { setAdding(false); setNewItem({ name: '', amount: '' }) }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold">Cancel</button>
              </div>
            </div>
          )}

          {items.length === 0 && !adding ? (
            <div className="text-center py-12 text-gray-400">
              <Percent size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">No overhead items yet</p>
              <button onClick={loadDefaults} className="mt-2 text-xs text-red-600 hover:underline">Load default items</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map(o => (
                <div key={o.id} className="flex items-center gap-4 px-5 py-3 group">
                  {editId === o.id ? (
                    <>
                      <input value={editRow.name} onChange={e => setEditRow(r => ({ ...r, name: e.target.value }))} className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                      <input type="number" value={editRow.amount} onChange={e => setEditRow(r => ({ ...r, amount: e.target.value }))} className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-red-500" />
                      <button onClick={saveEdit} className="p-1.5 rounded text-green-600 hover:bg-green-50"><Check size={14} /></button>
                      <button onClick={() => setEditId(null)} className="p-1.5 rounded text-gray-400 hover:bg-gray-100"><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-gray-800">{o.name}</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(o.amount)}/mo</span>
                      <button onClick={() => startEdit(o)} className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(o.id)} className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all"><Trash2 size={13} /></button>
                    </>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-4 px-5 py-3 bg-gray-50 border-t-2 border-gray-200">
                <span className="flex-1 text-sm font-bold text-gray-900">Total Monthly Overhead</span>
                <span className="text-base font-bold text-gray-900">{formatCurrency(totalMonthly)}/mo</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          <strong>Note:</strong> This calculator uses {WORK_HOURS_PER_MONTH} billable hours/month as the denominator. Adjust based on your actual available hours. Break-even rate assumes all hours are billable — real-world rate should be higher to account for non-billable time.
        </div>
      </div>
    </div>
  )
}
