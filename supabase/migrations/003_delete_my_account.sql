-- NAIM: RPC para que el usuario elimine su propia cuenta desde la app.
-- Requiere sesión autenticada (incluye usuarios anónimos con auth.uid()).
-- Nota: la versión definitiva está en 005_profiles_cascade_and_account_purge.sql
--       (borra items + profiles + auth.users). Ejecuta 005 después de este archivo.

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
