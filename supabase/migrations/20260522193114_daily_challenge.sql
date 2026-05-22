-- Cybercade 2026-DBIR Edition — daily challenge (M5)

-- One shared seed per day; everyone faces the same shuffled run.
create table public.daily_challenges (
  challenge_date date primary key,
  seed text not null,
  content_version text not null default 'dbir-2026',
  created_at timestamptz not null default now()
);

alter table public.daily_challenges enable row level security;
-- No policies — server-mediated via the service role.

-- Tag a session when it is a daily-challenge run; the score inherits it.
alter table public.game_sessions add column challenge_date date;

-- Daily leaderboard: each player's best score on today's challenge, ranked.
create view public.daily_leaderboard as
select
  id, score, accuracy, best_streak, wave_reached, survived,
  coalesce(display_name, 'Anonymous') as display_name,
  created_at,
  row_number() over (order by score desc, created_at asc) as rank
from (
  select distinct on (player_id)
    id, player_id, score, accuracy, best_streak, wave_reached, survived,
    display_name, created_at
  from public.scores
  where validated = true and challenge_date = current_date
  order by player_id, score desc, created_at asc
) best;
