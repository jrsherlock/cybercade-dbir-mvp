-- Cybercade 2026-DBIR Edition — leads (M4)
-- Captured when a player requests their personalized Human Risk Profile.
-- Contains PII: RLS is on with no policies, so only server routes (service
-- role) may read or write. The marketing team exports via the dashboard.

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players (id) on delete set null,
  name text,
  email text not null,
  company text,
  -- individual | team-lead | security
  audience_segment text not null default 'individual',
  -- cybercade | procircular
  cta_target text not null default 'cybercade',
  archetype text,
  score int,
  accuracy real,
  waves_cleared int,
  survived boolean,
  -- the full generated scorecard (category breakdown, AI blurb, etc.)
  scorecard jsonb,
  created_at timestamptz not null default now()
);

create index leads_email_idx on public.leads (email);
create index leads_created_idx on public.leads (created_at desc);

alter table public.leads enable row level security;
-- No policies — leads are PII; access is server-mediated via the service role.
