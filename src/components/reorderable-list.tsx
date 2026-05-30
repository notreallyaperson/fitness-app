"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId, useState, useTransition, type ReactNode } from "react";
import { GripVertical } from "lucide-react";

interface Item {
  id: string;
  node: ReactNode;
}

export function ReorderableList({
  items,
  onReorder,
}: {
  items: Item[];
  onReorder: (idsInOrder: string[]) => Promise<void> | void;
}) {
  const [order, setOrder] = useState(items);
  const [prevItems, setPrevItems] = useState(items);
  const [, startTransition] = useTransition();

  // Re-sync with the server when the items prop changes (e.g. a set was
  // added/removed and the route revalidated). The local order state exists
  // only to keep drag reordering responsive; the server remains the source
  // of truth, so without this the list would keep rendering the stale nodes
  // captured at mount until a full reload.
  if (items !== prevItems) {
    setPrevItems(items);
    setOrder(items);
  }
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const id = useId();

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.over.id === e.active.id) return;
    const oldIndex = order.findIndex((i) => i.id === e.active.id);
    const newIndex = order.findIndex((i) => i.id === e.over!.id);
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    startTransition(() => {
      void onReorder(next.map((i) => i.id));
    });
  };

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={order.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-3">
          {order.map((item) => (
            <Row key={item.id} id={item.id}>
              {item.node}
            </Row>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function Row({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <li ref={setNodeRef} style={style} className="flex items-start gap-1.5">
      <button
        type="button"
        className="mt-3 flex w-6 shrink-0 cursor-grab touch-none items-center justify-center text-faint"
        aria-label="Reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}
