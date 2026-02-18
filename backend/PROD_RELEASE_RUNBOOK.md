# Backend Production Release Runbook

This runbook defines the safe process to release Supabase backend changes to a production-like environment.

## Scope

- SQL migrations in `supabase/migrations/`
- backend contract documentation updates
- validation of frontend-facing business flows

## Preconditions

- Branch is up to date with target branch.
- PR is approved.
- `npx supabase migration list` is aligned for local and remote.
- `node backend/test.mjs` succeeds in a staging environment.

## 1) Pre-Release Backup

From repository root, create a schema backup before applying migrations:

```bash
npx supabase db dump --linked --schema public --file supabase/backups/<timestamp>_pre_release_public.sql
```

Recommended:
- Store backup artifact in secure storage (not in public repository).
- Record migration version and deployment ticket in release notes.

## 2) Apply Migrations

From repository root:

```bash
npx supabase migration list
npx supabase db push
npx supabase migration list
```

Expected result:
- New migration version appears in both Local and Remote columns.

## 3) Post-Deploy Verification

Run smoke checks:

```bash
node backend/test.mjs
```

Minimum checks:
- owner can accept application
- rent payments are generated
- payment can be marked as paid
- incident and maintenance flows work
- documents upload/read works with signed URLs
- owner dashboard returns data

## 4) Rollback Strategy

Supabase migrations are forward-only by default. Rollback is operational, not automatic.

Use one of these strategies:

1. Emergency hotfix migration
- Create a new migration that reverts the faulty change safely.
- Apply with `npx supabase db push`.

2. Restore from backup
- Restore database from the pre-release backup or point-in-time recovery according to your Supabase plan.

3. Feature kill switch
- Disable affected frontend paths while backend fix is being prepared.

## 5) Incident Response Checklist

- Freeze new backend deployments.
- Identify first failing migration/version.
- Communicate impact to frontend and product owners.
- Apply hotfix migration or restore backup.
- Re-run smoke tests.
- Publish postmortem with root cause and prevention actions.

## 6) Change Management Rules

- Never edit old applied migrations.
- Add new migration files only.
- Keep contract docs updated:
- `backend/BACKEND_CONTRACT.md`
- `backend/README.md`

## 7) Release Sign-Off

Release is complete only when all are true:

- Migration history aligned.
- Smoke tests passed.
- Frontend contract unchanged or versioned.
- Rollback path documented for this release.
