export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      exercises: {
        Row: {
          created_at: string
          default_rest_seconds: number
          description: string | null
          equipment: Database["public"]["Enums"]["equipment_type"][]
          id: string
          is_archived: boolean
          metric_kind: Database["public"]["Enums"]["metric_kind"]
          name: string
          owner_user_id: string | null
          primary_muscle: Database["public"]["Enums"]["muscle_group"] | null
          secondary_muscles: Database["public"]["Enums"]["muscle_group"][]
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_rest_seconds?: number
          description?: string | null
          equipment?: Database["public"]["Enums"]["equipment_type"][]
          id?: string
          is_archived?: boolean
          metric_kind: Database["public"]["Enums"]["metric_kind"]
          name: string
          owner_user_id?: string | null
          primary_muscle?: Database["public"]["Enums"]["muscle_group"] | null
          secondary_muscles?: Database["public"]["Enums"]["muscle_group"][]
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_rest_seconds?: number
          description?: string | null
          equipment?: Database["public"]["Enums"]["equipment_type"][]
          id?: string
          is_archived?: boolean
          metric_kind?: Database["public"]["Enums"]["metric_kind"]
          name?: string
          owner_user_id?: string | null
          primary_muscle?: Database["public"]["Enums"]["muscle_group"] | null
          secondary_muscles?: Database["public"]["Enums"]["muscle_group"][]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          available_equipment: Database["public"]["Enums"]["equipment_type"][]
          created_at: string
          default_bodyweight: number | null
          display_name: string | null
          id: string
          units_distance: Database["public"]["Enums"]["distance_unit"]
          units_weight: Database["public"]["Enums"]["weight_unit"]
          updated_at: string
        }
        Insert: {
          available_equipment?: Database["public"]["Enums"]["equipment_type"][]
          created_at?: string
          default_bodyweight?: number | null
          display_name?: string | null
          id: string
          units_distance?: Database["public"]["Enums"]["distance_unit"]
          units_weight?: Database["public"]["Enums"]["weight_unit"]
          updated_at?: string
        }
        Update: {
          available_equipment?: Database["public"]["Enums"]["equipment_type"][]
          created_at?: string
          default_bodyweight?: number | null
          display_name?: string | null
          id?: string
          units_distance?: Database["public"]["Enums"]["distance_unit"]
          units_weight?: Database["public"]["Enums"]["weight_unit"]
          updated_at?: string
        }
        Relationships: []
      }
      session_exercises: {
        Row: {
          exercise_id: string
          id: string
          notes: string | null
          position: number
          session_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          notes?: string | null
          position: number
          session_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          bodyweight: number | null
          created_at: string
          ended_at: string | null
          id: string
          name: string
          notes: string | null
          pause_intervals: Json
          performed_on: string
          started_at: string
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bodyweight?: number | null
          created_at?: string
          ended_at?: string | null
          id?: string
          name: string
          notes?: string | null
          pause_intervals?: Json
          performed_on?: string
          started_at?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bodyweight?: number | null
          created_at?: string
          ended_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          pause_intervals?: Json
          performed_on?: string
          started_at?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sets: {
        Row: {
          completed_at: string
          distance: number | null
          distance_unit: Database["public"]["Enums"]["distance_unit"] | null
          id: string
          is_warmup: boolean
          notes: string | null
          position: number
          reps: number | null
          rpe: number | null
          session_exercise_id: string
          time_seconds: number | null
          weight: number | null
          weight_unit: Database["public"]["Enums"]["weight_unit"] | null
        }
        Insert: {
          completed_at?: string
          distance?: number | null
          distance_unit?: Database["public"]["Enums"]["distance_unit"] | null
          id?: string
          is_warmup?: boolean
          notes?: string | null
          position: number
          reps?: number | null
          rpe?: number | null
          session_exercise_id: string
          time_seconds?: number | null
          weight?: number | null
          weight_unit?: Database["public"]["Enums"]["weight_unit"] | null
        }
        Update: {
          completed_at?: string
          distance?: number | null
          distance_unit?: Database["public"]["Enums"]["distance_unit"] | null
          id?: string
          is_warmup?: boolean
          notes?: string | null
          position?: number
          reps?: number | null
          rpe?: number | null
          session_exercise_id?: string
          time_seconds?: number | null
          weight?: number | null
          weight_unit?: Database["public"]["Enums"]["weight_unit"] | null
        }
        Relationships: [
          {
            foreignKeyName: "sets_session_exercise_id_fkey"
            columns: ["session_exercise_id"]
            isOneToOne: false
            referencedRelation: "session_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_template_exercises: {
        Row: {
          exercise_id: string
          id: string
          notes: string | null
          position: number
          rest_seconds: number | null
          target_distance: number | null
          target_distance_unit:
            | Database["public"]["Enums"]["distance_unit"]
            | null
          target_reps: number | null
          target_sets: number | null
          target_time_seconds: number | null
          target_weight: number | null
          template_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          notes?: string | null
          position: number
          rest_seconds?: number | null
          target_distance?: number | null
          target_distance_unit?:
            | Database["public"]["Enums"]["distance_unit"]
            | null
          target_reps?: number | null
          target_sets?: number | null
          target_time_seconds?: number | null
          target_weight?: number | null
          template_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          rest_seconds?: number | null
          target_distance?: number | null
          target_distance_unit?:
            | Database["public"]["Enums"]["distance_unit"]
            | null
          target_reps?: number | null
          target_sets?: number | null
          target_time_seconds?: number | null
          target_weight?: number | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_template_exercises_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      set_volumes: {
        Row: {
          exercise_id: string | null
          is_warmup: boolean | null
          session_exercise_id: string | null
          session_id: string | null
          set_id: string | null
          volume_kg: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sets_session_exercise_id_fkey"
            columns: ["session_exercise_id"]
            isOneToOne: false
            referencedRelation: "session_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      distance_unit: "m" | "km" | "mi"
      equipment_type:
        | "bodyweight"
        | "barbell"
        | "dumbbell"
        | "kettlebell"
        | "ez_bar"
        | "trap_bar"
        | "plates"
        | "bench"
        | "incline_bench"
        | "decline_bench"
        | "squat_rack"
        | "power_rack"
        | "smith_machine"
        | "cable_machine"
        | "pulldown_machine"
        | "leg_press"
        | "leg_extension"
        | "leg_curl"
        | "hack_squat"
        | "pull_up_bar"
        | "dip_bar"
        | "parallel_bars"
        | "rings"
        | "suspension_trainer"
        | "resistance_band"
        | "medicine_ball"
        | "ab_wheel"
        | "foam_roller"
        | "box"
        | "bosu_ball"
        | "jump_rope"
        | "sled"
        | "treadmill"
        | "stationary_bike"
        | "rowing_machine"
        | "elliptical"
        | "stair_climber"
        | "swimming_pool"
      metric_kind:
        | "weight_reps"
        | "bodyweight_reps"
        | "weighted_bodyweight_reps"
        | "time_only"
        | "time_weight"
        | "distance_only"
        | "distance_time"
        | "none"
      muscle_group:
        | "chest"
        | "back"
        | "lats"
        | "traps"
        | "lower_back"
        | "shoulders"
        | "biceps"
        | "triceps"
        | "forearms"
        | "quads"
        | "hamstrings"
        | "glutes"
        | "calves"
        | "abs"
        | "obliques"
        | "neck"
        | "full_body"
        | "cardio"
        | "adductors"
        | "abductors"
        | "groin"
      weight_unit: "kg" | "lbs"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      distance_unit: ["m", "km", "mi"],
      equipment_type: [
        "bodyweight",
        "barbell",
        "dumbbell",
        "kettlebell",
        "ez_bar",
        "trap_bar",
        "plates",
        "bench",
        "incline_bench",
        "decline_bench",
        "squat_rack",
        "power_rack",
        "smith_machine",
        "cable_machine",
        "pulldown_machine",
        "leg_press",
        "leg_extension",
        "leg_curl",
        "hack_squat",
        "pull_up_bar",
        "dip_bar",
        "parallel_bars",
        "rings",
        "suspension_trainer",
        "resistance_band",
        "medicine_ball",
        "ab_wheel",
        "foam_roller",
        "box",
        "bosu_ball",
        "jump_rope",
        "sled",
        "treadmill",
        "stationary_bike",
        "rowing_machine",
        "elliptical",
        "stair_climber",
        "swimming_pool",
      ],
      metric_kind: [
        "weight_reps",
        "bodyweight_reps",
        "weighted_bodyweight_reps",
        "time_only",
        "time_weight",
        "distance_only",
        "distance_time",
        "none",
      ],
      muscle_group: [
        "chest",
        "back",
        "lats",
        "traps",
        "lower_back",
        "shoulders",
        "biceps",
        "triceps",
        "forearms",
        "quads",
        "hamstrings",
        "glutes",
        "calves",
        "abs",
        "obliques",
        "neck",
        "full_body",
        "cardio",
        "adductors",
        "abductors",
        "groin",
      ],
      weight_unit: ["kg", "lbs"],
    },
  },
} as const
