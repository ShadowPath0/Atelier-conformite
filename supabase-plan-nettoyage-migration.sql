-- ============================================================
-- MIGRATION — Plan de nettoyage (référence) + exécutions liées
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Le plan de référence : les points à nettoyer, avec leur fréquence prévue
create table plan_nettoyage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  zone text not null,
  frequence text,
  produit_habituel text,
  responsable text not null,
  annule boolean default false,
  annule_at timestamptz,
  created_at timestamptz default now()
);

alter table plan_nettoyage enable row level security;

create policy "Chacun gère son propre plan de nettoyage"
  on plan_nettoyage for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke delete on plan_nettoyage from authenticated;

-- Relie chaque exécution enregistrée à un point du plan (facultatif,
-- pour permettre aussi des nettoyages ponctuels hors plan)
alter table nettoyage add column plan_id uuid references plan_nettoyage(id);
