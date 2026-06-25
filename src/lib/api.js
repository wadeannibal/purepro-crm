import { supabase } from './supabase'
import { ACTIONS } from '../context/AppReducer'

// ── Load all data from Supabase and reassemble into app state shape ───────────
export async function loadFromSupabase() {
  const [
    { data: clients },
    { data: jobs },
    { data: comms },
    { data: notes },
    { data: photos },
    { data: docs },
    { data: waivers },
    { data: timeLogs },
    { data: equipment },
    // Phase 2
    { data: estimates },
    { data: invoices },
    { data: insuranceRows },
    { data: subs },
    { data: expenses },
    { data: overhead },
  ] = await Promise.all([
    supabase.from('clients').select('*').order('created_at'),
    supabase.from('jobs').select('*').order('created_at'),
    supabase.from('communications').select('*').order('date'),
    supabase.from('job_notes').select('*').order('created_at'),
    supabase.from('job_photos').select('*').order('created_at'),
    supabase.from('job_documents').select('*').order('created_at'),
    supabase.from('job_waivers').select('*'),
    supabase.from('job_time_logs').select('*').order('clock_in'),
    supabase.from('equipment').select('*'),
    // Phase 2
    supabase.from('job_estimates').select('*'),
    supabase.from('job_invoices').select('*'),
    supabase.from('job_insurance').select('*'),
    supabase.from('job_subcontractors').select('*').order('created_at'),
    supabase.from('job_expenses').select('*').order('date'),
    supabase.from('overhead_items').select('*').order('created_at'),
  ])

  const mapEstimate = (e) => e ? ({
    id: e.id,
    status: e.status,
    sentAt: e.sent_at,
    templateId: e.template_id,
    scopeNotes: e.scope_notes ?? '',
    termsNotes: e.terms_notes ?? '',
    sqftItems: e.sqft_items ?? [],
    equipmentItems: e.equipment_items ?? [],
    labItems: e.lab_items ?? [],
    materialItems: e.material_items ?? [],
    laborItems: e.labor_items ?? [],
    xactimateItems: e.xactimate_items ?? [],
    overheadMarginPct: e.overhead_margin_pct ?? 20,
    taxPct: e.tax_pct ?? 0,
    grandTotal: e.grand_total ?? 0,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  }) : null

  const mapInvoice = (inv) => inv ? ({
    id: inv.id,
    estimateId: inv.estimate_id,
    status: inv.status,
    dueDate: inv.due_date,
    amountTotal: inv.amount_total ?? 0,
    payments: inv.payments ?? [],
    createdAt: inv.created_at,
    updatedAt: inv.updated_at,
  }) : null

  const mapInsurance = (ins) => ins ? ({
    company: ins.company ?? '',
    claimNumber: ins.claim_number ?? '',
    adjusterName: ins.adjuster_name ?? '',
    adjusterContact: ins.adjuster_contact ?? '',
    deductible: ins.deductible ?? 0,
    approvedScope: ins.approved_scope ?? 'pending',
    approvedAmount: ins.approved_amount ?? 0,
    notes: ins.notes ?? '',
    updatedAt: ins.updated_at,
  }) : null

  return {
    clients: (clients ?? []).map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      email: c.email ?? '',
      phone: c.phone ?? '',
      address: c.address ?? '',
      isVIP: c.is_vip,
      createdAt: c.created_at,
      notes: c.notes ?? '',
      communications: (comms ?? [])
        .filter(x => x.client_id === c.id)
        .map(x => ({ id: x.id, type: x.type, date: x.date, notes: x.notes ?? '', duration: x.duration, jobId: x.job_id })),
    })),
    jobs: (jobs ?? []).map(j => ({
      id: j.id,
      clientId: j.client_id,
      type: j.type,
      stage: j.stage,
      revenue: j.revenue,
      address: j.address ?? '',
      description: j.description ?? '',
      createdAt: j.created_at,
      updatedAt: j.updated_at,
      checklist: j.checklist ?? {},
      oshaChecklist: j.osha_checklist ?? {},
      notes: (notes ?? []).filter(n => n.job_id === j.id)
        .map(n => ({ id: n.id, text: n.text, createdAt: n.created_at })),
      photos: (photos ?? []).filter(p => p.job_id === j.id)
        .map(p => ({ id: p.id, name: p.name, data: p.storage_path, room: p.room ?? '', photoType: p.photo_type ?? '', createdAt: p.created_at })),
      documents: (docs ?? []).filter(d => d.job_id === j.id)
        .map(d => ({ id: d.id, name: d.name, docType: d.doc_type ?? '', fileType: d.file_type ?? '', data: d.storage_path, createdAt: d.created_at })),
      waivers: (waivers ?? []).filter(w => w.job_id === j.id)
        .map(w => ({ id: w.id, signedBy: w.signed_by, signedDate: w.signed_date, notes: w.notes ?? '' })),
      timeLogs: (timeLogs ?? []).filter(t => t.job_id === j.id)
        .map(t => ({ id: t.id, clockIn: t.clock_in, clockOut: t.clock_out, duration: t.duration, notes: t.notes ?? '' })),
      // Phase 2
      estimate: mapEstimate((estimates ?? []).find(e => e.job_id === j.id)),
      invoice: mapInvoice((invoices ?? []).find(inv => inv.job_id === j.id)),
      insurance: mapInsurance((insuranceRows ?? []).find(ins => ins.job_id === j.id)),
      subcontractors: (subs ?? []).filter(s => s.job_id === j.id)
        .map(s => ({ id: s.id, name: s.name, trade: s.trade ?? '', quotedAmount: s.quoted_amount ?? 0, actualAmount: s.actual_amount ?? 0, paymentStatus: s.payment_status ?? 'unpaid', notes: s.notes ?? '', createdAt: s.created_at })),
      expenses: (expenses ?? []).filter(e => e.job_id === j.id)
        .map(e => ({ id: e.id, date: e.date, category: e.category, amount: e.amount ?? 0, notes: e.notes ?? '', createdAt: e.created_at })),
    })),
    equipment: (equipment ?? []).map(e => ({
      id: e.id,
      name: e.name,
      type: e.type ?? '',
      serialNumber: e.serial_number ?? '',
      jobId: e.job_id,
      placedDate: e.placed_date,
      pickupDate: e.pickup_date,
      status: e.status,
    })),
    overheadItems: (overhead ?? []).map(o => ({
      id: o.id,
      name: o.name,
      amount: o.amount ?? 0,
      createdAt: o.created_at,
    })),
  }
}

