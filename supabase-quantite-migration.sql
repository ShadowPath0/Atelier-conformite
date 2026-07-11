-- ============================================================
-- MIGRATION — Quantité produite par lot
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

alter table lots_tracabilite add column quantite integer;
