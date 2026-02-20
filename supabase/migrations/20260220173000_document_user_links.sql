-- Link documents to concerned users (owner and tenant members of the housing lease).
-- This makes document visibility explicit and easier to consume by clients.

begin;

create table if not exists public.document_users (
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  link_role text not null check (link_role in ('owner', 'tenant', 'uploader')),
  created_at timestamp with time zone not null default now(),
  primary key (document_id, user_id)
);

alter table public.document_users enable row level security;

create index if not exists ix_document_users_user_id
  on public.document_users(user_id);

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

  -- Rebuild links from source-of-truth document + lease/property membership.
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

  -- Tenant links from the document lease.
  if v_doc.lease_id is not null then
    insert into public.document_users (document_id, user_id, link_role)
    select p_document_id, lt.tenant_id, 'tenant'
    from public.lease_tenants lt
    where lt.lease_id = v_doc.lease_id
    on conflict (document_id, user_id) do nothing;
  end if;

  -- Property-level docs (without lease) are also linked to active lease tenants of that property.
  if v_doc.lease_id is null and v_doc.property_id is not null then
    insert into public.document_users (document_id, user_id, link_role)
    select p_document_id, lt.tenant_id, 'tenant'
    from public.leases l
    join public.lease_tenants lt on lt.lease_id = l.id
    where l.property_id = v_doc.property_id
      and l.status = 'active'::public.lease_status
    on conflict (document_id, user_id) do nothing;
  end if;

  -- Keep uploader explicitly linked as well.
  insert into public.document_users (document_id, user_id, link_role)
  values (p_document_id, v_doc.uploader_id, 'uploader')
  on conflict (document_id, user_id) do nothing;
end;
$function$;

create or replace function public.trg_documents_sync_user_links()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
begin
  perform public.sync_document_user_links(new.id);
  return new;
end;
$function$;

create or replace function public.trg_lease_tenants_sync_document_links()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_lease_id uuid;
  v_property_id uuid;
  v_doc_id uuid;
begin
  v_lease_id := coalesce(new.lease_id, old.lease_id);

  select l.property_id
    into v_property_id
  from public.leases l
  where l.id = v_lease_id;

  for v_doc_id in
    select d.id
    from public.documents d
    where d.lease_id = v_lease_id
       or (d.lease_id is null and d.property_id = v_property_id)
  loop
    perform public.sync_document_user_links(v_doc_id);
  end loop;

  return coalesce(new, old);
end;
$function$;

drop trigger if exists trg_documents_sync_user_links on public.documents;
create trigger trg_documents_sync_user_links
after insert or update of lease_id, property_id, uploader_id
on public.documents
for each row execute function public.trg_documents_sync_user_links();

drop trigger if exists trg_lease_tenants_sync_document_links on public.lease_tenants;
create trigger trg_lease_tenants_sync_document_links
after insert or update or delete
on public.lease_tenants
for each row execute function public.trg_lease_tenants_sync_document_links();

-- Backfill existing documents.
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

drop policy if exists document_users_select_own on public.document_users;
create policy document_users_select_own
on public.document_users
as permissive
for select
to authenticated
using (user_id = public.current_user_id());

-- Keep write access internal (trigger/RPC/service role paths only).
revoke insert, update, delete on table public.document_users from anon, authenticated;
grant select on table public.document_users to authenticated;
grant select, insert, update, delete on table public.document_users to service_role;

-- Make document visibility explicit via linked users.
drop policy if exists documents_owner_select on public.documents;
drop policy if exists documents_tenant_select_if_member on public.documents;
drop policy if exists documents_select_if_linked on public.documents;
create policy documents_select_if_linked
on public.documents
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.document_users du
    where du.document_id = documents.id
      and du.user_id = public.current_user_id()
  )
);

commit;
