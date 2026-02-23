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

1. Owner login + property creation + tenant contact (`property_tenant_contacts`)
2. Tenant reads available property + creates rental application
3. Owner accepts application (`accept_application`) + generates schedule (`generate_rent_payments`)
4. Owner creates payment status variety (`paid`, `partial`, `due/overdue`)
5. Tenant creates incidents (`create_incident`)
6. Tenant creates maintenance requests linked to incidents
7. Tenant uploads document + DB row
8. Owner uploads targeted tenant document + property image
9. Owner updates incident/maintenance states and reads owner modules (dashboard, KPIs, mappings)
10. Tenant reads all affiliated modules (property, lease, payments, incidents, maintenance, documents)
11. Signed URL checks for tenant and owner
12. Final summary payload for frontend QA

## Prerequisites

- Node.js 18+
- Supabase project linked in repo root (`supabase/`)
- Supabase schema/migrations synced
- Two test users in Auth:
- `owner@imovia.test`
- `tenant@imovia.test`

## Install

From repository root:

```bash
cd backend
npm install
```

## Environment Variables

Create environment files from templates:

```bash
cp backend/.env.local.example backend/.env.local
cp backend/.env.staging.example backend/.env.staging
cp backend/.env.prod.example backend/.env.prod
```

PowerShell:

```powershell
Copy-Item backend/.env.local.example backend/.env.local
Copy-Item backend/.env.staging.example backend/.env.staging
Copy-Item backend/.env.prod.example backend/.env.prod
```

Then fill each file values:
- `backend/.env.local` -> local Supabase (`127.0.0.1`)
- `backend/.env.staging` -> staging Supabase project
- `backend/.env.prod` -> production Supabase project

Important behavior in `backend/test.mjs`:
- login emails are fixed to `owner@imovia.test` and `tenant@imovia.test`
- `OWNER_EMAIL` / `TENANT_EMAIL` env values are currently ignored by the script
- optional: `PROPERTY_IMAGE_SOURCE_URL` overrides the default demo image URL used for `property-images`

Reference templates:
- `backend/.env.example` (base required keys)
- `backend/.env.local.example`
- `backend/.env.staging.example`
- `backend/.env.prod.example`

Security rules:
- never commit real env files (`backend/.env.local`, `backend/.env.staging`, `backend/.env.prod`)
- never expose service role key in frontend apps

## Run Integration Test

Local (default, safe mode):

```bash
node backend/test.mjs
```

Staging (explicit opt-in):

```bash
TEST_TARGET=staging TEST_ENV_FILE=.env.staging ALLOW_REMOTE_TESTS=true node backend/test.mjs
```

Staging (PowerShell):

```powershell
$env:TEST_TARGET="staging"
$env:TEST_ENV_FILE=".env.staging"
$env:ALLOW_REMOTE_TESTS="true"
node backend/test.mjs
```

Production (dangerous, triple confirmation):

```bash
TEST_TARGET=prod TEST_ENV_FILE=.env.prod ALLOW_REMOTE_TESTS=true ALLOW_PROD_TESTS=true CONFIRM_PROD_HOST=<your-prod-host> node backend/test.mjs
```

Production (PowerShell):

```powershell
$env:TEST_TARGET="prod"
$env:TEST_ENV_FILE=".env.prod"
$env:ALLOW_REMOTE_TESTS="true"
$env:ALLOW_PROD_TESTS="true"
$env:CONFIRM_PROD_HOST="<your-prod-host>"
node backend/test.mjs
```

Notes:
- default mode is `TEST_TARGET=local` and expects `backend/.env.local`
- script refuses remote writes unless `ALLOW_REMOTE_TESTS=true`
- production mode also requires `ALLOW_PROD_TESTS=true` and `CONFIRM_PROD_HOST`
- `TEST_TARGET`, `TEST_ENV_FILE`, `ALLOW_REMOTE_TESTS`, `ALLOW_PROD_TESTS`, and `CONFIRM_PROD_HOST` are terminal environment variables (not values hardcoded in the script)
- `backend/.env` can still be used only if you explicitly set `TEST_ENV_FILE=.env`

Expected success marker:

`Seed and integration checks passed.`

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

Contract source of truth:
- `backend/BACKEND_CONTRACT.md` (current: `v1.4.0`)

## Storage Contract

Buckets:
- `documents` (private)
- `property-images` (public)
- `avatars` (public)

Object key convention:
- `leases/{leaseId}/{uuid}-{filename}`
- `properties/{propertyId}/{uuid}-{filename}`
- `profiles/{userId}/{uuid}-{filename}`

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

## Local Seed Data (Repo Root)

For local onboarding and frontend testing, this repo includes:
- `supabase/seed.sql`
- `[db.seed]` enabled in `supabase/config.toml`

Run a full local reset + migrations + seed:

```bash
npx supabase db reset
```

This creates deterministic demo data and test users:
- `owner@imovia.test` / `test`
- `tenant@imovia.test` / `test`

Seeded entities include:
- owner + tenant profiles
- available and rented properties
- rental applications (pending + accepted)
- one active lease and rent payments
- one incident and one maintenance request
- documents bucket bootstrap (`documents`)

Important:
- seed is for local/dev workflows only
- do not use these credentials in production

## Production Operations

Release and rollback procedure:
- `backend/PROD_RELEASE_RUNBOOK.md`

Short rule:
- every production release must include backup plan + post-deploy smoke test

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
- `backend/BACKEND_CONTRACT.md`: frontend/backend integration contract
- `backend/PROD_RELEASE_RUNBOOK.md`: release, backup, and rollback process
- `backend/sample.txt`: test upload payload
- `supabase/migrations/`: source of truth for schema evolution
- `supabase/config.toml`: Supabase CLI project config

## Known Limitations

- test script creates persistent data on each run
- no automatic cleanup currently
- this folder is not a standalone API service

## Troubleshooting

- `Missing SUPABASE_URL or SUPABASE_ANON_KEY`: verify the selected env file (`backend/.env.local`, `.env.staging`, or `.env.prod`).
- `password authentication failed for user cli_login_postgres`: relink project and provide the correct DB password.
- `Remote migration versions not found in local migrations directory`: run `supabase migration repair` then re-check migration list.
- RLS rejection on documents/incidents/maintenance: verify lease membership and storage path convention.
