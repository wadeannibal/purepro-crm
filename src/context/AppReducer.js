export const ACTIONS = {
  // Phase 1
  ADD_CLIENT: 'ADD_CLIENT',
  UPDATE_CLIENT: 'UPDATE_CLIENT',
  DELETE_CLIENT: 'DELETE_CLIENT',
  TOGGLE_VIP: 'TOGGLE_VIP',
  ADD_COMMUNICATION: 'ADD_COMMUNICATION',
  DELETE_COMMUNICATION: 'DELETE_COMMUNICATION',
  ADD_JOB: 'ADD_JOB',
  UPDATE_JOB: 'UPDATE_JOB',
  DELETE_JOB: 'DELETE_JOB',
  ADD_JOB_NOTE: 'ADD_JOB_NOTE',
  UPDATE_CHECKLIST_ITEM: 'UPDATE_CHECKLIST_ITEM',
  UPDATE_OSHA_ITEM: 'UPDATE_OSHA_ITEM',
  ADD_PHOTO: 'ADD_PHOTO',
  DELETE_PHOTO: 'DELETE_PHOTO',
  ADD_DOCUMENT: 'ADD_DOCUMENT',
  DELETE_DOCUMENT: 'DELETE_DOCUMENT',
  ADD_WAIVER: 'ADD_WAIVER',
  DELETE_WAIVER: 'DELETE_WAIVER',
  ADD_TIME_LOG: 'ADD_TIME_LOG',
  UPDATE_TIME_LOG: 'UPDATE_TIME_LOG',
  DELETE_TIME_LOG: 'DELETE_TIME_LOG',
  ADD_EQUIPMENT: 'ADD_EQUIPMENT',
  UPDATE_EQUIPMENT: 'UPDATE_EQUIPMENT',
  DELETE_EQUIPMENT: 'DELETE_EQUIPMENT',
  LOAD_STATE: 'LOAD_STATE',

  // Phase 2 — Estimator
  SAVE_ESTIMATE: 'SAVE_ESTIMATE',
  UPDATE_ESTIMATE_STATUS: 'UPDATE_ESTIMATE_STATUS',

  // Phase 2 — Invoicing
  SAVE_INVOICE: 'SAVE_INVOICE',
  UPDATE_INVOICE_STATUS: 'UPDATE_INVOICE_STATUS',
  ADD_PAYMENT: 'ADD_PAYMENT',
  DELETE_PAYMENT: 'DELETE_PAYMENT',

  // Phase 2 — Insurance
  UPDATE_INSURANCE: 'UPDATE_INSURANCE',

  // Phase 2 — Subcontractors
  ADD_SUBCONTRACTOR: 'ADD_SUBCONTRACTOR',
  UPDATE_SUBCONTRACTOR: 'UPDATE_SUBCONTRACTOR',
  DELETE_SUBCONTRACTOR: 'DELETE_SUBCONTRACTOR',

  // Phase 2 — Expenses
  ADD_EXPENSE: 'ADD_EXPENSE',
  UPDATE_EXPENSE: 'UPDATE_EXPENSE',
  DELETE_EXPENSE: 'DELETE_EXPENSE',

  // Phase 2 — Overhead
  ADD_OVERHEAD_ITEM: 'ADD_OVERHEAD_ITEM',
  UPDATE_OVERHEAD_ITEM: 'UPDATE_OVERHEAD_ITEM',
  DELETE_OVERHEAD_ITEM: 'DELETE_OVERHEAD_ITEM',

  // Phase 2 — Proposal Templates
  INIT_TEMPLATES: 'INIT_TEMPLATES',
  ADD_TEMPLATE: 'ADD_TEMPLATE',
  SAVE_TEMPLATE: 'SAVE_TEMPLATE',
  DELETE_TEMPLATE: 'DELETE_TEMPLATE',

  // Phase 3 — Scheduler / Events
  ADD_EVENT: 'ADD_EVENT',
  UPDATE_EVENT: 'UPDATE_EVENT',
  DELETE_EVENT: 'DELETE_EVENT',
  MARK_CONFIRMATION_SENT: 'MARK_CONFIRMATION_SENT',
  MARK_REMINDER_SENT: 'MARK_REMINDER_SENT',

  // Phase 3 — Field Logs (per job)
  ADD_MOISTURE_READING: 'ADD_MOISTURE_READING',
  DELETE_MOISTURE_READING: 'DELETE_MOISTURE_READING',
  ADD_DRYING_ENTRY: 'ADD_DRYING_ENTRY',
  DELETE_DRYING_ENTRY: 'DELETE_DRYING_ENTRY',

  // Phase 3 — Client Portal (per job)
  SAVE_PORTAL: 'SAVE_PORTAL',
  CLIENT_APPROVE_ESTIMATE: 'CLIENT_APPROVE_ESTIMATE',

  // Phase 3 — E-Signature (per job)
  ADD_SIGNATURE_REQUEST: 'ADD_SIGNATURE_REQUEST',
  SIGN_DOCUMENT: 'SIGN_DOCUMENT',
  DELETE_SIGNATURE_REQUEST: 'DELETE_SIGNATURE_REQUEST',

  // Phase 3 — Outreach
  MARK_SURVEY_SENT: 'MARK_SURVEY_SENT',
  SUBMIT_SURVEY_RESPONSE: 'SUBMIT_SURVEY_RESPONSE',
  MARK_REFERRAL_SENT: 'MARK_REFERRAL_SENT',
  MARK_REVIEW_REQUEST_SENT: 'MARK_REVIEW_REQUEST_SENT',

  // Phase 3 — Warranty
  SAVE_WARRANTY: 'SAVE_WARRANTY',
  ADD_WARRANTY_CLAIM: 'ADD_WARRANTY_CLAIM',
  RESOLVE_WARRANTY_CLAIM: 'RESOLVE_WARRANTY_CLAIM',

  // Phase 3 — Annual Check-In
  MARK_ANNUAL_CHECKIN_SENT: 'MARK_ANNUAL_CHECKIN_SENT',

  // Phase 4 — Referral Partners
  ADD_PARTNER: 'ADD_PARTNER',
  UPDATE_PARTNER: 'UPDATE_PARTNER',
  DELETE_PARTNER: 'DELETE_PARTNER',
  ADD_PARTNER_CONTACT: 'ADD_PARTNER_CONTACT',
  ADD_PARTNER_DEAL: 'ADD_PARTNER_DEAL',
  UPDATE_PARTNER_DEAL: 'UPDATE_PARTNER_DEAL',
  DELETE_PARTNER_DEAL: 'DELETE_PARTNER_DEAL',

  // Phase 4 — Outreach Scripts
  INIT_SCRIPTS: 'INIT_SCRIPTS',
  ADD_SCRIPT: 'ADD_SCRIPT',
  UPDATE_SCRIPT: 'UPDATE_SCRIPT',
  DELETE_SCRIPT: 'DELETE_SCRIPT',
  MARK_SCRIPT_SENT: 'MARK_SCRIPT_SENT',

  // Phase 4 — Objection Handler
  INIT_OBJECTIONS: 'INIT_OBJECTIONS',
  ADD_OBJECTION: 'ADD_OBJECTION',
  UPDATE_OBJECTION: 'UPDATE_OBJECTION',
  DELETE_OBJECTION: 'DELETE_OBJECTION',

  // Phase 4 — Competitors
  ADD_COMPETITOR: 'ADD_COMPETITOR',
  UPDATE_COMPETITOR: 'UPDATE_COMPETITOR',
  DELETE_COMPETITOR: 'DELETE_COMPETITOR',

  // Phase 4 — GBP Optimizer
  UPDATE_GBP_ITEM: 'UPDATE_GBP_ITEM',

  // Phase 5 — Certifications
  ADD_CERTIFICATION: 'ADD_CERTIFICATION',
  UPDATE_CERTIFICATION: 'UPDATE_CERTIFICATION',
  DELETE_CERTIFICATION: 'DELETE_CERTIFICATION',

  // Phase 5 — Inventory
  ADD_INVENTORY: 'ADD_INVENTORY',
  UPDATE_INVENTORY: 'UPDATE_INVENTORY',
  DELETE_INVENTORY: 'DELETE_INVENTORY',

  // Phase 5 — Internal Docs
  INIT_INTERNAL_DOCS: 'INIT_INTERNAL_DOCS',
  ADD_INTERNAL_DOC: 'ADD_INTERNAL_DOC',
  UPDATE_INTERNAL_DOC: 'UPDATE_INTERNAL_DOC',
  DELETE_INTERNAL_DOC: 'DELETE_INTERNAL_DOC',

  // Phase 5 — Employee Onboarding
  ADD_EMPLOYEE: 'ADD_EMPLOYEE',
  UPDATE_EMPLOYEE: 'UPDATE_EMPLOYEE',
  DELETE_EMPLOYEE: 'DELETE_EMPLOYEE',
  UPDATE_ONBOARDING_ITEM: 'UPDATE_ONBOARDING_ITEM',

  // Phase 5 — KPI Goals
  SET_KPI_GOAL: 'SET_KPI_GOAL',

  // Phase 5 — Review / Social Tracker
  UPDATE_REVIEW_TRACKER: 'UPDATE_REVIEW_TRACKER',

  // Phase 5 — Before/After Showcase
  TOGGLE_SHOWCASE: 'TOGGLE_SHOWCASE',
}

