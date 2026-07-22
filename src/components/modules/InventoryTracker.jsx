import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { Package, Plus, Edit2, Trash2, X, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react'

const CATS = ['antimicrobial', 'encapsulant', 'PPE', 'poly sheeting', 'equipment', 'lab supplies', 'other']

const BLANK = { name: '', category: 'antimicrobial', unit: 'each', qty: '', threshold: '', costPerUnit: '', supplier: '' }

const SEED = [
  { name: 'Concrobium Mold Control (1gal)', category: 'antimicrobial', unit: 'gallon', qty: 8, threshold: 4, costPerUnit: 18.99, supplier: 'Restoration Supplier Co.' },
  { name: 'Fiberlock SafeCoat Encapsulant (1gal)', category: 'encapsulant', unit: 'gallon', qty: 3, threshold: 2, costPerUnit: 44.00, supplier: 'Restoration Supplier Co.' },
  { name: 'N95 Respirators (box of 20)', category: 'PPE', unit: 'box', qty: 10, threshold: 4, costPerUnit: 22.00, supplier: 'Grainger' },
  { name: 'Tyvek Disposable Coveralls (case/25)', category: 'PPE', unit: 'case', qty: 2, threshold: 1, costPerUnit: 65.00, supplier: 'Grainger' },
  { name: '6-mil Poly Sheeting (10x100ft)', category: 'poly sheeting', unit: 'roll', qty: 5, threshold: 2, costPerUnit: 38.00, supplier: 'Home Depot' },
  { name: 'Air-O-Cell Sampling Cassettes', category: 'lab supplies', unit: 'each', qty: 12, threshold: 6, costPerUnit: 9.50, supplier: 'IAQ Direct' },
]

function fmtMoney(n) {
  return '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function InventoryTracker() {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [editId, setEditId] = useState(null)
  const [filterCat, setFilterCat] = useState('all')

  const realItems = state.inventory ?? []
  const showSeeds = !state.inventory
  const items = showSeeds ? SEED : realItems

  const filtered = useMemo(() =>
    filterCat === 'all' ? items : items.filter(i => i.category === filterCat),
  [items, filterCat])

  const lowStock = items.filter(i => Number(i.qty) <= Number(i.threshold))
  const totalValue = items.reduce((s, i) => s + Number(i.qty) * Number(i.costPerUnit || 0), 0)

  const save = () => {
    if (!form.name) return
    if (editId) {
      dispatch({ type: ACTIONS.UPDATE_INVENTORY, payload: { id: editId, ...form, qty: Number(form.qty), threshold: Number(form.threshold), costPerUnit: Number(form.costPerUnit) } })
      setEditId(null)
    } else {
      dispatch({ type: ACTIONS.ADD_INVENTORY, payload: { ...form, qty: Number(form.qty), threshold: Number(form.threshold), costPerUnit: Number(form.costPerUnit) } })
    }
    setForm(BLANK)
    setShowForm(false)
  }

  const startEdit = (i) => {
    setForm({ name: i.name, category: i.category, unit: i.unit, qty: String(i.qty), threshold: String(i.threshold), costPerUnit: String(i.costPerUnit ?? ''), supplier: i.supplier ?? '' })
    setEditId(i.id ?? null)
    setShowForm(true)
  }

  const del = (id) => { if (!id) return; if (window.confirm('Delete this item?')) dispatch({ type: ACTIONS.DELETE_INVENTORY, payload: { id } }) }

  const adjustQty = (item, delta) => {
    const newQty = Math.max(0, Number(item.qty) + delta)
    if (item.id) dispatch({ type: ACTIONS.UPDATE_INVENTORY, payload: { ...item, qty: newQty } })
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-3 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package size={18} className="text-red-500" /> Inventory Tracker
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Track supplies, PPE, and equipment. Get low-stock alerts.</p>
          </div>
          <button onClick={() => { setForm(BLANK); setEditId(null); setShowForm(s => !s) }}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl">
            <Plus size={14} /> Add Item
          </button>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-0.5">Total Items</div>
            <div className="text-2xl font-bold text-gray-900">{items.length}</div>
          </div>
          <div className={`border rounded-2xl p-4 ${lowStock.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            <div className="text-xs text-gray-500 mb-0.5">Low Stock</div>
            <div className={`text-2xl font-bold ${lowStock.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>{lowStock.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-0.5">Total Inventory Value</div>
            <div className="text-2xl font-bold text-gray-900">{fmtMoney(totalValue)}</div>
          </div>
        </div>

        {lowStock.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <span className="font-bold">Low Stock Alert: </span>
              {lowStock.map(i => i.name).join(', ')}
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-blue-900">{editId ? 'Edit Item' : 'New Item'}</h3>
              <button onClick={() => { setShowForm(false); setEditId(null) }}><X size={16} className="text-blue-400" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Item Name</label>
                <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Concrobium Mold Control (1gal)"
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Category</label>
                <select value={form.category} onChange={e => f('category', e.target.value)}
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Unit</label>
                <input value={form.unit} onChange={e => f('unit', e.target.value)} placeholder="e.g. gallon, box, roll"
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Qty on Hand</label>
                <input type="number" min="0" value={form.qty} onChange={e => f('qty', e.target.value)}
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Low Stock Threshold</label>
                <input type="number" min="0" value={form.threshold} onChange={e => f('threshold', e.target.value)}
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Cost Per Unit ($)</label>
                <input type="number" min="0" step="0.01" value={form.costPerUnit} onChange={e => f('costPerUnit', e.target.value)}
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Supplier</label>
                <input value={form.supplier} onChange={e => f('supplier', e.target.value)} placeholder="e.g. Grainger, Home Depot"
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl">
                {editId ? 'Save Changes' : 'Add Item'}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null) }} className="bg-white border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {['all', ...CATS].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors capitalize
                ${filterCat === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
              {c === 'all' ? 'All Categories' : c}
            </button>
          ))}
        </div>

        {/* Items table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Item</th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-3 py-3">Cat</th>
                <th className="text-center text-xs font-bold text-gray-500 uppercase tracking-wide px-3 py-3">Qty</th>
                <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Value</th>
                <th className="w-20 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item, idx) => {
                const isLow = Number(item.qty) <= Number(item.threshold)
                return (
                  <tr key={item.id ?? idx} className={isLow ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {item.name}
                        {isLow && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">LOW</span>}
                      </div>
                      {item.supplier && <div className="text-xs text-gray-400 mt-0.5">{item.supplier}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-500 capitalize">{item.category}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.id && (
                          <button onClick={() => adjustQty(item, -1)} className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                            <ArrowDown size={10} />
                          </button>
                        )}
                        <span className={`font-bold text-sm min-w-[28px] text-center ${isLow ? 'text-red-600' : 'text-gray-900'}`}>{item.qty}</span>
                        {item.id && (
                          <button onClick={() => adjustQty(item, 1)} className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                            <ArrowUp size={10} />
                          </button>
                        )}
                        <span className="text-xs text-gray-400 ml-1">{item.unit}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-semibold text-gray-900">{fmtMoney(Number(item.qty) * Number(item.costPerUnit || 0))}</div>
                      {item.costPerUnit > 0 && <div className="text-xs text-gray-400">{fmtMoney(item.costPerUnit)}/{item.unit}</div>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => startEdit(item)} disabled={!item.id} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"><Edit2 size={12} /></button>
                        {item.id && <button onClick={() => del(item.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No items in this category</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  )
}
