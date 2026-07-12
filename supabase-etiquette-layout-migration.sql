-- ============================================================
-- MIGRATION — Positionnement indépendant de chaque champ de l'étiquette
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

alter table produits add column etiquette_layout jsonb;
