import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { Plus, Trash2, Wind, ChevronLeft } from 'lucide-react'

const BLANK = {
  date: new Date().toISOString().slice(0, 10),
  temp: '', rh: '', gpp: '',
  dehumReading: '', airMovers: '',
  notes: '',
}

export default function DryingLog({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()
  const [form, setForm] = useState(BLANK)
  const [showForm, setShowForm] = useState(false)

  const waterJobs = state.jobs
  const job = waterJobs.find(j => j.id === selectedJobId) ?? waterJobs[0] ?? null
  const client = job ? state.clients.find(c => c.id === job.clientId) : null
  const entries = [...(job?.dryingLog ?? [])].sort((a, b) => a.date.localeCompare(b.date))

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const add = () => {
    if (!job || !form.date) return
    dispatch({
      type: ACTIONS.ADD_DRYING_ENTRY,
      payload: { jobId: job.id, entry: { ...form } },
    })
    setForm(BLANK)
    setShowForm(false)
  }

  const remove = (entryId) => {
    dispatch({ type: ACTIONS.DELETE_DRYING_ENTRY, payload: { jobId: job.id, entryId } })
  }

  const latestGPP = entries.length > 0 ? parseFloat(entries[entries.length - 1].gpp) || 0 : null

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {selectedJobId && navigateTo && (
          <button onClick={() => navigateTo('jobs', { jobId: selectedJobId })} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors">
            <ChevronLeft size={14} /> Back to Job
          </button>
        )}
        {/* Job selector */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Job</label>
          {waterJobs.length === 0 ? (
            <p className="text-sm text-gray-400">No jobs found.</p>
          ) : (
            <select
              value={job?.id ?? ''}
              onChange={e => setSelectedJobId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {waterJobs.map(j => {
                const c = state.clients.find(cl => cl.id === j.clientId)
                return <option key={j.id} value={j.id}>{c?.name ?? 'Unknown'} — {j.address} ({j.stage})</option>
              })}
            </select>
          )}
        </div>

        {job && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Wind size={18} className="text-blue-500" /> Drying Log
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">{client?.name} — {job.address}</p>
                <p className="text-xs text-gray-400 mt-0.5">Psychrometric data for IICRC S500 documentation</p>
              </div>
              <button
                onClick={() => setShowForm(s => !s)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                <Plus size={15} /> Daily Entry
              </button>
            </div>

            {/* Stats row */}
            {entries.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="text-xs text-gray-500 mb-1">Days Logged</div>
                  <div className="text-2xl font-bold text-gray-900">{entries.length}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="text-xs text-gray-500 mb-1">Latest Temp</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {entries[entries.length - 1].temp ? `${entries[entries.length - 1].temp}°F` : '—'}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="text-xs text-gray-500 mb-1">Latest RH</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {entries[entries.length - 1].rh ? `${entries[entries.length - 1].rh}%` : '—'}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="text-xs text-gray-500 mb-1">Latest GPP</div>
                  <div className={`text-2xl font-bold ${latestGPP !== null && latestGPP <= 50 ? 'text-green-600' : 'text-gray-900'}`}>
                    {latestGPP !== null ? latestGPP : '—'}
                  </div>
                </div>
              </div>
            )}

            {/* Add form */}
            {showForm && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-blue-900 mb-4">Daily Drying Entry</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1.5 block">Date</label>
                    <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                      className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1.5 block">Temp (°F)</label>
                    <input type="number" placeholder="e.g. 72" value={form.temp} onChange={e => set('temp', e.target.value)}
                      className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1.5 block">Relative Humidity %</label>
                    <input type="number" placeholder="e.g. 58" value={form.rh} onChange={e => set('rh', e.target.value)}
                      className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1.5 block">GPP (Grains/Lb)</label>
                    <input type="number" step="0.1" placeholder="e.g. 62.4" value={form.gpp} onChange={e => set('gpp', e.target.value)}
                      className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1.5 block">Dehum Reading (L/day)</label>
                    <input type="number" step="0.1" placeholder="e.g. 24.5" value={form.dehumReading} onChange={e => set('dehumReading', e.target.value)}
                      className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1.5 block">Air Mover Count</label>
                    <input type="number" placeholder="e.g. 4" value={form.airMovers} onChange={e => set('airMovers', e.target.value)}
                      className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1.5 block">Notes</label>
                    <input type="text" placeholder="Optional field notes" value={form.notes} onChange={e => set('notes', e.target.value)}
                      className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={add} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                    Save Entry
                  </button>
                  <button onClick={() => setShowForm(false)} className="bg-white border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Log table */}
            {entries.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Wind size={36} className="mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-gray-600">No drying entries yet</p>
                <p className="text-sm mt-1">Log daily psychrometric readings for IICRC S500 documentation</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Date', 'Temp °F', 'RH %', 'GPP', 'Dehum L/day', 'Air Movers', 'Notes', ''].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map(e => (
                        <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                            {new Date(e.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{e.temp || '—'}</td>
                          <td className="px-4 py-3 text-gray-700">{e.rh || '—'}</td>
                          <td className="px-4 py-3 font-semibold">
                            <span className={parseFloat(e.gpp) <= 50 ? 'text-green-600' : 'text-gray-900'}>
                              {e.gpp || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{e.dehumReading || '—'}</td>
                          <td className="px-4 py-3 text-gray-700">{e.airMovers || '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{e.notes}</td>
                          <td className="px-3 py-3 text-right">
                            <button onClick={() => remove(e.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                  IICRC S500 drying standard: GPP ≤ 50 gr/lb, RH ≤ 50%. Air movers typically 1 per 50–70 sq ft.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
