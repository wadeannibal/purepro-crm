import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import {
  computeEstimateTotals, formatCurrency, formatCurrencyExact, estimateStatusColor,
} from '../../utils/helpers'
import { STANDARD_TERMS } from '../../data/proposalTemplates'
import {
  Plus, Trash2, Send, CheckCircle, XCircle, FileText, ChevronRight, User,
  ChevronUp, ChevronDown, Search, X, Star, BookOpen, Sparkles, Loader2,
} from 'lucide-react'

// ── Category definitions ─────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'containment', label: 'Containment', color: 'bg-blue-100 text-blue-800' },
  { id: 'demolition', label: 'Demo & Removal', color: 'bg-orange-100 text-orange-800' },
  { id: 'cleaning', label: 'Cleaning & Treatment', color: 'bg-green-100 text-green-800' },
  { id: 'equipment', label: 'Equipment', color: 'bg-purple-100 text-purple-800' },
  { id: 'materials', label: 'Materials', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'labor', label: 'Labor', color: 'bg-red-100 text-red-800' },
  { id: 'lab', label: 'Lab Testing', color: 'bg-teal-100 text-teal-800' },
  { id: 'fees', label: 'Fees & Other', color: 'bg-gray-100 text-gray-700' },
]
const catLabel = (id) => CATEGORIES.find(c => c.id === id)?.label ?? id
const catColor = (id) => CATEGORIES.find(c => c.id === id)?.color ?? 'bg-gray-100 text-gray-700'

