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
}

export function ReorderableList<T extends Item>({
  items,
  onReorder,
  renderItem,
}: {
  items: T[];
  onReorder: (idsInOrder: string[]) => Promise<void> | void;
  renderItem: (item: T) => ReactNode;
}) {
  const [order, setOrder] = useState(items);
  const [, startTransition] = useTransition();
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
        <ul className="divide-y rounded-lg border">
          {order.map((item) => (
            <Row key={item.id} id={item.id}>
              {renderItem(item)}
            </Row>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function Row({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li ref={setNodeRef} style={style} className="flex items-stretch">
      <button
        type="button"
        className="flex w-10 cursor-grab items-center justify-center text-muted-foreground"
        aria-label="Reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 p-2">{children}</div>
    </li>
  );
}
