-- Phase 4 migration — run this in your Supabase SQL Editor
-- Adds: company_settings table + line_item_library table

-- ── 1. Company Settings (singleton row) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_settings (
  id              TEXT        PRIMARY KEY DEFAULT 'singleton',
  company_name    TEXT        NOT NULL DEFAULT '',
  owner_name      TEXT        NOT NULL DEFAULT '',
  phone           TEXT        NOT NULL DEFAULT '',
  email           TEXT        NOT NULL DEFAULT '',
  city            TEXT        NOT NULL DEFAULT '',
  license_number  TEXT        NOT NULL DEFAULT '',
  website         TEXT        NOT NULL DEFAULT '',
  logo            TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;

-- ── 2. Custom Line Item Library ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS line_item_library (
  id          TEXT        PRIMARY KEY,
  category    TEXT        NOT NULL DEFAULT '',
  name        TEXT        NOT NULL DEFAULT '',
  unit        TEXT        NOT NULL DEFAULT '',
  unit_price  NUMERIC     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE line_item_library DISABLE ROW LEVEL SECURITY;
