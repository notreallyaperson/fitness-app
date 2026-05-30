// Confidence (trigram name similarity, 0..1) at/above which a suggested match
// is preselected on the review screen; below it we default to "Create new".
export const CONFIDENCE_THRESHOLD = 0.7;

export interface CatalogEntry {
  id: string;
  name: string;
}

export type Choice =
  | { kind: "match"; exerciseId: string }
  | { kind: "new" };

/** Preselect the match when confident enough, otherwise "Create new". Pure. */
export function defaultChoice(
  confidence: number,
  matchId: string | null,
  threshold: number = CONFIDENCE_THRESHOLD,
): Choice {
  if (matchId && confidence >= threshold) return { kind: "match", exerciseId: matchId };
  return { kind: "new" };
}
