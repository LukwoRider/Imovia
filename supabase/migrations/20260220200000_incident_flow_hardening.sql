-- Incident flow hardening for tenant declaration screens.
-- Keep schema naming in English and improve frontend integration safety.

begin;

-- 1) Make description mandatory and backfill legacy null/empty rows.
update public.incidents
set description = coalesce(
  nullif(btrim(description), ''),
  nullif(btrim(title), ''),
  'Incident reported'
)
where description is null
   or btrim(description) = '';

alter table public.incidents
  alter column description set not null;

-- 2) Lightweight validation/indexing for tenant dashboard/read flows.
do $do$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'incidents_contact_phone_length'
      and conrelid = 'public.incidents'::regclass
  ) then
    alter table public.incidents
      add constraint incidents_contact_phone_length
      check (
        contact_phone is null
        or char_length(btrim(contact_phone)) between 6 and 32
      );
  end if;
end
$do$;

create index if not exists ix_incidents_reporter_created_at
  on public.incidents (reporter_id, created_at desc);

-- 3) Title helper so tenant form can submit without explicit title.
create or replace function public.default_incident_title(
  p_incident_type public.incident_type,
  p_description text
)
returns text
language plpgsql
immutable
set search_path = public, pg_catalog
as $function$
declare
  v_base text;
  v_from_description text;
begin
  v_base := case p_incident_type
    when 'plumbing'::public.incident_type then 'Plumbing issue'
    when 'electricity'::public.incident_type then 'Electrical issue'
    when 'appliance'::public.incident_type then 'Appliance issue'
    else 'Other incident'
  end;

  v_from_description := nullif(btrim(split_part(coalesce(p_description, ''), E'\n', 1)), '');

  if v_from_description is null then
    return v_base;
  end if;

  if char_length(v_from_description) > 120 then
    return left(v_from_description, 117) || '...';
  end if;

  return v_from_description;
end;
$function$;

-- 4) Harden existing RPC (property is derived from lease membership, title can be omitted).
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
  v_title text;
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

  v_title := coalesce(
    nullif(btrim(p_title), ''),
    public.default_incident_title(p_incident_type, p_description)
  );

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
    v_property_id,
    p_lease_id,
    v_uid,
    v_title,
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

-- 5) Frontend-friendly overloads matching tenant declaration UI.
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

revoke execute on function public.default_incident_title(public.incident_type, text) from public;
grant execute on function public.default_incident_title(public.incident_type, text) to authenticated, service_role;

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

commit;
