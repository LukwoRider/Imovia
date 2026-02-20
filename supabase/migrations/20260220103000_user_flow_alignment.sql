-- Align database schema with tenant/owner user flows (backend only).
-- This migration keeps naming in English and stays backward compatible.

begin;

-- 1) Add missing enums used by incidents, properties, and documents.
do $do$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'incident_type'
      and n.nspname = 'public'
  ) then
    create type public.incident_type as enum (
      'plumbing',
      'electricity',
      'appliance',
      'other'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'incident_priority'
      and n.nspname = 'public'
  ) then
    create type public.incident_priority as enum (
      'low',
      'medium',
      'high',
      'critical'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'property_energy_class'
      and n.nspname = 'public'
  ) then
    create type public.property_energy_class as enum (
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'document_type'
      and n.nspname = 'public'
  ) then
    create type public.document_type as enum (
      'contract',
      'inventory',
      'receipt',
      'other'
    );
  end if;
end
$do$;

-- 2) Extend user role to support owner/agency dashboard split.
alter type public.user_role add value if not exists 'agency';

-- 3) Properties: fields required for search filters and property detail.
alter table public.properties
  add column if not exists monthly_rent numeric(10,2),
  add column if not exists rooms integer,
  add column if not exists bathrooms integer,
  add column if not exists energy_class public.property_energy_class,
  add column if not exists is_furnished boolean not null default false,
  add column if not exists available_from date;

do $do$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'properties_monthly_rent_non_negative'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_monthly_rent_non_negative
      check (monthly_rent is null or monthly_rent >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'properties_rooms_non_negative'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_rooms_non_negative
      check (rooms is null or rooms >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'properties_bathrooms_non_negative'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_bathrooms_non_negative
      check (bathrooms is null or bathrooms >= 0);
  end if;
end
$do$;

create index if not exists ix_properties_monthly_rent on public.properties (monthly_rent);
create index if not exists ix_properties_city_status_rent on public.properties (city, status, monthly_rent);
create index if not exists ix_properties_available_from on public.properties (available_from);

-- 4) Leases: contract-level field for tenant "My Home / Contract" details.
alter table public.leases
  add column if not exists security_deposit_amount numeric(10,2) not null default 0;

do $do$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'leases_security_deposit_non_negative'
      and conrelid = 'public.leases'::regclass
  ) then
    alter table public.leases
      add constraint leases_security_deposit_non_negative
      check (security_deposit_amount >= 0);
  end if;
end
$do$;

-- 5) Incidents: type selection, priority, contact data, and resolution tracking.
alter table public.incidents
  add column if not exists incident_type public.incident_type not null default 'other',
  add column if not exists priority public.incident_priority not null default 'medium',
  add column if not exists location_details text,
  add column if not exists contact_phone text,
  add column if not exists preferred_visit_date date,
  add column if not exists allow_access_without_presence boolean not null default false,
  add column if not exists resolution_notes text,
  add column if not exists resolved_at timestamp with time zone,
  add column if not exists resolved_by uuid;

do $do$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'incidents_resolved_by_fkey'
      and conrelid = 'public.incidents'::regclass
  ) then
    alter table public.incidents
      add constraint incidents_resolved_by_fkey
      foreign key (resolved_by)
      references public.profiles(id)
      on delete set null;
  end if;
end
$do$;

create index if not exists ix_incidents_type on public.incidents (incident_type);
create index if not exists ix_incidents_priority on public.incidents (priority);
create index if not exists ix_incidents_resolved_at on public.incidents (resolved_at);

-- 6) Maintenance follow-up linked to incidents.
alter table public.maintenance_requests
  add column if not exists incident_id uuid;

do $do$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'maintenance_requests_incident_id_fkey'
      and conrelid = 'public.maintenance_requests'::regclass
  ) then
    alter table public.maintenance_requests
      add constraint maintenance_requests_incident_id_fkey
      foreign key (incident_id)
      references public.incidents(id)
      on delete set null;
  end if;
end
$do$;

create index if not exists ix_maintenance_incident_id on public.maintenance_requests (incident_id);

-- 7) Documents: typed category + human-readable title.
alter table public.documents
  add column if not exists title text,
  add column if not exists document_type public.document_type;

