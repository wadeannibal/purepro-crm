export const STANDARD_TERMS = `TERMS & CONDITIONS

1. PAYMENT TERMS: 50% deposit due upon signing. Remaining balance due upon job completion. Invoices not paid within 30 days are subject to 1.5% monthly interest.

2. SCOPE CHANGES: Any work beyond the scope described herein will be documented and approved in writing before proceeding. Change orders will be issued for any additional work.

3. ACCESS: Client agrees to provide unobstructed access to all affected areas during scheduled work hours (7am–6pm weekdays). Delays caused by lack of access may result in schedule and pricing adjustments.

4. WARRANTY: PurePro Restoration warrants all remediation work will be performed in accordance with applicable IICRC standards. This warranty does not cover pre-existing conditions, reconstruction work, or damage caused by ongoing moisture intrusion not addressed in this scope.

5. INSURANCE: PurePro Restoration carries general liability insurance and workers' compensation. Certificate of insurance available upon request.

6. LIMITATION OF LIABILITY: PurePro Restoration's liability is limited to the value of services performed under this agreement.

By signing below, client acknowledges they have read, understood, and agreed to the full scope of work and terms above.`

export const PROPOSAL_TEMPLATES = [
  {
    id: 'mold-remediation',
    name: 'Mold Remediation',
    jobType: 'Mold',
    description: 'Standard residential/commercial mold remediation — IICRC S520 compliant',
    scopeNotes: `SCOPE OF WORK — MOLD REMEDIATION

PurePro Restoration will perform mold remediation services in accordance with IICRC S520 standards and applicable Colorado regulations.

1. CONTAINMENT & SETUP
   • Establish critical containment barriers using 6-mil poly sheeting
   • Install negative air pressure system using HEPA-filtered air scrubbers
   • Establish worker decontamination station at containment entry
   • Post safety signage and restrict access to affected areas

2. REMOVAL & REMEDIATION
   • Remove and properly dispose of all mold-affected building materials
   • HEPA vacuum all surfaces within the containment area
   • Apply EPA-registered antimicrobial treatment to all affected surfaces
   • Apply encapsulant coating to substrate surfaces as indicated
   • Double-bag, label, and remove all contaminated materials per regulations

3. CLEARANCE & DOCUMENTATION
   • Perform visual inspection upon completion of remediation
   • Coordinate post-remediation clearance testing (ERMI or air sampling)
   • Provide written clearance documentation upon passing test results
   • Deliver full job documentation package to client

4. EXCLUSIONS
   • Reconstruction and drywall replacement (available as a separate scope)
   • Pre-existing structural conditions unrelated to mold
   • Any items not specifically listed in this scope of work`,
    termsNotes: STANDARD_TERMS,
    sqftItems: [],
    equipmentItems: [
      { id: 'tpl-eq1', name: 'HEPA Air Scrubber', qty: 1, unit: 'day', unitPrice: 95 },
    ],
    labItems: [
      { id: 'tpl-lab1', description: 'Post-Remediation ERMI Test', qty: 1, unitPrice: 350 },
    ],
    materialItems: [
      { id: 'tpl-mat1', description: 'Antimicrobial Spray', qty: 2, unitPrice: 45 },
      { id: 'tpl-mat2', description: 'Encapsulant', qty: 1, unitPrice: 85 },
      { id: 'tpl-mat3', description: 'Poly Sheeting (6 mil)', qty: 2, unitPrice: 35 },
      { id: 'tpl-mat4', description: 'PPE Kit (Full Tyvek)', qty: 2, unitPrice: 28 },
    ],
    laborItems: [],
    xactimateItems: [],
  },
  {
    id: 'water-mitigation',
    name: 'Water Mitigation',
    jobType: 'Water',
    description: 'Water damage extraction and structural drying — IICRC S500 compliant',
    scopeNotes: `SCOPE OF WORK — WATER MITIGATION

PurePro Restoration will perform water mitigation and structural drying services in accordance with IICRC S500 standards.

1. INITIAL RESPONSE & EXTRACTION
   • Perform complete moisture mapping of all affected areas
   • Extract standing water using truck-mounted extraction equipment
   • Remove and dispose of saturated materials as needed (carpet pad, etc.)
   • Document pre-mitigation moisture readings with calibrated meters

2. STRUCTURAL DRYING
   • Place commercial-grade drying equipment (dehumidifiers, air movers)
   • Establish drying chamber configuration for optimal airflow
   • Monitor and record moisture readings daily using calibrated instruments
   • Adjust equipment placement based on daily drying progress
   • Document all monitoring data in a complete drying log

3. COMPLETION & DOCUMENTATION
   • Remove all equipment upon achieving IICRC S500 drying goals
   • Provide complete documentation package: moisture logs, photos, equipment records
   • Deliver damage assessment report for reconstruction bidding

4. EXCLUSIONS
   • Reconstruction, flooring replacement, or painting
   • Mold remediation (separate scope provided if mold is discovered)
   • Plumbing repairs or source correction`,
    termsNotes: STANDARD_TERMS,
    sqftItems: [],
    equipmentItems: [
      { id: 'tpl-eq1', name: 'Dehumidifier (90L)', qty: 1, unit: 'day', unitPrice: 85 },
      { id: 'tpl-eq2', name: 'Air Mover', qty: 3, unit: 'day', unitPrice: 35 },
    ],
    labItems: [],
    materialItems: [
      { id: 'tpl-mat1', description: 'Poly Sheeting (6 mil)', qty: 1, unitPrice: 35 },
      { id: 'tpl-mat2', description: 'PPE Kit', qty: 1, unitPrice: 28 },
    ],
    laborItems: [],
    xactimateItems: [],
  },
  {
    id: 'fire-smoke-restoration',
    name: 'Fire / Smoke Restoration',
    jobType: 'Fire',
    description: 'Fire and smoke damage cleaning and deodorization — IICRC S700 compliant',
    scopeNotes: `SCOPE OF WORK — FIRE / SMOKE RESTORATION

PurePro Restoration will perform fire and smoke damage restoration services in accordance with IICRC S700 standards.

1. INITIAL ASSESSMENT & SAFETY
   • Conduct thorough structural safety inspection before work begins
   • Identify and document all fire and smoke-affected areas
   • Install HEPA air filtration equipment to control smoke particulates
   • Board up or secure structure as needed to prevent further damage

2. DEBRIS REMOVAL & SURFACE CLEANING
   • Remove debris and unsalvageable materials
   • HEPA vacuum and dry-clean all affected surfaces (walls, ceilings, framing)
   • Wet-clean all hard surfaces using appropriate restoration chemicals
   • Clean and treat HVAC returns and accessible ductwork

3. DEODORIZATION
   • Apply thermal fogging or hydroxyl generator treatment for smoke odor
   • Treat all porous surfaces and building materials
   • Seal smoke-damaged surfaces with appropriate encapsulant sealants
   • Verify odor elimination prior to job close-out

4. DOCUMENTATION
   • Provide comprehensive photo documentation of all affected areas
   • Detailed scope and damage report for insurance claim submission
   • Coordinate directly with adjuster as needed

5. EXCLUSIONS
   • Reconstruction, drywall, flooring, and finish work
   • Contents pack-out and storage (available as separate service)
   • Roof tarping beyond emergency response`,
    termsNotes: STANDARD_TERMS,
    sqftItems: [],
    equipmentItems: [
      { id: 'tpl-eq1', name: 'HEPA Air Scrubber', qty: 2, unit: 'day', unitPrice: 95 },
      { id: 'tpl-eq2', name: 'Hydroxyl Generator', qty: 1, unit: 'day', unitPrice: 125 },
    ],
    labItems: [],
    materialItems: [
      { id: 'tpl-mat1', description: 'Smoke Sealer / Encapsulant', qty: 2, unitPrice: 65 },
      { id: 'tpl-mat2', description: 'Deodorizing Agent', qty: 1, unitPrice: 75 },
      { id: 'tpl-mat3', description: 'PPE Kit (Full Tyvek)', qty: 3, unitPrice: 28 },
    ],
    laborItems: [],
    xactimateItems: [],
  },
]

