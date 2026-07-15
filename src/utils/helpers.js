export const JOB_STAGES = [
  'Lead', 'Inspection', 'Estimate Sent', 'Approved',
  'Remediation', 'Post-Test', 'Invoiced', 'Closed', 'Lost',
]

export const JOB_TYPES = ['Mold', 'Water', 'Fire']

export const CLIENT_TYPES = ['Homeowner', 'Property Manager', 'Insurance Adjuster', 'Real Estate Agent']

export const COMM_TYPES = ['Call', 'Text', 'Email', 'In Person']

export const EQUIPMENT_TYPES = ['Air Scrubber', 'Dehumidifier', 'Air Mover', 'Measurement', 'PPE', 'Other']

export const DOC_TYPES = ['Lab Report', 'ERMI Result', 'Contract', 'Scope of Work', 'Invoice', 'Clearance Letter', 'Other']

export const PHOTO_TYPES = ['Before', 'During', 'After', 'Damage', 'Equipment', 'Other']

export const MOLD_CHECKLIST = [
  'Moisture readings taken',
  'Containment barriers set up',
  'Negative air pressure established',
  'HEPA air scrubber running',
  'PPE requirements verified',
  'Affected materials removed',
  'Surface cleaning completed',
  'Post-remediation inspection done',
  'ERMI/clearance test ordered',
  'Clearance test passed',
  'Area reconstructed/repaired',
  'Final documentation completed',
]

export const WATER_CHECKLIST = [
  'Water source identified and stopped',
  'Moisture mapping completed',
  'Extraction completed',
  'Drying equipment placed',
  'Daily moisture readings logged',
  'Equipment monitored and adjusted',
  'Drying goal achieved',
  'Equipment removed',
  'Final moisture reading documented',
  'Damage assessment for reconstruction',
]

export const FIRE_CHECKLIST = [
  'Safety assessment completed',
  'Utilities shut off / verified safe',
  'Structural integrity assessed',
  'Demolition of unsalvageable materials',
  'Soot and smoke cleaning initiated',
  'Odor treatment applied',
  'HVAC cleaning completed',
  'Content cleaning / pack-out',
  'Reconstruction scope finalized',
  'Final documentation completed',
]

export const OSHA_CHECKLIST = [
  'Workers in full PPE (N95 or better)',
  'Containment zone established',
  'Negative air pressure confirmed',
  'Safety signage posted',
  'Chemical hazard communication posted',
  'Emergency exit plan in place',
  'First aid kit accessible on site',
  'Daily safety briefing completed',
]

export const getChecklistForJobType = (type) => {
  if (type === 'Mold') return MOLD_CHECKLIST
  if (type === 'Water') return WATER_CHECKLIST
  if (type === 'Fire') return FIRE_CHECKLIST
  return []
}

export const formatCurrency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0)