// ── Pre-generate IDs before dispatch ─────────────────────────────────────────
const uid = () => crypto.randomUUID()
const ts = () => new Date().toISOString()

export function enrichAction(action) {
  switch (action.type) {
    case ACTIONS.ADD_CLIENT:
      return { ...action, payload: { id: uid(), createdAt: ts(), ...action.payload } }
    case ACTIONS.ADD_JOB:
      return { ...action, payload: { id: uid(), createdAt: ts(), updatedAt: ts(), ...action.payload } }
    case ACTIONS.ADD_JOB_NOTE:
      return { ...action, payload: { ...action.payload, _id: uid(), _createdAt: ts() } }
    case ACTIONS.ADD_PHOTO:
      return { ...action, payload: { ...action.payload, photo: { id: uid(), createdAt: ts(), ...action.payload.photo } } }
    case ACTIONS.ADD_DOCUMENT:
      return { ...action, payload: { ...action.payload, doc: { id: uid(), createdAt: ts(), ...action.payload.doc } } }
    case ACTIONS.ADD_WAIVER:
      return { ...action, payload: { ...action.payload, waiver: { id: uid(), ...action.payload.waiver } } }
    case ACTIONS.ADD_TIME_LOG:
      return { ...action, payload: { ...action.payload, log: { id: uid(), ...action.payload.log } } }
    case ACTIONS.ADD_EQUIPMENT:
      return { ...action, payload: { id: uid(), ...action.payload } }
    case ACTIONS.ADD_COMMUNICATION:
      return { ...action, payload: { ...action.payload, comm: { id: uid(), date: ts(), ...action.payload.comm } } }
    // Phase 2
    case ACTIONS.SAVE_ESTIMATE:
      if (!action.payload.estimate.id) {
        return { ...action, payload: { ...action.payload, estimate: { id: uid(), createdAt: ts(), ...action.payload.estimate } } }
      }
      return action
    case ACTIONS.SAVE_INVOICE:
      if (!action.payload.invoice.id) {
        return { ...action, payload: { ...action.payload, invoice: { id: uid(), createdAt: ts(), ...action.payload.invoice } } }
      }
      return action
    case ACTIONS.ADD_SUBCONTRACTOR:
      return { ...action, payload: { ...action.payload, sub: { id: uid(), createdAt: ts(), ...action.payload.sub } } }
    case ACTIONS.ADD_EXPENSE:
      return { ...action, payload: { ...action.payload, expense: { id: uid(), createdAt: ts(), ...action.payload.expense } } }
    case ACTIONS.ADD_OVERHEAD_ITEM:
      return { ...action, payload: { id: uid(), createdAt: ts(), ...action.payload } }
    case ACTIONS.ADD_PAYMENT:
      return { ...action, payload: { ...action.payload, payment: { id: uid(), ...action.payload.payment } } }
    default:
      return action
  }
}

