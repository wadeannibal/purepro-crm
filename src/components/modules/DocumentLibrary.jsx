import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ACTIONS } from '../../context/AppReducer'
import { BookOpen, Plus, Edit2, Trash2, X, ChevronRight, Search } from 'lucide-react'

const CATS = ['SOPs', 'safety-protocols', 'training', 'hr-onboarding', 'templates', 'reference']
const CAT_LABELS = {
  'SOPs': 'SOPs',
  'safety-protocols': 'Safety Protocols',
  'training': 'Training',
  'hr-onboarding': 'HR & Onboarding',
  'templates': 'Templates',
  'reference': 'Reference',
}

const SEED_DOCS = [
  {
    id: 'seed_1',
    title: 'Mold Remediation SOP',
    category: 'SOPs',
    description: 'Standard operating procedure for mold remediation jobs. Based on IICRC S520 and EPA guidelines.',
    updatedAt: '2026-01-15T00:00:00.000Z',
    content: `PUREPRO RESTORATION — MOLD REMEDIATION SOP
Standard: IICRC S520 / EPA Mold Remediation Guidelines

1. PRE-JOB ASSESSMENT
   • Conduct visual inspection and moisture mapping of all affected areas
   • Classify water intrusion source (Category 1: clean / Category 2: gray / Category 3: black)
   • Identify all affected materials and total square footage
   • Photograph ALL affected areas before any work begins
   • Complete liability waiver with client signature before mobilization
   • Classify job by remediation level:
     - Level 1: <10 sq ft (small isolated area)
     - Level 2: 10-100 sq ft (one wall or section)
     - Level 3: >100 sq ft (large area or multiple rooms)
     - Level 4: HVAC or attic (specialized protocol required)

2. CONTAINMENT SETUP
   • Install 6-mil poly sheeting barriers at all containment perimeters
   • Seal all HVAC registers in affected areas with poly + tape
   • Establish a two-stage decontamination zone (dirty side / clean side)
   • Set up negative air pressure machine:
     - Minimum −0.02 in. w.g. relative to adjacent spaces
     - HEPA-filtered negative air machine required on all Level 2+ jobs
     - Exhaust negative air to exterior via window or dedicated duct
   • Verify containment integrity with smoke test before remediation begins

3. PERSONAL PROTECTIVE EQUIPMENT
   • Level 1: Minimum N95 respirator, disposable gloves, safety glasses
   • Level 2 (10-100 sq ft): Half-face respirator with P100/OV cartridges, disposable coveralls, nitrile gloves
   • Level 3 (100+ sq ft): Full-face respirator with P100/OV cartridges, Tyvek suit, boot covers, double gloves
   • Category 3 water source: Add face shield regardless of remediation level
   • ALL PPE must be donned before entering containment
   • PPE must be removed in decontamination zone (not outside containment)
   • Used PPE disposed of as contaminated waste in sealed poly bags

4. REMEDIATION PROCEDURES
   • Remove all visibly contaminated porous materials:
     - Drywall: cut 12-18 inches above visible moisture line minimum
     - Insulation: remove all insulation in affected cavity
     - Carpet/pad: remove if contaminated — pad never salvageable
   • HEPA vacuum all surfaces before and after material removal
   • Wipe hard surfaces with antimicrobial-dampened cloth (EPA-registered product)
   • Apply EPA-registered antimicrobial to all affected structural surfaces
   • Allow antimicrobial dwell time per manufacturer instructions (typically 10 min)
   • Apply encapsulant to any remaining materials that cannot be removed
   • Double-bag all contaminated materials in 6-mil poly bags
   • Seal bags with tape and label "Contaminated — Mold Debris"
   • Remove bagged debris through containment without transiting living space

5. CLEARANCE TESTING
   • Do NOT remove containment before clearance — failure to test before breakdown is a protocol violation
   • Collect air samples inside containment and in adjacent spaces (control samples)
   • Also collect outdoor control sample at time of testing
   • Clearance criteria: spore counts inside containment ≤ outdoor control (within statistical range)
   • If clearance fails: re-clean all surfaces, re-HEPA vacuum, re-apply antimicrobial, re-test
   • Client is responsible for re-test fees per contract terms
   • Issue written clearance documentation upon passing

6. DOCUMENTATION REQUIRED
   • Timestamped before/after photos of all affected areas
   • Moisture readings (pre and post) at mapped locations
   • Antimicrobial product used (name, EPA registration number, dilution rate, dwell time)
   • Air sample results from clearance testing (attach lab report)
   • Signed clearance certificate to client and insurance adjuster
   • Complete all entries in PurePro CRM job record before leaving site`
  },
  {
    id: 'seed_2',
    title: 'Water Mitigation SOP',
    category: 'SOPs',
    description: 'Standard operating procedure for water damage mitigation and structural drying. Based on IICRC S500.',
    updatedAt: '2026-01-15T00:00:00.000Z',
    content: `PUREPRO RESTORATION — WATER MITIGATION SOP
Standard: IICRC S500 / IICRC S520

1. INITIAL ASSESSMENT
   • Identify and document water source:
     - Category 1 (clean): broken supply line, tub overflow, rain water
     - Category 2 (gray): dishwasher, washing machine overflow, aquarium
     - Category 3 (black): sewage, flood water, toilet overflow with feces
   • Determine water damage class:
     - Class 1: Minimal absorption — partial room, hard surfaces only
     - Class 2: Significant absorption — wet carpet, partial wall wicking
     - Class 3: High absorption — ceiling, walls, insulation, subfloor
     - Class 4: Specialty drying — hardwood, concrete, plaster
   • Category 3 water requires full PPE and mandatory removal of contaminated porous materials
   • Photograph all affected areas with moisture meter readings visible before extraction
   • Stop or isolate water source if still active

2. MOISTURE MAPPING
   • Use moisture meter to map all wet materials systematically
   • Check: drywall, baseboards, framing, flooring, subfloor, ceiling
   • Document readings with photos at consistent locations for daily tracking
   • Establish dry standard: compare to unaffected materials in same building
   • Target dry standards (approximate):
     - Drywall: <15% moisture content (MC)
     - Wood framing/subfloor: <19% MC
     - Concrete: <4% (verify with appropriate meter type)
   • Mark wet perimeter with tape or chalk for daily tracking

3. EMERGENCY EXTRACTION
   • Extract standing water with truck-mounted or portable extractor immediately
   • Remove wet carpet pad immediately — pad never dries effectively and must be replaced
   • Float and treat carpet if salvageable (Category 1 water only, within 24-48 hours)
   • Flood cut drywall to 1-2 inches ABOVE visible moisture line minimum
   • Remove wet insulation — wet batt insulation loses R-value and promotes mold growth
   • Extract from hardwood floors only — do not leave standing water under hardwood

4. EQUIPMENT PLACEMENT (IICRC S500 formula)
   • Air movers: 1 unit per 50-60 sq ft of wet floor area (minimum)
   • Dehumidifiers: 1 commercial-grade unit per 100-150 sq ft of affected space
   • Desiccant dehumidification: use for sub-40°F temps, heavy wood/plaster, or Class 4 jobs
   • Air mover placement: direct airflow along walls and under cabinets (not down into puddles)
   • Position in clockwise rotation pattern around wet perimeter
   • LGR (Low Grain Refrigerant) dehumidifiers preferred for residential drying

5. DAILY MONITORING
   • Visit daily or every other day (depending on job severity and insurance requirements)
   • Read and document moisture levels at same mapped locations each visit
   • Photograph moisture meter at reading locations — do not rely on memory
   • Adjust air mover positions based on dry-down progress
   • Target drying timeline:
     - Class 2: 3-5 days
     - Class 3: 5-7 days
     - Class 4: 7-14 days (verify with specialist)
   • Log all readings in PurePro CRM Drying Log daily
   • Contact insurance adjuster if materials are not drying within expected timeline

6. JOB COMPLETION
   • Verify all materials have reached dry standard before removing equipment
   • Collect final moisture readings in all previously wet areas
   • Photo-document final dry readings at each tracked location
   • Issue Certificate of Dryness to client and insurance adjuster
   • Recommend replacement/repair scope to client in writing
   • Complete all entries in PurePro CRM before demobilizing equipment`
  },
  {
    id: 'seed_3',
    title: 'PPE & Safety Protocol',
    category: 'safety-protocols',
    description: 'Personal protective equipment requirements and safety procedures for all job types.',
    updatedAt: '2026-01-15T00:00:00.000Z',
    content: `PUREPRO RESTORATION — PPE & SAFETY PROTOCOL
OSHA 29 CFR 1910 / IICRC Standards

1. MINIMUM PPE BY JOB TYPE
   Water Mitigation (Category 1):
   • Nitrile gloves (minimum)
   • Safety glasses or goggles
   • Non-slip, waterproof work boots

   Water Mitigation (Category 2/3):
   • Half-face respirator with P100 + organic vapor cartridges
   • Nitrile gloves (double-glove for Category 3)
   • Disposable Tyvek coveralls
   • Boot covers or dedicated rubber boots
   • Safety glasses + face shield for Category 3

   Mold Remediation (Level 1):
   • N95 or higher respirator
   • Nitrile gloves
   • Safety glasses

   Mold Remediation (Level 2):
   • Half-face respirator with P100/OV cartridges
   • Disposable coveralls (Tyvek or equivalent)
   • Nitrile gloves
   • Safety glasses

   Mold Remediation (Level 3):
   • Full-face respirator with P100/OV cartridges
   • Tyvek suit (hooded)
   • Double nitrile gloves
   • Boot covers

2. RESPIRATOR SELECTION & FIT
   • N95 (disposable): Level 1 mold, clean water jobs with minimal debris
   • Half-face with P100/OV: Level 2 mold, Category 2/3 water
   • Full-face with P100/OV: Level 3 mold, heavy chemical exposure
   • Powered Air-Purifying Respirator (PAPR): beard accommodation or extended wear
   • All reusable respirators require documented fit test (annually per OSHA 1910.134)
   • Replace P100 filters when breathing resistance increases or after 40 hours use
   • Replace OV cartridges per manufacturer schedule or when odor is detected (OV cartridges have no visible indicator)

3. DONNING AND DOFFING PROCEDURE
   DONNING (putting on PPE — do outside containment):
   1. Inspect all PPE for damage before use
   2. Don boot covers or dedicated boots
   3. Don Tyvek coveralls — zip fully, seal wrists
   4. Don first layer of gloves
   5. Don respirator and perform seal check (negative and positive pressure checks)
   6. Don safety glasses/face shield
   7. Don outer gloves

   DOFFING (removing PPE — do in decontamination zone):
   1. Remove outer gloves (fold contaminated side inward)
   2. Remove coveralls (roll downward, contaminated side inward) — do NOT pull over feet
   3. Remove boot covers (remove while still in decon zone)
   4. Remove glasses/face shield
   5. Remove respirator last — hold by straps only, do not touch facepiece
   6. Remove inner gloves
   7. Wash hands thoroughly or sanitize before exiting decon zone

4. CHEMICAL SAFETY
   • Read SDS (Safety Data Sheet) before using any antimicrobial, encapsulant, or cleaning chemical
   • SDS binders are kept in the truck — do not begin work with unfamiliar chemicals without reviewing SDS
   • Never mix antimicrobials or cleaning agents unless explicitly approved by the manufacturer
   • Provide adequate ventilation when applying liquid or spray antimicrobials
   • Dispose of chemical containers per local regulations — do not pour down drains

5. SITE SAFETY
   • Inspect site for electrical hazards before introducing water extraction equipment
   • Turn off electricity to affected areas at breaker before extracting water — coordinate with client
   • Do not enter structural spaces (attics, crawlspaces) without informing supervisor
   • Inspect ceiling areas for water load before working below — sagging ceiling = evacuate area
   • Never work alone in confined spaces — notify supervisor before entering any crawlspace
   • Emergency contacts posted in company vehicle glove box and on all technician phones

6. INCIDENT REPORTING
   • Any injury, near-miss, chemical exposure, or equipment malfunction must be reported to Wade same day
   • Do not delay injury reporting — even minor cuts or strains
   • Photograph any site conditions that contributed to an incident
   • Client property damage: photograph immediately and contact Wade before continuing work`
  },
  {
    id: 'seed_4',
    title: 'New Technician Onboarding Checklist',
    category: 'hr-onboarding',
    description: 'Four-week structured onboarding checklist for new restoration technicians. Reference doc for Employee Onboarding module.',
    updatedAt: '2026-01-15T00:00:00.000Z',
    content: `PUREPRO RESTORATION — NEW TECHNICIAN ONBOARDING
4-Week Structured Program

PURPOSE
This checklist ensures every PurePro technician receives consistent, thorough training before working independently. Completion is tracked in the Employee Onboarding module of PurePro CRM.

WEEK 1 — ADMIN & PAPERWORK
□ Complete new-hire paperwork: I-9, W-4, direct deposit authorization
□ Review and sign employment agreement
□ Company overview and mission briefing with Wade
□ Review Employee Handbook and all HR policies
□ OSHA 10 training (online or in-person) — verify current card if already held
□ Read and acknowledge: Water Mitigation SOP
□ Read and acknowledge: Mold Remediation SOP
□ Read and acknowledge: PPE & Safety Protocol
□ Set up company phone and PurePro CRM app access
□ Vehicle inspection sign-off and equipment orientation (air movers, dehumidifiers, extractors, moisture meters)

WEEK 2 — SHADOWING & FIELD ORIENTATION
□ Shadow on minimum 3 active job sites across different job types
□ Observe full equipment setup and teardown (air movers, dehumidifiers, negative air)
□ Observe moisture mapping and daily drying log documentation
□ Observe client communication: intro, scope explanation, sign-off procedure
□ Observe containment setup and teardown for a mold remediation job
□ Review Job Site Safety Checklist with supervisor on-site
□ Complete PPE donning/doffing competency check — must be signed off by supervisor
□ Review PurePro estimating and proposal process (walk through Estimator in CRM)
□ Shadow one complete estimate walkthrough with client present

WEEK 3 — SUPERVISED FIELD WORK
□ Lead equipment setup and teardown under supervision (supervisor present, not directing)
□ Perform moisture readings independently and document in PurePro CRM Drying Log
□ Complete containment setup for mold job under direct supervision
□ Apply antimicrobial treatment under supervision — follow SOP exactly
□ Complete daily drying log entries for 3+ assigned jobs independently
□ Conduct one client update call with supervisor listening (can interject if needed)
□ Practice estimate walkthrough: supervisor observes and debrief after
□ Complete liability waiver process and obtain client signature independently
□ Mid-point 30-minute performance check-in with Wade

WEEK 4 — CERTIFICATION ENROLLMENT & INDEPENDENCE
□ Register for IICRC WRT (Water Restoration Technician) course
□ Register for IICRC ASD (Applied Structural Drying) course
□ Register for IICRC AMRT (Applied Microbial Remediation Technician) course
□ Review Certification Tracker in PurePro CRM — understand renewal schedule
□ Complete one full solo job assignment (supervisor available by phone only)
□ Final 45-minute performance evaluation with Wade
□ Complete and sign 30-day onboarding summary
□ Set 90-day goals with supervisor

CERTIFICATION SCHEDULE
• IICRC WRT: Complete within 90 days of hire
• IICRC ASD: Complete within 6 months of hire
• IICRC AMRT: Complete within 9 months of hire
• OSHA 10: Required before Week 2 field work
• OSHA 30: Target within 12 months of hire`
  },
  {
    id: 'seed_5',
    title: 'Job Site Safety Checklist',
    category: 'safety-protocols',
    description: 'Pre-work safety checklist to complete before beginning any water damage or mold remediation job.',
    updatedAt: '2026-01-15T00:00:00.000Z',
    content: `PUREPRO RESTORATION — JOB SITE SAFETY CHECKLIST
Complete before beginning work on every job.

PRE-ENTRY ASSESSMENT
□ Identify and document water source before entering (active leak? stopped?)
□ Check ceiling condition — any visible sag, bulge, or water load above?
□ Check for structural damage: soft floors, compromised walls
□ Identify electrical panel location and shut off power to affected areas
□ Confirm gas lines are not affected (flooding near gas appliances = call utility company)
□ Identify nearest emergency exit from each area you will work in
□ Note pets, children, or vulnerable occupants — coordinate safe separation

PPE CHECK
□ All required PPE for this job type is on-hand and undamaged
□ Respirator fit check performed (negative and positive pressure check)
□ Coveralls zipped and sealed at wrists and ankles
□ Gloves properly donned — no tears or punctures
□ Boots appropriate for conditions (waterproof if extracting)

EQUIPMENT SAFETY
□ All electrical equipment inspected for damaged cords or housing
□ Extension cords rated for amperage of equipment being used
□ GFCI outlets used or GFCI extension cord in use (required near water)
□ Dehumidifier drain hose secured and directed away from electrical equipment
□ Negative air machine exhaust directed to exterior — not into another room

CONTAINMENT VERIFICATION (MOLD JOBS)
□ 6-mil poly sheeting on all containment walls — floor to ceiling
□ Poly sheeting taped at seams and all penetrations
□ HVAC registers sealed in contained area
□ Negative air machine running before any disturbance of mold material
□ Decontamination zone established and clearly marked
□ Entry/exit flap secured — one-direction airflow maintained

DURING-WORK CHECKS (perform at every 2-hour interval)
□ Negative air machine still running and exhausting properly
□ No containment breaches — inspect poly sheeting integrity
□ PPE still properly worn by all technicians on site
□ No food, drink, or phone use inside containment
□ Contaminated waste bags sealed and staged for removal

END-OF-DAY CLOSE-OUT
□ All contaminated materials double-bagged and sealed
□ Equipment secure and not a trip/fall hazard for client overnight
□ All containment integrity maintained — no breaches that could allow spores to spread
□ Client informed of current status and next visit date
□ PurePro CRM job record updated with today's moisture readings and activities
□ Any safety concerns or incidents reported to Wade before leaving site`
  },
]

