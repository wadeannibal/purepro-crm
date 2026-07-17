import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { computeEstimateTotals, formatCurrencyExact, formatDate } from '../../utils/helpers'
import { Printer, FileText } from 'lucide-react'
import { useCompanySettings } from '../../hooks/useCompanySettings'

function LineSection({ title, rows, columns }) {
  if (!rows || rows.length === 0) return null
  const total = rows.reduce((s, r) => s + (r._total ?? 0), 0)
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between border-b-2 border-gray-800 pb-1 mb-2">
        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">{title}</h3>
        <span className="text-sm font-bold text-gray-900">{formatCurrencyExact(total)}</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} className={`text-xs font-semibold text-gray-500 pb-1 ${c.align === 'right' ? 'text-right' : 'text-left'}`} style={{ width: c.width }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(c => (
                <td key={c.key} className={`py-1.5 text-gray-800 ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.format ? c.format(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function QuoteGenerator({ selectedJobId, setSelectedJobId, navigateTo }) {
  const { state } = useApp()
  const job = selectedJobId ? state.jobs.find(j => j.id === selectedJobId) : null
  const client = job ? state.clients.find(c => c.id === job.clientId) : null
  const estimate = job?.estimate

  const handlePrint = () => {
    const style = document.createElement('style')
    style.id = 'print-style'
    style.innerHTML = `
      @page { margin: 0; size: letter; }
      @media print {
        html, body { height: auto !important; overflow: visible !important; }
        body * { visibility: hidden !important; }
        #quote-print-root, #quote-print-root * { visibility: visible !important; }
        #quote-print-root {
          position: absolute !important;
          top: 0 !important; left: 0 !important;
          width: 100% !important; max-width: 100% !important;
          margin: 0 !important; box-shadow: none !important;
          background: white !important;
        }
        #quote-print-root tr { page-break-inside: avoid; break-inside: avoid; }
        #quote-print-root .print-section { page-break-inside: avoid; break-inside: avoid; }
      }
    `
    const orig = document.title
    document.title = ''
    document.head.appendChild(style)
    window.print()
    document.head.removeChild(style)
    document.title = orig
  }

  if (!selectedJobId || !estimate) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
        <FileText size={40} className="opacity-20" />
        <p className="font-medium text-sm">Select a job with an estimate to generate a quote</p>
        <select onChange={e => setSelectedJobId(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
          <option value="">Choose a job…</option>
          {state.jobs.filter(j => j.estimate).map(j => {
            const c = state.clients.find(x => x.id === j.clientId)
            return <option key={j.id} value={j.id}>{j.type} — {c?.name} ({j.estimate.status})</option>
          })}
        </select>
      </div>
    )
  }

  const totals = computeEstimateTotals(estimate)

  // Support both new unified lineItems format and legacy per-category arrays
  const isNewFormat = Array.isArray(estimate.lineItems)
  const sqftRows = isNewFormat ? [] : (estimate.sqftItems ?? []).map(i => ({ ...i, _total: (i.sqft ?? 0) * (i.ratePerSqft ?? 0) }))
  const equipRows = isNewFormat ? [] : (estimate.equipmentItems ?? []).map(i => ({ ...i, _total: (i.qty ?? 0) * (i.unitPrice ?? 0) }))
  const labRows = isNewFormat ? [] : (estimate.labItems ?? []).map(i => ({ ...i, _total: (i.qty ?? 0) * (i.unitPrice ?? 0) }))
  const matRows = isNewFormat ? [] : (estimate.materialItems ?? []).map(i => ({ ...i, _total: (i.qty ?? 0) * (i.unitPrice ?? 0) }))
  const laborRows = isNewFormat ? [] : (estimate.laborItems ?? []).map(i => ({ ...i, _total: (i.hours ?? 0) * (i.ratePerHour ?? 0) }))
  const xactRows = isNewFormat ? [] : (estimate.xactimateItems ?? []).map(i => ({ ...i, _total: (i.qty ?? 0) * (i.unitPrice ?? 0) }))
  const flatRows = isNewFormat ? [] : (estimate.flatFeeItems ?? []).map(i => ({ ...i, _total: i.amount ?? 0 }))

  const co = useCompanySettings()
  const [estimateDate, setEstimateDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [validUntilDate, setValidUntilDate] = useState(() => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))

  return (
    <div className="h-full overflow-y-auto bg-gray-100">
      {/* Action bar (hidden on print) */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 print:hidden">
        <button onClick={() => navigateTo?.('estimator')} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold px-2 py-1.5 rounded-lg hover:bg-gray-100">
          ← Back to Estimator
        </button>
        <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
          {state.jobs.filter(j => j.estimate).map(j => {
            const c = state.clients.find(x => x.id === j.clientId)
            return <option key={j.id} value={j.id}>{j.type} — {c?.name}</option>
          })}
        </select>
        <div className="flex items-center gap-2 flex-1">
          <label className="text-xs text-gray-500 shrink-0">Date</label>
          <input type="date" value={estimateDate} onChange={e => setEstimateDate(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-red-500" />
          <label className="text-xs text-gray-500 shrink-0 ml-2">Valid Until</label>
          <input type="date" value={validUntilDate} onChange={e => setValidUntilDate(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-red-500" />
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
          <Printer size={15} /> Print / Save PDF
        </button>
      </div>

      {/* Quote document */}
      <div id="quote-print-root" className="max-w-3xl mx-auto my-8 bg-white shadow-lg print:shadow-none print:my-0" style={{ minHeight: '11in' }}>
        <div className="p-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-10">
            <div>
              {co.logo
                ? <img src={co.logo} alt={co.companyName} className="h-16 max-w-[200px] object-contain mb-2" />
                : <div className="text-2xl font-black text-red-600 tracking-tight">{co.companyName}</div>
              }
              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                {co.phone && <div>{co.phone}</div>}
                {co.email && <div>{co.email}</div>}
                {co.website && <div>{co.website}</div>}
                {co.city && <div>{co.city}</div>}
                {co.licenseNumber && <div>Lic# {co.licenseNumber}</div>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-gray-900 tracking-tight">ESTIMATE</div>
              <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                <div>Date: <span className="font-medium text-gray-700">{formatDate(estimateDate + 'T12:00:00')}</span></div>
                <div>Valid Until: <span className="font-medium text-gray-700">{formatDate(validUntilDate + 'T12:00:00')}</span></div>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    estimate.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    estimate.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>{estimate.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-4 border-red-600 mb-8" />

          {/* Client + job info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Prepared For</div>
              <div className="text-lg font-bold text-gray-900">{client?.name}</div>
              {client?.address && <div className="text-sm text-gray-600 mt-1">{client.address}</div>}
              {client?.email && <div className="text-sm text-gray-600">{client.email}</div>}
              {client?.phone && <div className="text-sm text-gray-600">{client.phone}</div>}
            </div>
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Project Details</div>
              <div className="text-sm text-gray-700 space-y-1">
                <div><span className="font-semibold">Type:</span> {job.type} Remediation</div>
                {job.address && <div><span className="font-semibold">Address:</span> {job.address}</div>}
                {job.source && <div><span className="font-semibold">Source:</span> {job.source}</div>}
              </div>
            </div>
          </div>

          {/* Scope of work */}
          {estimate.scopeNotes && (
            <div className="mb-8">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-1 mb-3">Scope of Work</h2>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{estimate.scopeNotes}</div>
            </div>
          )}

          {/* Line items */}
          <div className="mb-8">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Itemized Estimate</h2>

            {/* New unified format */}
            {isNewFormat && (estimate.lineItems ?? []).length > 0 && (
              <table className="w-full text-sm mb-6">
                <thead>
                  <tr>
                    <th className="text-xs font-semibold text-gray-500 pb-1.5 text-left w-8">#</th>
                    <th className="text-xs font-semibold text-gray-500 pb-1.5 text-left" style={{ width: '40%' }}>Description</th>
                    <th className="text-xs font-semibold text-gray-500 pb-1.5 text-right w-12">Qty</th>
                    <th className="text-xs font-semibold text-gray-500 pb-1.5 text-right w-12">Unit</th>
                    <th className="text-xs font-semibold text-gray-500 pb-1.5 text-right" style={{ width: '18%' }}>Unit Price</th>
                    <th className="text-xs font-semibold text-gray-500 pb-1.5 text-right" style={{ width: '18%' }}>Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(estimate.lineItems ?? []).map((item, idx) => {
                    const total = (item.qty ?? 0) * (item.unitPrice ?? 0)
                    return (
                      <tr key={item.id ?? idx}>
                        <td className="py-1.5 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="py-1.5 text-gray-800">{item.name}</td>
                        <td className="py-1.5 text-gray-800 text-right">{item.qty}</td>
                        <td className="py-1.5 text-gray-500 text-right text-xs">{item.unit}</td>
                        <td className="py-1.5 text-gray-800 text-right">{formatCurrencyExact(item.unitPrice)}</td>
                        <td className={`py-1.5 text-right font-medium ${total < 0 ? 'text-green-700' : 'text-gray-800'}`}>{formatCurrencyExact(total)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {/* Legacy per-category format */}
            <LineSection title="Area / Square Footage" rows={sqftRows} columns={[
              { key: 'description', label: 'Description', width: '45%' },
              { key: 'sqft', label: 'Sq Ft', align: 'right', width: '18%', format: v => v?.toLocaleString() ?? '—' },
              { key: 'ratePerSqft', label: 'Rate/SF', align: 'right', width: '18%', format: v => formatCurrencyExact(v) },
              { key: '_total', label: 'Total', align: 'right', width: '19%', format: v => formatCurrencyExact(v) },
            ]} />

            <LineSection title="Equipment" rows={equipRows} columns={[
              { key: 'name', label: 'Equipment', width: '40%' },
              { key: 'qty', label: 'Qty', align: 'right', width: '12%' },
              { key: 'unit', label: 'Unit', align: 'right', width: '12%' },
              { key: 'unitPrice', label: 'Unit Price', align: 'right', width: '18%', format: v => formatCurrencyExact(v) },
              { key: '_total', label: 'Total', align: 'right', width: '18%', format: v => formatCurrencyExact(v) },
            ]} />

            <LineSection title="Lab Testing" rows={labRows} columns={[
              { key: 'description', label: 'Test', width: '52%' },
              { key: 'qty', label: 'Qty', align: 'right', width: '12%' },
              { key: 'unitPrice', label: 'Unit Price', align: 'right', width: '18%', format: v => formatCurrencyExact(v) },
              { key: '_total', label: 'Total', align: 'right', width: '18%', format: v => formatCurrencyExact(v) },
            ]} />

            <LineSection title="Materials" rows={matRows} columns={[
              { key: 'description', label: 'Material', width: '52%' },
              { key: 'qty', label: 'Qty', align: 'right', width: '12%' },
              { key: 'unitPrice', label: 'Unit Price', align: 'right', width: '18%', format: v => formatCurrencyExact(v) },
              { key: '_total', label: 'Total', align: 'right', width: '18%', format: v => formatCurrencyExact(v) },
            ]} />

            <LineSection title="Labor" rows={laborRows} columns={[
              { key: 'trade', label: 'Trade', width: '45%' },
              { key: 'hours', label: 'Hours', align: 'right', width: '15%' },
              { key: 'ratePerHour', label: 'Rate/Hr', align: 'right', width: '22%', format: v => formatCurrencyExact(v) },
              { key: '_total', label: 'Total', align: 'right', width: '18%', format: v => formatCurrencyExact(v) },
            ]} />

            <LineSection title="Xactimate Items" rows={xactRows} columns={[
              { key: 'code', label: 'Code', width: '15%' },
              { key: 'description', label: 'Description', width: '37%' },
              { key: 'qty', label: 'Qty', align: 'right', width: '10%' },
              { key: 'unit', label: 'Unit', align: 'right', width: '10%' },
              { key: 'unitPrice', label: 'Unit Price', align: 'right', width: '14%', format: v => formatCurrencyExact(v) },
              { key: '_total', label: 'Total', align: 'right', width: '14%', format: v => formatCurrencyExact(v) },
            ]} />

            <LineSection title="Flat Fees & Other Charges" rows={flatRows} columns={[
              { key: 'description', label: 'Description', width: '70%' },
              { key: '_total', label: 'Amount', align: 'right', width: '30%', format: v => formatCurrencyExact(v) },
            ]} />
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8 print-section">
            <div className="w-64">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrencyExact(totals.subtotal)}</span>
                </div>
                {totals.discountAmt > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Discount ({estimate.discountPct}%)</span>
                    <span>− {formatCurrencyExact(totals.discountAmt)}</span>
                  </div>
                )}
                {totals.margin > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Overhead & Margin ({estimate.overheadMarginPct}%)</span>
                    <span>{formatCurrencyExact(totals.margin)}</span>
                  </div>
                )}
                {totals.tax > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax ({estimate.taxPct}%)</span>
                    <span>{formatCurrencyExact(totals.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black text-gray-900 border-t-2 border-gray-900 pt-2">
                  <span>TOTAL</span>
                  <span>{formatCurrencyExact(totals.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          {estimate.termsNotes && (
            <div className="mb-8 border-t border-gray-200 pt-6">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Terms & Conditions</h2>
              <div className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">{estimate.termsNotes}</div>
            </div>
          )}

          {/* Signature block */}
          <div className="border-t border-gray-200 pt-6 print-section">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">Authorization</h2>
            <div className="grid grid-cols-2 gap-12">
              <div>
                <div className="border-b border-gray-400 mb-1 h-8" />
                <div className="text-xs text-gray-500">Client Signature</div>
                <div className="border-b border-gray-300 mt-3 mb-1 h-6" />
                <div className="text-xs text-gray-500">Date</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-2">By signing, you authorize {co.companyName} to perform the work described in this estimate at the stated price. A 50% deposit is required before work begins.</div>
                <div className="mt-4 border-b border-gray-400 mb-1 h-8" />
                <div className="text-xs text-gray-500">{co.companyName} Representative</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
            {co.companyName} · Thank you for your trust
          </div>
        </div>
      </div>
    </div>
  )
}
