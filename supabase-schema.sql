-- ============================================================
-- SCHÉMA SUPABASE — Atelier Conformité
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================
-- Ce script crée :
--   1. Une table "profiles" liée aux comptes utilisateurs (auth intégrée à Supabase)
--   2. Les 5 registres (produits, traçabilité, nettoyage, non-conformités, audits)
--   3. Les règles de sécurité garantissant que chaque utilisateur ne voit QUE ses données
-- ============================================================

-- 1. PROFILS — étend le système de comptes natif de Supabase avec le statut d'abonnement
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  stripe_customer_id text,
  subscription_status text default 'inactive', -- 'active' | 'inactive' | 'past_due' | 'canceled'
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Un utilisateur voit uniquement son propre profil"
  on profiles for select
  using (auth.uid() = id);

create policy "Un utilisateur modifie uniquement son propre profil"
  on profiles for update
  using (auth.uid() = id);

-- Crée automatiquement un profil à chaque inscription
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. PRODUITS & ÉTIQUETTES
create table produits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  nom text,
  ingredients text,
  allergenes text,
  poids text,
  dlc text,
  conservation text,
  created_at timestamptz default now()
);

alter table produits enable row level security;

create policy "Chacun gère ses propres produits"
  on produits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 3. REGISTRE DE TRAÇABILITÉ DES LOTS
create table lots_tracabilite (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  produit text not null,
  numero_lot text not null,
  date_production date,
  fournisseur text,
  responsable text not null,        -- obligatoire : qui a saisi l'entrée
  annule boolean default false,      -- jamais supprimé, seulement annulé
  annule_at timestamptz,
  created_at timestamptz default now()  -- horodatage automatique, non modifiable
);

alter table lots_tracabilite enable row level security;

create policy "Chacun gère ses propres lots"
  on lots_tracabilite for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Empêche techniquement la suppression (cohérent avec l'exigence d'auditabilité)
revoke delete on lots_tracabilite from authenticated;


-- 4. PLAN DE NETTOYAGE
create table nettoyage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  zone text not null,
  produit_utilise text,
  frequence text,
  responsable text not null,
  date_intervention date,
  annule boolean default false,
  created_at timestamptz default now()
);

alter table nettoyage enable row level security;

create policy "Chacun gère son propre registre de nettoyage"
  on nettoyage for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke delete on nettoyage from authenticated;


-- 5. NON-CONFORMITÉS
create table non_conformites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date_constat date,
  description text not null,
  action_corrective text,
  responsable text not null,
  cloture boolean default false,
  cloture_at timestamptz,
  created_at timestamptz default now()
);

alter table non_conformites enable row level security;

create policy "Chacun gère ses propres non-conformités"
  on non_conformites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke delete on non_conformites from authenticated;


-- 6. AUTO-AUDITS
create table audits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  score text,           -- ex: "7/8"
  auditeur text not null,
  details jsonb,         -- détail des 8 points cochés
  created_at timestamptz default now()
);

alter table audits enable row level security;

create policy "Chacun gère ses propres audits"
  on audits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke delete on audits from authenticated;

-- ============================================================
-- FIN DU SCRIPT
-- Prochaine étape : connecter le webhook Stripe pour mettre à jour
-- profiles.subscription_status automatiquement à chaque paiement.
-- ============================================================
