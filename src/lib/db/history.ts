import "server-only";
import { requireUser } from "@/lib/supabase/server";
import type { WorkoutSet } from "@/lib/types/domain";

export interface ExerciseHistoryEntry {
  session_id: string;
  performed_on: string;
  session_name: string;
  sets: WorkoutSet[];
}

export async function getLastSessionsForExercise(
  exerciseId: string,
  limit = 3,
): Promise<ExerciseHistoryEntry[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
      id, performed_on, name,
      session_exercises!inner ( id, exercise_id, sets ( * ) )
    `,
    )
    .eq("user_id", user.id)
    .eq("session_exercises.exercise_id", exerciseId)
    .order("performed_on", { ascending: false })
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  type Joined = {
    id: string;
    performed_on: string;
    name: string;
    session_exercises: { sets: WorkoutSet[] | null }[];
  };
  return ((data ?? []) as unknown as Joined[]).map((s) => {
    const setsAcrossRows: WorkoutSet[] = [];
    for (const row of s.session_exercises) {
      setsAcrossRows.push(...(row.sets ?? []));
    }
    setsAcrossRows.sort((a, b) => a.position - b.position);
    return {
      session_id: s.id,
      performed_on: s.performed_on,
      session_name: s.name,
      sets: setsAcrossRows,
    };
  });
}
