"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { EQUIPMENT_TYPES, humaniseEnum } from "@/lib/enums";
import { cn } from "@/lib/utils";
import type { EquipmentType } from "@/lib/types/domain";

export function EquipmentFilter({ available }: { available: EquipmentType[] }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const selected = new Set(params.getAll("eq") as EquipmentType[]);
  const showOnlyAvailable = params.get("only_mine") === "1";

  const push = (next: URLSearchParams) =>
    startTransition(() => router.replace(`${pathname}?${next.toString()}`));

  const toggle = (eq: EquipmentType) => {
    const next = new URLSearchParams(params.toString());
    next.delete("eq");
    const newSet = new Set(selected);
    if (newSet.has(eq)) newSet.delete(eq);
    else newSet.add(eq);
    for (const v of newSet) next.append("eq", v);
    push(next);
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
    push(next);
  };

  const hasFilters = selected.size > 0 || showOnlyAvailable;
  const clearAll = () => {
    const next = new URLSearchParams(params.toString());
    next.delete("eq");
    next.delete("only_mine");
    push(next);
  };

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="flex shrink-0 items-center gap-1 rounded-full border border-border-strong bg-card px-3 py-1.5 text-xs font-medium whitespace-nowrap text-destructive transition-transform duration-[120ms] ease-tap active:scale-[0.97]"
        >
          <X className="size-3.5" /> Clear
        </button>
      )}
      <Chip active={showOnlyAvailable} onClick={toggleOnlyMine}>
        My gear
      </Chip>
      {EQUIPMENT_TYPES.map((eq) => (
        <Chip key={eq} active={selected.has(eq)} onClick={() => toggle(eq)}>
          {humaniseEnum(eq)}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-[120ms] ease-tap active:scale-[0.97]",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border-strong bg-card text-secondary-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