update public.documents
set document_type = case lower(coalesce(doc_type, ''))
  when 'contract' then 'contract'::public.document_type
  when 'inventory' then 'inventory'::public.document_type
  when 'receipt' then 'receipt'::public.document_type
  else 'other'::public.document_type
end
where document_type is null;

alter table public.documents
  alter column document_type set default 'other';

create index if not exists ix_documents_document_type on public.documents (document_type);

-- 8) RPCs aligned with the incident declaration and resolution flow.
create or replace function public.create_incident(
  p_lease_id uuid,
  p_property_id uuid,
  p_title text,
  p_description text,
  p_incident_type public.incident_type default 'other',
  p_priority public.incident_priority default 'medium',
  p_location_details text default null,
  p_contact_phone text default null,
  p_preferred_visit_date date default null,
  p_allow_access_without_presence boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_id uuid;
begin
  if not public.is_lease_tenant(p_lease_id, auth.uid()) then
    raise exception 'Not allowed';
  end if;

  insert into public.incidents (
    property_id,
    lease_id,
    reporter_id,
    title,
    description,
    incident_type,
    priority,
    location_details,
    contact_phone,
    preferred_visit_date,
    allow_access_without_presence,
    status
  )
  values (
    p_property_id,
    p_lease_id,
    auth.uid(),
    p_title,
    p_description,
    p_incident_type,
    p_priority,
    p_location_details,
    p_contact_phone,
    p_preferred_visit_date,
    p_allow_access_without_presence,
    'open'::public.incident_status
  )
  returning id into v_id;

  return v_id;
end;
$function$;

create or replace function public.create_incident(
  p_lease_id uuid,
  p_property_id uuid,
  p_title text,
  p_description text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
begin
  return public.create_incident(
    p_lease_id,
    p_property_id,
    p_title,
    p_description,
    'other'::public.incident_type,
    'medium'::public.incident_priority,
    null,
    null,
    null,
    false
  );
end;
$function$;

create or replace function public.owner_update_incident_status(
  p_incident_id uuid,
  p_status text,
  p_resolution_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_owner uuid;
  v_next_status public.incident_status;
begin
  v_next_status := p_status::public.incident_status;

  select p.owner_id
    into v_owner
  from public.incidents i
  join public.properties p on p.id = i.property_id
  where i.id = p_incident_id;

  if not found then
    raise exception 'Incident not found';
  end if;

  if v_owner <> auth.uid() then
    raise exception 'Not allowed';
  end if;

  update public.incidents
  set
    status = v_next_status,
    resolution_notes = case
      when v_next_status in ('resolved'::public.incident_status, 'closed'::public.incident_status)
        then coalesce(p_resolution_notes, resolution_notes)
      else null
    end,
    resolved_at = case
      when v_next_status in ('resolved'::public.incident_status, 'closed'::public.incident_status)
        then coalesce(resolved_at, now())
      else null
    end,
    resolved_by = case
      when v_next_status in ('resolved'::public.incident_status, 'closed'::public.incident_status)
        then auth.uid()
      else null
    end
  where id = p_incident_id;
end;
$function$;

create or replace function public.owner_update_incident_status(
  p_incident_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
begin
  perform public.owner_update_incident_status(p_incident_id, p_status, null);
end;
$function$;

revoke execute on function public.create_incident(uuid, uuid, text, text) from public;
revoke execute on function public.create_incident(
  uuid,
  uuid,
  text,
  text,
  public.incident_type,
  public.incident_priority,
  text,
  text,
  date,
  boolean
) from public;

grant execute on function public.create_incident(uuid, uuid, text, text) to authenticated, service_role;
grant execute on function public.create_incident(
  uuid,
  uuid,
  text,
  text,
  public.incident_type,
  public.incident_priority,
  text,
  text,
  date,
  boolean
) to authenticated, service_role;

revoke execute on function public.owner_update_incident_status(uuid, text) from public;
revoke execute on function public.owner_update_incident_status(uuid, text, text) from public;
grant execute on function public.owner_update_incident_status(uuid, text) to authenticated, service_role;
grant execute on function public.owner_update_incident_status(uuid, text, text) to authenticated, service_role;

commit;
