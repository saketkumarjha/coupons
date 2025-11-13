const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  logger.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

// Test connection
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    logger.info('✅ Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

// Run test on module load
testConnection();

module.exports = supabase;