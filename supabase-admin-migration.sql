-- ============================================================
-- MIGRATION — Rôle administrateur
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- (à faire APRÈS avoir déjà exécuté supabase-schema.sql)
-- ============================================================

-- 1. Ajoute la colonne qui marque un compte comme administrateur
alter table profiles add column is_admin boolean default false;

-- 2. Permet à un administrateur de VOIR tous les profils (pas seulement le sien)
create policy "Les admins voient tous les profils"
  on profiles for select
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- 3. Permet à un administrateur de MODIFIER tous les profils
--    (utile pour activer manuellement un abonnement si un paiement pose problème)
create policy "Les admins modifient tous les profils"
  on profiles for update
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ============================================================
-- ÉTAPE MANUELLE OBLIGATOIRE APRÈS CETTE MIGRATION :
-- 1. Créez votre compte normalement sur le site (/login > S'inscrire)
-- 2. Allez dans Supabase > Table Editor > table "profiles"
-- 3. Trouvez la ligne avec votre email
-- 4. Passez la colonne "is_admin" à "true"
-- Vous seul devez avoir is_admin = true, jamais un compte client.
-- ============================================================
