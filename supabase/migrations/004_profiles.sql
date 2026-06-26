-- NAIM: tabla profiles vinculada a auth.users
-- Ejecutar después de 001_items_rls.sql
-- Perfil de app (nombre, avatar, preferencias) — el correo/contraseña siguen en Auth.

create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  display_name        text not null default '',
  avatar_url          text,
  avatar_storage_path text,
  avatar_updated_at   bigint,
  style_preference    text,
  climate_preference  text,
  onboarding_completed boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists profiles_display_name_idx on public.profiles(display_name);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Fila de perfil automática al crear usuario (anónimo o con email).
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row
  execute function public.handle_new_user_profile();

-- Migrar perfiles existentes desde user_metadata (usuarios creados antes de esta migración).
insert into public.profiles (
  id,
  display_name,
  avatar_url,
  avatar_storage_path,
  avatar_updated_at,
  style_preference,
  climate_preference,
  onboarding_completed
)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data->>'display_name'), ''), ''),
  nullif(trim(u.raw_user_meta_data->>'avatar_url'), ''),
  nullif(trim(u.raw_user_meta_data->>'avatar_storage_path'), ''),
  case
    when coalesce(u.raw_user_meta_data->>'avatar_updated_at', '') ~ '^\d+$'
      then (u.raw_user_meta_data->>'avatar_updated_at')::bigint
    else null
  end,
  nullif(trim(u.raw_user_meta_data->>'style_preference'), ''),
  nullif(trim(u.raw_user_meta_data->>'climate_preference'), ''),
  coalesce((u.raw_user_meta_data->>'onboarding_completed')::boolean, false)
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();
