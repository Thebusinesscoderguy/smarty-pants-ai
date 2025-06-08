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
      curricula: {
        Row: {
          content: Json
          created_at: string
          description: string | null
          grade_level: string | null
          id: string
          is_active: boolean
          school_id: string | null
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          description?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean
          school_id?: string | null
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          description?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean
          school_id?: string | null
          subject_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curricula_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curricula_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
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
      learning_analytics: {
        Row: {
          correct_attempts: number | null
          id: string
          last_updated: string
          strength_score: number | null
          subject_id: string
          topic_name: string
          total_attempts: number | null
          user_id: string
        }
        Insert: {
          correct_attempts?: number | null
          id?: string
          last_updated?: string
          strength_score?: number | null
          subject_id: string
          topic_name: string
          total_attempts?: number | null
          user_id: string
        }
        Update: {
          correct_attempts?: number | null
          id?: string
          last_updated?: string
          strength_score?: number | null
          subject_id?: string
          topic_name?: string
          total_attempts?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_analytics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
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
          conversation_id: string | null
          created_at: string | null
          curriculum_id: string | null
          file_url: string | null
          id: string
          is_from_user: boolean | null
          type: string
          user_id: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          curriculum_id?: string | null
          file_url?: string | null
          id?: string
          is_from_user?: boolean | null
          type: string
          user_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          curriculum_id?: string | null
          file_url?: string | null
          id?: string
          is_from_user?: boolean | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curricula"
            referencedColumns: ["id"]
          },
        ]
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
      onboarding_status: {
        Row: {
          completed_at: string | null
          created_at: string | null
          has_completed_payment: boolean | null
          has_provided_guardian_email: boolean | null
          has_verified_guardian: boolean | null
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          has_completed_payment?: boolean | null
          has_provided_guardian_email?: boolean | null
          has_verified_guardian?: boolean | null
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          has_completed_payment?: boolean | null
          has_provided_guardian_email?: boolean | null
          has_verified_guardian?: boolean | null
          id?: string
          user_id?: string
        }
        Relationships: []
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
      parent_verification_codes: {
        Row: {
          created_at: string
          expires_at: string
          guardian_email: string
          id: string
          used: boolean | null
          user_id: string
          verification_code: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          guardian_email: string
          id?: string
          used?: boolean | null
          user_id: string
          verification_code: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          guardian_email?: string
          id?: string
          used?: boolean | null
          user_id?: string
          verification_code?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          gamification_enabled: boolean | null
          guardian_email: string | null
          id: string
          leaderboard_visible: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          gamification_enabled?: boolean | null
          guardian_email?: string | null
          id: string
          leaderboard_visible?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          gamification_enabled?: boolean | null
          guardian_email?: string | null
          id?: string
          leaderboard_visible?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      quests: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_id: string | null
          description: string
          difficulty: string
          expires_at: string | null
          id: string
          is_active: boolean
          subject_id: string | null
          target_value: number
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_id?: string | null
          description: string
          difficulty: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          subject_id?: string | null
          target_value: number
          title: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_id?: string | null
          description?: string
          difficulty?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          subject_id?: string | null
          target_value?: number
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "quests_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string
          id: string
          quiz_id: string
          score: number
          time_taken: number | null
          total_possible: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string
          id?: string
          quiz_id: string
          score?: number
          time_taken?: number | null
          total_possible?: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string
          id?: string
          quiz_id?: string
          score?: number
          time_taken?: number | null
          total_possible?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          options: Json | null
          order_index: number
          points: number | null
          question: string
          question_type: string | null
          quiz_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          points?: number | null
          question: string
          question_type?: string | null
          quiz_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          points?: number | null
          question?: string
          question_type?: string | null
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          id: string
          subject_id: string | null
          title: string
          total_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          subject_id?: string | null
          title: string
          total_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          subject_id?: string | null
          title?: string
          total_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      school_accounts: {
        Row: {
          admin_user_id: string
          created_at: string
          id: string
          is_active: boolean
          plan_type: string
          school_name: string
          student_limit: number
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          plan_type?: string
          school_name: string
          student_limit?: number
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          plan_type?: string
          school_name?: string
          student_limit?: number
        }
        Relationships: []
      }
      school_student_relationships: {
        Row: {
          enrolled_at: string
          id: string
          is_active: boolean
          school_id: string
          student_id: string
        }
        Insert: {
          enrolled_at?: string
          id?: string
          is_active?: boolean
          school_id: string
          student_id: string
        }
        Update: {
          enrolled_at?: string
          id?: string
          is_active?: boolean
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_student_relationships_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      student_activity_logs: {
        Row: {
          activity_type: string
          created_at: string
          duration_minutes: number | null
          id: string
          metadata: Json | null
          school_id: string | null
          score: number | null
          student_id: string | null
          subject_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          school_id?: string | null
          score?: number | null
          student_id?: string | null
          subject_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          school_id?: string | null
          score?: number | null
          student_id?: string | null
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_activity_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_activity_logs_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          first_name: string | null
          id: string
          invitation_code: string
          invited_by_id: string
          last_name: string | null
          school_id: string | null
          used: boolean | null
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string
          first_name?: string | null
          id?: string
          invitation_code?: string
          invited_by_id: string
          last_name?: string | null
          school_id?: string | null
          used?: boolean | null
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          first_name?: string | null
          id?: string
          invitation_code?: string
          invited_by_id?: string
          last_name?: string | null
          school_id?: string | null
          used?: boolean | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_invitations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_assignments: {
        Row: {
          assigned_by: string
          assigned_by_id: string | null
          created_at: string
          id: string
          is_active: boolean
          subject_id: string
          user_id: string
        }
        Insert: {
          assigned_by: string
          assigned_by_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          subject_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string
          assigned_by_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          subject_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
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
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          max_students: number | null
          stripe_customer_id: string | null
          student_count: number | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          max_students?: number | null
          stripe_customer_id?: string | null
          student_count?: number | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          max_students?: number | null
          stripe_customer_id?: string | null
          student_count?: number | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
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
          school_id: string | null
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          school_id?: string | null
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          school_id?: string | null
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
          {
            foreignKeyName: "user_achievements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
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
      user_quest_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          current_value: number | null
          id: string
          quest_id: string
          school_id: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          id?: string
          quest_id: string
          school_id?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          id?: string
          quest_id?: string
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quest_progress_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quest_progress_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
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
