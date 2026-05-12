import { notFound } from "next/navigation";
import { getExercise } from "@/lib/db/exercises";
import { humaniseEnum } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ex = await getExercise(id);
  if (!ex) notFound();

  return (
    <article className="space-y-4 pt-2">
      <header>
        <h1 className="text-2xl font-semibold">{ex.name}</h1>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {ex.primary_muscle && <Badge>{humaniseEnum(ex.primary_muscle)}</Badge>}
          {(ex.secondary_muscles ?? []).map((m) => (
            <Badge key={m} variant="secondary">
              {humaniseEnum(m)}
            </Badge>
          ))}
          {(ex.equipment ?? []).map((eq) => (
            <Badge key={eq} variant="outline">
              {humaniseEnum(eq)}
            </Badge>
          ))}
        </div>
      </header>

      {ex.description && (
        <p className="text-sm text-muted-foreground">{ex.description}</p>
      )}

      <section className="rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Last 3 sessions</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          History will appear here once logged.
        </p>
      </section>

      <section className="text-xs text-muted-foreground">
        Metric: {humaniseEnum(ex.metric_kind)} · Default rest:{" "}
        {ex.default_rest_seconds}s
      </section>
    </article>
  );
}
