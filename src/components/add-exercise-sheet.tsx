"use client";

import { useState, useTransition } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { humaniseEnum } from "@/lib/enums";
import type { Exercise, EquipmentType } from "@/lib/types/domain";
import { searchExercisesForPicker } from "@/server/actions/exercises";

export function AddExerciseSheet({
  triggerLabel,
  triggerVariant = "outline",
  triggerNode,
  onPick,
  defaultEquipment = [],
}: {
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  triggerNode?: React.ReactElement;
  onPick: (exerciseId: string) => Promise<void> | void;
  defaultEquipment?: EquipmentType[];
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const refresh = (next: string) => {
    setQ(next);
    startTransition(async () => {
      const data = await searchExercisesForPicker({
        q: next,
        equipment: defaultEquipment,
      });
      setResults(data);
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {triggerNode ? (
        // triggerNode can be a non-button element (e.g. a menuitem), so tell
        // Base UI not to expect native <button> semantics.
        <SheetTrigger render={triggerNode} nativeButton={false} />
      ) : (
        <SheetTrigger render={<Button variant={triggerVariant} className="w-full" />}>
          {triggerLabel}
        </SheetTrigger>
      )}
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
        <SheetTitle>Add exercise</SheetTitle>
        <div className="space-y-3 pt-3">
          <Input
            autoFocus
            value={q}
            onChange={(e) => refresh(e.target.value)}
            placeholder="Search…"
          />
          <ul className="divide-y rounded-lg border">
            {results.map((ex) => (
              <li key={ex.id} className="flex items-center justify-between p-3">
                <div>
                  <div className="font-medium">{ex.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {ex.primary_muscle ? humaniseEnum(ex.primary_muscle) : "—"}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(ex.equipment ?? []).slice(0, 4).map((eq) => (
                      <Badge key={eq} variant="outline" className="text-[10px]">
                        {humaniseEnum(eq)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    await onPick(ex.id);
                    setOpen(false);
                  }}
                >
                  Add
                </Button>
              </li>
            ))}
            {q && results.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">No matches.</li>
            )}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