// ── Sync each action to Supabase ──────────────────────────────────────────────
export async function syncAction(action, preState) {
  const { payload } = action
  try {
    switch (action.type) {

      // ── Phase 1: Clients ──────────────────────────────────
      case ACTIONS.ADD_CLIENT:
        await supabase.from('clients').insert({ id: payload.id, name: payload.name, type: payload.type, email: payload.email || null, phone: payload.phone || null, address: payload.address || null, is_vip: payload.isVIP ?? false, notes: payload.notes || null, created_at: payload.createdAt })
        break
      case ACTIONS.UPDATE_CLIENT:
        await supabase.from('clients').update({ name: payload.name, type: payload.type, email: payload.email || null, phone: payload.phone || null, address: payload.address || null, is_vip: payload.isVIP ?? false, notes: payload.notes || null }).eq('id', payload.id)
        break
      case ACTIONS.DELETE_CLIENT:
        await supabase.from('clients').delete().eq('id', payload.id)
        break
      case ACTIONS.TOGGLE_VIP: {
        const c = preState.clients.find(x => x.id === payload.id)
        if (c) await supabase.from('clients').update({ is_vip: !c.isVIP }).eq('id', payload.id)
        break
      }

      // ── Phase 1: Communications ───────────────────────────
      case ACTIONS.ADD_COMMUNICATION:
        await supabase.from('communications').insert({ id: payload.comm.id, client_id: payload.clientId, type: payload.comm.type, date: payload.comm.date, notes: payload.comm.notes || null, duration: payload.comm.duration || null, job_id: payload.comm.jobId || null })
        break
      case ACTIONS.DELETE_COMMUNICATION:
        await supabase.from('communications').delete().eq('id', payload.commId)
        break

      // ── Phase 1: Jobs ─────────────────────────────────────
      case ACTIONS.ADD_JOB:
        await supabase.from('jobs').insert({ id: payload.id, client_id: payload.clientId || null, type: payload.type, stage: payload.stage, revenue: payload.revenue || 0, address: payload.address || null, description: payload.description || null, checklist: {}, osha_checklist: {}, created_at: payload.createdAt, updated_at: payload.updatedAt })
        break
      case ACTIONS.UPDATE_JOB:
        await supabase.from('jobs').update({ ...(payload.type && { type: payload.type }), ...(payload.stage && { stage: payload.stage }), ...(payload.revenue !== undefined && { revenue: payload.revenue }), ...(payload.address !== undefined && { address: payload.address }), ...(payload.description !== undefined && { description: payload.description }), updated_at: ts() }).eq('id', payload.id)
        break
      case ACTIONS.DELETE_JOB:
        await supabase.from('jobs').delete().eq('id', payload.id)
        break

      case ACTIONS.ADD_JOB_NOTE:
        await supabase.from('job_notes').insert({ id: payload._id, job_id: payload.jobId, text: payload.text, created_at: payload._createdAt })
        break

      case ACTIONS.UPDATE_CHECKLIST_ITEM: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job) await supabase.from('jobs').update({ checklist: { ...(job.checklist ?? {}), [payload.item]: payload.checked }, updated_at: ts() }).eq('id', payload.jobId)
        break
      }
      case ACTIONS.UPDATE_OSHA_ITEM: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job) await supabase.from('jobs').update({ osha_checklist: { ...(job.oshaChecklist ?? {}), [payload.item]: payload.checked }, updated_at: ts() }).eq('id', payload.jobId)
        break
      }

      case ACTIONS.ADD_PHOTO:
        await supabase.from('job_photos').insert({ id: payload.photo.id, job_id: payload.jobId, name: payload.photo.name, storage_path: payload.photo.data, room: payload.photo.room || null, photo_type: payload.photo.photoType || null, created_at: payload.photo.createdAt })
        break
      case ACTIONS.DELETE_PHOTO:
        await supabase.from('job_photos').delete().eq('id', payload.photoId)
        break

      case ACTIONS.ADD_DOCUMENT:
        await supabase.from('job_documents').insert({ id: payload.doc.id, job_id: payload.jobId, name: payload.doc.name, doc_type: payload.doc.docType || null, file_type: payload.doc.fileType || null, storage_path: payload.doc.data, created_at: payload.doc.createdAt })
        break
      case ACTIONS.DELETE_DOCUMENT:
        await supabase.from('job_documents').delete().eq('id', payload.docId)
        break

      case ACTIONS.ADD_WAIVER:
        await supabase.from('job_waivers').insert({ id: payload.waiver.id, job_id: payload.jobId, signed_by: payload.waiver.signedBy, signed_date: payload.waiver.signedDate || null, notes: payload.waiver.notes || null })
        break
      case ACTIONS.DELETE_WAIVER:
        await supabase.from('job_waivers').delete().eq('id', payload.waiverId)
        break

      case ACTIONS.ADD_TIME_LOG:
        await supabase.from('job_time_logs').insert({ id: payload.log.id, job_id: payload.jobId, clock_in: payload.log.clockIn, clock_out: payload.log.clockOut || null, duration: payload.log.duration || null, notes: payload.log.notes || null })
        break
      case ACTIONS.UPDATE_TIME_LOG:
        await supabase.from('job_time_logs').update({ clock_out: payload.updates.clockOut, duration: payload.updates.duration, notes: payload.updates.notes }).eq('id', payload.logId)
        break
      case ACTIONS.DELETE_TIME_LOG:
        await supabase.from('job_time_logs').delete().eq('id', payload.logId)
        break

      case ACTIONS.ADD_EQUIPMENT:
        await supabase.from('equipment').insert({ id: payload.id, name: payload.name, type: payload.type || null, serial_number: payload.serialNumber || null, job_id: payload.jobId || null, placed_date: payload.placedDate || null, pickup_date: payload.pickupDate || null, status: payload.status || 'available' })
        break
      case ACTIONS.UPDATE_EQUIPMENT:
        await supabase.from('equipment').update({ name: payload.name, type: payload.type || null, serial_number: payload.serialNumber || null, job_id: payload.jobId || null, placed_date: payload.placedDate || null, pickup_date: payload.pickupDate || null, status: payload.status }).eq('id', payload.id)
        break
      case ACTIONS.DELETE_EQUIPMENT:
        await supabase.from('equipment').delete().eq('id', payload.id)
        break

      // ── Phase 2: Estimates ────────────────────────────────
      case ACTIONS.SAVE_ESTIMATE: {
        const est = payload.estimate
        await supabase.from('job_estimates').upsert({
          id: est.id,
          job_id: payload.jobId,
          status: est.status,
          sent_at: est.sentAt || null,
          template_id: est.templateId || null,
          scope_notes: est.scopeNotes || '',
          terms_notes: est.termsNotes || '',
          sqft_items: est.sqftItems ?? [],
          equipment_items: est.equipmentItems ?? [],
          lab_items: est.labItems ?? [],
          material_items: est.materialItems ?? [],
          labor_items: est.laborItems ?? [],
          xactimate_items: est.xactimateItems ?? [],
          overhead_margin_pct: est.overheadMarginPct ?? 20,
          tax_pct: est.taxPct ?? 0,
          grand_total: est.grandTotal ?? 0,
          updated_at: ts(),
        })
        break
      }
      case ACTIONS.UPDATE_ESTIMATE_STATUS: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job?.estimate) {
          await supabase.from('job_estimates').update({ status: payload.status, sent_at: payload.sentAt || job.estimate.sentAt || null, updated_at: ts() }).eq('id', job.estimate.id)
        }
        break
      }

      // ── Phase 2: Invoices ─────────────────────────────────
      case ACTIONS.SAVE_INVOICE: {
        const inv = payload.invoice
        await supabase.from('job_invoices').upsert({
          id: inv.id,
          job_id: payload.jobId,
          estimate_id: inv.estimateId || null,
          status: inv.status,
          due_date: inv.dueDate || null,
          amount_total: inv.amountTotal ?? 0,
          payments: inv.payments ?? [],
          updated_at: ts(),
        })
        break
      }
      case ACTIONS.UPDATE_INVOICE_STATUS: {
        const j2 = preState.jobs.find(j => j.id === payload.jobId)
        if (j2?.invoice) await supabase.from('job_invoices').update({ status: payload.status, updated_at: ts() }).eq('id', j2.invoice.id)
        break
      }
      case ACTIONS.ADD_PAYMENT:
      case ACTIONS.DELETE_PAYMENT: {
        const j3 = preState.jobs.find(j => j.id === payload.jobId)
        if (j3?.invoice) {
          const updatedPayments = action.type === ACTIONS.ADD_PAYMENT
            ? [...(j3.invoice.payments ?? []), { id: payload.payment.id, ...payload.payment }]
            : (j3.invoice.payments ?? []).filter(p => p.id !== payload.paymentId)
          await supabase.from('job_invoices').update({ payments: updatedPayments, updated_at: ts() }).eq('id', j3.invoice.id)
        }
        break
      }

      // ── Phase 2: Insurance ────────────────────────────────
      case ACTIONS.UPDATE_INSURANCE:
        await supabase.from('job_insurance').upsert({
          job_id: payload.jobId,
          company: payload.insurance.company || '',
          claim_number: payload.insurance.claimNumber || '',
          adjuster_name: payload.insurance.adjusterName || '',
          adjuster_contact: payload.insurance.adjusterContact || '',
          deductible: payload.insurance.deductible || 0,
          approved_scope: payload.insurance.approvedScope || 'pending',
          approved_amount: payload.insurance.approvedAmount || 0,
          notes: payload.insurance.notes || '',
          updated_at: ts(),
        }, { onConflict: 'job_id' })
        break

      // ── Phase 2: Subcontractors ───────────────────────────
      case ACTIONS.ADD_SUBCONTRACTOR:
        await supabase.from('job_subcontractors').insert({
          id: payload.sub.id,
          job_id: payload.jobId,
          name: payload.sub.name,
          trade: payload.sub.trade || null,
          quoted_amount: payload.sub.quotedAmount || 0,
          actual_amount: payload.sub.actualAmount || 0,
          payment_status: payload.sub.paymentStatus || 'unpaid',
          notes: payload.sub.notes || null,
        })
        break
      case ACTIONS.UPDATE_SUBCONTRACTOR:
        await supabase.from('job_subcontractors').update({
          name: payload.sub.name,
          trade: payload.sub.trade || null,
          quoted_amount: payload.sub.quotedAmount || 0,
          actual_amount: payload.sub.actualAmount || 0,
          payment_status: payload.sub.paymentStatus || 'unpaid',
          notes: payload.sub.notes || null,
        }).eq('id', payload.sub.id)
        break
      case ACTIONS.DELETE_SUBCONTRACTOR:
        await supabase.from('job_subcontractors').delete().eq('id', payload.subId)
        break

      // ── Phase 2: Expenses ─────────────────────────────────
      case ACTIONS.ADD_EXPENSE:
        await supabase.from('job_expenses').insert({
          id: payload.expense.id,
          job_id: payload.jobId,
          date: payload.expense.date,
          category: payload.expense.category,
          amount: payload.expense.amount,
          notes: payload.expense.notes || null,
        })
        break
      case ACTIONS.UPDATE_EXPENSE:
        await supabase.from('job_expenses').update({
          date: payload.expense.date,
          category: payload.expense.category,
          amount: payload.expense.amount,
          notes: payload.expense.notes || null,
        }).eq('id', payload.expense.id)
        break
      case ACTIONS.DELETE_EXPENSE:
        await supabase.from('job_expenses').delete().eq('id', payload.expenseId)
        break

      // ── Phase 2: Overhead ─────────────────────────────────
      case ACTIONS.ADD_OVERHEAD_ITEM:
        await supabase.from('overhead_items').insert({ id: payload.id, name: payload.name, amount: payload.amount })
        break
      case ACTIONS.UPDATE_OVERHEAD_ITEM:
        await supabase.from('overhead_items').update({ name: payload.name, amount: payload.amount }).eq('id', payload.id)
        break
      case ACTIONS.DELETE_OVERHEAD_ITEM:
        await supabase.from('overhead_items').delete().eq('id', payload.id)
        break
    }
  } catch (err) {
    console.error('Supabase sync error:', action.type, err.message)
  }
}
