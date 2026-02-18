-- Local development seed data for Imovia.
-- This file is executed by `supabase db reset` because config.toml has:
-- [db.seed] sql_paths = ["./seed.sql"]
--
-- Seed credentials created/used:
-- - owner@imovia.test / test
-- - tenant@imovia.test / test

begin;

-- Ensure private documents bucket exists for local tests.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

do $$
declare
  v_owner_email text := 'owner@imovia.test';
  v_tenant_email text := 'tenant@imovia.test';

  v_owner_default_id uuid := '11111111-1111-4111-8111-111111111111';
  v_tenant_default_id uuid := '22222222-2222-4222-8222-222222222222';

  v_owner_id uuid;
  v_tenant_id uuid;

  v_property_available uuid := '33333333-3333-4333-8333-333333333333';
  v_property_rented uuid := '44444444-4444-4444-8444-444444444444';
  v_pending_application uuid := '55555555-5555-4555-8555-555555555555';
  v_accepted_application uuid := '66666666-6666-4666-8666-666666666666';
  v_active_lease uuid := '77777777-7777-4777-8777-777777777777';
  v_payment_late uuid := '88888888-8888-4888-8888-888888888888';
  v_payment_due uuid := '99999999-9999-4999-8999-999999999999';
  v_incident_open uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  v_maintenance_open uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  v_document_row uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