export const SQFT_RATE_PRESETS = {
  Mold: [
    { description: 'Demo / Material Removal', ratePerSqft: 4.50 },
    { description: 'HEPA Vacuuming', ratePerSqft: 2.50 },
    { description: 'Antimicrobial Treatment', ratePerSqft: 1.75 },
    { description: 'Encapsulant Application', ratePerSqft: 2.25 },
    { description: 'Containment Setup', ratePerSqft: 1.25 },
  ],
  Water: [
    { description: 'Water Extraction', ratePerSqft: 2.00 },
    { description: 'Structural Drying', ratePerSqft: 1.50 },
    { description: 'Drying Monitoring (per sqft/day)', ratePerSqft: 0.75 },
    { description: 'Demo / Flood Cut', ratePerSqft: 3.50 },
  ],
  Fire: [
    { description: 'Fire / Smoke Cleaning', ratePerSqft: 3.50 },
    { description: 'Deodorization Treatment', ratePerSqft: 2.00 },
    { description: 'Soot Removal', ratePerSqft: 2.75 },
    { description: 'Encapsulant Sealer', ratePerSqft: 1.50 },
  ],
}

export const EQUIPMENT_PRESETS = [
  { name: 'Dehumidifier (90L)', unitPrice: 85, unit: 'day' },
  { name: 'Dehumidifier (90L)', unitPrice: 450, unit: 'week' },
  { name: 'HEPA Air Scrubber', unitPrice: 95, unit: 'day' },
  { name: 'HEPA Air Scrubber', unitPrice: 500, unit: 'week' },
  { name: 'Air Mover', unitPrice: 35, unit: 'day' },
  { name: 'HEPA Vacuum', unitPrice: 65, unit: 'day' },
  { name: 'Hydroxyl Generator', unitPrice: 125, unit: 'day' },
  { name: 'Thermal Fogger', unitPrice: 75, unit: 'day' },
]

