import { createClient } from '@supabase/supabase-js'

// 1. These will come from your Supabase Dashboard
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase Environment Variables')
}

// 2. Export the connection to use anywhere in the app
export const supabase = createClient(supabaseUrl, supabaseAnonKey)