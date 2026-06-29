import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || supabaseUrl === 'https://xxx.supabase.co') {
  console.error('[db.ts] ❌ NEXT_PUBLIC_SUPABASE_URL is missing or is still the placeholder value!')
}
if (!supabaseServiceKey) {
  console.error('[db.ts] ❌ SUPABASE_SERVICE_ROLE_KEY is missing!')
}

// Client-side (anon key — RLS applies)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side admin client (service role key — bypasses RLS)
// persistSession: false is required for server-side usage
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})