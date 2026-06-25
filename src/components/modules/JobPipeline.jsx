import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { JOB_STAGES, JOB_TYPES, CLIENT_TYPES, formatCurrency, jobTypeColor, stageColor } from '../../utils/helpers'
import Modal from '../shared/Modal'
import { Plus, GripVertical, DollarSign } from 'lucide-react'

function JobCard({ job, client, onDragStart, onClick }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-red-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${jobTypeColor(job.type)}`}>
          {job.type}
        </span>
        <GripVertical size={14} className="text-gray-300 group-hover:text-gray-400 flex-shrink-0 mt-0.5" />
      </div>
      <div className="text-sm font-semibold text-gray-900 leading-tight mb-0.5 truncate">
        {client?.name ?? 'Unknown Client'}
      </div>
      <div className="text-xs text-gray-500 truncate mb-2">{job.address}</div>
      <div className="flex items-center gap-1 text-green-700 font-semibold text-sm">
        <DollarSign size={12} />
        {formatCurrency(job.revenue).replace('$', '')}
      </div>
    </div>
  )
}

function KanbanColumn({ stage, jobs, clients, onDrop, onDragOver, onDragLeave, isDragOver, onJobClick }) {
  const total = jobs.reduce((s, j) => s + (j.revenue ?? 0), 0)
  return (
    <div
      className={`flex-shrink-0 w-52 flex flex-col rounded-xl transition-colors ${isDragOver ? 'bg-red-50' : 'bg-gray-100'}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
    >
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{stage}</span>
          <span className="text-xs font-semibold text-gray-400 bg-white rounded-full px-1.5 py-0.5 leading-none">{jobs.length}</span>
        </div>
        <div className="text-xs text-green-700 font-semibold">{formatCurrency(total)}</div>
      </div>
      <div className="flex-1 px-2 pb-3 flex flex-col gap-2 min-h-16">
        {jobs.map(job => (
          <JobCard
            key={job.id}
            job={job}
            client={clients.find(c => c.id === job.clientId)}
            onDragStart={e => { e.dataTransfer.setData('jobId', job.id); e.dataTransfer.effectAllowed = 'move' }}
            onClick={() => onJobClick(job.id)}
          />
        ))}
        {isDragOver && (
          <div className="border-2 border-dashed border-red-300 rounded-lg h-16 flex items-center justify-center">
            <span className="text-xs text-red-400 font-medium">Drop here</span>
          </div>
        )}
      </div>
    </div>
  )
}

const BLANK_JOB = { clientId: '', type: 'Mold', stage: 'Lead', revenue: '', address: '', description: '' }

export default function JobPipeline({ navigateTo }) {
  const { state, dispatch } = useApp()
  const [dragOverStage, setDragOverStage] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(BLANK_JOB)
  const [filterType, setFilterType] = useState('All')

  const visibleJobs = filterType === 'All' ? state.jobs : state.jobs.filter(j => j.type === filterType)

  const handleDrop = (e, stage) => {
    e.preventDefault()
    const jobId = e.dataTransfer.getData('jobId')
    if (jobId) dispatch({ type: ACTIONS.UPDATE_JOB, payload: { id: jobId, stage } })
    setDragOverStage(null)
  }

  const handleDragOver = (e, stage) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stage)
  }

  const save = () => {
    if (!form.clientId || !form.address) return
    dispatch({ type: ACTIONS.ADD_JOB, payload: { ...form, revenue: Number(form.revenue) || 0 } })
    setForm(BLANK_JOB)
    setShowModal(false)
  }

  const field = (label, key, type = 'text', opts) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {opts ? (
        <select
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {opts.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      )}
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex gap-1.5">
          {['All', ...JOB_TYPES].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${filterType === t ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={15} /> New Job
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 h-full kanban-scroll" style={{ minWidth: 'max-content' }}>
          {JOB_STAGES.map(stage => (
            <KanbanColumn
              key={stage}
              stage={stage}
              jobs={visibleJobs.filter(j => j.stage === stage)}
              clients={state.clients}
              isDragOver={dragOverStage === stage}
              onDrop={e => handleDrop(e, stage)}
              onDragOver={e => handleDragOver(e, stage)}
              onDragLeave={() => setDragOverStage(null)}
              onJobClick={id => navigateTo('jobs', { jobId: id })}
            />
          ))}
        </div>
      </div>

      {showModal && (
        <Modal title="New Job" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Client</label>
              <select
                value={form.clientId}
                onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select client…</option>
                {state.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field('Job Type', 'type', 'text', JOB_TYPES)}
              {field('Stage', 'stage', 'text', JOB_STAGES)}
            </div>
            {field('Revenue ($)', 'revenue', 'number')}
            {field('Job Address', 'address')}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={save} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Create Job</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
