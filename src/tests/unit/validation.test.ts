import { describe, it, expect } from "vitest";
import { SetInputSchema, TemplateInputSchema, SessionDateSchema } from "@/lib/validation";

describe("SetInputSchema", () => {
  it("accepts a normal weighted set", () => {
    expect(SetInputSchema.safeParse({
      reps: 8, weight: 60, weight_unit: "kg",
    }).success).toBe(true);
  });
  it("rejects negative reps", () => {
    expect(SetInputSchema.safeParse({ reps: -1 }).success).toBe(false);
  });
  it("rejects rpe out of [1,10]", () => {
    expect(SetInputSchema.safeParse({ rpe: 11 }).success).toBe(false);
    expect(SetInputSchema.safeParse({ rpe: 0 }).success).toBe(false);
  });
});

describe("TemplateInputSchema", () => {
  it("requires a non-empty name", () => {
    expect(TemplateInputSchema.safeParse({ name: "" }).success).toBe(false);
    expect(TemplateInputSchema.safeParse({ name: "Push Day" }).success).toBe(true);
  });
});

describe("SessionDateSchema", () => {
  it("accepts ISO date", () => {
    expect(SessionDateSchema.safeParse("2026-05-09").success).toBe(true);
  });
  it("rejects garbage", () => {
    expect(SessionDateSchema.safeParse("yesterday").success).toBe(false);
  });
});
