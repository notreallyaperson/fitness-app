"use server";

import { redirect } from "next/navigation";
import { WorkoutImportSchema, CommitImportSchema } from "@/lib/validation";
import { buildImportPlan } from "@/lib/import-plan";
import {
  proposeImport,
  commitImport,
  type ImportProposal,
} from "@/lib/db/import-workout";

export interface ProposeResult {
  proposal?: ImportProposal;
  error?: string;
}

/**
 * Step 1: parse + validate pasted JSON, then match each exercise against the
 * catalog. Returns a proposal for the review screen. Creates nothing.
 */
export async function proposeImportAction(jsonText: string): Promise<ProposeResult> {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    return {
      error: "That's not valid JSON. Check for trailing commas or missing quotes.",
    };
  }

  const result = WorkoutImportSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.join(".");
    return { error: path ? `${path}: ${issue.message}` : issue.message };
  }

  try {
    const proposal = await proposeImport(buildImportPlan(result.data));
    return { proposal };
  } catch (e) {
    return { error: `Couldn't analyse workout: ${errorMessage(e)}` };
  }
}

export interface CommitResult {
  error?: string;
}

/**
 * Step 2: create the session from the reviewed/resolved exercises and redirect
 * to it. Returns an error only on failure (redirect happens on success).
 */
export async function commitImportAction(payload: unknown): Promise<CommitResult> {
  const result = CommitImportSchema.safeParse(payload);
  if (!result.success) {
    return { error: "Invalid import selection. Please try again." };
  }

  let sessionId: string;
  try {
    const res = await commitImport(result.data);
    sessionId = res.sessionId;
  } catch (e) {
    return { error: `Import failed: ${errorMessage(e)}` };
  }

  redirect(`/sessions/${sessionId}`);
}

/**
 * Supabase throws PostgrestError objects, which are not Error instances — pull a
 * readable message out of either so the real cause reaches the user.
 */
function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  return "unknown error";
}
