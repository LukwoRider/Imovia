# Backend Contract (Frontend Integration)

Contract version: `v1.2.0`  
Status: `stable`  
Last updated: `2026-02-21`
This document is the practical contract for frontend developers using Supabase directly.

## Scope

- Authenticated user flows for `owner`, `agency`, and `tenant`
- Business writes through RPCs
- Reads through RLS-protected tables/views
- Private document storage access through signed URLs

## Auth And Roles

- All writes require an authenticated session.
- Roles are stored in `public.profiles.role` (`tenant`, `owner`, `agency`, `admin`).
- Client apps must not use the service role key.

## Agency Profile Model

Agency legal/business fields are stored in a dedicated table:
- `public.agency_profiles` (one row per `profiles.id`)

Read helper view:
- `public.agency_account` (joins `profiles` + `agency_profiles` for agency users)

Why this model:
- keeps `profiles` clean for all roles
- gives frontend a single place for agency-specific fields (`siret`, legal info, insurance, etc.)
- enforces role/ownership in DB (RLS + trigger guard)

Recommended write pattern (authenticated agency user):

```ts
await supabase
  .from("agency_profiles")
  .upsert(
    {
      profile_id: user.id,
      agency_name: "Imovia Gestion",
      siret: "12345678901234",
      legal_form: "SAS",
      business_email: "contact@imovia.fr",
      business_phone: "+33 1 23 45 67 89",
      professional_card_number: "CPI75012024000000000",
    },
    { onConflict: "profile_id" }
  )
  .select()
  .single();
```

Recommended read pattern:

```ts
await supabase
  .from("agency_account")
  .select("*")
  .single();
```

## Write Contract (RPC First)

Use RPCs for business transitions instead of direct status updates.

### `accept_application`

Owner accepts a pending rental application and creates the lease.

```ts
await supabase.rpc("accept_application", {
  p_application_id: "<application-uuid>",
  p_start_date: "2026-03-01",
  p_end_date: "2027-03-01",
  p_rent_amount: 900,
  p_charges_amount: 50,
  p_payment_day: 5,
  p_notice_period_days: 30,
});
```

### `generate_rent_payments`

Owner generates rent schedule for a lease.

```ts
await supabase.rpc("generate_rent_payments", {
  p_lease_id: "<lease-uuid>",
  p_months: 12,
});
```

### `mark_payment_paid`

Marks a payment as paid/partial.

```ts
await supabase.rpc("mark_payment_paid", {
  p_payment_id: "<payment-uuid>",
  p_amount_paid: 950,
});
```

### `get_owner_dashboard`

Returns owner KPI payload.

```ts
await supabase.rpc("get_owner_dashboard");
```

### `get_owner_property_tenants`

Returns the owner mapping between properties, leases, and tenant members.
Use this to list each owner property with corresponding tenants (if any).

```ts
await supabase.rpc("get_owner_property_tenants", {
  p_property_id: null, // optional: pass a property UUID to filter
});
```

Returned payload includes:
- `properties_total`, `leases_total`, `tenants_total`
- `items[]` with:
  - property fields (`property_id`, `property_address`, `property_postal_code`, `property_city`, `property_status`, `property_type`, `surface_m2`, `rooms`, `monthly_rent`, `floor_number`, `is_furnished`, `has_elevator`, `energy_class`)
  - lease fields (`lease_id`, `lease_status`, dates, rent/charges, `payment_day`)
  - tenant fields (`tenant_id`, `tenant_full_name`, `tenant_phone`, `tenant_share_percent`, `tenant_joined_at`)

When a property has no tenant yet, lease/tenant fields are `null` for that item.

### Also available

- `apply_to_property`
- `create_incident`
- `create_maintenance_request`
- `owner_update_incident_status`

### `create_incident` (recommended)

Tenant declaration flow can use a simplified call (lease-based, property auto-resolved):

```ts
await supabase.rpc("create_incident", {
  p_lease_id: "<lease-uuid>",
  p_description: "Water leaking under the sink.",
  p_incident_type: "plumbing", // optional, default: "other"
  p_contact_phone: "+33 6 12 34 56 78", // optional
  p_preferred_visit_date: "2026-03-04", // optional
  p_allow_access_without_presence: false, // optional
});
```

Notes:
- `description` is required.
- `property_id` is derived from the lease in DB (prevents lease/property mismatch).
- Legacy overloaded signatures are still available for backward compatibility.

### `owner_update_incident_status` (extended)

Owner/manager updates status and can add resolution notes.

