import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatCurrency, invoiceBalance } from '../../utils/helpers'
import { Calculator, AlertCircle } from 'lucide-react'

const FEDERAL_BRACKETS_2024 = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
]

function federalTax(taxableIncome) {
  let tax = 0
  for (const bracket of FEDERAL_BRACKETS_2024) {
    if (taxableIncome <= bracket.min) break
    const taxable = Math.min(taxableIncome, bracket.max) - bracket.min
    tax += taxable * bracket.rate
  }
  return tax
}

export default function TaxEstimator() {
  const { state } = useApp()
  const [filingStatus, setFilingStatus] = useState('single')
  const [otherIncome, setOtherIncome] = useState('')
  const [deductions, setDeductions] = useState('')
  const [payments, setPayments] = useState('')

  // Pull gross revenue from paid/partial invoices
  const paidRevenue = state.jobs.reduce((sum, j) => {
    if (!j.invoice) return sum
    const { paid } = invoiceBalance(j.invoice)
    return sum + paid
  }, 0)

  // SE tax calculation
  const netSEIncome = paidRevenue * 0.9235
  const seTax = netSEIncome * 0.153
  const seDeduction = seTax / 2

  // Federal income tax
  const totalIncome = paidRevenue + parseFloat(otherIncome || 0)
  const standardDeduction = filingStatus === 'married' ? 29200 : 14600
  const totalDeductions = standardDeduction + seDeduction + parseFloat(deductions || 0)
  const taxableIncome = Math.max(0, totalIncome - totalDeductions)
  const federalTaxAmount = federalTax(taxableIncome)

  // Total tax liability
  const totalTax = seTax + federalTaxAmount
  const priorPayments = parseFloat(payments || 0)
  const owedOrRefund = totalTax - priorPayments

  // Quarterly estimates (remaining)
  const quarterlyPayment = Math.max(0, owedOrRefund) / 4

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const QUARTERS = [
    { label: 'Q1', due: `Apr 15, ${currentYear}`, months: [0, 1, 2] },
    { label: 'Q2', due: `Jun 17, ${currentYear}`, months: [3, 4, 5] },
    { label: 'Q3', due: `Sep 16, ${currentYear}`, months: [6, 7, 8] },
    { label: 'Q4', due: `Jan 15, ${currentYear + 1}`, months: [9, 10, 11] },
  ]
  const currentQuarter = QUARTERS.findIndex(q => q.months.includes(currentMonth))

  const effectiveRate = totalIncome > 0 ? ((totalTax / totalIncome) * 100) : 0

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 text-sm text-yellow-800">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>This is an <strong>estimate only</strong> using standard 2024 brackets. Actual taxes depend on your full financial picture, deductions, and filing details. Always consult a licensed tax professional.</div>
        </div>

        {/* Inputs */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Your Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Filing Status</label>
              <select value={filingStatus} onChange={e => setFilingStatus(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="single">Single</option>
                <option value="married">Married Filing Jointly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Business Revenue (auto)</label>
              <div className="border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900">{formatCurrency(paidRevenue)}</div>
              <div className="text-xs text-gray-400 mt-0.5">From paid/partial invoices</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Other Income (optional)</label>
              <input type="number" value={otherIncome} onChange={e => setOtherIncome(e.target.value)} placeholder="W-2, rental, etc." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Additional Deductions</label>
              <input type="number" value={deductions} onChange={e => setDeductions(e.target.value)} placeholder="Home office, health ins., etc." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estimated Tax Payments Made This Year</label>
              <input type="number" value={payments} onChange={e => setPayments(e.target.value)} placeholder="Total quarterly payments already made" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
          </div>
        </div>

        {/* SE Tax breakdown */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Self-Employment Tax (15.3%)</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Net SE income (92.35% of revenue)</span>
              <span className="font-semibold">{formatCurrency(netSEIncome)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">SE tax (15.3%)</span>
              <span className="font-semibold text-orange-700">{formatCurrency(seTax)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 border-t border-gray-100 pt-2">
              <span>SE deduction (50% of SE tax)</span>
              <span>−{formatCurrency(seDeduction)}</span>
            </div>
          </div>
        </div>

        {/* Federal income tax breakdown */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Federal Income Tax</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total gross income</span>
              <span className="font-semibold">{formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Standard deduction ({filingStatus === 'married' ? 'MFJ' : 'Single'})</span>
              <span>−{formatCurrency(standardDeduction)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>SE deduction</span>
              <span>−{formatCurrency(seDeduction)}</span>
            </div>
            {parseFloat(deductions) > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Additional deductions</span>
                <span>−{formatCurrency(parseFloat(deductions))}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
              <span className="text-gray-600">Taxable income</span>
              <span className="font-semibold">{formatCurrency(taxableIncome)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Federal income tax</span>
              <span className="font-semibold text-orange-700">{formatCurrency(federalTaxAmount)}</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-red-900 mb-4">Summary</h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-red-800">SE Tax</span>
              <span className="font-semibold text-red-900">{formatCurrency(seTax)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-800">Federal Income Tax</span>
              <span className="font-semibold text-red-900">{formatCurrency(federalTaxAmount)}</span>
            </div>
            {priorPayments > 0 && (
              <div className="flex justify-between text-sm text-red-700">
                <span>Payments made</span>
                <span>−{formatCurrency(priorPayments)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-red-900 border-t border-red-200 pt-2">
              <span>{owedOrRefund >= 0 ? 'Estimated Amount Owed' : 'Estimated Refund'}</span>
              <span>{formatCurrency(Math.abs(owedOrRefund))}</span>
            </div>
            <div className="flex justify-between text-xs text-red-700">
              <span>Effective tax rate</span>
              <span>{effectiveRate.toFixed(1)}%</span>
            </div>
          </div>

          {owedOrRefund > 0 && (
            <>
              <div className="border-t border-red-200 pt-4">
                <div className="text-xs font-bold text-red-900 mb-3">Quarterly Estimates Remaining</div>
                <div className="grid grid-cols-4 gap-2">
                  {QUARTERS.map((q, i) => {
                    const isPast = i < currentQuarter
                    const isCurrent = i === currentQuarter
                    return (
                      <div key={q.label} className={`rounded-xl p-3 text-center ${isCurrent ? 'bg-red-600 text-white' : isPast ? 'bg-red-100 text-red-400' : 'bg-white border border-red-200 text-red-900'}`}>
                        <div className={`text-xs font-bold mb-1 ${isCurrent ? 'text-red-100' : ''}`}>{q.label}</div>
                        <div className={`text-sm font-bold`}>{formatCurrency(quarterlyPayment)}</div>
                        <div className={`text-[10px] mt-1 ${isCurrent ? 'text-red-200' : 'text-red-400'}`}>{q.due}</div>
                        {isCurrent && <div className="text-[10px] text-red-200 font-semibold mt-0.5">Due next</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