// ── Built-in preset library ──────────────────────────────────────────────────
const BUILT_IN_PRESETS = [
  // CONTAINMENT
  { category: 'containment', name: 'Containment - Small', unit: 'EA', unitPrice: 450.00 },
  { category: 'containment', name: 'Containment - Medium', unit: 'EA', unitPrice: 917.93 },
  { category: 'containment', name: 'Containment - Large', unit: 'EA', unitPrice: 1400.00 },
  { category: 'containment', name: 'Containment Pole', unit: 'EA', unitPrice: 37.34 },
  { category: 'containment', name: 'Containment Barrier / Decon Chamber', unit: 'SF', unitPrice: 1.31 },
  { category: 'containment', name: 'Decontamination Chamber', unit: 'EA', unitPrice: 100.00 },
  { category: 'containment', name: 'Zipper / Peel & Seal', unit: 'EA', unitPrice: 25.32 },
  { category: 'containment', name: 'Decontamination Process', unit: 'EA', unitPrice: 150.00 },
  { category: 'containment', name: 'Poly Sheeting (6 Mil)', unit: 'SF', unitPrice: 0.15 },
  // DEMO & REMOVAL
  { category: 'demolition', name: 'Remove Drywall', unit: 'SF', unitPrice: 0.88 },
  { category: 'demolition', name: 'Tear Out Wet Drywall — Bag for Disposal', unit: 'SF', unitPrice: 1.45 },
  { category: 'demolition', name: 'Tear Out Wet Carpet — Cut & Bag', unit: 'SF', unitPrice: 0.92 },
  { category: 'demolition', name: 'Remove Carpet Pad', unit: 'SF', unitPrice: 0.35 },
  { category: 'demolition', name: 'Remove Baseboard', unit: 'LF', unitPrice: 1.50 },
  { category: 'demolition', name: 'Remove Vanity', unit: 'LF', unitPrice: 10.62 },
  { category: 'demolition', name: 'Remove Flooring', unit: 'SF', unitPrice: 1.20 },
  { category: 'demolition', name: 'Remove Insulation', unit: 'SF', unitPrice: 0.75 },
  { category: 'demolition', name: 'Haul Debris — Pickup Truck Load (w/ Dump)', unit: 'EA', unitPrice: 214.38 },
  // CLEANING & TREATMENT
  { category: 'cleaning', name: 'Environmental Cleaning (2 Damp + 1 Dry Wipe)', unit: 'SF', unitPrice: 1.13 },
  { category: 'cleaning', name: 'HEPA Vacuuming — Detailed', unit: 'SF', unitPrice: 1.08 },
  { category: 'cleaning', name: 'Clean Walls & Ceiling — Heavy', unit: 'SF', unitPrice: 1.74 },
  { category: 'cleaning', name: 'Sanding / Wire Brush Exposed Framing', unit: 'SF', unitPrice: 1.70 },
  { category: 'cleaning', name: 'Apply Mold/Mildew Stain Remover', unit: 'SF', unitPrice: 0.82 },
  { category: 'cleaning', name: 'Sealant / Encapsulant', unit: 'GAL', unitPrice: 65.66 },
  { category: 'cleaning', name: 'Antimicrobial Spray Treatment', unit: 'GAL', unitPrice: 75.00 },
  { category: 'cleaning', name: 'Dry Ice Blasting', unit: 'SF', unitPrice: 3.50 },
  { category: 'cleaning', name: 'Fogging Treatment', unit: 'EA', unitPrice: 200.00 },
  { category: 'cleaning', name: 'Ozone Treatment', unit: 'EA', unitPrice: 250.00 },
  { category: 'cleaning', name: 'Mold Resistant Primer', unit: 'GAL', unitPrice: 55.00 },
  // EQUIPMENT
  { category: 'equipment', name: 'Emergency Service Call — Business Hours', unit: 'EA', unitPrice: 237.50 },
  { category: 'equipment', name: 'Emergency Service Call — After Hours', unit: 'EA', unitPrice: 350.00 },
  { category: 'equipment', name: 'Neg. Air Fan / Air Scrubber — Large', unit: 'DA', unitPrice: 120.00 },
  { category: 'equipment', name: 'Neg. Air Fan / Air Scrubber — Small', unit: 'DA', unitPrice: 85.00 },
  { category: 'equipment', name: 'HEPA Filter (for Neg Air Fan)', unit: 'EA', unitPrice: 221.87 },
  { category: 'equipment', name: 'Dehumidifier', unit: 'DA', unitPrice: 75.00 },
  { category: 'equipment', name: 'Air Mover / Fan', unit: 'DA', unitPrice: 35.00 },
  { category: 'equipment', name: 'Equipment Setup, Takedown & Monitoring', unit: 'HR', unitPrice: 85.65 },
  { category: 'equipment', name: 'Equipment Decontamination Charge', unit: 'EA', unitPrice: 48.76 },
  // MATERIALS
  { category: 'materials', name: 'PPE — Full Hazmat Suit', unit: 'EA', unitPrice: 53.85 },
  { category: 'materials', name: 'PPE — Hazardous Cleanup Suit', unit: 'EA', unitPrice: 24.17 },
  { category: 'materials', name: 'Respirator Cartridge — HEPA (per pair)', unit: 'PR', unitPrice: 19.69 },
  { category: 'materials', name: 'Duct Tape', unit: 'EA', unitPrice: 8.00 },
  { category: 'materials', name: 'Double-Sided Tape', unit: 'EA', unitPrice: 12.00 },
  { category: 'materials', name: 'Antimicrobial Product', unit: 'EA', unitPrice: 85.00 },
  { category: 'materials', name: 'Visqueen / Poly Sheeting (roll)', unit: 'EA', unitPrice: 45.00 },
  // LABOR
  { category: 'labor', name: 'Lead Technician', unit: 'HR', unitPrice: 75.00 },
  { category: 'labor', name: 'Remediation Technician', unit: 'HR', unitPrice: 55.00 },
  { category: 'labor', name: 'Project Manager', unit: 'HR', unitPrice: 95.00 },
  { category: 'labor', name: 'Hazardous Waste / Mold Labor Minimum', unit: 'EA', unitPrice: 238.32 },
  { category: 'labor', name: 'Cabinetry Labor Minimum', unit: 'EA', unitPrice: 195.55 },
  // LAB TESTING
  { category: 'lab', name: 'ERMI Test', unit: 'EA', unitPrice: 395.00 },
  { category: 'lab', name: 'HERTSMI-2 Test', unit: 'EA', unitPrice: 295.00 },
  { category: 'lab', name: 'Air Sample', unit: 'EA', unitPrice: 125.00 },
  { category: 'lab', name: 'Tape Lift / Swab Sample', unit: 'EA', unitPrice: 95.00 },
  { category: 'lab', name: 'Post-Remediation Clearance Test', unit: 'EA', unitPrice: 350.00 },
  // FEES & OTHER
  { category: 'fees', name: 'Dump Fee', unit: 'EA', unitPrice: 125.00 },
  { category: 'fees', name: 'Travel / Mobilization', unit: 'EA', unitPrice: 75.00 },
  { category: 'fees', name: 'Permit', unit: 'EA', unitPrice: 200.00 },
  { category: 'fees', name: 'Rush / After-Hours Service Fee', unit: 'EA', unitPrice: 250.00 },
  { category: 'fees', name: 'Equipment Storage Fee', unit: 'EA', unitPrice: 100.00 },
  { category: 'fees', name: 'First Time Customer Discount', unit: 'EA', unitPrice: -500.00 },
]