```ts
await supabase.rpc("owner_update_incident_status", {
  p_incident_id: "<incident-uuid>",
  p_status: "resolved",
  p_resolution_notes: "Plumber replaced the faulty joint.",
});
```

Important:
- Always send `p_resolution_notes` explicitly (`string` or `null`) in frontend RPC payloads.
- Reason: the DB exposes a 2-arg and a 3-arg overload for backward compatibility.

## Read Contract (RLS Protected)

Use normal `select` on:

- `properties`
- `property_images`
- `leases`
- `lease_tenants`
- `rental_applications`
- `rent_payments`
- `incidents`
- `maintenance_requests`
- `property_tenant_contacts`
- `documents`
- `document_users`
- `profiles`
- `owner_kpis` (view)

RLS decides visibility based on authenticated user ownership/membership.

Schema additions used by the flows:
- `properties.monthly_rent`, `properties.rooms`, `properties.bathrooms`, `properties.energy_class`, `properties.is_furnished`, `properties.has_elevator`, `properties.floor_number`, `properties.available_from`, `properties.postal_code`
- `leases.security_deposit_amount`
- `incidents.incident_type`, `incidents.priority`, `incidents.location_details`, `incidents.contact_phone`, `incidents.preferred_visit_date`, `incidents.allow_access_without_presence`, `incidents.resolution_notes`, `incidents.resolved_at`, `incidents.resolved_by`
- `maintenance_requests.incident_id`
- `property_tenant_contacts.first_name`, `property_tenant_contacts.last_name`, `property_tenant_contacts.phone`, `property_tenant_contacts.email`, `property_tenant_contacts.tenant_profile_id`
- `documents.title`, `documents.document_type`, `documents.document_date`, `documents.target_tenant_id`

Legacy compatibility still present:
- `documents.doc_type` is kept for backward compatibility.
- New frontend code should use `documents.document_type` as source of truth.

## Storage Contract

- Bucket: `documents` (private)
- Bucket: `property-images` (private)
- Bucket: `avatars` (private)
- Object path format (documents): `leases/{leaseId}/{uuid}-{filename}`
- Object path format (property images): `properties/{propertyId}/{uuid}-{filename}`
- Object path format (avatars): `profiles/{userId}/{uuid}-{filename}`

Upload example:

```ts
await supabase.storage.from("documents").upload(
  `leases/${leaseId}/${crypto.randomUUID()}-${file.name}`,
  file,
  { upsert: false }
);
```

Download example:

```ts
await supabase.storage.from("documents").createSignedUrl(storagePath, 60);
```

Important:
- DB row in `public.documents` must stay consistent with `lease_id` and `property_id`.
- `public.document_users` is auto-maintained to link each document to the concerned users:
- owner of the lease/property
- tenant members of the lease
- uploader
- if `target_tenant_id` is set, only the targeted tenant is linked on tenant side
- Owner/tenant housing relationship is available through `public.get_owner_property_tenants`.
- Property image path must match the target housing id (`properties/{propertyId}/...`), validated in DB trigger.

## Common Frontend Sequence

1. Tenant applies (`apply_to_property` or insert in `rental_applications` if allowed).
2. Owner accepts (`accept_application`).
3. Owner generates schedule (`generate_rent_payments`).
4. Tenant/owner tracks payments (`rent_payments`, `mark_payment_paid`).
5. Tenant creates incidents/maintenance.
6. Owner reads dashboard (`get_owner_dashboard`).
7. Tenant/owner upload and read documents through signed URLs.

## Error Handling Guidelines

- Always check `{ error }` from Supabase calls.
- Treat `Not allowed` as authorization failure (show forbidden UI state).
- Treat RLS errors as permission/model mismatch (do not retry blindly).
- For write RPCs, show actionable UI messages and keep operation idempotent where possible.

## Environment Needed By Frontend

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Never expose:
- `service_role` key
- DB password

## Compatibility Notes

- This contract assumes migrations in `supabase/migrations/` are applied.
- Use the same project ref/environment as the branch target for QA.
- Business rule: a tenant can be affiliated with only one `active` lease/property at a time.

## Versioning Policy

- Backward-compatible additions (new optional fields, new RPCs): minor update (`v1.1.0`).
- Breaking changes (renamed RPC args, removed fields, changed semantics): major update (`v2.0.0`).
- Bug-fix clarifications with no contract impact: patch update (`v1.0.1`).

For breaking changes:
- update this file version
- document migration path for frontend teams
- announce rollout window before deployment
