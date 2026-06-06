"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Metric } from "@/components/ui/metric";
import { NumberStepper } from "@/components/ui/number-stepper";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/units";
import { METRIC_FIELDS } from "@/lib/metric-fields";
import { deleteSetAction, updateSetAction } from "@/server/actions/sessions";
import type { MetricKind, WorkoutSet } from "@/lib/types/domain";

const RPE_OPTIONS = [
  { label: "Easy", value: 6 },
  { label: "Moderate", value: 8 },
  { label: "Hard", value: 9 },
  { label: "Max", value: 10 },
] as const;

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

const str = (n: number | null | undefined) => (n == null ? "" : String(n));

export function SetRow({
  sessionId,
  set,
  metricKind,
  weightUnit,
  distanceUnit,
}: {
  sessionId: string;
  set: WorkoutSet;
  metricKind: MetricKind;
  weightUnit: "kg" | "lbs";
  distanceUnit: "km" | "mi";
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <SetEditor
        sessionId={sessionId}
        set={set}
        metricKind={metricKind}
        weightUnit={weightUnit}
        distanceUnit={distanceUnit}
        onDone={() => setEditing(false)}
      />
    );
  }

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
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex flex-1 items-baseline gap-1.5 text-left"
        aria-label="Edit set"
      >
        <Metric className="text-[22px] text-foreground">{big}</Metric>
        {small && <span className="text-sm text-muted-foreground">{small}</span>}
      </button>
      {set.rpe != null && (
        <span className="text-[11px] text-muted-foreground">RPE {set.rpe}</span>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Edit set"
        className="flex size-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-muted hover:text-foreground"
      >
        <Pencil className="size-3.5" />
      </button>
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

function SetEditor({
  sessionId,
  set,
  metricKind,
  weightUnit,
  distanceUnit,
  onDone,
}: {
  sessionId: string;
  set: WorkoutSet;
  metricKind: MetricKind;
  weightUnit: "kg" | "lbs";
  distanceUnit: "km" | "mi";
  onDone: () => void;
}) {
  const f = METRIC_FIELDS[metricKind];
  const [weight, setWeight] = useState(str(set.weight));
  const [reps, setReps] = useState(str(set.reps));
  const [time, setTime] = useState(str(set.time_seconds));
  const [distance, setDistance] = useState(str(set.distance));
  const [rpe, setRpe] = useState<number | null>(set.rpe ?? null);
  const [warmup, setWarmup] = useState(Boolean(set.is_warmup));
  const [pending, startTransition] = useTransition();

  const fieldCount = [f.weight, f.reps, f.time, f.distance].filter(
    Boolean,
  ).length;

  const save = () => {
    const patch: Record<string, unknown> = { rpe, is_warmup: warmup };
    if (f.weight) {
      patch.weight = weight === "" ? null : Number(weight);
      patch.weight_unit = set.weight_unit ?? weightUnit;
    }
    if (f.reps) patch.reps = reps === "" ? null : Number(reps);
    if (f.time) patch.time_seconds = time === "" ? null : Number(time);
    if (f.distance) {
      patch.distance = distance === "" ? null : Number(distance);
      patch.distance_unit = set.distance_unit ?? distanceUnit;
    }
    startTransition(async () => {
      try {
        await updateSetAction(sessionId, set.id, patch);
        onDone();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't save set");
      }
    });
  };

  return (
    <div className="space-y-2.5 py-2">
      <div className="flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
          {warmup ? "W" : set.position + 1}
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          Editing set
        </span>
      </div>

      {fieldCount > 0 && (
        <div
          className={cn(
            "grid gap-2",
            fieldCount === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {f.weight && (
            <NumberStepper
              label={`Weight (${set.weight_unit ?? weightUnit})`}
              value={weight}
              onChange={setWeight}
              step={2.5}
            />
          )}
          {f.reps && (
            <NumberStepper label="Reps" value={reps} onChange={setReps} step={1} />
          )}
          {f.time && (
            <NumberStepper
              label="Time (s)"
              value={time}
              onChange={setTime}
              step={5}
            />
          )}
          {f.distance && (
            <NumberStepper
              label={`Distance (${set.distance_unit ?? distanceUnit})`}
              value={distance}
              onChange={setDistance}
              step={0.5}
            />
          )}
        </div>
      )}

      <label className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
        <Label className="text-sm text-muted-foreground">Warmup set</Label>
        <Switch checked={warmup} onCheckedChange={setWarmup} />
      </label>

      <div className="grid grid-cols-4 gap-1.5">
        {RPE_OPTIONS.map((opt) => {
          const selected = rpe === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              onClick={() => setRpe(selected ? null : opt.value)}
              className={cn(
                "rounded-md border py-2 text-xs font-medium transition-all duration-[120ms] ease-tap active:scale-[0.97]",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border-strong bg-card hover:bg-muted",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-border-strong bg-card text-sm font-medium transition-transform duration-[120ms] ease-tap active:scale-[0.97] disabled:opacity-50"
        >
          <X className="size-4" /> Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-transform duration-[120ms] ease-tap active:scale-[0.97] disabled:opacity-50"
        >
          <Check className="size-4" /> Save
        </button>
      </div>
    </div>
  );
}