const BLANK = { title: '', category: 'SOPs', description: '', content: '' }

export default function DocumentLibrary() {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [editId, setEditId] = useState(null)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [filterCat, setFilterCat] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!state.internalDocs) {
      dispatch({ type: ACTIONS.INIT_INTERNAL_DOCS, payload: SEED_DOCS })
    }
  }, [])

  const docs = state.internalDocs ?? SEED_DOCS

  const filtered = docs.filter(d => {
    const matchCat = filterCat === 'all' || d.category === filterCat
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const save = () => {
    if (!form.title) return
    if (editId) {
      dispatch({ type: ACTIONS.UPDATE_INTERNAL_DOC, payload: { id: editId, ...form } })
      setEditId(null)
    } else {
      dispatch({ type: ACTIONS.ADD_INTERNAL_DOC, payload: form })
    }
    setForm(BLANK)
    setShowForm(false)
  }

  const startEdit = (d) => {
    setForm({ title: d.title, category: d.category, description: d.description, content: d.content ?? '' })
    setEditId(d.id)
    setSelectedDoc(null)
    setShowForm(true)
  }

  const del = (id) => {
    if (id.startsWith('seed_')) return
    if (window.confirm('Delete this document?')) {
      dispatch({ type: ACTIONS.DELETE_INTERNAL_DOC, payload: { id } })
      if (selectedDoc?.id === id) setSelectedDoc(null)
    }
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  if (selectedDoc) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedDoc(null)} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
              <ChevronRight size={14} className="rotate-180" /> Library
            </button>
            <div className="flex-1">
              <h2 className="text-base font-bold text-gray-900">{selectedDoc.title}</h2>
              <div className="text-xs text-gray-400 mt-0.5">
                {CAT_LABELS[selectedDoc.category] ?? selectedDoc.category} · Updated {new Date(selectedDoc.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(selectedDoc)} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-semibold px-3 py-1.5 rounded-xl hover:bg-gray-50">
                <Edit2 size={12} /> Edit
              </button>
            </div>
          </div>
          {selectedDoc.description && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 italic">{selectedDoc.description}</div>
          )}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{selectedDoc.content}</pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookOpen size={18} className="text-red-500" /> Document Library
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">SOPs, safety protocols, training docs, and HR materials.</p>
          </div>
          <button onClick={() => { setForm(BLANK); setEditId(null); setShowForm(s => !s) }}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl">
            <Plus size={14} /> New Doc
          </button>
        </div>

        {showForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-blue-900">{editId ? 'Edit Document' : 'New Document'}</h3>
              <button onClick={() => { setShowForm(false); setEditId(null) }}><X size={16} className="text-blue-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Title</label>
                <input value={form.title} onChange={e => f('title', e.target.value)} placeholder="e.g. Water Mitigation SOP"
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Category</label>
                  <select value={form.category} onChange={e => f('category', e.target.value)}
                    className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {CATS.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Description</label>
                  <input value={form.description} onChange={e => f('description', e.target.value)} placeholder="One-line summary"
                    className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Content</label>
                <textarea value={form.content} onChange={e => f('content', e.target.value)} rows={10}
                  placeholder="Full document content..."
                  className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl">
                {editId ? 'Save Changes' : 'Add Document'}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null) }} className="bg-white border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        {/* Search + filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', ...CATS].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors
                ${filterCat === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
              {c === 'all' ? 'All' : CAT_LABELS[c]}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-white border border-gray-200 rounded-2xl px-5 py-4 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                  <div className="font-semibold text-gray-900 text-sm hover:text-red-600 transition-colors">{doc.title}</div>
                  {doc.description && <div className="text-xs text-gray-500 mt-0.5 truncate">{doc.description}</div>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{CAT_LABELS[doc.category] ?? doc.category}</span>
                    <span className="text-[10px] text-gray-400">Updated {new Date(doc.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(doc)} className="p-1.5 text-gray-400 hover:text-gray-700"><Edit2 size={13} /></button>
                  {!doc.id.startsWith('seed_') && (
                    <button onClick={() => del(doc.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                  )}
                  <button onClick={() => setSelectedDoc(doc)} className="p-1.5 text-gray-400 hover:text-gray-700"><ChevronRight size={13} /></button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">No documents match your search.</div>
          )}
        </div>
      </div>
    </div>
  )
}
