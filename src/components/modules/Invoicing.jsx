import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import {
  formatCurrency, formatCurrencyExact, formatDate,
  invoiceBalance, isInvoiceOverdue, invoiceStatusColor, computeEstimateTotals,
} from '../../utils/helpers'
import { FileText, Plus, DollarSign, CheckCircle, AlertCircle, ChevronDown, Printer } from 'lucide-react'

const STATUS_OPTIONS = ['Draft', 'Sent', 'Partial', 'Paid', 'Overdue']

export default function Invoicing({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state, dispatch } = useApp()
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Check')
  const [paymentNote, setPaymentNote] = useState('')
  const [addingPayment, setAddingPayment] = useState(false)

  const job = selectedJobId ? state.jobs.find(j => j.id === selectedJobId) : null
  const client = job ? state.clients.find(c => c.id === job.clientId) : null
  const invoice = job?.invoice ?? null
  const estimate = job?.estimate ?? null
  const totals = computeEstimateTotals(estimate)

  const { paid, balance } = invoiceBalance(invoice)
  const overdue = isInvoiceOverdue(invoice)

  const createInvoice = () => {
    if (!job) return
    const amount = totals.grandTotal > 0 ? totals.grandTotal : 0
    dispatch({
      type: ACTIONS.SAVE_INVOICE,
      payload: {
        jobId: job.id,
        invoice: {
          estimateId: estimate?.id ?? null,
          status: 'Draft',
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          amountTotal: amount,
          payments: [],
          createdAt: new Date().toISOString(),
        },
      },
    })
  }

  const updateStatus = (status) => {
    dispatch({ type: ACTIONS.UPDATE_INVOICE_STATUS, payload: { jobId: job.id, status } })
  }

  const updateAmount = (val) => {
    dispatch({
      type: ACTIONS.SAVE_INVOICE,
      payload: { jobId: job.id, invoice: { ...invoice, amountTotal: parseFloat(val) || 0 } },
    })
  }

  const updateDueDate = (val) => {
    dispatch({
      type: ACTIONS.SAVE_INVOICE,
      payload: { jobId: job.id, invoice: { ...invoice, dueDate: val } },
    })
  }

  const addPayment = () => {
    const amount = parseFloat(paymentAmount)
    if (!amount) return
    dispatch({
      type: ACTIONS.ADD_PAYMENT,
      payload: {
        jobId: job.id,
        payment: {
          amount,
          method: paymentMethod,
          note: paymentNote,
          date: new Date().toISOString(),
        },
      },
    })
    setPaymentAmount('')
    setPaymentNote('')
    setAddingPayment(false)

    // Auto-update status based on balance
    const newPaid = paid + amount
    const newBalance = (invoice.amountTotal ?? 0) - newPaid
    const newStatus = newBalance <= 0 ? 'Paid' : newPaid > 0 ? 'Partial' : invoice.status
    if (newStatus !== invoice.status) {
      dispatch({ type: ACTIONS.UPDATE_INVOICE_STATUS, payload: { jobId: job.id, status: newStatus } })
    }
  }

  const deletePayment = (paymentId) => {
    if (!window.confirm('Delete this payment record?')) return
    dispatch({ type: ACTIONS.DELETE_PAYMENT, payload: { jobId: job.id, paymentId } })
  }

  const handlePrint = () => {
    const style = document.createElement('style')
    style.id = 'invoice-print-style'
    style.innerHTML = `@media print { body * { visibility: hidden !important; } #invoice-print-root, #invoice-print-root * { visibility: visible !important; } #invoice-print-root { position: fixed !important; top: 0; left: 0; width: 100%; background: white; padding: 0.75in; box-sizing: border-box; } @page { margin: 0; size: letter; } }`
    document.head.appendChild(style)
    window.print()
    document.head.removeChild(style)
  }

  // Summary view — all jobs with invoices
  if (!selectedJobId) {
    const jobsWithInvoices = state.jobs.filter(j => j.invoice)
    const totalInvoiced = jobsWithInvoices.reduce((s, j) => s + (j.invoice.amountTotal ?? 0), 0)
    const totalCollected = jobsWithInvoices.reduce((s, j) => s + invoiceBalance(j.invoice).paid, 0)
    const totalOwed = totalInvoiced - totalCollected

    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="text-xs text-gray-500 mb-1">Total Invoiced</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvoiced)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="text-xs text-gray-500 mb-1">Total Collected</div>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(totalCollected)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="text-xs text-gray-500 mb-1">Outstanding</div>
              <div className={`text-2xl font-bold ${totalOwed > 0 ? 'text-orange-700' : 'text-gray-900'}`}>{formatCurrency(totalOwed)}</div>
            </div>
          </div>

          {/* Invoice list */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">All Invoices</h2>
              <select onChange={e => setSelectedJobId(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">Select job to open invoice…</option>
                {state.jobs.map(j => {
                  const c = state.clients.find(x => x.id === j.clientId)
                  return <option key={j.id} value={j.id}>{j.type} — {c?.name} — {j.stage}</option>
                })}
              </select>
            </div>
            {jobsWithInvoices.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText size={32} className="mx-auto mb-2 opacity-20" />
                <p className="font-medium text-sm">No invoices created yet</p>
                <p className="text-xs mt-1">Select a job above to create one</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {jobsWithInvoices.map(j => {
                  const c = state.clients.find(x => x.id === j.clientId)
                  const { paid: p, balance: b } = invoiceBalance(j.invoice)
                  const od = isInvoiceOverdue(j.invoice)
                  const status = od && j.invoice.status !== 'Paid' ? 'Overdue' : j.invoice.status
                  return (
                    <button key={j.id} onClick={() => setSelectedJobId(j.id)} className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 text-left transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">{c?.name ?? 'Unknown'}</span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${invoiceStatusColor(status)}`}>{status}</span>
                          {od && j.invoice.status !== 'Paid' && <AlertCircle size={13} className="text-red-500" />}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{j.type} — Due {formatDate(j.invoice.dueDate)}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-gray-900">{formatCurrency(j.invoice.amountTotal)}</div>
                        <div className="text-xs text-gray-400">{p > 0 ? `${formatCurrency(p)} paid` : 'no payments'}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Single-job invoice view
  const currentStatus = overdue && invoice?.status !== 'Paid' ? 'Overdue' : invoice?.status

  return (
    <div className="h-full overflow-y-auto">
      <div id="invoice-print-root" className="max-w-2xl mx-auto p-6 space-y-5">
        {/* Job selector */}
        <div className="flex items-center gap-3 print:hidden">
          <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
            {state.jobs.map(j => {
              const c = state.clients.find(x => x.id === j.clientId)
              return <option key={j.id} value={j.id}>{j.type} — {c?.name}</option>
            })}
          </select>
          <button onClick={() => setSelectedJobId(null)} className="text-xs text-gray-400 hover:text-gray-600">← All Invoices</button>
        </div>

        {!invoice ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
            <FileText size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700 mb-1">No invoice for this job yet</p>
            {estimate?.status === 'Approved' ? (
              <>
                <p className="text-sm text-gray-500 mb-4">Estimate is approved — ready to convert</p>
                <button onClick={createInvoice} className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2 rounded-lg">
                  Create Invoice from Estimate ({formatCurrency(totals.grandTotal)})
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">Create a blank invoice or approve the estimate first</p>
                <button onClick={createInvoice} className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2 rounded-lg">Create Invoice</button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Invoice header */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-lg font-bold text-gray-900">{client?.name}</div>
                  <div className="text-sm text-gray-500">{job.type} Job — {job.stage}</div>
                  {client?.address && <div className="text-xs text-gray-400 mt-1">{client.address}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrint} className="flex items-center gap-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors print:hidden">
                    <Printer size={13} /> Print / PDF
                  </button>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${invoiceStatusColor(currentStatus)}`}>{currentStatus}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Invoice Amount</label>
                  <input
                    type="number"
                    defaultValue={invoice.amountTotal}
                    onBlur={e => updateAmount(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                  <input
                    type="date"
                    defaultValue={invoice.dueDate?.slice(0, 10)}
                    onBlur={e => updateDueDate(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${overdue ? 'border-red-300 text-red-700' : 'border-gray-200'}`}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Status:</label>
                <select value={invoice.status} onChange={e => updateStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Payment summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Invoice Total</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(invoice.amountTotal)}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="text-xs text-green-600 mb-1">Paid</div>
                <div className="text-xl font-bold text-green-700">{formatCurrency(paid)}</div>
              </div>
              <div className={`border rounded-xl p-4 ${balance > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`text-xs mb-1 ${balance > 0 ? 'text-orange-600' : 'text-gray-500'}`}>Balance Due</div>
                <div className={`text-xl font-bold ${balance > 0 ? 'text-orange-700' : 'text-gray-400'}`}>{formatCurrency(balance)}</div>
              </div>
            </div>

            {/* Progress bar */}
            {invoice.amountTotal > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Payment Progress</span>
                  <span>{((paid / invoice.amountTotal) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((paid / invoice.amountTotal) * 100, 100)}%` }} />
                </div>
              </div>
            )}

            {/* Payment log */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Payment Log</h3>
                <button onClick={() => setAddingPayment(true)} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                  <Plus size={13} /> Log Payment
                </button>
              </div>

              {addingPayment && (
                <div className="px-5 py-4 bg-green-50 border-b border-green-100 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Amount</label>
                      <input autoFocus type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder={formatCurrencyExact(balance)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Method</label>
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                        {['Check', 'Cash', 'Zelle', 'Venmo', 'Credit Card', 'ACH', 'Other'].map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Note</label>
                      <input value={paymentNote} onChange={e => setPaymentNote(e.target.value)} placeholder="Optional" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addPayment} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">Add Payment</button>
                    <button onClick={() => setAddingPayment(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg">Cancel</button>
                  </div>
                </div>
              )}

              {(invoice.payments ?? []).length === 0 && !addingPayment ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">No payments logged yet</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {(invoice.payments ?? []).map(p => (
                    <div key={p.id} className="flex items-center gap-4 px-5 py-3 group">
                      <DollarSign size={14} className="text-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrencyExact(p.amount)}</div>
                        <div className="text-xs text-gray-400">{p.method} · {formatDate(p.date)}{p.note ? ` · ${p.note}` : ''}</div>
                      </div>
                      <button onClick={() => deletePayment(p.id)} className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-all">Remove</button>
                    </div>
                  ))}
                  <div className="flex items-center gap-4 px-5 py-3 bg-gray-50 border-t-2 border-gray-200">
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="flex-1 text-sm font-bold text-gray-900">Total Paid</span>
                    <span className="text-sm font-bold text-green-700">{formatCurrencyExact(paid)}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
