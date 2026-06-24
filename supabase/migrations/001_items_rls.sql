-- NAIM: tabla items + RLS por user_id (auth anónima)
-- Ejecutar en Supabase SQL Editor o via CLI.
-- Requiere: Authentication → Providers → Anonymous sign-ins habilitado.

create extension if not exists "uuid-ossp";

create table if not exists public.items (
  id           text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  image_path   text not null,
  category     text not null,
  subcategory  text,
  colors       text[] not null default '{}',
  occasion     text not null default 'casual',
  season       text not null default 'todo el año',
  created_at   timestamptz not null default now(),
  last_worn_at timestamptz,
  wear_count   integer not null default 0
);

create index if not exists items_user_id_idx on public.items(user_id);

alter table public.items enable row level security;

drop policy if exists "items_select_own" on public.items;
drop policy if exists "items_insert_own" on public.items;
drop policy if exists "items_update_own" on public.items;
drop policy if exists "items_delete_own" on public.items;

create policy "items_select_own"
  on public.items for select
  using (auth.uid() = user_id);

create policy "items_insert_own"
  on public.items for insert
  with check (auth.uid() = user_id);

create policy "items_update_own"
  on public.items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "items_delete_own"
  on public.items for delete
  using (auth.uid() = user_id);
