/*
  # Add Task History Table
  
  ## Overview
  This migration creates the `task_history` table to track changes to tasks over time.
  
  ### `task_history`
  - `id` (uuid, primary key) - Unique history identifier
  - `organization_id` (uuid, foreign key) - Reference to organizations
  - `task_id` (uuid, foreign key) - Reference to tasks
  - `user_id` (uuid, foreign key) - User who made the change
  - `action` (text) - Type of change (e.g., 'created', 'updated', 'status_changed', 'comment_added')
  - `changes` (jsonb) - Details of the changes (old and new values)
  - `created_at` (timestamptz) - Timestamp of the change
*/

-- Create task_history table
CREATE TABLE IF NOT EXISTS task_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  changes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_org_id ON task_history(organization_id);

-- Enable RLS
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_history
CREATE POLICY "Members can view task history"
  ON task_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = task_history.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create task history"
  ON task_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = task_history.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );
