-- Phase 5 migration — run in Supabase SQL Editor
-- Adds full sync for Phase 3/4/5 modules

-- ── 1. Extend jobs table with Phase 3/4 per-job JSONB fields ─────────────────
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS moisture_readings       JSONB       NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS drying_log              JSONB       NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS portal                  JSONB,
  ADD COLUMN IF NOT EXISTS signatures              JSONB       NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS survey                  JSONB,
  ADD COLUMN IF NOT EXISTS referral_ask            JSONB,
  ADD COLUMN IF NOT EXISTS review_request          JSONB,
  ADD COLUMN IF NOT EXISTS warranty                JSONB,
  ADD COLUMN IF NOT EXISTS annual_check_in         JSONB,
  ADD COLUMN IF NOT EXISTS lead_source             TEXT,
  ADD COLUMN IF NOT EXISTS lead_source_partner_id  TEXT,
  ADD COLUMN IF NOT EXISTS lost_reason             TEXT,
  ADD COLUMN IF NOT EXISTS lost_competitor         TEXT,
  ADD COLUMN IF NOT EXISTS first_contact_date      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_contact_date       TIMESTAMPTZ;

-- ── 2. Add showcase flag to job_photos ───────────────────────────────────────
ALTER TABLE job_photos
  ADD COLUMN IF NOT EXISTS is_showcase BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 3. Scheduler Events ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                    TEXT        PRIMARY KEY,
  date                  TEXT        NOT NULL DEFAULT '',
  start_time            TEXT        NOT NULL DEFAULT '',
  end_time              TEXT        NOT NULL DEFAULT '',
  event_type            TEXT        NOT NULL DEFAULT 'Appointment',
  job_id                TEXT,
  notes                 TEXT,
  confirmation_sent     BOOLEAN     NOT NULL DEFAULT FALSE,
  confirmation_sent_at  TIMESTAMPTZ,
  reminder_sent         BOOLEAN     NOT NULL DEFAULT FALSE,
  reminder_sent_at      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- ── 4. Referral Partners ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partners (
  id                TEXT        PRIMARY KEY,
  name              TEXT        NOT NULL DEFAULT '',
  company           TEXT        NOT NULL DEFAULT '',
  type              TEXT        NOT NULL DEFAULT '',
  phone             TEXT,
  email             TEXT,
  notes             TEXT,
  last_contact_date TIMESTAMPTZ,
  contact_history   JSONB       NOT NULL DEFAULT '[]',
  deals             JSONB       NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE partners DISABLE ROW LEVEL SECURITY;

-- ── 5. Outreach Scripts ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outreach_scripts (
  id            TEXT        PRIMARY KEY,
  title         TEXT        NOT NULL DEFAULT '',
  type          TEXT        NOT NULL DEFAULT '',
  body          TEXT        NOT NULL DEFAULT '',
  is_custom     BOOLEAN     NOT NULL DEFAULT TRUE,
  sent_history  JSONB       NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE outreach_scripts DISABLE ROW LEVEL SECURITY;

-- ── 6. Objection Handler ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS objections (
  id          TEXT        PRIMARY KEY,
  objection   TEXT        NOT NULL DEFAULT '',
  responses   JSONB       NOT NULL DEFAULT '[]',
  category    TEXT        NOT NULL DEFAULT '',
  is_custom   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE objections DISABLE ROW LEVEL SECURITY;

-- ── 7. Competitor Intel ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competitors (
  id              TEXT        PRIMARY KEY,
  name            TEXT        NOT NULL DEFAULT '',
  notes           TEXT,
  strengths       TEXT,
  weaknesses      TEXT,
  talking_points  JSONB       NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE competitors DISABLE ROW LEVEL SECURITY;

-- ── 8. Certifications ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certifications (
  id            TEXT        PRIMARY KEY,
  name          TEXT        NOT NULL DEFAULT '',
  holder        TEXT        NOT NULL DEFAULT '',
  issuing_body  TEXT,
  cert_number   TEXT,
  issue_date    TEXT,
  expiry_date   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE certifications DISABLE ROW LEVEL SECURITY;

-- ── 9. Inventory ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_items (
  id             TEXT        PRIMARY KEY,
  name           TEXT        NOT NULL DEFAULT '',
  category       TEXT        NOT NULL DEFAULT '',
  unit           TEXT        NOT NULL DEFAULT '',
  qty            NUMERIC     NOT NULL DEFAULT 0,
  threshold      NUMERIC     NOT NULL DEFAULT 0,
  cost_per_unit  NUMERIC     NOT NULL DEFAULT 0,
  supplier       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;

-- ── 10. Internal Document Library ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS internal_docs (
  id          TEXT        PRIMARY KEY,
  title       TEXT        NOT NULL DEFAULT '',
  category    TEXT        NOT NULL DEFAULT '',
  content     TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE internal_docs DISABLE ROW LEVEL SECURITY;

-- ── 11. Employees ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id                TEXT        PRIMARY KEY,
  name              TEXT        NOT NULL DEFAULT '',
  role              TEXT        NOT NULL DEFAULT '',
  email             TEXT,
  phone             TEXT,
  start_date        TEXT,
  onboarding_items  JSONB       NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- ── 12. KPI Goals (one row per month 'YYYY-MM') ──────────────────────────────
CREATE TABLE IF NOT EXISTS kpi_goals (
  month  TEXT   PRIMARY KEY,
  goals  JSONB  NOT NULL DEFAULT '{}'
);
ALTER TABLE kpi_goals DISABLE ROW LEVEL SECURITY;

-- ── 13. Review Tracker (singleton) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS review_tracker (
  id    TEXT   PRIMARY KEY DEFAULT 'singleton',
  data  JSONB  NOT NULL DEFAULT '{}'
);
ALTER TABLE review_tracker DISABLE ROW LEVEL SECURITY;

-- ── 14. GBP Checklist (singleton) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gbp_checklist (
  id    TEXT   PRIMARY KEY DEFAULT 'singleton',
  data  JSONB  NOT NULL DEFAULT '{}'
);
ALTER TABLE gbp_checklist DISABLE ROW LEVEL SECURITY;
