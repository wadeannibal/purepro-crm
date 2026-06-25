-- PurePro CRM — Supabase Schema
-- Run this entire file in your Supabase SQL Editor

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'Homeowner',
  email text,
  phone text,
  address text,
  is_vip boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  type text not null,
  stage text not null default 'Lead',
  revenue numeric not null default 0,
  address text,
  description text,
  checklist jsonb not null default '{}',
  osha_checklist jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists job_notes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists job_waivers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  signed_by text not null,
  signed_date date,
  notes text
);

create table if not exists job_time_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  clock_in timestamptz not null,
  clock_out timestamptz,
  duration integer,
  notes text
);

create table if not exists job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  name text not null,
  storage_path text not null,
  room text,
  photo_type text,
  created_at timestamptz not null default now()
);

create table if not exists job_documents (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  name text not null,
  doc_type text,
  file_type text,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  serial_number text,
  job_id uuid references jobs(id) on delete set null,
  placed_date date,
  pickup_date date,
  status text not null default 'available'
);

create table if not exists communications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  type text not null,
  date timestamptz not null default now(),
  notes text,
  duration integer,
  job_id uuid references jobs(id) on delete set null
);

-- Disable RLS for now (enable + add policies when auth is added in a later phase)
alter table clients disable row level security;
alter table jobs disable row level security;
alter table job_notes disable row level security;
alter table job_waivers disable row level security;
alter table job_time_logs disable row level security;
alter table job_photos disable row level security;
alter table job_documents disable row level security;
alter table equipment disable row level security;
alter table communications disable row level security;
