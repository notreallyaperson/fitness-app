# AI-Assisted Exercise Matching on Import

**Date:** 2026-05-30
**Status:** Approved

## Goal

When importing a workout (JSON → prefilled session), map each imported exercise
to an existing catalog exercise when a good match exists, instead of always
creating near-duplicate custom exercises. Use OpenAI for semantic matching (e.g.
"DB Bench Press" → "Dumbbell Bench Press", "Chin-Ups" → "Chin-up"). The user
reviews every exercise's proposed match and can override or choose "Create new".

## Decisions

- **Review every exercise** on a confirm screen (even confident matches),
  editable before anything is created.
- **Preselect "Create new"** for low-confidence / no-match rows; otherwise
  preselect the suggested match.
- **Engine:** one OpenAI chat-completion per import (catalog is only ~92 rows).
  Model from `OPENAI_MODEL` env (default `gpt-4o-mini`). Key from
  `OPEN_AI_API_KEY` (the user's existing var name; note OpenAI's convention is
  `OPENAI_API_KEY`).
- **Confidence threshold:** 0.7. At/above → preselect match; below or null →
  preselect "Create new".
- **Fallback:** if the key is missing or the call fails, suggest via pg_trgm
  similarity (already enabled) and show an "AI matching unavailable" notice.
  Import still works.

## Flow (two steps)

1. **Paste** JSON → "Review matches" (creates nothing yet).
2. **Propose** (server, read-only): validate with existing `WorkoutImportSchema`
   → `buildImportPlan` → exact case-insensitive catalog match per exercise →
   remaining names sent to OpenAI with the catalog `[{id,name}]` → returns
   `{ matchId|null, confidence }` per name.
3. **Review screen** (client): one row per exercise — suggested match (+ %
   confidence) preselected, "Create new" option, and a picker for any other
   catalog exercise. Below threshold or null → default "Create new".
4. **Confirm** → **Commit** (server): create custom exercises only for
   "Create new" rows, resolve the rest to chosen ids, then create session +
   session_exercises + sets (uniform-key bulk insert) and redirect.

## Components

- `src/lib/openai.ts` — thin `fetch` wrapper `chatJSON(messages)`; reads
  `OPEN_AI_API_KEY`, enforces JSON response; throws `OPENAI_NO_KEY` /
  `OPENAI_HTTP_<status>` on failure. No SDK dependency.
- `src/lib/exercise-matching.ts` — **pure**: `buildMatchPrompt(names, catalog)`,
  `parseMatchResponse(json, names)`, `defaultChoice(match, threshold)`; plus
  `suggestMatches(names, catalog)` orchestrator (OpenAI, trigram fallback).
- `src/lib/db/exercise-catalog.ts` — `listCatalogForMatching()` →
  `[{id,name,metric_kind}]`; `suggestByTrigram(name, limit)` using
  `similarity(lower(name), lower($1))`.
- `src/lib/db/import-workout.ts` — split into:
  - `proposeImport(plan)` → `ImportProposal` (no mutations).
  - `commitImport(resolved)` → creates session (reuses the fixed uniform-key
    insert). `resolved` carries, per exercise, either an existing `exerciseId`
    or a `createNew` flag with name + metricKind.
- Server actions (`src/server/actions/import.ts`):
  - `proposeImportAction(jsonText)` → `{ proposal } | { error }` (no redirect).
  - `commitImportAction(resolved)` → creates + `redirect('/sessions/:id')`.
- `/sessions/import` page — client state machine: paste → proposal → review →
  commit. Keeps the existing ChatGPT prompt/sample helper.

## Data shapes

```ts
interface MatchSuggestion {
  matchId: string | null;
  matchName: string | null;
  confidence: number; // 0..1; exact match = 1
  source: "exact" | "openai" | "trigram" | "none";
}
interface ProposedExercise {
  name: string;
  metricKind: MetricKind;
  sets: ImportPlanSet[];
  suggestion: MatchSuggestion;
  defaultChoice: { kind: "match"; exerciseId: string } | { kind: "new" };
}
interface ImportProposal {
  name: string;
  notes: string | null;
  exercises: ProposedExercise[];
  aiAvailable: boolean; // false → fallback notice
}
// review submits:
interface ResolvedExercise {
  name: string;
  metricKind: MetricKind;
  sets: ImportPlanSet[];
  resolution: { kind: "match"; exerciseId: string } | { kind: "new" };
}
```

## Error handling

- Bad JSON / Zod errors → existing readable messages.
- OpenAI missing key / HTTP error → trigram fallback + `aiAvailable: false`.
- Supabase errors surfaced via the existing `errorMessage()` helper.

## Testing

- Unit: `buildMatchPrompt` (includes all names + catalog), `parseMatchResponse`
  (maps ids, clamps confidence, tolerates missing/extra names), `defaultChoice`
  (threshold → match vs new).
- Commit path reuses the verified uniform-key insert.
- `openai.ts` and DB stay thin (integration-only, not unit-tested).

## Security / cost

- Only exercise names are sent to OpenAI — no personal data.
- One chat call per import. `.env.local` is gitignored; key never committed.

## Out of scope

- Persisted embeddings / pgvector.
- Caching match results across imports.
- Matching for the template editor (sessions import only).
