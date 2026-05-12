import "server-only";
import { getSupabaseServer, requireUser } from "@/lib/supabase/server";
import type { Exercise, EquipmentType, MuscleGroup, MetricKind } from "@/lib/types/domain";

export interface ExerciseSearchOpts {
  q?: string;
  equipment?: EquipmentType[];
  muscle?: MuscleGroup;
  limit?: number;
}

export async function listExercises(opts: ExerciseSearchOpts = {}): Promise<Exercise[]> {
  const supabase = await getSupabaseServer();
  let query = supabase
    .from("exercises")
    .select("*")
    .eq("is_archived", false)
    .order("name");

  if (opts.q && opts.q.trim()) {
    query = query.ilike("name", `%${opts.q.trim()}%`);
  }
  if (opts.equipment && opts.equipment.length > 0) {
    // Array overlap: exercise has at least one of the selected equipment.
    query = query.overlaps("equipment", opts.equipment);
  }
  if (opts.muscle) {
    query = query.eq("primary_muscle", opts.muscle);
  }
  query = query.limit(opts.limit ?? 100);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface CreateCustomExerciseInput {
  name: string;
  metric_kind: MetricKind;
  primary_muscle?: MuscleGroup | null;
  secondary_muscles?: MuscleGroup[];
  equipment?: EquipmentType[];
  default_rest_seconds?: number;
  description?: string | null;
}

export async function createCustomExercise(input: CreateCustomExerciseInput): Promise<Exercise> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("exercises")
    .insert({
      name: input.name,
      metric_kind: input.metric_kind,
      owner_user_id: user.id,
      description: input.description ?? null,
      primary_muscle: input.primary_muscle ?? null,
      secondary_muscles: input.secondary_muscles ?? [],
      equipment: input.equipment ?? [],
      default_rest_seconds: input.default_rest_seconds ?? 90,
      is_archived: false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
