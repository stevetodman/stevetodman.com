-- StudyHub cloud-save schema.
-- The browser never receives database credentials. The Edge Function connects
-- directly to Postgres and is the only application path that should touch this schema.

create schema if not exists studyhub;

revoke all on schema studyhub from public;
revoke all on schema studyhub from anon;
revoke all on schema studyhub from authenticated;

create table if not exists studyhub.saves (
  token_hash text primary key,
  data jsonb not null default '{}'::jsonb,
  revision bigint not null default 0,
  updated_at timestamptz not null default now(),
  constraint studyhub_saves_token_hash_sha256 check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint studyhub_saves_revision_nonnegative check (revision >= 0)
);

alter table studyhub.saves enable row level security;

revoke all on table studyhub.saves from public;
revoke all on table studyhub.saves from anon;
revoke all on table studyhub.saves from authenticated;

-- No anon/authenticated policies are created intentionally. Direct browser CRUD
-- is not part of the design. The deployed Edge Function uses SUPABASE_DB_URL.

comment on schema studyhub is 'Private StudyHub family cloud-save data';
comment on table studyhub.saves is 'One merged save document per high-entropy family token hash';
comment on column studyhub.saves.token_hash is 'SHA-256 hash of the client-held family token; plaintext token is never stored';
comment on column studyhub.saves.revision is 'Monotonic write revision used for concurrency visibility';
