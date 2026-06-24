-- NAIM: bucket garment-images + políticas Storage por user_id
-- Ejecutar después de 001_items_rls.sql

insert into storage.buckets (id, name, public)
values ('garment-images', 'garment-images', true)
on conflict (id) do nothing;

drop policy if exists "garment_images_insert_own" on storage.objects;
drop policy if exists "garment_images_select_own" on storage.objects;
drop policy if exists "garment_images_update_own" on storage.objects;
drop policy if exists "garment_images_delete_own" on storage.objects;

create policy "garment_images_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'garment-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "garment_images_select_own"
  on storage.objects for select
  using (
    bucket_id = 'garment-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "garment_images_update_own"
  on storage.objects for update
  using (
    bucket_id = 'garment-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "garment_images_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'garment-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
