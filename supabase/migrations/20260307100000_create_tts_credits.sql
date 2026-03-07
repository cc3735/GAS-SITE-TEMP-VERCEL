-- TTS Credit Balances — per-user prepaid credits for HD Audio (ElevenLabs)
CREATE TABLE tts_credit_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  credits_purchased INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- TTS Usage Log — audit trail for each HD Audio play
CREATE TABLE tts_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  characters_used INTEGER NOT NULL,
  voice_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: users can only read their own rows; all writes via service role in edge function
ALTER TABLE tts_credit_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own balance" ON tts_credit_balances
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE tts_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own usage" ON tts_usage_log
  FOR SELECT USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_tts_credits_user ON tts_credit_balances(user_id);
CREATE INDEX idx_tts_usage_user ON tts_usage_log(user_id, created_at DESC);
