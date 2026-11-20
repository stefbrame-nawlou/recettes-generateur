create table if not exists public.family_state (
  id integer primary key check (id = 1),
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.family_state enable row level security;
revoke all on public.family_state from anon, authenticated;
grant all on public.family_state to service_role;
