/**
 * CourseFlow Database Types
 * 
 * TypeScript types for CourseFlow database tables.
 * These types are used with the Supabase client for type-safe queries.
 * 
 * @module types/database
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Course visibility options
 */
export type CourseVisibility = 'public' | 'private' | 'unlisted'

/**
 * Course status options
 */
export type CourseStatus = 'active' | 'archived'

/**
 * Enrollment status options
 */
export type EnrollmentStatus = 'active' | 'dropped' | 'completed'

/**
 * Assignment submission type options
 */
export type SubmissionType = 'file_upload' | 'text_submission'

/**
 * Assignment status options
 */
export type AssignmentStatus = 'draft' | 'published' | 'scheduled'

/**
 * Submission status options
 */
export type SubmissionStatus = 'submitted' | 'graded' | 'returned'

/**
 * Live session status options
 */
export type LiveSessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled'

/**
 * File context type options
 */
export type FileContextType = 'assignment' | 'discussion' | 'submission' | 'feedback' | 'general'

/**
 * Database schema types for Supabase
 */
export interface Database {
  public: {
    Tables: {
      // =============================================
      // COURSEFLOW COURSES
      // =============================================
      courseflow_courses: {
        Row: {
          id: string
          instructor_id: string
          title: string
          description: string | null
          cover_image_url: string | null
          visibility: CourseVisibility
          enrollment_code: string | null
          max_enrollments: number | null
          status: CourseStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          instructor_id: string
          title: string
          description?: string | null
          cover_image_url?: string | null
          visibility?: CourseVisibility
          enrollment_code?: string | null
          max_enrollments?: number | null
          status?: CourseStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          instructor_id?: string
          title?: string
          description?: string | null
          cover_image_url?: string | null
          visibility?: CourseVisibility
          enrollment_code?: string | null
          max_enrollments?: number | null
          status?: CourseStatus
          created_at?: string
          updated_at?: string
        }
      }

      // =============================================
      // COURSEFLOW ENROLLMENTS
      // =============================================
      courseflow_enrollments: {
        Row: {
          id: string
          course_id: string
          user_id: string
          enrolled_at: string
          enrolled_by: string | null
          status: EnrollmentStatus
        }
        Insert: {
          id?: string
          course_id: string
          user_id: string
          enrolled_at?: string
          enrolled_by?: string | null
          status?: EnrollmentStatus
        }
        Update: {
          id?: string
          course_id?: string
          user_id?: string
          enrolled_at?: string
          enrolled_by?: string | null
          status?: EnrollmentStatus
        }
      }

      // =============================================
      // COURSEFLOW ASSIGNMENTS
      // =============================================
      courseflow_assignments: {
        Row: {
          id: string
          course_id: string
          title: string
          instructions: string | null
          points_possible: number
          submission_type: SubmissionType
          due_date: string | null
          allow_late_submissions: boolean
          late_penalty_percent: number
          allow_resubmission: boolean
          max_submissions: number | null
          status: AssignmentStatus
          scheduled_publish_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          instructions?: string | null
          points_possible?: number
          submission_type?: SubmissionType
          due_date?: string | null
          allow_late_submissions?: boolean
          late_penalty_percent?: number
          allow_resubmission?: boolean
          max_submissions?: number | null
          status?: AssignmentStatus
          scheduled_publish_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          instructions?: string | null
          points_possible?: number
          submission_type?: SubmissionType
          due_date?: string | null
          allow_late_submissions?: boolean
          late_penalty_percent?: number
          allow_resubmission?: boolean
          max_submissions?: number | null
          status?: AssignmentStatus
          scheduled_publish_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // =============================================
      // COURSEFLOW SUBMISSIONS
      // =============================================
      courseflow_submissions: {
        Row: {
          id: string
          assignment_id: string
          user_id: string
          text_content: string | null
          file_urls: string[] | null
          submitted_at: string
          is_late: boolean
          status: SubmissionStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          user_id: string
          text_content?: string | null
          file_urls?: string[] | null
          submitted_at?: string
          is_late?: boolean
          status?: SubmissionStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          user_id?: string
          text_content?: string | null
          file_urls?: string[] | null
          submitted_at?: string
          is_late?: boolean
          status?: SubmissionStatus
          created_at?: string
          updated_at?: string
        }
      }

      // =============================================
      // COURSEFLOW FEEDBACK
      // =============================================
      courseflow_feedback: {
        Row: {
          id: string
          submission_id: string
          instructor_id: string
          feedback_text: string | null
          grade: number | null
          feedback_file_urls: string[] | null
          is_returned: boolean
          created_at: string
          updated_at: string
          returned_at: string | null
        }
        Insert: {
          id?: string
          submission_id: string
          instructor_id: string
          feedback_text?: string | null
          grade?: number | null
          feedback_file_urls?: string[] | null
          is_returned?: boolean
          created_at?: string
          updated_at?: string
          returned_at?: string | null
        }
        Update: {
          id?: string
          submission_id?: string
          instructor_id?: string
          feedback_text?: string | null
          grade?: number | null
          feedback_file_urls?: string[] | null
          is_returned?: boolean
          created_at?: string
          updated_at?: string
          returned_at?: string | null
        }
      }

      // =============================================
      // COURSEFLOW DISCUSSIONS
      // =============================================
      courseflow_discussions: {
        Row: {
          id: string
          course_id: string
          author_id: string
          title: string
          body: string | null
          attachment_urls: string[] | null
          is_pinned: boolean
          is_locked: boolean
          created_at: string
          updated_at: string
          last_reply_at: string | null
        }
        Insert: {
          id?: string
          course_id: string
          author_id: string
          title: string
          body?: string | null
          attachment_urls?: string[] | null
          is_pinned?: boolean
          is_locked?: boolean
          created_at?: string
          updated_at?: string
          last_reply_at?: string | null
        }
        Update: {
          id?: string
          course_id?: string
          author_id?: string
          title?: string
          body?: string | null
          attachment_urls?: string[] | null
          is_pinned?: boolean
          is_locked?: boolean
          created_at?: string
          updated_at?: string
          last_reply_at?: string | null
        }
      }

      // =============================================
      // COURSEFLOW DISCUSSION POSTS
      // =============================================
      courseflow_discussion_posts: {
        Row: {
          id: string
          discussion_id: string
          author_id: string
          parent_post_id: string | null
          body: string
          attachment_urls: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          discussion_id: string
          author_id: string
          parent_post_id?: string | null
          body: string
          attachment_urls?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          discussion_id?: string
          author_id?: string
          parent_post_id?: string | null
          body?: string
          attachment_urls?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }

      // =============================================
      // COURSEFLOW LIVE SESSIONS
      // =============================================
      courseflow_live_sessions: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          youtube_live_url: string
          youtube_video_id: string | null
          scheduled_start_at: string | null
          scheduled_end_at: string | null
          status: LiveSessionStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          youtube_live_url: string
          youtube_video_id?: string | null
          scheduled_start_at?: string | null
          scheduled_end_at?: string | null
          status?: LiveSessionStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          youtube_live_url?: string
          youtube_video_id?: string | null
          scheduled_start_at?: string | null
          scheduled_end_at?: string | null
          status?: LiveSessionStatus
          created_at?: string
          updated_at?: string
        }
      }

      // =============================================
      // COURSEFLOW FILES
      // =============================================
      courseflow_files: {
        Row: {
          id: string
          course_id: string
          uploaded_by: string
          filename: string
          file_url: string
          file_size_bytes: number | null
          mime_type: string | null
          context_type: FileContextType | null
          context_id: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          course_id: string
          uploaded_by: string
          filename: string
          file_url: string
          file_size_bytes?: number | null
          mime_type?: string | null
          context_type?: FileContextType | null
          context_id?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          uploaded_by?: string
          filename?: string
          file_url?: string
          file_size_bytes?: number | null
          mime_type?: string | null
          context_type?: FileContextType | null
          context_id?: string | null
          uploaded_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      course_visibility: CourseVisibility
      course_status: CourseStatus
      enrollment_status: EnrollmentStatus
      submission_type: SubmissionType
      assignment_status: AssignmentStatus
      submission_status: SubmissionStatus
      live_session_status: LiveSessionStatus
      file_context_type: FileContextType
    }
  }
}

// Helper types for convenience
export type Course = Database['public']['Tables']['courseflow_courses']['Row']
export type CourseInsert = Database['public']['Tables']['courseflow_courses']['Insert']
export type CourseUpdate = Database['public']['Tables']['courseflow_courses']['Update']

export type Enrollment = Database['public']['Tables']['courseflow_enrollments']['Row']
export type EnrollmentInsert = Database['public']['Tables']['courseflow_enrollments']['Insert']

export type Assignment = Database['public']['Tables']['courseflow_assignments']['Row']
export type AssignmentInsert = Database['public']['Tables']['courseflow_assignments']['Insert']
export type AssignmentUpdate = Database['public']['Tables']['courseflow_assignments']['Update']

export type Submission = Database['public']['Tables']['courseflow_submissions']['Row']
export type SubmissionInsert = Database['public']['Tables']['courseflow_submissions']['Insert']

export type Feedback = Database['public']['Tables']['courseflow_feedback']['Row']
export type FeedbackInsert = Database['public']['Tables']['courseflow_feedback']['Insert']

export type Discussion = Database['public']['Tables']['courseflow_discussions']['Row']
export type DiscussionInsert = Database['public']['Tables']['courseflow_discussions']['Insert']

export type DiscussionPost = Database['public']['Tables']['courseflow_discussion_posts']['Row']
export type DiscussionPostInsert = Database['public']['Tables']['courseflow_discussion_posts']['Insert']

export type LiveSession = Database['public']['Tables']['courseflow_live_sessions']['Row']
export type LiveSessionInsert = Database['public']['Tables']['courseflow_live_sessions']['Insert']

export type CourseFile = Database['public']['Tables']['courseflow_files']['Row']
export type CourseFileInsert = Database['public']['Tables']['courseflow_files']['Insert']

