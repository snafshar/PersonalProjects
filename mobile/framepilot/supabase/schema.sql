create extension if not exists pgcrypto;

create table if not exists public.saved_setups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  scenario_id text not null,
  recommendation jsonb not null,
  shooting_context jsonb not null,
  gear jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists saved_setups_user_created_idx
  on public.saved_setups(user_id, created_at desc);

alter table public.saved_setups enable row level security;

create policy "Users read their own setups"
  on public.saved_setups for select
  using (auth.uid() = user_id);

create policy "Users create their own setups"
  on public.saved_setups for insert
  with check (auth.uid() = user_id);

create policy "Users update their own setups"
  on public.saved_setups for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete their own setups"
  on public.saved_setups for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.saved_setups to authenticated;
