import { createClient } from '@supabase/supabase-js';

// 1. Load from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Safety Check (Logs error if .env is not loading)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL ERROR: Supabase keys are missing!");
  console.error("Make sure you have a .env file in the root folder.");
  console.error("And make sure you restarted the server after creating it.");
}

// 3. Create Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 