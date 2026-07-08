import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { TrendingDown, Printer } from 'lucide-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtMoney(n) {
  return '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ExpenseAnnualSummary({ navigateTo }) {
  const { state } = useApp()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  const allExpenses = useMemo(() => {
    const items = []
    ;(state.jobs ?? []).forEach(job => {
      ;(job.expenses ?? []).forEach(exp => {
        if (exp.date) items.push({ ...exp, jobId: job.id, jobAddress: job.address ?? job.type ?? 'Unknown Job' })
      })
    })
    return items
  }, [state.jobs])

  const yearExpenses = useMemo(() =>
    allExpenses.filter(e => new Date(e.date).getFullYear() === year),
  [allExpenses, year])

  const mileageExpenses = yearExpenses.filter(e =>
    (e.category ?? '').toLowerCase().includes('mileage') || (e.description ?? '').toLowerCase().includes('mileage') || (e.type ?? '').toLowerCase().includes('mileage')
  )
  const nonMileage = yearExpenses.filter(e => !mileageExpenses.includes(e))

  const byMonth = useMemo(() => {
    const map = {}
    yearExpenses.forEach(e => {
      const m = new Date(e.date).getMonth()
      if (!map[m]) map[m] = { total: 0, mileage: 0, count: 0 }
      const amt = Number(e.amount || e.total || 0)
      map[m].total += amt
      if (mileageExpenses.includes(e)) map[m].mileage += amt
      map[m].count += 1
    })
    return map
  }, [yearExpenses, mileageExpenses])

  const byCategory = useMemo(() => {
    const map = {}
    nonMileage.forEach(e => {
      const cat = e.category || e.type || 'Uncategorized'
      if (!map[cat]) map[cat] = 0
      map[cat] += Number(e.amount || e.total || 0)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [nonMileage])

  const byJob = useMemo(() => {
    const map = {}
    yearExpenses.forEach(e => {
      if (!map[e.jobId]) map[e.jobId] = { label: e.jobAddress, total: 0 }
      map[e.jobId].total += Number(e.amount || e.total || 0)
    })
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10)
  }, [yearExpenses])

  const totalMiles = useMemo(() => {
    let miles = 0
    mileageExpenses.forEach(e => { if (e.miles) miles += Number(e.miles) })
    return miles
  }, [mileageExpenses])

  const totalMileageAmt = mileageExpenses.reduce((s, e) => s + Number(e.amount || e.total || 0), 0)
  const totalOther = nonMileage.reduce((s, e) => s + Number(e.amount || e.total || 0), 0)
  const grandTotal = totalMileageAmt + totalOther

  const maxMonth = Math.max(...MONTHS.map((_, i) => byMonth[i]?.total ?? 0), 1)

  const availableYears = useMemo(() => {
    const years = new Set()
    allExpenses.forEach(e => years.add(new Date(e.date).getFullYear()))
    if (!years.has(currentYear)) years.add(currentYear)
    return Array.from(years).sort((a, b) => b - a)
  }, [allExpenses, currentYear])

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingDown size={18} className="text-red-500" /> Annual Expense Summary
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Year-end summary of mileage and business expenses. For reference only — not tax advice.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-3 py-1.5 rounded-xl">
              <Printer size={13} /> Print
            </button>
          </div>
        </div>

        {/* Tax advisory notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800">
          <strong>Note:</strong> This summary is for reference purposes only. Consult a licensed tax professional or CPA for deductibility determinations. IRS mileage rate for {year}: check IRS.gov for the current standard mileage rate.
        </div>

        {yearExpenses.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <TrendingDown size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-500">No expenses logged for {year}</p>
            <p className="text-sm text-gray-400 mt-1">
              Expenses are tracked in{' '}
              <button onClick={() => navigateTo?.('expenses')} className="text-red-600 underline">Expense Tracker</button>.
            </p>
          </div>
        ) : (
          <>
            {/* Summary tiles */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-500 mb-0.5">Total Expenses ({year})</div>
                <div className="text-xl font-bold text-gray-900">{fmtMoney(grandTotal)}</div>
                <div className="text-xs text-gray-400 mt-0.5">{yearExpenses.length} entries</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-500 mb-0.5">Mileage</div>
                <div className="text-xl font-bold text-gray-900">{fmtMoney(totalMileageAmt)}</div>
                {totalMiles > 0 && <div className="text-xs text-gray-400 mt-0.5">{totalMiles.toLocaleString()} miles logged</div>}
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-500 mb-0.5">Other Business Expenses</div>
                <div className="text-xl font-bold text-gray-900">{fmtMoney(totalOther)}</div>
                <div className="text-xs text-gray-400 mt-0.5">{byCategory.length} categories</div>
              </div>
            </div>

            {/* Monthly chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Monthly Expense Breakdown — {year}</h3>
              <div className="flex items-end gap-1.5 h-28">
                {MONTHS.map((m, i) => {
                  const val = byMonth[i]?.total ?? 0
                  const pct = Math.round((val / maxMonth) * 100)
                  return (
                    <div key={m} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                        <div
                          className="w-full bg-red-500 rounded-t-sm transition-all"
                          style={{ height: `${pct}%`, minHeight: val > 0 ? '4px' : '0' }}
                          title={`${m}: ${fmtMoney(val)}`}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400">{m}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* By Category */}
            {byCategory.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Expenses by Category</h3>
                <div className="space-y-3">
                  {byCategory.map(([cat, amt]) => (
                    <div key={cat} className="flex items-center gap-3">
                      <div className="w-32 flex-shrink-0 text-xs text-gray-600 font-medium capitalize truncate">{cat}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.round((amt / totalOther) * 100)}%` }} />
                      </div>
                      <div className="text-xs font-bold text-gray-900 w-20 text-right">{fmtMoney(amt)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Per-Job Breakdown */}
            {byJob.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Top Expenses by Job</h3>
                <div className="space-y-2">
                  {byJob.map((j, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-700 truncate max-w-xs">{j.label}</span>
                      <span className="text-sm font-bold text-gray-900">{fmtMoney(j.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly detail table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Month</th>
                    <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Entries</th>
                    <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Mileage</th>
                    <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Other</th>
                    <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MONTHS.map((m, i) => {
                    const d = byMonth[i]
                    if (!d) return null
                    return (
                      <tr key={m}>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{m} {year}</td>
                        <td className="px-4 py-2.5 text-right text-gray-500">{d.count}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{fmtMoney(d.mileage)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{fmtMoney(d.total - d.mileage)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-gray-900">{fmtMoney(d.total)}</td>
                      </tr>
                    )
                  })}
                  <tr className="bg-gray-50 font-bold">
                    <td className="px-4 py-2.5 text-gray-900">TOTAL {year}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{yearExpenses.length}</td>
                    <td className="px-4 py-2.5 text-right text-gray-900">{fmtMoney(totalMileageAmt)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-900">{fmtMoney(totalOther)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-900">{fmtMoney(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
