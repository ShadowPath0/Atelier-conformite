-- ============================================================
-- MIGRATION — Type d'action du journal de vérification HACCP
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

alter table haccp_verifications add column type_action text default 'verification';
