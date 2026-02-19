begin;

-- Media buckets for property images and profile avatars.
insert into storage.buckets (id, name, public)
values
  ('documents', 'documents', false),
  ('property-images', 'property-images', false),
  ('avatars', 'avatars', false)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

-- Safe UUID extractors for storage object paths.
create or replace function public.storage_property_id_from_path(p_path text)
returns uuid
language plpgsql
stable
set search_path = public, pg_catalog
as $function$
declare
  v_part text;
begin
  v_part := nullif(split_part(p_path, '/', 2), '');
  if v_part is null then
    return null;
  end if;

  begin
    return v_part::uuid;
  exception when others then
    return null;
  end;
end;
$function$;

create or replace function public.storage_user_id_from_path(p_path text)
returns uuid
language plpgsql
stable
set search_path = public, pg_catalog
as $function$
declare
  v_part text;
begin
  v_part := nullif(split_part(p_path, '/', 2), '');
  if v_part is null then
    return null;
  end if;

  begin
    return v_part::uuid;
  exception when others then
    return null;
  end;
end;
$function$;

-- Property images storage policies.
drop policy if exists property_images_storage_insert on storage.objects;
create policy property_images_storage_insert
on storage.objects
as permissive
for insert
to authenticated
with check (
  bucket_id = 'property-images'
  and split_part(name, '/', 1) = 'properties'
  and exists (
    select 1
    from public.properties p
    where p.id = public.storage_property_id_from_path(name)
      and p.owner_id = auth.uid()
  )
);

drop policy if exists property_images_storage_read on storage.objects;
create policy property_images_storage_read
on storage.objects
as permissive
for select
to public
using (
  bucket_id = 'property-images'
  and split_part(name, '/', 1) = 'properties'
  and exists (
    select 1
    from public.properties p
    where p.id = public.storage_property_id_from_path(name)
      and (
        p.status = 'available'::public.property_status
        or p.owner_id = public.current_user_id()
      )
  )
);

drop policy if exists property_images_storage_update on storage.objects;
create policy property_images_storage_update
on storage.objects
as permissive
for update
to authenticated
using (
  bucket_id = 'property-images'
  and split_part(name, '/', 1) = 'properties'
  and exists (
    select 1
    from public.properties p
    where p.id = public.storage_property_id_from_path(name)
      and p.owner_id = auth.uid()
  )
)
with check (
  bucket_id = 'property-images'
  and split_part(name, '/', 1) = 'properties'
  and exists (
    select 1
    from public.properties p
    where p.id = public.storage_property_id_from_path(name)
      and p.owner_id = auth.uid()
  )
);

drop policy if exists property_images_storage_delete on storage.objects;
create policy property_images_storage_delete
on storage.objects
as permissive
for delete
to authenticated
using (
  bucket_id = 'property-images'
  and split_part(name, '/', 1) = 'properties'
  and exists (
    select 1
    from public.properties p
    where p.id = public.storage_property_id_from_path(name)
      and p.owner_id = auth.uid()
  )
);

-- Avatar storage policies.
drop policy if exists avatars_storage_insert on storage.objects;
create policy avatars_storage_insert
on storage.objects
as permissive
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = 'profiles'
  and public.storage_user_id_from_path(name) = auth.uid()
);

drop policy if exists avatars_storage_read on storage.objects;
create policy avatars_storage_read
on storage.objects
as permissive
for select
to public
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = 'profiles'
  and public.storage_user_id_from_path(name) is not null
);

drop policy if exists avatars_storage_update on storage.objects;
create policy avatars_storage_update
on storage.objects
as permissive
for update
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = 'profiles'
  and public.storage_user_id_from_path(name) = auth.uid()
)
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = 'profiles'
  and public.storage_user_id_from_path(name) = auth.uid()
);

drop policy if exists avatars_storage_delete on storage.objects;
create policy avatars_storage_delete
on storage.objects
as permissive
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = 'profiles'
  and public.storage_user_id_from_path(name) = auth.uid()
);

commit;
