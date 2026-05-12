// Hand-written stub matching the migrations exactly. Will be replaced
// by `pnpm db:types` (supabase gen types typescript --linked) once the
// remote DB is linked. The shapes here match what supabase generates.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type MuscleGroup =
  | "chest" | "back" | "lats" | "traps" | "lower_back" | "shoulders"
  | "biceps" | "triceps" | "forearms" | "quads" | "hamstrings" | "glutes"
  | "calves" | "abs" | "obliques" | "neck" | "full_body" | "cardio";

type MetricKind =
  | "weight_reps" | "bodyweight_reps" | "weighted_bodyweight_reps"
  | "time_only" | "time_weight" | "distance_only" | "distance_time" | "none";

type EquipmentType =
  | "bodyweight" | "barbell" | "dumbbell" | "kettlebell" | "ez_bar" | "trap_bar" | "plates"
  | "bench" | "incline_bench" | "decline_bench" | "squat_rack" | "power_rack" | "smith_machine"
  | "cable_machine" | "pulldown_machine" | "leg_press" | "leg_extension" | "leg_curl" | "hack_squat"
  | "pull_up_bar" | "dip_bar" | "parallel_bars" | "rings" | "suspension_trainer"
  | "resistance_band" | "medicine_ball" | "ab_wheel" | "foam_roller" | "box" | "bosu_ball"
  | "jump_rope" | "sled" | "treadmill" | "stationary_bike" | "rowing_machine" | "elliptical"
  | "stair_climber" | "swimming_pool";

type WeightUnitT = "kg" | "lbs";
type DistanceUnitT = "m" | "km" | "mi";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          units_weight: WeightUnitT;
          units_distance: DistanceUnitT;
          default_bodyweight: number | null;
          available_equipment: EquipmentType[];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      exercises: {
        Row: {
          id: string;
          owner_user_id: string | null;
          name: string;
          description: string | null;
          metric_kind: MetricKind;
          default_rest_seconds: number;
          primary_muscle: MuscleGroup | null;
          secondary_muscles: MuscleGroup[];
          equipment: EquipmentType[];
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["exercises"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["exercises"]["Row"]>;
      };
      workout_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["workout_templates"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["workout_templates"]["Row"]>;
      };
      workout_template_exercises: {
        Row: {
          id: string;
          template_id: string;
          exercise_id: string;
          position: number;
          target_sets: number | null;
          target_reps: number | null;
          target_weight: number | null;
          target_time_seconds: number | null;
          target_distance: number | null;
          target_distance_unit: DistanceUnitT | null;
          rest_seconds: number | null;
          notes: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["workout_template_exercises"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["workout_template_exercises"]["Row"]>;
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          template_id: string | null;
          name: string;
          performed_on: string;
          started_at: string;
          ended_at: string | null;
          bodyweight: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sessions"]["Row"], "id" | "created_at" | "updated_at" | "started_at" | "performed_on"> & {
          id?: string;
          started_at?: string;
          performed_on?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sessions"]["Row"]>;
      };
      session_exercises: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          position: number;
          notes: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["session_exercises"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["session_exercises"]["Row"]>;
      };
      sets: {
        Row: {
          id: string;
          session_exercise_id: string;
          position: number;
          is_warmup: boolean;
          reps: number | null;
          weight: number | null;
          weight_unit: WeightUnitT | null;
          time_seconds: number | null;
          distance: number | null;
          distance_unit: DistanceUnitT | null;
          rpe: number | null;
          notes: string | null;
          completed_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sets"]["Row"], "id" | "completed_at"> & {
          id?: string;
          completed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sets"]["Row"]>;
      };
    };
    Views: {
      set_volumes: {
        Row: {
          set_id: string;
          session_exercise_id: string;
          session_id: string;
          exercise_id: string;
          is_warmup: boolean;
          volume_kg: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: {
      muscle_group: MuscleGroup;
      metric_kind: MetricKind;
      equipment_type: EquipmentType;
      weight_unit: WeightUnitT;
      distance_unit: DistanceUnitT;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
