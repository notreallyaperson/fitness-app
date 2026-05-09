# Exercise Tracker — Design Spec

- **Date:** 2026-05-09
- **Status:** Approved (brainstorming) — pending implementation plan
- **Owner:** avinash@qworky.tech

## 1. Overview

A web-based personal exercise tracker, built as a Progressive Web App (PWA), used primarily on phone in the gym. Multi-user from day 1 (the schema and auth assume many users; only the owner uses it at first). Lets the user search exercises, build reusable workout templates, log live sessions with full mid-session editability, review per-exercise history, track body stats over time, summarise effort across periods, and (eventually) ask Claude to recommend a workout based on history.

## 2. Goals & non-goals

### Goals
- Fast set logging on phone, mid-workout.
- Per-exercise volume formulas that match how the exercise is actually performed.
- A clean separation between the exercise library, reusable templates, and live sessions.
- Multi-user safety from day 1 via Postgres row-level security.
- A path to AI-suggested workouts that uses each user's own Anthropic API key, never exposed to the browser.

### Non-goals (Phase 1)
- Native iOS/Android apps.
- Offline-write with conflict resolution. (PWA installs and shows cached UI; mutations require connectivity.)
- Social features, sharing, public feeds.
- Wearable integrations (Apple Health, Garmin, etc.).
- Push notifications / reminders.
- Progress photos.

## 3. Phasing

| Phase | Scope |
|---|---|
| **1 (MVP)** | Auth + profiles; exercise library + search; muscle tags on exercises (data only); workout templates; live sessions (start from template / repeat-last / fresh); set logging with weight/reps/time/distance/RPE; warmup marker; rest timer; per-exercise last-3 history; reorder exercises; edit session date; per-set / per-exercise / per-session notes; units toggle (kg/lbs, km/mi). |
| **2** | Body measurements (weight, height, body-fat %) tracked over time, with charts. |
| **3** | Weekly / monthly summaries; total effort (volume) computed via per-exercise formulas; period filters. |
| **4** | Claude-powered workout recommendations using the user's BYO Anthropic API key. |

Each phase ships independently.

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (PWA, installable)                                 │
│  Next.js App Router — React + TS — Tailwind + shadcn/ui     │
│  Service worker: installability + read-only offline shell   │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────────────────────────────┐
│  Next.js Server (Vercel)                                    │
│  • Server Actions  → CRUD on sessions, sets, templates, ... │
│  • Route Handlers                                           │
│      /api/recommend → Anthropic SDK (Phase 4)               │
└────────┬─────────────────────────────────┬──────────────────┘
         │ supabase-js                     │ Anthropic SDK
         ▼                                 ▼