// ── Custom library storage ───────────────────────────────────────────────────
const LIB_KEY = 'purepro_item_library'
function loadCustomLibrary() {
  try { return JSON.parse(localStorage.getItem(LIB_KEY)) ?? [] } catch { return [] }
}
function addToCustomLibrary(item) {
  const existing = loadCustomLibrary()
  const entry = { id: crypto.randomUUID(), category: item.category, name: item.name, unit: item.unit, unitPrice: item.unitPrice }
  const updated = [entry, ...existing.filter(e => e.name.toLowerCase() !== item.name.toLowerCase())]
  localStorage.setItem(LIB_KEY, JSON.stringify(updated))
  return updated
}
function removeFromCustomLibrary(id) {
  const updated = loadCustomLibrary().filter(e => e.id !== id)
  localStorage.setItem(LIB_KEY, JSON.stringify(updated))
  return updated
}

function uid() { return crypto.randomUUID() }

const BLANK_ESTIMATE = {
  status: 'Draft',
  sentAt: null,
  scopeNotes: '',
  termsNotes: STANDARD_TERMS,
  lineItems: [],
  overheadMarginPct: 25,
  taxPct: 0,
  discountPct: 0,
}

const BLANK_NEW = { name: '', phone: '', email: '', address: '', type: 'Mold' }
const BLANK_EXISTING = { clientId: '', address: '', type: 'Mold' }

