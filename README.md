# Cybercade — 2026-DBIR Edition

A real-time arcade game built on the Verizon **2026 Data Breach Investigations
Report (DBIR)**. Players act as the "human firewall" of a company — spotting
real threats among legit decoys and stopping them before they breach.

Built by **Cybercade** (a ProCircular brand) as a marketing experience for
conference booths, hosted live events, and an always-on website.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** + **Tailwind 4**
- **Phaser 4** — the game engine (client-only, dynamically imported)
- **Supabase** — Postgres, Auth (anonymous), Realtime, Edge Functions
- **Vercel** — hosting
- **Vitest** — unit tests (the shared scoring module)

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the Supabase keys
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `pnpm dev` — dev server
- `pnpm build` — production build
- `pnpm test` — run unit tests
- `pnpm lint` — lint

## Roadmap

Phase 1 (Solo-web MVP) is built in milestones M0–M6; Phase 2 adds the live,
Kahoot-style host mode. See the project plan for detail.
