"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { humaniseEnum } from "@/lib/enums";
import { formatDuration } from "@/lib/units";
import { updateSessionAction } from "@/server/actions/sessions";

interface Props {
  sessionId: string;
  name: string;
  performedOn: string;
  startedAt: string;
  endedAt: string | null;
  bodyweight: number | null;
  weightUnit: "kg" | "lbs";
  equipment: string[];
}

export function SessionHeader({
  sessionId,
  name,
  performedOn,
  startedAt,
  endedAt,
  bodyweight,
  weightUnit,
  equipment,
}: Props) {
  const [, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endedAt) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [endedAt]);

  const elapsed = Math.max(
    0,
    Math.floor(
      ((endedAt ? new Date(endedAt).getTime() : now) -
        new Date(startedAt).getTime()) /
        1000,
    ),
  );

  const save = (patch: Record<string, unknown>) =>
    startTransition(() => {
      void updateSessionAction(sessionId, patch);
    });

  return (
    <header className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-baseline justify-between">
        <input
          defaultValue={name}
          onBlur={(e) => save({ name: e.currentTarget.value })}
          className="bg-transparent text-xl font-semibold focus:outline-none"
        />
        <span className="font-mono text-sm">{formatDuration(elapsed)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Date</span>
          <Input
            type="date"
            defaultValue={performedOn}
            onBlur={(e) => save({ performed_on: e.currentTarget.value })}
            className="h-8"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Bodyweight ({weightUnit})</span>
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            defaultValue={bodyweight ?? ""}
            placeholder="—"
            onBlur={(e) =>
              save({
                bodyweight:
                  e.currentTarget.value === "" ? null : Number(e.currentTarget.value),
              })
            }
            className="h-8 w-24"
          />
        </label>
        {!endedAt && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => save({ ended_at: new Date().toISOString() })}
          >
            End session
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {format(new Date(performedOn), "EEE")}
        </span>
      </div>
      {equipment.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {equipment.map((e) => (
            <Badge key={e} variant="secondary" className="text-[10px]">
              {humaniseEnum(e)}
            </Badge>
          ))}
        </div>
      )}
    </header>
  );
}
