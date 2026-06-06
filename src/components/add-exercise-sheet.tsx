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
  open: openProp,
  onOpenChange,
  title = "Add exercise",
  actionLabel = "Add",
}: {
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  triggerNode?: React.ReactElement;
  onPick: (exerciseId: string) => Promise<void> | void;
  defaultEquipment?: EquipmentType[];
  /** Controlled open state. When provided, the sheet renders no trigger. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  actionLabel?: string;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [internalOpen, setInternalOpen] = useState(false);
  const [, startTransition] = useTransition();

  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

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
      {isControlled ? null : triggerNode ? (
        // triggerNode can be a non-button element (e.g. a menuitem), so tell
        // Base UI not to expect native <button> semantics.
        <SheetTrigger render={triggerNode} nativeButton={false} />
      ) : (
        <SheetTrigger render={<Button variant={triggerVariant} className="w-full" />}>
          {triggerLabel}
        </SheetTrigger>
      )}
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] overflow-y-auto rounded-t-xl bg-elevated"
      >
        <div className="mx-auto mb-1 h-1.5 w-10 rounded-full bg-border" />
        <SheetTitle className="text-lg font-bold tracking-[-0.02em]">
          {title}
        </SheetTitle>
        <div className="space-y-3 pt-3">
          <Input
            autoFocus
            value={q}
            onChange={(e) => refresh(e.target.value)}
            placeholder="Search…"
            className="h-11 bg-muted"
          />
          <ul className="divide-y divide-border">
            {results.map((ex) => (
              <li
                key={ex.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{ex.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {ex.primary_muscle ? humaniseEnum(ex.primary_muscle) : "—"}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(ex.equipment ?? []).slice(0, 4).map((eq) => (
                      <Badge key={eq} variant="secondary" className="text-[10px]">
                        {humaniseEnum(eq)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="shrink-0"
                  onClick={async () => {
                    await onPick(ex.id);
                    setOpen(false);
                  }}
                >
                  {actionLabel}
                </Button>
              </li>
            ))}
            {q && results.length === 0 && (
              <li className="py-4 text-sm text-muted-foreground">No matches.</li>
            )}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
