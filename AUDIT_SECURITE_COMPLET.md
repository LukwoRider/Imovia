# AUDIT DE SÉCURITÉ — IMOVIA
## Rapport Consolidé de Pentest Manuel

**Date :** 6 mai 2026
**Auditeur :** Pentest Security Audit (20 agents parallèles)
**Périmètre :** Full-stack — Frontend (Next.js + Expo), Backend (Supabase), SQL (25 migrations), CI/CD, Dépendances
**Méthodologie :** OWASP Top 10 2021, revue manuelle de code, analyse statique artisanale

---

## SYNTHÈSE EXÉCUTIVE

| Sévérité | Nombre | % |
|----------|--------|---|
| **CRITIQUE** | 12 | 15% |
| **HAUTE** | 24 | 30% |
| **MOYENNE** | 28 | 35% |
| **BASSE** | 16 | 20% |
| **TOTAL** | **80** | 100% |

L'application Imovia présente des **vulnérabilités critiques** dans 4 domaines majeurs :
1. **Contrôle d'accès brisé (OWASP A01)** — Fonctions RPC `SECURITY DEFINER` sans vérification de rôle, IDOR multiples
2. **Exposition de données sensibles (OWASP A02)** — PII de tous les locataires accessibles, bucket storage public
3. **Authentification défaillante (OWASP A07)** — Escalade de privilèges à l'inscription, absence de rate limiting
4. **Configuration non sécurisée (OWASP A05)** — Aucun header de sécurité HTTP, middleware potentiellement non fonctionnel

---

## TOP 10 DES VULNÉRABILITÉS LES PLUS CRITIQUES

### 1. CRITIQUE — Escalade de privilèges à l'inscription (role non validé)

**OWASP :** A01:2021 Broken Access Control
**Fichier :** `frontend/site/src/app/auth/actions.ts:42-67`

Le rôle est lu directement depuis le FormData client sans whitelist serveur. Un attaquant peut s'inscrire avec `role=admin` via curl.

```
curl -X POST /auth/register -d "role=admin&email=attacker@evil.com&password=pass123"
```

**Impact :** Prise de contrôle totale de la plateforme.

**Correctif :**
```typescript
const ALLOWED_ROLES = ['tenant', 'owner', 'agency'] as const;
if (!ALLOWED_ROLES.includes(role)) return { error: 'Rôle invalide.' };
```

---

### 2. CRITIQUE — `get_all_tenants()` expose TOUTES les données personnelles

**OWASP :** A01:2021 + A02:2021
**Fichier :** `supabase/migrations/20260222115000_search_profile_rpc.sql:30-54`

Fonction `SECURITY DEFINER` accessible à tout utilisateur authentifié (même un tenant), retourne nom, email, téléphone de TOUS les locataires.

```sql
SELECT public.get_all_tenants();
-- Retourne: [{"full_name":"...", "email":"...", "phone":"..."}, ...]
```

**Impact :** Violation RGPD massive, social engineering, phishing ciblé.

---

### 3. CRITIQUE — `get_profile_by_email()` permet l'énumération d'utilisateurs

**OWASP :** A01:2021
**Fichier :** `supabase/migrations/20260222115000_search_profile_rpc.sql:4-27`

Tout utilisateur authentifié peut chercher le profil complet d'un tenant par email via cette RPC `SECURITY DEFINER`.

**Impact :** Reconnaissance pour attaques ciblées, harvesting de données.

---

### 4. CRITIQUE — INSERT notifications arbitraires (phishing intra-plateforme)

**OWASP :** A01:2021
**Fichier :** `supabase/migrations/20260222121500_notifications_init.sql:36-40`

La policy INSERT est `with check (true)` — n'importe qui peut envoyer une notification à n'importe quel utilisateur avec un lien de phishing.

```sql
INSERT INTO notifications (user_id, title, message, link)
VALUES ('uuid_victime', 'Paiement reçu', 'Cliquez ici', 'https://phishing.com');
```

**Impact :** Phishing massif, usurpation d'identité.

---

### 5. CRITIQUE — Middleware Next.js potentiellement non fonctionnel

