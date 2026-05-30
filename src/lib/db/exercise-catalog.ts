import "server-only";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { CatalogEntry } from "@/lib/exercise-matching";

/**
 * All exercises visible to the current user (system catalog + own customs),
 * trimmed to what the matcher needs. RLS scopes the rows.
 */
export async function listCatalogForMatching(): Promise<CatalogEntry[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name")
    .eq("is_archived", false)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export interface TrigramSuggestion {
  id: string;
  name: string;
  similarity: number;
}

/**
 * Closest catalog names by pg_trgm name similarity, best first. Drives the
 * suggested match on the import review screen.
 */
export async function suggestByTrigram(
  name: string,
  limit = 1,
): Promise<TrigramSuggestion[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.rpc("match_exercises_by_name", {
    query: name,
    match_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as TrigramSuggestion[];
}
