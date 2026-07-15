import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { ChevronLeft, ChevronRight, Plus, X, MapPin } from 'lucide-react'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const EVENT_TYPES = ['Inspection', 'Remediation Day', 'Post-Test', 'Follow-Up', 'Appointment']

const JOB_COLORS = {
  Mold:  { chip: 'bg-green-600',  dot: 'bg-green-500'  },
  Water: { chip: 'bg-blue-600',   dot: 'bg-blue-500'   },
  Fire:  { chip: 'bg-orange-600', dot: 'bg-orange-500' },
}
const DEFAULT_COLOR = { chip: 'bg-gray-600', dot: 'bg-gray-500' }

const uid = () => crypto.randomUUID()

const fmtTime = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m}${hour < 12 ? 'am' : 'pm'}`
}

const toDateStr = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const BLANK_FORM = { date: '', startTime: '09:00', endTime: '10:00', eventType: 'Inspection', jobId: '', notes: '' }

export default function Scheduler({ navigateTo }) {
  const { state, dispatch } = useApp()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(BLANK_FORM)

  const events = state.events ?? []

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()

  const cells = useMemo(() => {
    const arr = []
    for (let i = 0; i < firstDow; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(d)
    while (arr.length % 7 !== 0) arr.push(null)
    return arr
  }, [firstDow, daysInMonth])

  const eventsForDay = (day) => {
    if (!day) return []
    const ds = toDateStr(year, month, day)
    return events
      .filter(e => e.date === ds)
      .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
  }

  const getDisplay = (event) => {
    const job = event.jobId ? state.jobs.find(j => j.id === event.jobId) : null
    const client = job ? state.clients.find(c => c.id === job.clientId) : null
    const color = job ? (JOB_COLORS[job.type] ?? DEFAULT_COLOR) : DEFAULT_COLOR
    return { job, client, color }
  }

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()) }

  const openAdd = (day) => {
    if (modal) return
    setForm({ ...BLANK_FORM, date: toDateStr(year, month, day) })
    setModal('add')
  }

  const openEdit = (event, e) => {
    e.stopPropagation()
    setForm({ ...event })
    setModal('edit')
  }

  const save = () => {
    if (!form.date || !form.eventType) return
    if (modal === 'add') {
      dispatch({ type: ACTIONS.ADD_EVENT, payload: { id: uid(), ...form } })
    } else {
      dispatch({ type: ACTIONS.UPDATE_EVENT, payload: form })
    }
    setModal(null)
  }

  const remove = () => {
    if (!window.confirm('Delete this appointment?')) return
    dispatch({ type: ACTIONS.DELETE_EVENT, payload: { id: form.id } })
    setModal(null)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft size={18} className="text-gray-600" />
              </button>
              <h2 className="text-lg font-bold text-gray-900 w-44 text-center">
                {MONTH_NAMES[month]} {year}
              </h2>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight size={18} className="text-gray-600" />
              </button>
              <button onClick={goToday} className="ml-2 text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                Today
              </button>
            </div>
            <button
              onClick={() => openAdd(today.getDate())}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={15} /> Add Event
            </button>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {DAY_NAMES.map(d => (
                <div key={d} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 divide-x divide-gray-100">
              {cells.map((day, i) => {
                const isToday = day && day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                const dayEvents = eventsForDay(day)
                const isLastRow = i >= cells.length - 7

                return (
                  <div
                    key={i}
                    onClick={() => day && openAdd(day)}
                    className={`min-h-[120px] p-2 cursor-pointer transition-colors group
                      ${day ? 'hover:bg-blue-50/40' : 'bg-gray-50/60'}
                      ${!isLastRow ? 'border-b border-gray-100' : ''}
                    `}
                  >
                    {day && (
                      <>
                        <div className={`w-7 h-7 flex items-center justify-center text-sm font-semibold rounded-full mb-1.5 transition-colors
                          ${isToday ? 'bg-red-600 text-white' : 'text-gray-700 group-hover:bg-gray-100'}`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map(event => {
                            const { color, client, job } = getDisplay(event)
                            return (
                              <div
                                key={event.id}
                                onClick={e => openEdit(event, e)}
                                title={`${event.eventType}${client ? ` — ${client.name}` : ''}${job ? ` (${job.type})` : ''}`}
                                className={`text-[11px] text-white ${color.chip} rounded-md px-1.5 py-0.5 truncate cursor-pointer hover:opacity-80 transition-opacity leading-tight`}
                              >
                                {event.startTime && <span className="opacity-80 mr-1">{fmtTime(event.startTime)}</span>}
                                {client ? client.name.split(' ')[0] : event.eventType}
                              </div>
                            )
                          })}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-gray-400 pl-1 font-medium">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-4">
            <span className="text-xs text-gray-400 font-medium">Job type:</span>
            {Object.entries(JOB_COLORS).map(([type, { dot }]) => (
              <div key={type} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                {type}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
              No job linked
            </div>
          </div>

          {/* Upcoming events list */}
          {events.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Upcoming This Month</h3>
              <div className="space-y-2">
                {events
                  .filter(e => {
                    const d = new Date(e.date)
                    return d.getFullYear() === year && d.getMonth() === month
                  })
                  .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? ''))
                  .map(event => {
                    const { job, client, color } = getDisplay(event)
                    return (
                      <div
                        key={event.id}
                        onClick={e => openEdit(event, e)}
                        className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
                      >
                        <div className={`w-1 self-stretch rounded-full ${color.chip}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{event.eventType}</span>
                            {client && <span className="text-sm text-gray-500">— {client.name}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                            <span>{new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            {event.startTime && <span>{fmtTime(event.startTime)}{event.endTime ? ` – ${fmtTime(event.endTime)}` : ''}</span>}
                            {job?.address && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin size={10} /> {job.address}
                              </span>
                            )}
                          </div>
                        </div>
                        {job && (
                          <span className={`text-[11px] font-semibold text-white ${color.chip} px-2 py-0.5 rounded-full`}>
                            {job.type}
                          </span>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {modal === 'add' ? 'New Event' : 'Edit Event'}
              </h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => set('date', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Start</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={e => set('startTime', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">End</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={e => set('endTime', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Event Type</label>
                <select
                  value={form.eventType}
                  onChange={e => set('eventType', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Linked Job</label>
                <select
                  value={form.jobId}
                  onChange={e => set('jobId', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">— No job linked —</option>
                  {state.jobs.map(j => {
                    const c = state.clients.find(cl => cl.id === j.clientId)
                    return (
                      <option key={j.id} value={j.id}>
                        {j.type} — {c?.name ?? 'Unknown'} ({j.stage})
                      </option>
                    )
                  })}
                </select>
              </div>

              {form.jobId && (() => {
                const job = state.jobs.find(j => j.id === form.jobId)
                return job?.address ? (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    <MapPin size={12} /> {job.address}
                  </div>
                ) : null
              })()}

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 px-6 pb-6">
              <button
                onClick={save}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                {modal === 'add' ? 'Add Event' : 'Save Changes'}
              </button>
              {modal === 'edit' && (
                <button
                  onClick={remove}
                  className="px-4 bg-gray-100 hover:bg-red-50 text-red-600 text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
