"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { MetricKind } from "@/lib/types/domain";
import { appendSetAction } from "@/server/actions/sessions";

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
  const [rpe, setRpe] = useState("");
  const [warmup, setWarmup] = useState(false);
  const [, startTransition] = useTransition();

  const submit = () => {
    const payload = {
      reps: reps ? Number(reps) : null,
      weight: weight ? Number(weight) : null,
      weight_unit: f.weight ? defaultWeightUnit : null,
      time_seconds: time ? Number(time) : null,
      distance: distance ? Number(distance) : null,
      distance_unit: f.distance ? defaultDistanceUnit : null,
      rpe: rpe ? Number(rpe) : null,
      is_warmup: warmup,
    };
    startTransition(async () => {
      await appendSetAction(sessionId, sessionExerciseId, payload);
      setReps("");
      setWeight("");
      setTime("");
      setDistance("");
      setRpe("");
      setWarmup(false);
      onLogged?.();
    });
  };

  return (
    <div className="space-y-2 rounded-md border p-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {f.weight && (
          <Field
            label={`Weight (${defaultWeightUnit})`}
            value={weight}
            onChange={setWeight}
            step="0.5"
          />
        )}
        {f.reps && <Field label="Reps" value={reps} onChange={setReps} />}
        {f.time && <Field label="Time (s)" value={time} onChange={setTime} />}
        {f.distance && (
          <Field
            label={`Distance (${defaultDistanceUnit})`}
            value={distance}
            onChange={setDistance}
            step="0.01"
          />
        )}
        <Field label="RPE" value={rpe} onChange={setRpe} step="0.5" />
        <label className="flex items-center gap-2 text-xs">
          <Switch checked={warmup} onCheckedChange={setWarmup} id="warmup" />
          <Label htmlFor="warmup">Warmup</Label>
        </label>
      </div>
      <Button onClick={submit} className="w-full">
        Log set
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <Input
        type="number"
        inputMode="decimal"
        step={step ?? "1"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
