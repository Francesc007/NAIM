-- NAIM: limpiar perfiles huérfanos + CASCADE garantizado + borrado explícito al eliminar cuenta
-- Ejecutar después de 004_profiles.sql
--
-- Qué corrige:
-- 1. Filas en public.profiles cuyo usuario ya no existe en auth.users
-- 2. FK profiles.id → auth.users con ON DELETE CASCADE (por si la migración 004 no lo aplicó bien)
-- 3. FK items.user_id → auth.users con ON DELETE CASCADE (refuerzo)
-- 4. RPC delete_my_account borra items + profiles ANTES de auth.users (doble seguridad)

-- ── 1. Limpiar huérfanos existentes ──────────────────────────────────────────

delete from public.items i
where not exists (
  select 1 from auth.users u where u.id = i.user_id
);

delete from public.profiles p
where not exists (
  select 1 from auth.users u where u.id = p.id
);

-- ── 2. Asegurar CASCADE en profiles ──────────────────────────────────────────

alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id)
  references auth.users (id)
  on delete cascade;

-- ── 3. Asegurar CASCADE en items ─────────────────────────────────────────────

alter table public.items
  drop constraint if exists items_user_id_fkey;

alter table public.items
  add constraint items_user_id_fkey
  foreign key (user_id)
  references auth.users (id)
  on delete cascade;

-- ── 4. RPC: borrado explícito de datos de app + usuario Auth ─────────────────

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'No autenticado';
  end if;

  delete from public.items where user_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
