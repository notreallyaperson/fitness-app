"use server";

import { listExercises, type ExerciseSearchOpts } from "@/lib/db/exercises";

export async function searchExercisesForPicker(opts: ExerciseSearchOpts) {
  return listExercises({ ...opts, limit: 30 });
}
