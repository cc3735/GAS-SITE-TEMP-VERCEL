-- =============================================
-- CourseFlow LMS Schema Migration
-- =============================================
-- Creates tables for the lightweight LMS focused on
-- instructor-student collaboration
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- COURSEFLOW COURSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS courseflow_courses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Course Information
  title text NOT NULL,
  description text,
  cover_image_url text,
  
  -- Visibility
  visibility text NOT NULL DEFAULT 'private' 
    CHECK (visibility IN ('public', 'private', 'unlisted')),
  
  -- Enrollment
  enrollment_code text UNIQUE,
  max_enrollments integer,
  
  -- Status
  status text NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'archived')),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courseflow_courses_instructor ON courseflow_courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courseflow_courses_visibility ON courseflow_courses(visibility);
CREATE INDEX IF NOT EXISTS idx_courseflow_courses_status ON courseflow_courses(status);
CREATE INDEX IF NOT EXISTS idx_courseflow_courses_enrollment_code ON courseflow_courses(enrollment_code) WHERE enrollment_code IS NOT NULL;

-- =============================================
-- COURSEFLOW ENROLLMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS courseflow_enrollments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL REFERENCES courseflow_courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Enrollment Metadata
  enrolled_at timestamptz DEFAULT now(),
  enrolled_by uuid REFERENCES auth.users(id),
  
  -- Status
  status text NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'dropped', 'completed')),
  
  -- Unique constraint
  UNIQUE(course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_courseflow_enrollments_course ON courseflow_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_courseflow_enrollments_user ON courseflow_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_courseflow_enrollments_status ON courseflow_enrollments(status);

-- =============================================
-- COURSEFLOW ASSIGNMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS courseflow_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL REFERENCES courseflow_courses(id) ON DELETE CASCADE,
  
  -- Assignment Information
  title text NOT NULL,
  instructions text,
  points_possible numeric NOT NULL DEFAULT 100 CHECK (points_possible > 0),
  
  -- Submission Type
  submission_type text NOT NULL DEFAULT 'file_upload' 
    CHECK (submission_type IN ('file_upload', 'text_submission')),
  
  -- Due Date
  due_date timestamptz,
  allow_late_submissions boolean DEFAULT false,
  late_penalty_percent numeric DEFAULT 0 CHECK (late_penalty_percent >= 0 AND late_penalty_percent <= 100),
  
  -- Submission Rules
  allow_resubmission boolean DEFAULT false,
  max_submissions integer,
  
  -- Status
  status text NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'published', 'scheduled')),
  scheduled_publish_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courseflow_assignments_course ON courseflow_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_courseflow_assignments_status ON courseflow_assignments(status);
CREATE INDEX IF NOT EXISTS idx_courseflow_assignments_due_date ON courseflow_assignments(due_date);

-- =============================================
-- COURSEFLOW SUBMISSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS courseflow_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id uuid NOT NULL REFERENCES courseflow_assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Submission Content
  text_content text,
  file_urls text[],
  
  -- Metadata
  submitted_at timestamptz DEFAULT now(),
  is_late boolean DEFAULT false,
  
  -- Status
  status text NOT NULL DEFAULT 'submitted' 
    CHECK (status IN ('submitted', 'graded', 'returned')),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courseflow_submissions_assignment ON courseflow_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_courseflow_submissions_user ON courseflow_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_courseflow_submissions_status ON courseflow_submissions(status);

