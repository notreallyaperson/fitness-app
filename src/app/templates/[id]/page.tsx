import { notFound } from "next/navigation";
import { getTemplate } from "@/lib/db/templates";
import { ReorderableList } from "@/components/reorderable-list";
import { AddExerciseSheet } from "@/components/add-exercise-sheet";
import { TemplateExerciseRow } from "@/components/template-exercise-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { humaniseEnum } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import {
  appendExerciseAction,
  deleteTemplateAction,
  renameTemplateAction,
  reorderTemplateExercisesAction,
} from "@/server/actions/templates";
import type { MetricKind } from "@/lib/types/domain";

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTemplate(id);
  if (!t) notFound();

  const rows = t.workout_template_exercises ?? [];
  const equipment = Array.from(
    new Set(rows.flatMap((row) => row.exercises?.equipment ?? [])),
  );

  // Pre-bind action args so they can be passed to client components.
  const renameAction = renameTemplateAction.bind(null, t.id);
  const deleteAction = deleteTemplateAction.bind(null, t.id);
  const reorderAction = reorderTemplateExercisesAction.bind(null, t.id);
  const appendAction = async (exerciseId: string) => {
    "use server";
    await appendExerciseAction(t.id, exerciseId);
  };

  return (
    <div className="space-y-4 pt-2">
      <form action={renameAction} className="space-y-2">
        <Input name="name" defaultValue={t.name} className="text-xl font-semibold" />
        <input type="hidden" name="notes" value={t.notes ?? ""} />
        <div className="flex justify-end">
          <Button type="submit" size="sm" variant="ghost">
            Save name
          </Button>
        </div>
      </form>

      {equipment.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="text-xs font-medium text-muted-foreground">
            Equipment needed
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {equipment.map((eq) => (
              <Badge key={eq} variant="secondary">
                {humaniseEnum(eq)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No exercises yet. Add one below.</p>
      ) : (
        <ReorderableList
          items={rows.map((row) => ({ id: row.id, row }))}
          onReorder={reorderAction}
          renderItem={({ row }) => (
            <TemplateExerciseRow
              templateId={t.id}
              rowId={row.id}
              exerciseName={row.exercises?.name ?? "—"}
              metricKind={(row.exercises?.metric_kind ?? "weight_reps") as MetricKind}
              defaults={{
                target_sets: row.target_sets,
                target_reps: row.target_reps,
                target_weight: row.target_weight ? Number(row.target_weight) : null,
                target_time_seconds: row.target_time_seconds,
                target_distance: row.target_distance ? Number(row.target_distance) : null,
                target_distance_unit: row.target_distance_unit,
                rest_seconds: row.rest_seconds,
              }}
            />
          )}
        />
      )}

      <AddExerciseSheet triggerLabel="+ Add exercise" onPick={appendAction} />

      <form action={deleteAction} className="pt-6">
        <Button type="submit" variant="destructive" size="sm">
          Delete template
        </Button>
      </form>
    </div>
  );
}
