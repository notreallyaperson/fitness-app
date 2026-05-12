import "server-only";
import { requireUser } from "@/lib/supabase/server";
import { createSession, getLatestSessionWithExercises } from "@/lib/db/sessions";
import { getTemplate } from "@/lib/db/templates";
import type { Session } from "@/lib/types/domain";

export async function startFresh(name = "Workout"): Promise<Session> {
  return createSession({ name });
}

export async function startFromTemplate(templateId: string): Promise<Session> {
  const t = await getTemplate(templateId);
  if (!t) throw new Error("TEMPLATE_NOT_FOUND");
  const session = await createSession({ name: t.name, template_id: t.id });

  const { supabase } = await requireUser();
  const rows = (t.workout_template_exercises ?? []).map((row, i) => ({
    session_id: session.id,
    exercise_id: row.exercise_id,
    position: i,
    notes: row.notes,
  }));
  if (rows.length) {
    const { error } = await supabase.from("session_exercises").insert(rows);
    if (error) throw error;
  }
  return session;
}

export async function startRepeatLast(): Promise<Session | null> {
  const last = await getLatestSessionWithExercises();
  if (!last) return null;
  const session = await createSession({ name: last.name });

  const { supabase } = await requireUser();
  const rows = (last.session_exercises ?? []).map((row, i) => ({
    session_id: session.id,
    exercise_id: row.exercise_id,
    position: i,
    notes: row.notes,
  }));
  if (rows.length) {
    const { error } = await supabase.from("session_exercises").insert(rows);
    if (error) throw error;
  }
  return session;
}
