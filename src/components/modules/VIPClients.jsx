import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { formatCurrency, formatDate, clientTypeColor, jobTypeColor } from '../../utils/helpers'
import { Star, Phone, Mail, Crown } from 'lucide-react'

export default function VIPClients({ navigateTo }) {
  const { state, dispatch } = useApp()

  const vipClients = (state.clients ?? []).filter(c => c.isVIP)
  const allRevenue = vipClients.reduce((sum, c) => {
    return sum + (state.jobs ?? []).filter(j => j.clientId === c.id).reduce((s, j) => s + (j.estimate?.grandTotal ?? j.revenue ?? 0), 0)
  }, 0)
  const activeJobs = vipClients.reduce((sum, c) => {
    return sum + (state.jobs ?? []).filter(j => j.clientId === c.id && j.stage !== 'Closed' && j.stage !== 'Lost').length
  }, 0)

  const toggle = (id) => dispatch({ type: ACTIONS.TOGGLE_VIP, payload: { id } })

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        {/* Stats banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'VIP Clients', value: vipClients.length, icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
            { label: 'Total Revenue', value: formatCurrency(allRevenue), icon: Star, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
            { label: 'Active Jobs', value: activeJobs, icon: Star, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`rounded-xl border p-4 ${bg}`}>
              <Icon size={20} className={`${color} mb-2`} />
              <div className="text-2xl font-black text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {vipClients.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Star size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">No VIP clients yet</p>
            <p className="text-sm mt-1">Star clients in CRM to mark them as VIP</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {vipClients.map(client => {
              const clientJobs = (state.jobs ?? []).filter(j => j.clientId === client.id)
              const totalRev = clientJobs.reduce((s, j) => s + (j.estimate?.grandTotal ?? j.revenue ?? 0), 0)
              const openJobs = clientJobs.filter(j => j.stage !== 'Closed' && j.stage !== 'Lost')
              return (
                <div key={client.id} className="bg-white border border-amber-200 rounded-2xl p-5 hover:border-amber-300 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Star size={16} className="text-amber-400 fill-amber-400" />
                        <h3 className="font-bold text-gray-900">{client.name}</h3>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${clientTypeColor(client.type)}`}>{client.type}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {client.phone && <span className="flex items-center gap-1"><Phone size={11} />{client.phone}</span>}
                        {client.email && <span className="flex items-center gap-1"><Mail size={11} /><span className="truncate">{client.email}</span></span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-black text-green-700">{formatCurrency(totalRev)}</div>
                      <div className="text-xs text-gray-400">lifetime revenue</div>
                    </div>
                  </div>

                  {openJobs.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Active Jobs</div>
                      <div className="flex flex-wrap gap-2">
                        {openJobs.map(job => (
                          <button
                            key={job.id}
                            onClick={() => navigateTo('jobs', { jobId: job.id })}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${jobTypeColor(job.type)} hover:ring-2 hover:ring-offset-1 hover:ring-current transition-all`}
                          >
                            {job.type} — {job.stage}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {client.notes && <p className="text-xs text-gray-600 bg-amber-50 rounded-lg p-2.5 mb-3">{client.notes}</p>}

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                    <span>Client since {formatDate(client.createdAt)} · {clientJobs.length} total jobs</span>
                    <button
                      onClick={() => toggle(client.id)}
                      className="text-amber-500 hover:text-gray-500 font-medium transition-colors"
                    >
                      Remove VIP
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Non-VIP section */}
        {(state.clients ?? []).filter(c => !c.isVIP).length > 0 && (
          <div className="mt-8 max-w-3xl">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Other Clients — Click ★ to promote to VIP</div>
            <div className="space-y-2">
              {(state.clients ?? []).filter(c => !c.isVIP).map(client => {
                const rev = (state.jobs ?? []).filter(j => j.clientId === client.id).reduce((s, j) => s + (j.estimate?.grandTotal ?? j.revenue ?? 0), 0)
                return (
                  <div key={client.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 transition-colors">
                    <button onClick={() => toggle(client.id)} className="text-gray-300 hover:text-amber-400 transition-colors p-1">
                      <Star size={16} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm text-gray-800">{client.name}</span>
                      <span className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${clientTypeColor(client.type)}`}>{client.type}</span>
                    </div>
                    {rev > 0 && <span className="text-sm text-green-700 font-semibold flex-shrink-0">{formatCurrency(rev)}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
