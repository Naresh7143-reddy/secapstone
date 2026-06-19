const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// Prefer the service-role key on the server so RLS doesn't block inserts.
// Falls back to the anon key if that's all that's configured.
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '⚠️  Supabase env vars missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). ' +
    'Database routes will fail until they are set.'
  );
}

// Fall back to a syntactically-valid placeholder so the app can boot
// (and serve /health) even before credentials are configured. Real DB
// calls will fail with a clear network error until the vars are set.
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  { auth: { persistSession: false } }
);

module.exports = supabase;
