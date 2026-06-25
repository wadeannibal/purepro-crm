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

    default:
      return state
  }
}
