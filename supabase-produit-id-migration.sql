-- ============================================================
-- MIGRATION — Lien fiable lot ↔ produit (par identifiant, pas par texte)
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

alter table lots_tracabilite add column produit_id uuid references produits(id);
