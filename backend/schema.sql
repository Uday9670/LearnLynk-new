File: backend/schema.sql

create extension if not exists pgcrypto;

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  owner_id uuid,
  team_id uuid,
  stage text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_leads_tenant_owner_stage on leads (tenant_id, owner_id, stage);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  lead_id uuid not null references leads(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_applications_tenant_lead on applications (tenant_id, lead_id);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  application_id uuid not null references applications(id) on delete cascade,
  type text not null,
  status text default 'pending',
  due_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (type in ('call','email','review')),
  check (due_at >= created_at)
);

create index if not exists idx_tasks_tenant_due_status on tasks (tenant_id, due_at, status);
