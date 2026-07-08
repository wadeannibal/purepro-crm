import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { Plus, Trash2, Droplets, TrendingDown, ChevronLeft } from 'lucide-react'

const MATERIAL_TYPES = ['Drywall', 'Subfloor', 'Wood Framing', 'Concrete', 'Insulation', 'OSB', 'Carpet', 'Other']
const DRY_STANDARD = 15

function TrendChart({ readings }) {
  if (readings.length < 2) {
    return (
      <div className="flex items-center justify-center h-16 text-xs text-gray-400 italic">
        Add 2+ readings to see trend
      </div>
    )
  }

  const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date))
  const vals = sorted.map(r => parseFloat(r.reading) || 0)
  const maxVal = Math.max(...vals, DRY_STANDARD + 5)

  const W = 300
  const H = 80
  const PAD_X = 8
  const PAD_Y = 10

  const xPos = (i) => PAD_X + (i / (sorted.length - 1)) * (W - PAD_X * 2)
  const yPos = (v) => H - PAD_Y - ((v / maxVal) * (H - PAD_Y * 2))

  const polyline = sorted.map((_, i) => `${xPos(i)},${yPos(vals[i])}`).join(' ')
  const dryY = yPos(DRY_STANDARD)
  const lastVal = vals[vals.length - 1]
  const isDry = lastVal <= DRY_STANDARD

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16">
        {/* Dry standard reference line */}
        <line x1={PAD_X} y1={dryY} x2={W - PAD_X} y2={dryY}
          stroke="#10b981" strokeWidth="1" strokeDasharray="4,3" />
        <text x={W - PAD_X + 2} y={dryY + 4} fontSize="8" fill="#10b981">dry</text>

        {/* Trend line */}
        <polyline points={polyline} fill="none" stroke={isDry ? '#10b981' : '#3b82f6'} strokeWidth="2.5" strokeLinejoin="round" />

        {/* Data points */}
        {sorted.map((r, i) => (
          <circle key={i}
            cx={xPos(i)} cy={yPos(vals[i])} r="3.5"
            fill={vals[i] <= DRY_STANDARD ? '#10b981' : '#3b82f6'}
          />
        ))}
      </svg>
      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
        <span>{new Date(sorted[0].date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        <span className={`font-semibold ${isDry ? 'text-green-600' : 'text-blue-600'}`}>
          Latest: {lastVal.toFixed(1)}% {isDry ? '✓ Dry' : ''}
        </span>
        <span>{new Date(sorted[sorted.length - 1].date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  )
}

const BLANK = { date: new Date().toISOString().slice(0, 10), location: '', materialType: 'Drywall', reading: '', notes: '' }

export default function MoistureLog({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()
  const [form, setForm] = useState(BLANK)
  const [showForm, setShowForm] = useState(false)

  const waterJobs = state.jobs
  const job = waterJobs.find(j => j.id === selectedJobId) ?? waterJobs[0] ?? null
  const client = job ? state.clients.find(c => c.id === job.clientId) : null
  const readings = job?.moistureReadings ?? []

  const byLocation = useMemo(() => {
    const map = {}
    readings.forEach(r => {
      if (!map[r.location]) map[r.location] = []
      map[r.location].push(r)
    })
    return map
  }, [readings])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const add = () => {
    if (!job || !form.location || !form.reading) return
    dispatch({
      type: ACTIONS.ADD_MOISTURE_READING,
      payload: { jobId: job.id, reading: { ...form } },
    })
    setForm(BLANK)
    setShowForm(false)
  }

  const remove = (readingId) => {
    dispatch({ type: ACTIONS.DELETE_MOISTURE_READING, payload: { jobId: job.id, readingId } })
  }

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
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Droplets size={18} className="text-blue-500" /> Moisture Reading Log
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">{client?.name} — {job.address}</p>
              </div>
              <button
                onClick={() => setShowForm(s => !s)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                <Plus size={15} /> Log Reading
              </button>
            </div>

            {/* Add form */}
            {showForm && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-blue-900 mb-4">New Moisture Reading</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1.5 block">Date</label>
                    <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                      className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1.5 block">Reading %</label>
                    <input type="number" step="0.1" min="0" max="100" placeholder="e.g. 42.5"
                      value={form.reading} onChange={e => set('reading', e.target.value)}
                      className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1.5 block">Location</label>
                    <input type="text" placeholder="e.g. Basement floor NW corner"
                      value={form.location} onChange={e => set('location', e.target.value)}
                      className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1.5 block">Material</label>
                    <select value={form.materialType} onChange={e => set('materialType', e.target.value)}
                      className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {MATERIAL_TYPES.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1.5 block">Notes</label>
                    <input type="text" placeholder="Optional notes"
                      value={form.notes} onChange={e => set('notes', e.target.value)}
                      className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={add}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                    Save Reading
                  </button>
                  <button onClick={() => setShowForm(false)}
                    className="bg-white border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-500 mb-1">Total Readings</div>
                <div className="text-2xl font-bold text-gray-900">{readings.length}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-500 mb-1">Locations Monitored</div>
                <div className="text-2xl font-bold text-gray-900">{Object.keys(byLocation).length}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-500 mb-1">Locations at Dry Goal</div>
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(byLocation).filter(rs => {
                    const sorted = [...rs].sort((a, b) => a.date.localeCompare(b.date))
                    return parseFloat(sorted[sorted.length - 1]?.reading ?? 99) <= DRY_STANDARD
                  }).length}
                </div>
              </div>
            </div>

            {/* Per-location cards */}
            {Object.keys(byLocation).length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Droplets size={36} className="mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-gray-600">No readings logged yet</p>
                <p className="text-sm mt-1">Click "Log Reading" to start tracking moisture levels</p>
              </div>
            ) : (
              Object.entries(byLocation).map(([location, locReadings]) => {
                const sorted = [...locReadings].sort((a, b) => a.date.localeCompare(b.date))
                const latest = parseFloat(sorted[sorted.length - 1]?.reading ?? 0)
                const isDry = latest <= DRY_STANDARD

                return (
                  <div key={location} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    {/* Location header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <div>
                        <div className="font-semibold text-gray-900">{location}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{sorted[0].materialType}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown size={14} className={isDry ? 'text-green-500' : 'text-blue-500'} />
                        <span className={`text-sm font-bold ${isDry ? 'text-green-600' : 'text-blue-600'}`}>
                          {latest.toFixed(1)}%
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isDry ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {isDry ? 'DRY' : 'DRYING'}
                        </span>
                      </div>
                    </div>

                    {/* Chart */}
                    <div className="px-5 py-3 border-b border-gray-100">
                      <TrendChart readings={sorted} />
                    </div>

                    {/* Readings table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left px-5 py-2 text-xs font-bold text-gray-400 uppercase tracking-wide">Date</th>
                            <th className="text-left px-5 py-2 text-xs font-bold text-gray-400 uppercase tracking-wide">Reading %</th>
                            <th className="text-left px-5 py-2 text-xs font-bold text-gray-400 uppercase tracking-wide">Notes</th>
                            <th className="px-5 py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {sorted.map(r => (
                            <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="px-5 py-2 text-gray-700">
                                {new Date(r.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </td>
                              <td className="px-5 py-2">
                                <span className={`font-bold ${parseFloat(r.reading) <= DRY_STANDARD ? 'text-green-600' : 'text-gray-900'}`}>
                                  {parseFloat(r.reading).toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-5 py-2 text-gray-500 text-xs">{r.notes}</td>
                              <td className="px-3 py-2 text-right">
                                <button onClick={() => remove(r.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}
      </div>
    </div>
  )
}
