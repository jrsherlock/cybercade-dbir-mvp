-- Cybercade 2026-DBIR Edition — initial schema (M3)
-- Players, play sessions, scores, and the leaderboard view.
-- All table access is mediated by server API routes using the service role;
-- RLS is enabled with no policies, so anon/authenticated clients cannot touch
-- these tables directly.

-- One row per player. id matches the Supabase Auth user (anonymous-first).
create table public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  device_id text,
  display_name text,
  streak_count int not null default 0,
  last_played_date date,
  total_xp bigint not null default 0,
  created_at timestamptz not null default now()
);

-- One row per game a player starts. Backs the signed-session anti-cheat flow.
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  mode text not null default 'solo',
  seed text not null,
  content_version text not null default 'dbir-2026',
  status text not null default 'active', -- active | scored | abandoned
  started_at timestamptz not null default now()
);

-- One validated score per completed session.
create table public.scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.game_sessions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  score int not null,
  accuracy real not null,
  best_streak int not null,
  threats_stopped int not null,
  wave_reached int not null,
  survived boolean not null default false,
  display_name text,
  challenge_date date,
  validated boolean not null default false,
  created_at timestamptz not null default now()
);

create index scores_score_idx on public.scores (score desc);
create index scores_created_idx on public.scores (created_at desc);
create index game_sessions_player_idx on public.game_sessions (player_id);

-- RLS on, no policies: every read/write goes through a server route using the
-- service role, which bypasses RLS. Direct client access is fully denied.
alter table public.players enable row level security;
alter table public.game_sessions enable row level security;
alter table public.scores enable row level security;

-- Global leaderboard over validated scores, pre-ranked.
create view public.leaderboard as
select
  s.id,
  s.score,
  s.accuracy,
  s.best_streak,
  s.threats_stopped,
  s.wave_reached,
  s.survived,
  coalesce(s.display_name, 'Anonymous') as display_name,
  s.created_at,
  row_number() over (order by s.score desc, s.created_at asc) as rank
from public.scores s
where s.validated = true;
