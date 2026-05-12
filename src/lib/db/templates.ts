import "server-only";
import { requireUser } from "@/lib/supabase/server";
import type { TemplateExercise, WorkoutTemplate } from "@/lib/types/domain";

export interface TemplateWithExercises extends WorkoutTemplate {
  workout_template_exercises: (TemplateExercise & {
    exercises: {
      id: string;
      name: string;
      metric_kind: string;
      equipment: string[] | null;
    } | null;
  })[];
}

export async function listTemplates(): Promise<WorkoutTemplate[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getTemplate(id: string): Promise<TemplateWithExercises | null> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("workout_templates")
    .select(
      `
      *,
      workout_template_exercises (
        *,
        exercises ( id, name, metric_kind, equipment )
      )
    `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .order("position", { foreignTable: "workout_template_exercises", ascending: true })
    .maybeSingle();
  if (error) throw error;
  return data as unknown as TemplateWithExercises | null;
}

export async function createTemplate(input: {
  name: string;
  notes?: string | null;
}): Promise<WorkoutTemplate> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("workout_templates")
    .insert({ user_id: user.id, name: input.name, notes: input.notes ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateTemplate(
  id: string,
  patch: Partial<WorkoutTemplate>,
): Promise<WorkoutTemplate> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("workout_templates")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("workout_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
}

export async function appendExerciseToTemplate(
  templateId: string,
  exerciseId: string,
): Promise<TemplateExercise> {
  const { supabase, user } = await requireUser();
  const { data: t } = await supabase
    .from("workout_templates")
    .select("id")
    .eq("id", templateId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!t) throw new Error("NOT_FOUND");

  const { data: existing } = await supabase
    .from("workout_template_exercises")
    .select("position")
    .eq("template_id", templateId)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos = (existing?.[0]?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("workout_template_exercises")
    .insert({ template_id: templateId, exercise_id: exerciseId, position: nextPos })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function removeTemplateExercise(rowId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("workout_template_exercises")
    .delete()
    .eq("id", rowId);
  if (error) throw error;
}

export async function reorderTemplateExercises(
  templateId: string,
  idsInOrder: string[],
): Promise<void> {
  const { supabase, user } = await requireUser();
  const { data: t } = await supabase
    .from("workout_templates")
    .select("id")
    .eq("id", templateId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!t) throw new Error("NOT_FOUND");

  // Two-pass update to avoid the unique(template_id, position) constraint
  // colliding mid-update: first move all rows to negative positions, then
  // assign final 0..N.
  for (let i = 0; i < idsInOrder.length; i++) {
    const { error } = await supabase
      .from("workout_template_exercises")
      .update({ position: -(i + 1) })
      .eq("id", idsInOrder[i])
      .eq("template_id", templateId);
    if (error) throw error;
  }
  for (let i = 0; i < idsInOrder.length; i++) {
    const { error } = await supabase
      .from("workout_template_exercises")
      .update({ position: i })
      .eq("id", idsInOrder[i])
      .eq("template_id", templateId);
    if (error) throw error;
  }
}

export async function updateTemplateExercise(
  rowId: string,
  patch: Partial<TemplateExercise>,
): Promise<TemplateExercise> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("workout_template_exercises")
    .update(patch)
    .eq("id", rowId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
