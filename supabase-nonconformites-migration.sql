-- ============================================================
-- MIGRATION — Lier les non-conformités à un produit de la gamme
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

alter table non_conformites add column produit text;
