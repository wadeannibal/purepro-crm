import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { formatCurrency } from '../../utils/helpers'
import { UserCheck, Save } from 'lucide-react'

const BLANK = {
  company: '', claimNumber: '', adjusterName: '', adjusterContact: '',
  deductible: '', approvedScope: 'pending', approvedAmount: '', notes: '',
}

export default function InsuranceClaims({ selectedJobId, setSelectedJobId }) {
  const { state, dispatch } = useApp()
  const [form, setForm] = useState(BLANK)
  const [saved, setSaved] = useState(false)

  const job = selectedJobId ? state.jobs.find(j => j.id === selectedJobId) : null
  const client = job ? state.clients.find(c => c.id === job.clientId) : null

  useEffect(() => {
    if (job?.insurance) {
      setForm({
        company: job.insurance.company ?? '',
        claimNumber: job.insurance.claimNumber ?? '',
        adjusterName: job.insurance.adjusterName ?? '',
        adjusterContact: job.insurance.adjusterContact ?? '',
        deductible: job.insurance.deductible ?? '',
        approvedScope: job.insurance.approvedScope ?? 'pending',
        approvedAmount: job.insurance.approvedAmount ?? '',
        notes: job.insurance.notes ?? '',
      })
    } else {
      setForm(BLANK)
    }
  }, [selectedJobId])

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false) }

  const handleSave = () => {
    dispatch({
      type: ACTIONS.UPDATE_INSURANCE,
      payload: {
        jobId: selectedJobId,
        insurance: {
          ...form,
          deductible: parseFloat(form.deductible) || 0,
          approvedAmount: parseFloat(form.approvedAmount) || 0,
        },
      },
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!selectedJobId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <UserCheck size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium text-sm mb-3">Select a job to manage insurance</p>
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
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Job selector */}
        <div className="flex items-center gap-3">
          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {state.jobs.map(j => {
              const c = state.clients.find(x => x.id === j.clientId)
              return <option key={j.id} value={j.id}>{j.type} — {c?.name} — {j.stage}</option>
            })}
          </select>
          {['Water', 'Fire'].includes(job?.type) && (
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">Insurance Recommended</span>
          )}
        </div>

        {/* Summary bar */}
        {job?.insurance && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Deductible</div>
              <div className="text-lg font-bold text-gray-900">{formatCurrency(job.insurance.deductible)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Approved Scope</div>
              <div className={`text-sm font-semibold mt-1 ${job.insurance.approvedScope === 'yes' ? 'text-green-700' : job.insurance.approvedScope === 'no' ? 'text-red-700' : 'text-yellow-700'}`}>
                {job.insurance.approvedScope === 'yes' ? 'Approved' : job.insurance.approvedScope === 'no' ? 'Denied' : 'Pending'}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Approved Amount</div>
              <div className="text-lg font-bold text-gray-900">{formatCurrency(job.insurance.approvedAmount)}</div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Insurance Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Insurance Company</label>
              <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="State Farm" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Claim Number</label>
              <input value={form.claimNumber} onChange={e => set('claimNumber', e.target.value)} placeholder="SF-2024-XXXXX" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Adjuster Name</label>
              <input value={form.adjusterName} onChange={e => set('adjusterName', e.target.value)} placeholder="John Smith" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Adjuster Contact</label>
              <input value={form.adjusterContact} onChange={e => set('adjusterContact', e.target.value)} placeholder="(720) 555-0000 or email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Deductible Amount</label>
              <input type="number" value={form.deductible} onChange={e => set('deductible', e.target.value)} placeholder="0.00" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Scope Approved?</label>
              <select value={form.approvedScope} onChange={e => set('approvedScope', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="pending">Pending</option>
                <option value="yes">Yes — Approved</option>
                <option value="no">No — Denied</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Approved Amount</label>
              <input type="number" value={form.approvedAmount} onChange={e => set('approvedAmount', e.target.value)} placeholder="0.00" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              placeholder="Adjuster communication history, special conditions, supplemental claims, etc."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
          >
            <Save size={15} />
            {saved ? 'Saved!' : 'Save Insurance Info'}
          </button>
        </div>
      </div>
    </div>
  )
}