// ── Totals sidebar ───────────────────────────────────────────────────────────
function TotalsPanel({ estimate, onMarginChange, onTaxChange, onDiscountChange }) {
  const t = computeEstimateTotals(estimate)
  const categoryTotals = {}
  for (const item of (estimate.lineItems ?? [])) {
    const tot = (item.qty ?? 0) * (item.unitPrice ?? 0)
    if (tot !== 0) categoryTotals[item.category] = (categoryTotals[item.category] ?? 0) + tot
  }
  const rows = CATEGORIES.filter(c => categoryTotals[c.id] !== undefined).map(c => ({ label: c.label, val: categoryTotals[c.id] }))

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 sticky top-4">
      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Estimate Totals</h3>
      {rows.map(r => (
        <div key={r.label} className="flex justify-between text-sm">
          <span className="text-gray-500 truncate mr-2">{r.label}</span>
          <span className={r.val < 0 ? 'text-green-700 font-medium' : 'text-gray-700'}>{formatCurrency(r.val)}</span>
        </div>
      ))}
      {rows.length > 0 && (
        <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2">
          <span className="text-gray-700">Subtotal</span>
          <span className="text-gray-900">{formatCurrency(t.subtotal)}</span>
        </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Discount</span>
        <div className="flex items-center gap-1">
          <input
            type="number" min="0" max="100"
            value={estimate.discountPct ?? 0}
            onChange={e => onDiscountChange(Number(e.target.value))}
            className="w-14 border border-gray-200 rounded px-2 py-0.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-red-400"
          />
          <span className="text-xs text-gray-400">%</span>
          <span className="text-green-700 w-20 text-right">{t.discountAmt > 0 ? `− ${formatCurrency(t.discountAmt)}` : '—'}</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Margin</span>
        <div className="flex items-center gap-1">
          <input
            type="number" min="0" max="100"
            value={estimate.overheadMarginPct ?? 25}
            onChange={e => onMarginChange(Number(e.target.value))}
            className="w-14 border border-gray-200 rounded px-2 py-0.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-red-400"
          />
          <span className="text-xs text-gray-400">%</span>
          <span className="text-gray-700 w-20 text-right">{t.margin > 0 ? formatCurrency(t.margin) : '—'}</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Tax</span>
        <div className="flex items-center gap-1">
          <input
            type="number" min="0" max="20"
            value={estimate.taxPct ?? 0}
            onChange={e => onTaxChange(Number(e.target.value))}
            className="w-14 border border-gray-200 rounded px-2 py-0.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-red-400"
          />
          <span className="text-xs text-gray-400">%</span>
          <span className="text-gray-700 w-20 text-right">{t.tax > 0 ? formatCurrency(t.tax) : '—'}</span>
        </div>
      </div>
      <div className="flex justify-between text-base font-black border-t-2 border-gray-900 pt-2">
        <span className="text-gray-900">Grand Total</span>
        <span className="text-red-700">{formatCurrencyExact(t.grandTotal)}</span>
      </div>
    </div>
  )
}

// ── Single line item row ─────────────────────────────────────────────────────
function LineItemRow({ item, isFirst, isLast, onUpdate, onDelete, onMoveUp, onMoveDown, onSaveToLibrary }) {
  const total = (item.qty ?? 0) * (item.unitPrice ?? 0)
  return (
    <div className="group flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
      <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-tight text-center ${catColor(item.category)}`} style={{ minWidth: '68px' }}>
        {catLabel(item.category)}
      </span>
      <input
        value={item.name}
        onChange={e => onUpdate({ name: e.target.value })}
        className="flex-1 min-w-0 text-sm text-gray-800 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-red-400 focus:bg-white rounded px-1 py-0.5"
      />
      <input
        type="number"
        value={item.qty}
        onChange={e => onUpdate({ qty: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })}
        className="w-14 text-sm text-right border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"
      />
      <input
        value={item.unit}
        onChange={e => onUpdate({ unit: e.target.value.toUpperCase() })}
        className="w-10 text-xs text-center border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-red-400 bg-white uppercase"
        placeholder="EA"
      />
      <div className="relative w-24 shrink-0">
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">$</span>
        <input
          type="number"
          value={item.unitPrice}
          onChange={e => onUpdate({ unitPrice: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })}
          className="w-full text-sm text-right border border-gray-200 rounded pl-4 pr-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"
        />
      </div>
      <span className={`w-24 text-sm font-semibold text-right shrink-0 ${total < 0 ? 'text-green-700' : 'text-gray-900'}`}>
        {formatCurrencyExact(total)}
      </span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={onMoveUp} disabled={isFirst} title="Move up" className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-default">
          <ChevronUp size={13} />
        </button>
        <button onClick={onMoveDown} disabled={isLast} title="Move down" className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-default">
          <ChevronDown size={13} />
        </button>
        <button onClick={onSaveToLibrary} title="Save to My Items" className="p-1 text-gray-400 hover:text-yellow-500">
          <Star size={13} />
        </button>
        <button onClick={onDelete} title="Delete" className="p-1 text-gray-400 hover:text-red-600">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Library slide-over panel ─────────────────────────────────────────────────
function LibraryPanel({ onAdd, onClose }) {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [showMine, setShowMine] = useState(false)
  const [customLib, setCustomLib] = useState(loadCustomLibrary)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category: 'containment', name: '', unit: 'EA', unitPrice: '' })

  const allItems = showMine ? customLib : BUILT_IN_PRESETS
  const filtered = allItems.filter(p => {
    const matchCat = filterCat === 'all' || p.category === filterCat
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const grouped = {}
  for (const p of filtered) {
    if (!grouped[p.category]) grouped[p.category] = []
    grouped[p.category].push(p)
  }

  const handleSaveCustom = () => {
    if (!form.name.trim()) return
    const updated = addToCustomLibrary({ ...form, unitPrice: parseFloat(form.unitPrice) || 0 })
    setCustomLib(updated)
    setForm({ category: 'containment', name: '', unit: 'EA', unitPrice: '' })
    setShowForm(false)
    setShowMine(true)
    setFilterCat('all')
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-[440px] bg-white shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-red-500" />
            <h3 className="font-bold text-gray-900 text-sm">Line Item Library</h3>
            <span className="text-xs text-gray-400">— click any item to add</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Search + toggles */}
        <div className="px-4 pt-3 pb-2 space-y-2 shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items…"
              className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowMine(false); setFilterCat('all') }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${!showMine ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              All Items ({BUILT_IN_PRESETS.length})
            </button>
            <button
              onClick={() => { setShowMine(true); setFilterCat('all') }}
              className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${showMine ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Star size={11} /> My Saved ({customLib.length})
            </button>
          </div>
          {!showMine && (
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setFilterCat('all')} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${filterCat === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>All</button>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setFilterCat(c.id)} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${filterCat === c.id ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {showMine && customLib.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Star size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">No saved items yet</p>
              <p className="text-xs mt-2 text-gray-400 leading-relaxed">Click ★ on any estimate line item to save it here, or add a custom item below</p>
            </div>
          )}
          {Object.keys(grouped).length === 0 && (search || showMine) && customLib.length > 0 && (
            <div className="text-center py-6 text-gray-400 text-sm">No items match</div>
          )}
          {CATEGORIES.filter(c => grouped[c.id]).map(c => (
            <div key={c.id} className="mb-4">
              <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-2 ${c.color}`}>
                {c.label}
              </div>
              <div className="space-y-1">
                {grouped[c.id].map((preset, i) => (
                  <div
                    key={i}
                    onClick={() => onAdd({ id: uid(), category: preset.category, name: preset.name, unit: preset.unit, unitPrice: preset.unitPrice, qty: 1 })}
                    className="flex items-center justify-between bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-200 rounded-xl px-3 py-2.5 transition-colors group cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 leading-tight">{preset.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {preset.unitPrice < 0
                          ? <span className="text-green-600 font-semibold">{formatCurrencyExact(preset.unitPrice)} / {preset.unit} (discount)</span>
                          : <span>{formatCurrencyExact(preset.unitPrice)} / {preset.unit}</span>
                        }
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 ml-3 shrink-0">
                      {showMine && (
                        <button
                          onClick={e => { e.stopPropagation(); setCustomLib(removeFromCustomLibrary(preset.id)) }}
                          className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                          title="Remove from saved"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      <span className="flex items-center gap-1 bg-red-600 group-hover:bg-red-700 text-white text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors shrink-0">
                        <Plus size={11} /> Add
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer — custom item form */}
        <div className="border-t border-gray-200 px-4 py-3 shrink-0">
          {showForm ? (
            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-700 mb-1">Add Custom Item to Library</div>
              <input
                autoFocus
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Item name (e.g. Containment - Custom) *"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                onKeyDown={e => e.key === 'Enter' && handleSaveCustom()}
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <input
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value.toUpperCase() }))}
                  placeholder="Unit"
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-center"
                />
                <input
                  type="number"
                  value={form.unitPrice}
                  onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))}
                  placeholder="Price $"
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveCustom} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                  Save to Library
                </button>
                <button onClick={() => setShowForm(false)} className="px-3 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-red-700 py-2.5 border-2 border-dashed border-gray-200 hover:border-red-300 rounded-xl transition-colors"
            >
              <Plus size={13} /> Add Custom Item to Library
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function Estimator({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()
  const [local, setLocal] = useState(null)
  const [saved, setSaved] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [toastMsg, setToastMsg] = useState(null)
  const [newForm, setNewForm] = useState(BLANK_NEW)
  const [showNewForm, setShowNewForm] = useState(false)
  const [landingMode, setLandingMode] = useState('new')
  const [existingForm, setExistingForm] = useState(BLANK_EXISTING)
  const [scopeAI, setScopeAI] = useState({ open: false, context: '', loading: false })

  const job = selectedJobId ? state.jobs.find(j => j.id === selectedJobId) : null
  const client = job ? state.clients.find(c => c.id === job.clientId) : null

  useEffect(() => {
    if (job) setLocal({ ...BLANK_ESTIMATE, ...(job.estimate ?? {}) })
    else setLocal(null)
  }, [selectedJobId, job?.estimate?.updatedAt])

  const update = useCallback((patch) => {
    setLocal(e => ({ ...e, ...patch }))
    setSaved(false)
  }, [])

  const save = useCallback(() => {
    if (!local || !selectedJobId) return
    const totals = computeEstimateTotals(local)
    dispatch({ type: ACTIONS.SAVE_ESTIMATE, payload: { jobId: selectedJobId, estimate: { ...local, grandTotal: totals.grandTotal, updatedAt: new Date().toISOString() } } })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [local, selectedJobId, dispatch])

  const addItem = useCallback((item) => {
    setLocal(e => ({ ...e, lineItems: [...(e.lineItems ?? []), item] }))
    setSaved(false)
  }, [])

  const updateItem = useCallback((id, patch) => {
    setLocal(e => ({ ...e, lineItems: (e.lineItems ?? []).map(i => i.id === id ? { ...i, ...patch } : i) }))
    setSaved(false)
  }, [])

  const deleteItem = useCallback((id) => {
    setLocal(e => ({ ...e, lineItems: (e.lineItems ?? []).filter(i => i.id !== id) }))
    setSaved(false)
  }, [])

  const moveItem = useCallback((index, dir) => {
    setLocal(e => {
      const items = [...(e.lineItems ?? [])]
      const ni = index + dir
      if (ni < 0 || ni >= items.length) return e
      ;[items[index], items[ni]] = [items[ni], items[index]]
      return { ...e, lineItems: items }
    })
    setSaved(false)
  }, [])

  const handleSaveToLibrary = useCallback((item) => {
    addToCustomLibrary(item)
    setToastMsg(`"${item.name}" saved to My Items`)
    setTimeout(() => setToastMsg(null), 2500)
  }, [])

  const generateScope = useCallback(async () => {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey || !scopeAI.context.trim()) return
    setScopeAI(s => ({ ...s, loading: true }))
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 700,
          messages: [{
            role: 'user',
            content: `You are writing a professional scope of work for PurePro Restoration, an IICRC-certified mold and water damage remediation company in Denver, CO.

Job type: ${job?.type ?? 'Remediation'}
Description: ${scopeAI.context}

Write a clean, professional scope of work. Use 3-4 numbered sections with bullet points. Sections should cover setup/containment, remediation/treatment, documentation/completion, and exclusions. Keep it specific and professional (250-400 words). Do NOT write a title heading — start directly with "1." Do not include pricing.`,
          }],
        }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      update({ scopeNotes: data.content?.[0]?.text ?? '' })
      setScopeAI({ open: false, context: '', loading: false })
    } catch {
      setScopeAI(s => ({ ...s, loading: false }))
    }
  }, [scopeAI, job?.type, update])

  const sendEstimate = () => {
    save()
    const sentAt = new Date().toISOString()
    dispatch({ type: ACTIONS.UPDATE_ESTIMATE_STATUS, payload: { jobId: selectedJobId, status: 'Sent', sentAt } })
    setLocal(e => ({ ...e, status: 'Sent', sentAt }))
  }

  const startExisting = () => {
    if (!existingForm.clientId) return
    const jobId = uid()
    dispatch({ type: ACTIONS.ADD_JOB, payload: { id: jobId, clientId: existingForm.clientId, type: existingForm.type, address: existingForm.address, stage: 'Lead', revenue: 0, notes: [], photos: [], documents: [], waivers: [], timeLogs: [], checklist: [], oshaChecklist: [], estimate: null, invoice: null, insurance: null, subcontractors: [], expenses: [] } })
    setSelectedJobId(jobId)
    setExistingForm(BLANK_EXISTING)
  }

  const startNew = () => {
    if (!newForm.name.trim()) return
    const clientId = uid()
    const jobId = uid()
    dispatch({ type: ACTIONS.ADD_CLIENT, payload: { id: clientId, name: newForm.name.trim(), phone: newForm.phone, email: newForm.email, type: 'Homeowner', communications: [], isVIP: false } })
    dispatch({ type: ACTIONS.ADD_JOB, payload: { id: jobId, clientId, type: newForm.type, address: newForm.address, stage: 'Lead', revenue: 0, notes: [], photos: [], documents: [], waivers: [], timeLogs: [], checklist: [], oshaChecklist: [], estimate: null, invoice: null, insurance: null, subcontractors: [], expenses: [] } })
    setSelectedJobId(jobId)
    setShowNewForm(false)
    setNewForm(BLANK_NEW)
  }

  // ── Landing ────────────────────────────────────────────────────────────
  if (!selectedJobId || !local) {
    const InputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500'
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-xl mx-auto p-8 space-y-6">
          <div className="flex gap-2">
            {[{ id: 'new', label: 'New Customer' }, { id: 'existing', label: 'Existing Customer' }].map(m => (
              <button key={m.id} onClick={() => { setLandingMode(m.id); setShowNewForm(false) }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors ${landingMode === m.id ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'}`}>
                {m.label}
              </button>
            ))}
          </div>

          {landingMode === 'new' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-base font-bold text-gray-900 mb-1">Start a New Estimate</h2>
              <p className="text-sm text-gray-500 mb-5">Enter customer info — we'll create the job record for you</p>
              {!showNewForm ? (
                <button onClick={() => setShowNewForm(true)} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-3 rounded-xl transition-colors">
                  <Plus size={16} /> New Estimate
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Customer Name *</label>
                    <input autoFocus value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="John & Jane Smith" className={InputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                      <input value={newForm.phone} onChange={e => setNewForm(f => ({ ...f, phone: e.target.value }))} placeholder="(720) 555-0000" className={InputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                      <input value={newForm.email} onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className={InputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Property Address</label>
                    <input value={newForm.address} onChange={e => setNewForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St, Denver CO" className={InputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Job Type</label>
                    <div className="flex gap-2">
                      {['Mold', 'Water', 'Fire'].map(t => (
                        <button key={t} onClick={() => setNewForm(f => ({ ...f, type: t }))} className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${newForm.type === t ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={startNew} disabled={!newForm.name.trim()} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-sm py-2.5 rounded-xl transition-colors">Start Estimating</button>
                    <button onClick={() => { setShowNewForm(false); setNewForm(BLANK_NEW) }} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {landingMode === 'existing' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-base font-bold text-gray-900 mb-1">Estimate for Existing Customer</h2>
              <p className="text-sm text-gray-500 mb-5">Select a customer from your CRM</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Customer *</label>
                  <select value={existingForm.clientId} onChange={e => setExistingForm(f => ({ ...f, clientId: e.target.value }))} className={InputCls}>
                    <option value="">Choose a customer…</option>
                    {state.clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Property Address</label>
                  <input value={existingForm.address} onChange={e => setExistingForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St, Denver CO" className={InputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Job Type</label>
                  <div className="flex gap-2">
                    {['Mold', 'Water', 'Fire'].map(t => (
                      <button key={t} onClick={() => setExistingForm(f => ({ ...f, type: t }))} className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${existingForm.type === t ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <button onClick={startExisting} disabled={!existingForm.clientId} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-sm py-2.5 rounded-xl transition-colors">
                  Start Estimating
                </button>
              </div>
            </div>
          )}

          {state.jobs.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Open Existing Job Estimate</h3>
              <select onChange={e => setSelectedJobId(e.target.value || null)} className={InputCls}>
                <option value="">Select a job…</option>
                {state.jobs.map(j => {
                  const c = state.clients.find(x => x.id === j.clientId)
                  const hasEst = j.estimate ? ` (${j.estimate.status})` : ' (no estimate)'
                  return <option key={j.id} value={j.id}>{j.type} — {c?.name}{hasEst}</option>
                })}
              </select>
            </div>
          )}
        </div>
      </div>
    )
  }

  const lineItems = local.lineItems ?? []

  // ── Estimator ──────────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto">
      {showLibrary && <LibraryPanel onAdd={addItem} onClose={() => setShowLibrary(false)} />}

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
          <Star size={13} className="text-yellow-400" /> {toastMsg}
        </div>
      )}

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex gap-6">
          {/* Main panel */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Job header */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                <span className="font-semibold text-gray-900 text-sm">{client?.name}</span>
                <span className="text-xs text-gray-500">— {job.type}</span>
                {job.address && <span className="text-xs text-gray-400 hidden md:inline">· {job.address}</span>}
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${estimateStatusColor(local.status)}`}>{local.status}</span>
              <div className="ml-auto flex gap-2">
                <button onClick={() => setSelectedJobId(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100">← Back</button>
                <button
                  onClick={save}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${saved ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  {saved ? '✓ Saved' : 'Save Draft'}
                </button>
                <button onClick={() => { save(); navigateTo?.('quote') }} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                  <FileText size={12} /> Quote PDF
                </button>
              </div>
            </div>

            {/* Status bar */}
            {local.status === 'Draft' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-blue-800">Build your estimate below. Save often.</span>
                <button onClick={sendEstimate} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 ml-3">
                  <Send size={13} /> Mark as Sent
                </button>
              </div>
            )}
            {local.status === 'Sent' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-yellow-800">Waiting for client response…</span>
                <div className="flex gap-2 ml-3 shrink-0">
                  <button onClick={() => { dispatch({ type: ACTIONS.UPDATE_ESTIMATE_STATUS, payload: { jobId: selectedJobId, status: 'Approved' } }); setLocal(e => ({ ...e, status: 'Approved' })) }} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                    <CheckCircle size={12} /> Approved
                  </button>
                  <button onClick={() => { dispatch({ type: ACTIONS.UPDATE_ESTIMATE_STATUS, payload: { jobId: selectedJobId, status: 'Declined' } }); setLocal(e => ({ ...e, status: 'Declined' })) }} className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                    <XCircle size={12} /> Declined
                  </button>
                </div>
              </div>
            )}
            {local.status === 'Approved' && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-green-800 font-semibold">Estimate approved — {formatCurrencyExact(computeEstimateTotals(local).grandTotal)}</span>
                <button onClick={() => navigateTo?.('invoicing')} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 ml-3">
                  Convert to Invoice <ChevronRight size={13} />
                </button>
              </div>
            )}

            {/* LINE ITEMS PANEL */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {lineItems.length > 0 && (
                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider" style={{ minWidth: '68px' }}>Category</span>
                  <span className="flex-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</span>
                  <span className="w-14 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Qty</span>
                  <span className="w-10 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Unit</span>
                  <span className="w-24 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Unit Price</span>
                  <span className="w-24 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Total</span>
                  <span className="w-20" />
                </div>
              )}

              <div className="px-4 pt-2 pb-1">
                {lineItems.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <FileText size={36} className="mx-auto mb-3 opacity-15" />
                    <p className="text-sm font-semibold text-gray-500">No line items yet</p>
                    <p className="text-xs mt-1 text-gray-400">Click below to browse 60+ restoration items</p>
                  </div>
                )}
                {lineItems.map((item, index) => (
                  <LineItemRow
                    key={item.id}
                    item={item}
                    isFirst={index === 0}
                    isLast={index === lineItems.length - 1}
                    onUpdate={(patch) => updateItem(item.id, patch)}
                    onDelete={() => deleteItem(item.id)}
                    onMoveUp={() => moveItem(index, -1)}
                    onMoveDown={() => moveItem(index, 1)}
                    onSaveToLibrary={() => handleSaveToLibrary(item)}
                  />
                ))}
              </div>

              <div className="px-4 pb-4 pt-2">
                <button
                  onClick={() => setShowLibrary(true)}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-400 hover:text-red-600 text-sm font-semibold py-3 rounded-xl transition-colors"
                >
                  <Plus size={15} /> Add Line Items
                </button>
              </div>
            </div>

            {/* Scope of Work */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">Scope of Work</h3>
                <button
                  onClick={() => setScopeAI(s => ({ ...s, open: !s.open }))}
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                >
                  <Sparkles size={12} /> Generate with AI
                </button>
              </div>
              {scopeAI.open && (
                <div className="mb-3 bg-purple-50 border border-purple-200 rounded-xl p-3">
                  <div className="text-xs font-semibold text-purple-800 mb-1.5">Briefly describe the job</div>
                  <textarea
                    autoFocus
                    value={scopeAI.context}
                    onChange={e => setScopeAI(s => ({ ...s, context: e.target.value }))}
                    rows={2}
                    placeholder="e.g. Crawlspace mold remediation, ~400 SF of affected OSB sheathing, one wall cavity, heavy containment needed"
                    className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none bg-white"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={generateScope}
                      disabled={scopeAI.loading || !scopeAI.context.trim()}
                      className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {scopeAI.loading
                        ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
                        : <><Sparkles size={12} /> Generate</>}
                    </button>
                    <button
                      onClick={() => setScopeAI({ open: false, context: '', loading: false })}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <textarea
                value={local.scopeNotes}
                onChange={e => update({ scopeNotes: e.target.value })}
                rows={6}
                placeholder="Describe the full scope of work to be performed…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            {/* Terms */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Terms & Conditions</h3>
              <textarea
                value={local.termsNotes}
                onChange={e => update({ termsNotes: e.target.value })}
                rows={8}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            {/* Bottom actions */}
            <div className="flex gap-3 flex-wrap pb-8">
              <button onClick={save} className={`font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                {saved ? '✓ Saved' : 'Save Estimate'}
              </button>
              <button onClick={() => { save(); navigateTo?.('quote') }} className="flex items-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-xl">
                <FileText size={14} /> Generate Quote PDF
              </button>
            </div>
          </div>

          {/* Totals sidebar */}
          <div className="w-64 flex-shrink-0">
            <TotalsPanel
              estimate={local}
              onMarginChange={v => update({ overheadMarginPct: v })}
              onTaxChange={v => update({ taxPct: v })}
              onDiscountChange={v => update({ discountPct: v })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
