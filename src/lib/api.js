import { supabase } from './supabase'
import { ACTIONS } from '../context/AppReducer'

// ── Load all data from Supabase ───────────────────────────────────────────────
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
    // Phase 3 — templates + events
    { data: templateRows },
    { data: eventRows },
    // Phase 4
    { data: partnerRows },
    { data: scriptRows },
    { data: objectionRows },
    { data: competitorRows },
    // Phase 5
    { data: certRows },
    { data: inventoryRows },
    { data: docRows },
    { data: employeeRows },
    { data: kpiRows },
    { data: reviewRow },
    { data: gbpRow },
    // Remote signing
    { data: sigReqRows },
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
    // Phase 3 — templates + events
    supabase.from('proposal_templates').select('*').order('created_at'),
    supabase.from('events').select('*').order('date'),
    // Phase 4
    supabase.from('partners').select('*').order('created_at'),
    supabase.from('outreach_scripts').select('*').order('created_at'),
    supabase.from('objections').select('*').order('created_at'),
    supabase.from('competitors').select('*').order('created_at'),
    // Phase 5
    supabase.from('certifications').select('*').order('created_at'),
    supabase.from('inventory_items').select('*').order('created_at'),
    supabase.from('internal_docs').select('*').order('created_at'),
    supabase.from('employees').select('*').order('created_at'),
    supabase.from('kpi_goals').select('*'),
    supabase.from('review_tracker').select('*').eq('id', 'singleton').maybeSingle(),
    supabase.from('gbp_checklist').select('*').eq('id', 'singleton').maybeSingle(),
    supabase.from('signature_requests').select('*').order('created_at'),
  ])

  const mapEstimate = (e) => e ? ({
    id: e.id,
    status: e.status,
    sentAt: e.sent_at,
    templateId: e.template_id,
    scopeNotes: e.scope_notes ?? '',
    termsNotes: e.terms_notes ?? '',
    lineItems: e.line_items?.length > 0 ? e.line_items : null,
    discountPct: e.discount_pct ?? 0,
    sqftItems: e.sqft_items ?? [],
    equipmentItems: e.equipment_items ?? [],
    labItems: e.lab_items ?? [],
    materialItems: e.material_items ?? [],
    laborItems: e.labor_items ?? [],
    xactimateItems: e.xactimate_items ?? [],
    flatFeeItems: e.flat_fee_items ?? [],
    overheadMarginPct: e.overhead_margin_pct ?? 25,
    taxPct: e.tax_pct ?? 0,
    grandTotal: e.grand_total ?? 0,
    followUpCount: e.follow_up_count ?? 0,
    lastFollowUpAt: e.last_follow_up_at ?? null,
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
      archived: j.archived ?? false,
      address: j.address ?? '',
      description: j.description ?? '',
      createdAt: j.created_at,
      updatedAt: j.updated_at,
      checklist: j.checklist ?? {},
      oshaChecklist: j.osha_checklist ?? {},
      notes: (notes ?? []).filter(n => n.job_id === j.id)
        .map(n => ({ id: n.id, text: n.text, createdAt: n.created_at })),
      photos: (photos ?? []).filter(p => p.job_id === j.id)
        .map(p => ({ id: p.id, name: p.name, data: p.storage_path, room: p.room ?? '', photoType: p.photo_type ?? '', createdAt: p.created_at, isShowcase: p.is_showcase ?? false })),
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
      // Phase 3 per-job
      moistureReadings: j.moisture_readings ?? [],
      dryingLog: j.drying_log ?? [],
      portal: j.portal ?? null,
      signatures: j.signatures ?? [],
      survey: j.survey ?? null,
      referralAsk: j.referral_ask ?? null,
      reviewRequest: j.review_request ?? null,
      warranty: j.warranty ?? null,
      annualCheckIn: j.annual_check_in ?? null,
      // Phase 4 per-job
      leadSource: j.lead_source ?? null,
      leadSourcePartnerId: j.lead_source_partner_id ?? null,
      lostReason: j.lost_reason ?? null,
      lostCompetitor: j.lost_competitor ?? null,
      firstContactDate: j.first_contact_date ?? null,
      lastContactDate: j.last_contact_date ?? null,
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

    // Phase 3 — showcase derived from photos
    showcasePhotos: Object.fromEntries(
      (photos ?? []).filter(p => p.is_showcase).map(p => [p.id, true])
    ),

    // Phase 3 — proposal templates (only if Supabase has them; lets INIT_TEMPLATES seed if empty)
    ...((templateRows ?? []).length > 0 ? {
      proposalTemplates: templateRows.map(t => ({
        id: t.id, name: t.name, jobType: t.job_type,
        description: t.description ?? '', scopeNotes: t.scope_notes ?? '',
        termsNotes: t.terms_notes ?? '', lineItems: t.line_items ?? [],
        createdAt: t.created_at, updatedAt: t.updated_at,
      })),
    } : {}),

    // Phase 3 — events
    events: (eventRows ?? []).map(e => ({
      id: e.id, date: e.date, startTime: e.start_time, endTime: e.end_time,
      eventType: e.event_type, jobId: e.job_id, notes: e.notes ?? '',
      confirmationSent: e.confirmation_sent ?? false,
      confirmationSentAt: e.confirmation_sent_at,
      reminderSent: e.reminder_sent ?? false,
      reminderSentAt: e.reminder_sent_at,
      createdAt: e.created_at,
    })),

    // Phase 4 — partners
    partners: (partnerRows ?? []).map(p => ({
      id: p.id, name: p.name, company: p.company ?? '',
      partnerType: p.type ?? '',
      temperature: p.temperature ?? 'cold',
      priority: p.priority ?? 3,
      phone: p.phone ?? '', email: p.email ?? '', website: p.website ?? '', address: p.address ?? '', notes: p.notes ?? '',
      lastContactDate: p.last_contact_date,
      contactHistory: p.contact_history ?? [],
      deals: p.deals ?? [],
      createdAt: p.created_at,
    })),

    // Phase 4 — scripts (only if Supabase has them; lets INIT_SCRIPTS seed if empty)
    ...((scriptRows ?? []).length > 0 ? {
      scripts: scriptRows.map(s => ({
        id: s.id, title: s.title, type: s.type, body: s.body ?? '',
        isCustom: s.is_custom, sentHistory: s.sent_history ?? [],
        createdAt: s.created_at,
      })),
    } : {}),

    // Phase 4 — objections (only if Supabase has them; lets INIT_OBJECTIONS seed if empty)
    ...((objectionRows ?? []).length > 0 ? {
      objections: objectionRows.map(o => ({
        id: o.id, objection: o.objection, responses: o.responses ?? [],
        category: o.category ?? '', isCustom: o.is_custom,
        createdAt: o.created_at,
      })),
    } : {}),

    // Phase 4 — competitors
    competitors: (competitorRows ?? []).map(c => ({
      id: c.id, name: c.name, notes: c.notes ?? '',
      strengths: c.strengths ?? '', weaknesses: c.weaknesses ?? '',
      talkingPoints: c.talking_points ?? [],
      createdAt: c.created_at,
    })),

    // Phase 5 — certifications
    certifications: (certRows ?? []).map(c => ({
      id: c.id, name: c.name, holder: c.holder ?? '',
      issuingBody: c.issuing_body ?? '', certNumber: c.cert_number ?? '',
      issueDate: c.issue_date ?? '', expiryDate: c.expiry_date ?? '',
      createdAt: c.created_at,
    })),

    // Phase 5 — inventory
    inventory: (inventoryRows ?? []).map(i => ({
      id: i.id, name: i.name, category: i.category ?? '', unit: i.unit ?? '',
      qty: i.qty ?? 0, threshold: i.threshold ?? 0, costPerUnit: i.cost_per_unit ?? 0,
      supplier: i.supplier ?? '', createdAt: i.created_at,
    })),

    // Phase 5 — internal docs (only if Supabase has them; lets INIT_INTERNAL_DOCS seed if empty)
    ...((docRows ?? []).length > 0 ? {
      internalDocs: docRows.map(d => ({
        id: d.id, title: d.title, category: d.category ?? '',
        content: d.content ?? '', createdAt: d.created_at, updatedAt: d.updated_at,
      })),
    } : {}),

    // Phase 5 — employees
    employees: (employeeRows ?? []).map(e => ({
      id: e.id, name: e.name, role: e.role ?? '',
      email: e.email ?? '', phone: e.phone ?? '', startDate: e.start_date ?? '',
      onboardingItems: e.onboarding_items ?? {},
      createdAt: e.created_at,
    })),

    // Phase 5 — KPI goals keyed by month
    kpiGoals: Object.fromEntries((kpiRows ?? []).map(r => [r.month, r.goals])),

    // Phase 5 — review tracker
    ...(reviewRow ? { reviewTracker: reviewRow.data } : {}),

    // Phase 5 — GBP checklist
    ...(gbpRow ? { gbpChecklist: gbpRow.data } : {}),

    // Remote signing requests
    signatureRequests: (sigReqRows ?? []).map(r => ({
      id: r.id,
      jobId: r.job_id,
      title: r.title,
      documentName: r.document_name,
      documentData: r.document_data,
      fields: r.fields ?? [],
      signerName: r.signer_name ?? '',
      signerEmail: r.signer_email ?? '',
      status: r.status,
      token: r.token,
      createdAt: r.created_at,
      signedAt: r.signed_at,
      signerIp: r.signer_ip ?? '',
      signedFields: r.signed_fields ?? [],
    })),
  }
}

