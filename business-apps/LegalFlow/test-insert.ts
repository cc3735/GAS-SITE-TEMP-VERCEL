import 'dotenv/config';
import { supabaseAdmin } from './src/utils/supabase.js';
import { logger } from './src/utils/logger.js';

(async () => {
  try {
    logger.info('Querying bank statements');
    const userId = 'df63d5fc-8bb1-4e62-a77c-f48b56c5f5fa';
    
    const { data, error } = await supabaseAdmin
      .from('bank_statements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    logger.info('Query result:', { count: data?.length || 0, error });
    console.log('Bank statements found:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('Latest statement:', JSON.stringify(data[0], null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Test failed', { error });
    console.error('error:', error);
    process.exit(1);
  }
})();
