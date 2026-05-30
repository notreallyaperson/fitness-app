import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ReorderableList } from "@/components/reorderable-list";

describe("ReorderableList", () => {
  const noop = () => {};

  it("reflects updated item nodes when the items prop changes", () => {
    // Mirrors a server revalidation: a set is logged inside an exercise, the
    // route re-renders, and ReorderableList receives fresh nodes.
    const { rerender } = render(
      <ReorderableList items={[{ id: "a", node: <span>1 set</span> }]} onReorder={noop} />,
    );
    expect(screen.getByText("1 set")).toBeInTheDocument();

    rerender(
      <ReorderableList items={[{ id: "a", node: <span>2 sets</span> }]} onReorder={noop} />,
    );
    expect(screen.getByText("2 sets")).toBeInTheDocument();
    expect(screen.queryByText("1 set")).not.toBeInTheDocument();
  });

  it("reflects added and removed items when the items prop changes", () => {
    const { rerender } = render(
      <ReorderableList items={[{ id: "a", node: <span>A</span> }]} onReorder={noop} />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.queryByText("B")).not.toBeInTheDocument();

    rerender(
      <ReorderableList
        items={[
          { id: "a", node: <span>A</span> },
          { id: "b", node: <span>B</span> },
        ]}
        onReorder={noop}
      />,
    );
    expect(screen.getByText("B")).toBeInTheDocument();

    rerender(
      <ReorderableList items={[{ id: "b", node: <span>B</span> }]} onReorder={noop} />,
    );
    expect(screen.queryByText("A")).not.toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