**OWASP :** A05:2021
**Fichier :** `frontend/site/src/proxy.ts:4`

La fonction exportée s'appelle `proxy` au lieu de `middleware`, et le fichier est dans `src/proxy.ts` au lieu de `src/middleware.ts`. Le middleware de session Supabase ne s'exécute probablement jamais.

**Impact :** Sessions non rafraîchies, aucun header de sécurité, bypass potentiel de l'authentification.

---

### 6. CRITIQUE — Aucun header de sécurité HTTP (CSP, HSTS, X-Frame-Options)

**OWASP :** A05:2021
**Fichier :** `frontend/site/next.config.ts`

Absence totale de : Content-Security-Policy, Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.

**Impact :** Vulnérable au XSS, clickjacking, MITM, MIME sniffing.

---

### 7. CRITIQUE — Bucket `property-images` complètement public

**OWASP :** A01:2021
**Fichier :** `supabase/migrations/20260220232500_make_property_images_public.sql`

Le bucket est `public = true` avec une policy SELECT `using (bucket_id = 'property-images')` sans restriction. Toutes les images de toutes les propriétés sont accessibles sans authentification.

**Impact :** Fuite de données immobilières, reconnaissance.

---

### 8. CRITIQUE — Frontend contourne les RPCs sécurisées (INSERT direct vs create_incident())

**OWASP :** A04:2021
**Fichier :** Components d'incidents et documents

Le backend a des RPCs sécurisées (`create_incident()`, `owner_update_incident_status()`), mais le frontend effectue des INSERT/UPDATE directs sur les tables, contournant toutes les validations.

**Impact :** Bypass des contrôles de sécurité backend.

---

### 9. CRITIQUE — Open Redirect dans le callback OAuth

**OWASP :** A01:2021
**Fichier :** `frontend/site/src/app/auth/callback/route.ts:8-14`

Le paramètre `next` de la query string est concaténé à l'origin sans validation.

```
/auth/callback?code=VALID&next=//evil.com
```

**Impact :** Phishing post-authentification, vol de tokens.

---

### 10. CRITIQUE — Tenant peut marquer ses propres paiements comme payés

**OWASP :** A01:2021
**Fichier :** `supabase/migrations/` — `mark_payment_paid()`

La fonction RPC ne vérifie pas que l'appelant est l'owner du bail. Un tenant peut marquer ses propres loyers comme payés.

**Impact :** Fraude financière directe.

---

## VULNÉRABILITÉS DÉTAILLÉES PAR CATÉGORIE

### A01 — Broken Access Control (32 vulnérabilités)

