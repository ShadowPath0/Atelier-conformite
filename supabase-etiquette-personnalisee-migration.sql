-- ============================================================
-- MIGRATION — Étiquettes personnalisées (import d'image + position du texte)
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- 1. Nouvelles colonnes sur les produits
alter table produits add column etiquette_image_path text;
alter table produits add column etiquette_text_x numeric default 50;
alter table produits add column etiquette_text_y numeric default 50;
alter table produits add column etiquette_text_color text default '#1A2530';

-- 2. Bucket de stockage pour les images d'étiquettes (lecture publique,
-- écriture réservée à chaque utilisateur dans son propre dossier)
insert into storage.buckets (id, name, public) values ('etiquettes', 'etiquettes', true);

create policy "Upload de ses propres étiquettes"
  on storage.objects for insert
  with check (bucket_id = 'etiquettes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Modification de ses propres étiquettes"
  on storage.objects for update
  using (bucket_id = 'etiquettes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Suppression de ses propres étiquettes"
  on storage.objects for delete
  using (bucket_id = 'etiquettes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Lecture publique des étiquettes"
  on storage.objects for select
  using (bucket_id = 'etiquettes');
