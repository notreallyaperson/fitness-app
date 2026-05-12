"use client";

import { Button } from "@/components/ui/button";
import { deleteSetAction } from "@/server/actions/sessions";
import type { WorkoutSet } from "@/lib/types/domain";

export function SetRow({
  sessionId,
  set,
}: {
  sessionId: string;
  set: WorkoutSet;
}) {
  const parts: string[] = [];
  if (set.weight != null) parts.push(`${set.weight}${set.weight_unit ?? ""}`);
  if (set.reps != null) parts.push(`× ${set.reps}`);
  if (set.time_seconds != null) parts.push(`${set.time_seconds}s`);
  if (set.distance != null) parts.push(`${set.distance}${set.distance_unit ?? ""}`);

  return (
    <div
      className={`flex items-center justify-between gap-2 text-sm ${set.is_warmup ? "opacity-60" : ""}`}
    >
      <span>
        Set {set.position + 1}
        {set.is_warmup && <span className="ml-1 text-[10px] uppercase">warmup</span>}
        <span className="ml-2 font-mono">{parts.join("  ")}</span>
        {set.rpe != null && (
          <span className="ml-2 text-[11px] text-muted-foreground">RPE {set.rpe}</span>
        )}
      </span>
      <form action={deleteSetAction.bind(null, sessionId, set.id)}>
        <Button type="submit" size="sm" variant="ghost">
          ×
        </Button>
      </form>
    </div>
  );
}