begin
  -- Create/find owner auth user.
  select id into v_owner_id
  from auth.users
  where email = v_owner_email
  limit 1;

  if v_owner_id is null then
    v_owner_id := v_owner_default_id;

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      v_owner_id,
      'authenticated',
      'authenticated',
      v_owner_email,
      crypt('test', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Owner Demo"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    on conflict (id) do nothing;

    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      v_owner_id,
      v_owner_email,
      jsonb_build_object('sub', v_owner_id::text, 'email', v_owner_email),
      'email',
      now(),
      now(),
      now()
    )
    on conflict do nothing;
  end if;

  -- Create/find tenant auth user.
  select id into v_tenant_id
  from auth.users
  where email = v_tenant_email
  limit 1;

  if v_tenant_id is null then
    v_tenant_id := v_tenant_default_id;

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      v_tenant_id,
      'authenticated',
      'authenticated',
      v_tenant_email,
      crypt('test', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Tenant Demo"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    on conflict (id) do nothing;

    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      v_tenant_id,
      v_tenant_email,
      jsonb_build_object('sub', v_tenant_id::text, 'email', v_tenant_email),
      'email',
      now(),
      now(),
      now()
    )
    on conflict do nothing;
  end if;

  -- Ensure profiles exist and have expected roles.
  insert into public.profiles (id, role, full_name, phone)
  values (v_owner_id, 'owner', 'Owner Demo', '+33000000001')
  on conflict (id) do update
  set
    role = excluded.role,
    full_name = excluded.full_name,
    phone = excluded.phone;

  insert into public.profiles (id, role, full_name, phone)
  values (v_tenant_id, 'tenant', 'Tenant Demo', '+33000000002')
  on conflict (id) do update
  set
    role = excluded.role,
    full_name = excluded.full_name,
    phone = excluded.phone;

  -- Properties: one available and one rented.
  insert into public.properties (
    id,
    owner_id,
    title,
    description,
    address,
    city,
    country,
    surface_m2,
    property_type,
    status
  )
  values (
    v_property_available,
    v_owner_id,
    'T2 Downtown',
    'Available seeded property for frontend listing tests.',
    '12 Rue de Test',
    'Lyon',
    'FR',
    45,
    'apartment',
    'available'
  )
  on conflict (id) do update
  set
    owner_id = excluded.owner_id,
    title = excluded.title,
    description = excluded.description,
    address = excluded.address,
    city = excluded.city,
    country = excluded.country,
    surface_m2 = excluded.surface_m2,
    property_type = excluded.property_type,
    status = excluded.status;

  insert into public.properties (
    id,
    owner_id,
    title,
    description,
    address,
    city,
    country,
    surface_m2,
    property_type,
    status
  )
  values (
    v_property_rented,
    v_owner_id,
    'T3 Riverside',
    'Rented seeded property for active lease scenarios.',
    '8 Quai Seed',
    'Lyon',
    'FR',
    63,
    'apartment',
    'rented'
  )
  on conflict (id) do update
  set
    owner_id = excluded.owner_id,
    title = excluded.title,
    description = excluded.description,
    address = excluded.address,
    city = excluded.city,
    country = excluded.country,
    surface_m2 = excluded.surface_m2,
    property_type = excluded.property_type,
    status = excluded.status;

  -- Applications: one pending and one already accepted.
  insert into public.rental_applications (
    id,
    property_id,
    tenant_id,
    owner_id,
    message,
    status
  )
  values (
    v_pending_application,
    v_property_available,
    v_tenant_id,
    v_owner_id,
    'Seeded pending application.',
    'pending'
  )
  on conflict (id) do update
  set
    property_id = excluded.property_id,
    tenant_id = excluded.tenant_id,
    owner_id = excluded.owner_id,
    message = excluded.message,
    status = excluded.status;

  insert into public.rental_applications (
    id,
    property_id,
    tenant_id,
    owner_id,
    message,
    status
  )
  values (
    v_accepted_application,
    v_property_rented,
    v_tenant_id,
    v_owner_id,
    'Seeded accepted application.',
    'accepted'
  )
  on conflict (id) do update
  set
    property_id = excluded.property_id,
    tenant_id = excluded.tenant_id,
    owner_id = excluded.owner_id,
    message = excluded.message,
    status = excluded.status;

  -- One active lease linked to the rented property.
  insert into public.leases (
    id,
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
    v_active_lease,
    v_property_rented,
    v_owner_id,
    current_date - 60,
    current_date + 305,
    30,
    900,
    50,
    5,
    'active'
  )
  on conflict (id) do update
  set
    property_id = excluded.property_id,
    owner_id = excluded.owner_id,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    notice_period_days = excluded.notice_period_days,
    rent_amount = excluded.rent_amount,
    charges_amount = excluded.charges_amount,
    payment_day = excluded.payment_day,
    status = excluded.status;

  insert into public.lease_tenants (lease_id, tenant_id, share_percent)
  values (v_active_lease, v_tenant_id, 100)
  on conflict (lease_id, tenant_id) do update
  set share_percent = excluded.share_percent;

  -- Payments: one overdue-like and one upcoming.
  insert into public.rent_payments (
    id,
    lease_id,
    due_date,
    amount_due,
    amount_paid,
    status
  )
  values (
    v_payment_late,
    v_active_lease,
    current_date - 10,
    950,
    0,
    'late'
  )
  on conflict (id) do update
  set
    lease_id = excluded.lease_id,
    due_date = excluded.due_date,
    amount_due = excluded.amount_due,
    amount_paid = excluded.amount_paid,
    status = excluded.status;

  insert into public.rent_payments (
    id,
    lease_id,
    due_date,
    amount_due,
    amount_paid,
    status
  )
  values (
    v_payment_due,
    v_active_lease,
    current_date + 20,
    950,
    0,
    'due'
  )
  on conflict (id) do update
  set
    lease_id = excluded.lease_id,
    due_date = excluded.due_date,
    amount_due = excluded.amount_due,
    amount_paid = excluded.amount_paid,
    status = excluded.status;

  -- Open incident and maintenance request for owner dashboards.
  insert into public.incidents (
    id,
    property_id,
    lease_id,
    reporter_id,
    title,
    description,
    status
  )
  values (
    v_incident_open,
    v_property_rented,
    v_active_lease,
    v_tenant_id,
    'Seeded water leak',
    'Leak under kitchen sink (seed data).',
    'open'
  )
  on conflict (id) do update
  set
    property_id = excluded.property_id,
    lease_id = excluded.lease_id,
    reporter_id = excluded.reporter_id,
    title = excluded.title,
    description = excluded.description,
    status = excluded.status;

  insert into public.maintenance_requests (
    id,
    property_id,
    lease_id,
    requester_id,
    title,
    description,
    status,
    cost_estimated
  )
  values (
    v_maintenance_open,
    v_property_rented,
    v_active_lease,
    v_tenant_id,
    'Seeded heater issue',
    'Heater not starting (seed data).',
    'requested',
    180
  )
  on conflict (id) do update
  set
    property_id = excluded.property_id,
    lease_id = excluded.lease_id,
    requester_id = excluded.requester_id,
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    cost_estimated = excluded.cost_estimated;

  insert into public.documents (
    id,
    lease_id,
    property_id,
    uploader_id,
    storage_path,
    doc_type
  )
  values (
    v_document_row,
    v_active_lease,
    v_property_rented,
    v_tenant_id,
    'leases/77777777-7777-4777-8777-777777777777/seed-contract.txt',
    'contract'
  )
  on conflict (id) do update
  set
    lease_id = excluded.lease_id,
    property_id = excluded.property_id,
    uploader_id = excluded.uploader_id,
    storage_path = excluded.storage_path,
    doc_type = excluded.doc_type;
end $$;

commit;
