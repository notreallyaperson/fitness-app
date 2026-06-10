import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/db/sessions";
import { getMyProfile } from "@/lib/db/profiles";
import { serverNowMs } from "@/lib/now";
import { SessionHeader } from "@/components/session-header";
import { ReorderableList } from "@/components/reorderable-list";
import { SessionExerciseCard } from "@/components/session-exercise-card";
import { AddExerciseSheet } from "@/components/add-exercise-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  appendSessionExerciseAction,
  reorderSessionExercisesAction,
  deleteSessionAction,
} from "@/server/actions/sessions";
import type { MetricKind } from "@/lib/types/domain";
import type { PauseInterval } from "@/lib/session-duration";

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, profile] = await Promise.all([getSession(id), getMyProfile()]);
  if (!session) notFound();

  const rows = session.session_exercises ?? [];
  const equipment = Array.from(
    new Set(rows.flatMap((row) => row.exercises?.equipment ?? [])),
  );

  const reorderAction = reorderSessionExercisesAction.bind(null, session.id);
  const deleteAction = deleteSessionAction.bind(null, session.id);
  const appendAction = async (exId: string) => {
    "use server";
    await appendSessionExerciseAction(session.id, exId);
  };

  return (
    <div className="space-y-4 pt-1">
      <Link
        href="/"
        className="-ml-1 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Today
      </Link>

      <SessionHeader
        sessionId={session.id}
        name={session.name}
        performedOn={session.performed_on}
        startedAt={session.started_at}
        endedAt={session.ended_at}
        pauseIntervals={(session.pause_intervals as PauseInterval[]) ?? []}
        nowMs={serverNowMs()}
        bodyweight={session.bodyweight ? Number(session.bodyweight) : null}
        weightUnit={profile.units_weight}
        equipment={equipment}
        notes={session.notes}
      />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-card px-6 py-8 text-center text-sm text-muted-foreground">
          Add an exercise below to begin.
        </div>
      ) : (
        <ReorderableList
          items={rows.map((row) => ({
            id: row.id,
            node: (
              <SessionExerciseCard
                sessionId={session.id}
                rowId={row.id}
                exerciseId={row.exercise_id}
                exerciseName={row.exercises?.name ?? "—"}
                metricKind={(row.exercises?.metric_kind ?? "weight_reps") as MetricKind}
                defaultRestSeconds={row.exercises?.default_rest_seconds ?? 90}
                weightUnit={profile.units_weight}
                // profile.units_distance is "m" | "km" | "mi" in the column type,
                // but the settings UI only ever writes "km" or "mi".
                distanceUnit={profile.units_distance === "mi" ? "mi" : "km"}
                sets={row.sets ?? []}
              />
            ),
          }))}
          onReorder={reorderAction}
        />
      )}

      <AddExerciseSheet
        triggerLabel="+ Add exercise"
        onPick={appendAction}
        defaultEquipment={profile.available_equipment ?? []}
      />

      <div className="flex justify-center pt-4">
        <ConfirmDialog
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="text-faint hover:text-destructive"
            >
              Delete session
            </Button>
          }
          title="Delete session?"
          description="This permanently deletes this session and every set logged in it. This can't be undone."
          confirmLabel="Delete session"
          onConfirm={deleteAction}
        />
      </div>
    </div>
  );
}
