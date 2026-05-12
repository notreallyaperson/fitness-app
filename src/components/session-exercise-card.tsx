"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 p-3">
        <CardTitle className="text-base">{exerciseName}</CardTitle>
        <div className="flex items-center gap-2">
          <RestTimer
            startedAt={restStartedAt}
            defaultSeconds={defaultRestSeconds}
            onCancel={() => setRestStartedAt(null)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Exercise menu">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <ReplaceMenuItem sessionId={sessionId} rowId={rowId} />
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
              <DropdownMenuItem render={<a href={`/exercises/${exerciseId}`}>View exercise</a>} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0">
        <div className="text-[11px] text-muted-foreground">{humaniseEnum(metricKind)}</div>
        <div className="space-y-1">
          {sets.map((s) => (
            <SetRow key={s.id} sessionId={sessionId} set={s} />
          ))}
        </div>
        <SetLogForm
          sessionId={sessionId}
          sessionExerciseId={rowId}
          metricKind={metricKind}
          defaultWeightUnit={weightUnit}
          defaultDistanceUnit={distanceUnit}
          onLogged={() => setRestStartedAt(Date.now())}
        />
      </CardContent>
    </Card>
  );
}

function ReplaceMenuItem({ sessionId, rowId }: { sessionId: string; rowId: string }) {
  return (
    <AddExerciseSheet
      triggerNode={
        <div
          role="menuitem"
          className="flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm select-none hover:bg-muted"
        >
          Replace…
        </div>
      }
      onPick={async (newId) => {
        const result = await replaceSessionExerciseAction(sessionId, rowId, newId);
        if (result?.needsConfirmation) {
          const ok = window.confirm(
            `This will discard ${result.setsCount} logged set(s) on the current exercise. Continue?`,
          );
          if (!ok) return;
          await replaceSessionExerciseAction(sessionId, rowId, newId, { confirm: true });
        }
      }}
    />
  );
}
