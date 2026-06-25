import { useApp } from '../../context/AppContext'
import { formatCurrency } from '../../utils/helpers'
import { TrendingUp } from 'lucide-react'

const TITLES = {
  // Phase 1
  pipeline: 'Job Pipeline',
  crm: 'CRM / Clients',
  jobs: 'Job Records',
  communications: 'Communication Log',
  photos: 'Photo Attachments',
  documents: 'Document Storage',
  equipment: 'Equipment Tracker',
  timer: 'Job Timer',
  waivers: 'Liability Waivers',
  osha: 'OSHA Compliance',
  vip: 'VIP Clients',
  // Phase 2
  estimator: 'Estimator',
  proposals: 'Proposal Templates',
  quote: 'Quote Generator',
  followup: 'Estimate Follow-Up Tracker',
  invoicing: 'Invoicing',
  jobcosting: 'Job Costing',
  pl: 'P&L Snapshot',
  overhead: 'Overhead Calculator',
  cashflow: 'Cash Flow Forecast',
  insurance: 'Insurance & Claims',
  subs: 'Subcontractor Management',
  expenses: 'Expense Tracker',
  tax: 'Tax Estimator',
}

const JOB_VIEWS = ['jobs', 'photos', 'documents', 'timer', 'waivers', 'osha', 'estimator', 'quote', 'insurance', 'subs', 'expenses', 'jobcosting']

export default function Header({ currentView, selectedJobId }) {
  const { state } = useApp()

  const activeJobs = state.jobs.filter(j => j.stage !== 'Closed')
  const totalPipeline = activeJobs.reduce((sum, j) => sum + (j.revenue ?? 0), 0)

  const selectedJob = selectedJobId ? state.jobs.find(j => j.id === selectedJobId) : null
  const selectedClient = selectedJob ? state.clients.find(c => c.id === selectedJob.clientId) : null

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex-1">
        <h1 className="text-base font-semibold text-gray-900">{TITLES[currentView] ?? currentView}</h1>
        {selectedJob && JOB_VIEWS.includes(currentView) && (
          <div className="text-xs text-gray-500">
            {selectedJob.type} Job — {selectedClient?.name ?? 'Unknown'}
            <span className="mx-1.5 text-gray-300">·</span>
            {selectedJob.stage}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
        <TrendingUp size={14} className="text-red-500" />
        <span className="text-xs font-semibold text-gray-700">{formatCurrency(totalPipeline)}</span>
        <span className="text-xs text-gray-400">active pipeline</span>
      </div>
    </header>
  )
}
