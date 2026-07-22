import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { LOSS_REASONS, formatCurrency, stageColor, formatDate } from '../../utils/helpers'
import { Target, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

const BOOKED_STAGES = ['Approved', 'Remediation', 'Post-Test', 'Invoiced', 'Closed']
const ALL_STAGES = ['Lead', 'Inspection', 'Estimate Sent', 'Approved', 'Remediation', 'Post-Test', 'Invoiced', 'Closed', 'Lost']

export default function WinLossTracker({ navigateTo }) {
  const { state } = useApp()
  const jobs = state.jobs ?? []
  const clients = state.clients ?? []

  const leads = jobs.filter(j => ALL_STAGES.includes(j.stage))
  const won = leads.filter(j => BOOKED_STAGES.includes(j.stage))
  const lost = leads.filter(j => j.stage === 'Lost')
  const pending = leads.filter(j => ['Lead', 'Inspection', 'Estimate Sent'].includes(j.stage))

  const winRate = won.length + lost.length > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0
  const wonRevenue = won.reduce((s, j) => s + (j.estimate?.grandTotal ?? j.revenue ?? 0), 0)
  const lostRevenue = lost.reduce((s, j) => s + (j.estimate?.grandTotal ?? j.revenue ?? 0), 0)

  const lossByReason = useMemo(() => {
    const map = {}
    lost.forEach(j => {
      const reason = j.lostReason || 'Unknown'
      if (!map[reason]) map[reason] = { count: 0, jobs: [] }
      map[reason].count++
      map[reason].jobs.push(j)
    })
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count)
  }, [lost])

  const competitorLosses = lost.filter(j => j.lostReason === 'Went with competitor' && j.lostCompetitor)
  const competitorMap = {}
  competitorLosses.forEach(j => {
    competitorMap[j.lostCompetitor] = (competitorMap[j.lostCompetitor] ?? 0) + 1
  })
  const topCompetitors = Object.entries(competitorMap).sort((a, b) => b[1] - a[1])

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-3 md:p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Target size={18} className="text-red-500" /> Win / Loss Tracker
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Track close rates and identify the top reasons leads don't convert.</p>
        </div>

        {/* Main stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Total Leads</div>
            <div className="text-2xl font-bold text-gray-900">{leads.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Won</div>
            <div className="text-2xl font-bold text-green-700">{won.length}</div>
            <div className="text-xs text-green-600 mt-0.5">{formatCurrency(wonRevenue)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Lost</div>
            <div className="text-2xl font-bold text-red-600">{lost.length}</div>
            {lostRevenue > 0 && <div className="text-xs text-red-400 mt-0.5">{formatCurrency(lostRevenue)}</div>}
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Win Rate</div>
            <div className={`text-2xl font-bold ${winRate >= 50 ? 'text-green-700' : winRate >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
              {winRate}%
            </div>
            <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${winRate}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Loss reasons */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <TrendingDown size={14} className="text-red-500" /> Top Loss Reasons
              </div>
            </div>
            {lost.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No lost jobs logged yet</div>
            ) : lossByReason.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No loss reasons recorded</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {lossByReason.map(([reason, data]) => (
                  <div key={reason} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{reason}</div>
                      <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${(data.count / lost.length) * 100}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-red-600">{data.count}</div>
                      <div className="text-[10px] text-gray-400">{Math.round((data.count / lost.length) * 100)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Competitor losses */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <AlertCircle size={14} className="text-orange-500" /> Lost to Competitors
              </div>
            </div>
            {topCompetitors.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No competitor losses logged</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {topCompetitors.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between px-5 py-3">
                    <div className="text-sm font-medium text-gray-900">{name}</div>
                    <div className="text-sm font-bold text-orange-600">{count} job{count !== 1 ? 's' : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* All jobs table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <TrendingUp size={14} className="text-gray-500" /> All Jobs
            </div>
            <div className="text-xs text-gray-400">{leads.length} total</div>
          </div>
          {leads.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No jobs to display</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Client', 'Type', 'Revenue', 'Stage', 'Lost Reason', 'Date'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...leads].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(j => {
                    const client = clients.find(c => c.id === j.clientId)
                    return (
                      <tr key={j.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => navigateTo?.('jobs', { jobId: j.id })}>
                        <td className="px-4 py-3 font-medium text-gray-900">{client?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{j.type}</td>
                        <td className="px-4 py-3 text-green-700 font-semibold">{formatCurrency(j.estimate?.grandTotal ?? j.revenue)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${stageColor(j.stage)}`}>{j.stage}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {j.stage === 'Lost' ? (
                            <span>
                              {j.lostReason || '—'}
                              {j.lostCompetitor && <span className="text-orange-600 ml-1">({j.lostCompetitor})</span>}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(j.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
