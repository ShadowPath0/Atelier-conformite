-- ============================================================
-- MIGRATION — Messagerie de contact
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

create table messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  email text,
  sujet text,
  message text not null,
  lu boolean default false,
  created_at timestamptz default now()
);

alter table messages enable row level security;

-- Un utilisateur peut envoyer un message et voir ses propres messages
create policy "Chacun envoie ses propres messages"
  on messages for insert
  with check (auth.uid() = user_id);

create policy "Chacun voit ses propres messages"
  on messages for select
  using (auth.uid() = user_id);

-- Les admins voient et modifient tous les messages (réutilise la fonction is_admin_user() déjà créée)
create policy "Les admins voient tous les messages"
  on messages for select
  using (is_admin_user());

create policy "Les admins modifient tous les messages"
  on messages for update
  using (is_admin_user());
