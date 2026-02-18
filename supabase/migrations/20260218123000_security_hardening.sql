-- Security and integrity hardening for production readiness
-- Generated after audit of remote schema pull

begin;

-- 1) Data integrity cleanup + uniqueness for rent payments
with duplicated_payments as (
  select
    id,
    row_number() over (
      partition by lease_id, due_date
      order by created_at asc, id asc
    ) as rn
  from public.rent_payments
)
delete from public.rent_payments rp
using duplicated_payments dp
where rp.id = dp.id
  and dp.rn > 1;

create unique index if not exists ux_rent_payments_lease_due_date
  on public.rent_payments (lease_id, due_date);

-- 2) Normalize potentially inconsistent existing rows
update public.documents d
set property_id = l.property_id
from public.leases l
where d.lease_id = l.id
  and (d.property_id is null or d.property_id <> l.property_id);

update public.incidents i
set property_id = l.property_id
from public.leases l
where i.lease_id = l.id
  and i.property_id <> l.property_id;

update public.maintenance_requests m
set property_id = l.property_id
from public.leases l
where m.lease_id = l.id
  and m.property_id <> l.property_id;

update public.rental_applications ra
set owner_id = p.owner_id
from public.properties p
where ra.property_id = p.id
  and ra.owner_id <> p.owner_id;

-- 3) Trigger helpers to enforce consistency at write time
create or replace function public.enforce_lease_property_consistency()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $function$
declare
  v_lease_property_id uuid;
begin
  if new.lease_id is null then
    return new;
  end if;

  select l.property_id
    into v_lease_property_id
  from public.leases l
  where l.id = new.lease_id;

  if v_lease_property_id is null then
    raise exception 'Lease not found for lease_id=%', new.lease_id;
  end if;

  if new.property_id is null then
    new.property_id := v_lease_property_id;
  elsif new.property_id <> v_lease_property_id then
    raise exception 'lease_id/property_id mismatch';
  end if;

  return new;
end;
$function$;

create or replace function public.sync_rental_application_owner()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $function$
declare
  v_owner_id uuid;
begin
  select p.owner_id
    into v_owner_id
  from public.properties p
  where p.id = new.property_id;

  if v_owner_id is null then
    raise exception 'Property not found for property_id=%', new.property_id;
  end if;

  new.owner_id := v_owner_id;
  return new;
end;
$function$;

create or replace function public.prevent_rental_application_identity_change()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $function$
begin
  if tg_op = 'UPDATE' and (
    new.property_id <> old.property_id
    or new.tenant_id <> old.tenant_id
    or new.owner_id <> old.owner_id
  ) then
    raise exception 'Cannot change application identity fields (property_id, tenant_id, owner_id)';
  end if;

  return new;
end;
$function$;

-- Recreate triggers idempotently
 drop trigger if exists trg_documents_lease_property_consistency on public.documents;
create trigger trg_documents_lease_property_consistency
before insert or update on public.documents
for each row execute function public.enforce_lease_property_consistency();

 drop trigger if exists trg_incidents_lease_property_consistency on public.incidents;
create trigger trg_incidents_lease_property_consistency
before insert or update on public.incidents
for each row execute function public.enforce_lease_property_consistency();

 drop trigger if exists trg_maintenance_lease_property_consistency on public.maintenance_requests;
create trigger trg_maintenance_lease_property_consistency
before insert or update on public.maintenance_requests
for each row execute function public.enforce_lease_property_consistency();

 drop trigger if exists trg_sync_rental_application_owner on public.rental_applications;
create trigger trg_sync_rental_application_owner
before insert or update of property_id on public.rental_applications
for each row execute function public.sync_rental_application_owner();

 drop trigger if exists trg_prevent_rental_application_identity_change on public.rental_applications;
create trigger trg_prevent_rental_application_identity_change
before update on public.rental_applications
for each row execute function public.prevent_rental_application_identity_change();

