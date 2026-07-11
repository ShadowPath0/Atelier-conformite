-- ============================================================
-- MIGRATION — Journal de vérification HACCP
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

create table haccp_verifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  etape text not null,
  date_verification date,
  conforme boolean default true,
  observation text,
  responsable text not null,
  annule boolean default false,
  created_at timestamptz default now()
);

alter table haccp_verifications enable row level security;

create policy "Chacun gère son propre journal HACCP"
  on haccp_verifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke delete on haccp_verifications from authenticated;
