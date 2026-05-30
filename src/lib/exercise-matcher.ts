import "server-only";
import type { CatalogEntry } from "@/lib/exercise-matching";
import {
  listCatalogForMatching,
  suggestByTrigram,
} from "@/lib/db/exercise-catalog";

const TRIGRAM_FLOOR = 0.3;

export interface MatchSuggestion {
  matchId: string | null;
  matchName: string | null;
  confidence: number;
  source: "exact" | "trigram" | "none";
}

export interface MatchResult {
  /** keyed by imported exercise name */
  suggestions: Record<string, MatchSuggestion>;
  catalog: CatalogEntry[];
}

const NONE: MatchSuggestion = {
  matchId: null,
  matchName: null,
  confidence: 0,
  source: "none",
};

/**
 * Suggest a catalog match for each imported name: exact (case-insensitive) name
 * match first, then pg_trgm name similarity. Never throws for matching reasons —
 * an unmatched name just yields a "none" suggestion, which the review UI lets
 * the user resolve manually (pick existing) or create new.
 */
export async function matchExercises(names: string[]): Promise<MatchResult> {
  const catalog = await listCatalogForMatching();
  const byLower = new Map(catalog.map((c) => [c.name.toLowerCase(), c]));

  const suggestions: Record<string, MatchSuggestion> = {};
  const unresolved = new Set<string>();

  for (const name of names) {
    const exact = byLower.get(name.toLowerCase());
    if (exact) {
      suggestions[name] = {
        matchId: exact.id,
        matchName: exact.name,
        confidence: 1,
        source: "exact",
      };
    } else {
      unresolved.add(name);
    }
  }

  await Promise.all(
    [...unresolved].map(async (name) => {
      suggestions[name] = await trigramSuggestion(name, catalog);
    }),
  );

  return { suggestions, catalog };
}

async function trigramSuggestion(
  name: string,
  catalog: CatalogEntry[],
): Promise<MatchSuggestion> {
  try {
    const [top] = await suggestByTrigram(name, 1);
    if (top && top.similarity >= TRIGRAM_FLOOR) {
      const known = catalog.find((c) => c.id === top.id);
      return {
        matchId: top.id,
        matchName: known?.name ?? top.name,
        confidence: top.similarity,
        source: "trigram",
      };
    }
  } catch {
    // ignore — fall through to none
  }
  return NONE;
}