-- 4) Harden critical SECURITY DEFINER RPCs
create or replace function public.accept_application(
  p_application_id uuid,
  p_start_date date,
  p_end_date date,
  p_rent_amount numeric,
  p_charges_amount numeric default 0,
  p_payment_day integer default 5,
  p_notice_period_days integer default 30
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_app public.rental_applications%rowtype;
  v_lease_id uuid;
  v_property_owner uuid;
begin
  select *
    into v_app
  from public.rental_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application not found';
  end if;

  if v_app.status <> 'pending'::public.application_status then
    raise exception 'Application is not pending';
  end if;

  select p.owner_id
    into v_property_owner
  from public.properties p
  where p.id = v_app.property_id;

  if v_property_owner is null then
    raise exception 'Property not found';
  end if;

  if v_property_owner <> v_app.owner_id then
    raise exception 'Application owner does not match property owner';
  end if;

  if v_property_owner <> auth.uid() then
    raise exception 'Not allowed';
  end if;

  update public.rental_applications
  set status = 'accepted'::public.application_status
  where id = p_application_id;

  update public.rental_applications
  set status = 'rejected'::public.application_status
  where property_id = v_app.property_id
    and id <> p_application_id
    and status = 'pending'::public.application_status;

  insert into public.leases (
    property_id,
    owner_id,
    start_date,
    end_date,
    notice_period_days,
    rent_amount,
    charges_amount,
    payment_day,
    status
  )
  values (
    v_app.property_id,
    v_app.owner_id,
    p_start_date,
    p_end_date,
    p_notice_period_days,
    p_rent_amount,
    p_charges_amount,
    p_payment_day,
    'active'::public.lease_status
  )
  returning id into v_lease_id;

  insert into public.lease_tenants (lease_id, tenant_id)
  values (v_lease_id, v_app.tenant_id)
  on conflict do nothing;

  update public.properties
  set status = 'rented'::public.property_status
  where id = v_app.property_id;

  return v_lease_id;
end;
$function$;

create or replace function public.generate_rent_payments(
  p_lease_id uuid,
  p_months integer default 12
)
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_lease public.leases%rowtype;
  v_i int := 0;
  v_due date;
  v_amount numeric;
begin
  if p_months is null or p_months < 1 or p_months > 120 then
    raise exception 'p_months must be between 1 and 120';
  end if;

  select * into v_lease
  from public.leases
  where id = p_lease_id;

  if not found then
    raise exception 'Lease not found';
  end if;

  if v_lease.owner_id <> auth.uid() then
    raise exception 'Not allowed';
  end if;

  v_amount := v_lease.rent_amount + v_lease.charges_amount;

  while v_i < p_months loop
    v_due := (date_trunc('month', v_lease.start_date::timestamptz) + make_interval(months => v_i))::date;
    v_due := (v_due + (v_lease.payment_day - 1));

    insert into public.rent_payments (lease_id, due_date, amount_due, status)
    values (p_lease_id, v_due, v_amount, 'due'::public.payment_status)
    on conflict (lease_id, due_date) do nothing;

    v_i := v_i + 1;
  end loop;

  return v_i;
end;
$function$;

create or replace function public.mark_payment_paid(
  p_payment_id uuid,
  p_amount_paid numeric
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_payment public.rent_payments%rowtype;
  v_owner_id uuid;
begin
  if p_amount_paid is null or p_amount_paid < 0 then
    raise exception 'p_amount_paid must be >= 0';
  end if;

  select * into v_payment
  from public.rent_payments
  where id = p_payment_id;

  if not found then
    raise exception 'Payment not found';
  end if;

  select owner_id into v_owner_id
  from public.leases
  where id = v_payment.lease_id;

  if not (
    v_owner_id = auth.uid()
    or public.is_lease_tenant(v_payment.lease_id, auth.uid())
  ) then
    raise exception 'Not allowed';
  end if;

  update public.rent_payments
  set
    amount_paid = least(p_amount_paid, amount_due),
    status = case
      when p_amount_paid >= amount_due then 'paid'::public.payment_status
      when p_amount_paid > 0 then 'partial'::public.payment_status
      else status
    end,
    paid_at = case when p_amount_paid > 0 then now() else paid_at end
  where id = p_payment_id;
end;
$function$;

create or replace function public.get_owner_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  uid uuid := auth.uid();
  kpis jsonb;
begin
  select to_jsonb(ok) into kpis
  from (select * from public.owner_kpis where owner_id = uid) ok;

  return jsonb_build_object('kpis', kpis);
end;
$function$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    'tenant'::public.user_role,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$function$;

create or replace function public.log_action(
  p_action text,
  p_entity text,
  p_entity_id uuid,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
begin
  insert into public.user_actions(user_id, action, entity, entity_id, payload)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_payload);
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
declare
  v_owner uuid;
  v_property uuid;
begin
  select p.owner_id, i.property_id into v_owner, v_property
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
  set status = p_status::public.incident_status
  where id = p_incident_id;
end;
$function$;

-- 5) Tighten policy checks on critical write paths
 drop policy if exists applications_tenant_insert on public.rental_applications;
create policy applications_tenant_insert
on public.rental_applications
as permissive
for insert
to authenticated
with check (
  tenant_id = public.current_user_id()
  and status = 'pending'::public.application_status
  and exists (
    select 1
    from public.properties p
    where p.id = rental_applications.property_id
      and p.owner_id = rental_applications.owner_id
  )
);

 drop policy if exists incidents_tenant_insert_if_member on public.incidents;
create policy incidents_tenant_insert_if_member
on public.incidents
as permissive
for insert
to authenticated
with check (
  reporter_id = auth.uid()
  and lease_id is not null
  and exists (
    select 1
    from public.leases l
    join public.lease_tenants lt
      on lt.lease_id = l.id
     and lt.tenant_id = auth.uid()
    where l.id = incidents.lease_id
      and l.property_id = incidents.property_id
  )
);

 drop policy if exists maintenance_insert_by_member_or_owner on public.maintenance_requests;
create policy maintenance_insert_by_member_or_owner
on public.maintenance_requests
as permissive
for insert
to authenticated
with check (
  requester_id = public.current_user_id()
  and (
    (
      lease_id is not null
      and exists (
        select 1
        from public.leases l
        join public.lease_tenants lt
          on lt.lease_id = l.id
         and lt.tenant_id = public.current_user_id()
        where l.id = maintenance_requests.lease_id
          and l.property_id = maintenance_requests.property_id
      )
    )
    or (
      lease_id is null
      and exists (
        select 1
        from public.properties p
        where p.id = maintenance_requests.property_id
          and p.owner_id = public.current_user_id()
      )
    )
  )
);

 drop policy if exists documents_insert_pro on public.documents;
create policy documents_insert_pro
on public.documents
as permissive
for insert
to authenticated
with check (
  uploader_id = auth.uid()
  and (
    (
      lease_id is not null
      and exists (
        select 1
        from public.leases l
        where l.id = documents.lease_id
          and l.property_id = documents.property_id
      )
      and (
        public.is_lease_tenant(lease_id, auth.uid())
        or public.is_lease_owner(lease_id, auth.uid())
      )
    )
    or (
      lease_id is null
      and property_id is not null
      and exists (
        select 1
        from public.properties p
        where p.id = documents.property_id
          and p.owner_id = auth.uid()
      )
    )
  )
);

-- 6) Restrict unnecessary table privileges (least privilege baseline)
do $do$
declare
  r record;
