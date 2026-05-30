"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SessionUpdateSchema, SetInputSchema } from "@/lib/validation";
import {
  startFresh,
  startFromTemplate,
  startRepeatLast,
} from "@/lib/db/start-session";
import {
  updateSession,
  deleteSession,
  getSessionTiming,
  setPauseIntervals,
  endSession,
} from "@/lib/db/sessions";
import { applyPause, applyResume } from "@/lib/session-duration";
import {
  appendSessionExercise,
  removeSessionExercise,
  replaceSessionExercise,
  reorderSessionExercises,
  countSetsForRow,
} from "@/lib/db/session-exercises";
import { appendSet, updateSet, deleteSet } from "@/lib/db/sets";

export async function startFreshAction() {
  const s = await startFresh();
  redirect(`/sessions/${s.id}`);
}

export async function startFromTemplateAction(templateId: string) {
  const s = await startFromTemplate(templateId);
  redirect(`/sessions/${s.id}`);
}

export async function startRepeatLastAction() {
  const s = await startRepeatLast();
  if (!s) redirect("/sessions/start?empty=1");
  redirect(`/sessions/${s.id}`);
}

export async function updateSessionAction(id: string, patchRaw: unknown) {
  const patch = SessionUpdateSchema.parse(patchRaw);
  await updateSession(id, patch);
  revalidatePath(`/sessions/${id}`);
}

export async function pauseSessionAction(id: string) {
  const timing = await getSessionTiming(id);
  if (!timing || timing.ended_at) return;
  await setPauseIntervals(id, applyPause(timing.pause_intervals, new Date().toISOString()));
  revalidatePath(`/sessions/${id}`);
}

export async function resumeSessionAction(id: string) {
  const timing = await getSessionTiming(id);
  if (!timing || timing.ended_at) return;
  await setPauseIntervals(id, applyResume(timing.pause_intervals, new Date().toISOString()));
  revalidatePath(`/sessions/${id}`);
}

export async function endSessionAction(id: string) {
  await endSession(id, new Date().toISOString());
  revalidatePath(`/sessions/${id}`);
}

export async function deleteSessionAction(id: string) {
  await deleteSession(id);
  revalidatePath("/sessions");
  redirect("/sessions");
}

export async function appendSessionExerciseAction(sessionId: string, exerciseId: string) {
  await appendSessionExercise(sessionId, exerciseId);
  revalidatePath(`/sessions/${sessionId}`);
}

export async function removeSessionExerciseAction(sessionId: string, rowId: string) {
  await removeSessionExercise(sessionId, rowId);
  revalidatePath(`/sessions/${sessionId}`);
}

export interface ReplaceResult {
  needsConfirmation: boolean;
  setsCount: number;
}

export async function replaceSessionExerciseAction(
  sessionId: string,
  rowId: string,
  newExerciseId: string,
  args: { confirm?: boolean } = {},
): Promise<ReplaceResult> {
  const setsCount = await countSetsForRow(rowId);
  if (setsCount > 0 && !args.confirm) {
    return { needsConfirmation: true, setsCount };
  }
  await replaceSessionExercise(sessionId, rowId, newExerciseId);
  revalidatePath(`/sessions/${sessionId}`);
  return { needsConfirmation: false, setsCount: 0 };
}

export async function reorderSessionExercisesAction(
  sessionId: string,
  idsInOrder: string[],
) {
  await reorderSessionExercises(sessionId, idsInOrder);
  revalidatePath(`/sessions/${sessionId}`);
}

export async function appendSetAction(
  sessionId: string,
  sessionExerciseId: string,
  setRaw: unknown,
) {
  const set = SetInputSchema.parse(setRaw);
  await appendSet(sessionExerciseId, set);
  revalidatePath(`/sessions/${sessionId}`);
}

export async function updateSetAction(sessionId: string, setId: string, patchRaw: unknown) {
  const patch = SetInputSchema.parse(patchRaw);
  await updateSet(setId, patch);
  revalidatePath(`/sessions/${sessionId}`);
}

export async function deleteSetAction(sessionId: string, setId: string) {
  await deleteSet(setId);
  revalidatePath(`/sessions/${sessionId}`);
}
