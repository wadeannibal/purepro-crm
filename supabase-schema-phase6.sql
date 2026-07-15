-- Phase 6 migration — run in Supabase SQL Editor
-- Adds follow-up tracking columns to job_estimates

ALTER TABLE job_estimates
  ADD COLUMN IF NOT EXISTS follow_up_count   INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_follow_up_at TIMESTAMPTZ;
