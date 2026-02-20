-- Remove title columns from properties/incidents and add postal_code on properties.
-- Also updates dependent views/functions to keep flows working.

begin;

-- 1) Properties: add postal code field.
alter table public.properties
  add column if not exists postal_code text;

do $do$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'properties_postal_code_length'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_postal_code_length
      check (
        postal_code is null
        or char_length(btrim(postal_code)) between 3 and 16
      );
  end if;
end
$do$;

create index if not exists ix_properties_postal_code on public.properties (postal_code);

-- 2) Owner read model: remove dependency on properties.title.
create or replace function public.get_owner_property_tenants(
  p_property_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not allowed';
  end if;

  if p_property_id is not null and not exists (
    select 1
    from public.properties p
    where p.id = p_property_id
      and p.owner_id = v_uid
  ) then
    raise exception 'Not allowed';
  end if;

  return (
    with owner_properties as (
      select
        p.id as property_id,
        p.address as property_address,
        p.postal_code as property_postal_code,
        p.city as property_city,
        p.status as property_status
      from public.properties p
      where p.owner_id = v_uid
        and (p_property_id is null or p.id = p_property_id)
    ),
    lease_scope as (
      select
        l.id as lease_id,
        l.property_id,
        l.status as lease_status,
        l.start_date,
        l.end_date,
        l.rent_amount,
        l.charges_amount,
        l.payment_day,
        l.notice_period_days
      from public.leases l
      join owner_properties op on op.property_id = l.property_id
    ),
    tenant_scope as (
      select
        ls.lease_id,
        ls.property_id,
        lt.tenant_id,
        lt.share_percent,
        lt.joined_at as tenant_joined_at,
        pr.full_name as tenant_full_name,
        pr.phone as tenant_phone,
        pr.avatar_url as tenant_avatar_url
      from lease_scope ls
      join public.lease_tenants lt on lt.lease_id = ls.lease_id
      left join public.profiles pr on pr.id = lt.tenant_id
    )
    select jsonb_build_object(
      'properties_total', coalesce((select count(*) from owner_properties), 0),
      'leases_total', coalesce((select count(*) from lease_scope), 0),
      'tenants_total', coalesce((select count(distinct tenant_id) from tenant_scope), 0),
      'items', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'property_id', op.property_id,
              'property_address', op.property_address,
              'property_postal_code', op.property_postal_code,
              'property_city', op.property_city,
              'property_status', op.property_status,
              'lease_id', ls.lease_id,
              'lease_status', ls.lease_status,
              'lease_start_date', ls.start_date,
              'lease_end_date', ls.end_date,
              'rent_amount', ls.rent_amount,
              'charges_amount', ls.charges_amount,
              'payment_day', ls.payment_day,
              'notice_period_days', ls.notice_period_days,
              'tenant_id', ts.tenant_id,
              'tenant_full_name', ts.tenant_full_name,
              'tenant_share_percent', ts.share_percent,
              'tenant_joined_at', ts.tenant_joined_at,
              'tenant_phone', ts.tenant_phone,
              'tenant_avatar_url', ts.tenant_avatar_url
            )
            order by op.property_city nulls last, op.property_address nulls last, ls.start_date desc
          )
          from owner_properties op
          left join lease_scope ls on ls.property_id = op.property_id
          left join tenant_scope ts on ts.lease_id = ls.lease_id
        ),
        '[]'::jsonb
      )
    )
  );
end;
$function$;

revoke execute on function public.get_owner_property_tenants(uuid) from public;
grant execute on function public.get_owner_property_tenants(uuid) to authenticated, service_role;

-- 3) Incidents read view: remove dependency on incidents.title.
drop view if exists public.owner_open_incidents;

create view public.owner_open_incidents as
select
  p.owner_id,
  i.id as incident_id,
  i.property_id,
  i.lease_id,
  i.incident_type,
  i.priority,
  i.description,
  i.status,
  i.created_at
from public.incidents i
join public.properties p on p.id = i.property_id
where i.status in ('open'::public.incident_status, 'in_progress'::public.incident_status);

alter view if exists public.owner_open_incidents set (security_invoker = true);
grant select on public.owner_open_incidents to authenticated, service_role;

-- 4) Incident write RPCs: keep signatures but remove title dependency.
drop function if exists public.default_incident_title(public.incident_type, text);

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
  v_uid uuid := auth.uid();
  v_property_id uuid;
begin
  if v_uid is null then
    raise exception 'Not allowed';
  end if;

  if nullif(btrim(p_description), '') is null then
    raise exception 'Description is required';
  end if;

  if p_preferred_visit_date is not null and p_preferred_visit_date < current_date then
    raise exception 'Preferred visit date must be today or later';
  end if;

  select l.property_id
    into v_property_id
  from public.leases l
  join public.lease_tenants lt
    on lt.lease_id = l.id
   and lt.tenant_id = v_uid
  where l.id = p_lease_id;

  if not found then
    raise exception 'Not allowed';
  end if;

  if p_property_id is not null and p_property_id <> v_property_id then
    raise exception 'Lease and property mismatch';
  end if;

  insert into public.incidents (
    property_id,
    lease_id,
    reporter_id,
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
    v_property_id,
    p_lease_id,
    v_uid,
    btrim(p_description),
    p_incident_type,
    p_priority,
    nullif(btrim(p_location_details), ''),
    nullif(btrim(p_contact_phone), ''),
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
  -- p_title is ignored (legacy compatibility).
  return public.create_incident(
    p_lease_id,
    p_property_id,
    null,
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

create or replace function public.create_incident(
  p_lease_id uuid,
  p_description text,
  p_incident_type public.incident_type default 'other',
  p_contact_phone text default null,
  p_preferred_visit_date date default null,
  p_allow_access_without_presence boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
begin
  return public.create_incident(
    p_lease_id,
    null,
    null,
    p_description,
    p_incident_type,
    'medium'::public.incident_priority,
    null,
    p_contact_phone,
    p_preferred_visit_date,
    p_allow_access_without_presence
  );
end;
$function$;

create or replace function public.create_incident(
  p_lease_id uuid,
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
    p_description,
    'other'::public.incident_type,
    null,
    null,
    false
  );
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
revoke execute on function public.create_incident(
  uuid,
  text,
  public.incident_type,
  text,
  date,
  boolean
) from public;
revoke execute on function public.create_incident(uuid, text) from public;

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
grant execute on function public.create_incident(
  uuid,
  text,
  public.incident_type,
  text,
  date,
  boolean
) to authenticated, service_role;
grant execute on function public.create_incident(uuid, text) to authenticated, service_role;

-- 5) Drop title columns now that dependencies are updated.
alter table public.incidents
  drop column if exists title;

alter table public.properties
  drop column if exists title;

commit;
