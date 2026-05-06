# Security Audit Results — Imovia

**Date:** 2026-05-06  
**Files scanned:** 217  
**Total findings:** 75

## Summary

| Severity | Count |
|----------|-------|
| CRITIQUE | 7 |
| HAUTE | 30 |
| MOYENNE | 14 |
| BASSE | 24 |
| INFO | 0 |

## Detailed Findings


### CRITIQUE

#### VULN-003 — Hardcoded secret/password detected

- **File:** `supabase/config.toml:95`
- **Category:** A02:2021 Sensitive Data Exposure
- **Description:** Potential secret found in source code: openai_api_key = "env(OPENAI_API_KEY)"...
- **Exploit:** An attacker with repo access can extract credentials and gain unauthorized access.
- **Fix:** Move secrets to environment variables. Use a secrets manager (Vault, 1Password).

#### VULN-004 — Hardcoded secret/password detected

- **File:** `supabase/config.toml:277`
- **Category:** A02:2021 Sensitive Data Exposure
- **Description:** Potential secret found in source code: auth_token = "env(SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN)"...
- **Exploit:** An attacker with repo access can extract credentials and gain unauthorized access.
- **Fix:** Move secrets to environment variables. Use a secrets manager (Vault, 1Password).

#### VULN-005 — Hardcoded secret/password detected

- **File:** `supabase/config.toml:309`
- **Category:** A02:2021 Sensitive Data Exposure
- **Description:** Potential secret found in source code: secret = "env(SUPABASE_AUTH_EXTERNAL_APPLE_SECRET)"...
- **Exploit:** An attacker with repo access can extract credentials and gain unauthorized access.
- **Fix:** Move secrets to environment variables. Use a secrets manager (Vault, 1Password).

#### VULN-008 — RLS policy with CHECK (true) — unrestricted write

- **File:** `supabase/migrations/20260222125000_notifications_sender_fix.sql:23`
- **Category:** A01:2021 Broken Access Control
- **Description:** RLS policy allows any authenticated user to write without restriction.
- **Exploit:** Any user can insert/update records for any other user.
- **Fix:** Replace WITH CHECK (true) with proper user-scoped check: WITH CHECK (auth.uid() = user_id).

#### VULN-009 — RLS policy with CHECK (true) — unrestricted write

- **File:** `supabase/migrations/20260222121500_notifications_init.sql:40`
- **Category:** A01:2021 Broken Access Control
- **Description:** RLS policy allows any authenticated user to write without restriction.
- **Exploit:** Any user can insert/update records for any other user.
- **Fix:** Replace WITH CHECK (true) with proper user-scoped check: WITH CHECK (auth.uid() = user_id).

#### VULN-015 — Missing Content-Security-Policy header

- **File:** `frontend/site/next.config.ts:1`
- **Category:** A05:2021 Security Misconfiguration
- **Description:** No CSP header configured in Next.js config.
- **Exploit:** Enables XSS attacks, data exfiltration, and clickjacking.
- **Fix:** Add CSP header via next.config headers() function.

#### VULN-064 — Role from user input without server-side whitelist

- **File:** `frontend/site/src/app/auth/actions.ts:42`
- **Category:** A07:2021 Authentication Failures
- **Description:** User-provided role is accepted without validation against an allowed list.
- **Exploit:** An attacker can set role=admin via curl to escalate privileges.
- **Fix:** Validate role against a whitelist: ['tenant', 'owner', 'agency'].


### HAUTE

#### VULN-006 — GitHub Action not pinned by SHA

- **File:** `.github/workflows/backend-contract.yml:27`
- **Category:** A08:2021 Software Integrity Failures
- **Description:** Action uses mutable tag instead of SHA: uses: actions/checkout@v4
- **Exploit:** Compromised upstream action could inject malicious code into CI pipeline.
- **Fix:** Pin action to a specific commit SHA: uses: actions/checkout@<sha>

#### VULN-007 — GitHub Action not pinned by SHA

- **File:** `.github/workflows/backend-contract.yml:30`
- **Category:** A08:2021 Software Integrity Failures
- **Description:** Action uses mutable tag instead of SHA: uses: actions/setup-node@v4
- **Exploit:** Compromised upstream action could inject malicious code into CI pipeline.
- **Fix:** Pin action to a specific commit SHA: uses: actions/checkout@<sha>

#### VULN-010 — SECURITY DEFINER function without auth.uid() check: public.get_profile_by_email(p_email

