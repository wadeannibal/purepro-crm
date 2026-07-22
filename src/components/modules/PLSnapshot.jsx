import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatCurrency } from '../../utils/helpers'
import { TrendingUp } from 'lucide-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function PLSnapshot() {
  const { state } = useApp()
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [overhead, setOverhead] = useState('')

  const monthlyOverhead = state.overheadItems?.length > 0
    ? state.overheadItems.reduce((s, o) => s + (o.amount ?? 0), 0)
    : parseFloat(overhead || 0)

  // Build per-month P&L from invoices
  const months = MONTHS.map((label, m) => {
    // Revenue: all payments made in this month
    let invoiced = 0
    let collected = 0
    let jobCosts = 0

    state.jobs.forEach(j => {
      // Invoiced amount: invoices sent in this month
      if (j.invoice?.createdAt) {
        const d = new Date(j.invoice.createdAt)
        if (d.getFullYear() === selectedYear && d.getMonth() === m) {
          invoiced += j.invoice.amountTotal ?? 0
        }
      }
      // Collected: payments received in this month
      ;(j.invoice?.payments ?? []).forEach(p => {
        const d = new Date(p.date)
        if (d.getFullYear() === selectedYear && d.getMonth() === m) {
          collected += p.amount ?? 0
        }
      })
      // Job costs: expenses in this month
      ;(j.expenses ?? []).forEach(e => {
        const d = new Date(e.date)
        if (d.getFullYear() === selectedYear && d.getMonth() === m) {
          jobCosts += e.amount ?? 0
        }
      })
    })

    const grossProfit = collected - jobCosts
    const netProfit = grossProfit - monthlyOverhead

    return { label, m, invoiced, collected, jobCosts, grossProfit, netProfit }
  })

  const ytdMonthCount = selectedYear < now.getFullYear() ? 12 : now.getMonth() + 1
  const ytd = {
    invoiced: months.slice(0, ytdMonthCount).reduce((s, m) => s + m.invoiced, 0),
    collected: months.slice(0, ytdMonthCount).reduce((s, m) => s + m.collected, 0),
    jobCosts: months.slice(0, ytdMonthCount).reduce((s, m) => s + m.jobCosts, 0),
    grossProfit: months.slice(0, ytdMonthCount).reduce((s, m) => s + m.grossProfit, 0),
    netProfit: months.slice(0, ytdMonthCount).reduce((s, m) => s + m.netProfit, 0),
  }

  const maxCollected = Math.max(...months.map(m => m.collected), 1)

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-3 md:p-6 space-y-6">
        {/* Year + overhead controls */}
        <div className="flex flex-wrap items-center gap-4">
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
            {[now.getFullYear(), now.getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {!(state.overheadItems?.length > 0) && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-600">Monthly Overhead $</label>
              <input type="number" value={overhead} onChange={e => setOverhead(e.target.value)} placeholder="e.g. 3500" className="w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
          )}
          {state.overheadItems?.length > 0 && (
            <span className="text-xs text-gray-500">Overhead: <strong>{formatCurrency(monthlyOverhead)}/mo</strong> from Overhead Calculator</span>
          )}
        </div>

        {/* YTD summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">YTD Invoiced</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(ytd.invoiced)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">YTD Collected</div>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(ytd.collected)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">YTD Gross Profit</div>
            <div className={`text-2xl font-bold ${ytd.grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(ytd.grossProfit)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">YTD Net Profit</div>
            <div className={`text-2xl font-bold ${ytd.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(ytd.netProfit)}</div>
            {monthlyOverhead > 0 && <div className="text-xs text-gray-400 mt-1">after {formatCurrency(monthlyOverhead * ytdMonthCount)} overhead</div>}
          </div>
        </div>

        {/* Revenue bar chart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Monthly Cash Collected — {selectedYear}</h2>
          <div className="flex items-end gap-1 h-32">
            {months.map(m => {
              const h = maxCollected > 0 ? (m.collected / maxCollected) * 100 : 0
              const isCurrent = m.m === now.getMonth() && selectedYear === now.getFullYear()
              return (
                <div key={m.m} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: '100px' }}>
                    <div
                      className={`w-full rounded-t-sm transition-all ${isCurrent ? 'bg-red-500' : m.collected > 0 ? 'bg-red-300' : 'bg-gray-100'}`}
                      style={{ height: `${Math.max(h, m.collected > 0 ? 4 : 2)}%` }}
                      title={`${m.label}: ${formatCurrency(m.collected)}`}
                    />
                  </div>
                  <div className={`text-[10px] ${isCurrent ? 'font-bold text-red-600' : 'text-gray-400'}`}>{m.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Monthly table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto -mx-0">
          <table className="w-full text-sm" style={{ minWidth: '500px' }}>
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Month</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Invoiced</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Collected</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Job Costs</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Overhead</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {months.map(m => {
                const isCurrent = m.m === now.getMonth() && selectedYear === now.getFullYear()
                const isFuture = selectedYear === now.getFullYear() && m.m > now.getMonth()
                return (
                  <tr key={m.m} className={`${isCurrent ? 'bg-red-50' : isFuture ? 'opacity-40' : 'hover:bg-gray-50'}`}>
                    <td className={`px-4 py-2.5 font-medium ${isCurrent ? 'text-red-700 font-bold' : 'text-gray-700'}`}>{m.label} {selectedYear}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{m.invoiced > 0 ? formatCurrency(m.invoiced) : '—'}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-900">{m.collected > 0 ? formatCurrency(m.collected) : '—'}</td>
                    <td className="px-4 py-2.5 text-right text-red-700">{m.jobCosts > 0 ? `−${formatCurrency(m.jobCosts)}` : '—'}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{monthlyOverhead > 0 ? `−${formatCurrency(monthlyOverhead)}` : '—'}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${m.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {m.collected > 0 || m.jobCosts > 0 ? formatCurrency(m.netProfit) : '—'}
                    </td>
                  </tr>
                )
              })}
              <tr className="bg-gray-50 border-t-2 border-gray-300 font-bold">
                <td className="px-4 py-3 text-gray-900">YTD Total</td>
                <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(ytd.invoiced)}</td>
                <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(ytd.collected)}</td>
                <td className="px-4 py-3 text-right text-red-700">−{formatCurrency(ytd.jobCosts)}</td>
                <td className="px-4 py-3 text-right text-gray-600">−{formatCurrency(monthlyOverhead * ytdMonthCount)}</td>
                <td className={`px-4 py-3 text-right ${ytd.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(ytd.netProfit)}</td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>

        <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
          <strong>Revenue</strong> is based on actual payments logged in your invoices. <strong>Job costs</strong> are from the Expense Tracker. Set up your overhead in the Overhead Calculator for automatic overhead deduction here.
        </div>
      </div>
    </div>
  )
}
