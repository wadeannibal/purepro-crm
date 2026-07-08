import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { OSHA_CHECKLIST, jobTypeColor } from '../../utils/helpers'
import { ShieldCheck, AlertTriangle, ChevronLeft } from 'lucide-react'

export default function OSHACompliance({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()

  const job = selectedJobId ? state.jobs.find(j => j.id === selectedJobId) : null
  const checkedCount = job ? OSHA_CHECKLIST.filter(item => job.oshaChecklist?.[item]).length : 0
  const pct = OSHA_CHECKLIST.length > 0 ? Math.round((checkedCount / OSHA_CHECKLIST.length) * 100) : 0
  const allClear = checkedCount === OSHA_CHECKLIST.length

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        {selectedJobId && navigateTo && (
          <button onClick={() => navigateTo('jobs', { jobId: selectedJobId })} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors mr-1 flex-shrink-0">
            <ChevronLeft size={14} /> Back to Job
          </button>
        )}
        <select
          value={selectedJobId ?? ''}
          onChange={e => setSelectedJobId(e.target.value || null)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Select job…</option>
          {state.jobs.map(j => {
            const c = state.clients.find(x => x.id === j.clientId)
            return <option key={j.id} value={j.id}>{j.type} — {c?.name} — {j.stage}</option>
          })}
        </select>
        {job && (
          <span className={`ml-2 text-xs font-bold px-2.5 py-1 rounded-full ${jobTypeColor(job.type)}`}>{job.type}</span>
        )}
        {job && allClear && (
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 ml-auto">
            <ShieldCheck size={14} className="text-green-600" />
            <span className="text-xs font-semibold text-green-700">All OSHA items cleared</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!selectedJobId ? (
          <div className="text-center py-16 text-gray-400">
            <ShieldCheck size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-sm">Select a job to manage OSHA compliance</p>
          </div>
        ) : job?.type === 'Water' ? (
          <div className="max-w-xl">
            <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-yellow-800 text-sm mb-1">OSHA checklist not required</div>
                <p className="text-sm text-yellow-700">This is a Water damage job. OSHA compliance checklists apply to Mold and Fire jobs. Use the Job Checklist in Job Records for water damage protocols.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-xl space-y-5">
            {/* Progress */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-bold text-gray-900">{job.type} Job — OSHA Compliance</div>
                  <div className="text-sm text-gray-500 mt-0.5">{checkedCount} of {OSHA_CHECKLIST.length} items verified</div>
                </div>
                <div className={`text-2xl font-black ${allClear ? 'text-green-600' : pct >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>{pct}%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${allClear ? 'bg-green-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              {OSHA_CHECKLIST.map(item => {
                const checked = !!job.oshaChecklist?.[item]
                return (
                  <label
                    key={item}
                    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-all ${checked ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => dispatch({ type: ACTIONS.UPDATE_OSHA_ITEM, payload: { jobId: job.id, item, checked: e.target.checked } })}
                      className="w-4 h-4 accent-red-600 rounded flex-shrink-0"
                    />
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${checked ? 'text-green-700' : 'text-gray-800'}`}>{item}</span>
                    </div>
                    {checked && <ShieldCheck size={16} className="text-green-500 flex-shrink-0" />}
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
