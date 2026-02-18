drop extension if exists "pg_net";

create type "public"."application_status" as enum ('pending', 'accepted', 'rejected', 'cancelled');

create type "public"."incident_status" as enum ('open', 'in_progress', 'resolved', 'closed');

create type "public"."lease_status" as enum ('draft', 'active', 'ended', 'terminated');

create type "public"."payment_status" as enum ('due', 'paid', 'late', 'partial', 'cancelled');

create type "public"."property_status" as enum ('draft', 'available', 'rented', 'maintenance', 'archived');

create type "public"."user_role" as enum ('tenant', 'owner', 'admin');

create type "public"."work_status" as enum ('requested', 'approved', 'in_progress', 'done', 'cancelled');


  create table "public"."documents" (
    "id" uuid not null default gen_random_uuid(),
    "lease_id" uuid,
    "property_id" uuid,
    "uploader_id" uuid not null,
    "storage_path" text not null,
    "doc_type" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."documents" enable row level security;


  create table "public"."incidents" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid not null,
    "lease_id" uuid,
    "reporter_id" uuid not null,
    "title" text not null,
    "description" text,
    "status" public.incident_status not null default 'open'::public.incident_status,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."incidents" enable row level security;


  create table "public"."lease_tenants" (
    "lease_id" uuid not null,
    "tenant_id" uuid not null,
    "share_percent" numeric(5,2),
    "joined_at" timestamp with time zone not null default now()
      );


alter table "public"."lease_tenants" enable row level security;


  create table "public"."leases" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid not null,
    "owner_id" uuid not null,
    "start_date" date not null,
    "end_date" date,
    "notice_period_days" integer not null default 30,
    "rent_amount" numeric(10,2) not null,
    "charges_amount" numeric(10,2) not null default 0,
    "payment_day" integer not null default 5,
    "status" public.lease_status not null default 'draft'::public.lease_status,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."leases" enable row level security;


  create table "public"."maintenance_requests" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid not null,
    "lease_id" uuid,
    "requester_id" uuid not null,
    "title" text not null,
    "description" text,
    "status" public.work_status not null default 'requested'::public.work_status,
    "cost_estimated" numeric(10,2),
    "cost_real" numeric(10,2),
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."maintenance_requests" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "role" public.user_role not null default 'tenant'::public.user_role,
    "full_name" text,
    "phone" text,
    "avatar_url" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."properties" (
    "id" uuid not null default gen_random_uuid(),
    "owner_id" uuid not null,
    "title" text not null,
    "description" text,
    "address" text,
    "city" text,
    "country" text,
    "surface_m2" numeric(10,2),
    "property_type" text,
    "status" public.property_status not null default 'draft'::public.property_status,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."properties" enable row level security;


  create table "public"."property_history" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid not null,
    "actor_id" uuid not null,
    "action" text not null,
    "payload" jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."property_history" enable row level security;


  create table "public"."property_images" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid not null,
    "storage_path" text not null,
    "is_cover" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."property_images" enable row level security;


  create table "public"."rent_payments" (
    "id" uuid not null default gen_random_uuid(),
    "lease_id" uuid not null,
    "due_date" date not null,
    "amount_due" numeric(10,2) not null,
    "amount_paid" numeric(10,2) not null default 0,
    "status" public.payment_status not null default 'due'::public.payment_status,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."rent_payments" enable row level security;


  create table "public"."rental_applications" (
    "id" uuid not null default gen_random_uuid(),
    "property_id" uuid not null,
    "tenant_id" uuid not null,
    "owner_id" uuid not null,
    "message" text,
    "status" public.application_status not null default 'pending'::public.application_status,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."rental_applications" enable row level security;


  create table "public"."user_actions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "action" text not null,
    "entity" text,
    "entity_id" uuid,
    "payload" jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."user_actions" enable row level security;

CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id);

CREATE UNIQUE INDEX incidents_pkey ON public.incidents USING btree (id);

CREATE INDEX ix_applications_owner_id ON public.rental_applications USING btree (owner_id);

CREATE INDEX ix_applications_property_id ON public.rental_applications USING btree (property_id);

CREATE INDEX ix_applications_status ON public.rental_applications USING btree (status);

CREATE INDEX ix_applications_tenant_id ON public.rental_applications USING btree (tenant_id);

CREATE INDEX ix_documents_lease_id ON public.documents USING btree (lease_id);

CREATE INDEX ix_documents_property_id ON public.documents USING btree (property_id);

CREATE INDEX ix_documents_uploader_id ON public.documents USING btree (uploader_id);

CREATE INDEX ix_incidents_lease_id ON public.incidents USING btree (lease_id);

CREATE INDEX ix_incidents_property_id ON public.incidents USING btree (property_id);

CREATE INDEX ix_incidents_status ON public.incidents USING btree (status);

CREATE INDEX ix_lease_tenants_lease_id ON public.lease_tenants USING btree (lease_id);

CREATE INDEX ix_lease_tenants_tenant_id ON public.lease_tenants USING btree (tenant_id);

CREATE INDEX ix_leases_owner_id ON public.leases USING btree (owner_id);

CREATE INDEX ix_leases_property_id ON public.leases USING btree (property_id);

CREATE INDEX ix_leases_status ON public.leases USING btree (status);

CREATE INDEX ix_maintenance_lease_id ON public.maintenance_requests USING btree (lease_id);

CREATE INDEX ix_maintenance_property_id ON public.maintenance_requests USING btree (property_id);

CREATE INDEX ix_maintenance_status ON public.maintenance_requests USING btree (status);

CREATE INDEX ix_properties_owner_id ON public.properties USING btree (owner_id);

CREATE INDEX ix_properties_status ON public.properties USING btree (status);

CREATE INDEX ix_rent_payments_due_date ON public.rent_payments USING btree (due_date);

CREATE INDEX ix_rent_payments_lease_id ON public.rent_payments USING btree (lease_id);

CREATE INDEX ix_rent_payments_status ON public.rent_payments USING btree (status);

CREATE UNIQUE INDEX lease_tenants_pkey ON public.lease_tenants USING btree (lease_id, tenant_id);

CREATE UNIQUE INDEX leases_pkey ON public.leases USING btree (id);

CREATE UNIQUE INDEX maintenance_requests_pkey ON public.maintenance_requests USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX properties_pkey ON public.properties USING btree (id);

CREATE UNIQUE INDEX property_history_pkey ON public.property_history USING btree (id);

CREATE UNIQUE INDEX property_images_pkey ON public.property_images USING btree (id);

CREATE UNIQUE INDEX rent_payments_pkey ON public.rent_payments USING btree (id);

CREATE UNIQUE INDEX rental_applications_pkey ON public.rental_applications USING btree (id);

CREATE UNIQUE INDEX user_actions_pkey ON public.user_actions USING btree (id);

CREATE UNIQUE INDEX ux_application_pending_unique ON public.rental_applications USING btree (property_id, tenant_id) WHERE (status = 'pending'::public.application_status);

CREATE UNIQUE INDEX ux_one_active_lease_per_property ON public.leases USING btree (property_id) WHERE (status = 'active'::public.lease_status);

alter table "public"."documents" add constraint "documents_pkey" PRIMARY KEY using index "documents_pkey";

alter table "public"."incidents" add constraint "incidents_pkey" PRIMARY KEY using index "incidents_pkey";

alter table "public"."lease_tenants" add constraint "lease_tenants_pkey" PRIMARY KEY using index "lease_tenants_pkey";

alter table "public"."leases" add constraint "leases_pkey" PRIMARY KEY using index "leases_pkey";

alter table "public"."maintenance_requests" add constraint "maintenance_requests_pkey" PRIMARY KEY using index "maintenance_requests_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."properties" add constraint "properties_pkey" PRIMARY KEY using index "properties_pkey";

alter table "public"."property_history" add constraint "property_history_pkey" PRIMARY KEY using index "property_history_pkey";

alter table "public"."property_images" add constraint "property_images_pkey" PRIMARY KEY using index "property_images_pkey";

alter table "public"."rent_payments" add constraint "rent_payments_pkey" PRIMARY KEY using index "rent_payments_pkey";

alter table "public"."rental_applications" add constraint "rental_applications_pkey" PRIMARY KEY using index "rental_applications_pkey";

alter table "public"."user_actions" add constraint "user_actions_pkey" PRIMARY KEY using index "user_actions_pkey";

alter table "public"."documents" add constraint "documents_lease_id_fkey" FOREIGN KEY (lease_id) REFERENCES public.leases(id) ON DELETE CASCADE not valid;

alter table "public"."documents" validate constraint "documents_lease_id_fkey";

alter table "public"."documents" add constraint "documents_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."documents" validate constraint "documents_property_id_fkey";

alter table "public"."documents" add constraint "documents_uploader_id_fkey" FOREIGN KEY (uploader_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."documents" validate constraint "documents_uploader_id_fkey";

alter table "public"."incidents" add constraint "incidents_lease_id_fkey" FOREIGN KEY (lease_id) REFERENCES public.leases(id) ON DELETE SET NULL not valid;

alter table "public"."incidents" validate constraint "incidents_lease_id_fkey";

alter table "public"."incidents" add constraint "incidents_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."incidents" validate constraint "incidents_property_id_fkey";

alter table "public"."incidents" add constraint "incidents_reporter_id_fkey" FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."incidents" validate constraint "incidents_reporter_id_fkey";

alter table "public"."lease_tenants" add constraint "lease_tenants_lease_id_fkey" FOREIGN KEY (lease_id) REFERENCES public.leases(id) ON DELETE CASCADE not valid;

alter table "public"."lease_tenants" validate constraint "lease_tenants_lease_id_fkey";

alter table "public"."lease_tenants" add constraint "lease_tenants_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."lease_tenants" validate constraint "lease_tenants_tenant_id_fkey";

alter table "public"."leases" add constraint "chk_lease_charges_nonnegative" CHECK ((charges_amount >= (0)::numeric)) not valid;

alter table "public"."leases" validate constraint "chk_lease_charges_nonnegative";

alter table "public"."leases" add constraint "chk_lease_dates" CHECK (((end_date IS NULL) OR (end_date >= start_date))) not valid;

alter table "public"."leases" validate constraint "chk_lease_dates";

alter table "public"."leases" add constraint "chk_lease_notice_positive" CHECK ((notice_period_days > 0)) not valid;

alter table "public"."leases" validate constraint "chk_lease_notice_positive";

alter table "public"."leases" add constraint "chk_lease_payment_day_range" CHECK (((payment_day >= 1) AND (payment_day <= 28))) not valid;

alter table "public"."leases" validate constraint "chk_lease_payment_day_range";

alter table "public"."leases" add constraint "chk_lease_rent_positive" CHECK ((rent_amount > (0)::numeric)) not valid;

alter table "public"."leases" validate constraint "chk_lease_rent_positive";

alter table "public"."leases" add constraint "leases_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."leases" validate constraint "leases_owner_id_fkey";

alter table "public"."leases" add constraint "leases_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."leases" validate constraint "leases_property_id_fkey";

alter table "public"."maintenance_requests" add constraint "chk_maintenance_cost_estimated_nonnegative" CHECK (((cost_estimated IS NULL) OR (cost_estimated >= (0)::numeric))) not valid;

alter table "public"."maintenance_requests" validate constraint "chk_maintenance_cost_estimated_nonnegative";

alter table "public"."maintenance_requests" add constraint "chk_maintenance_cost_real_nonnegative" CHECK (((cost_real IS NULL) OR (cost_real >= (0)::numeric))) not valid;

alter table "public"."maintenance_requests" validate constraint "chk_maintenance_cost_real_nonnegative";

alter table "public"."maintenance_requests" add constraint "maintenance_requests_lease_id_fkey" FOREIGN KEY (lease_id) REFERENCES public.leases(id) ON DELETE SET NULL not valid;

alter table "public"."maintenance_requests" validate constraint "maintenance_requests_lease_id_fkey";

alter table "public"."maintenance_requests" add constraint "maintenance_requests_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."maintenance_requests" validate constraint "maintenance_requests_property_id_fkey";

alter table "public"."maintenance_requests" add constraint "maintenance_requests_requester_id_fkey" FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."maintenance_requests" validate constraint "maintenance_requests_requester_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."properties" add constraint "properties_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."properties" validate constraint "properties_owner_id_fkey";

alter table "public"."property_history" add constraint "property_history_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."property_history" validate constraint "property_history_actor_id_fkey";

alter table "public"."property_history" add constraint "property_history_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."property_history" validate constraint "property_history_property_id_fkey";

alter table "public"."property_images" add constraint "property_images_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."property_images" validate constraint "property_images_property_id_fkey";

alter table "public"."rent_payments" add constraint "chk_payment_amount_due_positive" CHECK ((amount_due > (0)::numeric)) not valid;

alter table "public"."rent_payments" validate constraint "chk_payment_amount_due_positive";

alter table "public"."rent_payments" add constraint "chk_payment_amount_paid_nonnegative" CHECK ((amount_paid >= (0)::numeric)) not valid;

alter table "public"."rent_payments" validate constraint "chk_payment_amount_paid_nonnegative";

alter table "public"."rent_payments" add constraint "chk_payment_paid_not_more_than_due" CHECK ((amount_paid <= amount_due)) not valid;

alter table "public"."rent_payments" validate constraint "chk_payment_paid_not_more_than_due";

alter table "public"."rent_payments" add constraint "rent_payments_lease_id_fkey" FOREIGN KEY (lease_id) REFERENCES public.leases(id) ON DELETE CASCADE not valid;

alter table "public"."rent_payments" validate constraint "rent_payments_lease_id_fkey";

alter table "public"."rental_applications" add constraint "rental_applications_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."rental_applications" validate constraint "rental_applications_owner_id_fkey";

alter table "public"."rental_applications" add constraint "rental_applications_property_id_fkey" FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE not valid;

alter table "public"."rental_applications" validate constraint "rental_applications_property_id_fkey";

alter table "public"."rental_applications" add constraint "rental_applications_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."rental_applications" validate constraint "rental_applications_tenant_id_fkey";

alter table "public"."user_actions" add constraint "user_actions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_actions" validate constraint "user_actions_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.accept_application(p_application_id uuid, p_start_date date, p_end_date date, p_rent_amount numeric, p_charges_amount numeric DEFAULT 0, p_payment_day integer DEFAULT 5, p_notice_period_days integer DEFAULT 30)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_app public.rental_applications%rowtype;
  v_lease_id uuid;
begin
  -- Récupérer la demande
  select * into v_app
  from public.rental_applications
  where id = p_application_id;

  if not found then
    raise exception 'Application not found';
  end if;

  -- Sécurité: seul le owner de la demande peut accepter
  if v_app.owner_id <> auth.uid() then
    raise exception 'Not allowed';
  end if;

  -- Marquer la demande acceptée
  update public.rental_applications
  set status = 'accepted'
  where id = p_application_id;

  -- Rejeter les autres demandes du même bien (optionnel mais pratique)
  update public.rental_applications
  set status = 'rejected'
  where property_id = v_app.property_id
    and id <> p_application_id
    and status = 'pending';

  -- Créer le bail
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
    'active'
  )
  returning id into v_lease_id;

  -- Ajouter le locataire au bail (colocation ready)
  insert into public.lease_tenants (lease_id, tenant_id)
  values (v_lease_id, v_app.tenant_id)
  on conflict do nothing;

  -- Passer le bien en "rented"
  update public.properties
  set status = 'rented'
  where id = v_app.property_id;

  return v_lease_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.apply_to_property(p_property_id uuid, p_message text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_owner_id uuid;
  v_app_id uuid;
begin
  select owner_id into v_owner_id
  from public.properties
  where id = p_property_id;

  if not found then
    raise exception 'Property not found';
  end if;

  insert into public.rental_applications(property_id, tenant_id, owner_id, message, status)
  values (p_property_id, auth.uid(), v_owner_id, p_message, 'pending')
  returning id into v_app_id;

  return v_app_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.audit_row_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_action text;
  v_entity text := tg_table_name;
  v_entity_id uuid;
  v_payload jsonb;
begin
  if tg_op = 'INSERT' then
    v_action := 'create';
    v_payload := to_jsonb(new);
    v_entity_id := new.id;
  elsif tg_op = 'UPDATE' then
    v_action := 'update';
    v_payload := jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new));
    v_entity_id := coalesce(new.id, old.id);
  else
    v_action := 'delete';
    v_payload := to_jsonb(old);
    v_entity_id := old.id;
  end if;

  insert into public.user_actions(user_id, action, entity, entity_id, payload)
  values (auth.uid(), v_action, v_entity, v_entity_id, v_payload);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.create_incident(p_lease_id uuid, p_property_id uuid, p_title text, p_description text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
begin
  if not public.is_lease_tenant(p_lease_id, auth.uid()) then
    raise exception 'Not allowed';
  end if;

  insert into public.incidents(property_id, lease_id, reporter_id, title, description, status)
  values (p_property_id, p_lease_id, auth.uid(), p_title, p_description, 'open')
  returning id into v_id;

  return v_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.create_maintenance_request(p_lease_id uuid, p_property_id uuid, p_title text, p_description text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
begin
  if not public.is_lease_tenant(p_lease_id, auth.uid()) then
    raise exception 'Not allowed';
  end if;

  insert into public.maintenance_requests(property_id, lease_id, requester_id, title, description, status)
  values (p_property_id, p_lease_id, auth.uid(), p_title, p_description, 'requested')
  returning id into v_id;

  return v_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.current_user_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  select auth.uid()
$function$
;

CREATE OR REPLACE FUNCTION public.generate_rent_payments(p_lease_id uuid, p_months integer DEFAULT 12)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_lease public.leases%rowtype;
  v_i int := 0;
  v_due date;
  v_amount numeric;
begin
  select * into v_lease
  from public.leases
  where id = p_lease_id;

  if not found then
    raise exception 'Lease not found';
  end if;

  -- Sécurité: seul le owner du bail peut générer
  if v_lease.owner_id <> auth.uid() then
    raise exception 'Not allowed';
  end if;

  v_amount := v_lease.rent_amount + v_lease.charges_amount;

  while v_i < p_months loop
    -- date d'échéance = start_date + i mois, au jour payment_day
    v_due := (date_trunc('month', v_lease.start_date::timestamptz) + make_interval(months => v_i))::date;
    v_due := (v_due + (v_lease.payment_day - 1));

    insert into public.rent_payments (lease_id, due_date, amount_due, status)
    values (p_lease_id, v_due, v_amount, 'due')
    on conflict do nothing;

    v_i := v_i + 1;
  end loop;

  return v_i;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_owner_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  uid uuid := auth.uid();
  kpis jsonb;
begin
  select to_jsonb(ok) into kpis
  from (select * from public.owner_kpis where owner_id = uid) ok;

  return jsonb_build_object('kpis', kpis);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    'tenant',
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_lease_owner(p_lease_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.leases l
    where l.id = p_lease_id
      and l.owner_id = p_user_id
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_lease_tenant(p_lease_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.lease_tenants lt
    where lt.lease_id = p_lease_id
      and lt.tenant_id = p_user_id
  );
$function$
;

CREATE OR REPLACE FUNCTION public.log_action(p_action text, p_entity text, p_entity_id uuid, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.user_actions(user_id, action, entity, entity_id, payload)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_payload);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_payment_paid(p_payment_id uuid, p_amount_paid numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_payment public.rent_payments%rowtype;
  v_owner_id uuid;
begin
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
$function$
;

create or replace view "public"."owner_kpis" as  SELECT p.owner_id,
    count(DISTINCT p.id) AS properties_total,
    count(DISTINCT p.id) FILTER (WHERE (p.status = 'available'::public.property_status)) AS properties_available,
    count(DISTINCT l.id) FILTER (WHERE (l.status = 'active'::public.lease_status)) AS leases_active,
    count(DISTINCT i.id) FILTER (WHERE (i.status = ANY (ARRAY['open'::public.incident_status, 'in_progress'::public.incident_status]))) AS incidents_open,
    count(DISTINCT m.id) FILTER (WHERE (m.status = ANY (ARRAY['requested'::public.work_status, 'approved'::public.work_status, 'in_progress'::public.work_status]))) AS works_open,
    count(DISTINCT rp.id) FILTER (WHERE ((rp.status = ANY (ARRAY['late'::public.payment_status, 'due'::public.payment_status])) AND (rp.due_date < CURRENT_DATE))) AS payments_overdue
   FROM ((((public.properties p
     LEFT JOIN public.leases l ON ((l.property_id = p.id)))
     LEFT JOIN public.incidents i ON ((i.property_id = p.id)))
     LEFT JOIN public.maintenance_requests m ON ((m.property_id = p.id)))
     LEFT JOIN public.rent_payments rp ON ((rp.lease_id = l.id)))
  GROUP BY p.owner_id;


create or replace view "public"."owner_open_incidents" as  SELECT p.owner_id,
    i.id AS incident_id,
    i.property_id,
    i.lease_id,
    i.title,
    i.status,
    i.created_at
   FROM (public.incidents i
     JOIN public.properties p ON ((p.id = i.property_id)))
  WHERE (i.status = ANY (ARRAY['open'::public.incident_status, 'in_progress'::public.incident_status]));


create or replace view "public"."owner_open_works" as  SELECT p.owner_id,
    m.id AS work_id,
    m.property_id,
    m.lease_id,
    m.title,
    m.status,
    m.cost_estimated,
    m.cost_real,
    m.created_at
   FROM (public.maintenance_requests m
     JOIN public.properties p ON ((p.id = m.property_id)))
  WHERE (m.status = ANY (ARRAY['requested'::public.work_status, 'approved'::public.work_status, 'in_progress'::public.work_status]));


create or replace view "public"."owner_overdue_payments" as  SELECT l.owner_id,
    rp.id AS payment_id,
    rp.lease_id,
    l.property_id,
    rp.due_date,
    rp.amount_due,
    rp.amount_paid,
    rp.status
   FROM (public.rent_payments rp
     JOIN public.leases l ON ((l.id = rp.lease_id)))
  WHERE ((rp.status = ANY (ARRAY['due'::public.payment_status, 'late'::public.payment_status])) AND (rp.due_date < CURRENT_DATE));


CREATE OR REPLACE FUNCTION public.owner_update_incident_status(p_incident_id uuid, p_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  set status = p_status
  where id = p_incident_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.storage_lease_id_from_path(p_path text)
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  select nullif(split_part(p_path, '/', 2), '')::uuid
$function$
;

grant delete on table "public"."documents" to "anon";

grant insert on table "public"."documents" to "anon";

grant references on table "public"."documents" to "anon";

grant select on table "public"."documents" to "anon";

grant trigger on table "public"."documents" to "anon";

grant truncate on table "public"."documents" to "anon";

grant update on table "public"."documents" to "anon";

grant delete on table "public"."documents" to "authenticated";

grant insert on table "public"."documents" to "authenticated";

grant references on table "public"."documents" to "authenticated";

grant select on table "public"."documents" to "authenticated";

grant trigger on table "public"."documents" to "authenticated";

grant truncate on table "public"."documents" to "authenticated";

grant update on table "public"."documents" to "authenticated";

grant delete on table "public"."documents" to "service_role";

grant insert on table "public"."documents" to "service_role";

grant references on table "public"."documents" to "service_role";

grant select on table "public"."documents" to "service_role";

grant trigger on table "public"."documents" to "service_role";

grant truncate on table "public"."documents" to "service_role";

grant update on table "public"."documents" to "service_role";

grant delete on table "public"."incidents" to "anon";

grant insert on table "public"."incidents" to "anon";

grant references on table "public"."incidents" to "anon";

grant select on table "public"."incidents" to "anon";

grant trigger on table "public"."incidents" to "anon";

grant truncate on table "public"."incidents" to "anon";

grant update on table "public"."incidents" to "anon";

grant delete on table "public"."incidents" to "authenticated";

grant insert on table "public"."incidents" to "authenticated";

grant references on table "public"."incidents" to "authenticated";

grant select on table "public"."incidents" to "authenticated";

grant trigger on table "public"."incidents" to "authenticated";

grant truncate on table "public"."incidents" to "authenticated";

grant update on table "public"."incidents" to "authenticated";

grant delete on table "public"."incidents" to "service_role";

grant insert on table "public"."incidents" to "service_role";

grant references on table "public"."incidents" to "service_role";

grant select on table "public"."incidents" to "service_role";

grant trigger on table "public"."incidents" to "service_role";

grant truncate on table "public"."incidents" to "service_role";

grant update on table "public"."incidents" to "service_role";

grant delete on table "public"."lease_tenants" to "anon";

grant insert on table "public"."lease_tenants" to "anon";

grant references on table "public"."lease_tenants" to "anon";

grant select on table "public"."lease_tenants" to "anon";

grant trigger on table "public"."lease_tenants" to "anon";

grant truncate on table "public"."lease_tenants" to "anon";

grant update on table "public"."lease_tenants" to "anon";

grant delete on table "public"."lease_tenants" to "authenticated";

grant insert on table "public"."lease_tenants" to "authenticated";

grant references on table "public"."lease_tenants" to "authenticated";

grant select on table "public"."lease_tenants" to "authenticated";

grant trigger on table "public"."lease_tenants" to "authenticated";

grant truncate on table "public"."lease_tenants" to "authenticated";

grant update on table "public"."lease_tenants" to "authenticated";

grant delete on table "public"."lease_tenants" to "service_role";

grant insert on table "public"."lease_tenants" to "service_role";

grant references on table "public"."lease_tenants" to "service_role";

grant select on table "public"."lease_tenants" to "service_role";

grant trigger on table "public"."lease_tenants" to "service_role";

grant truncate on table "public"."lease_tenants" to "service_role";

grant update on table "public"."lease_tenants" to "service_role";

grant delete on table "public"."leases" to "anon";

grant insert on table "public"."leases" to "anon";

grant references on table "public"."leases" to "anon";

grant select on table "public"."leases" to "anon";

grant trigger on table "public"."leases" to "anon";

grant truncate on table "public"."leases" to "anon";

grant update on table "public"."leases" to "anon";

grant delete on table "public"."leases" to "authenticated";

grant insert on table "public"."leases" to "authenticated";

grant references on table "public"."leases" to "authenticated";

grant select on table "public"."leases" to "authenticated";

grant trigger on table "public"."leases" to "authenticated";

grant truncate on table "public"."leases" to "authenticated";

grant update on table "public"."leases" to "authenticated";

grant delete on table "public"."leases" to "service_role";

grant insert on table "public"."leases" to "service_role";

grant references on table "public"."leases" to "service_role";

grant select on table "public"."leases" to "service_role";

grant trigger on table "public"."leases" to "service_role";

grant truncate on table "public"."leases" to "service_role";

grant update on table "public"."leases" to "service_role";

grant delete on table "public"."maintenance_requests" to "anon";

grant insert on table "public"."maintenance_requests" to "anon";

grant references on table "public"."maintenance_requests" to "anon";

grant select on table "public"."maintenance_requests" to "anon";

grant trigger on table "public"."maintenance_requests" to "anon";

grant truncate on table "public"."maintenance_requests" to "anon";

grant update on table "public"."maintenance_requests" to "anon";

grant delete on table "public"."maintenance_requests" to "authenticated";

grant insert on table "public"."maintenance_requests" to "authenticated";

grant references on table "public"."maintenance_requests" to "authenticated";

grant select on table "public"."maintenance_requests" to "authenticated";

grant trigger on table "public"."maintenance_requests" to "authenticated";

grant truncate on table "public"."maintenance_requests" to "authenticated";

grant update on table "public"."maintenance_requests" to "authenticated";

grant delete on table "public"."maintenance_requests" to "service_role";

grant insert on table "public"."maintenance_requests" to "service_role";

grant references on table "public"."maintenance_requests" to "service_role";

grant select on table "public"."maintenance_requests" to "service_role";

grant trigger on table "public"."maintenance_requests" to "service_role";

grant truncate on table "public"."maintenance_requests" to "service_role";

grant update on table "public"."maintenance_requests" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."properties" to "anon";

grant insert on table "public"."properties" to "anon";

grant references on table "public"."properties" to "anon";

grant select on table "public"."properties" to "anon";

grant trigger on table "public"."properties" to "anon";

grant truncate on table "public"."properties" to "anon";

grant update on table "public"."properties" to "anon";

grant delete on table "public"."properties" to "authenticated";

grant insert on table "public"."properties" to "authenticated";

grant references on table "public"."properties" to "authenticated";

grant select on table "public"."properties" to "authenticated";

grant trigger on table "public"."properties" to "authenticated";

grant truncate on table "public"."properties" to "authenticated";

grant update on table "public"."properties" to "authenticated";

grant delete on table "public"."properties" to "service_role";

grant insert on table "public"."properties" to "service_role";

grant references on table "public"."properties" to "service_role";

grant select on table "public"."properties" to "service_role";

grant trigger on table "public"."properties" to "service_role";

grant truncate on table "public"."properties" to "service_role";

grant update on table "public"."properties" to "service_role";

grant delete on table "public"."property_history" to "anon";

grant insert on table "public"."property_history" to "anon";

grant references on table "public"."property_history" to "anon";

grant select on table "public"."property_history" to "anon";

grant trigger on table "public"."property_history" to "anon";

grant truncate on table "public"."property_history" to "anon";

grant update on table "public"."property_history" to "anon";

grant delete on table "public"."property_history" to "authenticated";

grant insert on table "public"."property_history" to "authenticated";

grant references on table "public"."property_history" to "authenticated";

grant select on table "public"."property_history" to "authenticated";

grant trigger on table "public"."property_history" to "authenticated";

grant truncate on table "public"."property_history" to "authenticated";

grant update on table "public"."property_history" to "authenticated";

grant delete on table "public"."property_history" to "service_role";

grant insert on table "public"."property_history" to "service_role";

grant references on table "public"."property_history" to "service_role";

grant select on table "public"."property_history" to "service_role";

grant trigger on table "public"."property_history" to "service_role";

grant truncate on table "public"."property_history" to "service_role";

grant update on table "public"."property_history" to "service_role";

grant delete on table "public"."property_images" to "anon";

grant insert on table "public"."property_images" to "anon";

grant references on table "public"."property_images" to "anon";

grant select on table "public"."property_images" to "anon";

grant trigger on table "public"."property_images" to "anon";

grant truncate on table "public"."property_images" to "anon";

grant update on table "public"."property_images" to "anon";

grant delete on table "public"."property_images" to "authenticated";

grant insert on table "public"."property_images" to "authenticated";

grant references on table "public"."property_images" to "authenticated";

grant select on table "public"."property_images" to "authenticated";

grant trigger on table "public"."property_images" to "authenticated";

grant truncate on table "public"."property_images" to "authenticated";

grant update on table "public"."property_images" to "authenticated";

grant delete on table "public"."property_images" to "service_role";

grant insert on table "public"."property_images" to "service_role";

grant references on table "public"."property_images" to "service_role";

grant select on table "public"."property_images" to "service_role";

grant trigger on table "public"."property_images" to "service_role";

grant truncate on table "public"."property_images" to "service_role";

grant update on table "public"."property_images" to "service_role";

grant delete on table "public"."rent_payments" to "anon";

grant insert on table "public"."rent_payments" to "anon";

grant references on table "public"."rent_payments" to "anon";

grant select on table "public"."rent_payments" to "anon";

grant trigger on table "public"."rent_payments" to "anon";

grant truncate on table "public"."rent_payments" to "anon";

grant update on table "public"."rent_payments" to "anon";

grant delete on table "public"."rent_payments" to "authenticated";

grant insert on table "public"."rent_payments" to "authenticated";

grant references on table "public"."rent_payments" to "authenticated";

grant select on table "public"."rent_payments" to "authenticated";

grant trigger on table "public"."rent_payments" to "authenticated";

grant truncate on table "public"."rent_payments" to "authenticated";

grant update on table "public"."rent_payments" to "authenticated";

grant delete on table "public"."rent_payments" to "service_role";

grant insert on table "public"."rent_payments" to "service_role";

grant references on table "public"."rent_payments" to "service_role";

grant select on table "public"."rent_payments" to "service_role";

grant trigger on table "public"."rent_payments" to "service_role";

grant truncate on table "public"."rent_payments" to "service_role";

grant update on table "public"."rent_payments" to "service_role";

grant delete on table "public"."rental_applications" to "anon";

grant insert on table "public"."rental_applications" to "anon";

grant references on table "public"."rental_applications" to "anon";

grant select on table "public"."rental_applications" to "anon";

grant trigger on table "public"."rental_applications" to "anon";

grant truncate on table "public"."rental_applications" to "anon";

grant update on table "public"."rental_applications" to "anon";

grant delete on table "public"."rental_applications" to "authenticated";

grant insert on table "public"."rental_applications" to "authenticated";

grant references on table "public"."rental_applications" to "authenticated";

grant select on table "public"."rental_applications" to "authenticated";

grant trigger on table "public"."rental_applications" to "authenticated";

grant truncate on table "public"."rental_applications" to "authenticated";

grant update on table "public"."rental_applications" to "authenticated";

grant delete on table "public"."rental_applications" to "service_role";

grant insert on table "public"."rental_applications" to "service_role";

grant references on table "public"."rental_applications" to "service_role";

grant select on table "public"."rental_applications" to "service_role";

grant trigger on table "public"."rental_applications" to "service_role";

grant truncate on table "public"."rental_applications" to "service_role";

grant update on table "public"."rental_applications" to "service_role";

grant delete on table "public"."user_actions" to "anon";

grant insert on table "public"."user_actions" to "anon";

grant references on table "public"."user_actions" to "anon";

grant select on table "public"."user_actions" to "anon";

grant trigger on table "public"."user_actions" to "anon";

grant truncate on table "public"."user_actions" to "anon";

grant update on table "public"."user_actions" to "anon";

grant delete on table "public"."user_actions" to "authenticated";

grant insert on table "public"."user_actions" to "authenticated";

grant references on table "public"."user_actions" to "authenticated";

grant select on table "public"."user_actions" to "authenticated";

grant trigger on table "public"."user_actions" to "authenticated";

grant truncate on table "public"."user_actions" to "authenticated";

grant update on table "public"."user_actions" to "authenticated";

grant delete on table "public"."user_actions" to "service_role";

grant insert on table "public"."user_actions" to "service_role";

grant references on table "public"."user_actions" to "service_role";

grant select on table "public"."user_actions" to "service_role";

grant trigger on table "public"."user_actions" to "service_role";

grant truncate on table "public"."user_actions" to "service_role";

grant update on table "public"."user_actions" to "service_role";


  create policy "documents_insert_pro"
  on "public"."documents"
  as permissive
  for insert
  to public
with check (((uploader_id = auth.uid()) AND (((lease_id IS NOT NULL) AND (public.is_lease_tenant(lease_id, auth.uid()) OR public.is_lease_owner(lease_id, auth.uid()))) OR ((lease_id IS NULL) AND (property_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = documents.property_id) AND (p.owner_id = auth.uid()))))))));



  create policy "documents_owner_select"
  on "public"."documents"
  as permissive
  for select
  to public
using ((((lease_id IS NOT NULL) AND public.is_lease_owner(lease_id, auth.uid())) OR ((property_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = documents.property_id) AND (p.owner_id = auth.uid())))))));



  create policy "documents_tenant_select_if_member"
  on "public"."documents"
  as permissive
  for select
  to public
using (((lease_id IS NOT NULL) AND public.is_lease_tenant(lease_id, auth.uid())));



  create policy "incidents_owner_select"
  on "public"."incidents"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = incidents.property_id) AND (p.owner_id = public.current_user_id())))));



  create policy "incidents_owner_update"
  on "public"."incidents"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = incidents.property_id) AND (p.owner_id = public.current_user_id())))))
