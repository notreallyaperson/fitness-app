"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { EQUIPMENT_TYPES, humaniseEnum } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import type { EquipmentType } from "@/lib/types/domain";

export function EquipmentFilter({ available }: { available: EquipmentType[] }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const selected = new Set(params.getAll("eq") as EquipmentType[]);
  const showOnlyAvailable = params.get("only_mine") === "1";

  const toggle = (eq: EquipmentType) => {
    const next = new URLSearchParams(params.toString());
    next.delete("eq");
    const newSet = new Set(selected);
    if (newSet.has(eq)) newSet.delete(eq);
    else newSet.add(eq);
    for (const v of newSet) next.append("eq", v);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`));
  };

  const toggleOnlyMine = () => {
    const next = new URLSearchParams(params.toString());
    if (showOnlyAvailable) {
      next.delete("only_mine");
    } else {
      next.set("only_mine", "1");
      if (available.length) {
        next.delete("eq");
        for (const v of available) next.append("eq", v);
      }
    }
    startTransition(() => router.replace(`${pathname}?${next.toString()}`));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <button type="button" onClick={toggleOnlyMine} className="underline">
          {showOnlyAvailable ? "Showing what I have" : "Show only what I have"}
        </button>
        {isPending && <span className="text-muted-foreground">filtering…</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {EQUIPMENT_TYPES.map((eq) => {
          const on = selected.has(eq);
          return (
            <button key={eq} type="button" onClick={() => toggle(eq)} aria-pressed={on}>
              <Badge variant={on ? "default" : "outline"} className="cursor-pointer">
                {humaniseEnum(eq)}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
