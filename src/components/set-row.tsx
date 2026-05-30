"use client";

import { X } from "lucide-react";
import { Metric } from "@/components/ui/metric";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/units";
import { deleteSetAction } from "@/server/actions/sessions";
import type { WorkoutSet } from "@/lib/types/domain";

/** Splits a logged set into a hero numeral + a quiet trailing descriptor. */
function describe(set: WorkoutSet): { big: string; small?: string } {
  if (set.weight != null) {
    const small = [set.weight_unit ?? "", set.reps != null ? `× ${set.reps}` : ""]
      .filter(Boolean)
      .join("  ");
    return { big: `${set.weight}`, small };
  }
  if (set.reps != null) return { big: `${set.reps}`, small: "reps" };
  if (set.time_seconds != null) return { big: formatDuration(set.time_seconds) };
  if (set.distance != null)
    return { big: `${set.distance}`, small: set.distance_unit ?? "" };
  return { big: "—" };
}

export function SetRow({
  sessionId,
  set,
}: {
  sessionId: string;
  set: WorkoutSet;
}) {
  const { big, small } = describe(set);

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-1.5",
        set.is_warmup && "opacity-60",
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
        {set.is_warmup ? "W" : set.position + 1}
      </span>
      <div className="flex flex-1 items-baseline gap-1.5">
        <Metric className="text-[22px] text-foreground">{big}</Metric>
        {small && <span className="text-sm text-muted-foreground">{small}</span>}
      </div>
      {set.rpe != null && (
        <span className="text-[11px] text-muted-foreground">RPE {set.rpe}</span>
      )}
      <form action={deleteSetAction.bind(null, sessionId, set.id)}>
        <button
          type="submit"
          aria-label="Delete set"
          className="flex size-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-muted hover:text-destructive"
        >
          <X className="size-4" />
        </button>
      </form>
    </div>
  );
}
