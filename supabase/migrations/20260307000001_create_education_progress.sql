-- Education Hub progress tracking table
-- Separate from CourseFlow (instructor-led LMS) — uses text course_id matching catalog IDs

CREATE TABLE IF NOT EXISTS education_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  progress jsonb DEFAULT '{}'::jsonb,
  enrolled_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, course_id)
);

ALTER TABLE education_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own progress" ON education_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_education_progress_user ON education_progress(user_id);
CREATE INDEX idx_education_progress_course ON education_progress(course_id);
