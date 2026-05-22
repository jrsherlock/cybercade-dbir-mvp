<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Cybercade 2026-DBIR Edition. Here is a summary of all changes made:

- **`instrumentation-client.ts`** (new) — initializes `posthog-js` client-side via the Next.js 16+ instrumentation hook, with a reverse proxy, exception capture, and debug mode in development.
- **`next.config.ts`** — added PostHog reverse proxy rewrites (`/ingest/*` → `us.i.posthog.com`) and `skipTrailingSlashRedirect: true`.
- **`lib/posthog-server.ts`** (new) — singleton `getPostHogClient()` for server-side PostHog (`posthog-node`), configured for immediate flush (`flushAt: 1`, `flushInterval: 0`).
- **`components/GameMount.tsx`** — added `posthog.identify()` on anonymous Supabase auth session established, and captures for `game_started`, `wave_started`, `game_completed`, `game_over`, and `leaderboard_link_clicked`.
- **`app/api/session/route.ts`** — server-side capture of `session_created` and `session_creation_failed`.
- **`app/api/score/route.ts`** — server-side capture of `score_submitted` (with full game stats), `score_submission_rejected`, and `score_already_submitted`.

| Event | Description | File |
|---|---|---|
| `game_started` | Player clicks "Start Wave 1" or "Play again" | `components/GameMount.tsx` |
| `wave_started` | A new wave begins. Props: `wave_index`, `wave_name`, `wave_total`, `is_boss` | `components/GameMount.tsx` |
| `game_completed` | Player survives all four waves. Props: `score`, `threats_stopped`, `accuracy`, `best_streak`, `waves_cleared` | `components/GameMount.tsx` |
| `game_over` | Player is breached (trust hits 0). Same props as `game_completed` | `components/GameMount.tsx` |
| `leaderboard_link_clicked` | Player clicks "View leaderboard" from game-over overlay | `components/GameMount.tsx` |
| `session_created` | Backend creates a signed anti-cheat game session. Props: `session_id` | `app/api/session/route.ts` |
| `session_creation_failed` | Backend fails to create a game session. Props: `reason` | `app/api/session/route.ts` |
| `score_submitted` | Backend validates and persists a score. Props: `score`, `accuracy`, `best_streak`, `threats_stopped`, `waves_cleared`, `survived`, `rank`, `total` | `app/api/score/route.ts` |
| `score_submission_rejected` | Score rejected as implausible (anti-cheat). | `app/api/score/route.ts` |
| `score_already_submitted` | Duplicate score submission for an already-scored session. Props: `session_id` | `app/api/score/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1618252)
- [Daily game sessions](/insights/RBEOZHVD) — game starts per day over 30 days
- [Game completion funnel](/insights/pGsKQ5Tx) — game_started → session_created → score_submitted conversion
- [Survival vs breach rate](/insights/SQ7H5qkL) — survived vs breached outcomes over time
- [Average score per day](/insights/k7e0h17i) — average submitted score trend
- [Active players (unique users)](/insights/piYzOKCt) — daily unique players

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
