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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_event_classifications: {
        Row: {
          confidence: number | null
          created_at: string
          event_id: string
          id: string
          increments: Json
          matched_quests: string[]
          model: string
          reason: string
          verdict: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          event_id: string
          id?: string
          increments?: Json
          matched_quests?: string[]
          model: string
          reason: string
          verdict: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          event_id?: string
          id?: string
          increments?: Json
          matched_quests?: string[]
          model?: string
          reason?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_event_classifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "quest_events"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_rate_limits: {
        Row: {
          count: number
          endpoint: string
          ip: string
          window_start: string
        }
        Insert: {
          count?: number
          endpoint: string
          ip: string
          window_start: string
        }
        Update: {
          count?: number
          endpoint?: string
          ip?: string
          window_start?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          attachment_urls: string[]
          content: string | null
          created_at: string
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          score: number | null
          status: string
          student_id: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          attachment_urls?: string[]
          content?: string | null
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          status?: string
          student_id: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          attachment_urls?: string[]
          content?: string | null
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          status?: string
          student_id?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          allow_late: boolean
          attachment_urls: string[]
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          late_penalty_pct: number
          published: boolean
          school_id: string
          section_id: string | null
          subject_id: string | null
          title: string
          total_points: number
          updated_at: string
        }
        Insert: {
          allow_late?: boolean
          attachment_urls?: string[]
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          late_penalty_pct?: number
          published?: boolean
          school_id: string
          section_id?: string | null
          subject_id?: string | null
          title: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          allow_late?: boolean
          attachment_urls?: string[]
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          late_penalty_pct?: number
          published?: boolean
          school_id?: string
          section_id?: string | null
          subject_id?: string | null
          title?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      attendance_reasons: {
        Row: {
          created_at: string
          excused: boolean
          id: string
          label: string
          school_id: string
        }
        Insert: {
          created_at?: string
          excused?: boolean
          id?: string
          label: string
          school_id: string
        }
        Update: {
          created_at?: string
          excused?: boolean
          id?: string
          label?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_reasons_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          date: string
          id: string
          marked_at: string
          marked_by: string | null
          notes: string | null
          period: number | null
          school_id: string
          section_id: string | null
          status: string
          student_id: string
        }
        Insert: {
          date: string
          id?: string
          marked_at?: string
          marked_by?: string | null
          notes?: string | null
          period?: number | null
          school_id: string
          section_id?: string | null
          status: string
          student_id: string
        }
        Update: {
          date?: string
          id?: string
          marked_at?: string
          marked_by?: string | null
          notes?: string | null
          period?: number | null
          school_id?: string
          section_id?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "school_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_settings: {
        Row: {
          mode: string
          periods_per_day: number
          school_id: string
          updated_at: string
        }
        Insert: {
          mode?: string
          periods_per_day?: number
          school_id: string
          updated_at?: string
        }
        Update: {
          mode?: string
          periods_per_day?: number
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_email_send_log: {
        Row: {
          created_at: string
          email: string
          id: string
          link_type: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          link_type: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          link_type?: string
        }
        Relationships: []
      }
      behavior_categories: {
        Row: {
          created_at: string
          default_points: number
          id: string
          name: string
          school_id: string
          valence: string
        }
        Insert: {
          created_at?: string
          default_points?: number
          id?: string
          name: string
          school_id: string
          valence: string
        }
        Update: {
          created_at?: string
          default_points?: number
          id?: string
          name?: string
          school_id?: string
          valence?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavior_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      behavior_incidents: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          incident_date: string
          points: number
          recorded_by: string
          school_id: string
          student_id: string
          valence: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          incident_date?: string
          points?: number
          recorded_by?: string
          school_id: string
          student_id: string
          valence: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          incident_date?: string
          points?: number
          recorded_by?: string
          school_id?: string
          student_id?: string
          valence?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavior_incidents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "behavior_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_incidents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          created_at: string
          first_name: string
          grade_level: string | null
          id: string
          last_name: string
          parent_id: string
          subjects: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name: string
          grade_level?: string | null
          id?: string
          last_name: string
          parent_id: string
          subjects?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string
          grade_level?: string | null
          id?: string
          last_name?: string
          parent_id?: string
          subjects?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      content_assignments: {
        Row: {
          assigned_by: string
          assignment_type: string
          classification_tag: string | null
          content_id: string
          content_type: string
          created_at: string | null
          due_date: string | null
          id: string
          is_active: boolean | null
          share_token: string
          target_id: string | null
        }
        Insert: {
          assigned_by: string
          assignment_type: string
          classification_tag?: string | null
          content_id: string
          content_type: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean | null
          share_token?: string
          target_id?: string | null
        }
        Update: {
          assigned_by?: string
          assignment_type?: string
          classification_tag?: string | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean | null
          share_token?: string
          target_id?: string | null
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
      curriculum_books: {
        Row: {
          created_at: string
          created_by: string | null
          grade_level: string
          id: string
          school_id: string
          status: string
          subject_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          grade_level: string
          id?: string
          school_id: string
          status?: string
          subject_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          grade_level?: string
          id?: string
          school_id?: string
          status?: string
          subject_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_books_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_books_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "school_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_documents: {
        Row: {
          char_count: number | null
          created_at: string
          created_by: string | null
          extracted_text: string | null
          grade_level: string
          id: string
          mime_type: string | null
          page_count: number | null
          school_id: string
          status: string
          storage_path: string | null
          subject_id: string
          title: string
          updated_at: string
        }
        Insert: {
          char_count?: number | null
          created_at?: string
          created_by?: string | null
          extracted_text?: string | null
          grade_level: string
          id?: string
          mime_type?: string | null
          page_count?: number | null
          school_id: string
          status?: string
          storage_path?: string | null
          subject_id: string
          title: string
          updated_at?: string
        }
        Update: {
          char_count?: number | null
          created_at?: string
          created_by?: string | null
          extracted_text?: string | null
          grade_level?: string
          id?: string
          mime_type?: string | null
          page_count?: number | null
          school_id?: string
          status?: string
          storage_path?: string | null
          subject_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_documents_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "school_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_lesson_images: {
        Row: {
          book_id: string
          created_at: string
          document_id: string | null
          height: number | null
          id: string
          lesson_id: string
          order_index: number
          page_number: number | null
          school_id: string
          storage_path: string
          width: number | null
        }
        Insert: {
          book_id: string
          created_at?: string
          document_id?: string | null
          height?: number | null
          id?: string
          lesson_id: string
          order_index?: number
          page_number?: number | null
          school_id: string
          storage_path: string
          width?: number | null
        }
        Update: {
          book_id?: string
          created_at?: string
          document_id?: string | null
          height?: number | null
          id?: string
          lesson_id?: string
          order_index?: number
          page_number?: number | null
          school_id?: string
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_lesson_images_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "curriculum_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_lesson_images_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "curriculum_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_lesson_images_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "curriculum_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_lesson_images_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_lessons: {
        Row: {
          confidence: string | null
          content: string | null
          created_at: string
          end_page: number | null
          id: string
          order_index: number
          school_id: string
          source_pages: string | null
          start_page: number | null
          summary: string | null
          title: string
          unit_id: string
        }
        Insert: {
          confidence?: string | null
          content?: string | null
          created_at?: string
          end_page?: number | null
          id?: string
          order_index?: number
          school_id: string
          source_pages?: string | null
          start_page?: number | null
          summary?: string | null
          title: string
          unit_id: string
        }
        Update: {
          confidence?: string | null
          content?: string | null
          created_at?: string
          end_page?: number | null
          id?: string
          order_index?: number
          school_id?: string
          source_pages?: string | null
          start_page?: number | null
          summary?: string | null
          title?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_lessons_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "curriculum_units"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_parse_jobs: {
        Row: {
          book_id: string | null
          created_at: string
          document_id: string
          error: string | null
          id: string
          model: string | null
          proposed_structure: Json | null
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          book_id?: string | null
          created_at?: string
          document_id: string
          error?: string | null
          id?: string
          model?: string | null
          proposed_structure?: Json | null
          school_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          book_id?: string | null
          created_at?: string
          document_id?: string
          error?: string | null
          id?: string
          model?: string | null
          proposed_structure?: Json | null
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_parse_jobs_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "curriculum_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_parse_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "curriculum_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_parse_jobs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_progress: {
        Row: {
          completed_sections: string[] | null
          created_at: string | null
          current_section: string | null
          curriculum_id: string
          id: string
          last_accessed: string | null
          progress_percentage: number | null
          student_id: string
          time_spent_minutes: number | null
        }
        Insert: {
          completed_sections?: string[] | null
          created_at?: string | null
          current_section?: string | null
          curriculum_id: string
          id?: string
          last_accessed?: string | null
          progress_percentage?: number | null
          student_id: string
          time_spent_minutes?: number | null
        }
        Update: {
          completed_sections?: string[] | null
          created_at?: string | null
          current_section?: string | null
          curriculum_id?: string
          id?: string
          last_accessed?: string | null
          progress_percentage?: number | null
          student_id?: string
          time_spent_minutes?: number | null
        }
        Relationships: []
      }
      curriculum_unit_usage: {
        Row: {
          content_id: string | null
          content_type: string
          curriculum_unit_id: string
          id: string
          school_id: string | null
          used_at: string
          user_id: string | null
        }
        Insert: {
          content_id?: string | null
          content_type: string
          curriculum_unit_id: string
          id?: string
          school_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Update: {
          content_id?: string | null
          content_type?: string
          curriculum_unit_id?: string
          id?: string
          school_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      curriculum_units: {
        Row: {
          book_id: string
          confidence: string | null
          created_at: string
          end_page: number | null
          id: string
          order_index: number
          school_id: string
          start_page: number | null
          summary: string | null
          title: string
        }
        Insert: {
          book_id: string
          confidence?: string | null
          created_at?: string
          end_page?: number | null
          id?: string
          order_index?: number
          school_id: string
          start_page?: number | null
          summary?: string | null
          title: string
        }
        Update: {
          book_id?: string
          confidence?: string | null
          created_at?: string
          end_page?: number | null
          id?: string
          order_index?: number
          school_id?: string
          start_page?: number | null
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_units_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "curriculum_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_units_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
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
      demo_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          role: string | null
          school_name: string | null
          school_size: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          role?: string | null
          school_name?: string | null
          school_size?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          role?: string | null
          school_name?: string | null
          school_size?: string | null
          status?: string
        }
        Relationships: []
      }
      exam_session_locks: {
        Row: {
          created_at: string
          last_seen_at: string
          session_id: string
          tab_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_seen_at?: string
          session_id: string
          tab_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_seen_at?: string
          session_id?: string
          tab_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_session_locks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sessions: {
        Row: {
          answers: Json | null
          created_at: string
          end_time: string | null
          flagged: boolean
          id: string
          percentage: number | null
          quiz_id: string
          score: number | null
          start_time: string
          status: string
          submitted_at: string | null
          time_limit: number
          time_taken_seconds: number | null
          total_points: number | null
          updated_at: string
          user_id: string
          violation_count: number
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          end_time?: string | null
          flagged?: boolean
          id?: string
          percentage?: number | null
          quiz_id: string
          score?: number | null
          start_time?: string
          status?: string
          submitted_at?: string | null
          time_limit: number
          time_taken_seconds?: number | null
          total_points?: number | null
          updated_at?: string
          user_id: string
          violation_count?: number
        }
        Update: {
          answers?: Json | null
          created_at?: string
          end_time?: string | null
          flagged?: boolean
          id?: string
          percentage?: number | null
          quiz_id?: string
          score?: number | null
          start_time?: string
          status?: string
          submitted_at?: string | null
          time_limit?: number
          time_taken_seconds?: number | null
          total_points?: number | null
          updated_at?: string
          user_id?: string
          violation_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_sessions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_violations: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          session_id: string
          timestamp: string
          type: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          session_id: string
          timestamp?: string
          type: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          session_id?: string
          timestamp?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_violations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
        ]
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
      goal_updates: {
        Row: {
          created_at: string
          created_by: string
          goal_id: string
          id: string
          note: string | null
          progress: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string
          goal_id: string
          id?: string
          note?: string | null
          progress?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          goal_id?: string
          id?: string
          note?: string | null
          progress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_updates_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "growth_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_goals: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          owner_id: string
          owner_type: string
          progress: number
          school_id: string | null
          status: string
          target_date: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          owner_id: string
          owner_type: string
          progress?: number
          school_id?: string | null
          status?: string
          target_date?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          owner_id?: string
          owner_type?: string
          progress?: number
          school_id?: string | null
          status?: string
          target_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_goals_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_assignments: {
        Row: {
          assignment_type: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_active: boolean | null
          school_id: string
          section_id: string | null
          subject_id: string | null
          teacher_id: string
          title: string
        }
        Insert: {
          assignment_type?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean | null
          school_id: string
          section_id?: string | null
          subject_id?: string | null
          teacher_id: string
          title: string
        }
        Update: {
          assignment_type?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean | null
          school_id?: string
          section_id?: string | null
          subject_id?: string | null
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "school_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "school_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_sessions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          difficulty_level: string | null
          file_url: string | null
          hints_used: number | null
          id: string
          problem_description: string | null
          problem_type: string
          session_data: Json | null
          steps_completed: number | null
          student_id: string
          success_rate: number | null
          time_spent_minutes: number | null
          total_steps: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          file_url?: string | null
          hints_used?: number | null
          id?: string
          problem_description?: string | null
          problem_type: string
          session_data?: Json | null
          steps_completed?: number | null
          student_id: string
          success_rate?: number | null
          time_spent_minutes?: number | null
          total_steps?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          file_url?: string | null
          hints_used?: number | null
          id?: string
          problem_description?: string | null
          problem_type?: string
          session_data?: Json | null
          steps_completed?: number | null
          student_id?: string
          success_rate?: number | null
          time_spent_minutes?: number | null
          total_steps?: number | null
        }
        Relationships: []
      }
      homework_submissions: {
        Row: {
          ai_confidence: number | null
          ai_feedback: string | null
          ai_graded_at: string | null
          ai_score: number | null
          assignment_id: string
          created_at: string | null
          feedback: string | null
          id: string
          response_data: Json | null
          score: number | null
          status: string | null
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_feedback?: string | null
          ai_graded_at?: string | null
          ai_score?: number | null
          assignment_id: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          response_data?: Json | null
          score?: number | null
          status?: string | null
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_feedback?: string | null
          ai_graded_at?: string | null
          ai_score?: number | null
          assignment_id?: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          response_data?: Json | null
          score?: number | null
          status?: string | null
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "homework_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      instant_quizzes: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          difficulty_level: string | null
          id: string
          questions: Json
          score: number | null
          student_id: string
          topic: string
          total_questions: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          id?: string
          questions?: Json
          score?: number | null
          student_id: string
          topic: string
          total_questions?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          id?: string
          questions?: Json
          score?: number | null
          student_id?: string
          topic?: string
          total_questions?: number | null
        }
        Relationships: []
      }
      invites: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          child_ids: string[] | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
          school_id: string
          status: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          child_ids?: string[] | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
          school_id: string
          status?: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          child_ids?: string[] | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string
          status?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount_cents: number
          card_brand: string | null
          card_last4: string
          cardholder_name: string
          created_at: string
          currency: string
          id: string
          invoice_id: string
          paid_by: string
        }
        Insert: {
          amount_cents: number
          card_brand?: string | null
          card_last4: string
          cardholder_name: string
          created_at?: string
          currency?: string
          id?: string
          invoice_id: string
          paid_by: string
        }
        Update: {
          amount_cents?: number
          card_brand?: string | null
          card_last4?: string
          cardholder_name?: string
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string
          paid_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "school_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_analytics: {
        Row: {
          baseline_score: number | null
          correct_attempts: number | null
          difficulty_level: string | null
          id: string
          improvement_rate: number | null
          interaction_context: Json | null
          last_updated: string
          response_time_ms: number | null
          strength_score: number | null
          subject_id: string
          topic_name: string
          total_attempts: number | null
          user_id: string
        }
        Insert: {
          baseline_score?: number | null
          correct_attempts?: number | null
          difficulty_level?: string | null
          id?: string
          improvement_rate?: number | null
          interaction_context?: Json | null
          last_updated?: string
          response_time_ms?: number | null
          strength_score?: number | null
          subject_id: string
          topic_name: string
          total_attempts?: number | null
          user_id: string
        }
        Update: {
          baseline_score?: number | null
          correct_attempts?: number | null
          difficulty_level?: string | null
          id?: string
          improvement_rate?: number | null
          interaction_context?: Json | null
          last_updated?: string
          response_time_ms?: number | null
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
      learning_progress_snapshots: {
        Row: {
          average_response_time_ms: number | null
          correct_interactions: number | null
          created_at: string | null
          id: string
          performance_score: number
          snapshot_date: string | null
          student_id: string
          subject_id: string | null
          topic_name: string
          total_interactions: number | null
        }
        Insert: {
          average_response_time_ms?: number | null
          correct_interactions?: number | null
          created_at?: string | null
          id?: string
          performance_score: number
          snapshot_date?: string | null
          student_id: string
          subject_id?: string | null
          topic_name: string
          total_interactions?: number | null
        }
        Update: {
          average_response_time_ms?: number | null
          correct_interactions?: number | null
          created_at?: string | null
          id?: string
          performance_score?: number
          snapshot_date?: string | null
          student_id?: string
          subject_id?: string | null
          topic_name?: string
          total_interactions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_progress_snapshots_subject_id_fkey"
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
      message_translations: {
        Row: {
          created_at: string
          id: string
          message_id: string
          source_language: string | null
          target_language: string
          translated_text: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          source_language?: string | null
          target_language: string
          translated_text: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          source_language?: string | null
          target_language?: string
          translated_text?: string
        }
        Relationships: []
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
      observation_templates: {
        Row: {
          created_at: string
          criteria: Json
          id: string
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string
          criteria?: Json
          id?: string
          name: string
          school_id: string
        }
        Update: {
          created_at?: string
          criteria?: Json
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "observation_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          id: string
          notes: string | null
          observed_at: string
          observer_id: string
          responses: Json
          school_id: string
          section_id: string | null
          status: string
          teacher_id: string
          template_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          observed_at?: string
          observer_id?: string
          responses?: Json
          school_id: string
          section_id?: string | null
          status?: string
          teacher_id: string
          template_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          observed_at?: string
          observer_id?: string
          responses?: Json
          school_id?: string
          section_id?: string | null
          status?: string
          teacher_id?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "observations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "school_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "school_teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "observation_templates"
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
      parent_email_preferences: {
        Row: {
          created_at: string
          last_digest_sent_at: string | null
          parent_id: string
          updated_at: string
          weekly_digest_enabled: boolean
        }
        Insert: {
          created_at?: string
          last_digest_sent_at?: string | null
          parent_id: string
          updated_at?: string
          weekly_digest_enabled?: boolean
        }
        Update: {
          created_at?: string
          last_digest_sent_at?: string | null
          parent_id?: string
          updated_at?: string
          weekly_digest_enabled?: boolean
        }
        Relationships: []
      }
      parent_teacher_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read_at: string | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read_at?: string | null
          sender_id: string
          thread_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read_at?: string | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_teacher_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "parent_teacher_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_teacher_threads: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          parent_id: string
          school_id: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          parent_id: string
          school_id: string
          student_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          parent_id?: string
          school_id?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_teacher_threads_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_teacher_threads_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "school_teachers"
            referencedColumns: ["id"]
          },
        ]
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
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          gamification_enabled: boolean | null
          guardian_email: string | null
          id: string
          leaderboard_visible: boolean | null
          onboarding_completed: boolean | null
          preferred_language: string | null
          referral_code: string | null
          role: Database["public"]["Enums"]["user_role"]
          student_photo_path: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          gamification_enabled?: boolean | null
          guardian_email?: string | null
          id: string
          leaderboard_visible?: boolean | null
          onboarding_completed?: boolean | null
          preferred_language?: string | null
          referral_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          student_photo_path?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          gamification_enabled?: boolean | null
          guardian_email?: string | null
          id?: string
          leaderboard_visible?: boolean | null
          onboarding_completed?: boolean | null
          preferred_language?: string | null
          referral_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          student_photo_path?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quest_event_links: {
        Row: {
          applied: boolean
          applied_at: string | null
          event_id: string
          id: string
          increment: number
          quest_id: string
        }
        Insert: {
          applied?: boolean
          applied_at?: string | null
          event_id: string
          id?: string
          increment?: number
          quest_id: string
        }
        Update: {
          applied?: boolean
          applied_at?: string | null
          event_id?: string
          id?: string
          increment?: number
          quest_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_event_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "quest_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_event_links_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_events: {
        Row: {
          classification_id: string | null
          created_at: string
          dedup_hash: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          score: number | null
          source: string
          status: string
          subject_id: string | null
          user_id: string
        }
        Insert: {
          classification_id?: string | null
          created_at?: string
          dedup_hash?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          score?: number | null
          source: string
          status?: string
          subject_id?: string | null
          user_id: string
        }
        Update: {
          classification_id?: string | null
          created_at?: string
          dedup_hash?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          score?: number | null
          source?: string
          status?: string
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quest_events_classification"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "ai_event_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_events_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      question_bank: {
        Row: {
          answer: string
          created_at: string | null
          created_by: string | null
          curriculum: string | null
          difficulty: string | null
          grade_level: string | null
          id: string
          options: Json | null
          question_text: string
          question_type: string | null
          school_id: string | null
          subject: string
          tags: string[] | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          created_by?: string | null
          curriculum?: string | null
          difficulty?: string | null
          grade_level?: string | null
          id?: string
          options?: Json | null
          question_text: string
          question_type?: string | null
          school_id?: string | null
          subject: string
          tags?: string[] | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          created_by?: string | null
          curriculum?: string | null
          difficulty?: string | null
          grade_level?: string | null
          id?: string
          options?: Json | null
          question_text?: string
          question_type?: string | null
          school_id?: string | null
          subject?: string
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          assigned_children: string[] | null
          created_at: string
          created_by: string | null
          created_by_id: string | null
          description: string
          difficulty: string
          expires_at: string | null
          id: string
          is_active: boolean
          requirements: Json | null
          rewards: Json | null
          subject_id: string | null
          target_value: number
          title: string
          type: string
        }
        Insert: {
          assigned_children?: string[] | null
          created_at?: string
          created_by?: string | null
          created_by_id?: string | null
          description: string
          difficulty: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          requirements?: Json | null
          rewards?: Json | null
          subject_id?: string | null
          target_value: number
          title: string
          type: string
        }
        Update: {
          assigned_children?: string[] | null
          created_at?: string
          created_by?: string | null
          created_by_id?: string | null
          description?: string
          difficulty?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          requirements?: Json | null
          rewards?: Json | null
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
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_email: string
          referred_id: string | null
          referrer_id: string
          reward_claimed: boolean | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_email: string
          referred_id?: string | null
          referrer_id: string
          reward_claimed?: boolean | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_email?: string
          referred_id?: string | null
          referrer_id?: string
          reward_claimed?: boolean | null
          status?: string | null
        }
        Relationships: []
      }
      report_card_settings: {
        Row: {
          accent_color: string | null
          font_family: string | null
          footer_text: string | null
          grading_scale: Json | null
          header_logo_url: string | null
          layout_config: Json
          letterhead_url: string | null
          principal_name: string | null
          school_address: string | null
          school_id: string
          school_name: string | null
          signature_url: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          font_family?: string | null
          footer_text?: string | null
          grading_scale?: Json | null
          header_logo_url?: string | null
          layout_config?: Json
          letterhead_url?: string | null
          principal_name?: string | null
          school_address?: string | null
          school_id: string
          school_name?: string | null
          signature_url?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          font_family?: string | null
          footer_text?: string | null
          grading_scale?: Json | null
          header_logo_url?: string | null
          layout_config?: Json
          letterhead_url?: string | null
          principal_name?: string | null
          school_address?: string | null
          school_id?: string
          school_name?: string | null
          signature_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_card_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      report_card_templates: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          layout_config: Json
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          layout_config?: Json
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          layout_config?: Json
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_cards: {
        Row: {
          academic_year: string
          data: Json
          generated_at: string
          generated_by: string | null
          id: string
          pdf_url: string | null
          published: boolean
          published_at: string | null
          school_id: string
          section_id: string | null
          student_id: string
          term: string
        }
        Insert: {
          academic_year: string
          data?: Json
          generated_at?: string
          generated_by?: string | null
          id?: string
          pdf_url?: string | null
          published?: boolean
          published_at?: string | null
          school_id: string
          section_id?: string | null
          student_id: string
          term: string
        }
        Update: {
          academic_year?: string
          data?: Json
          generated_at?: string
          generated_by?: string | null
          id?: string
          pdf_url?: string | null
          published?: boolean
          published_at?: string | null
          school_id?: string
          section_id?: string | null
          student_id?: string
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_cards_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "school_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      rubric_grades: {
        Row: {
          academic_year: string
          attendance_score: number
          comment: string | null
          created_at: string
          created_by: string | null
          cw_score: number
          effort: string | null
          exam_score: number
          hw_score: number
          id: string
          literacy_score: number
          project_score: number
          quiz1_score: number
          quiz2_score: number
          quiz_score: number
          school_id: string
          student_id: string
          subject_id: string
          teacher_id: string | null
          term: string
          total: number | null
          updated_at: string
        }
        Insert: {
          academic_year: string
          attendance_score?: number
          comment?: string | null
          created_at?: string
          created_by?: string | null
          cw_score?: number
          effort?: string | null
          exam_score?: number
          hw_score?: number
          id?: string
          literacy_score?: number
          project_score?: number
          quiz1_score?: number
          quiz2_score?: number
          quiz_score?: number
          school_id: string
          student_id: string
          subject_id: string
          teacher_id?: string | null
          term: string
          total?: number | null
          updated_at?: string
        }
        Update: {
          academic_year?: string
          attendance_score?: number
          comment?: string | null
          created_at?: string
          created_by?: string | null
          cw_score?: number
          effort?: string | null
          exam_score?: number
          hw_score?: number
          id?: string
          literacy_score?: number
          project_score?: number
          quiz1_score?: number
          quiz2_score?: number
          quiz_score?: number
          school_id?: string
          student_id?: string
          subject_id?: string
          teacher_id?: string | null
          term?: string
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubric_grades_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubric_grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "school_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubric_grades_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "school_teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      school_grade_settings: {
        Row: {
          school_id: string
          term_start_date: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          school_id: string
          term_start_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          school_id?: string
          term_start_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_grade_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      published_grades: {
        Row: {
          component: string
          id: string
          is_weekly: boolean
          mark_max: number | null
          mark_value: number | null
          occurred_on: string | null
          published_at: string
          published_by: string | null
          school_id: string
          semester: string
          student_id: string
          subject_id: string
          teacher_id: string | null
          title: string | null
          week_number: number | null
        }
        Insert: {
          component: string
          id?: string
          is_weekly: boolean
          mark_max?: number | null
          mark_value?: number | null
          occurred_on?: string | null
          published_at?: string
          published_by?: string | null
          school_id: string
          semester: string
          student_id: string
          subject_id: string
          teacher_id?: string | null
          title?: string | null
          week_number?: number | null
        }
        Update: {
          component?: string
          id?: string
          is_weekly?: boolean
          mark_max?: number | null
          mark_value?: number | null
          occurred_on?: string | null
          published_at?: string
          published_by?: string | null
          school_id?: string
          semester?: string
          student_id?: string
          subject_id?: string
          teacher_id?: string | null
          title?: string | null
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "published_grades_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "published_grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "school_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      school_semester_state: {
        Row: {
          active_semester: string
          school_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active_semester?: string
          school_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active_semester?: string
          school_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_semester_state_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "school_accounts"
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
      school_calendar_categories: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          school_id: string
        }
        Insert: {
          color: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          school_id: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_calendar_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      school_calendar_entries: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          school_id: string
          start_date: string
          title: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          school_id: string
          start_date: string
          title: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          school_id?: string
          start_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_calendar_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "school_calendar_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_calendar_entries_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      school_email_preferences: {
        Row: {
          created_at: string
          last_digest_sent_at: string | null
          school_id: string
          updated_at: string
          weekly_digest_enabled: boolean
        }
        Insert: {
          created_at?: string
          last_digest_sent_at?: string | null
          school_id: string
          updated_at?: string
          weekly_digest_enabled?: boolean
        }
        Update: {
          created_at?: string
          last_digest_sent_at?: string | null
          school_id?: string
          updated_at?: string
          weekly_digest_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "school_email_preferences_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      school_invoices: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          due_date: string | null
          id: string
          issued_at: string
          line_items: Json
          notes: string | null
          paid_at: string | null
          parent_id: string | null
          school_id: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          issued_at?: string
          line_items?: Json
          notes?: string | null
          paid_at?: string | null
          parent_id?: string | null
          school_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          issued_at?: string
          line_items?: Json
          notes?: string | null
          paid_at?: string | null
          parent_id?: string | null
          school_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_invoices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      school_news: {
        Row: {
          audience: string
          content: string
          created_at: string
          expires_at: string | null
          id: string
          image_url: string | null
          is_pinned: boolean
          link_title: string | null
          link_url: string | null
          publish_at: string
          school_id: string
          section_id: string | null
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          link_title?: string | null
          link_url?: string | null
          publish_at?: string
          school_id: string
          section_id?: string | null
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          link_title?: string | null
          link_url?: string | null
          publish_at?: string
          school_id?: string
          section_id?: string | null
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_news_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_news_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "school_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_news_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "school_teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      school_onboarding_progress: {
        Row: {
          completed_at: string | null
          completed_steps: string[]
          created_at: string
          current_step: number
          gradebook_status: string
          id: string
          school_id: string
          students_imported: number
          teachers_invited: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: string[]
          created_at?: string
          current_step?: number
          gradebook_status?: string
          id?: string
          school_id: string
          students_imported?: number
          teachers_invited?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: string[]
          created_at?: string
          current_step?: number
          gradebook_status?: string
          id?: string
          school_id?: string
          students_imported?: number
          teachers_invited?: number
          updated_at?: string
        }
        Relationships: []
      }
      school_sections: {
        Row: {
          created_at: string
          grade_level: string
          id: string
          school_id: string
          section_name: string
        }
        Insert: {
          created_at?: string
          grade_level: string
          id?: string
          school_id: string
          section_name?: string
        }
        Update: {
          created_at?: string
          grade_level?: string
          id?: string
          school_id?: string
          section_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_sections_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      school_staff: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          permissions: Json | null
          school_id: string
          staff_role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          permissions?: Json | null
          school_id: string
          staff_role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          permissions?: Json | null
          school_id?: string
          staff_role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_staff_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
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
      school_subjects: {
        Row: {
          created_at: string
          id: string
          name: string
          name_ar: string | null
          school_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_ar?: string | null
          school_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_ar?: string | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      school_teachers: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          school_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          school_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          school_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      section_students: {
        Row: {
          assigned_at: string
          id: string
          section_id: string
          student_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          section_id: string
          student_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          section_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_students_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "school_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_artifacts: {
        Row: {
          artifact_type: string
          content: Json
          created_at: string
          id: string
          is_active: boolean
          owner_id: string
          share_token: string
          source_id: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          artifact_type: string
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id: string
          share_token?: string
          source_id?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          artifact_type?: string
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id?: string
          share_token?: string
          source_id?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
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
      student_ai_summaries: {
        Row: {
          expires_at: string | null
          generated_at: string | null
          id: string
          improvement_metrics: Json | null
          strengths: Json | null
          student_id: string
          summary_text: string
          weaknesses: Json | null
        }
        Insert: {
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          improvement_metrics?: Json | null
          strengths?: Json | null
          student_id: string
          summary_text: string
          weaknesses?: Json | null
        }
        Update: {
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          improvement_metrics?: Json | null
          strengths?: Json | null
          student_id?: string
          summary_text?: string
          weaknesses?: Json | null
        }
        Relationships: []
      }
      student_attendance: {
        Row: {
          attendance_date: string
          created_at: string
          created_by: string
          id: string
          is_present: boolean
          reason_id: string | null
          school_id: string
          semester: string
          student_id: string
          subject_id: string
        }
        Insert: {
          attendance_date?: string
          created_at?: string
          created_by: string
          id?: string
          is_present?: boolean
          reason_id?: string | null
          school_id: string
          semester?: string
          student_id: string
          subject_id: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          created_by?: string
          id?: string
          is_present?: boolean
          reason_id?: string | null
          school_id?: string
          semester?: string
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_attendance_reason_id_fkey"
            columns: ["reason_id"]
            isOneToOne: false
            referencedRelation: "attendance_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "school_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_classifications: {
        Row: {
          assigned_automatically: boolean | null
          assigned_by: string | null
          classification_tag: string
          created_at: string | null
          id: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_automatically?: boolean | null
          assigned_by?: string | null
          classification_tag: string
          created_at?: string | null
          id?: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_automatically?: boolean | null
          assigned_by?: string | null
          classification_tag?: string
          created_at?: string | null
          id?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_daily_grades: {
        Row: {
          classwork_mark: number | null
          created_at: string
          created_by: string
          grade_date: string
          homework_mark: number | null
          id: string
          literacy_mark: number | null
          notes: string | null
          school_id: string
          semester: string
          student_id: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          classwork_mark?: number | null
          created_at?: string
          created_by: string
          grade_date?: string
          homework_mark?: number | null
          id?: string
          literacy_mark?: number | null
          notes?: string | null
          school_id: string
          semester?: string
          student_id: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          classwork_mark?: number | null
          created_at?: string
          created_by?: string
          grade_date?: string
          homework_mark?: number | null
          id?: string
          literacy_mark?: number | null
          notes?: string | null
          school_id?: string
          semester?: string
          student_id?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_daily_grades_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_daily_grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "school_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_interactions: {
        Row: {
          ai_analysis: Json | null
          created_at: string | null
          id: string
          interaction_type: string
          question_text: string | null
          response_time_ms: number | null
          session_id: string
          student_id: string
          student_response: string | null
          subject_id: string | null
          topic_identified: string | null
          understanding_score: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string | null
          id?: string
          interaction_type: string
          question_text?: string | null
          response_time_ms?: number | null
          session_id: string
          student_id: string
          student_response?: string | null
          subject_id?: string | null
          topic_identified?: string | null
          understanding_score?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string | null
          id?: string
          interaction_type?: string
          question_text?: string | null
          response_time_ms?: number | null
          session_id?: string
          student_id?: string
          student_response?: string | null
          subject_id?: string | null
          topic_identified?: string | null
          understanding_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_interactions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_invitations: {
        Row: {
          accepted_user_id: string | null
          created_at: string | null
          email: string
          expires_at: string
          first_name: string | null
          id: string
          invitation_code: string
          invited_by_id: string
          last_name: string | null
          school_id: string | null
          sent_at: string | null
          status: string
          used: boolean | null
          used_at: string | null
        }
        Insert: {
          accepted_user_id?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          first_name?: string | null
          id?: string
          invitation_code?: string
          invited_by_id: string
          last_name?: string | null
          school_id?: string | null
          sent_at?: string | null
          status?: string
          used?: boolean | null
          used_at?: string | null
        }
        Update: {
          accepted_user_id?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          first_name?: string | null
          id?: string
          invitation_code?: string
          invited_by_id?: string
          last_name?: string | null
          school_id?: string | null
          sent_at?: string | null
          status?: string
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
      student_learning_paths: {
        Row: {
          current_step: number | null
          id: string
          last_updated: string | null
          next_recommended_topics: string[] | null
          path_data: Json | null
          path_name: string
          started_at: string | null
          student_id: string
          topics_completed: string[] | null
          total_steps: number | null
        }
        Insert: {
          current_step?: number | null
          id?: string
          last_updated?: string | null
          next_recommended_topics?: string[] | null
          path_data?: Json | null
          path_name: string
          started_at?: string | null
          student_id: string
          topics_completed?: string[] | null
          total_steps?: number | null
        }
        Update: {
          current_step?: number | null
          id?: string
          last_updated?: string | null
          next_recommended_topics?: string[] | null
          path_data?: Json | null
          path_name?: string
          started_at?: string | null
          student_id?: string
          topics_completed?: string[] | null
          total_steps?: number | null
        }
        Relationships: []
      }
      student_semester_marks: {
        Row: {
          created_at: string
          created_by: string
          final_exam_mark: number | null
          id: string
          literacy_mark: number | null
          project_mark: number | null
          school_id: string
          semester: string
          student_id: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          final_exam_mark?: number | null
          id?: string
          literacy_mark?: number | null
          project_mark?: number | null
          school_id: string
          semester?: string
          student_id: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          final_exam_mark?: number | null
          id?: string
          literacy_mark?: number | null
          project_mark?: number | null
          school_id?: string
          semester?: string
          student_id?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_semester_marks_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_semester_marks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "school_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_topic_mastery: {
        Row: {
          confidence_score: number | null
          correct_interactions: number | null
          created_at: string | null
          id: string
          last_practiced: string | null
          mastery_level: number | null
          student_id: string
          subject_area: string | null
          topic_name: string
          total_interactions: number | null
        }
        Insert: {
          confidence_score?: number | null
          correct_interactions?: number | null
          created_at?: string | null
          id?: string
          last_practiced?: string | null
          mastery_level?: number | null
          student_id: string
          subject_area?: string | null
          topic_name: string
          total_interactions?: number | null
        }
        Update: {
          confidence_score?: number | null
          correct_interactions?: number | null
          created_at?: string | null
          id?: string
          last_practiced?: string | null
          mastery_level?: number | null
          student_id?: string
          subject_area?: string | null
          topic_name?: string
          total_interactions?: number | null
        }
        Relationships: []
      }
      study_buddy_memory: {
        Row: {
          created_at: string | null
          id: string
          memory_key: string
          memory_value: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          memory_key: string
          memory_value: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          memory_key?: string
          memory_value?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          created_at: string
          daily_lessons: Json
          description: string | null
          difficulty_level: string
          estimated_duration: number
          grade_level: string | null
          id: string
          region: string | null
          started_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          weak_areas: string[]
        }
        Insert: {
          created_at?: string
          daily_lessons?: Json
          description?: string | null
          difficulty_level?: string
          estimated_duration?: number
          grade_level?: string | null
          id?: string
          region?: string | null
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          weak_areas?: string[]
        }
        Update: {
          created_at?: string
          daily_lessons?: Json
          description?: string | null
          difficulty_level?: string
          estimated_duration?: number
          grade_level?: string | null
          id?: string
          region?: string | null
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          weak_areas?: string[]
        }
        Relationships: []
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
          paypal_subscription_id: string | null
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
          paypal_subscription_id?: string | null
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
          paypal_subscription_id?: string | null
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
      teacher_lesson_plans: {
        Row: {
          content: string
          created_at: string | null
          duration_minutes: number | null
          grade_level: string | null
          id: string
          linked_quiz_id: string | null
          school_id: string | null
          subject: string | null
          teacher_id: string
          topic: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string | null
          duration_minutes?: number | null
          grade_level?: string | null
          id?: string
          linked_quiz_id?: string | null
          school_id?: string | null
          subject?: string | null
          teacher_id: string
          topic: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          duration_minutes?: number | null
          grade_level?: string | null
          id?: string
          linked_quiz_id?: string | null
          school_id?: string | null
          subject?: string | null
          teacher_id?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_lesson_plans_linked_quiz_id_fkey"
            columns: ["linked_quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_lesson_plans_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_accounts"
            referencedColumns: ["id"]
          },
        ]
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
      teacher_subject_sections: {
        Row: {
          created_at: string
          id: string
          section_id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          section_id: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          section_id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subject_sections_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "school_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subject_sections_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "school_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subject_sections_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "school_teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_subjects: {
        Row: {
          created_at: string
          id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "school_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "school_teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          id: string
          percentage: number | null
          score: number | null
          student_id: string
          test_id: string
          time_taken_minutes: number | null
          total_points: number | null
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          percentage?: number | null
          score?: number | null
          student_id: string
          test_id: string
          time_taken_minutes?: number | null
          total_points?: number | null
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          percentage?: number | null
          score?: number | null
          student_id?: string
          test_id?: string
          time_taken_minutes?: number | null
          total_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          id: string
          image_url: string | null
          option_images: Json | null
          options: Json | null
          order_index: number | null
          points: number | null
          question: string
          question_type: string | null
          test_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          option_images?: Json | null
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question: string
          question_type?: string | null
          test_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          option_images?: Json | null
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question?: string
          question_type?: string | null
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          ai_generated: boolean | null
          ai_graded: boolean | null
          allow_backtracking: boolean
          assessment_mode: string
          created_at: string | null
          creator_id: string
          description: string | null
          exam_instructions: string | null
          id: string
          is_mandatory: boolean | null
          link_sharing_enabled: boolean
          question_order_locked: boolean
          question_randomization: boolean
          share_token: string
          subject: string | null
          time_limit_minutes: number | null
          title: string
          total_points: number | null
          updated_at: string | null
          violation_action: string
          violation_threshold: number
        }
        Insert: {
          ai_generated?: boolean | null
          ai_graded?: boolean | null
          allow_backtracking?: boolean
          assessment_mode?: string
          created_at?: string | null
          creator_id: string
          description?: string | null
          exam_instructions?: string | null
          id?: string
          is_mandatory?: boolean | null
          link_sharing_enabled?: boolean
          question_order_locked?: boolean
          question_randomization?: boolean
          share_token?: string
          subject?: string | null
          time_limit_minutes?: number | null
          title: string
          total_points?: number | null
          updated_at?: string | null
          violation_action?: string
          violation_threshold?: number
        }
        Update: {
          ai_generated?: boolean | null
          ai_graded?: boolean | null
          allow_backtracking?: boolean
          assessment_mode?: string
          created_at?: string | null
          creator_id?: string
          description?: string | null
          exam_instructions?: string | null
          id?: string
          is_mandatory?: boolean | null
          link_sharing_enabled?: boolean
          question_order_locked?: boolean
          question_randomization?: boolean
          share_token?: string
          subject?: string | null
          time_limit_minutes?: number | null
          title?: string
          total_points?: number | null
          updated_at?: string | null
          violation_action?: string
          violation_threshold?: number
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
      topic_prerequisites: {
        Row: {
          created_at: string | null
          id: string
          prerequisite_topic: string
          strength_required: number | null
          subject_area: string | null
          topic_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          prerequisite_topic: string
          strength_required?: number | null
          subject_area?: string | null
          topic_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          prerequisite_topic?: string
          strength_required?: number | null
          subject_area?: string | null
          topic_name?: string
        }
        Relationships: []
      }
      ui_translations: {
        Row: {
          created_at: string
          source_text: string
          target_language: string
          translated_text: string
        }
        Insert: {
          created_at?: string
          source_text: string
          target_language: string
          translated_text: string
        }
        Update: {
          created_at?: string
          source_text?: string
          target_language?: string
          translated_text?: string
        }
        Relationships: []
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
          last_increment_at: string | null
          metadata: Json | null
          progress_data: Json | null
          quest_id: string
          school_id: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          id?: string
          last_increment_at?: string | null
          metadata?: Json | null
          progress_data?: Json | null
          quest_id: string
          school_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          id?: string
          last_increment_at?: string | null
          metadata?: Json | null
          progress_data?: Json | null
          quest_id?: string
          school_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
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
      user_roles: {
        Row: {
          assigned_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_active_date: string | null
          longest_streak: number
          total_active_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          total_active_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          total_active_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_usage: {
        Row: {
          count: number | null
          created_at: string | null
          feature: string
          id: string
          period_end: string
          period_start: string
          user_id: string
        }
        Insert: {
          count?: number | null
          created_at?: string | null
          feature: string
          id?: string
          period_end?: string
          period_start?: string
          user_id: string
        }
        Update: {
          count?: number | null
          created_at?: string | null
          feature?: string
          id?: string
          period_end?: string
          period_start?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      student_leaderboard: {
        Row: {
          avatar_url: string | null
          current_streak: number | null
          display_name: string | null
          longest_streak: number | null
          quest_xp: number | null
          quiz_xp: number | null
          total_active_days: number | null
          total_xp: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_quest_progress_detailed: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          current_value: number | null
          description: string | null
          difficulty: string | null
          display_status: string | null
          expires_at: string | null
          id: string | null
          last_increment_at: string | null
          metadata: Json | null
          quest_id: string | null
          requirements: Json | null
          rewards: Json | null
          started_at: string | null
          status: string | null
          subject_name: string | null
          target_value: number | null
          title: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_quest_progress_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_manage_test: {
        Args: { _test_id: string; _user_id: string }
        Returns: boolean
      }
      publish_grades: {
        Args: { p_subject_id: string }
        Returns: number
      }
      check_ai_rate_limit: {
        Args: {
          _endpoint: string
          _ip: string
          _limit?: number
          _window_seconds?: number
        }
        Returns: boolean
      }
      get_exam_questions_for_student: {
        Args: { _test_id: string }
        Returns: {
          id: string
          image_url: string
          option_images: Json
          options: Json
          order_index: number
          points: number
          question: string
          question_type: string
          test_id: string
        }[]
      }
      get_message_threads: {
        Args: never
        Returns: {
          is_parent: boolean
          is_teacher: boolean
          last_message: string
          last_message_at: string
          parent_id: string
          parent_name: string
          school_id: string
          student_id: string
          student_name: string
          teacher_id: string
          teacher_name: string
          thread_id: string
          unread_count: number
        }[]
      }
      get_messageable_contacts: {
        Args: never
        Returns: {
          counterpart_id: string
          counterpart_kind: string
          counterpart_name: string
          school_id: string
          student_id: string
          student_name: string
        }[]
      }
      get_school_staff_role: {
        Args: { _email: string; _user_id: string }
        Returns: {
          permissions: Json
          school_id: string
          staff_role: string
        }[]
      }
      get_teacher_labels: {
        Args: { p_ids: string[]; p_and?: string }
        Returns: {
          teacher_id: string
          label: string
        }[]
      }
      format_teacher_label: {
        Args: { p_teacher_id: string; p_and?: string }
        Returns: string
      }
      join_names: {
        Args: { p_names: string[]; p_and?: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_school_ids: { Args: { _user_id: string }; Returns: string[] }
      handle_expired_quests: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_share_view: { Args: { _token: string }; Returns: undefined }
      initialize_user_quests: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      is_school_admin_of: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      is_school_member: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      is_school_teacher: {
        Args: { _email: string }
        Returns: {
          school_id: string
          school_name: string
          teacher_id: string
        }[]
      }
      is_test_assigned_to_student: {
        Args: { _student_id: string; _test_id: string }
        Returns: boolean
      }
      mark_expired_daily_quests_as_failed: { Args: never; Returns: undefined }
      materialize_curriculum: { Args: { p: Json }; Returns: string }
      parent_school_ids: { Args: never; Returns: string[] }
      parent_section_ids: { Args: never; Returns: string[] }
      resolve_test_share_token: { Args: { _token: string }; Returns: string }
      start_message_thread: {
        Args: { p_student_id: string; p_teacher_id: string }
        Returns: string
      }
      test_quest_system: {
        Args: { test_user_id?: string }
        Returns: {
          details: string
          passed: boolean
          test_name: string
        }[]
      }
      update_student_monitoring_snapshot: {
        Args: { user_id: string }
        Returns: undefined
      }
      update_user_streak: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          current_streak: number
          id: string
          last_active_date: string | null
          longest_streak: number
          total_active_days: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_streaks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      user_school_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      user_role: "student" | "parent" | "teacher"
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
  public: {
    Enums: {
      user_role: ["student", "parent", "teacher"],
    },
  },
} as const
