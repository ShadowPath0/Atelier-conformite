-- ============================================================
-- MIGRATION — Blocs de texte libres sur l'étiquette
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

alter table produits add column etiquette_custom_blocks jsonb default '[]';
