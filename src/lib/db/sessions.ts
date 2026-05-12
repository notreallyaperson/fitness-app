import "server-only";
import { requireUser } from "@/lib/supabase/server";
import type { Session, SessionExercise, WorkoutSet } from "@/lib/types/domain";

export interface SessionFull extends Session {
  session_exercises: (SessionExercise & {
    exercises: {
      id: string;
      name: string;
      metric_kind: string;
      equipment: string[] | null;
      default_rest_seconds: number;
    } | null;
    sets: WorkoutSet[];
  })[];
}

export async function listSessions(limit = 50): Promise<Session[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("performed_on", { ascending: false })
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getSession(id: string): Promise<SessionFull | null> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
      *,
      session_exercises (
        *,
        exercises ( id, name, metric_kind, equipment, default_rest_seconds ),
        sets (*)
      )
    `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .order("position", { foreignTable: "session_exercises", ascending: true })
    .order("position", { foreignTable: "session_exercises.sets", ascending: true })
    .maybeSingle();
  if (error) throw error;
  return data as unknown as SessionFull | null;
}

export async function createSession(input: {
  template_id?: string | null;
  name: string;
  bodyweight?: number | null;
  notes?: string | null;
}): Promise<Session> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      user_id: user.id,
      template_id: input.template_id ?? null,
      name: input.name,
      bodyweight: input.bodyweight ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateSession(id: string, patch: Partial<Session>): Promise<Session> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("sessions")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSession(id: string): Promise<void> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
}

/**
 * Find the user's most recent session. Used by "repeat last session".
 */
export async function getLatestSessionWithExercises(): Promise<SessionFull | null> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
      *,
      session_exercises (
        *,
        exercises (id, name, metric_kind, equipment, default_rest_seconds),
        sets (*)
      )
    `,
    )
    .eq("user_id", user.id)
    .order("performed_on", { ascending: false })
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as SessionFull | null;
}
