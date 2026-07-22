import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { LEAD_SOURCES, formatCurrency, stageColor } from '../../utils/helpers'
import { PieChart, TrendingUp, ArrowRight } from 'lucide-react'

const BOOKED_STAGES = ['Approved', 'Remediation', 'Post-Test', 'Invoiced', 'Closed']
const ACTIVE_STAGES = ['Lead', 'Inspection', 'Estimate Sent', 'Approved', 'Remediation', 'Post-Test', 'Invoiced', 'Closed', 'Lost']

const SOURCE_COLORS = {
  'Google Search': 'bg-blue-100 text-blue-800',
  'Google Maps': 'bg-green-100 text-green-800',
  'Referral': 'bg-purple-100 text-purple-800',
  'Instagram': 'bg-pink-100 text-pink-800',
  'Facebook': 'bg-indigo-100 text-indigo-800',
  'Door Knock': 'bg-orange-100 text-orange-800',
  'Cold Call': 'bg-yellow-100 text-yellow-800',
  'Repeat Client': 'bg-teal-100 text-teal-800',
  'Insurance Referral': 'bg-red-100 text-red-800',
  'Real Estate Referral': 'bg-emerald-100 text-emerald-800',
  'Other': 'bg-gray-100 text-gray-700',
}

export default function LeadSourceTracking({ navigateTo }) {
  const { state } = useApp()
  const jobs = state.jobs ?? []
  const partners = state.partners ?? []

  const bySource = useMemo(() => {
    const map = {}
    LEAD_SOURCES.forEach(src => {
      map[src] = { leads: 0, booked: 0, revenue: 0, jobs: [] }
    })
    map['Not Tagged'] = { leads: 0, booked: 0, revenue: 0, jobs: [] }

    jobs.filter(j => ACTIVE_STAGES.includes(j.stage)).forEach(j => {
      const src = j.leadSource || 'Not Tagged'
      if (!map[src]) map[src] = { leads: 0, booked: 0, revenue: 0, jobs: [] }
      map[src].leads++
      map[src].jobs.push(j)
      if (BOOKED_STAGES.includes(j.stage)) {
        map[src].booked++
        map[src].revenue += j.estimate?.grandTotal ?? j.revenue ?? 0
      }
    })

    return Object.entries(map)
      .filter(([, v]) => v.leads > 0)
      .sort((a, b) => b[1].revenue - a[1].revenue)
  }, [jobs])

  const totalLeads = bySource.reduce((s, [, v]) => s + v.leads, 0)
  const totalBooked = bySource.reduce((s, [, v]) => s + v.booked, 0)
  const totalRevenue = bySource.reduce((s, [, v]) => s + v.revenue, 0)
  const winRate = totalLeads > 0 ? Math.round((totalBooked / totalLeads) * 100) : 0

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-3 md:p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <PieChart size={18} className="text-red-500" /> Lead Source Tracking
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Conversion rates and revenue by how leads find PurePro.</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Leads', value: totalLeads },
            { label: 'Booked', value: totalBooked, color: 'text-green-700' },
            { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 50 ? 'text-green-700' : 'text-orange-600' },
            { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'text-green-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="text-xs text-gray-500 mb-1">{label}</div>
              <div className={`text-2xl font-bold ${color ?? 'text-gray-900'}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Source breakdown */}
        {bySource.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400">
            <PieChart size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-gray-600">No lead source data yet</p>
            <p className="text-sm mt-1">Tag jobs with a lead source when creating them in the Job Pipeline</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">By Source (sorted by revenue)</h3>
            {bySource.map(([src, data]) => {
              const convRate = data.leads > 0 ? Math.round((data.booked / data.leads) * 100) : 0
              const revenueShare = totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0
              return (
                <div key={src} className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${SOURCE_COLORS[src] ?? 'bg-gray-100 text-gray-700'}`}>{src}</span>
                      {src === 'Not Tagged' && <span className="text-xs text-orange-600 font-medium">⚠ Untagged — update job records</span>}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-700">{formatCurrency(data.revenue)}</div>
                      <div className="text-[10px] text-gray-400">{revenueShare}% of revenue</div>
                    </div>
                  </div>

                  {/* Conversion funnel bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                      <span>{data.leads} lead{data.leads !== 1 ? 's' : ''}</span>
                      <span className="flex items-center gap-1"><ArrowRight size={10} /> {data.booked} booked ({convRate}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${convRate}%` }} />
                    </div>
                  </div>

                  {/* Jobs list */}
                  {data.jobs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {data.jobs.map(j => {
                        const client = (state.clients ?? []).find(c => c.id === j.clientId)
                        return (
                          <button key={j.id} onClick={() => navigateTo('jobs', { jobId: j.id })}
                            className="flex items-center gap-1.5 text-[11px] bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 hover:border-red-200 hover:bg-red-50 transition-colors">
                            <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${stageColor(j.stage)}`}>{j.stage}</span>
                            <span className="text-gray-700">{client?.name ?? 'Unknown'}</span>
                            <span className="text-green-700 font-semibold">{formatCurrency(j.estimate?.grandTotal ?? j.revenue)}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Untagged reminder */}
        {jobs.filter(j => !j.leadSource && ACTIVE_STAGES.includes(j.stage)).length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
            <TrendingUp size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-900">
                {jobs.filter(j => !j.leadSource && ACTIVE_STAGES.includes(j.stage)).length} job{jobs.filter(j => !j.leadSource && ACTIVE_STAGES.includes(j.stage)).length !== 1 ? 's' : ''} without a lead source tag
              </p>
              <p className="text-xs text-orange-700 mt-0.5">
                Open each job in Job Records and set the Lead Source field to improve your tracking accuracy.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