begin
  for r in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format(
      'revoke truncate, trigger, references on table %I.%I from anon, authenticated;',
      r.schemaname,
      r.tablename
    );
  end loop;
end;
$do$;

-- 7) Restrict execution surface of mutating/public RPCs
revoke execute on function public.accept_application(uuid, date, date, numeric, numeric, integer, integer) from public;
revoke execute on function public.apply_to_property(uuid, text) from public;
revoke execute on function public.create_incident(uuid, uuid, text, text) from public;
revoke execute on function public.create_maintenance_request(uuid, uuid, text, text) from public;
revoke execute on function public.generate_rent_payments(uuid, integer) from public;
revoke execute on function public.get_owner_dashboard() from public;
revoke execute on function public.mark_payment_paid(uuid, numeric) from public;
revoke execute on function public.owner_update_incident_status(uuid, text) from public;
revoke execute on function public.log_action(text, text, uuid, jsonb) from public;

grant execute on function public.accept_application(uuid, date, date, numeric, numeric, integer, integer) to authenticated, service_role;
grant execute on function public.apply_to_property(uuid, text) to authenticated, service_role;
grant execute on function public.create_incident(uuid, uuid, text, text) to authenticated, service_role;
grant execute on function public.create_maintenance_request(uuid, uuid, text, text) to authenticated, service_role;
grant execute on function public.generate_rent_payments(uuid, integer) to authenticated, service_role;
grant execute on function public.get_owner_dashboard() to authenticated, service_role;
grant execute on function public.mark_payment_paid(uuid, numeric) to authenticated, service_role;
grant execute on function public.owner_update_incident_status(uuid, text) to authenticated, service_role;
grant execute on function public.log_action(text, text, uuid, jsonb) to authenticated, service_role;

commit;
