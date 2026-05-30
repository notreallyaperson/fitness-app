"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NumberStepper } from "@/components/ui/number-stepper";
import { cn } from "@/lib/utils";
import type { MetricKind } from "@/lib/types/domain";
import { appendSetAction } from "@/server/actions/sessions";

const RPE_OPTIONS = [
  { label: "Easy", value: 6 },
  { label: "Moderate", value: 8 },
  { label: "Hard", value: 9 },
  { label: "Max", value: 10 },
] as const;

interface Props {
  sessionId: string;
  sessionExerciseId: string;
  metricKind: MetricKind;
  defaultWeightUnit: "kg" | "lbs";
  defaultDistanceUnit: "km" | "mi";
  onLogged?: () => void;
}

const FIELDS: Record<
  MetricKind,
  { reps?: boolean; weight?: boolean; time?: boolean; distance?: boolean }
> = {
  weight_reps: { reps: true, weight: true },
  bodyweight_reps: { reps: true },
  weighted_bodyweight_reps: { reps: true, weight: true },
  time_only: { time: true },
  time_weight: { time: true, weight: true },
  distance_only: { distance: true },
  distance_time: { distance: true, time: true },
  none: {},
};

export function SetLogForm({
  sessionId,
  sessionExerciseId,
  metricKind,
  defaultWeightUnit,
  defaultDistanceUnit,
  onLogged,
}: Props) {
  const f = FIELDS[metricKind];
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [time, setTime] = useState("");
  const [distance, setDistance] = useState("");
  const [rpe, setRpe] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [warmup, setWarmup] = useState(false);
  const [, startTransition] = useTransition();

  const fieldCount = [f.weight, f.reps, f.time, f.distance].filter(
    Boolean,
  ).length;

  const submit = () => {
    const payload = {
      reps: reps ? Number(reps) : null,
      weight: weight ? Number(weight) : null,
      weight_unit: f.weight ? defaultWeightUnit : null,
      time_seconds: time ? Number(time) : null,
      distance: distance ? Number(distance) : null,
      distance_unit: f.distance ? defaultDistanceUnit : null,
      rpe,
      is_warmup: warmup,
      notes: notes.trim() || null,
    };
    startTransition(async () => {
      try {
        await appendSetAction(sessionId, sessionExerciseId, payload);
        setReps("");
        setWeight("");
        setTime("");
        setDistance("");
        setRpe(null);
        setNotes("");
        setWarmup(false);
        onLogged?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't log set");
      }
    });
  };

  return (
    <div className="space-y-2.5 rounded-md border border-dashed border-border-strong bg-card p-2.5">
      {fieldCount > 0 && (
        <div
          className={cn(
            "grid gap-2",
            fieldCount === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {f.weight && (
            <NumberStepper
              label={`Weight (${defaultWeightUnit})`}
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
              label={`Distance (${defaultDistanceUnit})`}
              value={distance}
              onChange={setDistance}
              step={0.5}
            />
          )}
        </div>
      )}

      <label className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
        <Label htmlFor="warmup" className="text-sm text-muted-foreground">
          Warmup set
        </Label>
        <Switch checked={warmup} onCheckedChange={setWarmup} id="warmup" />
      </label>

      <RpeSelector value={rpe} onChange={setRpe} />

      <Input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Note (optional)"
        className="h-10 bg-muted text-sm"
      />

      <Button onClick={submit} className="h-11 w-full rounded-md text-sm">
        Log set
      </Button>
    </div>
  );
}

function RpeSelector({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] tracking-wide text-muted-foreground">RPE</span>
      <div className="grid grid-cols-4 gap-1.5">
        {RPE_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : opt.value)}
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
      <span className="text-[10px] text-faint">
        Easy = reps left · Max = failure
      </span>
    </div>
  );
}
