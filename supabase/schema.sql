-- CrewDesk — schéma Supabase.
-- À exécuter une fois dans Supabase → SQL Editor → New query → Run.
--
-- Une ligne d'état par utilisateur. La sécurité au niveau ligne (RLS)
-- garantit que chaque utilisateur ne peut lire/écrire QUE sa propre ligne :
-- l'isolation est imposée par la base, pas par le code applicatif.

create table if not exists public.crewdesk_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  saved_at   bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.crewdesk_state enable row level security;

-- Un utilisateur authentifié ne voit et ne modifie que sa ligne.
drop policy if exists "own state - select" on public.crewdesk_state;
create policy "own state - select"
  on public.crewdesk_state for select
  using (auth.uid() = user_id);

drop policy if exists "own state - insert" on public.crewdesk_state;
create policy "own state - insert"
  on public.crewdesk_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "own state - update" on public.crewdesk_state;
create policy "own state - update"
  on public.crewdesk_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