// ── Pre-generate IDs before dispatch ─────────────────────────────────────────
const uid = () => crypto.randomUUID()
const ts = () => new Date().toISOString()

export function enrichAction(action) {
  switch (action.type) {
    // Phase 1
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
    // Phase 3 — per-job arrays
    case ACTIONS.ADD_MOISTURE_READING:
      return { ...action, payload: { ...action.payload, reading: { id: uid(), createdAt: ts(), ...action.payload.reading } } }
    case ACTIONS.ADD_DRYING_ENTRY:
      return { ...action, payload: { ...action.payload, entry: { id: uid(), createdAt: ts(), ...action.payload.entry } } }
    case ACTIONS.ADD_SIGNATURE_REQUEST:
      return { ...action, payload: { ...action.payload, request: { id: uid(), createdAt: ts(), status: 'pending', ...action.payload.request } } }
    case ACTIONS.ADD_WARRANTY_CLAIM:
      return { ...action, payload: { ...action.payload, claim: { id: uid(), reportedAt: ts(), status: 'open', ...action.payload.claim } } }
    // Phase 3 — events
    case ACTIONS.ADD_EVENT:
      return { ...action, payload: { id: uid(), createdAt: ts(), ...action.payload } }
    // Phase 4
    case ACTIONS.ADD_PARTNER:
      return { ...action, payload: { id: uid(), createdAt: ts(), contactHistory: [], deals: [], ...action.payload } }
    case ACTIONS.ADD_PARTNER_CONTACT:
      return { ...action, payload: { ...action.payload, contact: { id: uid(), date: ts(), ...action.payload.contact } } }
    case ACTIONS.ADD_PARTNER_DEAL:
      return { ...action, payload: { ...action.payload, deal: { id: uid(), createdAt: ts(), status: 'active', jobsSent: 0, jobsReceived: 0, ...action.payload.deal } } }
    case ACTIONS.ADD_SCRIPT:
      return { ...action, payload: { id: uid(), createdAt: ts(), isCustom: true, sentHistory: [], ...action.payload } }
    case ACTIONS.ADD_OBJECTION:
      return { ...action, payload: { id: uid(), createdAt: ts(), isCustom: true, ...action.payload } }
    case ACTIONS.ADD_COMPETITOR:
      return { ...action, payload: { id: uid(), createdAt: ts(), talkingPoints: [], ...action.payload } }
    // Phase 5
    case ACTIONS.ADD_CERTIFICATION:
      return { ...action, payload: { id: uid(), createdAt: ts(), ...action.payload } }
    case ACTIONS.ADD_INVENTORY:
      return { ...action, payload: { id: uid(), createdAt: ts(), ...action.payload } }
    case ACTIONS.ADD_INTERNAL_DOC:
      return { ...action, payload: { id: uid(), createdAt: ts(), updatedAt: ts(), ...action.payload } }
    case ACTIONS.ADD_EMPLOYEE:
      return { ...action, payload: { id: uid(), createdAt: ts(), onboardingItems: {}, ...action.payload } }
    default:
      return action
  }
}

