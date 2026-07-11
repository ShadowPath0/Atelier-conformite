-- ============================================================
-- MIGRATION — Plan HACCP dans l'espace artisan
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

create table haccp_etapes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  etape text not null,
  danger text,
  mesure_maitrise text,
  ccp boolean default false,
  limite_critique text,
  surveillance text,
  action_corrective text,
  verification text,
  responsable text not null,
  annule boolean default false,
  annule_at timestamptz,
  created_at timestamptz default now()
);

alter table haccp_etapes enable row level security;

create policy "Chacun gère son propre plan HACCP"
  on haccp_etapes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Jamais de suppression réelle — cohérent avec les autres registres :
-- une étape modifiée est annulée puis remplacée par une nouvelle version,
-- l'historique complet reste consultable.
revoke delete on haccp_etapes from authenticated;