┌─────────────────────────┐    ┌───────────────────────────┐
│  Supabase                │    │  Anthropic API (Phase 4)  │
│  • Postgres + RLS        │    │  Claude (Opus 4.7 default,│
│  • Auth (email + OAuth)  │    │   Sonnet 4.6 cost option) │
│  • pgcrypto for secrets  │    └───────────────────────────┘
└─────────────────────────┘
```

### Tech choices
- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind + shadcn/ui.
- **Backend:** Supabase (Postgres, Auth, RLS). No custom backend service to operate.
- **Hosting:** Vercel (Next.js); Supabase managed.
- **Secrets:** Anthropic API keys stored encrypted in `user_secrets` via `pgcrypto.pgp_sym_encrypt`. Encryption key in Vercel env (`SECRETS_KEY`). Decryption only inside server route handlers.
- **AI:** Anthropic Node SDK; prompt caching (`cache_control: { type: "ephemeral" }`) on stable blocks; tool use to enforce JSON schema; implementation will follow the `claude-api` skill.

### Security model
- Every user-owned table has RLS: `USING (user_id = auth.uid())`.
- `exercises` table allows global rows (`owner_user_id IS NULL`) visible to all, plus per-user private rows.
- Anthropic API key is never sent to the browser. It is decrypted only inside the `/api/recommend` request lifecycle.

## 5. Data model

All Phase 1 unless noted. Timestamps (`created_at`, `updated_at`) on every table.

### `profiles`
Extends `auth.users` 1:1.
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | FK → `auth.users.id` |
| `display_name` | text | |
| `units_weight` | enum `'kg' \| 'lbs'` | default `'kg'` |
| `units_distance` | enum `'km' \| 'mi'` | default `'km'` |
| `default_bodyweight` | numeric | most-recent bodyweight cache |

### `exercises` — library
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `owner_user_id` | uuid NULL | NULL = system/global; non-null = user-private |
| `name` | text | |
| `description` | text | |
| `metric_kind` | enum (see §6) | drives logging UI + volume formula |
| `default_rest_seconds` | int | default rest between sets |
| `primary_muscle` | enum `muscle_group` | (Phase 1 data; UI in Phase 2) |
| `secondary_muscles` | enum `muscle_group`[] | array |
| `is_archived` | bool | default false |

### `workout_templates`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | RLS scope |
| `name` | text | |
| `notes` | text | |

### `workout_template_exercises`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `template_id` | uuid | FK |
| `exercise_id` | uuid | FK |
| `position` | int | ordering |
| `target_sets` | int NULL | |
| `target_reps` | int NULL | |
| `target_weight` | numeric NULL | in user's `units_weight` at time |
| `target_time_seconds` | int NULL | |
| `target_distance` | numeric NULL | |
| `target_distance_unit` | text NULL | `'m' \| 'km' \| 'mi'` |
| `rest_seconds` | int NULL | overrides exercise default |
| `notes` | text | |

### `sessions`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | RLS scope |
| `template_id` | uuid NULL | NULL for ad-hoc / repeat-last |
| `name` | text | copied from template, editable |
| `performed_on` | date | **user-editable** — answers "update session date" |
| `started_at` | timestamptz | actual start (preserved on date edit) |
| `ended_at` | timestamptz NULL | |
| `bodyweight` | numeric NULL | captured at start; used for bodyweight volume |
| `notes` | text | |

### `session_exercises`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | uuid | FK |
| `exercise_id` | uuid | FK |
| `position` | int | reorder = update position |
| `notes` | text | |

### `sets`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `session_exercise_id` | uuid | FK |
| `position` | int | set number within exercise |
| `is_warmup` | bool | excluded from volume calc |
| `reps` | int NULL | |
| `weight` | numeric NULL | |
| `weight_unit` | text NULL | `'kg' \| 'lbs'` — captured at log time |
| `time_seconds` | numeric NULL | |
| `distance` | numeric NULL | |
| `distance_unit` | text NULL | `'m' \| 'km' \| 'mi'` |
| `rpe` | numeric NULL | 1–10, optional |
| `notes` | text | |
| `completed_at` | timestamptz | |

### `user_secrets` — Phase 4
| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid PK | |
| `anthropic_api_key_encrypted` | bytea | `pgp_sym_encrypt(key, env.SECRETS_KEY)` |
| `preferred_model` | text | default `'claude-opus-4-7'` |

### `body_measurements` — Phase 2
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | RLS scope |
| `measured_on` | date | |
| `weight` | numeric NULL | |
| `height` | numeric NULL | |
| `body_fat_pct` | numeric NULL | |
| `notes` | text | |

### Enums
- `muscle_group`: `chest, back, lats, traps, lower_back, shoulders, biceps, triceps, forearms, quads, hamstrings, glutes, calves, abs, obliques, neck, full_body, cardio`.
- `metric_kind`: `weight_reps, bodyweight_reps, weighted_bodyweight_reps, time_only, time_weight, distance_only, distance_time, none`.

### RLS policies (Phase 1)
- `profiles, workout_templates, workout_template_exercises (via template), sessions, session_exercises (via session), sets (via session_exercise), user_secrets, body_measurements`: `USING (user_id = auth.uid())`.
- `exercises`: `USING (owner_user_id IS NULL OR owner_user_id = auth.uid())`. Inserts: enforce `owner_user_id = auth.uid()`.

## 6. Effort / volume model

Each exercise has a `metric_kind` that determines (a) which fields appear when logging a set, (b) the volume formula applied to that set.

| `metric_kind` | Fields shown | Volume per set |
|---|---|---|
| `weight_reps` | weight, reps | `weight × reps` |
| `bodyweight_reps` | reps | `session.bodyweight × reps` |
| `weighted_bodyweight_reps` | weight, reps | `(session.bodyweight + weight) × reps` |
| `time_only` | time | `0` |
| `time_weight` | weight, time | `weight × time_seconds / 60` |
| `distance_only` | distance | `session.bodyweight × distance` |
| `distance_time` | distance, time | `session.bodyweight × distance` |
| `none` | (none) | `0` |

- Volume is computed in a SQL view, not stored — formulas can change without backfills, and editing `session.bodyweight` after the fact recomputes everything automatically.
- Warmup sets (`is_warmup = true`) are excluded from volume aggregations.
- Unit normalisation: a weight stored as `lbs` is converted to `kg` before summing in the canonical view; the UI converts back to user's preferred unit at render time.

## 7. Key user flows

### A. Live session screen
Mobile-first. Exercises listed in `position` order; the "active" one (next un-logged set) is auto-expanded. Set logging accepts whichever fields the exercise's `metric_kind` requires. Logging a set starts a rest timer using `template_exercise.rest_seconds → exercise.default_rest_seconds`. The timer vibrates and plays a sound at zero (PWA Vibration API + audio).

Per-exercise menu: **Replace, Remove, Reorder, Add note, Mark as warmup**.

### B. Replace exercise mid-session
- **No sets logged on this exercise yet:** swap cleanly — replace the `session_exercise.exercise_id`.
- **Sets already logged:** confirmation dialog warns logged sets will be discarded; suggests using "Add exercise" instead. No silent data loss.

### C. Start a session — three entry points
1. **From template:** clones `workout_template_exercises` into `session_exercises`, copying targets.
2. **Repeat last session:** finds the user's latest session, clones its `session_exercises`. Targets are copied (so user can apply progressive overload manually); logged sets are NOT copied.
3. **Fresh:** empty session.

In all three, the user is prompted (skippable) to log bodyweight at session start.

### D. Per-exercise history
From an exercise (in library, template, or session), open a sheet showing the last 3 sessions of that exercise: date, all sets (warmups dimmed), RPE range. Query: join `sessions → session_exercises → sets`, filter `exercise_id`, `user_id = auth.uid()`, order `performed_on DESC`, limit 3.

### E. Reorder & edit session date
- Drag handle → updates `position`.
- Tap header date → date picker → updates `performed_on`. `started_at` and `ended_at` are not modified, so duration stays accurate.

## 8. AI recommendation flow (Phase 4)

```
User clicks "Recommend a workout"
   │  (optional constraints: time budget, muscle focus, equipment, gym/home)
   ▼
