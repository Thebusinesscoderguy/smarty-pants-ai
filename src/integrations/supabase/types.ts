export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string | null
          criteria: Json | null
          description: string | null
          icon: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["achievement_type"]
        }
        Insert: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["achievement_type"]
        }
        Update: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["achievement_type"]
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          created_at: string | null
          description: string
          id: string
          target_value: number
          title: string
        }
        Insert: {
          challenge_date?: string
          created_at?: string | null
          description: string
          id?: string
          target_value: number
          title: string
        }
        Update: {
          challenge_date?: string
          created_at?: string | null
          description?: string
          id?: string
          target_value?: number
          title?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          created_at: string | null
          file_path: string
          file_type: string
          filename: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_path: string
          file_type: string
          filename: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string
          file_type?: string
          filename?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          module_id: string | null
          name: string
          order_index: number
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          name: string
          order_index?: number
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          name?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          file_url: string | null
          id: string
          is_from_user: boolean | null
          type: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          is_from_user?: boolean | null
          type: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          is_from_user?: boolean | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          order_index: number
          subject_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order_index?: number
          subject_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_child_relationships: {
        Row: {
          child_id: string | null
          created_at: string | null
          id: string
          parent_id: string | null
        }
        Insert: {
          child_id?: string | null
          created_at?: string | null
          id?: string
          parent_id?: string | null
        }
        Update: {
          child_id?: string | null
          created_at?: string | null
          id?: string
          parent_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          gamification_enabled: boolean | null
          id: string
          leaderboard_visible: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          gamification_enabled?: boolean | null
          id: string
          leaderboard_visible?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          gamification_enabled?: boolean | null
          id?: string
          leaderboard_visible?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      teacher_student_relationships: {
        Row: {
          created_at: string | null
          id: string
          student_id: string | null
          teacher_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          student_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          student_id?: string | null
          teacher_id?: string | null
        }
        Relationships: []
      }
      token_usage: {
        Row: {
          created_at: string | null
          feature: string
          id: string
          tokens_used: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          feature: string
          id?: string
          tokens_used: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          feature?: string
          id?: string
          tokens_used?: number
          user_id?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string | null
          earned_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          current_value: number | null
          id: string
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          id: string
          lesson_id: string | null
          started_at: string | null
          status: string
          time_spent: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          started_at?: string | null
          status?: string
          time_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          started_at?: string | null
          status?: string
          time_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      achievement_type:
        | "milestone"
        | "streak"
        | "completion"
        | "mastery"
        | "challenge"
      user_role: "student" | "parent" | "teacher"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      achievement_type: [
        "milestone",
        "streak",
        "completion",
        "mastery",
        "challenge",
      ],
      user_role: ["student", "parent", "teacher"],
    },
  },
} as const
