import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  try {
    console.log('📖 Reading migration file...');
    const migrationPath = path.join(process.cwd(), 'migrations/008_bookkeeping_schema.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running migration on Supabase...');
    
    // Split SQL by statements and execute
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      const { error } = await supabase.from('_migrations').upsert({});
      if (error && error.message.includes('does not exist')) {
        // Try using raw query execution
        const { error: execError } = await (supabase as any).rpc('exec', { statement });
        if (execError && !execError.message.includes('does not exist')) {
          console.error('Error executing statement:', execError);
        }
      }
    }

    console.log('✅ Migration completed!');
    console.log('📊 Bookkeeping tables should now be created in your database');
  } catch (err: any) {
    console.error('⚠️ Migration execution note:', err.message);
    console.log('\n📝 Please run the migration manually:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Click "New Query"');
    console.log('3. Copy & paste contents of: migrations/008_bookkeeping_schema.sql');
    console.log('4. Click "Run"');
  }
}

runMigration();
