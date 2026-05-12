import Link from "next/link";
import { listExercises } from "@/lib/db/exercises";
import { getMyProfile } from "@/lib/db/profiles";
import { ExerciseSearchBox } from "@/components/exercise-search";
import { EquipmentFilter } from "@/components/equipment-filter";
import { humaniseEnum } from "@/lib/enums";
import type { EquipmentType } from "@/lib/types/domain";

interface SP {
  q?: string;
  eq?: string | string[];
  only_mine?: string;
}

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const profile = await getMyProfile();

  const equipment = (Array.isArray(sp.eq) ? sp.eq : sp.eq ? [sp.eq] : []) as EquipmentType[];
  const exercises = await listExercises({ q: sp.q, equipment });

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Exercises</h1>
      </div>

      <ExerciseSearchBox />
      <EquipmentFilter available={profile.available_equipment ?? []} />

      <ul className="divide-y rounded-lg border">
        {exercises.map((ex) => (
          <li key={ex.id} className="p-3">
            <Link href={`/exercises/${ex.id}`} className="block">
              <div className="font-medium">{ex.name}</div>
              <div className="text-xs text-muted-foreground">
                {ex.primary_muscle ? humaniseEnum(ex.primary_muscle) : "—"}
                {ex.equipment && ex.equipment.length > 0 && (
                  <> · {ex.equipment.map(humaniseEnum).join(", ")}</>
                )}
              </div>
            </Link>
          </li>
        ))}
        {exercises.length === 0 && (
          <li className="p-4 text-center text-sm text-muted-foreground">
            No exercises match.
          </li>
        )}
      </ul>
    </div>
  );
}
