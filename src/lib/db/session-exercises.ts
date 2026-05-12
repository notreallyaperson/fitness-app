import "server-only";
import { requireUser } from "@/lib/supabase/server";
import type { SessionExercise } from "@/lib/types/domain";

async function assertOwnsSession(sessionId: string) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) throw new Error("NOT_FOUND");
  return supabase;
}

export async function appendSessionExercise(
  sessionId: string,
  exerciseId: string,
): Promise<SessionExercise> {
  const supabase = await assertOwnsSession(sessionId);
  const { data: existing } = await supabase
    .from("session_exercises")
    .select("position")
    .eq("session_id", sessionId)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos = (existing?.[0]?.position ?? -1) + 1;
  const { data, error } = await supabase
    .from("session_exercises")
    .insert({ session_id: sessionId, exercise_id: exerciseId, position: nextPos })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function removeSessionExercise(
  sessionId: string,
  rowId: string,
): Promise<void> {
  const supabase = await assertOwnsSession(sessionId);
  const { error } = await supabase.from("session_exercises").delete().eq("id", rowId);
  if (error) throw error;
}

export async function replaceSessionExercise(
  sessionId: string,
  rowId: string,
  newExerciseId: string,
): Promise<void> {
  const supabase = await assertOwnsSession(sessionId);
  // The caller is expected to confirm with the user before discarding sets.
  const { error } = await supabase
    .from("session_exercises")
    .update({ exercise_id: newExerciseId })
    .eq("id", rowId);
  if (error) throw error;
  const { error: e2 } = await supabase.from("sets").delete().eq("session_exercise_id", rowId);
  if (e2) throw e2;
}

export async function reorderSessionExercises(
  sessionId: string,
  idsInOrder: string[],
): Promise<void> {
  const supabase = await assertOwnsSession(sessionId);
  for (let i = 0; i < idsInOrder.length; i++) {
    const { error } = await supabase
      .from("session_exercises")
      .update({ position: -(i + 1) })
      .eq("id", idsInOrder[i])
      .eq("session_id", sessionId);
    if (error) throw error;
  }
  for (let i = 0; i < idsInOrder.length; i++) {
    const { error } = await supabase
      .from("session_exercises")
      .update({ position: i })
      .eq("id", idsInOrder[i])
      .eq("session_id", sessionId);
    if (error) throw error;
  }
}

export async function countSetsForRow(rowId: string): Promise<number> {
  const { supabase } = await requireUser();
  const { count, error } = await supabase
    .from("sets")
    .select("id", { count: "exact", head: true })
    .eq("session_exercise_id", rowId);
  if (error) throw error;
  return count ?? 0;
}