with check ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = incidents.property_id) AND (p.owner_id = public.current_user_id())))));



  create policy "incidents_tenant_insert_if_member"
  on "public"."incidents"
  as permissive
  for insert
  to public
with check (((reporter_id = auth.uid()) AND ((lease_id IS NULL) OR public.is_lease_tenant(lease_id, auth.uid()))));



  create policy "incidents_tenant_select_own"
  on "public"."incidents"
  as permissive
  for select
  to public
using ((reporter_id = public.current_user_id()));



  create policy "lease_tenants_owner_all"
  on "public"."lease_tenants"
  as permissive
  for all
  to public
using (public.is_lease_owner(lease_id, auth.uid()))
with check (public.is_lease_owner(lease_id, auth.uid()));



  create policy "lease_tenants_tenant_select_own"
  on "public"."lease_tenants"
  as permissive
  for select
  to public
using ((tenant_id = auth.uid()));



  create policy "leases_owner_all"
  on "public"."leases"
  as permissive
  for all
  to public
using ((owner_id = public.current_user_id()))
with check ((owner_id = public.current_user_id()));



  create policy "leases_tenant_select_if_member"
  on "public"."leases"
  as permissive
  for select
  to public
using (public.is_lease_tenant(id, auth.uid()));



  create policy "maintenance_insert_by_member_or_owner"
  on "public"."maintenance_requests"
  as permissive
  for insert
  to public
