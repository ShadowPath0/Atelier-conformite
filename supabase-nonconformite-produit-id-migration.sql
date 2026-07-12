-- ============================================================
-- MIGRATION — Lien fiable non-conformité ↔ produit (par identifiant, pas par texte)
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

alter table non_conformites add column produit_id uuid references produits(id);
