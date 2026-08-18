import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// For frontend (browser) – use anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For backend (server) – use service role to bypass RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);