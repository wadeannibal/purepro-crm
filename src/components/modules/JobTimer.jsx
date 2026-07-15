import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { formatDuration, formatDateTime, totalJobHours } from '../../utils/helpers'
import { Clock, Play, Square, Trash2, DollarSign, ChevronLeft } from 'lucide-react'

const HOURLY_RATE = 85

function fmt(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function JobTimer({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()
  const [clockInTime, setClockInTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [noteText, setNoteText] = useState('')
  const [rate, setRate] = useState(HOURLY_RATE)
  const intervalRef = useRef(null)

  const job = selectedJobId ? state.jobs.find(j => j.id === selectedJobId) : null
  const timeLogs = job?.timeLogs ?? []
  const totalMins = totalJobHours(timeLogs)
  const totalCost = (totalMins / 60) * rate

  useEffect(() => {
    if (clockInTime) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - clockInTime) / 1000))
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
      setElapsed(0)
    }
    return () => clearInterval(intervalRef.current)
  }, [clockInTime])

  const clockIn = () => {
    if (!selectedJobId) return
    setClockInTime(Date.now())
  }

  const clockOut = () => {
    if (!clockInTime || !selectedJobId) return
    const duration = Math.round(elapsed / 60)
    dispatch({
      type: ACTIONS.ADD_TIME_LOG,
      payload: {
        jobId: selectedJobId,
        log: { clockIn: new Date(clockInTime).toISOString(), clockOut: new Date().toISOString(), duration, notes: noteText.trim() },
      },
    })
    setClockInTime(null)
    setNoteText('')
  }

  const del = (logId) => { if (!window.confirm('Delete this time log entry?')) return; dispatch({ type: ACTIONS.DELETE_TIME_LOG, payload: { jobId: selectedJobId, logId } }) }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        {selectedJobId && navigateTo && (
          <button onClick={() => navigateTo('jobs', { jobId: selectedJobId })} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors mr-1 flex-shrink-0">
            <ChevronLeft size={14} /> Back to Job
          </button>
        )}
        <select
          value={selectedJobId ?? ''}
          onChange={e => { setSelectedJobId(e.target.value || null); setClockInTime(null) }}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Select job…</option>
          {state.jobs.map(j => {
            const c = state.clients.find(x => x.id === j.clientId)
            return <option key={j.id} value={j.id}>{j.type} — {c?.name} — {j.stage}</option>
          })}
        </select>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-gray-500">Rate: $</span>
          <input type="number" value={rate} onChange={e => setRate(Number(e.target.value))} className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500" />
          <span className="text-xs text-gray-500">/hr</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!selectedJobId ? (
          <div className="text-center py-16 text-gray-400">
            <Clock size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-sm">Select a job to start tracking time</p>
          </div>
        ) : (
          <div className="max-w-xl space-y-6">
            {/* Timer display */}
            <div className={`rounded-2xl p-8 text-center transition-colors ${clockInTime ? 'bg-red-600' : 'bg-gray-900'}`}>
              <div className={`text-5xl font-black tracking-widest mb-2 font-mono ${clockInTime ? 'text-white' : 'text-gray-200'}`}>
                {fmt(elapsed)}
              </div>
              <div className={`text-sm font-medium mb-6 ${clockInTime ? 'text-red-200' : 'text-gray-500'}`}>
                {clockInTime ? `Clocked in at ${new Date(clockInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : 'Ready to clock in'}
              </div>
              {clockInTime && (
                <input
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Session notes (optional)…"
                  className="w-full bg-red-700/50 border border-red-400/30 rounded-xl px-4 py-2.5 text-white placeholder-red-300 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 mb-4"
                />
              )}
              <div className="flex gap-3 justify-center">
                {!clockInTime ? (
                  <button onClick={clockIn} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors shadow-lg">
                    <Play size={16} fill="white" /> Clock In
                  </button>
                ) : (
                  <button onClick={clockOut} className="flex items-center gap-2 bg-white hover:bg-gray-100 text-red-600 font-bold px-8 py-3 rounded-xl text-sm transition-colors shadow-lg">
                    <Square size={16} fill="currentColor" /> Clock Out
                  </button>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <Clock size={20} className="text-gray-400 mx-auto mb-1" />
                <div className="text-xl font-black text-gray-900">{formatDuration(totalMins)}</div>
                <div className="text-xs text-gray-500 mt-0.5">Total Time</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <DollarSign size={20} className="text-green-500 mx-auto mb-1" />
                <div className="text-xl font-black text-green-700">${totalCost.toFixed(0)}</div>
                <div className="text-xs text-gray-500 mt-0.5">Labor Cost @ ${rate}/hr</div>
              </div>
            </div>

            {/* Log history */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3">Time Log ({timeLogs.length} sessions)</h3>
              {timeLogs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No sessions logged yet</p>
              ) : (
                <div className="space-y-2">
                  {[...timeLogs].reverse().map(log => (
                    <div key={log.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 group hover:border-gray-300 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{formatDuration(log.duration)}</span>
                          <span className="text-xs text-gray-400">{formatDateTime(log.clockIn)}</span>
                        </div>
                        {log.notes && <div className="text-xs text-gray-500 mt-0.5 truncate">{log.notes}</div>}
                      </div>
                      <div className="text-sm font-semibold text-green-700 flex-shrink-0">
                        ${((log.duration / 60) * rate).toFixed(0)}
                      </div>
                      <button
                        onClick={() => del(log.id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
