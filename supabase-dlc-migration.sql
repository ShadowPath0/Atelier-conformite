-- ============================================================
-- MIGRATION — DLC par lot (et non plus par gamme)
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

alter table lots_tracabilite add column dlc text;
