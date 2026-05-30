import { describe, it, expect } from "vitest";
import { WorkoutImportSchema } from "@/lib/validation";
import { inferMetricKind, buildImportPlan } from "@/lib/import-plan";

const validJson = {
  name: "Push Day A",
  notes: "feeling good",
  exercises: [
    {
      name: "Bench Press",
      metric_kind: "weight_reps",
      sets: [
        { weight: 60, weight_unit: "kg", reps: 8, rpe: 8 },
        { weight: 62.5, weight_unit: "kg", reps: 6 },
      ],
    },
    {
      name: "Plank",
      sets: [{ time_seconds: 60 }, { time_seconds: 60 }],
    },
  ],
};

describe("WorkoutImportSchema", () => {
  it("accepts a valid workout", () => {
    const parsed = WorkoutImportSchema.parse(validJson);
    expect(parsed.name).toBe("Push Day A");
    expect(parsed.exercises).toHaveLength(2);
    expect(parsed.exercises[0].sets).toHaveLength(2);
  });

  it("rejects a missing name", () => {
    expect(() =>
      WorkoutImportSchema.parse({ ...validJson, name: undefined }),
    ).toThrow();
  });

  it("rejects an empty exercises array", () => {
    expect(() =>
      WorkoutImportSchema.parse({ ...validJson, exercises: [] }),
    ).toThrow();
  });

  it("rejects an exercise without a name", () => {
    expect(() =>
      WorkoutImportSchema.parse({
        ...validJson,
        exercises: [{ sets: [] }],
      }),
    ).toThrow();
  });

  it("rejects an invalid metric_kind", () => {
    expect(() =>
      WorkoutImportSchema.parse({
        ...validJson,
        exercises: [{ name: "X", metric_kind: "bogus", sets: [] }],
      }),
    ).toThrow();
  });

  it("rejects an out-of-range rpe", () => {
    expect(() =>
      WorkoutImportSchema.parse({
        ...validJson,
        exercises: [{ name: "X", sets: [{ reps: 5, rpe: 11 }] }],
      }),
    ).toThrow();
  });
});

describe("inferMetricKind", () => {
  it("defaults to weight_reps for empty sets", () => {
    expect(inferMetricKind([])).toBe("weight_reps");
  });

  it("returns weight_reps for weight + reps sets", () => {
    expect(inferMetricKind([{ weight: 60, reps: 8 }])).toBe("weight_reps");
  });

  it("returns time_only when sets have time but no distance", () => {
    expect(inferMetricKind([{ time_seconds: 60 }])).toBe("time_only");
  });

  it("returns distance_only when sets have distance but no time", () => {
    expect(inferMetricKind([{ distance: 5, distance_unit: "km" }])).toBe(
      "distance_only",
    );
  });

  it("returns distance_time when sets have both distance and time", () => {
    expect(inferMetricKind([{ distance: 5, time_seconds: 1500 }])).toBe(
      "distance_time",
    );
  });
});

describe("buildImportPlan", () => {
  it("maps name, notes and exercises with explicit metric_kind", () => {
    const plan = buildImportPlan(WorkoutImportSchema.parse(validJson));
    expect(plan.name).toBe("Push Day A");
    expect(plan.notes).toBe("feeling good");
    expect(plan.exercises[0].name).toBe("Bench Press");
    expect(plan.exercises[0].metricKind).toBe("weight_reps");
  });

  it("infers metric_kind when omitted", () => {
    const plan = buildImportPlan(WorkoutImportSchema.parse(validJson));
    // Plank has no metric_kind in the JSON; sets carry time_seconds.
    expect(plan.exercises[1].metricKind).toBe("time_only");
  });

  it("assigns sequential set positions within each exercise", () => {
    const plan = buildImportPlan(WorkoutImportSchema.parse(validJson));
    expect(plan.exercises[0].sets.map((s) => s.position)).toEqual([0, 1]);
    expect(plan.exercises[1].sets.map((s) => s.position)).toEqual([0, 1]);
  });

  it("preserves set fields", () => {
    const plan = buildImportPlan(WorkoutImportSchema.parse(validJson));
    expect(plan.exercises[0].sets[0]).toMatchObject({
      weight: 60,
      weight_unit: "kg",
      reps: 8,
      rpe: 8,
      position: 0,
    });
  });

  it("defaults missing notes to null", () => {
    const plan = buildImportPlan(
      WorkoutImportSchema.parse({ ...validJson, notes: undefined }),
    );
    expect(plan.notes).toBeNull();
  });

  it("produces a uniform set of keys across all sets (PostgREST bulk insert needs identical keys)", () => {
    // Mixed metric kinds + warmups: each raw set carries different fields, but
    // the plan must normalise them to one shape or a bulk insert hits PGRST102.
    const mixed = {
      name: "Recovery",
      exercises: [
        { name: "Walk", metric_kind: "distance_time", sets: [{ distance: 2, distance_unit: "km", time_seconds: 1200 }] },
        { name: "Swim", metric_kind: "time_only", sets: [{ time_seconds: 1200 }] },
        { name: "Chins", metric_kind: "bodyweight_reps", sets: [{ reps: 5, is_warmup: true }, { reps: 8, rpe: 7 }] },
      ],
    };
    const plan = buildImportPlan(WorkoutImportSchema.parse(mixed));
    const sig = (o: object) => Object.keys(o).sort().join(",");
    const signatures = new Set(plan.exercises.flatMap((e) => e.sets).map(sig));
    expect(signatures.size).toBe(1);
  });

  it("normalises sets to nulls (and is_warmup false) for absent fields", () => {
    const plan = buildImportPlan(
      WorkoutImportSchema.parse({
        name: "X",
        exercises: [{ name: "Swim", metric_kind: "time_only", sets: [{ time_seconds: 60 }] }],
      }),
    );
    expect(plan.exercises[0].sets[0]).toEqual({
      position: 0,
      reps: null,
      weight: null,
      weight_unit: null,
      time_seconds: 60,
      distance: null,
      distance_unit: null,
      rpe: null,
      is_warmup: false,
      notes: null,
    });
  });
});
