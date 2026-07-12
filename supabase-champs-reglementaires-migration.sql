-- ============================================================
-- MIGRATION — Champs réglementaires manquants (étiquetage)
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Coordonnées de l'exploitant — obligatoires sur toute étiquette,
-- une seule fois par compte (pas besoin de les ressaisir par produit)
alter table profiles add column nom_exploitant text;
alter table profiles add column adresse_exploitant text;

-- Champs réglementaires par produit
alter table produits add column pourcentage_principal text;
alter table produits add column origine text;
alter table produits add column poids_egoutte text;