with check (((requester_id = public.current_user_id()) AND ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = maintenance_requests.property_id) AND (p.owner_id = public.current_user_id())))) OR ((lease_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.lease_tenants lt
  WHERE ((lt.lease_id = maintenance_requests.lease_id) AND (lt.tenant_id = public.current_user_id()))))))));



  create policy "maintenance_owner_all"
  on "public"."maintenance_requests"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = maintenance_requests.property_id) AND (p.owner_id = public.current_user_id())))))
with check ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = maintenance_requests.property_id) AND (p.owner_id = public.current_user_id())))));



  create policy "maintenance_tenant_select"
  on "public"."maintenance_requests"
  as permissive
  for select
  to public
using (((lease_id IS NOT NULL) AND public.is_lease_tenant(lease_id, auth.uid())));



  create policy "profiles_select_own"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((id = public.current_user_id()));



  create policy "profiles_update_own"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((id = public.current_user_id()))
with check ((id = public.current_user_id()));



  create policy "properties_owner_delete"
  on "public"."properties"
  as permissive
  for delete
  to public
using ((owner_id = public.current_user_id()));



  create policy "properties_owner_insert"
  on "public"."properties"
  as permissive
  for insert
  to public
with check ((owner_id = public.current_user_id()));



  create policy "properties_owner_select"
  on "public"."properties"
  as permissive
  for select
  to public
