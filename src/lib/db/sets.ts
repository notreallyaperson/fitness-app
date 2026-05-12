import "server-only";
import { requireUser } from "@/lib/supabase/server";
import type { WorkoutSet } from "@/lib/types/domain";

export async function appendSet(
  sessionExerciseId: string,
  set: Partial<WorkoutSet>,
): Promise<WorkoutSet> {
  const { supabase } = await requireUser();
  const { data: existing } = await supabase
    .from("sets")
    .select("position")
    .eq("session_exercise_id", sessionExerciseId)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos = (existing?.[0]?.position ?? -1) + 1;
  const { data, error } = await supabase
    .from("sets")
    .insert({ ...set, session_exercise_id: sessionExerciseId, position: nextPos })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateSet(
  id: string,
  patch: Partial<WorkoutSet>,
): Promise<WorkoutSet> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("sets")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSet(id: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("sets").delete().eq("id", id);
  if (error) throw error;
}
