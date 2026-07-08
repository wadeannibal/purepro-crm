import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { GraduationCap, Plus, X, CheckCircle, Circle, ChevronDown, ChevronRight, Trash2, BookOpen } from 'lucide-react'

const WEEKS = [
  {
    week: 1,
    label: 'Week 1 — Admin & Paperwork',
    items: [
      { id: 'w1_1', text: 'Complete new-hire paperwork (I-9, W-4, direct deposit)' },
      { id: 'w1_2', text: 'Review and sign employment agreement' },
      { id: 'w1_3', text: 'Company overview and mission briefing' },
      { id: 'w1_4', text: 'Review Employee Handbook and HR policies' },
      { id: 'w1_5', text: 'OSHA 10 training (or verify current card)' },
      { id: 'w1_6', text: 'Read Water Mitigation SOP (Document Library)' },
      { id: 'w1_7', text: 'Read Mold Remediation SOP (Document Library)' },
      { id: 'w1_8', text: 'Read PPE & Safety Protocol (Document Library)' },
      { id: 'w1_9', text: 'Set up company phone/app access (PurePro CRM)' },
      { id: 'w1_10', text: 'Vehicle inspection sign-off and equipment orientation' },
    ],
  },
  {
    week: 2,
    label: 'Week 2 — Shadowing & Field Orientation',
    items: [
      { id: 'w2_1', text: 'Shadow on minimum 3 active job sites' },
      { id: 'w2_2', text: 'Observe equipment setup (air movers, dehumidifiers, negative air)' },
      { id: 'w2_3', text: 'Observe moisture mapping and documentation procedure' },
      { id: 'w2_4', text: 'Observe client communication on-site (intro, explanation, sign-off)' },
      { id: 'w2_5', text: 'Observe containment setup and teardown for a mold job' },
      { id: 'w2_6', text: 'Review Job Site Safety Checklist (Document Library) with supervisor' },
      { id: 'w2_7', text: 'Complete PPE donning/doffing competency check' },
      { id: 'w2_8', text: 'Review PurePro estimating and proposal process' },
      { id: 'w2_9', text: 'Shadow one estimate walkthrough with client present' },
    ],
  },
  {
    week: 3,
    label: 'Week 3 — Supervised Field Work',
    items: [
      { id: 'w3_1', text: 'Lead equipment setup/teardown under supervision' },
      { id: 'w3_2', text: 'Perform moisture readings independently and document in app' },
      { id: 'w3_3', text: 'Complete containment setup for a mold job (supervised)' },
      { id: 'w3_4', text: 'Apply antimicrobial treatment under supervision' },
      { id: 'w3_5', text: 'Complete daily drying log entries for assigned jobs' },
      { id: 'w3_6', text: 'Conduct client update call (supervised)' },
      { id: 'w3_7', text: 'Practice estimate walkthrough — supervisor observes' },
      { id: 'w3_8', text: 'Review liability waiver process and get client signature independently' },
      { id: 'w3_9', text: 'Mid-point performance check-in with supervisor' },
    ],
  },
  {
    week: 4,
    label: 'Week 4 — Certification Enrollment',
    items: [
      { id: 'w4_1', text: 'Register for IICRC WRT (Water Restoration Technician) course' },
      { id: 'w4_2', text: 'Register for IICRC ASD (Applied Structural Drying) course' },
      { id: 'w4_3', text: 'Register for IICRC AMRT (Mold Remediation) course' },
      { id: 'w4_4', text: 'Review Certification Tracker — understand renewal schedule' },
      { id: 'w4_5', text: 'Complete solo job assignment (supervisor available by phone)' },
      { id: 'w4_6', text: 'Final performance evaluation with Wade' },
      { id: 'w4_7', text: 'Complete 30-day onboarding summary sign-off' },
    ],
  },
]

const BLANK = { name: '', role: 'Technician', startDate: '' }

