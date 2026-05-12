"use client";

import { useState } from "react";
import { EQUIPMENT_TYPES, humaniseEnum } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import type { EquipmentType } from "@/lib/types/domain";

export function EquipmentMultiselect({
  name,
  defaultValue = [],
}: {
  name: string;
  defaultValue?: EquipmentType[];
}) {
  const [selected, setSelected] = useState<Set<EquipmentType>>(new Set(defaultValue));

  const toggle = (eq: EquipmentType) => {
    const next = new Set(selected);
    if (next.has(eq)) next.delete(eq);
    else next.add(eq);
    setSelected(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {EQUIPMENT_TYPES.map((eq) => {
          const on = selected.has(eq);
          return (
            <button
              type="button"
              key={eq}
              onClick={() => toggle(eq)}
              className="focus:outline-none"
              aria-pressed={on}
            >
              <Badge variant={on ? "default" : "outline"} className="cursor-pointer">
                {humaniseEnum(eq)}
              </Badge>
            </button>
          );
        })}
      </div>
      {[...selected].map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
    </div>
  );
}
