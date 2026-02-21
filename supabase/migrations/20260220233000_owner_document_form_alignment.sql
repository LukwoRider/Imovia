-- Align owner "Add document" form with database:
-- - document_date
-- - target_tenant_id (optional targeted tenant)
-- and keep document visibility links consistent.

begin;

alter table public.documents
  add column if not exists document_date date,
  add column if not exists target_tenant_id uuid references public.profiles(id) on delete set null;

create index if not exists ix_documents_document_date
  on public.documents (document_date);

create index if not exists ix_documents_target_tenant_id
  on public.documents (target_tenant_id);

create or replace function public.validate_document_target_tenant()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_ok boolean;
  v_is_owner boolean;
begin
  if new.target_tenant_id is null then
    return new;
  end if;

  -- Targeting a specific tenant requires a property scope.
  if new.property_id is null then
    raise exception 'target_tenant_id requires property_id';
  end if;

  -- Only the housing owner can target a specific tenant in owner form flow.
  v_is_owner := exists (
    select 1
    from public.properties p
    where p.id = new.property_id
      and p.owner_id = new.uploader_id
  );

  if not v_is_owner then
    raise exception 'Only housing owner can set target_tenant_id';
  end if;

  -- If lease is provided, tenant must belong to that lease.
  if new.lease_id is not null then
    v_ok := exists (
      select 1
      from public.leases l
      join public.lease_tenants lt on lt.lease_id = l.id
      where l.id = new.lease_id
        and l.property_id = new.property_id
        and lt.tenant_id = new.target_tenant_id
    );
  else
    -- If no lease is provided, tenant must have an active lease on that property.
    v_ok := exists (
      select 1
      from public.leases l
      join public.lease_tenants lt on lt.lease_id = l.id
      where l.property_id = new.property_id
        and l.status = 'active'::public.lease_status
        and lt.tenant_id = new.target_tenant_id
    );
  end if;

  if not coalesce(v_ok, false) then
    raise exception 'Target tenant is not affiliated to the selected housing';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_documents_validate_target_tenant on public.documents;
create trigger trg_documents_validate_target_tenant
before insert or update of lease_id, property_id, target_tenant_id, uploader_id
on public.documents
for each row execute function public.validate_document_target_tenant();

create or replace function public.sync_document_user_links(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_doc public.documents%rowtype;
begin
  select *
    into v_doc
  from public.documents
  where id = p_document_id;

  if not found then
    return;
  end if;

  delete from public.document_users
  where document_id = p_document_id;

  -- Owner link (lease owner first, property owner fallback).
  if v_doc.lease_id is not null then
    insert into public.document_users (document_id, user_id, link_role)
    select p_document_id, l.owner_id, 'owner'
    from public.leases l
    where l.id = v_doc.lease_id
    on conflict (document_id, user_id) do nothing;
  elsif v_doc.property_id is not null then
    insert into public.document_users (document_id, user_id, link_role)
    select p_document_id, p.owner_id, 'owner'
    from public.properties p
    where p.id = v_doc.property_id
    on conflict (document_id, user_id) do nothing;
  end if;

  -- If owner targeted a specific tenant, link only that tenant.
  if v_doc.target_tenant_id is not null then
    insert into public.document_users (document_id, user_id, link_role)
    values (p_document_id, v_doc.target_tenant_id, 'tenant')
    on conflict (document_id, user_id) do nothing;
  else
    -- Lease-level: all lease tenants.
    if v_doc.lease_id is not null then
      insert into public.document_users (document_id, user_id, link_role)
      select p_document_id, lt.tenant_id, 'tenant'
      from public.lease_tenants lt
      where lt.lease_id = v_doc.lease_id
      on conflict (document_id, user_id) do nothing;
    end if;

    -- Property-level (without lease): active lease tenants of that property.
    if v_doc.lease_id is null and v_doc.property_id is not null then
      insert into public.document_users (document_id, user_id, link_role)
      select p_document_id, lt.tenant_id, 'tenant'
      from public.leases l
      join public.lease_tenants lt on lt.lease_id = l.id
      where l.property_id = v_doc.property_id
        and l.status = 'active'::public.lease_status
      on conflict (document_id, user_id) do nothing;
    end if;
  end if;

  -- Uploader always linked.
  insert into public.document_users (document_id, user_id, link_role)
  values (p_document_id, v_doc.uploader_id, 'uploader')
  on conflict (document_id, user_id) do nothing;
end;
$function$;

drop trigger if exists trg_documents_sync_user_links on public.documents;
create trigger trg_documents_sync_user_links
after insert or update of lease_id, property_id, uploader_id, target_tenant_id
on public.documents
for each row execute function public.trg_documents_sync_user_links();

-- Backfill links after sync logic update.
do $do$
declare
  r record;
begin
  for r in
    select d.id
    from public.documents d
  loop
    perform public.sync_document_user_links(r.id);
  end loop;
end;
$do$;

commit;
