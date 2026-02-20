-- Agency legal and business profile data.
-- Goal: keep frontend integration simple with one dedicated table for agency-only fields.

begin;

create table if not exists public.agency_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  agency_name text not null,
  legal_form text,
  siret text not null,
  vat_number text,
  registration_number text,
  professional_card_number text,
  guarantee_provider text,
  guarantee_policy_number text,
  insurance_provider text,
  insurance_policy_number text,
  business_email text,
  business_phone text,
  website_url text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country text not null default 'FR',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.agency_profiles enable row level security;

create unique index if not exists ux_agency_profiles_siret
  on public.agency_profiles (siret);

do $do$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agency_profiles_siret_format'
      and conrelid = 'public.agency_profiles'::regclass
  ) then
    alter table public.agency_profiles
      add constraint agency_profiles_siret_format
      check (siret ~ '^[0-9]{14}$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'agency_profiles_business_email_format'
      and conrelid = 'public.agency_profiles'::regclass
  ) then
    alter table public.agency_profiles
      add constraint agency_profiles_business_email_format
      check (
        business_email is null
        or business_email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
      );
  end if;
end
$do$;

create or replace function public.normalize_agency_profile_fields()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $function$
begin
  if new.siret is not null then
    new.siret := regexp_replace(new.siret, '\D', '', 'g');
  end if;

  if new.business_email is not null then
    new.business_email := lower(trim(new.business_email));
  end if;

  if new.website_url is not null then
    new.website_url := trim(new.website_url);
  end if;

  new.updated_at := now();
  return new;
end;
$function$;

create or replace function public.ensure_agency_profile_role()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $function$
declare
  v_role public.user_role;
begin
  select p.role
    into v_role
  from public.profiles p
  where p.id = new.profile_id;

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_role <> 'agency'::public.user_role then
    raise exception 'Only agency users can write agency_profiles';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_agency_profiles_normalize on public.agency_profiles;
create trigger trg_agency_profiles_normalize
before insert or update on public.agency_profiles
for each row execute function public.normalize_agency_profile_fields();

drop trigger if exists trg_agency_profiles_role_guard on public.agency_profiles;
create trigger trg_agency_profiles_role_guard
before insert or update on public.agency_profiles
for each row execute function public.ensure_agency_profile_role();

drop policy if exists agency_profiles_select_own on public.agency_profiles;
create policy agency_profiles_select_own
on public.agency_profiles
as permissive
for select
to authenticated
using (profile_id = public.current_user_id());

drop policy if exists agency_profiles_insert_own on public.agency_profiles;
create policy agency_profiles_insert_own
on public.agency_profiles
as permissive
for insert
to authenticated
with check (
  profile_id = public.current_user_id()
  and exists (
    select 1
    from public.profiles p
    where p.id = agency_profiles.profile_id
      and p.role = 'agency'::public.user_role
  )
);

drop policy if exists agency_profiles_update_own on public.agency_profiles;
create policy agency_profiles_update_own
on public.agency_profiles
as permissive
for update
to authenticated
using (profile_id = public.current_user_id())
with check (
  profile_id = public.current_user_id()
  and exists (
    select 1
    from public.profiles p
    where p.id = agency_profiles.profile_id
      and p.role = 'agency'::public.user_role
  )
);

drop policy if exists agency_profiles_delete_own on public.agency_profiles;
create policy agency_profiles_delete_own
on public.agency_profiles
as permissive
for delete
to authenticated
using (profile_id = public.current_user_id());

grant select, insert, update, delete on table public.agency_profiles to authenticated, service_role;

create or replace view public.agency_account as
select
  p.id as profile_id,
  p.role,
  p.full_name as contact_name,
  p.phone as contact_phone,
  p.avatar_url,
  ap.agency_name,
  ap.legal_form,
  ap.siret,
  ap.vat_number,
  ap.registration_number,
  ap.professional_card_number,
  ap.guarantee_provider,
  ap.guarantee_policy_number,
  ap.insurance_provider,
  ap.insurance_policy_number,
  ap.business_email,
  ap.business_phone,
  ap.website_url,
  ap.address_line1,
  ap.address_line2,
  ap.postal_code,
  ap.city,
  ap.country,
  ap.created_at,
  ap.updated_at
from public.profiles p
left join public.agency_profiles ap on ap.profile_id = p.id
where p.role = 'agency'::public.user_role;

alter view if exists public.agency_account set (security_invoker = true);
grant select on public.agency_account to authenticated, service_role;

commit;
