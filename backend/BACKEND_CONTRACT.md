# Backend Contract (Frontend Integration)

Contract version: `v1.0.0`  
Status: `stable`  
Last updated: `2026-02-18`
This document is the practical contract for frontend developers using Supabase directly.

## Scope

- Authenticated user flows for `owner` and `tenant`
- Business writes through RPCs
- Reads through RLS-protected tables/views
- Private document storage access through signed URLs

## Auth And Roles

- All writes require an authenticated session.
- Roles are stored in `public.profiles.role` (`tenant`, `owner`, `admin`).
- Client apps must not use the service role key.

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

### Also available

- `apply_to_property`
- `create_incident`
- `create_maintenance_request`
- `owner_update_incident_status`

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
- `documents`
- `profiles`
- `owner_kpis` (view)

RLS decides visibility based on authenticated user ownership/membership.

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

## Versioning Policy

- Backward-compatible additions (new optional fields, new RPCs): minor update (`v1.1.0`).
- Breaking changes (renamed RPC args, removed fields, changed semantics): major update (`v2.0.0`).
- Bug-fix clarifications with no contract impact: patch update (`v1.0.1`).

For breaking changes:
- update this file version
- document migration path for frontend teams
- announce rollout window before deployment
