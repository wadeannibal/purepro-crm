-- Phase 3 migration — run this in your Supabase SQL Editor
-- Adds: new estimate columns (line_items, discount_pct) + proposal_templates table

-- ── 1. Add new columns to job_estimates ──────────────────────────────────────
ALTER TABLE job_estimates
  ADD COLUMN IF NOT EXISTS line_items     JSONB    NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS discount_pct   NUMERIC  NOT NULL DEFAULT 0;

-- ── 2. Create proposal_templates table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS proposal_templates (
  id           TEXT        PRIMARY KEY,
  name         TEXT        NOT NULL,
  job_type     TEXT        NOT NULL DEFAULT 'Mold',
  description  TEXT        NOT NULL DEFAULT '',
  scope_notes  TEXT        NOT NULL DEFAULT '',
  terms_notes  TEXT        NOT NULL DEFAULT '',
  line_items   JSONB       NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE proposal_templates DISABLE ROW LEVEL SECURITY;
