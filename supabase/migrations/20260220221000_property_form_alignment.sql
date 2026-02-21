-- Align property schema with "Add property" form requirements.
-- Backend naming remains in English.

begin;

-- 1) Property fields from form.
alter table public.properties
  add column if not exists floor_number integer,
  add column if not exists has_elevator boolean not null default false;

-- Keep existing data valid before adding stricter constraints.
update public.properties
set description = left(description, 500)
where description is not null
  and char_length(description) > 500;

do $do$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'properties_floor_number_non_negative'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_floor_number_non_negative
      check (floor_number is null or floor_number >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'properties_description_max_500'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_description_max_500
      check (description is null or char_length(description) <= 500);
  end if;
end
$do$;

create index if not exists ix_properties_floor_number on public.properties (floor_number);

-- 2) Owner-entered tenant rows from property form ("Add / Remove tenant").
create table if not exists public.property_tenant_contacts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  tenant_profile_id uuid references public.profiles(id) on delete set null,
  first_name text not null,
  last_name text not null,
  phone text,
  email text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

do $do$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'property_tenant_contacts_email_format'
      and conrelid = 'public.property_tenant_contacts'::regclass
  ) then
    alter table public.property_tenant_contacts
      add constraint property_tenant_contacts_email_format
      check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'property_tenant_contacts_phone_length'
      and conrelid = 'public.property_tenant_contacts'::regclass
  ) then
    alter table public.property_tenant_contacts
      add constraint property_tenant_contacts_phone_length
      check (
        phone is null
        or char_length(btrim(phone)) between 6 and 32
      );
  end if;
end
$do$;

create unique index if not exists ux_property_tenant_contacts_property_email
  on public.property_tenant_contacts (property_id, email);

create unique index if not exists ux_property_tenant_contacts_property_profile
  on public.property_tenant_contacts (property_id, tenant_profile_id)
  where tenant_profile_id is not null;

create index if not exists ix_property_tenant_contacts_property_id
  on public.property_tenant_contacts (property_id);

create index if not exists ix_property_tenant_contacts_tenant_profile_id
  on public.property_tenant_contacts (tenant_profile_id);

create or replace function public.normalize_property_tenant_contact()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $function$
begin
  new.first_name := btrim(new.first_name);
  new.last_name := btrim(new.last_name);
  new.email := lower(btrim(new.email));
  new.phone := case when new.phone is null then null else btrim(new.phone) end;
  new.updated_at := now();
  return new;
end;
$function$;

drop trigger if exists trg_property_tenant_contacts_normalize on public.property_tenant_contacts;
create trigger trg_property_tenant_contacts_normalize
before insert or update on public.property_tenant_contacts
for each row execute function public.normalize_property_tenant_contact();

alter table public.property_tenant_contacts enable row level security;

drop policy if exists property_tenant_contacts_owner_all on public.property_tenant_contacts;
create policy property_tenant_contacts_owner_all
on public.property_tenant_contacts
as permissive
for all
to authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_tenant_contacts.property_id
      and p.owner_id = public.current_user_id()
  )
)
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_tenant_contacts.property_id
      and p.owner_id = public.current_user_id()
  )
);

grant select, insert, update, delete on public.property_tenant_contacts to authenticated, service_role;

-- Backfill tenant contacts from existing lease memberships.
insert into public.property_tenant_contacts (
  property_id,
  tenant_profile_id,
  first_name,
  last_name,
  phone,
  email
)
select
  l.property_id,
  pr.id,
  coalesce(nullif(split_part(coalesce(pr.full_name, ''), ' ', 1), ''), 'Tenant') as first_name,
  coalesce(
    nullif(
      btrim(
        regexp_replace(
          coalesce(pr.full_name, ''),
          '^\s*\S+\s*',
          ''
        )
      ),
      ''
    ),
    'User'
  ) as last_name,
  pr.phone,
  lower(au.email) as email
from public.leases l
join public.lease_tenants lt on lt.lease_id = l.id
join public.profiles pr on pr.id = lt.tenant_id
join auth.users au on au.id = pr.id
where au.email is not null
on conflict (property_id, email) do update
set
  tenant_profile_id = excluded.tenant_profile_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  phone = coalesce(excluded.phone, public.property_tenant_contacts.phone),
  updated_at = now();

-- 3) Keep owner mapping RPC useful for property form and management.
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
        p.status as property_status,
        p.property_type,
        p.rooms,
        p.surface_m2,
        p.monthly_rent,
        p.floor_number,
        p.is_furnished,
        p.has_elevator,
        p.energy_class
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
              'property_type', op.property_type,
              'rooms', op.rooms,
              'surface_m2', op.surface_m2,
              'monthly_rent', op.monthly_rent,
              'floor_number', op.floor_number,
              'is_furnished', op.is_furnished,
              'has_elevator', op.has_elevator,
              'energy_class', op.energy_class,
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

commit;