export default function EmployeeOnboarding({ navigateTo }) {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [selectedId, setSelectedId] = useState(null)
  const [expandedWeeks, setExpandedWeeks] = useState({ 1: true, 2: true, 3: true, 4: true })

  const employees = state.employees ?? []
  const selected = employees.find(e => e.id === selectedId)

  const save = () => {
    if (!form.name) return
    dispatch({ type: ACTIONS.ADD_EMPLOYEE, payload: form })
    setForm(BLANK)
    setShowForm(false)
  }

  const del = (id) => {
    if (window.confirm('Remove this employee record?')) {
      dispatch({ type: ACTIONS.DELETE_EMPLOYEE, payload: { id } })
      if (selectedId === id) setSelectedId(null)
    }
  }

  const toggleItem = (employeeId, itemId, current) => {
    dispatch({ type: ACTIONS.UPDATE_ONBOARDING_ITEM, payload: { employeeId, itemId, completed: !current } })
  }

  const toggleWeek = (w) => setExpandedWeeks(p => ({ ...p, [w]: !p[w] }))

  const allItems = WEEKS.flatMap(w => w.items)
  const completedCount = (emp) => allItems.filter(i => emp.onboardingItems?.[i.id]?.completed).length
  const pct = (emp) => Math.round((completedCount(emp) / allItems.length) * 100)

  if (selected) {
    const done = completedCount(selected)
    const total = allItems.length
    const progress = pct(selected)
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedId(null)} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
              <ChevronRight size={14} className="rotate-180" /> Back
            </button>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
              <div className="text-sm text-gray-500">{selected.role} · Started {selected.startDate ? new Date(selected.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{progress}%</div>
              <div className="text-xs text-gray-500">{done}/{total} complete</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-gray-200 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>

          {navigateTo && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-blue-700">Some tasks reference the Document Library for SOPs.</span>
              <button onClick={() => navigateTo('docs')} className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900">
                <BookOpen size={12} /> Open Library
              </button>
            </div>
          )}

          {WEEKS.map(({ week, label, items }) => {
            const weekDone = items.filter(i => selected.onboardingItems?.[i.id]?.completed).length
            const expanded = expandedWeeks[week]
            return (
              <div key={week} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <button onClick={() => toggleWeek(week)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${weekDone === items.length ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {week}
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">{label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{weekDone}/{items.length}</span>
                    {expanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                  </div>
                </button>
                {expanded && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {items.map(item => {
                      const done = selected.onboardingItems?.[item.id]?.completed
                      return (
                        <div key={item.id}
                          onClick={() => toggleItem(selected.id, item.id, done)}
                          className="flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                          {done
                            ? <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                            : <Circle size={16} className="text-gray-300 flex-shrink-0 mt-0.5" />}
                          <span className={`text-sm ${done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.text}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap size={18} className="text-red-500" /> Employee Onboarding
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Structured 4-week checklist for new technicians.</p>
          </div>
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl">
            <Plus size={14} /> Add Employee
          </button>
        </div>

        {showForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-blue-900">New Employee</h3>
              <button onClick={() => setShowForm(false)}><X size={16} className="text-blue-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Full Name</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Alex Medina"
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Role</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Technician</option>
                  <option>Lead Technician</option>
                  <option>Project Manager</option>
                  <option>Estimator</option>
                  <option>Office / Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl">Add Employee</button>
              <button onClick={() => setShowForm(false)} className="bg-white border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        {employees.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <GraduationCap size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-500">No employee records yet</p>
            <p className="text-sm text-gray-400 mt-1">Add a new hire to start their 4-week onboarding checklist.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {employees.map(emp => {
              const done = completedCount(emp)
              const total = allItems.length
              const progress = pct(emp)
              return (
                <div key={emp.id} className="bg-white border border-gray-200 rounded-2xl p-5 cursor-pointer hover:border-gray-300 transition-colors"
                  onClick={() => setSelectedId(emp.id)}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-gray-900">{emp.name}</div>
                      <div className="text-xs text-gray-500">{emp.role} · {emp.startDate ? new Date(emp.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Start date not set'}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{progress}%</div>
                        <div className="text-xs text-gray-400">{done}/{total}</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); del(emp.id) }} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
