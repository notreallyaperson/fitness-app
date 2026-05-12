"use client";

import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">{exerciseName}</div>
        <form action={removeTemplateExerciseAction.bind(null, templateId, rowId)}>
          <Button type="submit" size="sm" variant="ghost">
            Remove
          </Button>
        </form>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <Field
          label="Sets"
          defaultValue={defaults.target_sets}
          onCommit={(v) => save({ target_sets: v })}
        />
        {showReps && (
          <Field
            label="Reps"
            defaultValue={defaults.target_reps}
            onCommit={(v) => save({ target_reps: v })}
          />
        )}
        {showWeight && (
          <Field
            label="Weight"
            defaultValue={defaults.target_weight}
            onCommit={(v) => save({ target_weight: v })}
            step="0.5"
          />
        )}
        {showTime && (
          <Field
            label="Time (s)"
            defaultValue={defaults.target_time_seconds}
            onCommit={(v) => save({ target_time_seconds: v })}
          />
        )}
        {showDistance && (
          <Field
            label="Distance"
            defaultValue={defaults.target_distance}
            onCommit={(v) => save({ target_distance: v })}
            step="0.1"
          />
        )}
        <Field
          label="Rest (s)"
          defaultValue={defaults.rest_seconds}
          onCommit={(v) => save({ rest_seconds: v })}
        />
      </div>
      <div className="text-[11px] text-muted-foreground">{humaniseEnum(metricKind)}</div>
    </div>
  );
}

function Field({
  label,
  defaultValue,
  onCommit,
  step,
}: {
  label: string;
  defaultValue: number | null;
  onCommit: (v: number | null) => void;
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <Input
        type="number"
        inputMode="decimal"
        step={step ?? "1"}
        defaultValue={defaultValue ?? ""}
        onBlur={(e) =>
          onCommit(e.currentTarget.value === "" ? null : Number(e.currentTarget.value))
        }
      />
    </label>
  );
}
