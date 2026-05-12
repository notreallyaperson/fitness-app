# Exercise Tracker

Personal exercise tracker — Next.js + Supabase PWA. Log workouts on your phone, build templates, search a tagged exercise library, see per-exercise history.

## Prerequisites

- Node 20 (project pins `vite@5` and `jsdom@24` to stay on the Node-20.15 ESM/CJS path; Node 20.19+ or 22 also work).
- pnpm 9
- A Supabase project (https://supabase.com/dashboard). Local-via-Docker also works once Docker / OrbStack is installed.

## Setup (remote Supabase)

```bash
pnpm install

# Fill the four values from Supabase → Settings → API
cp .env.example .env.local

# Authenticate the CLI and link your project
pnpm exec supabase login
pnpm exec supabase link --project-ref <project-ref>

# Apply the 8 migrations to the remote DB
pnpm exec supabase db push

# Regenerate src/lib/types/database.ts from the live schema
pnpm exec supabase gen types typescript --linked > src/lib/types/database.ts

pnpm dev
```

Open http://localhost:3000.

## Setup (local Supabase, optional)

Needs Docker Desktop or OrbStack:

```bash
pnpm db:start         # pulls images on first run (~1.5 GB)
# copy the printed anon + service_role keys into .env.local
pnpm db:reset         # applies migrations + seeds
pnpm db:types
pnpm dev
```

## Common commands

| Command | What |
|---|---|
| `pnpm dev` | Run the app |
| `pnpm test` | Vitest unit + integration tests |
| `pnpm test:e2e` | Playwright (needs `.env.local` populated) |
| `pnpm db:reset` | Wipe + re-apply local DB (Docker only) |
| `pnpm db:types` | Regenerate `src/lib/types/database.ts` |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier write |

## Docs

- Spec: [`docs/superpowers/specs/2026-05-09-exercise-tracker-design.md`](docs/superpowers/specs/2026-05-09-exercise-tracker-design.md)
- Plan: [`docs/superpowers/plans/2026-05-09-exercise-tracker-phase-1.md`](docs/superpowers/plans/2026-05-09-exercise-tracker-phase-1.md)

## What's in Phase 1

- Magic-link auth, multi-user safe (RLS on every table)
- Exercise library with search, equipment filter, "what I have" preset
- Workout templates: create / rename / reorder / target sets·reps·weight·rest
- Live sessions: start from template / repeat last / fresh; add, remove, reorder, replace mid-session; metric-kind-aware set logging (weight, reps, time, distance) with RPE + warmup
- Rest timer with vibration on supported devices
- Per-exercise last-3-sessions history sheet
- Settings: units (kg/lbs, km/mi), default bodyweight, available equipment
- Installable PWA shell with read-only offline caching

## Stack

Next.js 16 (App Router, React 19, TS) · Tailwind v4 · shadcn/ui (base-nova) · Supabase (Postgres + Auth + RLS) · zod · @dnd-kit · Vitest + Playwright.
