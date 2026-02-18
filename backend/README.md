# Backend (Supabase Integration Test)

This folder contains a Node.js script (`test.mjs`) that runs a full integration scenario against Supabase.

## Goal

Validate the main backend business flow:

1. Owner login
2. Property creation
3. Tenant login + rental application creation
4. Application acceptance (RPC `accept_application`)
5. Rent schedule generation (RPC `generate_rent_payments`)
6. Incident flow (tenant creates, owner updates)
7. Maintenance flow (tenant creates, owner approves/completes)
8. Document upload to Storage + DB insert
9. Optional payment test: mark one rent payment as paid (RPC `mark_payment_paid`)
10. Owner dashboard read (RPC `get_owner_dashboard`)

## Prerequisites

- Node.js 18+ (recommended)
- A Supabase project configured with:
  - the tables used in `test.mjs`
  - these RPC functions:
    - `accept_application`
    - `generate_rent_payments`
    - `mark_payment_paid`
    - `get_owner_dashboard`
  - a private Storage bucket named `documents`
  - RLS policies compatible with this scenario (DB + Storage)
- Two existing users:
  - one owner
  - one tenant

## Installation

From the repository root:

```bash
cd backend
npm install
```

## Configuration

Create `backend/.env`:

```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...

OWNER_EMAIL=owner@imovia.test
OWNER_PASS=...

TENANT_EMAIL=tenant@imovia.test
TENANT_PASS=...
```

The script explicitly loads `backend/.env`, so both commands work:

- from repository root: `node backend/test.mjs`
- from `backend`: `node test.mjs`

## Security

- Never commit `backend/.env` (it should stay ignored by `.gitignore`).
- Provide and maintain `backend/.env.example` with no secrets.

## Storage (Documents)

Bucket: `documents` (private)

Path convention:

- `leases/{leaseId}/{uuid}-{filename}`

Download:

- via signed URLs (`createSignedUrl`)

## Front Handoff (API Contract)

Write operations (prefer RPCs):

- `accept_application`
- `generate_rent_payments`
- `mark_payment_paid`
- `get_owner_dashboard`

Read operations (through RLS):

- `properties`
- `leases`
- `rent_payments`
- `incidents`
- `maintenance_requests`
- `documents`

## Important Files

- `backend/test.mjs`: integration test scenario
- `backend/sample.txt`: local file uploaded to the `documents` bucket
- `backend/package.json`: Node dependencies (`@supabase/supabase-js`, `dotenv`)
- `backend/.env.example`: environment variable template

## Run

From repository root:

```bash
node backend/test.mjs
```

Or from `backend`:

```bash
node test.mjs
```

## Expected Output

On success, the script ends with:

`TEST COMPLET REUSSI (documents inclus)`

and prints the owner dashboard payload.

## Notes (Test Environment)

- Each run creates new records (properties, applications, incidents, etc.).
- Each run uploads a new file to Storage.
- No automatic cleanup is performed.

Use a dev/staging Supabase project, not production.

## Quick Troubleshooting

- `Missing SUPABASE_URL or SUPABASE_ANON_KEY`:
  check `backend/.env`.
- RLS error on `documents`:
  check DB + Storage policies and tenant/lease membership rules.
- RPC error:
  check that SQL functions exist and are executable for the connected role.
