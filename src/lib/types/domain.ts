import type { Database, Tables, Enums } from "./database";

export type DB = Database;

export type Profile = Tables<"profiles">;
export type Exercise = Tables<"exercises">;
export type WorkoutTemplate = Tables<"workout_templates">;
export type TemplateExercise = Tables<"workout_template_exercises">;
export type Session = Tables<"sessions">;
export type SessionExercise = Tables<"session_exercises">;
export type WorkoutSet = Tables<"sets">;

export type MuscleGroup = Enums<"muscle_group">;
export type MetricKind = Enums<"metric_kind">;
export type EquipmentType = Enums<"equipment_type">;
export type WeightUnit = Enums<"weight_unit">;
export type DistanceUnit = Enums<"distance_unit">;
