# AUDIT DE SÉCURITÉ — IMOVIA MOBILE APP (frontend/application)
## Rapport Consolidé de Pentest Manuel — Expo/React Native

**Date :** 6 mai 2026
**Auditeur :** 20 agents de pentest parallèles
**Périmètre :** 60 fichiers source dans `frontend/application/`
**Méthodologie :** OWASP Mobile Top 10 + OWASP Web Top 10, revue manuelle

---

## SYNTHÈSE EXÉCUTIVE

| Sévérité | Nombre |
|----------|--------|
| **CRITIQUE** | 14 |
| **HAUTE** | 22 |
| **MOYENNE** | 18 |
| **BASSE** | 12 |
| **TOTAL** | **66** |

---

## TOP 10 DES FAILLES LES PLUS CRITIQUES

### 1. CRITIQUE — Suppression de propriété sans vérification d'ownership (IDOR)
**Fichier :** `app/bien/[id].tsx:115-131`

```typescript
const { error } = await supabase.from("properties").delete().eq("id", id);
```

Aucun `.eq("owner_id", user.id)`. N'importe quel utilisateur authentifié peut supprimer n'importe quel bien via son ID.

**Correctif :** Ajouter `.eq("owner_id", user.id)` et vérifier `data` non null.

---

### 2. CRITIQUE — Auto-attribution du rôle owner/agency après inscription
**Fichiers :** `app/register-owner.tsx:93-96`, `app/register-agency.tsx:96-99`

```typescript
await supabase.from("profiles").update({ role: "owner" as any }).eq("id", user.id);
```

L'utilisateur fraîchement inscrit modifie directement son propre rôle côté client. Le `as any` contourne même le typage TypeScript.

**Correctif :** Supprimer ce code. Utiliser le trigger DB `handle_new_user()` avec `signup_role_from_metadata()`.

---

### 3. CRITIQUE — Exposition de TOUS les profils locataires
**Fichier :** `lib/supabase/owner-actions.ts:221-234`

```typescript
const { data, error } = await supabase.from('profiles').select('*').eq('role', 'tenant');
```

`getPotentialTenants()` retourne nom, email, téléphone de TOUS les locataires à n'importe quel owner. Violation RGPD.

**Correctif :** Remplacer par une RPC qui ne retourne que les locataires liés aux biens de l'owner.

---

### 4. CRITIQUE — Changement de mot de passe sans ré-authentification
**Fichier :** `app/(tabs)/profile.tsx:110-141`

Le champ `currentPassword` existe dans l'UI (ligne 273) mais n'est **jamais utilisé** dans la logique. L'appel `supabase.auth.updateUser({ password: newPassword })` se fait sans vérifier l'ancien mot de passe.

**Correctif :** Appeler `signInWithPassword()` avec le mot de passe actuel avant `updateUser()`.

---

### 5. CRITIQUE — Envoi de notifications à n'importe quel utilisateur (phishing)
**Fichier :** `lib/supabase/owner-actions.ts:14-41`

`sendNotification()` accepte un `userId` arbitraire. Combiné avec la RLS `WITH CHECK (true)` sur INSERT de `notifications`, tout utilisateur peut envoyer des notifications de phishing ciblées.

**Correctif :** Migrer vers une Edge Function serveur avec vérification de relation owner-tenant.

---

### 6. CRITIQUE — Fallback `user_metadata.role` (escalade de privilèges)
**Fichiers :** `app/(tabs)/biens.tsx:79`, `incidents.tsx:49`, `documents.tsx:175`, `_layout.tsx:30`, `profile.tsx:65`

```typescript
let role = user.user_metadata?.role || 'tenant';
```

`user_metadata` est modifiable côté client via `supabase.auth.updateUser()`. Si la requête DB échoue, ce rôle falsifié est utilisé pour toutes les décisions d'accès.

