-- Migration: 009_user_businesses.sql

-- Create a table to store businesses that belong to users
CREATE TABLE IF NOT EXISTS user_businesses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    industry text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for quick lookups by user
CREATE INDEX IF NOT EXISTS idx_user_businesses_user_id ON user_businesses(user_id);

-- RLS: allow users to manage only their own businesses
ALTER TABLE user_businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own businesses" ON user_businesses
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_user_businesses ON user_businesses;
CREATE TRIGGER set_updated_at_user_businesses
BEFORE UPDATE ON user_businesses
FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();
