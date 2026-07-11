-- ============================================================
-- MIGRATION — Journal des actions admin + déclaration nutritionnelle
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- 1. Journal d'audit des actions admin — jamais modifiable, jamais supprimable,
-- même par l'admin (aucune règle update/delete n'est créée intentionnellement)
create table admin_audit_log (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references auth.users not null,
  admin_email text,
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

alter table admin_audit_log enable row level security;

create policy "Seuls les admins consultent le journal"
  on admin_audit_log for select
  using (is_admin_user());

create policy "Seuls les admins écrivent dans le journal"
  on admin_audit_log for insert
  with check (is_admin_user());

-- 2. Déclaration nutritionnelle — nécessaire uniquement si vente via
-- revendeur/épicerie (exemptée en vente directe au consommateur final)
alter table produits add column declaration_nutritionnelle text;
