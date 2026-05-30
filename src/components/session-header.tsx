"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Metric } from "@/components/ui/metric";
import { humaniseEnum } from "@/lib/enums";
import { formatDuration } from "@/lib/units";
import {
  activeElapsedSeconds,
  isPaused,
  type PauseInterval,
} from "@/lib/session-duration";
import {
  updateSessionAction,
  pauseSessionAction,
  resumeSessionAction,
  endSessionAction,
} from "@/server/actions/sessions";

interface Props {
  sessionId: string;
  name: string;
  performedOn: string;
  startedAt: string;
  endedAt: string | null;
  pauseIntervals: PauseInterval[];
  bodyweight: number | null;
  weightUnit: "kg" | "lbs";
  equipment: string[];
  notes: string | null;
}

export function SessionHeader({
  sessionId,
  name,
  performedOn,
  startedAt,
  endedAt,
  pauseIntervals,
  bodyweight,
  weightUnit,
  equipment,
  notes,
}: Props) {
  const [, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());

  const paused = isPaused(pauseIntervals);

  useEffect(() => {
    if (endedAt || paused) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [endedAt, paused]);

  const elapsed = activeElapsedSeconds({
    startedAt,
    endedAt,
    pauseIntervals,
    now,
  });

  const save = (patch: Record<string, unknown>) =>
    startTransition(() => {
      void updateSessionAction(sessionId, patch);
    });

  const togglePause = () =>
    startTransition(() => {
      void (paused
        ? resumeSessionAction(sessionId)
        : pauseSessionAction(sessionId));
    });

  const endSession = () =>
    startTransition(() => {
      void endSessionAction(sessionId);
    });

  return (
    <header className="space-y-3 rounded-lg border border-border bg-elevated p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <input
          defaultValue={name}
          onBlur={(e) => save({ name: e.currentTarget.value })}
          className="min-w-0 flex-1 bg-transparent text-xl font-bold tracking-[-0.02em] focus:outline-none"
        />
        {!endedAt && (
          <Button
            variant="destructive"
            size="sm"
            onClick={endSession}
            className="shrink-0"
          >
            End
          </Button>
        )}
      </div>

      {/* Duration block */}
      <div className="rounded-md bg-muted px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              endedAt
                ? "bg-faint"
                : paused
                  ? "bg-warning"
                  : "animate-live-dot bg-primary",
            )}
          />
          <span
            className={cn(
              "text-[11px] font-semibold tracking-[0.07em] uppercase",
              paused ? "text-warning" : "text-muted-foreground",
            )}
          >
            {endedAt ? "Total" : paused ? "Paused" : "Elapsed"}
          </span>
          {!endedAt && (
            <Button
              variant="outline"
              size="sm"
              onClick={togglePause}
              className="ml-auto h-7"
            >
              {paused ? "Resume" : "Pause"}
            </Button>
          )}
        </div>
        <Metric
          mono
          className={cn(
            "mt-1 block text-[28px]",
            paused ? "text-warning" : "text-foreground",
          )}
        >
          {formatDuration(elapsed)}
        </Metric>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Input
          type="date"
          defaultValue={performedOn}
          onBlur={(e) => save({ performed_on: e.currentTarget.value })}
          className="h-9 w-auto bg-muted"
          aria-label="Performed on"
        />
        <div className="flex items-center gap-2 rounded-md bg-muted px-3">
          <span className="text-xs text-muted-foreground">BW</span>
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            defaultValue={bodyweight ?? ""}
            placeholder="—"
            onBlur={(e) =>
              save({
                bodyweight:
                  e.currentTarget.value === ""
                    ? null
                    : Number(e.currentTarget.value),
              })
            }
            className="h-9 w-16 border-0 bg-transparent px-0"
            aria-label={`Bodyweight (${weightUnit})`}
          />
          <span className="text-xs text-muted-foreground">{weightUnit}</span>
        </div>
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

      <Input
        defaultValue={notes ?? ""}
        placeholder="Add session note…"
        onBlur={(e) =>
          save({
            notes:
              e.currentTarget.value.trim() === ""
                ? null
                : e.currentTarget.value,
          })
        }
        className="h-9 bg-muted text-sm"
      />
    </header>
  );
}