- **File:** `supabase/migrations/20260222115000_search_profile_rpc.sql:4`
- **Category:** A01:2021 Broken Access Control
- **Description:** Function public.get_profile_by_email(p_email runs with elevated privileges but doesn't verify the caller's identity.
- **Exploit:** Any authenticated user can invoke this function regardless of their role/relationship.
- **Fix:** Add auth.uid() verification at the start of the function body.

#### VULN-011 — SECURITY DEFINER function without auth.uid() check: public.get_all_tenants()

- **File:** `supabase/migrations/20260222115000_search_profile_rpc.sql:30`
- **Category:** A01:2021 Broken Access Control
- **Description:** Function public.get_all_tenants() runs with elevated privileges but doesn't verify the caller's identity.
- **Exploit:** Any authenticated user can invoke this function regardless of their role/relationship.
- **Fix:** Add auth.uid() verification at the start of the function body.

#### VULN-012 — SECURITY DEFINER without search_path

- **File:** `supabase/migrations/20260218113647_remote_schema.sql:426`
- **Category:** A01:2021 Broken Access Control
- **Description:** A SECURITY DEFINER function without explicit search_path is vulnerable to search_path hijacking.
- **Exploit:** An attacker can create malicious objects in a schema that precedes 'public' in the search_path.
- **Fix:** Add 'SET search_path = public, pg_catalog' to the function definition.

#### VULN-013 — SECURITY DEFINER without search_path

- **File:** `supabase/migrations/20260218113647_remote_schema.sql:616`
- **Category:** A01:2021 Broken Access Control
- **Description:** A SECURITY DEFINER function without explicit search_path is vulnerable to search_path hijacking.
- **Exploit:** An attacker can create malicious objects in a schema that precedes 'public' in the search_path.
- **Fix:** Add 'SET search_path = public, pg_catalog' to the function definition.

#### VULN-014 — SECURITY DEFINER without search_path

- **File:** `supabase/migrations/20260218113647_remote_schema.sql:659`
- **Category:** A01:2021 Broken Access Control
- **Description:** A SECURITY DEFINER function without explicit search_path is vulnerable to search_path hijacking.
- **Exploit:** An attacker can create malicious objects in a schema that precedes 'public' in the search_path.
- **Fix:** Add 'SET search_path = public, pg_catalog' to the function definition.

#### VULN-017 — Potential IDOR: delete/update without ownership check

- **File:** `frontend/application/app/register-owner.tsx:95`
- **Category:** A01:2021 Broken Access Control
- **Description:** Database operation filtered only by resource ID without user ownership verification.
- **Exploit:** An attacker can modify the ID parameter to access/modify other users' resources.
- **Fix:** Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query.

#### VULN-018 — Potential IDOR: delete/update without ownership check

- **File:** `frontend/application/app/register-agency.tsx:98`
- **Category:** A01:2021 Broken Access Control
- **Description:** Database operation filtered only by resource ID without user ownership verification.
- **Exploit:** An attacker can modify the ID parameter to access/modify other users' resources.
- **Fix:** Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query.

#### VULN-019 — Potential IDOR: delete/update without ownership check

- **File:** `frontend/application/lib/supabase/owner-actions.ts:215`
- **Category:** A01:2021 Broken Access Control
- **Description:** Database operation filtered only by resource ID without user ownership verification.
- **Exploit:** An attacker can modify the ID parameter to access/modify other users' resources.
- **Fix:** Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query.

#### VULN-022 — Potential IDOR: delete/update without ownership check

- **File:** `frontend/application/components/biens/AjouterBienModal.tsx:232`
- **Category:** A01:2021 Broken Access Control
- **Description:** Database operation filtered only by resource ID without user ownership verification.
- **Exploit:** An attacker can modify the ID parameter to access/modify other users' resources.
- **Fix:** Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query.

#### VULN-025 — Potential IDOR: delete/update without ownership check

- **File:** `frontend/application/components/documents/DocumentRow.tsx:67`
- **Category:** A01:2021 Broken Access Control
- **Description:** Database operation filtered only by resource ID without user ownership verification.
- **Exploit:** An attacker can modify the ID parameter to access/modify other users' resources.
- **Fix:** Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query.

#### VULN-027 — Potential IDOR: delete/update without ownership check

- **File:** `frontend/application/components/incidents/IncidentCard.tsx:38`
- **Category:** A01:2021 Broken Access Control
- **Description:** Database operation filtered only by resource ID without user ownership verification.
- **Exploit:** An attacker can modify the ID parameter to access/modify other users' resources.
- **Fix:** Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query.

#### VULN-028 — Potential IDOR: delete/update without ownership check

- **File:** `frontend/application/app/(tabs)/profile.tsx:154`
- **Category:** A01:2021 Broken Access Control
- **Description:** Database operation filtered only by resource ID without user ownership verification.
- **Exploit:** An attacker can modify the ID parameter to access/modify other users' resources.
- **Fix:** Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query.

#### VULN-029 — Potential IDOR: delete/update without ownership check

- **File:** `frontend/application/app/bien/[id].tsx:119`
- **Category:** A01:2021 Broken Access Control
- **Description:** Database operation filtered only by resource ID without user ownership verification.
- **Exploit:** An attacker can modify the ID parameter to access/modify other users' resources.
- **Fix:** Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query.

#### VULN-030 — Potential IDOR: delete/update without ownership check

- **File:** `frontend/site/src/contexts/user-context.tsx:51`
- **Category:** A01:2021 Broken Access Control
- **Description:** Database operation filtered only by resource ID without user ownership verification.
- **Exploit:** An attacker can modify the ID parameter to access/modify other users' resources.
- **Fix:** Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query.

#### VULN-031 — Potential IDOR: delete/update without ownership check

- **File:** `frontend/site/src/lib/supabase/tenant-onboarding-utils.ts:126`
- **Category:** A01:2021 Broken Access Control
- **Description:** Database operation filtered only by resource ID without user ownership verification.
- **Exploit:** An attacker can modify the ID parameter to access/modify other users' resources.
- **Fix:** Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query.

#### VULN-032 — Potential IDOR: delete/update without ownership check

- **File:** `frontend/site/src/lib/supabase/tenant-onboarding-utils.ts:165`
- **Category:** A01:2021 Broken Access Control
- **Description:** Database operation filtered only by resource ID without user ownership verification.
- **Exploit:** An attacker can modify the ID parameter to access/modify other users' resources.
- **Fix:** Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query.

#### VULN-033 — Potential IDOR: delete/update without ownership check

- **File:** `frontend/site/src/lib/supabase/tenant-onboarding-utils.ts:175`
- **Category:** A01:2021 Broken Access Control
- **Description:** Database operation filtered only by resource ID without user ownership verification.
- **Exploit:** An attacker can modify the ID parameter to access/modify other users' resources.
- **Fix:** Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query.

#### VULN-038 — Potential IDOR: delete/update without ownership check

- **File:** `frontend/site/src/lib/supabase/notification-utils.ts:82`
- **Category:** A01:2021 Broken Access Control
- **Description:** Database operation filtered only by resource ID without user ownership verification.
- **Exploit:** An attacker can modify the ID parameter to access/modify other users' resources.
- **Fix:** Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query.

#### VULN-041 — File upload without MIME type validation

- **File:** `frontend/site/src/components/dashboard/profile/personal-info-form.tsx:100`
- **Category:** A04:2021 Insecure Design
- **Description:** File upload does not validate MIME type server-side.
- **Exploit:** Attacker can upload HTML/SVG/JS files for stored XSS.
- **Fix:** Validate file.type against an allowlist of safe MIME types.

#### VULN-048 — Potential IDOR: delete/update without ownership check

- **File:** `frontend/site/src/components/dashboard/owner/properties/properties-client.tsx:52`
- **Category:** A01:2021 Broken Access Control
- **Description:** Database operation filtered only by resource ID without user ownership verification.
- **Exploit:** An attacker can modify the ID parameter to access/modify other users' resources.
- **Fix:** Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query.

#### VULN-049 — File upload without MIME type validation

- **File:** `frontend/site/src/components/dashboard/owner/properties/property-form.tsx:153`
- **Category:** A04:2021 Insecure Design
- **Description:** File upload does not validate MIME type server-side.
- **Exploit:** Attacker can upload HTML/SVG/JS files for stored XSS.
- **Fix:** Validate file.type against an allowlist of safe MIME types.

#### VULN-052 — File upload without MIME type validation

- **File:** `frontend/site/src/components/dashboard/owner/documents/add-document-dialog.tsx:135`
- **Category:** A04:2021 Insecure Design
- **Description:** File upload does not validate MIME type server-side.
- **Exploit:** Attacker can upload HTML/SVG/JS files for stored XSS.
- **Fix:** Validate file.type against an allowlist of safe MIME types.

#### VULN-057 — Potential IDOR: delete/update without ownership check

- **File:** `frontend/site/src/components/dashboard/owner/documents/document-card.tsx:94`
- **Category:** A01:2021 Broken Access Control
- **Description:** Database operation filtered only by resource ID without user ownership verification.
- **Exploit:** An attacker can modify the ID parameter to access/modify other users' resources.
- **Fix:** Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query.

#### VULN-063 — Potential IDOR: delete/update without ownership check

- **File:** `frontend/site/src/app/auth/actions.ts:66`
- **Category:** A01:2021 Broken Access Control
- **Description:** Database operation filtered only by resource ID without user ownership verification.
- **Exploit:** An attacker can modify the ID parameter to access/modify other users' resources.
- **Fix:** Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query.

#### VULN-065 — Auth endpoint without rate limiting

- **File:** `frontend/site/src/app/auth/actions.ts:1`
- **Category:** A07:2021 Authentication Failures
- **Description:** Authentication endpoints lack rate limiting, enabling brute-force attacks.
- **Exploit:** Attacker can try thousands of passwords per minute.
- **Fix:** Implement rate limiting with @upstash/ratelimit or similar.

#### VULN-070 — Potential IDOR: delete/update without ownership check

- **File:** `frontend/site/src/app/dashboard/owner/incidents/page.tsx:67`
- **Category:** A01:2021 Broken Access Control
- **Description:** Database operation filtered only by resource ID without user ownership verification.
- **Exploit:** An attacker can modify the ID parameter to access/modify other users' resources.
- **Fix:** Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query.

#### VULN-071 — Dynamic route without ownership verification: frontend/site/src/app/dashboard/owner/properties/[id]/edit/page.tsx

- **File:** `frontend/site/src/app/dashboard/owner/properties/[id]/edit/page.tsx:1`
- **Category:** A01:2021 Broken Access Control
- **Description:** Dynamic route parameter [id] is used without verifying resource ownership.
- **Exploit:** An attacker can enumerate IDs to access other users' resources.
- **Fix:** Verify that the authenticated user owns the resource before rendering/returning data.

#### VULN-075 — Open redirect via unvalidated 'next' parameter

- **File:** `frontend/site/src/app/auth/callback/route.ts:8`
- **Category:** A01:2021 Broken Access Control
- **Description:** Redirect target read from query parameter without validation.
- **Exploit:** Attacker crafts URL: /callback?next=//evil.com for phishing.
- **Fix:** Validate that 'next' starts with '/' and not '//'.


### MOYENNE

#### VULN-001 — Weak password in bcrypt hash

- **File:** `supabase/seed.sql:73`
- **Category:** A02:2021 Cryptographic Failures
- **Description:** Short/weak password being hashed: crypt('test', gen_salt('bf')),
- **Exploit:** Weak passwords are trivially crackable even with bcrypt.
- **Fix:** Use strong passwords (12+ chars) or generate random passwords for seed data.

#### VULN-002 — Weak password in bcrypt hash

- **File:** `supabase/seed.sql:141`
- **Category:** A02:2021 Cryptographic Failures
- **Description:** Short/weak password being hashed: crypt('test', gen_salt('bf')),
- **Exploit:** Weak passwords are trivially crackable even with bcrypt.
- **Fix:** Use strong passwords (12+ chars) or generate random passwords for seed data.

#### VULN-016 — X-Powered-By header not disabled

- **File:** `frontend/site/next.config.ts:1`
- **Category:** A05:2021 Security Misconfiguration
- **Description:** Next.js exposes 'X-Powered-By: Next.js' header by default.
- **Exploit:** Reveals technology stack, enabling targeted attacks.
- **Fix:** Set poweredByHeader: false in next.config.

#### VULN-023 — File upload without size limit

- **File:** `frontend/application/components/biens/AjouterBienModal.tsx:278`
- **Category:** A04:2021 Insecure Design
- **Description:** No file size validation before upload.
- **Exploit:** Attacker can upload very large files causing storage exhaustion.
- **Fix:** Check file.size < MAX_FILE_SIZE before uploading.

#### VULN-024 — Predictable file name using Math.random()

- **File:** `frontend/application/components/biens/AjouterBienModal.tsx:266`
- **Category:** A02:2021 Cryptographic Failures
- **Description:** File names generated with Math.random() are predictable.
- **Exploit:** Attacker can guess file paths and access uploaded content.
- **Fix:** Use crypto.randomUUID() for unpredictable file names.

#### VULN-026 — File upload without size limit

- **File:** `frontend/application/components/documents/AjouterDocumentModal.tsx:256`
- **Category:** A04:2021 Insecure Design
- **Description:** No file size validation before upload.
- **Exploit:** Attacker can upload very large files causing storage exhaustion.
- **Fix:** Check file.size < MAX_FILE_SIZE before uploading.

#### VULN-042 — File upload without size limit

- **File:** `frontend/site/src/components/dashboard/profile/personal-info-form.tsx:100`
- **Category:** A04:2021 Insecure Design
- **Description:** No file size validation before upload.
- **Exploit:** Attacker can upload very large files causing storage exhaustion.
- **Fix:** Check file.size < MAX_FILE_SIZE before uploading.

#### VULN-043 — Predictable file name using Math.random()

- **File:** `frontend/site/src/components/dashboard/profile/personal-info-form.tsx:96`
- **Category:** A02:2021 Cryptographic Failures
- **Description:** File names generated with Math.random() are predictable.
- **Exploit:** Attacker can guess file paths and access uploaded content.
- **Fix:** Use crypto.randomUUID() for unpredictable file names.

#### VULN-050 — File upload without size limit

- **File:** `frontend/site/src/components/dashboard/owner/properties/property-form.tsx:153`
- **Category:** A04:2021 Insecure Design
- **Description:** No file size validation before upload.
- **Exploit:** Attacker can upload very large files causing storage exhaustion.
- **Fix:** Check file.size < MAX_FILE_SIZE before uploading.

#### VULN-051 — Predictable file name using Math.random()

- **File:** `frontend/site/src/components/dashboard/owner/properties/property-form.tsx:146`
- **Category:** A02:2021 Cryptographic Failures
- **Description:** File names generated with Math.random() are predictable.
- **Exploit:** Attacker can guess file paths and access uploaded content.
- **Fix:** Use crypto.randomUUID() for unpredictable file names.

#### VULN-053 — File upload without size limit

- **File:** `frontend/site/src/components/dashboard/owner/documents/add-document-dialog.tsx:135`
- **Category:** A04:2021 Insecure Design
- **Description:** No file size validation before upload.
- **Exploit:** Attacker can upload very large files causing storage exhaustion.
- **Fix:** Check file.size < MAX_FILE_SIZE before uploading.

#### VULN-054 — Predictable file name using Math.random()

- **File:** `frontend/site/src/components/dashboard/owner/documents/add-document-dialog.tsx:130`
- **Category:** A02:2021 Cryptographic Failures
- **Description:** File names generated with Math.random() are predictable.
- **Exploit:** Attacker can guess file paths and access uploaded content.
- **Fix:** Use crypto.randomUUID() for unpredictable file names.

#### VULN-066 — Origin header used from client request (spoofable)

- **File:** `frontend/site/src/app/auth/actions.ts:33`
- **Category:** A05:2021 Security Misconfiguration
- **Description:** The Origin header is controlled by the client and should not be trusted for redirects.
- **Exploit:** Attacker manipulates Origin header to redirect email confirmation links.
- **Fix:** Use a server-side environment variable (NEXT_PUBLIC_SITE_URL) instead.

#### VULN-074 — Dynamic href with user data (potential XSS)

- **File:** `frontend/site/src/app/dashboard/tenant/search/[id]/page.tsx:143`
- **Category:** A03:2021 Injection (XSS)
- **Description:** Dynamic href attribute with user-controlled data: href={user?.id === property.owner_id ? "/dashboard/owner/properties" : "/dashboa
- **Exploit:** An attacker could inject javascript: protocol URLs.
- **Fix:** Validate that href starts with '/' or 'https://' before rendering.


### BASSE

#### VULN-020 — Raw error message exposed to user

- **File:** `frontend/application/lib/supabase/owner-actions.ts:37`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.

#### VULN-021 — Raw error message exposed to user

- **File:** `frontend/application/lib/supabase/owner-actions.ts:127`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.

#### VULN-034 — Raw error message exposed to user

- **File:** `frontend/site/src/lib/supabase/tenant-onboarding-utils.ts:33`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.

#### VULN-035 — Empty catch block (silent error swallowing)

- **File:** `frontend/site/src/lib/supabase/tenant-onboarding-utils.ts:150`
- **Category:** A09:2021 Security Logging Failures
- **Description:** Errors are silently swallowed without logging.
- **Exploit:** Security events and attack attempts go undetected.
- **Fix:** Log errors to a monitoring service (Sentry, console.error at minimum).

#### VULN-036 — Empty catch block (silent error swallowing)

- **File:** `frontend/site/src/lib/supabase/tenant-onboarding-utils.ts:203`
- **Category:** A09:2021 Security Logging Failures
- **Description:** Errors are silently swallowed without logging.
- **Exploit:** Security events and attack attempts go undetected.
- **Fix:** Log errors to a monitoring service (Sentry, console.error at minimum).

#### VULN-037 — Raw error message exposed to user

- **File:** `frontend/site/src/lib/supabase/tenant-onboarding-utils.ts:257`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.

#### VULN-039 — Raw error message exposed to user

- **File:** `frontend/site/src/lib/supabase/notification-utils.ts:43`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.

#### VULN-040 — Raw error message exposed to user

- **File:** `frontend/site/src/components/dashboard/profile/security-form.tsx:58`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.

#### VULN-044 — Raw error message exposed to user

- **File:** `frontend/site/src/components/dashboard/profile/personal-info-form.tsx:112`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.

#### VULN-045 — Raw error message exposed to user

- **File:** `frontend/site/src/components/dashboard/owner/rentals/add-tenant-dialog.tsx:110`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.

#### VULN-046 — Raw error message exposed to user

- **File:** `frontend/site/src/components/dashboard/owner/rentals/rental-card.tsx:131`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.

#### VULN-047 — Raw error message exposed to user

- **File:** `frontend/site/src/components/dashboard/owner/rentals/rental-card.tsx:150`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.

#### VULN-055 — Empty catch block (silent error swallowing)

- **File:** `frontend/site/src/components/dashboard/owner/documents/add-document-dialog.tsx:85`
- **Category:** A09:2021 Security Logging Failures
- **Description:** Errors are silently swallowed without logging.
- **Exploit:** Security events and attack attempts go undetected.
- **Fix:** Log errors to a monitoring service (Sentry, console.error at minimum).

#### VULN-056 — Raw error message exposed to user

- **File:** `frontend/site/src/components/dashboard/owner/documents/add-document-dialog.tsx:167`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.

#### VULN-058 — Raw error message exposed to user

- **File:** `frontend/site/src/components/dashboard/owner/documents/document-card.tsx:39`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.

#### VULN-059 — Raw error message exposed to user

- **File:** `frontend/site/src/components/dashboard/owner/documents/document-card.tsx:66`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.

#### VULN-060 — Raw error message exposed to user

- **File:** `frontend/site/src/components/dashboard/owner/documents/document-card.tsx:108`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.

#### VULN-061 — Raw error message exposed to user

- **File:** `frontend/site/src/components/dashboard/tenant/documents/document-list.tsx:45`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.

#### VULN-062 — Raw error message exposed to user

- **File:** `frontend/site/src/components/dashboard/tenant/documents/document-list.tsx:72`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.

#### VULN-067 — Empty catch block (silent error swallowing)

- **File:** `frontend/site/src/app/auth/actions.ts:34`
- **Category:** A09:2021 Security Logging Failures
- **Description:** Errors are silently swallowed without logging.
- **Exploit:** Security events and attack attempts go undetected.
- **Fix:** Log errors to a monitoring service (Sentry, console.error at minimum).

#### VULN-068 — Empty catch block (silent error swallowing)

- **File:** `frontend/site/src/app/dashboard/owner/documents/page.tsx:78`
- **Category:** A09:2021 Security Logging Failures
- **Description:** Errors are silently swallowed without logging.
- **Exploit:** Security events and attack attempts go undetected.
- **Fix:** Log errors to a monitoring service (Sentry, console.error at minimum).

#### VULN-069 — Raw error message exposed to user

- **File:** `frontend/site/src/app/dashboard/owner/documents/page.tsx:98`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.

#### VULN-072 — Empty catch block (silent error swallowing)

- **File:** `frontend/site/src/app/dashboard/tenant/documents/page.tsx:109`
- **Category:** A09:2021 Security Logging Failures
- **Description:** Errors are silently swallowed without logging.
- **Exploit:** Security events and attack attempts go undetected.
- **Fix:** Log errors to a monitoring service (Sentry, console.error at minimum).

#### VULN-073 — Raw error message exposed to user

- **File:** `frontend/site/src/app/dashboard/tenant/documents/page.tsx:129`
- **Category:** A04:2021 Insecure Design
- **Description:** Database/API error messages are displayed directly to the user.
- **Exploit:** Error messages may reveal table names, column names, or constraints.
- **Fix:** Use generic error messages for the UI, log details server-side.