// ── Sync each action to Supabase ──────────────────────────────────────────────
export async function syncAction(action, preState) {
  const { payload } = action
  try {
    switch (action.type) {

      // ── Phase 1: Clients ──────────────────────────────────────────────────
      case ACTIONS.ADD_CLIENT:
        await supabase.from('clients').insert({ id: payload.id, name: payload.name, type: payload.type, email: payload.email || null, phone: payload.phone || null, address: payload.address || null, is_vip: payload.isVIP ?? false, notes: payload.notes || null, created_at: payload.createdAt })
        break
      case ACTIONS.UPDATE_CLIENT:
        await supabase.from('clients').update({ name: payload.name, type: payload.type, email: payload.email || null, phone: payload.phone || null, address: payload.address || null, is_vip: payload.isVIP ?? false, notes: payload.notes || null }).eq('id', payload.id)
        break
      case ACTIONS.DELETE_CLIENT: {
        const linkedJobIds = (preState.jobs ?? []).filter(j => j.clientId === payload.id).map(j => j.id)
        if (linkedJobIds.length > 0) {
          await Promise.all([
            supabase.from('job_notes').delete().in('job_id', linkedJobIds),
            supabase.from('job_photos').delete().in('job_id', linkedJobIds),
            supabase.from('job_documents').delete().in('job_id', linkedJobIds),
            supabase.from('job_waivers').delete().in('job_id', linkedJobIds),
            supabase.from('job_time_logs').delete().in('job_id', linkedJobIds),
            supabase.from('job_estimates').delete().in('job_id', linkedJobIds),
            supabase.from('job_invoices').delete().in('job_id', linkedJobIds),
            supabase.from('job_insurance').delete().in('job_id', linkedJobIds),
            supabase.from('job_subcontractors').delete().in('job_id', linkedJobIds),
            supabase.from('job_expenses').delete().in('job_id', linkedJobIds),
            supabase.from('events').delete().in('job_id', linkedJobIds),
            supabase.from('signature_requests').delete().in('job_id', linkedJobIds),
            supabase.from('equipment').update({ job_id: null }).in('job_id', linkedJobIds),
          ])
          await supabase.from('jobs').delete().in('id', linkedJobIds)
        }
        await supabase.from('communications').delete().eq('client_id', payload.id)
        await supabase.from('clients').delete().eq('id', payload.id)
        break
      }
      case ACTIONS.TOGGLE_VIP: {
        const c = preState.clients.find(x => x.id === payload.id)
        if (c) await supabase.from('clients').update({ is_vip: !c.isVIP }).eq('id', payload.id)
        break
      }

      // ── Phase 1: Communications ───────────────────────────────────────────
      case ACTIONS.ADD_COMMUNICATION:
        await supabase.from('communications').insert({ id: payload.comm.id, client_id: payload.clientId, type: payload.comm.type, date: payload.comm.date, notes: payload.comm.notes || null, duration: payload.comm.duration || null, job_id: payload.comm.jobId || null })
        break
      case ACTIONS.DELETE_COMMUNICATION:
        await supabase.from('communications').delete().eq('id', payload.commId)
        break

      // ── Phase 1: Jobs ─────────────────────────────────────────────────────
      case ACTIONS.ADD_JOB:
        await supabase.from('jobs').insert({
          id: payload.id, client_id: payload.clientId || null, type: payload.type,
          stage: payload.stage, revenue: payload.revenue || 0,
          address: payload.address || null, description: payload.description || null,
          checklist: {}, osha_checklist: {},
          moisture_readings: [], drying_log: [], signatures: [],
          lead_source: payload.leadSource ?? null,
          lead_source_partner_id: payload.leadSourcePartnerId ?? null,
          first_contact_date: payload.firstContactDate ?? ts(),
          last_contact_date: payload.lastContactDate ?? ts(),
          created_at: payload.createdAt, updated_at: payload.updatedAt,
        })
        break
      case ACTIONS.UPDATE_JOB:
        await supabase.from('jobs').update({
          ...(payload.type !== undefined && { type: payload.type }),
          ...(payload.stage !== undefined && { stage: payload.stage }),
          ...(payload.revenue !== undefined && { revenue: payload.revenue }),
          ...(payload.address !== undefined && { address: payload.address }),
          ...(payload.description !== undefined && { description: payload.description }),
          ...(payload.clientId !== undefined && { client_id: payload.clientId }),
          ...(payload.leadSource !== undefined && { lead_source: payload.leadSource }),
          ...(payload.leadSourcePartnerId !== undefined && { lead_source_partner_id: payload.leadSourcePartnerId }),
          ...(payload.lostReason !== undefined && { lost_reason: payload.lostReason }),
          ...(payload.lostCompetitor !== undefined && { lost_competitor: payload.lostCompetitor }),
          ...(payload.firstContactDate !== undefined && { first_contact_date: payload.firstContactDate }),
          ...(payload.lastContactDate !== undefined && { last_contact_date: payload.lastContactDate }),
          updated_at: ts(),
        }).eq('id', payload.id)
        break
      case ACTIONS.DELETE_JOB: {
        const jobId = payload.id
        await Promise.all([
          supabase.from('job_notes').delete().eq('job_id', jobId),
          supabase.from('job_photos').delete().eq('job_id', jobId),
          supabase.from('job_documents').delete().eq('job_id', jobId),
          supabase.from('job_waivers').delete().eq('job_id', jobId),
          supabase.from('job_time_logs').delete().eq('job_id', jobId),
          supabase.from('job_estimates').delete().eq('job_id', jobId),
          supabase.from('job_invoices').delete().eq('job_id', jobId),
          supabase.from('job_insurance').delete().eq('job_id', jobId),
          supabase.from('job_subcontractors').delete().eq('job_id', jobId),
          supabase.from('job_expenses').delete().eq('job_id', jobId),
          supabase.from('events').delete().eq('job_id', jobId),
          supabase.from('signature_requests').delete().eq('job_id', jobId),
          supabase.from('equipment').update({ job_id: null }).eq('job_id', jobId),
        ])
        await supabase.from('jobs').delete().eq('id', jobId)
        break
      }

      case ACTIONS.ADD_JOB_NOTE:
        await supabase.from('job_notes').insert({ id: payload._id, job_id: payload.jobId, text: payload.text, created_at: payload._createdAt })
        break
      case ACTIONS.DELETE_JOB_NOTE:
        await supabase.from('job_notes').delete().eq('id', payload.noteId)
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

      // ── Phase 2: Estimates ────────────────────────────────────────────────
      case ACTIONS.SAVE_ESTIMATE: {
        const est = payload.estimate
        const { error: estErr } = await supabase.from('job_estimates').upsert({
          id: est.id, job_id: payload.jobId, status: est.status,
          sent_at: est.sentAt || null, template_id: est.templateId || null,
          scope_notes: est.scopeNotes || '', terms_notes: est.termsNotes || '',
          line_items: est.lineItems ?? [], discount_pct: est.discountPct ?? 0,
          sqft_items: est.sqftItems ?? [], equipment_items: est.equipmentItems ?? [],
          lab_items: est.labItems ?? [], material_items: est.materialItems ?? [],
          labor_items: est.laborItems ?? [], xactimate_items: est.xactimateItems ?? [],
          flat_fee_items: est.flatFeeItems ?? [],
          overhead_margin_pct: est.overheadMarginPct ?? 25, tax_pct: est.taxPct ?? 0,
          grand_total: est.grandTotal ?? 0,
          follow_up_count: est.followUpCount ?? 0, last_follow_up_at: est.lastFollowUpAt || null,
          created_at: est.createdAt || ts(), updated_at: ts(),
        })
        if (estErr) throw estErr
        await supabase.from('jobs').update({ revenue: est.grandTotal ?? 0, updated_at: ts() }).eq('id', payload.jobId)
        break
      }

      case ACTIONS.ARCHIVE_JOB:
        await supabase.from('jobs').update({ archived: payload.archived, updated_at: ts() }).eq('id', payload.id)
        break

      // ── Remote E-Signature ────────────────────────────────────────────────────
      case ACTIONS.ADD_REMOTE_REQUEST:
        await supabase.from('signature_requests').insert({
          id: payload.id,
          job_id: payload.jobId,
          title: payload.title,
          document_name: payload.documentName,
          document_data: payload.documentData,
          fields: payload.fields,
          signer_name: payload.signerName,
          signer_email: payload.signerEmail,
          status: 'pending',
          token: payload.token,
          created_at: payload.createdAt,
        })
        break
      case ACTIONS.DELETE_REMOTE_REQUEST:
        await supabase.from('signature_requests').delete().eq('id', payload.id)
        break
      case ACTIONS.UPDATE_ESTIMATE_STATUS: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job?.estimate) {
          await supabase.from('job_estimates').update({ status: payload.status, sent_at: payload.sentAt || job.estimate.sentAt || null, updated_at: ts() }).eq('id', job.estimate.id)
        }
        break
      }

      // ── Phase 2: Invoices ─────────────────────────────────────────────────
      case ACTIONS.SAVE_INVOICE: {
        const inv = payload.invoice
        await supabase.from('job_invoices').upsert({
          id: inv.id, job_id: payload.jobId, estimate_id: inv.estimateId || null,
          status: inv.status, due_date: inv.dueDate || null,
          amount_total: inv.amountTotal ?? 0, payments: inv.payments ?? [], created_at: inv.createdAt || ts(), updated_at: ts(),
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

      // ── Phase 2: Insurance ────────────────────────────────────────────────
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

      // ── Phase 2: Subcontractors ───────────────────────────────────────────
      case ACTIONS.ADD_SUBCONTRACTOR:
        await supabase.from('job_subcontractors').insert({ id: payload.sub.id, job_id: payload.jobId, name: payload.sub.name, trade: payload.sub.trade || null, quoted_amount: payload.sub.quotedAmount || 0, actual_amount: payload.sub.actualAmount || 0, payment_status: payload.sub.paymentStatus || 'unpaid', notes: payload.sub.notes || null, created_at: payload.sub.createdAt ?? ts() })
        break
      case ACTIONS.UPDATE_SUBCONTRACTOR:
        await supabase.from('job_subcontractors').update({ name: payload.sub.name, trade: payload.sub.trade || null, quoted_amount: payload.sub.quotedAmount || 0, actual_amount: payload.sub.actualAmount || 0, payment_status: payload.sub.paymentStatus || 'unpaid', notes: payload.sub.notes || null }).eq('id', payload.sub.id)
        break
      case ACTIONS.DELETE_SUBCONTRACTOR:
        await supabase.from('job_subcontractors').delete().eq('id', payload.subId)
        break

      // ── Phase 2: Expenses ─────────────────────────────────────────────────
      case ACTIONS.ADD_EXPENSE:
        await supabase.from('job_expenses').insert({ id: payload.expense.id, job_id: payload.jobId, date: payload.expense.date, category: payload.expense.category, amount: payload.expense.amount, notes: payload.expense.notes || null, created_at: payload.expense.createdAt ?? ts() })
        break
      case ACTIONS.UPDATE_EXPENSE:
        await supabase.from('job_expenses').update({ date: payload.expense.date, category: payload.expense.category, amount: payload.expense.amount, notes: payload.expense.notes || null }).eq('id', payload.expense.id)
        break
      case ACTIONS.DELETE_EXPENSE:
        await supabase.from('job_expenses').delete().eq('id', payload.expenseId)
        break

      // ── Phase 2: Overhead ─────────────────────────────────────────────────
      case ACTIONS.ADD_OVERHEAD_ITEM:
        await supabase.from('overhead_items').insert({ id: payload.id, name: payload.name, amount: payload.amount, created_at: payload.createdAt ?? ts() })
        break
      case ACTIONS.UPDATE_OVERHEAD_ITEM:
        await supabase.from('overhead_items').update({ name: payload.name, amount: payload.amount }).eq('id', payload.id)
        break
      case ACTIONS.DELETE_OVERHEAD_ITEM:
        await supabase.from('overhead_items').delete().eq('id', payload.id)
        break

      // ── Phase 3: Proposal Templates ───────────────────────────────────────
      case ACTIONS.INIT_TEMPLATES:
        for (const t of (payload ?? [])) {
          await supabase.from('proposal_templates').upsert({
            id: t.id, name: t.name, job_type: t.jobType,
            description: t.description ?? '', scope_notes: t.scopeNotes ?? '',
            terms_notes: t.termsNotes ?? '', line_items: t.lineItems ?? [], updated_at: ts(),
          }, { onConflict: 'id', ignoreDuplicates: true })
        }
        break
      case ACTIONS.ADD_TEMPLATE:
      case ACTIONS.SAVE_TEMPLATE:
        await supabase.from('proposal_templates').upsert({
          id: payload.id, name: payload.name, job_type: payload.jobType,
          description: payload.description ?? '', scope_notes: payload.scopeNotes ?? '',
          terms_notes: payload.termsNotes ?? '', line_items: payload.lineItems ?? [],
          created_at: payload.createdAt ?? ts(), updated_at: ts(),
        })
        break
      case ACTIONS.DELETE_TEMPLATE:
        await supabase.from('proposal_templates').delete().eq('id', payload.id)
        break

      // ── Phase 3: Events ───────────────────────────────────────────────────
      case ACTIONS.ADD_EVENT:
        await supabase.from('events').insert({
          id: payload.id, date: payload.date ?? '', start_time: payload.startTime ?? '',
          end_time: payload.endTime ?? '', event_type: payload.eventType ?? 'Appointment',
          job_id: payload.jobId ?? null, notes: payload.notes ?? null,
          confirmation_sent: false, reminder_sent: false, created_at: payload.createdAt ?? ts(),
        })
        break
      case ACTIONS.UPDATE_EVENT:
        await supabase.from('events').update({
          date: payload.date ?? '', start_time: payload.startTime ?? '',
          end_time: payload.endTime ?? '', event_type: payload.eventType ?? 'Appointment',
          job_id: payload.jobId ?? null, notes: payload.notes ?? null,
        }).eq('id', payload.id)
        break
      case ACTIONS.DELETE_EVENT:
        await supabase.from('events').delete().eq('id', payload.id)
        break
      case ACTIONS.MARK_CONFIRMATION_SENT:
        await supabase.from('events').update({ confirmation_sent: true, confirmation_sent_at: ts() }).eq('id', payload.eventId)
        break
      case ACTIONS.MARK_REMINDER_SENT:
        await supabase.from('events').update({ reminder_sent: true, reminder_sent_at: ts() }).eq('id', payload.eventId)
        break

      // ── Phase 3: Moisture Readings ────────────────────────────────────────
      case ACTIONS.ADD_MOISTURE_READING: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job) {
          const entry = { id: payload.reading.id, createdAt: payload.reading.createdAt ?? ts(), ...payload.reading }
          await supabase.from('jobs').update({ moisture_readings: [...(job.moistureReadings ?? []), entry], updated_at: ts() }).eq('id', payload.jobId)
        }
        break
      }
      case ACTIONS.DELETE_MOISTURE_READING: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job) await supabase.from('jobs').update({ moisture_readings: (job.moistureReadings ?? []).filter(r => r.id !== payload.readingId), updated_at: ts() }).eq('id', payload.jobId)
        break
      }

      // ── Phase 3: Drying Log ───────────────────────────────────────────────
      case ACTIONS.ADD_DRYING_ENTRY: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job) {
          const entry = { id: payload.entry.id, createdAt: payload.entry.createdAt ?? ts(), ...payload.entry }
          await supabase.from('jobs').update({ drying_log: [...(job.dryingLog ?? []), entry], updated_at: ts() }).eq('id', payload.jobId)
        }
        break
      }
      case ACTIONS.DELETE_DRYING_ENTRY: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job) await supabase.from('jobs').update({ drying_log: (job.dryingLog ?? []).filter(e => e.id !== payload.entryId), updated_at: ts() }).eq('id', payload.jobId)
        break
      }

      // ── Phase 3: Client Portal ────────────────────────────────────────────
      case ACTIONS.SAVE_PORTAL: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job) await supabase.from('jobs').update({ portal: { ...(job.portal ?? {}), ...payload.portal }, updated_at: ts() }).eq('id', payload.jobId)
        break
      }
      case ACTIONS.CLIENT_APPROVE_ESTIMATE: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job) await supabase.from('jobs').update({ portal: { ...(job.portal ?? {}), estimateApproved: true, approvedAt: ts() }, updated_at: ts() }).eq('id', payload.jobId)
        break
      }

      // ── Phase 3: E-Signature ──────────────────────────────────────────────
      case ACTIONS.ADD_SIGNATURE_REQUEST: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job) {
          const req = { id: payload.request.id, createdAt: payload.request.createdAt ?? ts(), status: 'pending', ...payload.request }
          await supabase.from('jobs').update({ signatures: [...(job.signatures ?? []), req], updated_at: ts() }).eq('id', payload.jobId)
        }
        break
      }
      case ACTIONS.SIGN_DOCUMENT: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job) {
          const sigs = (job.signatures ?? []).map(s => s.id === payload.signatureId ? { ...s, status: 'signed', signedAt: ts(), signatureData: payload.signatureData, signerName: payload.signerName } : s)
          await supabase.from('jobs').update({ signatures: sigs, updated_at: ts() }).eq('id', payload.jobId)
        }
        break
      }
      case ACTIONS.DELETE_SIGNATURE_REQUEST: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job) await supabase.from('jobs').update({ signatures: (job.signatures ?? []).filter(s => s.id !== payload.signatureId), updated_at: ts() }).eq('id', payload.jobId)
        break
      }

      // ── Phase 3: Outreach ─────────────────────────────────────────────────
      case ACTIONS.MARK_SURVEY_SENT: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job) await supabase.from('jobs').update({ survey: { ...(job.survey ?? {}), markedSentAt: ts() }, updated_at: ts() }).eq('id', payload.jobId)
        break
      }
      case ACTIONS.SUBMIT_SURVEY_RESPONSE: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job) await supabase.from('jobs').update({ survey: { ...(job.survey ?? {}), completedAt: ts(), stars: payload.stars, wouldRefer: payload.wouldRefer, comments: payload.comments }, updated_at: ts() }).eq('id', payload.jobId)
        break
      }
      case ACTIONS.MARK_REFERRAL_SENT: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job) await supabase.from('jobs').update({ referral_ask: { ...(job.referralAsk ?? {}), markedSentAt: ts() }, updated_at: ts() }).eq('id', payload.jobId)
        break
      }
      case ACTIONS.MARK_REVIEW_REQUEST_SENT: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job) await supabase.from('jobs').update({ review_request: { ...(job.reviewRequest ?? {}), markedSentAt: ts() }, updated_at: ts() }).eq('id', payload.jobId)
        break
      }
      case ACTIONS.MARK_ANNUAL_CHECKIN_SENT: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job) await supabase.from('jobs').update({ annual_check_in: { ...(job.annualCheckIn ?? {}), markedSentAt: ts() }, updated_at: ts() }).eq('id', payload.jobId)
        break
      }

      // ── Phase 3: Warranty ─────────────────────────────────────────────────
      case ACTIONS.SAVE_WARRANTY: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job) await supabase.from('jobs').update({ warranty: { claims: job.warranty?.claims ?? [], ...payload.warranty }, updated_at: ts() }).eq('id', payload.jobId)
        break
      }
      case ACTIONS.ADD_WARRANTY_CLAIM: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job?.warranty) {
          const claim = { id: payload.claim.id, reportedAt: payload.claim.reportedAt ?? ts(), status: 'open', ...payload.claim }
          await supabase.from('jobs').update({ warranty: { ...job.warranty, claims: [...(job.warranty.claims ?? []), claim] }, updated_at: ts() }).eq('id', payload.jobId)
        }
        break
      }
      case ACTIONS.RESOLVE_WARRANTY_CLAIM: {
        const job = preState.jobs.find(j => j.id === payload.jobId)
        if (job?.warranty) {
          const claims = (job.warranty.claims ?? []).map(c => c.id === payload.claimId ? { ...c, status: 'resolved', resolvedAt: ts() } : c)
          await supabase.from('jobs').update({ warranty: { ...job.warranty, claims }, updated_at: ts() }).eq('id', payload.jobId)
        }
        break
      }

      // ── Phase 3: Before/After Showcase ────────────────────────────────────
      case ACTIONS.TOGGLE_SHOWCASE: {
        const current = (preState.showcasePhotos ?? {})[payload.photoId] ?? false
        await supabase.from('job_photos').update({ is_showcase: !current }).eq('id', payload.photoId)
        break
      }

      // ── Phase 4: Referral Partners ────────────────────────────────────────
      case ACTIONS.ADD_PARTNER:
        await supabase.from('partners').insert({
          id: payload.id, name: payload.name, company: payload.company ?? '',
          type: payload.partnerType ?? '', temperature: payload.temperature ?? 'cold',
          priority: payload.priority ?? 3,
          phone: payload.phone ?? null, email: payload.email ?? null, website: payload.website ?? null, address: payload.address ?? null,
          notes: payload.notes ?? null, contact_history: [], deals: [], created_at: payload.createdAt ?? ts(),
        })
        break
      case ACTIONS.UPDATE_PARTNER:
        await supabase.from('partners').update({
          name: payload.name, company: payload.company ?? '', type: payload.partnerType ?? '',
          temperature: payload.temperature ?? 'cold', priority: payload.priority ?? 3,
          phone: payload.phone ?? null, email: payload.email ?? null, website: payload.website ?? null, address: payload.address ?? null, notes: payload.notes ?? null,
        }).eq('id', payload.id)
        break
      case ACTIONS.DELETE_PARTNER:
        await supabase.from('partners').delete().eq('id', payload.id)
        break
      case ACTIONS.ADD_PARTNER_CONTACT: {
        const partner = preState.partners?.find(p => p.id === payload.partnerId)
        if (partner) {
          const contact = { id: payload.contact.id, date: payload.contact.date ?? ts(), ...payload.contact }
          await supabase.from('partners').update({ last_contact_date: ts(), contact_history: [...(partner.contactHistory ?? []), contact] }).eq('id', payload.partnerId)
        }
        break
      }
      case ACTIONS.ADD_PARTNER_DEAL: {
        const partner = preState.partners?.find(p => p.id === payload.partnerId)
        if (partner) {
          const deal = { id: payload.deal.id, createdAt: payload.deal.createdAt ?? ts(), status: 'active', jobsSent: 0, jobsReceived: 0, ...payload.deal }
          await supabase.from('partners').update({ deals: [...(partner.deals ?? []), deal] }).eq('id', payload.partnerId)
        }
        break
      }
      case ACTIONS.UPDATE_PARTNER_DEAL: {
        const partner = preState.partners?.find(p => p.id === payload.partnerId)
        if (partner) {
          const deals = (partner.deals ?? []).map(d => d.id === payload.deal.id ? { ...d, ...payload.deal } : d)
          await supabase.from('partners').update({ deals }).eq('id', payload.partnerId)
        }
        break
      }
      case ACTIONS.DELETE_PARTNER_DEAL: {
        const partner = preState.partners?.find(p => p.id === payload.partnerId)
        if (partner) await supabase.from('partners').update({ deals: (partner.deals ?? []).filter(d => d.id !== payload.dealId) }).eq('id', payload.partnerId)
        break
      }

      // ── Phase 4: Outreach Scripts ─────────────────────────────────────────
      case ACTIONS.INIT_SCRIPTS:
        for (const s of (payload ?? [])) {
          await supabase.from('outreach_scripts').upsert({
            id: s.id, title: s.title, type: s.type, body: s.body ?? '',
            is_custom: s.isCustom ?? false, sent_history: s.sentHistory ?? [],
            created_at: s.createdAt ?? ts(),
          }, { onConflict: 'id', ignoreDuplicates: true })
        }
        break
      case ACTIONS.ADD_SCRIPT:
        await supabase.from('outreach_scripts').insert({
          id: payload.id, title: payload.title, type: payload.type ?? '', body: payload.body ?? '',
          is_custom: true, sent_history: [], created_at: payload.createdAt ?? ts(),
        })
        break
      case ACTIONS.UPDATE_SCRIPT:
        await supabase.from('outreach_scripts').update({ title: payload.title, type: payload.type ?? '', body: payload.body ?? '' }).eq('id', payload.id)
        break
      case ACTIONS.DELETE_SCRIPT:
        await supabase.from('outreach_scripts').delete().eq('id', payload.id)
        break
      case ACTIONS.MARK_SCRIPT_SENT: {
        const script = preState.scripts?.find(s => s.id === payload.id)
        if (script) await supabase.from('outreach_scripts').update({ sent_history: [...(script.sentHistory ?? []), { sentAt: ts() }] }).eq('id', payload.id)
        break
      }

      // ── Phase 4: Objection Handler ────────────────────────────────────────
      case ACTIONS.INIT_OBJECTIONS:
        for (const o of (payload ?? [])) {
          await supabase.from('objections').upsert({
            id: o.id, objection: o.objection, responses: o.responses ?? [],
            category: o.category ?? '', is_custom: o.isCustom ?? false, created_at: o.createdAt ?? ts(),
          }, { onConflict: 'id', ignoreDuplicates: true })
        }
        break
      case ACTIONS.ADD_OBJECTION:
        await supabase.from('objections').insert({
          id: payload.id, objection: payload.objection, responses: payload.responses ?? [],
          category: payload.category ?? '', is_custom: true, created_at: payload.createdAt ?? ts(),
        })
        break
      case ACTIONS.UPDATE_OBJECTION:
        await supabase.from('objections').update({ objection: payload.objection, responses: payload.responses ?? [], category: payload.category ?? '' }).eq('id', payload.id)
        break
      case ACTIONS.DELETE_OBJECTION:
        await supabase.from('objections').delete().eq('id', payload.id)
        break

      // ── Phase 4: Competitor Intel ─────────────────────────────────────────
      case ACTIONS.ADD_COMPETITOR:
        await supabase.from('competitors').insert({
          id: payload.id, name: payload.name, notes: payload.notes ?? null,
          strengths: payload.strengths ?? null, weaknesses: payload.weaknesses ?? null,
          talking_points: payload.talkingPoints ?? [], created_at: payload.createdAt ?? ts(),
        })
        break
      case ACTIONS.UPDATE_COMPETITOR:
        await supabase.from('competitors').update({
          name: payload.name, notes: payload.notes ?? null,
          strengths: payload.strengths ?? null, weaknesses: payload.weaknesses ?? null,
          talking_points: payload.talkingPoints ?? [],
        }).eq('id', payload.id)
        break
      case ACTIONS.DELETE_COMPETITOR:
        await supabase.from('competitors').delete().eq('id', payload.id)
        break

      // ── Phase 4: GBP Optimizer ────────────────────────────────────────────
      case ACTIONS.UPDATE_GBP_ITEM: {
        const current = preState.gbpChecklist ?? {}
        const updated = { ...current, [payload.item]: { checked: payload.checked, checkedAt: payload.checked ? ts() : null } }
        await supabase.from('gbp_checklist').upsert({ id: 'singleton', data: updated })
        break
      }

      // ── Phase 5: Certifications ───────────────────────────────────────────
      case ACTIONS.ADD_CERTIFICATION:
        await supabase.from('certifications').insert({
          id: payload.id, name: payload.name, holder: payload.holder ?? '',
          issuing_body: payload.issuingBody ?? null, cert_number: payload.certNumber ?? null,
          issue_date: payload.issueDate ?? null, expiry_date: payload.expiryDate ?? null,
          created_at: payload.createdAt ?? ts(),
        })
        break
      case ACTIONS.UPDATE_CERTIFICATION:
        await supabase.from('certifications').update({
          name: payload.name, holder: payload.holder ?? '',
          issuing_body: payload.issuingBody ?? null, cert_number: payload.certNumber ?? null,
          issue_date: payload.issueDate ?? null, expiry_date: payload.expiryDate ?? null,
        }).eq('id', payload.id)
        break
      case ACTIONS.DELETE_CERTIFICATION:
        await supabase.from('certifications').delete().eq('id', payload.id)
        break

      // ── Phase 5: Inventory ────────────────────────────────────────────────
      case ACTIONS.ADD_INVENTORY:
        await supabase.from('inventory_items').insert({
          id: payload.id, name: payload.name, category: payload.category ?? '',
          unit: payload.unit ?? '', qty: payload.qty ?? 0, threshold: payload.threshold ?? 0,
          cost_per_unit: payload.costPerUnit ?? 0, supplier: payload.supplier ?? null,
          created_at: payload.createdAt ?? ts(),
        })
        break
      case ACTIONS.UPDATE_INVENTORY:
        await supabase.from('inventory_items').update({
          name: payload.name, category: payload.category ?? '', unit: payload.unit ?? '',
          qty: payload.qty ?? 0, threshold: payload.threshold ?? 0,
          cost_per_unit: payload.costPerUnit ?? 0, supplier: payload.supplier ?? null,
        }).eq('id', payload.id)
        break
      case ACTIONS.DELETE_INVENTORY:
        await supabase.from('inventory_items').delete().eq('id', payload.id)
        break

      // ── Phase 5: Internal Document Library ───────────────────────────────
      case ACTIONS.INIT_INTERNAL_DOCS:
        for (const d of (payload ?? [])) {
          await supabase.from('internal_docs').upsert({
            id: d.id, title: d.title, category: d.category ?? '',
            content: d.content ?? '', created_at: d.createdAt ?? ts(), updated_at: d.updatedAt ?? ts(),
          }, { onConflict: 'id', ignoreDuplicates: true })
        }
        break
      case ACTIONS.ADD_INTERNAL_DOC:
        await supabase.from('internal_docs').insert({
          id: payload.id, title: payload.title, category: payload.category ?? '',
          content: payload.content ?? '', created_at: payload.createdAt ?? ts(), updated_at: payload.updatedAt ?? ts(),
        })
        break
      case ACTIONS.UPDATE_INTERNAL_DOC:
        await supabase.from('internal_docs').update({ title: payload.title, category: payload.category ?? '', content: payload.content ?? '', updated_at: ts() }).eq('id', payload.id)
        break
      case ACTIONS.DELETE_INTERNAL_DOC:
        await supabase.from('internal_docs').delete().eq('id', payload.id)
        break

      // ── Phase 5: Employee Onboarding ──────────────────────────────────────
      case ACTIONS.ADD_EMPLOYEE:
        await supabase.from('employees').insert({
          id: payload.id, name: payload.name, role: payload.role ?? '',
          email: payload.email ?? null, phone: payload.phone ?? null,
          start_date: payload.startDate ?? null, onboarding_items: {},
          created_at: payload.createdAt ?? ts(),
        })
        break
      case ACTIONS.UPDATE_EMPLOYEE:
        await supabase.from('employees').update({
          name: payload.name, role: payload.role ?? '',
          email: payload.email ?? null, phone: payload.phone ?? null,
          start_date: payload.startDate ?? null,
        }).eq('id', payload.id)
        break
      case ACTIONS.DELETE_EMPLOYEE:
        await supabase.from('employees').delete().eq('id', payload.id)
        break
      case ACTIONS.UPDATE_ONBOARDING_ITEM: {
        const emp = preState.employees?.find(e => e.id === payload.employeeId)
        if (emp) {
          const items = { ...(emp.onboardingItems ?? {}), [payload.itemId]: { completed: payload.completed, completedAt: payload.completed ? ts() : null } }
          await supabase.from('employees').update({ onboarding_items: items }).eq('id', payload.employeeId)
        }
        break
      }

      // ── Phase 5: KPI Goals ────────────────────────────────────────────────
      case ACTIONS.SET_KPI_GOAL: {
        const existing = preState.kpiGoals?.[payload.month] ?? {}
        await supabase.from('kpi_goals').upsert({ month: payload.month, goals: { ...existing, ...payload.goals } })
        break
      }

      // ── Phase 5: Review Tracker ───────────────────────────────────────────
      case ACTIONS.UPDATE_REVIEW_TRACKER: {
        const existing = preState.reviewTracker ?? {}
        await supabase.from('review_tracker').upsert({ id: 'singleton', data: { ...existing, ...payload } })
        break
      }
    }
  } catch (err) {
    console.error('Supabase sync error:', action.type, err.message)
    throw err
  }
}
