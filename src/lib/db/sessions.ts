import "server-only";
import { requireUser } from "@/lib/supabase/server";
import type { Session, SessionExercise, WorkoutSet } from "@/lib/types/domain";
import { applyResume, type PauseInterval } from "@/lib/session-duration";

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

/** Read just the pause/resume timing for a session (owner-scoped). */
export async function getSessionTiming(
  id: string,
): Promise<{ pause_intervals: PauseInterval[]; ended_at: string | null } | null> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("sessions")
    .select("pause_intervals, ended_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    pause_intervals: (data.pause_intervals as PauseInterval[]) ?? [],
    ended_at: data.ended_at,
  };
}

/** Persist the full pause-interval list for a session. */
export async function setPauseIntervals(
  id: string,
  intervals: PauseInterval[],
): Promise<void> {
  await updateSession(id, { pause_intervals: intervals });
}

/**
 * End a session at `endedAtIso`, closing any open pause interval at the same
 * instant so the paused tail counts as paused (excluded), not active.
 */
export async function endSession(id: string, endedAtIso: string): Promise<void> {
  const timing = await getSessionTiming(id);
  if (!timing || timing.ended_at) return;
  await updateSession(id, {
    ended_at: endedAtIso,
    pause_intervals: applyResume(timing.pause_intervals, endedAtIso),
  });
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
