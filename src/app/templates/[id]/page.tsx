import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getTemplate } from "@/lib/db/templates";
import { ReorderableList } from "@/components/reorderable-list";
import { AddExerciseSheet } from "@/components/add-exercise-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TemplateExerciseRow } from "@/components/template-exercise-row";
import { Button, buttonVariants } from "@/components/ui/button";
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

  // Rough session-length estimate: sets × (rest + ~35s work).
  const estMin = Math.round(
    rows.reduce((sum, r) => {
      const sets = r.target_sets ?? 3;
      const rest = r.rest_seconds ?? 90;
      return sum + sets * (rest + 35);
    }, 0) / 60,
  );

  const renameAction = renameTemplateAction.bind(null, t.id);
  const deleteAction = deleteTemplateAction.bind(null, t.id);
  const reorderAction = reorderTemplateExercisesAction.bind(null, t.id);
  const appendAction = async (exerciseId: string) => {
    "use server";
    await appendExerciseAction(t.id, exerciseId);
  };

  return (
    <div className="space-y-4 pt-1">
      <Link
        href="/templates"
        className="-ml-1 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Templates
      </Link>

      <form action={renameAction} className="space-y-1">
        <Input
          name="name"
          defaultValue={t.name}
          className="h-13 bg-card px-3 text-lg font-bold tracking-[-0.02em]"
          aria-label="Template name"
        />
        <input type="hidden" name="notes" value={t.notes ?? ""} />
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            {rows.length} {rows.length === 1 ? "exercise" : "exercises"}
            {rows.length > 0 && estMin > 0 && <> · ~{estMin} min</>}
          </p>
          <Button type="submit" size="sm" variant="ghost" className="h-7 text-xs">
            Save name
          </Button>
        </div>
      </form>

      {equipment.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
            Equipment needed
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {equipment.map((eq) => (
              <Badge key={eq} variant="secondary">
                {humaniseEnum(eq)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-card px-6 py-8 text-center text-sm text-muted-foreground">
          No exercises yet. Add one below.
        </div>
      ) : (
        <ReorderableList
          items={rows.map((row) => ({
            id: row.id,
            node: (
              <TemplateExerciseRow
                templateId={t.id}
                rowId={row.id}
                exerciseName={row.exercises?.name ?? "—"}
                metricKind={
                  (row.exercises?.metric_kind ?? "weight_reps") as MetricKind
                }
                defaults={{
                  target_sets: row.target_sets,
                  target_reps: row.target_reps,
                  target_weight: row.target_weight
                    ? Number(row.target_weight)
                    : null,
                  target_time_seconds: row.target_time_seconds,
                  target_distance: row.target_distance
                    ? Number(row.target_distance)
                    : null,
                  target_distance_unit: row.target_distance_unit,
                  rest_seconds: row.rest_seconds,
                }}
              />
            ),
          }))}
          onReorder={reorderAction}
        />
      )}

      <div className="flex flex-col gap-2 pt-1">
        <AddExerciseSheet triggerLabel="+ Add exercise" onPick={appendAction} />
        <Link
          href="/templates"
          className={buttonVariants({
            className: "h-12 w-full rounded-lg shadow-cta",
          })}
        >
          Done
        </Link>
      </div>

      <div className="flex justify-center pt-2">
        <ConfirmDialog
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="text-faint hover:text-destructive"
            >
              Delete template
            </Button>
          }
          title="Delete template?"
          description="This permanently deletes this template. Sessions you already logged from it are not affected."
          confirmLabel="Delete template"
          onConfirm={deleteAction}
        />
      </div>
    </div>
  );
}
