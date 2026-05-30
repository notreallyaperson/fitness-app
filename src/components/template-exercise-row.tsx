"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { humaniseEnum } from "@/lib/enums";
import {
  updateTemplateExerciseAction,
  removeTemplateExerciseAction,
} from "@/server/actions/templates";
import type { MetricKind, TemplateExercise } from "@/lib/types/domain";

interface RowProps {
  templateId: string;
  rowId: string;
  exerciseName: string;
  metricKind: MetricKind;
  defaults: {
    target_sets: number | null;
    target_reps: number | null;
    target_weight: number | null;
    target_time_seconds: number | null;
    target_distance: number | null;
    target_distance_unit: "m" | "km" | "mi" | null;
    rest_seconds: number | null;
  };
}

export function TemplateExerciseRow({
  templateId,
  rowId,
  exerciseName,
  metricKind,
  defaults,
}: RowProps) {
  const [, startTransition] = useTransition();
  const save = (patch: Partial<TemplateExercise>) =>
    startTransition(() => {
      void updateTemplateExerciseAction(templateId, rowId, patch);
    });

  const showWeight =
    metricKind === "weight_reps" ||
    metricKind === "weighted_bodyweight_reps" ||
    metricKind === "time_weight";
  const showReps =
    metricKind === "weight_reps" ||
    metricKind === "bodyweight_reps" ||
    metricKind === "weighted_bodyweight_reps";
  const showTime =
    metricKind === "time_only" ||
    metricKind === "time_weight" ||
    metricKind === "distance_time";
  const showDistance =
    metricKind === "distance_only" || metricKind === "distance_time";

  const cells: {
    label: string;
    value: number | null;
    commit: (v: number | null) => void;
    step?: string;
  }[] = [
    { label: "Sets", value: defaults.target_sets, commit: (v) => save({ target_sets: v }) },
  ];
  if (showReps)
    cells.push({ label: "Reps", value: defaults.target_reps, commit: (v) => save({ target_reps: v }) });
  if (showWeight)
    cells.push({ label: "Weight", value: defaults.target_weight, commit: (v) => save({ target_weight: v }), step: "0.5" });
  if (showTime)
    cells.push({ label: "Time s", value: defaults.target_time_seconds, commit: (v) => save({ target_time_seconds: v }) });
  if (showDistance)
    cells.push({ label: "Dist", value: defaults.target_distance, commit: (v) => save({ target_distance: v }), step: "0.1" });
  cells.push({ label: "Rest s", value: defaults.rest_seconds, commit: (v) => save({ rest_seconds: v }) });

  return (
    <div className="space-y-2.5 rounded-lg border border-border bg-elevated p-3 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{exerciseName}</h3>
          <p className="text-[11px] text-muted-foreground">
            {humaniseEnum(metricKind)}
          </p>
        </div>
        <form action={removeTemplateExerciseAction.bind(null, templateId, rowId)}>
          <button
            type="submit"
            aria-label="Remove exercise"
            className="flex size-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-muted hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        </form>
      </div>

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md bg-border">
        {cells.map((cell) => (
          <label
            key={cell.label}
            className="flex flex-col gap-0.5 bg-muted px-2.5 py-1.5"
          >
            <span className="text-[9.5px] tracking-wide text-faint uppercase">
              {cell.label}
            </span>
            <input
              type="number"
              inputMode="decimal"
              step={cell.step ?? "1"}
              defaultValue={cell.value ?? ""}
              placeholder="—"
              onBlur={(e) =>
                cell.commit(
                  e.currentTarget.value === ""
                    ? null
                    : Number(e.currentTarget.value),
                )
              }
              className="metric w-full bg-transparent text-[17px] text-foreground outline-none placeholder:text-faint [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
