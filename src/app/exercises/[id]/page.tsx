import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { ChevronLeft, Dumbbell } from "lucide-react";
import { getExercise } from "@/lib/db/exercises";
import { getLastSessionsForExercise } from "@/lib/db/history";
import { humaniseEnum } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Metric } from "@/components/ui/metric";
import { ExerciseHistorySheet } from "@/components/exercise-history-sheet";
import { requireUser } from "@/lib/supabase/server";
import { appendSessionExerciseAction } from "@/server/actions/sessions";
import type { WorkoutSet } from "@/lib/types/domain";

/** Picks the "top" set of a session and renders it as numeral + descriptor. */
function topSet(sets: WorkoutSet[]): { big: string; small?: string } | null {
  const working = sets.filter((s) => !s.is_warmup);
  if (working.length === 0) return null;
  const best = working.reduce((a, b) => {
    const score = (s: WorkoutSet) =>
      s.weight ?? s.distance ?? s.time_seconds ?? s.reps ?? 0;
    return score(b) > score(a) ? b : a;
  });
  if (best.weight != null)
    return {
      big: `${best.weight}`,
      small: `${best.weight_unit ?? ""}${best.reps != null ? ` × ${best.reps}` : ""}`,
    };
  if (best.reps != null) return { big: `${best.reps}`, small: "reps" };
  if (best.time_seconds != null) return { big: `${best.time_seconds}`, small: "s" };
  if (best.distance != null)
    return { big: `${best.distance}`, small: best.distance_unit ?? "" };
  return null;
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ex, history] = await Promise.all([
    getExercise(id),
    getLastSessionsForExercise(id, 3),
  ]);
  if (!ex) notFound();

  const primaryEquipment = ex.equipment?.[0];

  async function addToCurrentSession() {
    "use server";
    const { supabase, user } = await requireUser();
    const { data: active } = await supabase
      .from("sessions")
      .select("id")
      .eq("user_id", user.id)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!active) redirect("/sessions/start");
    await appendSessionExerciseAction(active.id, id);
    redirect(`/sessions/${active.id}`);
  }

  return (
    <article className="space-y-4 pt-1 pb-4">
      <Link
        href="/exercises"
        className="-ml-1 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Library
      </Link>

      {/* Hero */}
      <header className="flex items-center gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Dumbbell className="size-6" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-[-0.02em]">
            {ex.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {humaniseEnum(ex.metric_kind)}
            {primaryEquipment && <> · {humaniseEnum(primaryEquipment)}</>}
          </p>
        </div>
      </header>

      {ex.description && (
        <p className="text-sm text-secondary-foreground">{ex.description}</p>
      )}

      {/* Worked muscles */}
      <section className="rounded-lg border border-border bg-card p-4 shadow-soft">
        <h2 className="text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
          Worked muscles
        </h2>
        <div className="mt-2 flex items-center justify-between border-b border-border pb-2">
          <span className="text-sm text-muted-foreground">Primary</span>
          <span className="text-sm font-semibold">
            {ex.primary_muscle ? humaniseEnum(ex.primary_muscle) : "—"}
          </span>
        </div>
        {(ex.secondary_muscles ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-sm text-muted-foreground">Secondary</span>
            {(ex.secondary_muscles ?? []).map((m) => (
              <Badge key={m} variant="secondary">
                {humaniseEnum(m)}
              </Badge>
            ))}
          </div>
        )}
      </section>

      {/* Last 3 sessions */}
      <section className="rounded-lg border border-border bg-card p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
            Last 3 sessions
          </h2>
          <ExerciseHistorySheet
            exerciseId={ex.id}
            trigger={
              <Button size="sm" variant="ghost" className="-mr-2 h-7 text-xs">
                View all
              </Button>
            }
          />
        </div>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No history yet.</p>
        ) : (
          <div className="mt-1 divide-y divide-border">
            {history.map((h) => {
              const top = topSet(h.sets);
              return (
                <div
                  key={h.session_id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {format(new Date(h.performed_on), "EEE, MMM d")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      top set · {h.sets.length} logged
                    </p>
                  </div>
                  {top && (
                    <span className="flex items-baseline gap-1">
                      <Metric className="text-xl text-foreground">
                        {top.big}
                      </Metric>
                      {top.small && (
                        <span className="text-xs text-muted-foreground">
                          {top.small}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <form action={addToCurrentSession} className="flex-1">
          <Button type="submit" className="h-12 w-full rounded-lg shadow-cta">
            Add to Session
          </Button>
        </form>
        <Link
          href="/templates"
          className={buttonVariants({
            variant: "outline",
            className: "h-12 flex-1 rounded-lg",
          })}
        >
          Add to Template
        </Link>
      </div>
    </article>
  );
}
