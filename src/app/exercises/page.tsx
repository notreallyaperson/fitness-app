import Link from "next/link";
import { ChevronRight, Dumbbell } from "lucide-react";
import { listExercises } from "@/lib/db/exercises";
import { getMyProfile } from "@/lib/db/profiles";
import { ExerciseSearchBox } from "@/components/exercise-search";
import { EquipmentFilter } from "@/components/equipment-filter";
import { Badge } from "@/components/ui/badge";
import { humaniseEnum } from "@/lib/enums";
import type { EquipmentType, Exercise } from "@/lib/types/domain";

interface SP {
  q?: string;
  eq?: string | string[];
  only_mine?: string;
}

function groupByLetter(exercises: Exercise[]): [string, Exercise[]][] {
  const map = new Map<string, Exercise[]>();
  for (const ex of exercises) {
    const letter = (ex.name[0] ?? "#").toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : "#";
    (map.get(key) ?? map.set(key, []).get(key)!).push(ex);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const profile = await getMyProfile();

  const equipment = (
    Array.isArray(sp.eq) ? sp.eq : sp.eq ? [sp.eq] : []
  ) as EquipmentType[];
  const exercises = await listExercises({ q: sp.q, equipment });
  const groups = groupByLetter(exercises);

  return (
    <div className="space-y-4 pt-1">
      <h1 className="text-[27px] font-bold tracking-[-0.03em]">Library</h1>

      <ExerciseSearchBox />
      <EquipmentFilter available={profile.available_equipment ?? []} />

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          No exercises match.
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(([letter, items]) => (
            <section key={letter}>
              <h2 className="mb-1.5 px-1 text-[11px] font-semibold tracking-[0.07em] text-faint uppercase">
                {letter}
              </h2>
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-soft">
                {items.map((ex) => (
                  <Link
                    key={ex.id}
                    href={`/exercises/${ex.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Dumbbell className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {ex.name}
                    </span>
                    {ex.primary_muscle && (
                      <Badge variant="secondary" className="text-[10px]">
                        {humaniseEnum(ex.primary_muscle)}
                      </Badge>
                    )}
                    <ChevronRight className="size-4 shrink-0 text-faint" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
