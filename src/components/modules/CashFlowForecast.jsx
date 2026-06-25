import { useApp } from '../../context/AppContext'
import { formatCurrency, computeEstimateTotals, invoiceBalance, isInvoiceOverdue, STAGE_PROBABILITY, STAGE_CLOSE_DAYS } from '../../utils/helpers'
import { Calendar, AlertCircle } from 'lucide-react'

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export default function CashFlowForecast({ navigateTo }) {
  const { state } = useApp()
  const now = new Date()

  // Build forecast entries from jobs
  const entries = state.jobs
    .filter(j => j.stage !== 'Closed')
    .map(j => {
      const client = state.clients.find(c => c.id === j.clientId)
      const prob = STAGE_PROBABILITY[j.stage] ?? 0
      const daysToClose = STAGE_CLOSE_DAYS[j.stage] ?? 30
      const closeDate = addDays(now, daysToClose)

      const totals = computeEstimateTotals(j.estimate)
      const estimatedValue = totals.grandTotal > 0 ? totals.grandTotal : (j.revenue ?? 0)

      // How much is still expected
      const { balance } = invoiceBalance(j.invoice)
      const expectedCash = j.invoice ? balance : estimatedValue
      const weightedCash = expectedCash * prob

      return { job: j, client, prob, daysToClose, closeDate, estimatedValue, expectedCash, weightedCash }
    })
    .sort((a, b) => a.daysToClose - b.daysToClose)

  const next30 = entries.filter(e => e.daysToClose <= 30)
  const next60 = entries.filter(e => e.daysToClose > 30 && e.daysToClose <= 60)
  const next90 = entries.filter(e => e.daysToClose > 60 && e.daysToClose <= 90)

  const total30 = next30.reduce((s, e) => s + e.weightedCash, 0)
  const total60 = next60.reduce((s, e) => s + e.weightedCash, 0)
  const total90 = next90.reduce((s, e) => s + e.weightedCash, 0)
  const totalForecast = total30 + total60 + total90

  // Overdue invoices
  const overdueInvoices = state.jobs.filter(j => isInvoiceOverdue(j.invoice))
  const overdueTotal = overdueInvoices.reduce((s, j) => {
    const { balance } = invoiceBalance(j.invoice)
    return s + balance
  }, 0)

  const ForecastSection = ({ label, jobs, total, days }) => (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-sm">{label}</h3>
        <div className="text-right">
          <div className="text-xs text-gray-500">Probability-Weighted</div>
          <div className="text-xl font-bold text-green-700">{formatCurrency(total)}</div>
        </div>
      </div>
      {jobs.length === 0 ? (
        <div className="px-5 py-6 text-sm text-gray-400 text-center">No active jobs in this window</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {jobs.map(({ job, client, prob, closeDate, estimatedValue, expectedCash, weightedCash }) => (
            <div key={job.id} className="flex items-center gap-4 px-5 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900 truncate">{client?.name ?? 'Unknown'}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex-shrink-0">{job.type}</span>
                  <span className="text-xs text-gray-500 flex-shrink-0">{job.stage}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Est. close {closeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-gray-400">{(prob * 100).toFixed(0)}% prob</div>
                <div className="text-sm font-semibold text-gray-900">{formatCurrency(weightedCash)}</div>
                <div className="text-xs text-gray-400">of {formatCurrency(expectedCash)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-1">0–30 Days</div>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(total30)}</div>
            <div className="text-xs text-gray-400">{next30.length} jobs</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-1">31–60 Days</div>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(total60)}</div>
            <div className="text-xs text-gray-400">{next60.length} jobs</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-1">61–90 Days</div>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(total90)}</div>
            <div className="text-xs text-gray-400">{next90.length} jobs</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="text-xs text-red-600 mb-1">90-Day Total</div>
            <div className="text-xl font-bold text-red-700">{formatCurrency(totalForecast)}</div>
            <div className="text-xs text-red-400">probability-weighted</div>
          </div>
        </div>

        {/* Overdue alert */}
        {overdueInvoices.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-red-900">{overdueInvoices.length} Overdue Invoice{overdueInvoices.length !== 1 ? 's' : ''} — {formatCurrency(overdueTotal)} outstanding</div>
              <div className="text-xs text-red-700 mt-0.5">
                {overdueInvoices.map(j => state.clients.find(c => c.id === j.clientId)?.name).filter(Boolean).join(', ')}
              </div>
            </div>
          </div>
        )}

        {/* Forecast sections */}
        <ForecastSection label="Next 30 Days" jobs={next30} total={total30} days={30} />
        <ForecastSection label="31–60 Days" jobs={next60} total={total60} days={60} />
        <ForecastSection label="61–90 Days" jobs={next90} total={total90} days={90} />

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 text-sm text-yellow-800">
          <Calendar size={15} className="flex-shrink-0 mt-0.5" />
          <div>
            <strong>Probability weighting</strong> by stage: Lead 20%, Inspection 50%, Estimate Sent 65%, Approved 85%, Remediation 90%, Post-Test 95%, Invoiced 100%. Dates are estimated based on typical stage duration. Update estimate values in the Estimator for accurate projections.
          </div>
        </div>
      </div>
    </div>
  )
}
