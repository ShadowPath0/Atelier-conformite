import { createClient } from '@supabase/supabase-js';

// ⚠️ Ce client utilise la clé "service role", qui contourne toutes les règles
// de sécurité. Il ne doit JAMAIS être importé dans un composant "use client"
// ni exposé au navigateur — uniquement dans les routes API (app/api/**).
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