POST /api/recommend
   1. Verify Supabase session
   2. Fetch (server-side):
      • last 8 sessions with exercises, sets, RPE, dates
      • per-muscle volume over last 4 weeks (uses muscle tags from §5)
      • user's exercise library (id, name, metric_kind)
   3. Decrypt user_secrets.anthropic_api_key_encrypted
   4. Build messages with prompt caching:
      [system prompt]      ← cached
      [exercise library]   ← cached
      [history snapshot]   ← cached until next session is logged
      [today's request]    ← not cached
   5. Call Claude with tool: propose_workout(name, exercises[{
        exercise_id, target_sets, target_reps, target_weight,
        target_time_seconds, target_distance, rest_seconds, rationale
      }])
   6. Validate output:
      • every exercise_id ∈ user's library
      • weights are positive, in user's units
      • rep / set / time ranges within sane bounds
   7. Return JSON
   ▼
Frontend renders preview:
   • "Save as template" → creates workout_template
   • "Start now"        → creates session immediately
   • "Tweak"            → editable before saving
```

- **Default model:** `claude-opus-4-7`. User can pick `claude-sonnet-4-6` (cheaper, faster) in settings.
- **Caching:** the system prompt + library + history blocks are stable across calls in a short window — `cache_control: ephemeral` cuts repeat-call cost ~85%. Cache invalidates naturally when a new session is logged.
- **Closed-set validation:** Claude can only propose exercises that exist in the user's library. If it picks an unknown name, we offer "Add to library?" rather than silently inventing one.

## 9. Out of scope

Listed for clarity, not implementation:
- Personal-record auto-detection, plate calculator, 1RM estimator, calendar/streak view, goals tracking, CSV export — discussed and deferred. Schema does not preclude any of them.
- Offline-write sync.
- Social/sharing, push notifications, wearables, progress photos.

## 10. Open questions

- **Email/auth provider list:** start with email magic link only? Add Google OAuth from day 1? (Defer to plan.)
- **System exercise seed list:** which exercises ship as built-in `owner_user_id IS NULL` rows? (Defer to plan — likely a curated list of ~80 common exercises with `metric_kind` and `primary_muscle` populated.)
- **Encryption key rotation:** how is `SECRETS_KEY` rotated if needed? (Re-encrypt all `user_secrets` rows; defer to Phase 4 plan.)
