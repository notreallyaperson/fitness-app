import "server-only";
import { requireUser } from "@/lib/supabase/server";
import { createCustomExercise } from "@/lib/db/exercises";
import { createSession, deleteSession } from "@/lib/db/sessions";
import { listCatalogForMatching } from "@/lib/db/exercise-catalog";
import { matchExercises, type MatchSuggestion } from "@/lib/exercise-matcher";
import {
  defaultChoice,
  type Choice,
  type CatalogEntry,
} from "@/lib/exercise-matching";
import type { ImportPlan, ImportPlanSet } from "@/lib/import-plan";
import type { MetricKind } from "@/lib/types/domain";

export interface ProposedExercise {
  name: string;
  metricKind: MetricKind;
  notes: string | null;
  sets: ImportPlanSet[];
  suggestion: MatchSuggestion;
  defaultChoice: Choice;
}

export interface ImportProposal {
  name: string;
  notes: string | null;
  exercises: ProposedExercise[];
  /** Full visible catalog so the review UI can offer manual matching. */
  catalog: CatalogEntry[];
}

/**
 * Read-only first step of an import: match each exercise to the catalog and
 * compute a default choice (existing match vs create-new) for the review UI.
 * Creates nothing.
 */
export async function proposeImport(plan: ImportPlan): Promise<ImportProposal> {
  const names = plan.exercises.map((e) => e.name);
  const { suggestions, catalog } = await matchExercises(names);

  return {
    name: plan.name,
    notes: plan.notes,
    catalog,
    exercises: plan.exercises.map((ex) => {
      const suggestion: MatchSuggestion = suggestions[ex.name] ?? {
        matchId: null,
        matchName: null,
        confidence: 0,
        source: "none",
      };
      return {
        name: ex.name,
        metricKind: ex.metricKind,
        notes: ex.notes,
        sets: ex.sets,
        suggestion,
        defaultChoice: defaultChoice(suggestion.confidence, suggestion.matchId),
      };
    }),
  };
}

export interface ResolvedExercise {
  name: string;
  metricKind: MetricKind;
  notes: string | null;
  sets: ImportPlanSet[];
  resolution: Choice;
}

export interface CommitInput {
  name: string;
  notes: string | null;
  exercises: ResolvedExercise[];
}

export interface ImportResult {
  sessionId: string;
  exercisesMatched: number;
  exercisesCreated: number;
  setsCreated: number;
}

/**
 * Commit a reviewed import: for each exercise use the chosen existing catalog id
 * or create a new custom exercise, then create the session, its ordered
 * exercises, and the pre-filled sets (uniform-key bulk insert).
 *
 * Matched ids are validated against the user's visible catalog so a client
 * can't reference an arbitrary exercise. Exercises are resolved before the
 * session is created; any failure after creation deletes the session so no
 * half-imported workout is left behind.
 */
export async function commitImport(input: CommitInput): Promise<ImportResult> {
  const { supabase } = await requireUser();

  const catalogIds = new Set((await listCatalogForMatching()).map((c) => c.id));

  let matched = 0;
  let created = 0;
  const resolved: {
    exerciseId: string;
    notes: string | null;
    sets: ImportPlanSet[];
  }[] = [];

  for (const ex of input.exercises) {
    let exerciseId: string;
    if (ex.resolution.kind === "match") {
      if (!catalogIds.has(ex.resolution.exerciseId)) {
        throw new Error(`Unknown exercise selected for "${ex.name}"`);
      }
      exerciseId = ex.resolution.exerciseId;
      matched++;
    } else {
      const custom = await createCustomExercise({
        name: ex.name,
        metric_kind: ex.metricKind,
      });
      exerciseId = custom.id;
      created++;
    }
    resolved.push({ exerciseId, notes: ex.notes, sets: ex.sets });
  }

  const session = await createSession({ name: input.name, notes: input.notes });
  try {
    const rows = resolved.map((r, i) => ({
      session_id: session.id,
      exercise_id: r.exerciseId,
      position: i,
      notes: r.notes,
    }));
    const { data: insertedRows, error: rowErr } = await supabase
      .from("session_exercises")
      .insert(rows)
      .select("id, position");
    if (rowErr) throw rowErr;

    const rowIdByPosition = new Map<number, string>();
    for (const row of insertedRows ?? []) rowIdByPosition.set(row.position, row.id);

    const setRows = resolved.flatMap((r, i) => {
      const sessionExerciseId = rowIdByPosition.get(i);
      if (!sessionExerciseId) return [];
      return r.sets.map((s) => ({ ...s, session_exercise_id: sessionExerciseId }));
    });

    if (setRows.length) {
      const { error: setErr } = await supabase.from("sets").insert(setRows);
      if (setErr) throw setErr;
    }

    return {
      sessionId: session.id,
      exercisesMatched: matched,
      exercisesCreated: created,
      setsCreated: setRows.length,
    };
  } catch (e) {
    await deleteSession(session.id).catch(() => {});
    throw e;
  }
}