using ((owner_id = public.current_user_id()));



  create policy "properties_owner_update"
  on "public"."properties"
  as permissive
  for update
  to public
using ((owner_id = public.current_user_id()))
with check ((owner_id = public.current_user_id()));



  create policy "properties_public_read_available"
  on "public"."properties"
  as permissive
  for select
  to public
using ((status = 'available'::public.property_status));



  create policy "property_history_owner_select"
  on "public"."property_history"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = property_history.property_id) AND (p.owner_id = public.current_user_id())))));



  create policy "property_images_owner_all"
  on "public"."property_images"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = property_images.property_id) AND (p.owner_id = public.current_user_id())))))
with check ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = property_images.property_id) AND (p.owner_id = public.current_user_id())))));



  create policy "property_images_read"
  on "public"."property_images"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.properties p
  WHERE ((p.id = property_images.property_id) AND ((p.status = 'available'::public.property_status) OR (p.owner_id = public.current_user_id()))))));



  create policy "rent_payments_owner_all"
  on "public"."rent_payments"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.leases l
  WHERE ((l.id = rent_payments.lease_id) AND (l.owner_id = public.current_user_id())))))
with check ((EXISTS ( SELECT 1
   FROM public.leases l
  WHERE ((l.id = rent_payments.lease_id) AND (l.owner_id = public.current_user_id())))));



  create policy "rent_payments_tenant_select"
  on "public"."rent_payments"
  as permissive
  for select
  to public
