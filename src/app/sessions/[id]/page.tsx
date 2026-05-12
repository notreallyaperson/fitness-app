import { notFound } from "next/navigation";
import { getSession } from "@/lib/db/sessions";
import { getMyProfile } from "@/lib/db/profiles";
import { SessionHeader } from "@/components/session-header";
import { ReorderableList } from "@/components/reorderable-list";
import { SessionExerciseCard } from "@/components/session-exercise-card";
import { AddExerciseSheet } from "@/components/add-exercise-sheet";
import { Button } from "@/components/ui/button";
import {
  appendSessionExerciseAction,
  reorderSessionExercisesAction,
  deleteSessionAction,
} from "@/server/actions/sessions";
import type { MetricKind } from "@/lib/types/domain";

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
    <div className="space-y-4 pt-2">
      <SessionHeader
        sessionId={session.id}
        name={session.name}
        performedOn={session.performed_on}
        startedAt={session.started_at}
        endedAt={session.ended_at}
        bodyweight={session.bodyweight ? Number(session.bodyweight) : null}
        weightUnit={profile.units_weight}
        equipment={equipment}
      />

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add an exercise below to begin.</p>
      ) : (
        <ReorderableList
          items={rows.map((row) => ({ id: row.id, row }))}
          onReorder={reorderAction}
          renderItem={({ row }) => (
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
          )}
        />
      )}

      <AddExerciseSheet
        triggerLabel="+ Add exercise"
        onPick={appendAction}
        defaultEquipment={profile.available_equipment ?? []}
      />

      <form action={deleteAction} className="pt-6">
        <Button type="submit" variant="destructive" size="sm">
          Delete session
        </Button>
      </form>
    </div>
  );
}
