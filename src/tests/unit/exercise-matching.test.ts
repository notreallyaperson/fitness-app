import { describe, it, expect } from "vitest";
import { defaultChoice, CONFIDENCE_THRESHOLD } from "@/lib/exercise-matching";

describe("defaultChoice", () => {
  it("preselects the match at or above the threshold", () => {
    expect(defaultChoice(CONFIDENCE_THRESHOLD, "id-bench")).toEqual({
      kind: "match",
      exerciseId: "id-bench",
    });
    expect(defaultChoice(0.95, "id-bench")).toEqual({ kind: "match", exerciseId: "id-bench" });
  });

  it("preselects Create new below the threshold", () => {
    expect(defaultChoice(0.4, "id-bench")).toEqual({ kind: "new" });
  });

  it("preselects Create new when there is no match", () => {
    expect(defaultChoice(0.99, null)).toEqual({ kind: "new" });
  });
});