export const LAB_PRESETS = [
  { description: 'ERMI Test', unitPrice: 350 },
  { description: 'HERTSMI-2 Test', unitPrice: 250 },
  { description: 'Air Sampling (per sample)', unitPrice: 125 },
  { description: 'Tape Lift Sample', unitPrice: 85 },
  { description: 'Spore Trap (per sample)', unitPrice: 95 },
  { description: 'Bulk Sample Analysis', unitPrice: 75 },
]

export const LABOR_PRESETS = [
  { trade: 'Lead Technician', ratePerHour: 95 },
  { trade: 'Remediation Technician', ratePerHour: 75 },
  { trade: 'Foreman / Project Manager', ratePerHour: 110 },
  { trade: 'Laborer', ratePerHour: 55 },
  { trade: 'IH / Inspector', ratePerHour: 125 },
]

export const EXPENSE_CATEGORIES = ['Mileage', 'Fuel', 'Materials', 'Dump / Disposal', 'Subcontractor', 'Equipment Rental', 'Lab Fees', 'Other']

export const OVERHEAD_DEFAULTS = [
  { name: 'Truck Payment', amount: 800 },
  { name: 'Insurance (General Liability)', amount: 400 },
  { name: 'Workers Compensation', amount: 300 },
  { name: 'Tools & Equipment', amount: 200 },
  { name: 'Software & Subscriptions', amount: 150 },
  { name: 'Fuel', amount: 350 },
  { name: 'Phone', amount: 120 },
  { name: 'Marketing', amount: 200 },
]
