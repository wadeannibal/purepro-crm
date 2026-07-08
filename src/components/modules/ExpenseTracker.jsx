import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { EXPENSE_CATEGORIES } from '../../data/proposalTemplates'
import { Wallet, Plus, Trash2, BarChart2, ChevronLeft } from 'lucide-react'

const BLANK = { date: new Date().toISOString().slice(0, 10), category: 'Fuel', amount: '', notes: '' }

export default function ExpenseTracker({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()
  const [form, setForm] = useState(BLANK)
  const [adding, setAdding] = useState(false)
  const [view, setView] = useState('job') // 'job' | 'annual'

  const job = selectedJobId ? state.jobs.find(j => j.id === selectedJobId) : null
  const jobExpenses = (job?.expenses ?? []).slice().sort((a, b) => new Date(b.date) - new Date(a.date))
  const jobTotal = jobExpenses.reduce((s, e) => s + (e.amount ?? 0), 0)

  // Annual summary across all jobs
  const allExpenses = state.jobs.flatMap(j => (j.expenses ?? []).map(e => ({ ...e, jobId: j.id, jobLabel: `${j.type} — ${state.clients.find(c => c.id === j.clientId)?.name ?? '?'}` })))
  const currentYear = new Date().getFullYear()
  const yearExpenses = allExpenses.filter(e => new Date(e.date).getFullYear() === currentYear)
  const yearTotal = yearExpenses.reduce((s, e) => s + (e.amount ?? 0), 0)

  const byCategory = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = yearExpenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount ?? 0), 0)
    return acc
  }, {})

  const handleAdd = () => {
    if (!form.amount || !form.date) return
    dispatch({
      type: ACTIONS.ADD_EXPENSE,
      payload: {
        jobId: selectedJobId,
        expense: { ...form, amount: parseFloat(form.amount) || 0 },
      },
    })
    setForm(BLANK)
    setAdding(false)
  }

  const deleteExpense = (expenseId) => {
    dispatch({ type: ACTIONS.DELETE_EXPENSE, payload: { jobId: selectedJobId, expenseId } })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-5">
        {selectedJobId && navigateTo && (
          <button onClick={() => navigateTo('jobs', { jobId: selectedJobId })} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors">
            <ChevronLeft size={14} /> Back to Job
          </button>
        )}
        {/* View toggle */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setView('job')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${view === 'job' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Job Expenses</button>
            <button onClick={() => setView('annual')} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${view === 'annual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Annual Summary ({currentYear})</button>
          </div>
        </div>

        {view === 'annual' ? (
          /* Annual Summary */
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="text-xs text-gray-500 mb-1">Total Expenses {currentYear}</div>
                <div className="text-3xl font-bold text-gray-900">{formatCurrency(yearTotal)}</div>
                <div className="text-xs text-gray-400 mt-1">{yearExpenses.length} entries across {new Set(yearExpenses.map(e => e.jobId)).size} jobs</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="text-xs text-gray-500 mb-1">Avg Per Month</div>
                <div className="text-3xl font-bold text-gray-900">{formatCurrency(yearTotal / 12)}</div>
                <div className="text-xs text-gray-400 mt-1">Useful for tax planning</div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">By Category</h3>
              <div className="space-y-3">
                {EXPENSE_CATEGORIES.filter(cat => byCategory[cat] > 0).sort((a, b) => byCategory[b] - byCategory[a]).map(cat => (
                  <div key={cat} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-gray-700 flex-shrink-0">{cat}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(byCategory[cat] / yearTotal) * 100}%` }} />
                    </div>
                    <div className="w-24 text-right text-sm font-semibold text-gray-900">{formatCurrency(byCategory[cat])}</div>
                    <div className="w-10 text-right text-xs text-gray-400">{((byCategory[cat] / yearTotal) * 100).toFixed(0)}%</div>
                  </div>
                ))}
                {yearTotal === 0 && <p className="text-sm text-gray-400 text-center py-4">No expenses logged for {currentYear}</p>}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <BarChart2 size={14} className="inline mr-1.5" />
              <strong>Tax tip:</strong> Keep receipts for all business expenses. Mileage, fuel, materials, equipment rental, and dump fees are typically deductible as business expenses. Consult your tax professional.
            </div>
          </div>
        ) : (
          /* Job Expenses */
          <>
            {/* Job selector + add button */}
            <div className="flex items-center gap-3">
              {selectedJobId ? (
                <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  {state.jobs.map(j => {
                    const c = state.clients.find(x => x.id === j.clientId)
                    return <option key={j.id} value={j.id}>{j.type} — {c?.name}</option>
                  })}
                </select>
              ) : (
                <select onChange={e => setSelectedJobId(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">Select a job…</option>
                  {state.jobs.map(j => {
                    const c = state.clients.find(x => x.id === j.clientId)
                    return <option key={j.id} value={j.id}>{j.type} — {c?.name} — {j.stage}</option>
                  })}
                </select>
              )}
              {selectedJobId && (
                <button onClick={() => setAdding(true)} className="ml-auto flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors">
                  <Plus size={14} /> Add Expense
                </button>
              )}
            </div>

            {selectedJobId && (
              <>
                {/* Job total */}
                {jobExpenses.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Total Job Expenses</div>
                      <div className="text-2xl font-bold text-gray-900">{formatCurrency(jobTotal)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Entries</div>
                      <div className="text-2xl font-bold text-gray-900">{jobExpenses.length}</div>
                    </div>
                  </div>
                )}

                {/* Add form */}
                {adding && (
                  <div className="bg-white border border-red-200 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-gray-900">New Expense</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Date *</label>
                        <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Category *</label>
                        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                          {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Amount *</label>
                        <input type="number" autoFocus value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                        <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional description" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAdd} className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">Add Expense</button>
                      <button onClick={() => { setAdding(false); setForm(BLANK) }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Expense list */}
                {jobExpenses.length === 0 && !adding ? (
                  <div className="text-center py-16 text-gray-400">
                    <Wallet size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No expenses logged for this job</p>
                    <p className="text-sm mt-1">Track mileage, fuel, materials, dump fees, and more</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Date</th>
                          <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Category</th>
                          <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Notes</th>
                          <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Amount</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {jobExpenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-gray-50 group">
                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(exp.date)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{exp.category}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-xs">{exp.notes || '—'}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(exp.amount)}</td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => deleteExpense(exp.id)} className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all">
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 border-t-2 border-gray-200">
                          <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-900">Total</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{formatCurrency(jobTotal)}</td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
