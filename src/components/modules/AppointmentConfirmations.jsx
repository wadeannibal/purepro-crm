import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { BellRing, Copy, Check, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const fmtDate = (dateStr) =>
  new Date(dateStr + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

const fmtTime = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`
}

function buildConfirmation(event, job, client) {
  const clientName = client?.name?.split(' ')[0] ?? 'there'
  const address = job?.address ?? event.address ?? '[Address]'
  const date = fmtDate(event.date)
  const time = event.startTime ? `at ${fmtTime(event.startTime)}` : ''
  return `Hi ${clientName}, this is PurePro Restoration confirming your ${event.eventType.toLowerCase()} appointment on ${date}${time ? ' ' + time : ''} at ${address}.

Please ensure access to the property at that time. If you need to reschedule or have any questions, call us anytime.

We look forward to seeing you!
— PurePro Restoration`
}

function buildReminder(event, job, client) {
  const clientName = client?.name?.split(' ')[0] ?? 'there'
  const time = event.startTime ? `at ${fmtTime(event.startTime)}` : 'tomorrow'
  const address = job?.address ?? event.address ?? '[Address]'
  return `Hi ${clientName}, just a reminder that PurePro Restoration will be at ${address} tomorrow${event.startTime ? ' ' + time : ''} for your ${event.eventType.toLowerCase()}.

Please make sure we have access to the property. See you then!
— PurePro Restoration`
}

function EventCard({ event, job, client, type }) {
  const { dispatch } = useApp()
  const [copiedConfirm, setCopiedConfirm] = useState(false)
  const [copiedRemind, setCopiedRemind] = useState(false)
  const [editConfirm, setEditConfirm] = useState(buildConfirmation(event, job, client))
  const [editRemind, setEditRemind] = useState(buildReminder(event, job, client))

  const copy = async (text, which) => {
    try { await navigator.clipboard.writeText(text) } catch {
      const el = document.createElement('textarea')
      el.value = text; document.body.appendChild(el); el.select()
      document.execCommand('copy'); document.body.removeChild(el)
    }
    if (which === 'confirm') { setCopiedConfirm(true); setTimeout(() => setCopiedConfirm(false), 2500) }
    else { setCopiedRemind(true); setTimeout(() => setCopiedRemind(false), 2500) }
  }

  const markConfirm = () => dispatch({ type: ACTIONS.MARK_CONFIRMATION_SENT, payload: { eventId: event.id } })
  const markRemind = () => dispatch({ type: ACTIONS.MARK_REMINDER_SENT, payload: { eventId: event.id } })

  const daysUntil = Math.ceil((new Date(event.date) - new Date().setHours(0,0,0,0)) / 86400000)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{event.eventType}</span>
            {client && <span className="text-gray-500">—</span>}
            {client && <span className="text-gray-700">{client.name}</span>}
          </div>
          <div className="text-sm text-gray-400 mt-0.5">
            {fmtDate(event.date)}{event.startTime ? ` at ${fmtTime(event.startTime)}` : ''}
            {job?.address && <span className="ml-2">· {job.address}</span>}
          </div>
        </div>
        <div className={`text-xs font-semibold px-2.5 py-1 rounded-full
          ${daysUntil === 0 ? 'bg-red-100 text-red-700' :
            daysUntil === 1 ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-600'}`}>
          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Confirmation message */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Confirmation Message</div>
            {event.confirmationSent && (
              <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <CheckCircle size={12} /> Sent {event.confirmationSentAt ? new Date(event.confirmationSentAt).toLocaleDateString() : ''}
              </div>
            )}
          </div>
          <textarea
            value={editConfirm}
            onChange={e => setEditConfirm(e.target.value)}
            rows={5}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
          />
          {!event.confirmationSent ? (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => copy(editConfirm, 'confirm')}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                  ${copiedConfirm ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {copiedConfirm ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Approve & Copy</>}
              </button>
              <button
                onClick={markConfirm}
                className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <CheckCircle size={12} /> Mark as Sent
              </button>
            </div>
          ) : (
            <div className="mt-2 text-xs text-green-600 flex items-center gap-1.5">
              <CheckCircle size={12} /> Confirmation logged
            </div>
          )}
        </div>

        {/* Reminder (only if appointment is tomorrow) */}
        {daysUntil <= 1 && (
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">24-Hour Reminder</div>
                {daysUntil === 1 && (
                  <span className="text-[10px] bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">Due Today</span>
                )}
              </div>
              {event.reminderSent && (
                <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle size={12} /> Sent
                </div>
              )}
            </div>
            <textarea
              value={editRemind}
              onChange={e => setEditRemind(e.target.value)}
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
            />
            {!event.reminderSent ? (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => copy(editRemind, 'remind')}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                    ${copiedRemind ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  {copiedRemind ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Approve & Copy</>}
                </button>
                <button
                  onClick={markRemind}
                  className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <CheckCircle size={12} /> Mark as Sent
                </button>
              </div>
            ) : (
              <div className="mt-2 text-xs text-green-600 flex items-center gap-1.5">
                <CheckCircle size={12} /> Reminder logged
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AppointmentConfirmations({ navigateTo }) {
  const { state } = useApp()
  const events = state.events ?? []
  const today = new Date(); today.setHours(0,0,0,0)

  const upcoming = events
    .filter(e => new Date(e.date + 'T00:00') >= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const needsAction = upcoming.filter(e => !e.confirmationSent || (
    Math.ceil((new Date(e.date) - today) / 86400000) <= 1 && !e.reminderSent
  ))

  const allDone = upcoming.filter(e =>
    e.confirmationSent && (Math.ceil((new Date(e.date) - today) / 86400000) > 1 || e.reminderSent)
  )

  const getJobClient = (event) => {
    const job = event.jobId ? state.jobs.find(j => j.id === event.jobId) : null
    const client = job ? state.clients.find(c => c.id === job.clientId) : null
    return { job, client }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Upcoming</div>
            <div className="text-3xl font-bold text-gray-900">{upcoming.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">Needs Action</div>
            <div className="text-3xl font-bold text-red-600">{needsAction.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-1">All Confirmed</div>
            <div className="text-3xl font-bold text-green-600">{allDone.length}</div>
          </div>
        </div>

        {upcoming.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl text-gray-400">
            <BellRing size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-gray-600">No upcoming appointments</p>
            <p className="text-sm mt-1">
              Add appointments in the{' '}
              <button onClick={() => navigateTo('scheduler')} className="text-red-600 underline font-medium">
                Scheduler
              </button>
            </p>
          </div>
        ) : (
          <>
            {needsAction.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={14} className="text-red-500" />
                  <h2 className="text-xs font-bold text-red-600 uppercase tracking-wider">Needs Confirmation or Reminder</h2>
                </div>
                <div className="space-y-4">
                  {needsAction.map(event => {
                    const { job, client } = getJobClient(event)
                    return <EventCard key={event.id} event={event} job={job} client={client} />
                  })}
                </div>
              </div>
            )}

            {allDone.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={14} className="text-green-500" />
                  <h2 className="text-xs font-bold text-green-600 uppercase tracking-wider">Confirmed</h2>
                </div>
                <div className="space-y-3">
                  {allDone.map(event => {
                    const { job, client } = getJobClient(event)
                    return (
                      <div key={event.id} className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center gap-3 opacity-70">
                        <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-700">{event.eventType}</span>
                          {client && <span className="text-sm text-gray-400 ml-2">— {client.name}</span>}
                          <span className="text-sm text-gray-400 ml-2">
                            {new Date(event.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <span className="text-xs text-green-600 font-medium whitespace-nowrap">All sent</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