-- =============================================
-- COURSEFLOW FEEDBACK TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS courseflow_feedback (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id uuid NOT NULL REFERENCES courseflow_submissions(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Feedback Content
  feedback_text text,
  grade numeric,
  feedback_file_urls text[],
  
  -- Status
  is_returned boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  returned_at timestamptz,
  
  -- One feedback per submission
  UNIQUE(submission_id)
);

CREATE INDEX IF NOT EXISTS idx_courseflow_feedback_submission ON courseflow_feedback(submission_id);
CREATE INDEX IF NOT EXISTS idx_courseflow_feedback_instructor ON courseflow_feedback(instructor_id);

-- =============================================
-- COURSEFLOW DISCUSSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS courseflow_discussions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL REFERENCES courseflow_courses(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Discussion Content
  title text NOT NULL,
  body text,
  attachment_urls text[],
  
  -- Moderation
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_reply_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_courseflow_discussions_course ON courseflow_discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_courseflow_discussions_author ON courseflow_discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_courseflow_discussions_pinned ON courseflow_discussions(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_courseflow_discussions_last_reply ON courseflow_discussions(last_reply_at DESC NULLS LAST);

-- =============================================
-- COURSEFLOW DISCUSSION POSTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS courseflow_discussion_posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  discussion_id uuid NOT NULL REFERENCES courseflow_discussions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_post_id uuid REFERENCES courseflow_discussion_posts(id) ON DELETE CASCADE,
  
  -- Post Content
  body text NOT NULL,
  attachment_urls text[],
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courseflow_discussion_posts_discussion ON courseflow_discussion_posts(discussion_id);
CREATE INDEX IF NOT EXISTS idx_courseflow_discussion_posts_author ON courseflow_discussion_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_courseflow_discussion_posts_parent ON courseflow_discussion_posts(parent_post_id);

-- =============================================
-- COURSEFLOW LIVE SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS courseflow_live_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL REFERENCES courseflow_courses(id) ON DELETE CASCADE,
  
  -- Session Information
  title text NOT NULL,
  description text,
  youtube_live_url text NOT NULL,
  youtube_video_id text,
  
  -- Scheduling
  scheduled_start_at timestamptz,
  scheduled_end_at timestamptz,
  
  -- Status
  status text NOT NULL DEFAULT 'scheduled' 
    CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courseflow_live_sessions_course ON courseflow_live_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_courseflow_live_sessions_status ON courseflow_live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_courseflow_live_sessions_scheduled ON courseflow_live_sessions(scheduled_start_at);

-- =============================================
-- COURSEFLOW FILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS courseflow_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL REFERENCES courseflow_courses(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File Information
  filename text NOT NULL,
  file_url text NOT NULL,
  file_size_bytes bigint,
  mime_type text,
  
  -- Context
  context_type text CHECK (context_type IN ('assignment', 'discussion', 'submission', 'feedback', 'general')),
  context_id uuid,
  
  -- Timestamps
  uploaded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courseflow_files_course ON courseflow_files(course_id);
CREATE INDEX IF NOT EXISTS idx_courseflow_files_uploaded_by ON courseflow_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_courseflow_files_context ON courseflow_files(context_type, context_id);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE courseflow_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE courseflow_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courseflow_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courseflow_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courseflow_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE courseflow_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courseflow_discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE courseflow_live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courseflow_files ENABLE ROW LEVEL SECURITY;

-- =============================================
-- COURSES POLICIES
-- =============================================

-- Public courses viewable by everyone
CREATE POLICY "Public courses are viewable by everyone"
  ON courseflow_courses FOR SELECT
  USING (visibility = 'public' AND status = 'active');

-- Instructors can view and manage their own courses
CREATE POLICY "Instructors can manage own courses"
  ON courseflow_courses FOR ALL
  USING (instructor_id = auth.uid());

-- Enrolled students can view courses
CREATE POLICY "Enrolled students can view courses"
  ON courseflow_courses FOR SELECT
  USING (
    id IN (
      SELECT course_id FROM courseflow_enrollments 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- =============================================
-- ENROLLMENTS POLICIES
-- =============================================

-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments"
  ON courseflow_enrollments FOR SELECT
  USING (user_id = auth.uid());

-- Users can enroll themselves in public courses
CREATE POLICY "Users can enroll in public courses"
  ON courseflow_enrollments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    course_id IN (
      SELECT id FROM courseflow_courses 
      WHERE visibility = 'public' AND status = 'active'
    )
  );

-- Users can enroll via enrollment code
CREATE POLICY "Users can enroll with code"
  ON courseflow_enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Instructors can view enrollments in their courses
CREATE POLICY "Instructors can view course enrollments"
  ON courseflow_enrollments FOR SELECT
  USING (
    course_id IN (
      SELECT id FROM courseflow_courses WHERE instructor_id = auth.uid()
    )
  );

-- Instructors can manage enrollments in their courses
CREATE POLICY "Instructors can manage course enrollments"
  ON courseflow_enrollments FOR ALL
  USING (
    course_id IN (
      SELECT id FROM courseflow_courses WHERE instructor_id = auth.uid()
    )
  );

-- =============================================
-- ASSIGNMENTS POLICIES
-- =============================================

-- Enrolled students can view published assignments
CREATE POLICY "Enrolled students can view published assignments"
  ON courseflow_assignments FOR SELECT
  USING (
    status = 'published' AND
    course_id IN (
      SELECT course_id FROM courseflow_enrollments 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Instructors can manage assignments in their courses
CREATE POLICY "Instructors can manage assignments"
  ON courseflow_assignments FOR ALL
  USING (
    course_id IN (
      SELECT id FROM courseflow_courses WHERE instructor_id = auth.uid()
    )
  );

-- =============================================
-- SUBMISSIONS POLICIES
-- =============================================

-- Students can view their own submissions
CREATE POLICY "Students can view own submissions"
  ON courseflow_submissions FOR SELECT
  USING (user_id = auth.uid());

-- Students can create submissions
CREATE POLICY "Students can create submissions"
  ON courseflow_submissions FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    assignment_id IN (
      SELECT a.id FROM courseflow_assignments a
      JOIN courseflow_enrollments e ON e.course_id = a.course_id
      WHERE e.user_id = auth.uid() AND e.status = 'active' AND a.status = 'published'
    )
  );

-- Instructors can view all submissions in their courses
CREATE POLICY "Instructors can view course submissions"
  ON courseflow_submissions FOR SELECT
  USING (
    assignment_id IN (
      SELECT a.id FROM courseflow_assignments a
      JOIN courseflow_courses c ON c.id = a.course_id
      WHERE c.instructor_id = auth.uid()
    )
  );

-- =============================================
-- FEEDBACK POLICIES
-- =============================================

-- Students can view returned feedback on their submissions
CREATE POLICY "Students can view returned feedback"
  ON courseflow_feedback FOR SELECT
  USING (
    is_returned = true AND
    submission_id IN (
      SELECT id FROM courseflow_submissions WHERE user_id = auth.uid()
    )
  );

-- Instructors can manage feedback in their courses
CREATE POLICY "Instructors can manage feedback"
  ON courseflow_feedback FOR ALL
  USING (instructor_id = auth.uid());

-- =============================================
-- DISCUSSIONS POLICIES
-- =============================================

-- Enrolled users can view discussions
CREATE POLICY "Enrolled users can view discussions"
  ON courseflow_discussions FOR SELECT
  USING (
    course_id IN (
      SELECT course_id FROM courseflow_enrollments 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR course_id IN (
      SELECT id FROM courseflow_courses WHERE instructor_id = auth.uid()
    )
  );

-- Enrolled users can create discussions
CREATE POLICY "Enrolled users can create discussions"
  ON courseflow_discussions FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    (
      course_id IN (
        SELECT course_id FROM courseflow_enrollments 
        WHERE user_id = auth.uid() AND status = 'active'
      )
      OR course_id IN (
        SELECT id FROM courseflow_courses WHERE instructor_id = auth.uid()
      )
    )
  );

-- Users can edit their own discussions
CREATE POLICY "Users can edit own discussions"
  ON courseflow_discussions FOR UPDATE
  USING (author_id = auth.uid());

-- Instructors can manage all discussions in their courses
CREATE POLICY "Instructors can manage course discussions"
  ON courseflow_discussions FOR ALL
  USING (
    course_id IN (
      SELECT id FROM courseflow_courses WHERE instructor_id = auth.uid()
    )
  );

-- =============================================
-- DISCUSSION POSTS POLICIES
-- =============================================

-- Users can view posts in discussions they can access
CREATE POLICY "Users can view accessible discussion posts"
  ON courseflow_discussion_posts FOR SELECT
  USING (
    discussion_id IN (
      SELECT d.id FROM courseflow_discussions d
      WHERE d.course_id IN (
        SELECT course_id FROM courseflow_enrollments 
        WHERE user_id = auth.uid() AND status = 'active'
      )
      OR d.course_id IN (
        SELECT id FROM courseflow_courses WHERE instructor_id = auth.uid()
      )
    )
  );

-- Users can create posts in unlocked discussions
CREATE POLICY "Users can create posts in unlocked discussions"
  ON courseflow_discussion_posts FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    discussion_id IN (
      SELECT d.id FROM courseflow_discussions d
      WHERE d.is_locked = false AND (
        d.course_id IN (
          SELECT course_id FROM courseflow_enrollments 
          WHERE user_id = auth.uid() AND status = 'active'
        )
        OR d.course_id IN (
          SELECT id FROM courseflow_courses WHERE instructor_id = auth.uid()
        )
      )
    )
  );

-- Users can edit their own posts
CREATE POLICY "Users can edit own posts"
  ON courseflow_discussion_posts FOR UPDATE
  USING (author_id = auth.uid());

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
  ON courseflow_discussion_posts FOR DELETE
  USING (author_id = auth.uid());

-- Instructors can delete any post in their courses
CREATE POLICY "Instructors can delete course posts"
  ON courseflow_discussion_posts FOR DELETE
  USING (
    discussion_id IN (
      SELECT d.id FROM courseflow_discussions d
      JOIN courseflow_courses c ON c.id = d.course_id
      WHERE c.instructor_id = auth.uid()
    )
  );

-- =============================================
-- LIVE SESSIONS POLICIES
-- =============================================

-- Enrolled users can view live sessions
CREATE POLICY "Enrolled users can view live sessions"
  ON courseflow_live_sessions FOR SELECT
  USING (
    course_id IN (
      SELECT course_id FROM courseflow_enrollments 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR course_id IN (
      SELECT id FROM courseflow_courses WHERE instructor_id = auth.uid()
    )
  );

-- Instructors can manage live sessions in their courses
CREATE POLICY "Instructors can manage live sessions"
  ON courseflow_live_sessions FOR ALL
  USING (
    course_id IN (
      SELECT id FROM courseflow_courses WHERE instructor_id = auth.uid()
    )
  );

-- =============================================
-- FILES POLICIES
-- =============================================

-- Users can view files in their courses
CREATE POLICY "Users can view course files"
  ON courseflow_files FOR SELECT
  USING (
    course_id IN (
      SELECT course_id FROM courseflow_enrollments 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR course_id IN (
      SELECT id FROM courseflow_courses WHERE instructor_id = auth.uid()
    )
  );

-- Users can upload files
CREATE POLICY "Users can upload files"
  ON courseflow_files FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    (
      course_id IN (
        SELECT course_id FROM courseflow_enrollments 
        WHERE user_id = auth.uid() AND status = 'active'
      )
      OR course_id IN (
        SELECT id FROM courseflow_courses WHERE instructor_id = auth.uid()
      )
    )
  );

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
  ON courseflow_files FOR DELETE
  USING (uploaded_by = auth.uid());

-- Instructors can delete any file in their courses
CREATE POLICY "Instructors can delete course files"
  ON courseflow_files FOR DELETE
  USING (
    course_id IN (
      SELECT id FROM courseflow_courses WHERE instructor_id = auth.uid()
    )
  );

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION courseflow_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS courseflow_courses_updated_at ON courseflow_courses;
CREATE TRIGGER courseflow_courses_updated_at
  BEFORE UPDATE ON courseflow_courses
  FOR EACH ROW EXECUTE FUNCTION courseflow_update_updated_at();

DROP TRIGGER IF EXISTS courseflow_assignments_updated_at ON courseflow_assignments;
CREATE TRIGGER courseflow_assignments_updated_at
  BEFORE UPDATE ON courseflow_assignments
  FOR EACH ROW EXECUTE FUNCTION courseflow_update_updated_at();

DROP TRIGGER IF EXISTS courseflow_submissions_updated_at ON courseflow_submissions;
CREATE TRIGGER courseflow_submissions_updated_at
  BEFORE UPDATE ON courseflow_submissions
  FOR EACH ROW EXECUTE FUNCTION courseflow_update_updated_at();

DROP TRIGGER IF EXISTS courseflow_feedback_updated_at ON courseflow_feedback;
CREATE TRIGGER courseflow_feedback_updated_at
  BEFORE UPDATE ON courseflow_feedback
  FOR EACH ROW EXECUTE FUNCTION courseflow_update_updated_at();

DROP TRIGGER IF EXISTS courseflow_discussions_updated_at ON courseflow_discussions;
CREATE TRIGGER courseflow_discussions_updated_at
  BEFORE UPDATE ON courseflow_discussions
  FOR EACH ROW EXECUTE FUNCTION courseflow_update_updated_at();

DROP TRIGGER IF EXISTS courseflow_discussion_posts_updated_at ON courseflow_discussion_posts;
CREATE TRIGGER courseflow_discussion_posts_updated_at
  BEFORE UPDATE ON courseflow_discussion_posts
  FOR EACH ROW EXECUTE FUNCTION courseflow_update_updated_at();

DROP TRIGGER IF EXISTS courseflow_live_sessions_updated_at ON courseflow_live_sessions;
CREATE TRIGGER courseflow_live_sessions_updated_at
  BEFORE UPDATE ON courseflow_live_sessions
  FOR EACH ROW EXECUTE FUNCTION courseflow_update_updated_at();

-- =============================================
-- HELPER FUNCTION: Update last_reply_at
-- =============================================

CREATE OR REPLACE FUNCTION courseflow_update_discussion_last_reply()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courseflow_discussions
  SET last_reply_at = now()
  WHERE id = NEW.discussion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS courseflow_discussion_posts_update_last_reply ON courseflow_discussion_posts;
CREATE TRIGGER courseflow_discussion_posts_update_last_reply
  AFTER INSERT ON courseflow_discussion_posts
  FOR EACH ROW EXECUTE FUNCTION courseflow_update_discussion_last_reply();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE courseflow_courses IS 'CourseFlow: Main courses table for instructor-student collaboration';
COMMENT ON TABLE courseflow_enrollments IS 'CourseFlow: Student enrollments in courses';
COMMENT ON TABLE courseflow_assignments IS 'CourseFlow: Assignments created by instructors';
COMMENT ON TABLE courseflow_submissions IS 'CourseFlow: Student submissions for assignments';
COMMENT ON TABLE courseflow_feedback IS 'CourseFlow: Instructor feedback and grades on submissions';
COMMENT ON TABLE courseflow_discussions IS 'CourseFlow: Discussion threads within courses';
COMMENT ON TABLE courseflow_discussion_posts IS 'CourseFlow: Replies within discussion threads';
COMMENT ON TABLE courseflow_live_sessions IS 'CourseFlow: Live session information (YouTube Live integration)';
COMMENT ON TABLE courseflow_files IS 'CourseFlow: File uploads and attachments';

