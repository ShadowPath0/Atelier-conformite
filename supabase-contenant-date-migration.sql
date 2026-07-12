-- ============================================================
-- MIGRATION — Type de contenant (symboles de tri) + choix DLC/DDM
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

alter table produits add column type_contenant text;
alter table produits add column type_date text default 'DLC';
