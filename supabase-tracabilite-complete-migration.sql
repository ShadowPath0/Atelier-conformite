-- ============================================================
-- MIGRATION — Traçabilité complète (amont/aval) + consignes de tri
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Traçabilité AMONT : le numéro de lot donné par VOTRE fournisseur pour la
-- matière première, pas juste son nom — indispensable pour remonter à un lot
-- précis chez lui en cas de rappel fournisseur
alter table lots_tracabilite add column lot_fournisseur text;

-- Traçabilité AVAL : à qui ce lot a été distribué (revendeurs, épiceries,
-- marchés...) — sans ça, la procédure de retrait/rappel ne peut pas
-- identifier qui prévenir
alter table lots_tracabilite add column destinataires text;

-- Preuve de maîtrise du point critique : la température RÉELLEMENT relevée
-- pendant la production, pas seulement la limite théorique du plan HACCP
alter table lots_tracabilite add column temperature_releve text;

-- Consignes de tri de l'emballage (Info-tri) — obligatoire sur les produits
-- vendus aux ménages, sauf emballages consignés avec l'Info-réemploi
alter table produits add column consignes_tri text;
