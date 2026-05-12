"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TemplateInputSchema, TemplateExercisePatchSchema } from "@/lib/validation";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  appendExerciseToTemplate,
  removeTemplateExercise,
  reorderTemplateExercises,
  updateTemplateExercise,
} from "@/lib/db/templates";

export async function createTemplateAction(formData: FormData) {
  const parsed = TemplateInputSchema.parse({
    name: formData.get("name"),
    notes: formData.get("notes") || null,
  });
  const t = await createTemplate(parsed);
  redirect(`/templates/${t.id}`);
}

export async function renameTemplateAction(id: string, formData: FormData) {
  const parsed = TemplateInputSchema.parse({
    name: formData.get("name"),
    notes: formData.get("notes") || null,
  });
  await updateTemplate(id, parsed);
  revalidatePath(`/templates/${id}`);
}

export async function deleteTemplateAction(id: string) {
  await deleteTemplate(id);
  revalidatePath(`/templates`);
  redirect("/templates");
}

export async function appendExerciseAction(templateId: string, exerciseId: string) {
  await appendExerciseToTemplate(templateId, exerciseId);
  revalidatePath(`/templates/${templateId}`);
}

export async function removeTemplateExerciseAction(templateId: string, rowId: string) {
  await removeTemplateExercise(rowId);
  revalidatePath(`/templates/${templateId}`);
}

export async function reorderTemplateExercisesAction(
  templateId: string,
  idsInOrder: string[],
) {
  await reorderTemplateExercises(templateId, idsInOrder);
  revalidatePath(`/templates/${templateId}`);
}

export async function updateTemplateExerciseAction(
  templateId: string,
  rowId: string,
  patchRaw: unknown,
) {
  const patch = TemplateExercisePatchSchema.parse(patchRaw);
  await updateTemplateExercise(rowId, patch);
  revalidatePath(`/templates/${templateId}`);
}