using (public.is_lease_tenant(lease_id, auth.uid()));



  create policy "applications_owner_select"
  on "public"."rental_applications"
  as permissive
  for select
  to public
using ((owner_id = public.current_user_id()));



  create policy "applications_owner_update"
  on "public"."rental_applications"
  as permissive
  for update
  to public
using ((owner_id = public.current_user_id()))
with check ((owner_id = public.current_user_id()));



  create policy "applications_tenant_insert"
  on "public"."rental_applications"
  as permissive
  for insert
  to public
with check ((tenant_id = public.current_user_id()));



  create policy "applications_tenant_select"
  on "public"."rental_applications"
  as permissive
  for select
  to public
using ((tenant_id = public.current_user_id()));



  create policy "user_actions_select_own"
  on "public"."user_actions"
  as permissive
  for select
  to public
using ((user_id = public.current_user_id()));


CREATE TRIGGER trg_audit_documents AFTER INSERT OR DELETE OR UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

CREATE TRIGGER trg_audit_incidents AFTER INSERT OR DELETE OR UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

CREATE TRIGGER trg_audit_maintenance AFTER INSERT OR DELETE OR UPDATE ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

CREATE TRIGGER trg_audit_payments AFTER INSERT OR DELETE OR UPDATE ON public.rent_payments FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "documents_storage_delete"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'documents'::text) AND (split_part(name, '/'::text, 1) = 'leases'::text) AND public.is_lease_owner(public.storage_lease_id_from_path(name), auth.uid())));



  create policy "documents_storage_insert"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'documents'::text) AND (split_part(name, '/'::text, 1) = 'leases'::text) AND (public.is_lease_owner(public.storage_lease_id_from_path(name), auth.uid()) OR public.is_lease_tenant(public.storage_lease_id_from_path(name), auth.uid()))));



  create policy "documents_storage_read"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'documents'::text) AND (split_part(name, '/'::text, 1) = 'leases'::text) AND (public.is_lease_owner(public.storage_lease_id_from_path(name), auth.uid()) OR public.is_lease_tenant(public.storage_lease_id_from_path(name), auth.uid()))));



  create policy "documents_storage_update"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'documents'::text) AND (split_part(name, '/'::text, 1) = 'leases'::text) AND public.is_lease_owner(public.storage_lease_id_from_path(name), auth.uid())))
with check (((bucket_id = 'documents'::text) AND (split_part(name, '/'::text, 1) = 'leases'::text) AND public.is_lease_owner(public.storage_lease_id_from_path(name), auth.uid())));



