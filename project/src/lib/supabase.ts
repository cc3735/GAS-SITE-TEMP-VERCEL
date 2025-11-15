import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wjkxlpwvzdfzsgqhhfsq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqa3hscHd2emRmenNncWhoZnNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNTM2MDIsImV4cCI6MjA3ODcyOTYwMn0.O1pFnmoWxKWE1Bj3QaZJxEv9ZdWyYji0QgWafATY3l8';

console.log('=== SUPABASE DEBUG ===');
console.log('All env vars:', import.meta.env);
console.log('URL from env:', import.meta.env.VITE_SUPABASE_URL);
console.log('Final URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey?.length);
console.log('======================');

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

supabase.from('organizations').select('count', { count: 'exact', head: true })
  .then(({ error, count }) => {
    if (error) {
      console.error('Supabase connection test failed:', error);
    } else {
      console.log('✓ Supabase connected successfully! Organizations count:', count);
    }
  });