export const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatDateTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export const formatDuration = (minutes) => {
  if (!minutes) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export const jobTypeColor = (type) => {
  if (type === 'Mold') return 'bg-green-100 text-green-800'
  if (type === 'Water') return 'bg-blue-100 text-blue-800'
  if (type === 'Fire') return 'bg-orange-100 text-orange-800'
  return 'bg-gray-100 text-gray-700'
}

export const stageColor = (stage) => {
  const map = {
    Lead: 'bg-gray-100 text-gray-700',
    Inspection: 'bg-yellow-100 text-yellow-800',
    'Estimate Sent': 'bg-blue-100 text-blue-800',
    Approved: 'bg-purple-100 text-purple-800',
    Remediation: 'bg-red-100 text-red-700',
    'Post-Test': 'bg-indigo-100 text-indigo-800',
    Invoiced: 'bg-orange-100 text-orange-800',
    Closed: 'bg-green-100 text-green-800',
    Lost: 'bg-red-200 text-red-900',
  }
  return map[stage] ?? 'bg-gray-100 text-gray-700'
}

export const clientTypeColor = (type) => {
  const map = {
    Homeowner: 'bg-red-50 text-red-700',
    'Property Manager': 'bg-blue-50 text-blue-700',
    'Insurance Adjuster': 'bg-purple-50 text-purple-700',
    'Real Estate Agent': 'bg-green-50 text-green-700',
  }
  return map[type] ?? 'bg-gray-100 text-gray-700'
}

export const speedToLead = (clientCreatedAt, communications) => {
  if (!communications || communications.length === 0) return null
  const first = [...communications].sort((a, b) => new Date(a.date) - new Date(b.date))[0]
  const diff = new Date(first.date) - new Date(clientCreatedAt)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

export const totalJobHours = (timeLogs) =>
  (timeLogs ?? []).reduce((sum, t) => sum + (t.duration ?? 0), 0)

// ── Phase 2 helpers ──────────────────────────────────────────────────────────

export const computeEstimateTotals = (estimate) => {
  if (!estimate) return { subtotal: 0, margin: 0, tax: 0, grandTotal: 0, sqftTotal: 0, equipTotal: 0, labTotal: 0, matTotal: 0, laborTotal: 0, xactTotal: 0, flatTotal: 0 }
  let subtotal = 0
  if (estimate.lineItems) {
    subtotal = (estimate.lineItems ?? []).reduce((s, i) => s + ((i.qty ?? 0) * (i.unitPrice ?? 0)), 0)
  } else {
    const sqftTotal = (estimate.sqftItems ?? []).reduce((s, i) => s + ((i.sqft ?? 0) * (i.ratePerSqft ?? 0)), 0)
    const equipTotal = (estimate.equipmentItems ?? []).reduce((s, i) => s + ((i.qty ?? 0) * (i.unitPrice ?? 0)), 0)
    const labTotal = (estimate.labItems ?? []).reduce((s, i) => s + ((i.qty ?? 0) * (i.unitPrice ?? 0)), 0)
    const matTotal = (estimate.materialItems ?? []).reduce((s, i) => s + ((i.qty ?? 0) * (i.unitPrice ?? 0)), 0)
    const laborTotal = (estimate.laborItems ?? []).reduce((s, i) => s + ((i.hours ?? 0) * (i.ratePerHour ?? 0)), 0)
    const xactTotal = (estimate.xactimateItems ?? []).reduce((s, i) => s + ((i.qty ?? 0) * (i.unitPrice ?? 0)), 0)
    const flatTotal = (estimate.flatFeeItems ?? []).reduce((s, i) => s + (i.amount ?? 0), 0)
    subtotal = sqftTotal + equipTotal + labTotal + matTotal + laborTotal + xactTotal + flatTotal
  }
  const margin = subtotal * ((estimate.overheadMarginPct ?? 0) / 100)
  const afterMargin = subtotal + margin
  const tax = afterMargin * ((estimate.taxPct ?? 0) / 100)
  const grandTotal = afterMargin + tax
  return { subtotal, margin, tax, grandTotal, sqftTotal: 0, equipTotal: 0, labTotal: 0, matTotal: 0, laborTotal: 0, xactTotal: 0, flatTotal: 0 }
}

export const computeActualCosts = (job) => {
  const laborCost = (job.timeLogs ?? []).reduce((s, t) => s + ((t.duration ?? 0) / 60 * 75), 0)
  const expenseCost = (job.expenses ?? []).reduce((s, e) => s + (e.amount ?? 0), 0)
  const subCost = (job.subcontractors ?? []).reduce((s, sub) => s + (sub.actualAmount ?? 0), 0)
  return { laborCost, expenseCost, subCost, total: laborCost + expenseCost + subCost }
}

export const invoiceBalance = (invoice) => {
  if (!invoice) return { paid: 0, balance: 0 }
  const paid = (invoice.payments ?? []).reduce((s, p) => s + (p.amount ?? 0), 0)
  return { paid, balance: (invoice.amountTotal ?? 0) - paid }
}

export const isInvoiceOverdue = (invoice) => {
  if (!invoice || invoice.status === 'Paid') return false
  if (!invoice.dueDate) return false
  return new Date(invoice.dueDate) < new Date()
}

export const formatCurrencyExact = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0)

export const invoiceStatusColor = (status) => {
  const map = {
    Draft: 'bg-gray-100 text-gray-700',
    Sent: 'bg-blue-100 text-blue-700',
    Partial: 'bg-yellow-100 text-yellow-800',
    Paid: 'bg-green-100 text-green-800',
    Overdue: 'bg-red-100 text-red-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-700'
}

export const estimateStatusColor = (status) => {
  const map = {
    Draft: 'bg-gray-100 text-gray-600',
    Sent: 'bg-blue-100 text-blue-700',
    Approved: 'bg-green-100 text-green-800',
    Declined: 'bg-red-100 text-red-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

export const LEAD_SOURCES = [
  'Google Search', 'Google Maps', 'Referral', 'Instagram', 'Facebook',
  'Door Knock', 'Cold Call', 'Repeat Client', 'Insurance Referral',
  'Real Estate Referral', 'Other',
]

export const LOSS_REASONS = [
  'Price too high', 'Went with competitor', 'Unresponsive / ghosted',
  'No longer needed service', 'Insurance denied', 'Timing', 'Other',
]

export const PARTNER_TYPES = [
  'Plumber', 'Water Mitigation Crew', 'Real Estate Agent', 'Insurance Adjuster',
  'Public Adjuster', 'Property Manager', 'Functional Medicine / CIRS Doctor',
]

export const STAGE_CLOSE_DAYS = {
  Lead: 30, Inspection: 21, 'Estimate Sent': 14, Approved: 7,
  Remediation: 14, 'Post-Test': 7, Invoiced: 14,
}
export const STAGE_PROBABILITY = {
  Lead: 0.20, Inspection: 0.50, 'Estimate Sent': 0.65, Approved: 0.85,
  Remediation: 0.90, 'Post-Test': 0.95, Invoiced: 1.0,
}
