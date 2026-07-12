-- ============================================================
-- MIGRATION — Procédure de retrait/rappel produit
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

alter table profiles add column procedure_retrait_rappel text;
