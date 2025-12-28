import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import type { Database } from '../types/database.js';

// Public client (uses anon key, respects RLS)
export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.anonKey
);

// Admin client (uses service role key, bypasses RLS)
export const supabaseAdmin = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

export default supabase;

