import { createClient } from '@supabase/supabase-js';

const URL  = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SVC  = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!URL || !ANON) {
  console.error('[SHF] Supabase env vars missing — check .env file');
}

// Regular client — respects Row Level Security
export const supabase = createClient(URL, ANON);

// Admin client — bypasses RLS, only used in admin panel operations
// Note: service_role key is intentionally exposed here for this internal
// admin-only system. For public production apps, move to Edge Functions.
export const supabaseAdmin = createClient(URL, SVC, {
  auth: { autoRefreshToken: false, persistSession: false },
});
