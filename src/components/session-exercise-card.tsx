"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { SetRow } from "@/components/set-row";
import { SetLogForm } from "@/components/set-log-form";
import { RestTimer } from "@/components/rest-timer";
import { ExerciseTimer } from "@/components/exercise-timer";
import { AddExerciseSheet } from "@/components/add-exercise-sheet";
import { humaniseEnum } from "@/lib/enums";
import {
  removeSessionExerciseAction,
  replaceSessionExerciseAction,
} from "@/server/actions/sessions";
import type { MetricKind, WorkoutSet } from "@/lib/types/domain";

interface Props {
  sessionId: string;
  rowId: string;
  exerciseId: string;
  exerciseName: string;
  metricKind: MetricKind;
  defaultRestSeconds: number;
  weightUnit: "kg" | "lbs";
  distanceUnit: "km" | "mi";
  sets: WorkoutSet[];
}

export function SessionExerciseCard({
  sessionId,
  rowId,
  exerciseId,
  exerciseName,
  metricKind,
  defaultRestSeconds,
  weightUnit,
  distanceUnit,
  sets,
}: Props) {
  const [restStartedAt, setRestStartedAt] = useState<number | null>(null);
  const [replaceOpen, setReplaceOpen] = useState(false);

  const isTimed =
    metricKind === "time_only" ||
    metricKind === "time_weight" ||
    metricKind === "distance_time";
  const lastTimed = [...sets]
    .reverse()
    .find((s) => s.time_seconds != null)?.time_seconds;

  return (
    <div className="rounded-lg border border-border bg-elevated p-3 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{exerciseName}</h3>
          <p className="text-[11px] text-muted-foreground">
            {humaniseEnum(metricKind)} · {sets.length}{" "}
            {sets.length === 1 ? "set" : "sets"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="-mr-1 shrink-0"
                aria-label="Exercise menu"
              >
                <MoreVertical className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setReplaceOpen(true)}>
              Replace…
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                if (sets.length > 0) {
                  if (
                    !window.confirm(
                      `Remove this exercise? ${sets.length} logged set(s) will be discarded.`,
                    )
                  ) {
                    return;
                  }
                }
                await removeSessionExerciseAction(sessionId, rowId);
              }}
            >
              Remove
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<a href={`/exercises/${exerciseId}`}>View exercise</a>}
            />
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Rendered as a sibling of the menu — never nested inside the
            DropdownMenu popup, which would tear down the sheet on close. */}
        <AddExerciseSheet
          open={replaceOpen}
          onOpenChange={setReplaceOpen}
          title="Replace exercise"
          actionLabel="Replace"
          onPick={async (newId) => {
            const result = await replaceSessionExerciseAction(
              sessionId,
              rowId,
              newId,
            );
            if (result?.needsConfirmation) {
              const ok = window.confirm(
                `This will discard ${result.setsCount} logged set(s) on the current exercise. Continue?`,
              );
              if (!ok) return;
              await replaceSessionExerciseAction(sessionId, rowId, newId, {
                confirm: true,
              });
            }
          }}
        />
      </div>

      {sets.length > 0 && (
        <div className="mt-3 divide-y divide-border rounded-md bg-card px-3 py-1">
          {sets.map((s) => (
            <SetRow
              key={s.id}
              sessionId={sessionId}
              set={s}
              metricKind={metricKind}
              weightUnit={weightUnit}
              distanceUnit={distanceUnit}
            />
          ))}
        </div>
      )}

      <div className="mt-3 space-y-2.5">
        {isTimed && (
          <ExerciseTimer defaultSeconds={lastTimed ?? 30} />
        )}
        <RestTimer
          startedAt={restStartedAt}
          defaultSeconds={defaultRestSeconds}
          onStart={() => setRestStartedAt(Date.now())}
          onCancel={() => setRestStartedAt(null)}
        />
        <SetLogForm
          sessionId={sessionId}
          sessionExerciseId={rowId}
          metricKind={metricKind}
          defaultWeightUnit={weightUnit}
          defaultDistanceUnit={distanceUnit}
          onLogged={() => setRestStartedAt(Date.now())}
        />
      </div>
    </div>
  );
}
