import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

// Public client (uses anon key, respects RLS)
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Admin client (uses service role key, bypasses RLS)
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

export default supabase;
