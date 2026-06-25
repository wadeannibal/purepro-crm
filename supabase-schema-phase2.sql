-- Phase 2 tables — run in Supabase SQL Editor after phase 1 schema

CREATE TABLE IF NOT EXISTS job_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Draft',
  sent_at TIMESTAMPTZ,
  template_id TEXT,
  scope_notes TEXT DEFAULT '',
  terms_notes TEXT DEFAULT '',
  sqft_items JSONB NOT NULL DEFAULT '[]',
  equipment_items JSONB NOT NULL DEFAULT '[]',
  lab_items JSONB NOT NULL DEFAULT '[]',
  material_items JSONB NOT NULL DEFAULT '[]',
  labor_items JSONB NOT NULL DEFAULT '[]',
  xactimate_items JSONB NOT NULL DEFAULT '[]',
  overhead_margin_pct NUMERIC NOT NULL DEFAULT 20,
  tax_pct NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE job_estimates DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS job_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  estimate_id UUID REFERENCES job_estimates(id),
  status TEXT NOT NULL DEFAULT 'Draft',
  due_date DATE,
  amount_total NUMERIC NOT NULL DEFAULT 0,
  payments JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE job_invoices DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS job_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  company TEXT DEFAULT '',
  claim_number TEXT DEFAULT '',
  adjuster_name TEXT DEFAULT '',
  adjuster_contact TEXT DEFAULT '',
  deductible NUMERIC DEFAULT 0,
  approved_scope TEXT DEFAULT 'pending',
  approved_amount NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE job_insurance DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS job_subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  trade TEXT DEFAULT '',
  quoted_amount NUMERIC DEFAULT 0,
  actual_amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE job_subcontractors DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS job_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE job_expenses DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS overhead_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE overhead_items DISABLE ROW LEVEL SECURITY;
