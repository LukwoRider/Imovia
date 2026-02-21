-- Property images backend alignment:
-- - ensure image row is strictly bound to target property path
-- - allow affiliated tenant to read images of their housing
-- - ensure one cover image per property

begin;

do $do$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'ux_property_images_one_cover_per_property'
  ) then
    create unique index ux_property_images_one_cover_per_property
      on public.property_images (property_id)
      where is_cover = true;
  end if;
end
$do$;

create or replace function public.validate_property_image_path_match()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_path_property_id uuid;
begin
  v_path_property_id := public.storage_property_id_from_path(new.storage_path);

  if v_path_property_id is null then
    raise exception 'Invalid property image storage path format';
  end if;

  if v_path_property_id <> new.property_id then
    raise exception 'Property image path does not match property_id';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_property_images_validate_path on public.property_images;
create trigger trg_property_images_validate_path
before insert or update of property_id, storage_path
on public.property_images
for each row execute function public.validate_property_image_path_match();

drop policy if exists property_images_tenant_select_if_member on public.property_images;
create policy property_images_tenant_select_if_member
on public.property_images
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.leases l
    join public.lease_tenants lt on lt.lease_id = l.id
    where l.property_id = property_images.property_id
      and lt.tenant_id = public.current_user_id()
  )
);

drop policy if exists property_images_storage_read on storage.objects;
create policy property_images_storage_read
on storage.objects
as permissive
for select
to authenticated
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
        or exists (
          select 1
          from public.leases l
          join public.lease_tenants lt on lt.lease_id = l.id
          where l.property_id = p.id
            and lt.tenant_id = public.current_user_id()
        )
      )
  )
);

commit;
