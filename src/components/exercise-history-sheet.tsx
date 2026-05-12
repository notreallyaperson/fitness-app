import { format } from "date-fns";
import { getLastSessionsForExercise } from "@/lib/db/history";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export async function ExerciseHistorySheet({
  exerciseId,
  trigger,
}: {
  exerciseId: string;
  trigger: React.ReactElement;
}) {
  const entries = await getLastSessionsForExercise(exerciseId, 3);
  return (
    <Sheet>
      <SheetTrigger render={trigger} />
      <SheetContent side="bottom" className="max-h-[70dvh] overflow-y-auto">
        <SheetTitle>Last 3 sessions</SheetTitle>
        {entries.length === 0 ? (
          <p className="pt-3 text-sm text-muted-foreground">
            No history yet for this exercise.
          </p>
        ) : (
          <ul className="space-y-3 pt-3">
            {entries.map((e) => (
              <li key={e.session_id} className="rounded-md border p-3">
                <div className="text-sm font-medium">
                  {format(new Date(e.performed_on), "EEE, MMM d")}
                </div>
                <div className="text-xs text-muted-foreground">{e.session_name}</div>
                <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs">
                  {e.sets.map((s) => (
                    <span key={s.id} className={s.is_warmup ? "opacity-50" : ""}>
                      {s.weight != null && `${s.weight}${s.weight_unit ?? ""} `}
                      {s.reps != null && `× ${s.reps}`}
                      {s.time_seconds != null && `${s.time_seconds}s`}
                      {s.distance != null && ` ${s.distance}${s.distance_unit ?? ""}`}
                      {s.rpe != null && `  @${s.rpe}`}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