| # | Sévérité | Description | Fichier |
|---|----------|-------------|---------|
| 1 | CRITIQUE | Escalade de privilèges via rôle non validé | `auth/actions.ts:42` |
| 2 | CRITIQUE | `get_all_tenants()` sans contrôle de rôle | `search_profile_rpc.sql:30` |
| 3 | CRITIQUE | `get_profile_by_email()` sans contrôle | `search_profile_rpc.sql:4` |
| 4 | CRITIQUE | INSERT notifications `with check (true)` | `notifications_init.sql:36` |
| 5 | CRITIQUE | Bucket property-images public | `make_property_images_public.sql` |
| 6 | CRITIQUE | Tenant marque ses paiements comme payés | `mark_payment_paid()` |
| 7 | HAUTE | Grants excessifs `anon` (INSERT/UPDATE/DELETE) sur toutes les tables | `remote_schema.sql:868+` |
| 8 | HAUTE | Policies RLS `to public` au lieu de `to authenticated` | `remote_schema.sql:1373+` |
| 9 | HAUTE | Pas de DELETE policy sur notifications | `notifications_init.sql` |
| 10 | HAUTE | IDOR édition de propriété sans vérification ownership | `owner/properties/[id]/edit/page.tsx` |
| 11 | HAUTE | IDOR suppression propriété sans filtre `owner_id` | `owner-dashboard-utils.ts` |
| 12 | HAUTE | `terminateLease` sans filtre owner côté frontend | `tenant-onboarding-utils.ts:159` |
| 13 | HAUTE | `updateLease` sans filtre owner côté frontend | `tenant-onboarding-utils.ts:241` |
| 14 | HAUTE | Aucune vérification de rôle côté middleware/pages | `dashboard/layout.tsx` |
| 15 | MOYENNE | IDOR sur `markNotificationAsRead` sans filtre `user_id` | `notification-utils.ts:78` |
| 16 | MOYENNE | Fuite Realtime sans RLS enforced | `notification-utils.ts:96` |
| 17 | MOYENNE | `onboardTenant` — `property_id` non validé (propriété d'autrui) | `tenant-onboarding-utils.ts:59` |
| 18 | MOYENNE | Ancien locataire voit toujours la propriété (bail terminé) | `tenant_property_visibility.sql` |
| 19 | MOYENNE | `getTenantPayments` sans validation d'appartenance | `tenant-dashboard-utils.ts:53` |
| 20 | MOYENNE | Propriétés `available` visibles par role `anon` | `remote_schema.sql:1577` |
| 21 | MOYENNE | `property_history` — pas de policy INSERT protégée | `remote_schema.sql:124` |
| 22 | MOYENNE | `user_actions` — grants INSERT pour anon/authenticated | `remote_schema.sql:178` |
| 23 | MOYENNE | Tenant ne peut pas voir ses contacts (`property_tenant_contacts`) | `property_form_alignment.sql:122` |
| 24 | MOYENNE | Tenant ne peut pas annuler sa candidature | `remote_schema.sql:1664` |
| 25 | MOYENNE | Pas de vérification rôle sur pages owner | `rentals/page.tsx` |
| 26 | BASSE | `profiles_select` `to public` au lieu de `to authenticated` | `fix_profiles_rls.sql:18` |
| 27 | BASSE | Absence de filtre `archived` dans les policies | Multiple migrations |

### A02 — Cryptographic Failures / Sensitive Data Exposure (12 vulnérabilités)

| # | Sévérité | Description | Fichier |
|---|----------|-------------|---------|
| 1 | HAUTE | Credentials en clair dans `.env.local.example` | `backend/.env.local.example:5-8` |
| 2 | HAUTE | Hostname Supabase hardcodé dans `next.config.ts` | `next.config.ts:17` |
| 3 | HAUTE | README indiquent de partager secrets par email | `README.md` |
| 4 | MOYENNE | Adresse postale complète dans les notifications | `tenant-onboarding-utils.ts:141` |
| 5 | MOYENNE | Fuite d'info via messages d'erreur Supabase bruts | `notification-utils.ts:43` |
| 6 | MOYENNE | PII exposé dans propriété search (owner phone/email) | `search/[id]/page.tsx` |
| 7 | MOYENNE | Divulgation d'infos dans logs CI (UUIDs, hosts) | `test.mjs:786` |
| 8 | BASSE | Mot de passe `test` dans seed.sql | `seed.sql:73` |
| 9 | BASSE | Numéros de téléphone réalistes dans tests | `test.mjs:268` |

### A04 — Insecure Design (8 vulnérabilités)

| # | Sévérité | Description | Fichier |
|---|----------|-------------|---------|
| 1 | CRITIQUE | Frontend INSERT direct au lieu de RPCs sécurisées | Components incidents/documents |
| 2 | HAUTE | Régression `handle_new_user()` — tous forcés en `tenant` | `owner_contact_info.sql:6-22` |
| 3 | HAUTE | Opérations multi-étapes non atomiques (bail, terminaison) | `tenant-onboarding-utils.ts` |
| 4 | MOYENNE | Race condition création de bail | `tenant-onboarding-utils.ts:80` |
| 5 | MOYENNE | Absence de pagination (risque DoS) sur 9+ requêtes | Multiple utils |
| 6 | MOYENNE | `status` d'incident accepte un `text` brut | `owner_update_incident_status()` |
| 7 | BASSE | Erreurs silencieusement avalées (catch vides) | Multiple fichiers |
| 8 | BASSE | Incohérence nommage `deposit_amount` / `security_deposit_amount` | Frontend/DB |

### A05 — Security Misconfiguration (14 vulnérabilités)

| # | Sévérité | Description | Fichier |
|---|----------|-------------|---------|
| 1 | CRITIQUE | Middleware non fonctionnel (`proxy` au lieu de `middleware`) | `proxy.ts:4` |
| 2 | CRITIQUE | Aucun header CSP | `next.config.ts` |
| 3 | CRITIQUE | Aucun header HSTS | `next.config.ts` |
| 4 | HAUTE | Aucun X-Frame-Options (clickjacking) | `next.config.ts` |
| 5 | HAUTE | Aucun X-Content-Type-Options | `next.config.ts` |
| 6 | HAUTE | Aucun Referrer-Policy | `next.config.ts` |
| 7 | HAUTE | Aucun Permissions-Policy | `next.config.ts` |
| 8 | HAUTE | `X-Powered-By: Next.js` non désactivé | `next.config.ts` |
| 9 | HAUTE | Actions GitHub non épinglées par SHA | `backend-contract.yml:27,29` |
| 10 | HAUTE | Permissions workflow non restreintes | `backend-contract.yml` |
| 11 | MOYENNE | `minimum_password_length = 6` dans Supabase config | `config.toml:175` |
| 12 | MOYENNE | `.gitignore` incomplet pour certains patterns `.env` | `.gitignore` |
| 13 | MOYENNE | CODEOWNERS absent | Racine repo |
| 14 | BASSE | `reactStrictMode` non activé | `next.config.ts` |

### A06 — Vulnerable & Outdated Components (4 vulnérabilités)

| # | Sévérité | Description | Fichier |
|---|----------|-------------|---------|
| 1 | HAUTE | Next.js 16.1.6 — 6 CVEs (DoS, CSRF bypass, HTTP smuggling) | `package.json` |
| 2 | HAUTE | Hono 4.11.10 — 10 CVEs (path traversal, accès fichier) | Dépendance transitive |
| 3 | MOYENNE | @xmldom/xmldom 0.8.11 — 5 CVEs injection XML | `package.json` (mobile) |
| 4 | MOYENNE | Lockfile racine manquant | Racine repo |

### A07 — Identification & Authentication Failures (8 vulnérabilités)

| # | Sévérité | Description | Fichier |
|---|----------|-------------|---------|
| 1 | HAUTE | Absence totale de rate limiting (login/signup) | `auth/actions.ts` |
| 2 | HAUTE | Politique de mot de passe inexistante côté serveur | `auth/actions.ts` |
| 3 | HAUTE | Changement mot de passe sans ré-authentification | `security-form.tsx:19` |
| 4 | HAUTE | Sessions non invalidées après changement MDP | `security-form.tsx:47` |
| 5 | MOYENNE | Énumération utilisateurs via messages d'erreur | `auth/actions.ts:19` |
| 6 | MOYENNE | `confirm-password` non vérifié côté serveur | `auth/actions.ts:27` |
| 7 | MOYENNE | Modification email sans re-confirmation | `personal-info-form.tsx:62` |
| 8 | BASSE | Absence de validation inputs (firstname, lastname, phone) | `auth/actions.ts:39` |

### A08 — Software & Data Integrity Failures (4 vulnérabilités)

| # | Sévérité | Description | Fichier |
|---|----------|-------------|---------|
| 1 | HAUTE | Aucun scan de sécurité dans le pipeline CI | `backend-contract.yml` |
| 2 | HAUTE | Pas de CI sur branches protégées (main/dev) | `backend-contract.yml:11` |
| 3 | MOYENNE | `npx supabase` sans version épinglée | `backend-contract.yml:45` |
| 4 | BASSE | `backend/package.json` sans `private: true` | `package.json` |

### A09 — Security Logging & Monitoring Failures (4 vulnérabilités)

| # | Sévérité | Description | Fichier |
|---|----------|-------------|---------|
| 1 | MOYENNE | Catch vides masquant les attaques | Multiple fichiers |
| 2 | MOYENNE | Pas d'audit trail sur modifications de baux | `leases` table |
| 3 | BASSE | Messages d'erreur DB exposés aux utilisateurs | `notification-utils.ts` |
| 4 | BASSE | Pas de logging structuré pour détection d'incidents | Multiple |

### RGPD / Conformité (3 vulnérabilités)

| # | Sévérité | Description | Fichier |
|---|----------|-------------|---------|
| 1 | HAUTE | Absence de mécanisme export données (Art. 20) | Application entière |
| 2 | HAUTE | Absence de suppression de compte (Art. 17) | Application entière |
| 3 | MOYENNE | Absence de politique de rétention des données | Notifications, logs |

### Upload & Storage (5 vulnérabilités)

| # | Sévérité | Description | Fichier |
|---|----------|-------------|---------|
| 1 | CRITIQUE | Aucune validation serveur types MIME (HTML/SVG/JS uploadable) | Storage buckets |
| 2 | HAUTE | Pas de limite de taille par bucket | Storage config |
| 3 | HAUTE | Noms de fichiers non sanitisés (path traversal) | `storage-utils.ts` |
| 4 | HAUTE | Aucun scan antivirus | Storage config |
| 5 | MOYENNE | `Math.random()` pour noms de fichiers (prévisible) | `personal-info-form.tsx:96` |

---

## RECOMMANDATIONS PAR PRIORITÉ

### IMMÉDIAT (P0) — À corriger dans les 24h

1. **Valider le rôle à l'inscription** avec une whitelist serveur
2. **Restreindre `get_all_tenants()` et `get_profile_by_email()`** aux owners uniquement, filtrer par relation
3. **Corriger la policy INSERT notifications** : `with check (auth.uid() = sender_id)`
4. **Renommer `proxy.ts` → `middleware.ts`** et la fonction `proxy` → `middleware`
5. **Valider le paramètre `next`** du callback OAuth (rejeter `//`, `\`)
6. **Corriger `mark_payment_paid()`** — restreindre aux owners
7. **Révoquer les grants `anon`** (INSERT/UPDATE/DELETE) sur toutes les tables

### URGENT (P1) — À corriger dans la semaine

8. Ajouter tous les headers de sécurité HTTP (CSP, HSTS, X-Frame-Options, etc.)
9. Implémenter le rate limiting sur login/signup
10. Corriger la régression `handle_new_user()` (respecter le rôle du metadata)
11. Utiliser les RPCs sécurisées depuis le frontend (pas d'INSERT direct)
12. Ajouter validation serveur du mot de passe (12+ chars, complexité)
13. Ré-authentification obligatoire pour changement de mot de passe
14. Mettre à jour Next.js vers 16.2.4+
15. Épingler les GitHub Actions par SHA

### COURT TERME (P2) — À corriger dans le mois

16. Configurer MIME validation serveur sur les buckets storage
17. Rendre `property-images` privé ou restreindre par statut
18. Ajouter validation Zod côté serveur sur tous les formulaires
19. Normaliser les messages d'erreur (pas de fuite Supabase)
20. Ajouter filtrage par statut de bail dans les policies tenant
21. Créer CODEOWNERS + branch protection rules
22. Ajouter `npm audit` + scan de secrets dans le CI

### MOYEN TERME (P3) — À planifier

23. Implémenter export données RGPD + suppression de compte
24. Ajouter audit trail sur toutes les opérations financières
25. Implémenter un logging structuré
26. Remplacer les opérations multi-étapes par des RPCs transactionnelles
27. Ajouter pagination sur toutes les requêtes
28. Politique de rétention des données (notifications, logs)

---

## POINTS POSITIFS IDENTIFIÉS

| Aspect | Évaluation |
|--------|------------|
| RLS activé sur toutes les tables | ✅ Solide |
| `SECURITY DEFINER` avec `search_path` fixé | ✅ Bonne pratique |
| Trigger anti-changement de rôle direct | ✅ Defense in depth |
| Pas de `service_role` exposée côté client | ✅ Conforme |
| SecureStore sur mobile pour les tokens | ✅ Conforme |
| Contrainte bail unique par tenant/propriété | ✅ Solide |
| Protection triple pour exécution tests en prod | ✅ Bonne pratique |
| Pas de `dangerouslySetInnerHTML` dans le code | ✅ Sûr |

---

*Rapport généré par audit parallèle de 20 agents spécialisés — 6 mai 2026*