const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()

const updateJob = (jobs, id, updater) =>
  jobs.map(j => j.id === id ? { ...updater(j), updatedAt: now() } : j)

export function reducer(state, action) {
  const { payload } = action

  switch (action.type) {
    case ACTIONS.LOAD_STATE:
      return { ...state, ...payload }

    // ── Clients ──────────────────────────────────────────────
    case ACTIONS.ADD_CLIENT:
      return { ...state, clients: [...state.clients, { id: uid(), createdAt: now(), communications: [], ...payload }] }

    case ACTIONS.UPDATE_CLIENT:
      return { ...state, clients: state.clients.map(c => c.id === payload.id ? { ...c, ...payload } : c) }

    case ACTIONS.DELETE_CLIENT:
      return { ...state, clients: state.clients.filter(c => c.id !== payload.id) }

    case ACTIONS.TOGGLE_VIP:
      return { ...state, clients: state.clients.map(c => c.id === payload.id ? { ...c, isVIP: !c.isVIP } : c) }

    // ── Communications (per client) ───────────────────────────
    case ACTIONS.ADD_COMMUNICATION:
      return {
        ...state,
        clients: state.clients.map(c =>
          c.id === payload.clientId
            ? { ...c, communications: [...c.communications, { id: uid(), date: now(), ...payload.comm }] }
            : c
        ),
      }

    case ACTIONS.DELETE_COMMUNICATION:
      return {
        ...state,
        clients: state.clients.map(c =>
          c.id === payload.clientId
            ? { ...c, communications: c.communications.filter(x => x.id !== payload.commId) }
            : c
        ),
      }

    // ── Jobs ─────────────────────────────────────────────────
    case ACTIONS.ADD_JOB:
      return {
        ...state,
        jobs: [...state.jobs, {
          id: uid(), createdAt: now(), updatedAt: now(),
          notes: [], checklist: {}, oshaChecklist: {},
          photos: [], documents: [], waivers: [], timeLogs: [],
          estimate: null, invoice: null, insurance: null,
          subcontractors: [], expenses: [],
          // Phase 3 defaults
          moistureReadings: [], dryingLog: [],
          portal: null, signatures: [],
          // Phase 4 defaults
          leadSource: null, leadSourcePartnerId: null,
          lostReason: null, lostCompetitor: null,
          firstContactDate: now(), lastContactDate: now(),
          survey: null, referralAsk: null,
          reviewRequest: null, warranty: null,
          annualCheckIn: null,
          ...payload,
        }],
      }

    case ACTIONS.UPDATE_JOB:
      return { ...state, jobs: updateJob(state.jobs, payload.id, j => ({ ...j, ...payload })) }

    case ACTIONS.DELETE_JOB:
      return { ...state, jobs: state.jobs.filter(j => j.id !== payload.id) }

    case ACTIONS.ADD_JOB_NOTE:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          notes: [...j.notes, { id: payload._id ?? uid(), text: payload.text, createdAt: payload._createdAt ?? now() }],
        })),
      }

    case ACTIONS.UPDATE_CHECKLIST_ITEM:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          checklist: { ...j.checklist, [payload.item]: payload.checked },
        })),
      }

    case ACTIONS.UPDATE_OSHA_ITEM:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          oshaChecklist: { ...j.oshaChecklist, [payload.item]: payload.checked },
        })),
      }

    case ACTIONS.ADD_PHOTO:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          photos: [...j.photos, { id: uid(), createdAt: now(), ...payload.photo }],
        })),
      }

    case ACTIONS.DELETE_PHOTO:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          photos: j.photos.filter(p => p.id !== payload.photoId),
        })),
      }

    case ACTIONS.ADD_DOCUMENT:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          documents: [...j.documents, { id: uid(), createdAt: now(), ...payload.doc }],
        })),
      }

    case ACTIONS.DELETE_DOCUMENT:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          documents: j.documents.filter(d => d.id !== payload.docId),
        })),
      }

    case ACTIONS.ADD_WAIVER:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          waivers: [...j.waivers, { id: uid(), ...payload.waiver }],
        })),
      }

    case ACTIONS.DELETE_WAIVER:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          waivers: j.waivers.filter(w => w.id !== payload.waiverId),
        })),
      }

    case ACTIONS.ADD_TIME_LOG:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          timeLogs: [...j.timeLogs, { id: uid(), ...payload.log }],
        })),
      }

    case ACTIONS.UPDATE_TIME_LOG:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          timeLogs: j.timeLogs.map(t => t.id === payload.logId ? { ...t, ...payload.updates } : t),
        })),
      }

    case ACTIONS.DELETE_TIME_LOG:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          timeLogs: j.timeLogs.filter(t => t.id !== payload.logId),
        })),
      }

    // ── Equipment ────────────────────────────────────────────
    case ACTIONS.ADD_EQUIPMENT:
      return { ...state, equipment: [...state.equipment, { id: uid(), ...payload }] }

    case ACTIONS.UPDATE_EQUIPMENT:
      return { ...state, equipment: state.equipment.map(e => e.id === payload.id ? { ...e, ...payload } : e) }

    case ACTIONS.DELETE_EQUIPMENT:
      return { ...state, equipment: state.equipment.filter(e => e.id !== payload.id) }

    // ── Phase 2: Estimator ───────────────────────────────────
    case ACTIONS.SAVE_ESTIMATE:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          estimate: { ...payload.estimate, updatedAt: now() },
        })),
      }

    case ACTIONS.UPDATE_ESTIMATE_STATUS:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          estimate: j.estimate ? {
            ...j.estimate,
            status: payload.status,
            sentAt: payload.sentAt ?? j.estimate.sentAt,
            updatedAt: now(),
          } : j.estimate,
        })),
      }

    // ── Phase 2: Invoicing ───────────────────────────────────
    case ACTIONS.SAVE_INVOICE:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          invoice: { ...payload.invoice, updatedAt: now() },
        })),
      }

    case ACTIONS.UPDATE_INVOICE_STATUS:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          invoice: j.invoice ? { ...j.invoice, status: payload.status, updatedAt: now() } : j.invoice,
        })),
      }

    case ACTIONS.ADD_PAYMENT:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          invoice: j.invoice ? {
            ...j.invoice,
            payments: [...(j.invoice.payments ?? []), { id: uid(), ...payload.payment }],
            updatedAt: now(),
          } : j.invoice,
        })),
      }

    case ACTIONS.DELETE_PAYMENT:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          invoice: j.invoice ? {
            ...j.invoice,
            payments: (j.invoice.payments ?? []).filter(p => p.id !== payload.paymentId),
            updatedAt: now(),
          } : j.invoice,
        })),
      }

    // ── Phase 2: Insurance ───────────────────────────────────
    case ACTIONS.UPDATE_INSURANCE:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          insurance: { ...(j.insurance ?? {}), ...payload.insurance, updatedAt: now() },
        })),
      }

    // ── Phase 2: Subcontractors ──────────────────────────────
    case ACTIONS.ADD_SUBCONTRACTOR:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          subcontractors: [...(j.subcontractors ?? []), { id: uid(), createdAt: now(), ...payload.sub }],
        })),
      }

    case ACTIONS.UPDATE_SUBCONTRACTOR:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          subcontractors: (j.subcontractors ?? []).map(s => s.id === payload.sub.id ? { ...s, ...payload.sub } : s),
        })),
      }

    case ACTIONS.DELETE_SUBCONTRACTOR:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          subcontractors: (j.subcontractors ?? []).filter(s => s.id !== payload.subId),
        })),
      }

    // ── Phase 2: Expenses ────────────────────────────────────
    case ACTIONS.ADD_EXPENSE:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          expenses: [...(j.expenses ?? []), { id: uid(), createdAt: now(), ...payload.expense }],
        })),
      }

    case ACTIONS.UPDATE_EXPENSE:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          expenses: (j.expenses ?? []).map(e => e.id === payload.expense.id ? { ...e, ...payload.expense } : e),
        })),
      }

    case ACTIONS.DELETE_EXPENSE:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          expenses: (j.expenses ?? []).filter(e => e.id !== payload.expenseId),
        })),
      }

    // ── Phase 2: Overhead ────────────────────────────────────
    case ACTIONS.ADD_OVERHEAD_ITEM:
      return {
        ...state,
        overheadItems: [...(state.overheadItems ?? []), { id: uid(), createdAt: now(), ...payload }],
      }

    case ACTIONS.UPDATE_OVERHEAD_ITEM:
      return {
        ...state,
        overheadItems: (state.overheadItems ?? []).map(o => o.id === payload.id ? { ...o, ...payload } : o),
      }

    case ACTIONS.DELETE_OVERHEAD_ITEM:
      return {
        ...state,
        overheadItems: (state.overheadItems ?? []).filter(o => o.id !== payload.id),
      }

    // ── Phase 2: Proposal Templates ─────────────────────────
    case ACTIONS.INIT_TEMPLATES:
      if (state.proposalTemplates) return state
      return { ...state, proposalTemplates: payload }

    case ACTIONS.ADD_TEMPLATE:
      return {
        ...state,
        proposalTemplates: [...(state.proposalTemplates ?? []), { id: uid(), createdAt: now(), ...payload }],
      }

    case ACTIONS.SAVE_TEMPLATE:
      return {
        ...state,
        proposalTemplates: (state.proposalTemplates ?? []).map(t => t.id === payload.id ? { ...t, ...payload } : t),
      }

    case ACTIONS.DELETE_TEMPLATE:
      return {
        ...state,
        proposalTemplates: (state.proposalTemplates ?? []).filter(t => t.id !== payload.id),
      }

    // ── Phase 3: Scheduler / Events ──────────────────────────
    case ACTIONS.ADD_EVENT:
      return { ...state, events: [...(state.events ?? []), { id: uid(), createdAt: now(), ...payload }] }

    case ACTIONS.UPDATE_EVENT:
      return { ...state, events: (state.events ?? []).map(e => e.id === payload.id ? { ...e, ...payload } : e) }

    case ACTIONS.DELETE_EVENT:
      return { ...state, events: (state.events ?? []).filter(e => e.id !== payload.id) }

    case ACTIONS.MARK_CONFIRMATION_SENT:
      return {
        ...state,
        events: (state.events ?? []).map(e =>
          e.id === payload.eventId ? { ...e, confirmationSent: true, confirmationSentAt: now() } : e
        ),
      }

    case ACTIONS.MARK_REMINDER_SENT:
      return {
        ...state,
        events: (state.events ?? []).map(e =>
          e.id === payload.eventId ? { ...e, reminderSent: true, reminderSentAt: now() } : e
        ),
      }

    // ── Phase 3: Field Logs ──────────────────────────────────
    case ACTIONS.ADD_MOISTURE_READING:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          moistureReadings: [...(j.moistureReadings ?? []), { id: uid(), createdAt: now(), ...payload.reading }],
        })),
      }

    case ACTIONS.DELETE_MOISTURE_READING:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          moistureReadings: (j.moistureReadings ?? []).filter(r => r.id !== payload.readingId),
        })),
      }

    case ACTIONS.ADD_DRYING_ENTRY:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          dryingLog: [...(j.dryingLog ?? []), { id: uid(), createdAt: now(), ...payload.entry }],
        })),
      }

    case ACTIONS.DELETE_DRYING_ENTRY:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          dryingLog: (j.dryingLog ?? []).filter(e => e.id !== payload.entryId),
        })),
      }

    // ── Phase 3: Client Portal ───────────────────────────────
    case ACTIONS.SAVE_PORTAL:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          portal: { ...(j.portal ?? {}), ...payload.portal },
        })),
      }

    case ACTIONS.CLIENT_APPROVE_ESTIMATE:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          portal: { ...(j.portal ?? {}), estimateApproved: true, approvedAt: now() },
        })),
      }

    // ── Phase 3: E-Signature ─────────────────────────────────
    case ACTIONS.ADD_SIGNATURE_REQUEST:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          signatures: [...(j.signatures ?? []), { id: uid(), createdAt: now(), status: 'pending', ...payload.request }],
        })),
      }

    case ACTIONS.SIGN_DOCUMENT:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          signatures: (j.signatures ?? []).map(s =>
            s.id === payload.signatureId
              ? { ...s, status: 'signed', signedAt: now(), signatureData: payload.signatureData, signerName: payload.signerName }
              : s
          ),
        })),
      }

    case ACTIONS.DELETE_SIGNATURE_REQUEST:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          signatures: (j.signatures ?? []).filter(s => s.id !== payload.signatureId),
        })),
      }

    // ── Phase 3: Survey / Referral / Review ──────────────────
    case ACTIONS.MARK_SURVEY_SENT:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          survey: { ...(j.survey ?? {}), markedSentAt: now() },
        })),
      }

    case ACTIONS.SUBMIT_SURVEY_RESPONSE:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          survey: { ...(j.survey ?? {}), completedAt: now(), stars: payload.stars, wouldRefer: payload.wouldRefer, comments: payload.comments },
        })),
      }

    case ACTIONS.MARK_REFERRAL_SENT:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          referralAsk: { ...(j.referralAsk ?? {}), markedSentAt: now() },
        })),
      }

    case ACTIONS.MARK_REVIEW_REQUEST_SENT:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          reviewRequest: { ...(j.reviewRequest ?? {}), markedSentAt: now() },
        })),
      }

    // ── Phase 3: Warranty ────────────────────────────────────
    case ACTIONS.SAVE_WARRANTY:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          warranty: { claims: j.warranty?.claims ?? [], ...payload.warranty },
        })),
      }

    case ACTIONS.ADD_WARRANTY_CLAIM:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          warranty: j.warranty ? {
            ...j.warranty,
            claims: [...(j.warranty.claims ?? []), { id: uid(), reportedAt: now(), status: 'open', ...payload.claim }],
          } : j.warranty,
        })),
      }

    case ACTIONS.RESOLVE_WARRANTY_CLAIM:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          warranty: j.warranty ? {
            ...j.warranty,
            claims: (j.warranty.claims ?? []).map(c =>
              c.id === payload.claimId ? { ...c, status: 'resolved', resolvedAt: now() } : c
            ),
          } : j.warranty,
        })),
      }

    // ── Phase 3: Annual Check-In ─────────────────────────────
    case ACTIONS.MARK_ANNUAL_CHECKIN_SENT:
      return {
        ...state,
        jobs: updateJob(state.jobs, payload.jobId, j => ({
          ...j,
          annualCheckIn: { ...(j.annualCheckIn ?? {}), markedSentAt: now() },
        })),
      }

    // ── Phase 4: Referral Partners ───────────────────────────
    case ACTIONS.ADD_PARTNER:
      return {
        ...state,
        partners: [...(state.partners ?? []), { id: uid(), createdAt: now(), contactHistory: [], deals: [], ...payload }],
      }

    case ACTIONS.UPDATE_PARTNER:
      return {
        ...state,
        partners: (state.partners ?? []).map(p => p.id === payload.id ? { ...p, ...payload } : p),
      }

    case ACTIONS.DELETE_PARTNER:
      return { ...state, partners: (state.partners ?? []).filter(p => p.id !== payload.id) }

    case ACTIONS.ADD_PARTNER_CONTACT:
      return {
        ...state,
        partners: (state.partners ?? []).map(p =>
          p.id === payload.partnerId
            ? { ...p, lastContactDate: now(), contactHistory: [...(p.contactHistory ?? []), { id: uid(), date: now(), ...payload.contact }] }
            : p
        ),
      }

    case ACTIONS.ADD_PARTNER_DEAL:
      return {
        ...state,
        partners: (state.partners ?? []).map(p =>
          p.id === payload.partnerId
            ? { ...p, deals: [...(p.deals ?? []), { id: uid(), createdAt: now(), status: 'active', jobsSent: 0, jobsReceived: 0, ...payload.deal }] }
            : p
        ),
      }

    case ACTIONS.UPDATE_PARTNER_DEAL:
      return {
        ...state,
        partners: (state.partners ?? []).map(p =>
          p.id === payload.partnerId
            ? { ...p, deals: (p.deals ?? []).map(d => d.id === payload.deal.id ? { ...d, ...payload.deal } : d) }
            : p
        ),
      }

    case ACTIONS.DELETE_PARTNER_DEAL:
      return {
        ...state,
        partners: (state.partners ?? []).map(p =>
          p.id === payload.partnerId
            ? { ...p, deals: (p.deals ?? []).filter(d => d.id !== payload.dealId) }
            : p
        ),
      }

    // ── Phase 4: Outreach Scripts ────────────────────────────
    case ACTIONS.INIT_SCRIPTS:
      if (state.scripts) return state
      return { ...state, scripts: payload }

    case ACTIONS.ADD_SCRIPT:
      return {
        ...state,
        scripts: [...(state.scripts ?? []), { id: uid(), createdAt: now(), isCustom: true, sentHistory: [], ...payload }],
      }

    case ACTIONS.UPDATE_SCRIPT:
      return {
        ...state,
        scripts: (state.scripts ?? []).map(s => s.id === payload.id ? { ...s, ...payload } : s),
      }

    case ACTIONS.DELETE_SCRIPT:
      return { ...state, scripts: (state.scripts ?? []).filter(s => s.id !== payload.id) }

    case ACTIONS.MARK_SCRIPT_SENT:
      return {
        ...state,
        scripts: (state.scripts ?? []).map(s =>
          s.id === payload.id ? { ...s, sentHistory: [...(s.sentHistory ?? []), { sentAt: now() }] } : s
        ),
      }

    // ── Phase 4: Objection Handler ───────────────────────────
    case ACTIONS.INIT_OBJECTIONS:
      if (state.objections) return state
      return { ...state, objections: payload }

    case ACTIONS.ADD_OBJECTION:
      return {
        ...state,
        objections: [...(state.objections ?? []), { id: uid(), createdAt: now(), isCustom: true, responses: [], ...payload }],
      }

    case ACTIONS.UPDATE_OBJECTION:
      return {
        ...state,
        objections: (state.objections ?? []).map(o => o.id === payload.id ? { ...o, ...payload } : o),
      }

    case ACTIONS.DELETE_OBJECTION:
      return { ...state, objections: (state.objections ?? []).filter(o => o.id !== payload.id) }

    // ── Phase 4: Competitors ─────────────────────────────────
    case ACTIONS.ADD_COMPETITOR:
      return {
        ...state,
        competitors: [...(state.competitors ?? []), { id: uid(), createdAt: now(), talkingPoints: [], ...payload }],
      }

    case ACTIONS.UPDATE_COMPETITOR:
      return {
        ...state,
        competitors: (state.competitors ?? []).map(c => c.id === payload.id ? { ...c, ...payload } : c),
      }

    case ACTIONS.DELETE_COMPETITOR:
      return { ...state, competitors: (state.competitors ?? []).filter(c => c.id !== payload.id) }

    // ── Phase 4: GBP Optimizer ───────────────────────────────
    case ACTIONS.UPDATE_GBP_ITEM:
      return {
        ...state,
        gbpChecklist: { ...(state.gbpChecklist ?? {}), [payload.item]: { checked: payload.checked, checkedAt: payload.checked ? now() : null } },
      }

    // ── Phase 5: Certifications ──────────────────────────────
    case ACTIONS.ADD_CERTIFICATION:
      return { ...state, certifications: [...(state.certifications ?? []), { id: uid(), createdAt: now(), ...payload }] }
    case ACTIONS.UPDATE_CERTIFICATION:
      return { ...state, certifications: (state.certifications ?? []).map(c => c.id === payload.id ? { ...c, ...payload } : c) }
    case ACTIONS.DELETE_CERTIFICATION:
      return { ...state, certifications: (state.certifications ?? []).filter(c => c.id !== payload.id) }

    // ── Phase 5: Inventory ───────────────────────────────────
    case ACTIONS.ADD_INVENTORY:
      return { ...state, inventory: [...(state.inventory ?? []), { id: uid(), createdAt: now(), ...payload }] }
    case ACTIONS.UPDATE_INVENTORY:
      return { ...state, inventory: (state.inventory ?? []).map(i => i.id === payload.id ? { ...i, ...payload } : i) }
    case ACTIONS.DELETE_INVENTORY:
      return { ...state, inventory: (state.inventory ?? []).filter(i => i.id !== payload.id) }

    // ── Phase 5: Internal Docs ───────────────────────────────
    case ACTIONS.INIT_INTERNAL_DOCS:
      if (state.internalDocs) return state
      return { ...state, internalDocs: payload }
    case ACTIONS.ADD_INTERNAL_DOC:
      return { ...state, internalDocs: [...(state.internalDocs ?? []), { id: uid(), createdAt: now(), updatedAt: now(), ...payload }] }
    case ACTIONS.UPDATE_INTERNAL_DOC:
      return { ...state, internalDocs: (state.internalDocs ?? []).map(d => d.id === payload.id ? { ...d, ...payload, updatedAt: now() } : d) }
    case ACTIONS.DELETE_INTERNAL_DOC:
      return { ...state, internalDocs: (state.internalDocs ?? []).filter(d => d.id !== payload.id) }

    // ── Phase 5: Employee Onboarding ─────────────────────────
    case ACTIONS.ADD_EMPLOYEE:
      return { ...state, employees: [...(state.employees ?? []), { id: uid(), createdAt: now(), onboardingItems: {}, ...payload }] }
    case ACTIONS.UPDATE_EMPLOYEE:
      return { ...state, employees: (state.employees ?? []).map(e => e.id === payload.id ? { ...e, ...payload } : e) }
    case ACTIONS.DELETE_EMPLOYEE:
      return { ...state, employees: (state.employees ?? []).filter(e => e.id !== payload.id) }
    case ACTIONS.UPDATE_ONBOARDING_ITEM:
      return {
        ...state,
        employees: (state.employees ?? []).map(e =>
          e.id === payload.employeeId
            ? { ...e, onboardingItems: { ...e.onboardingItems, [payload.itemId]: { completed: payload.completed, completedAt: payload.completed ? now() : null } } }
            : e
        ),
      }

    // ── Phase 5: KPI Goals ───────────────────────────────────
    case ACTIONS.SET_KPI_GOAL:
      return {
        ...state,
        kpiGoals: { ...(state.kpiGoals ?? {}), [payload.month]: { ...(state.kpiGoals?.[payload.month] ?? {}), ...payload.goals } },
      }

    // ── Phase 5: Review / Social Tracker ────────────────────
    case ACTIONS.UPDATE_REVIEW_TRACKER:
      return { ...state, reviewTracker: { ...(state.reviewTracker ?? {}), ...payload } }

    // ── Phase 5: Before/After Showcase ──────────────────────
    case ACTIONS.TOGGLE_SHOWCASE:
      return {
        ...state,
        showcasePhotos: { ...(state.showcasePhotos ?? {}), [payload.photoId]: !state.showcasePhotos?.[payload.photoId] },
      }

    default:
      return state
  }
}
