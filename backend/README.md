# Backend Guide (Supabase)

This folder is the backend integration reference for the project.

It provides:
- a full end-to-end test script (`backend/test.mjs`)
- the backend contract expected by frontend developers (tables, RPCs, storage paths)
- operational guidance to keep database migrations and production schema aligned

It does not provide:
- an HTTP API server (Express/Nest/etc.)
- background workers/queues

## Audience

- Backend developers maintaining schema, RPCs, RLS, and migrations
- Frontend developers consuming Supabase directly with stable write/read contracts

## Current Backend Scope

The integration flow in `backend/test.mjs` validates:

1. Owner login
2. Property creation
3. Tenant rental application
4. Owner acceptance (`accept_application`)
5. Rent schedule generation (`generate_rent_payments`)
6. First payment mark-as-paid (`mark_payment_paid`)
7. Incident flow
8. Maintenance flow
9. Document upload + DB row + signed URL
10. Owner dashboard (`get_owner_dashboard`)

## Prerequisites

- Node.js 18+
- Supabase project linked in repo root (`supabase/`)
- Supabase schema/migrations synced
- Two test users in Auth (`owner`, `tenant`)

## Install

From repository root:

```bash
cd backend
npm install
```

## Environment Variables

Create `backend/.env`:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>

OWNER_EMAIL=owner@imovia.test
OWNER_PASS=<owner-password>

TENANT_EMAIL=tenant@imovia.test
TENANT_PASS=<tenant-password>
```

Template file: `backend/.env.example`.

Security rules:
- never commit `backend/.env`
- never expose service role key in frontend apps

## Run Integration Test

From repo root:

```bash
node backend/test.mjs
```

From `backend/`:

```bash
node test.mjs
```

Expected success marker:

`TEST COMPLET RÉUSSI (documents inclus)`

## Frontend Contract (Use This First)

Preferred write operations (RPC):
- `accept_application`
- `generate_rent_payments`
- `mark_payment_paid`
- `get_owner_dashboard`
- `apply_to_property`
- `create_incident`
- `create_maintenance_request`

Read models (RLS-protected tables/views):
- `properties`
- `leases`
- `lease_tenants`
- `rental_applications`
- `rent_payments`
- `incidents`
- `maintenance_requests`
- `documents`
- `owner_kpis`

Frontend guidance:
- use authenticated user session for all writes
- rely on RLS instead of client-side authorization checks
- prefer RPCs for business transitions (status changes, lease creation, payment marking)

## Storage Contract (Documents)

Bucket:
- `documents` (private)

Object key convention:
- `leases/{leaseId}/{uuid}-{filename}`

Read/download:
- use signed URLs (`createSignedUrl`)

Important:
- DB row in `documents` must remain consistent with `lease_id` and `property_id`
- upload and DB insert should be treated as one business operation in UI flow

## Security Model Summary

The backend is secured through:
- Row Level Security on business tables
- role-aware policies for owners and tenants
- security-definer RPCs with ownership/membership checks
- storage policies tied to lease ownership/tenancy

Production expectations:
- all schema changes go through SQL migrations
- avoid direct table writes for complex transitions when RPC exists
- keep grants and execute permissions least-privilege

## Migration Workflow (Repo Root)

Common commands:

```bash
npx supabase migration list
npx supabase db push
npx supabase db pull
```

If migration history mismatch appears:

```bash
npx supabase migration repair --status reverted <version>
```

Then re-check:

```bash
npx supabase migration list
```

Notes:
- `db pull` may require Docker
- do not manually edit pulled snapshot migration except for review
- create additive migrations for fixes (like security hardening)

## Backend/Frontend Readiness Checklist

Before merging to production branch:
- migration list local/remote is aligned
- `node backend/test.mjs` passes end-to-end
- no sensitive values committed
- storage upload/read works for owner and tenant roles
- owner dashboard RPC returns expected data
- frontend flows use RPCs for state transitions

## Important Files

- `backend/test.mjs`: integration scenario and smoke test
- `backend/.env.example`: env template
- `backend/sample.txt`: test upload payload
- `supabase/migrations/`: source of truth for schema evolution
- `supabase/config.toml`: Supabase CLI project config

## Known Limitations

- test script creates persistent data on each run
- no automatic cleanup currently
- this folder is not a standalone API service

## Troubleshooting

- `Missing SUPABASE_URL or SUPABASE_ANON_KEY`: verify `backend/.env`.
- `password authentication failed for user cli_login_postgres`: relink project and provide the correct DB password.
- `Remote migration versions not found in local migrations directory`: run `supabase migration repair` then re-check migration list.
- RLS rejection on documents/incidents/maintenance: verify lease membership and storage path convention.