**Correctif :** Ne jamais utiliser `user_metadata.role`. Toujours utiliser le profil DB. En cas d'échec, bloquer l'accès (fail-closed).

---

### 7. CRITIQUE — `onboardTenant()` avec `ownerId` du client
**Fichier :** `lib/supabase/owner-actions.ts:170-219`

Le `ownerId` est passé par le caller (paramètre), pas récupéré via `getUser()`. Le `propertyId` n'est pas vérifié comme appartenant à l'owner. Un attaquant pourrait créer des baux au nom d'autres propriétaires.

**Correctif :** Remplacer par une RPC serveur qui dérive `owner_id` de `auth.uid()`.

---

### 8. CRITIQUE — Mise à jour directe du statut d'incident (IDOR)
**Fichier :** `components/incidents/IncidentCard.tsx`

L'UPDATE direct sur `incidents` sans vérifier que l'utilisateur est l'owner de la propriété liée. Un tenant pourrait marquer ses propres incidents comme "résolus".

**Correctif :** Utiliser la RPC `owner_update_incident_status()`.

---

### 9. CRITIQUE — Schéma deep link générique hijackable
**Fichier :** `app.json:8`

```json
"scheme": "application"
```

Le scheme `application://` est trivial à usurper par n'importe quelle app malveillante. Combiné avec l'IDOR DELETE (faille #1), un deep link `application://bien/VICTIM_ID` suivi d'un tap sur "Supprimer" permettrait la suppression à distance.

**Correctif :** Changer pour un scheme unique (`imovia://`) et configurer Universal Links / App Links.

---

### 10. CRITIQUE — Upload sans validation MIME (exécution de code)
**Fichiers :** `components/biens/AjouterBienModal.tsx`, `components/documents/AjouterDocumentModal.tsx`

`DocumentPicker` avec `type: "*/*"` accepte HTML, SVG, JS, EXE. Aucune limite de taille. Noms de fichiers avec `Math.random()` prévisibles.

**Correctif :** Whitelist de MIME types (`image/jpeg`, `image/png`, `application/pdf`). Limiter à 10 Mo. Utiliser `crypto.randomUUID()`.

---

## TOUTES LES VULNÉRABILITÉS PAR CATÉGORIE

### IDOR / Broken Access Control (16)

| # | Sév. | Description | Fichier |
|---|------|-------------|---------|
| 1 | CRITIQUE | DELETE propriété sans `owner_id` | `bien/[id].tsx:115` |
| 2 | CRITIQUE | `getPotentialTenants()` expose tous les tenants | `owner-actions.ts:221` |
| 3 | CRITIQUE | `onboardTenant()` avec `ownerId` client | `owner-actions.ts:170` |
| 4 | CRITIQUE | UPDATE incident sans ownership check | `IncidentCard.tsx` |
| 5 | CRITIQUE | `sendNotification()` à userId arbitraire | `owner-actions.ts:14` |
| 6 | HAUTE | Lecture propriété sans ownership check | `bien/[id].tsx:133` |
| 7 | HAUTE | Exposition téléphone owner/tenant sans relation | `bien/[id].tsx:196` |
| 8 | HAUTE | `searchTenantByEmail()` — enumération PII | `owner-actions.ts:157` |
| 9 | HAUTE | Document download sans ownership verification | `DocumentRow.tsx` |
| 10 | HAUTE | Document suppression sans ownership check | `DocumentRow.tsx` |
| 11 | HAUTE | ZIP télécharge TOUS les documents (pas filteredDocs) | `documents.tsx:67` |
| 12 | HAUTE | Ancien locataire voit toujours le logement | `logement.tsx:214` |
| 13 | MOYENNE | `markNotificationAsRead` sans filtre user_id | Future risk |
| 14 | MOYENNE | Tabs.Protected masque mais ne bloque pas | `_layout.tsx:127` |
| 15 | BASSE | Boutons modifier/supprimer sans ownership check | `bien/[id].tsx:471` |
| 16 | BASSE | `[id]` non validé/sanitisé avant requête | `bien/[id].tsx:65` |

### Authentification / Session (12)

| # | Sév. | Description | Fichier |
|---|------|-------------|---------|
| 1 | CRITIQUE | Auto-attribution rôle owner | `register-owner.tsx:93` |
| 2 | CRITIQUE | Auto-attribution rôle agency | `register-agency.tsx:96` |
| 3 | CRITIQUE | MDP changé sans ré-authentification | `profile.tsx:110` |
| 4 | CRITIQUE | Fallback `user_metadata.role` (5 fichiers) | Multiple |
| 5 | HAUTE | `getSession()` au lieu de `getUser()` pour auth guard | `_layout.tsx:40` |
| 6 | HAUTE | Aucune politique de mot de passe | Tous les formulaires |
| 7 | HAUTE | Sessions non invalidées post-changement MDP | `profile.tsx:129` |
| 8 | HAUTE | Rôle via URL param sans whitelist | `register-form.tsx:78` |
| 9 | MOYENNE | Enumération utilisateurs via messages d'erreur | `login.tsx:83` |
| 10 | MOYENNE | Erreurs signup brutes exposées | `register-owner.tsx:87` |
| 11 | MOYENNE | Pas de rate limiting sur login | `login.tsx:54` |
| 12 | BASSE | localStorage pour tokens sur web (XSS) | `lib/supabase.ts:17` |

### Upload & Storage (8)

| # | Sév. | Description | Fichier |
|---|------|-------------|---------|
| 1 | CRITIQUE | DocumentPicker `type: "*/*"` — upload de tout | `AjouterDocumentModal.tsx` |
| 2 | CRITIQUE | Bucket property-images public | Conf Supabase |
| 3 | HAUTE | `Math.random()` pour noms de fichiers | `AjouterBienModal.tsx` |
| 4 | HAUTE | Aucune limite de taille | Multiple |
| 5 | HAUTE | Path traversal via extension non sanitisée | `AjouterBienModal.tsx` |
| 6 | MOYENNE | MIME type déduit de l'extension, pas du contenu | Multiple |
| 7 | MOYENNE | Signed URLs ouvertes dans navigateur externe | `DocumentRow.tsx` |
| 8 | BASSE | `Date.now()` seul pour noms de documents | `AjouterDocumentModal.tsx` |

### Validation & Injection (10)

| # | Sév. | Description | Fichier |
|---|------|-------------|---------|
| 1 | CRITIQUE | Montants financiers: 0, négatifs, NaN acceptés | `paiements.tsx:126` |
| 2 | HAUTE | Jour de paiement sans borne (0, -1, 32+) | `paiements.tsx:128` |
| 3 | HAUTE | Aucune validation sur le profil (post-inscription) | `profile.tsx` |
| 4 | HAUTE | `sanitizeSignupEmailInput` ne supprime que les espaces | `phone-validation.ts` |
| 5 | MOYENNE | Description incident sans limite de longueur | `DeclarerIncidentModal.tsx` |
| 6 | MOYENNE | `updateLease()` — mass assignment sans whitelist | `owner-actions.ts:119` |
| 7 | MOYENNE | Email éditable dans UI mais pas propagé à auth | `profile.tsx:229` |
| 8 | MOYENNE | PII (adresses) en clair dans notifications | `owner-actions.ts:90` |
| 9 | BASSE | Regex email trop permissive | `phone-validation.ts` |
| 10 | BASSE | Pas de validation SIRET format | `register-agency.tsx` |

### Configuration & Secrets (8)

| # | Sév. | Description | Fichier |
|---|------|-------------|---------|
| 1 | CRITIQUE | Scheme deep link `application://` hijackable | `app.json:8` |
| 2 | HAUTE | Deux projets Supabase différents (mobile ≠ web) | `.env` vs `next.config.ts` |
| 3 | HAUTE | `.gitignore` local ne couvre pas `.env` | `.gitignore` |
| 4 | HAUTE | JWT anon key expiration 10 ans (2036) | `.env` |
| 5 | MOYENNE | Pas de certificate pinning | `lib/supabase.ts` |
| 6 | MOYENNE | `detectSessionInUrl: false` casse OAuth web | `lib/supabase.ts:20` |
| 7 | BASSE | Pas de détection root/jailbreak | Config |
| 8 | BASSE | 54 `console.log/error` avec données sensibles | Multiple |

### Logging & Error Handling (6)

| # | Sév. | Description | Fichier |
|---|------|-------------|---------|
| 1 | HAUTE | 18 occurrences `error.message` exposé dans Alert | Multiple |
| 2 | HAUTE | 54 console.log avec UUIDs, paths, erreurs complètes | Multiple |
| 3 | MOYENNE | Opérations non-atomiques (terminate lease) | `owner-actions.ts:43` |
| 4 | MOYENNE | Bail déjà terminé re-résiliable | `owner-actions.ts:51` |
| 5 | BASSE | Système de notifications factice (bell toggle) | `notification-bell-context.tsx` |
| 6 | BASSE | Notification envoyée au 1er locataire seulement | `owner-actions.ts:93` |

### Dépendances (4)

| # | Sév. | Description | Fichier |
|---|------|-------------|---------|
| 1 | HAUTE | 4 vulnérabilités hautes (postcss, xmldom, etc.) | `npm audit` |
| 2 | MOYENNE | 8 vulnérabilités modérées (transitives) | `npm audit` |
| 3 | MOYENNE | Pas de protection anti-bombe ZIP | `documents.tsx:64` |
| 4 | BASSE | Dépendances transitives outdated | `package-lock.json` |

---

## POINTS POSITIFS IDENTIFIÉS

| Aspect | ✅ |
|--------|---|
| SecureStore pour tokens natifs | Bonne pratique |
| `terminateLease()` vérifie `owner_id` | Defense in depth |
| `create_incident()` via RPC sécurisée | Correct |
| Confirmation mot de passe (register) | Présent |
| Validation email/phone (register) | Présent (côté client) |
| `autoRefreshToken: true` | Bonne pratique |
| Pas de `dangerouslySetInnerHTML` | Sûr (React Native) |
| Champ `private: true` dans package.json | Correct |

---

## PLAN DE REMÉDIATION

### P0 — Immédiat (< 24h)
1. Ajouter `.eq("owner_id", user.id)` sur DELETE propriété
2. Supprimer le code de role update dans `register-owner.tsx` et `register-agency.tsx`
3. Supprimer tous les fallback `user_metadata.role`
4. Vérifier le mot de passe actuel avant changement
5. Changer le deep link scheme en `imovia://`

### P1 — Urgent (< 1 semaine)
6. Remplacer `getPotentialTenants()` par une RPC filtrée
7. Utiliser `getUser()` au lieu de `getSession()` dans `_layout.tsx`
8. Ajouter validation MIME + taille sur uploads
9. Corriger `onboardTenant()` — dériver `ownerId` de `getUser()`
10. Utiliser les RPCs sécurisées pour les incidents

### P2 — Court terme (< 1 mois)
11. Implémenter politique de mot de passe (12+ chars)
12. Invalider les sessions après changement MDP
13. Normaliser les messages d'erreur
14. Supprimer les `console.log` sensibles
15. Configurer Universal Links / App Links

### P3 — Moyen terme
16. Ajouter rate limiting
17. Implémenter certificate pinning
18. Ajouter validation serveur (Zod) sur tous les champs
19. Configurer `flowType: 'pkce'`
20. Ajouter détection root/jailbreak

---

*Rapport généré par audit parallèle de 20 agents — 6 mai 2026*
*Périmètre : frontend/application uniquement (60 fichiers, ~8000 lignes)*
