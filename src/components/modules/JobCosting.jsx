import { useApp } from '../../context/AppContext'
import { computeEstimateTotals, computeActualCosts, formatCurrency } from '../../utils/helpers'
import { TrendingDown, TrendingUp, BarChart2 } from 'lucide-react'

function Variance({ estimated, actual, label }) {
  const diff = actual - estimated
  const pct = estimated > 0 ? (diff / estimated) * 100 : 0
  const over = diff > 0
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="flex items-end gap-2">
        <span className="text-xl font-bold text-gray-900">{formatCurrency(actual)}</span>
        {estimated > 0 && (
          <span className={`text-xs font-semibold mb-0.5 flex items-center gap-0.5 ${over ? 'text-red-600' : 'text-green-700'}`}>
            {over ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {over ? '+' : ''}{pct.toFixed(0)}%
          </span>
        )}
      </div>
      <div className="text-xs text-gray-400 mt-1">Est: {formatCurrency(estimated)}</div>
    </div>
  )
}

export default function JobCosting({ selectedJobId, setSelectedJobId }) {
  const { state } = useApp()
  const job = selectedJobId ? state.jobs.find(j => j.id === selectedJobId) : null
  const client = job ? state.clients.find(c => c.id === job.clientId) : null

  if (!selectedJobId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <BarChart2 size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium text-sm mb-3">Select a job to view cost analysis</p>
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

  const estimate = job.estimate
  const totals = computeEstimateTotals(estimate)
  const actuals = computeActualCosts(job)

  const estimatedRevenue = totals.grandTotal
  const actualRevenue = job.invoice ? (job.invoice.amountTotal ?? 0) : estimatedRevenue

  const estimatedProfit = estimatedRevenue - totals.subtotal
  const actualProfit = actualRevenue - actuals.total
  const estimatedMarginPct = estimatedRevenue > 0 ? (estimatedProfit / estimatedRevenue) * 100 : 0
  const actualMarginPct = actualRevenue > 0 ? (actualProfit / actualRevenue) * 100 : 0

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Job selector */}
        <div className="flex items-center gap-3">
          <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
            {state.jobs.map(j => {
              const c = state.clients.find(x => x.id === j.clientId)
              return <option key={j.id} value={j.id}>{j.type} — {c?.name}</option>
            })}
          </select>
          <span className="text-sm text-gray-500">{job.type} — {job.stage}</span>
        </div>

        {!estimate ? (
          <div className="text-center py-16 text-gray-400">
            <BarChart2 size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">No estimate on this job yet</p>
            <p className="text-sm mt-1">Go to Estimator to build one</p>
          </div>
        ) : (
          <>
            {/* Profit summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-2xl p-5 ${estimatedMarginPct >= 20 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="text-xs font-semibold text-gray-600 mb-1">Estimated Margin</div>
                <div className="text-3xl font-bold text-gray-900">{estimatedMarginPct.toFixed(1)}%</div>
                <div className="text-sm text-gray-600 mt-1">{formatCurrency(estimatedProfit)} profit on {formatCurrency(estimatedRevenue)}</div>
              </div>
              <div className={`rounded-2xl p-5 ${actualMarginPct >= estimatedMarginPct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="text-xs font-semibold text-gray-600 mb-1">Actual Margin (so far)</div>
                <div className={`text-3xl font-bold ${actualMarginPct >= estimatedMarginPct ? 'text-green-900' : 'text-red-900'}`}>{actualMarginPct.toFixed(1)}%</div>
                <div className="text-sm text-gray-600 mt-1">{formatCurrency(actualProfit)} profit on {formatCurrency(actualRevenue)}</div>
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">Cost Breakdown — Estimated vs Actual</h2>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Category</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Estimated</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Actual</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { label: 'Sq Ft / Area Work', est: totals.sqftTotal, act: 0 },
                    { label: 'Equipment', est: totals.equipTotal, act: 0 },
                    { label: 'Lab Testing', est: totals.labTotal, act: 0 },
                    { label: 'Materials', est: totals.matTotal, act: 0 },
                    { label: 'Labor (time logs)', est: totals.laborTotal, act: actuals.laborCost },
                    { label: 'Xactimate', est: totals.xactTotal, act: 0 },
                    { label: 'Job Expenses', est: 0, act: actuals.expenseCost },
                    { label: 'Subcontractors', est: 0, act: actuals.subCost },
                  ].filter(row => row.est > 0 || row.act > 0).map(row => {
                    const variance = row.act - row.est
                    return (
                      <tr key={row.label} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm text-gray-700">{row.label}</td>
                        <td className="px-5 py-3 text-sm text-right text-gray-900">{row.est > 0 ? formatCurrency(row.est) : '—'}</td>
                        <td className="px-5 py-3 text-sm text-right text-gray-900">{row.act > 0 ? formatCurrency(row.act) : '—'}</td>
                        <td className={`px-5 py-3 text-sm text-right font-medium ${variance > 0 ? 'text-red-600' : variance < 0 ? 'text-green-700' : 'text-gray-400'}`}>
                          {row.est > 0 && row.act > 0 ? `${variance >= 0 ? '+' : ''}${formatCurrency(variance)}` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-gray-50 border-t-2 border-gray-300 font-bold">
                    <td className="px-5 py-3 text-sm text-gray-900">Total Costs</td>
                    <td className="px-5 py-3 text-sm text-right text-gray-900">{formatCurrency(totals.subtotal)}</td>
                    <td className="px-5 py-3 text-sm text-right text-gray-900">{formatCurrency(actuals.total)}</td>
                    <td className={`px-5 py-3 text-sm text-right font-bold ${actuals.total > totals.subtotal ? 'text-red-700' : 'text-green-700'}`}>
                      {actuals.total > 0 && totals.subtotal > 0 ? `${actuals.total >= totals.subtotal ? '+' : ''}${formatCurrency(actuals.total - totals.subtotal)}` : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Data sources note */}
            <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
              <strong>Actual costs</strong> are pulled from: Job Timer logs (labor @ $75/hr default), Job Expenses, and Subcontractor actual amounts. To get more accurate job costing, keep these sections updated throughout the job.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
