import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from './config/supabase';

async function testConnection() {
  // Try to count rows in email_queue (should be 0)
  const { data, error } = await supabaseAdmin
    .from('email_queue')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('❌ Supabase connection failed:', error.message);
  } else {
    console.log('✅ Supabase connected! Queue has', data?.length || 0, 'emails.');
  }
}

testConnection();