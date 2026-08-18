-- Steven OS canonical control-plane state store.
-- Intentionally private: no direct browser/Data API access.
create schema if not exists steven_os;
revoke all on schema steven_os from public;
revoke all on schema steven_os from anon, authenticated;

create table if not exists steven_os.projects (
  id text primary key,
  name text not null,
  objective text not null,
  status text not null check (status in ('active','paused','blocked','complete','parked')),
  priority integer not null default 100,
  risk_level text not null default 'medium',
  repository_full_name text,
  production_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists steven_os.work_items (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references steven_os.projects(id) on delete cascade,
  external_system text,
  external_id text,
  kind text not null,
  title text not null,
  state text not null,
  owner_class text not null check (owner_class in ('steven','execution','external')),
  acceptance_criteria jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (external_system, external_id)
);

create table if not exists steven_os.decisions (
  id uuid primary key default gen_random_uuid(),
  project_id text references steven_os.projects(id) on delete cascade,
  title text not null,
  question text not null,
  recommendation jsonb,
  alternatives jsonb not null default '[]'::jsonb,
  state text not null default 'open' check (state in ('open','decided','superseded')),
  consequence text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists steven_os.sources (
  id uuid primary key default gen_random_uuid(),
  source_system text not null,
  external_id text not null,
  source_url text,
  source_sha text,
  observed_at timestamptz not null default now(),
  payload_hash text,
  metadata jsonb not null default '{}'::jsonb,
  unique (source_system, external_id, source_sha)
);

create table if not exists steven_os.events (
  id uuid primary key default gen_random_uuid(),
  project_id text references steven_os.projects(id) on delete cascade,
  source_id uuid references steven_os.sources(id) on delete set null,
  event_type text not null,
  external_event_id text,
  occurred_at timestamptz not null,
  observed_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  unique (source_id, external_event_id)
);

create table if not exists steven_os.evidence (
  id uuid primary key default gen_random_uuid(),
  project_id text references steven_os.projects(id) on delete cascade,
  work_item_id uuid references steven_os.work_items(id) on delete cascade,
  source_id uuid references steven_os.sources(id) on delete set null,
  claim text not null,
  status text not null check (status in ('pass','fail','blocked','unknown','informational')),
  evidence_type text not null,
  observed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists steven_os.agent_runs (
  id uuid primary key default gen_random_uuid(),
  project_id text references steven_os.projects(id) on delete set null,
  agent_role text not null,
  task_class text not null,
  state text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  result jsonb,
  error jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists steven_os.model_registry (
  id text primary key,
  provider_id text not null,
  model_id text not null,
  capabilities jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, model_id)
);

create table if not exists steven_os.model_runs (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid references steven_os.agent_runs(id) on delete set null,
  model_registry_id text references steven_os.model_registry(id) on delete set null,
  provider_id text not null,
  model_id text not null,
  task_class text not null,
  capabilities jsonb not null default '{}'::jsonb,
  latency_ms integer,
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric(12,6),
  evaluator_score numeric(8,4),
  revision_count integer not null default 0,
  accepted boolean,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists work_items_project_state_idx on steven_os.work_items(project_id, state);
create index if not exists decisions_state_idx on steven_os.decisions(state, created_at desc);
create index if not exists sources_observed_idx on steven_os.sources(source_system, observed_at desc);
create index if not exists events_project_time_idx on steven_os.events(project_id, occurred_at desc);
create index if not exists evidence_project_time_idx on steven_os.evidence(project_id, observed_at desc);
create index if not exists model_runs_task_model_idx on steven_os.model_runs(task_class, provider_id, model_id, created_at desc);

-- Cover foreign keys used by cleanup, joins, and cascade operations.
create index if not exists agent_runs_project_idx on steven_os.agent_runs(project_id);
create index if not exists decisions_project_idx on steven_os.decisions(project_id);
create index if not exists evidence_source_idx on steven_os.evidence(source_id);
create index if not exists evidence_work_item_idx on steven_os.evidence(work_item_id);
create index if not exists model_runs_agent_run_idx on steven_os.model_runs(agent_run_id);
create index if not exists model_runs_registry_idx on steven_os.model_runs(model_registry_id);
