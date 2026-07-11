import { createClient } from '@supabase/supabase-js';

// Client utilisé dans le navigateur (composants "use client").
// Utilise la clé publique "anon" — sans danger à exposer, car protégée par
// les règles de sécurité (Row Level Security) définies dans supabase-schema.sql.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
