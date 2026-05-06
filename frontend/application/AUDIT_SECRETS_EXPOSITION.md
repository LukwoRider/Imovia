# Rapport d'Audit de Sécurité — Exposition de Secrets
## Application Mobile Expo — Imovia

**Date :** 6 mai 2026
**Périmètre :** `/frontend/application/` (application mobile Expo/React Native)
**Auditeur :** Pentest Expert — Analyse statique du code source
**Classification :** CONFIDENTIEL

---

## Résumé Exécutif

L'audit révèle **12 vulnérabilités** réparties comme suit :

| Sévérité | Nombre |
|----------|--------|
| CRITIQUE | 2 |
| HAUTE | 4 |
| MOYENNE | 4 |
| BASSE | 2 |

L'application mobile Imovia souffre principalement d'une **exposition de secrets d'infrastructure Supabase**, d'une **absence de politique de mots de passe**, et de **fuites d'informations via les logs de production**. Le schéma de deep link générique expose également l'application à un risque de détournement.

---

## Vulnérabilités Détaillées

---

### SEC-01 — Clé anonyme Supabase exposée dans le bundle client

**Sévérité : CRITIQUE**
**Fichier :** `lib/supabase.ts` (lignes 12-13), `.env.example`
**CWE :** CWE-798 (Use of Hard-coded Credentials)

**Constat :**

La clé anonyme Supabase est injectée via `process.env.EXPO_PUBLIC_SUPABASE_URL` et `process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY`. Le préfixe `EXPO_PUBLIC_` fait que ces valeurs sont **embarquées en clair dans le bundle JavaScript** distribué aux utilisateurs. Tout utilisateur peut extraire le bundle (APK/IPA) et obtenir :

```
URL  : https://zbklhozqyyalvrlihljt.supabase.co
ANON : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIs
       InJlZiI6Inpia2xob3pxeXlhbHZybGlobGp0Iiwicm9sZSI6ImFub24iLCJp
       YXQiOjE3Nzc4ODUwMDcsImV4cCI6MjA5MzQ2MTAwN30.2OwLmUBIuReEjV1x
       d7EaJQCJSkgQqBSI3ftIEn1IAwI
```

**Décodage du JWT :**

| Champ | Valeur |
|-------|--------|
| `iss` | `supabase` |
| `ref` | `zbklhozqyyalvrlihljt` |
| `role` | `anon` |
| `iat` | `1777885007` (2026-05-04) |
| `exp` | `2093461007` (2036-05-02) |

La clé expire dans **10 ans**. En l'absence de Row Level Security (RLS) correctement configurée côté Supabase, cette clé permet à un attaquant de :

- Lire/écrire dans toutes les tables accessibles au rôle `anon`
- Énumérer les utilisateurs via `auth.users`
- Accéder au stockage (buckets `property-images`, `documents`)
- Appeler les fonctions RPC exposées (`get_profile_by_email`)

**Recommandations :**

1. **Vérifier immédiatement que les RLS (Row Level Security) sont activées** sur toutes les tables Supabase (`profiles`, `properties`, `leases`, `lease_tenants`, `notifications`, `documents`, `agency_profiles`)
2. Restreindre les permissions du rôle `anon` au strict minimum (authentification uniquement)
3. Migrer les opérations sensibles vers des **Edge Functions** Supabase côté serveur
4. Révoquer et régénérer la clé anonyme actuelle après sécurisation des RLS
5. Réduire la durée de validité du JWT à 1 an maximum

---

### SEC-02 — Fichier `.env` non protégé par `.gitignore` local

**Sévérité : CRITIQUE**
**Fichier :** `frontend/application/.gitignore`
**CWE :** CWE-522 (Insufficiently Protected Credentials)

**Constat :**

Le `.gitignore` de `frontend/application/` ne contient **aucune exclusion pour les fichiers `.env`** :

```
# @generated expo-cli sync-2b81b286409207a5da26e14c78851eb30d8ccbdb
expo-env.d.ts
```

Seul le `.gitignore` **racine** du monorepo couvre `.env`. Cela crée un risque élevé :

- Un développeur travaillant uniquement dans `frontend/application/` pourrait committer le `.env` s'il initialise un dépôt git local
- Des outils de CI/CD, Docker ou des scripts de déploiement qui ne respectent que le `.gitignore` local pourraient inclure le fichier
- Le `.env.example` confirme l'existence de valeurs réelles (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)

**Recommandations :**

1. Ajouter `.env*` et `!.env.example` au `.gitignore` de `frontend/application/`
2. Vérifier l'historique git pour s'assurer que le `.env` n'a jamais été commité (`git log --all --full-history -- frontend/application/.env`)
3. Si le fichier a été commité, révoquer et régénérer toutes les clés immédiatement
4. Ajouter un **pre-commit hook** qui bloque les fichiers `.env` contenant des valeurs non vides

---

### SEC-03 — Incohérence des projets Supabase (référence croisée)

**Sévérité : HAUTE**
**Fichiers :** `lib/supabase.ts`, `../site/next.config.ts`
**CWE :** CWE-1188 (Initialization with Hard-Coded Network Resource Configuration)

**Constat :**

Deux projets Supabase distincts sont utilisés dans le monorepo :

| Composant | Référence Supabase | Hostname |
|-----------|-------------------|----------|
| Application mobile | `zbklhozqyyalvrlihljt` | `zbklhozqyyalvrlihljt.supabase.co` |
| Site web (Next.js) | `rrfcnlxgtshxxzeuhmud` | `rrfcnlxgtshxxzeuhmud.supabase.co` |

Cela implique soit :

- **Deux bases de données distinctes** avec potentiellement des données dupliquées et des politiques de sécurité incohérentes
- **Un environnement de dev/staging exposé en production** (l'un des deux pourrait être un environnement de test)
- **Un risque de confusion** lors des déploiements, avec possibilité de connecter l'app mobile à la mauvaise base

**Recommandations :**

1. Clarifier quel projet Supabase est la production et lequel est le staging/dev
2. S'assurer que les RLS sont identiquement configurées sur les deux projets
3. Ne jamais exposer les identifiants d'un environnement de développement dans le code source
4. Documenter l'architecture multi-projets et les raisons de cette séparation

---

### SEC-04 — Schéma de deep link générique — risque de détournement

**Sévérité : HAUTE**
**Fichier :** `app.json` (ligne 8)
**CWE :** CWE-939 (Improper Authorization in Handler for Custom URL Scheme)

**Constat :**

```json
"scheme": "application"
```

Le schéma de deep link `application://` est **extrêmement générique**. Sur Android, n'importe quelle application malveillante peut enregistrer le même schéma et intercepter les liens destinés à Imovia. Cela permet :

- **Détournement de tokens OAuth** : si Supabase envoie un lien de confirmation/reset par email avec le schéma `application://`, une app malveillante peut capturer le token
- **Phishing** : redirection vers une fausse interface de connexion
- **Interception de données** : lecture des paramètres de deep link contenant des identifiants

**Recommandations :**

1. Renommer le schéma en quelque chose d'unique : `imovia://` ou `co.imovia.app://`
2. Implémenter **App Links** (Android) et **Universal Links** (iOS) avec vérification de domaine
3. Valider côté serveur que les tokens de deep link n'ont pas été interceptés (nonce, PKCE)

---

### SEC-05 — Stockage web via `localStorage` — sessions exposées

**Sévérité : HAUTE**
**Fichier :** `lib/supabase.ts` (ligne 17)
**CWE :** CWE-922 (Insecure Storage of Sensitive Information)

**Constat :**

```typescript
storage: Platform.OS === 'web' ? window.localStorage : ExpoSecureStoreAdapter,
```

Sur la plateforme web, les tokens d'authentification Supabase sont stockés dans `localStorage`, qui est :

- **Accessible à tout code JavaScript** exécuté dans la même origine (vulnérable aux attaques XSS)
- **Non chiffré** et visible dans les outils de développement du navigateur
- **Persistant** sans expiration (survit à la fermeture du navigateur)

Sur mobile, `expo-secure-store` est correctement utilisé (Keychain iOS / Keystore Android).

**Recommandations :**

1. Utiliser des **cookies httpOnly** pour la version web via un proxy backend
2. À défaut, utiliser `sessionStorage` au lieu de `localStorage` (tokens supprimés à la fermeture)
3. Implémenter un mécanisme de rotation de tokens avec des durées de vie courtes
4. Ajouter une protection CSP stricte pour limiter l'exécution de scripts tiers

---

### SEC-06 — Absence de politique de mot de passe côté client

**Sévérité : HAUTE**
**Fichiers :** `app/register-owner.tsx`, `app/register-form.tsx`, `app/register-agency.tsx`, `app/(tabs)/profile.tsx`
**CWE :** CWE-521 (Weak Password Requirements)

**Constat :**

Aucune validation de robustesse des mots de passe n'est implémentée côté client. Les seules vérifications effectuées sont :

- Champ non vide (`!password`)
- Correspondance entre mot de passe et confirmation (`password !== confirmPassword`)

Un utilisateur peut s'inscrire avec un mot de passe tel que `1`, `a`, ou `123`.

Le changement de mot de passe dans `profile.tsx` (ligne 110-141) ne vérifie pas non plus l'ancien mot de passe (`currentPassword` est collecté via l'UI mais **jamais envoyé à Supabase**) :

```typescript
const { error } = await supabase.auth.updateUser({
    password: newPassword,  // ancien mot de passe jamais vérifié
});
```

**Recommandations :**

1. Imposer côté client : minimum 12 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial
2. Vérifier l'ancien mot de passe avant de permettre le changement (re-authentification via `signInWithPassword` avant `updateUser`)
3. Configurer les **password policies** dans le dashboard Supabase Auth
4. Intégrer un indicateur de force du mot de passe (zxcvbn ou similaire)

---

### SEC-07 — Fuites d'informations via `console.log`/`console.error` en production

**Sévérité : MOYENNE**
**Fichiers :** 18+ fichiers (voir liste complète ci-dessous)
**CWE :** CWE-532 (Insertion of Sensitive Information into Log File)

**Constat :**

Plus de **50 appels** à `console.log`, `console.error`, et `console.warn` sont présents dans le code de production. Exemples critiques :

- `console.log('[terminateLease] Attempting to terminate lease ${leaseId}')` — expose des ID de baux
- `console.error('[Upload] DB error:', JSON.stringify(dbError))` — expose des erreurs de base de données complètes
- `console.log('[Biens] Initial role from metadata:', role)` — expose les rôles utilisateur
- `console.error("Error updating profile role:", roleError)` — expose les erreurs Supabase

En mode web, ces logs sont visibles dans la console du navigateur. Sur mobile (debug builds), ils sont accessibles via `adb logcat` (Android) ou la console Xcode (iOS).

**Fichiers concernés :** `owner-actions.ts`, `AjouterBienModal.tsx`, `DocumentRow.tsx`, `AjouterDocumentModal.tsx`, `IncidentCard.tsx`, `DeclarerIncidentModal.tsx`, `RentalCardOwner.tsx`, `BailLocation.tsx`, `register-owner.tsx`, `register-agency.tsx`, `profile.tsx`, `paiements.tsx`, `logement.tsx`, `index.tsx`, `incidents.tsx`, `documents.tsx`, `biens.tsx`, `bien/[id].tsx`

**Recommandations :**

1. Supprimer tous les `console.log` avant la mise en production
2. Remplacer les `console.error` par un service de logging centralisé (Sentry, Datadog) qui ne log pas les données sensibles
3. Configurer un plugin Babel (`babel-plugin-transform-remove-console`) pour supprimer automatiquement les logs en build de production
4. Mettre en place une règle ESLint `no-console` avec niveau `error`

---

### SEC-08 — Requêtes Supabase directes sans couche d'abstraction

**Sévérité : MOYENNE**
**Fichiers :** 18 fichiers effectuant des requêtes `.from()`, `.rpc()`, `.storage.from()`
**CWE :** CWE-284 (Improper Access Control)

**Constat :**

Toutes les opérations de base de données sont effectuées **directement depuis le client** avec le SDK Supabase et la clé anonyme. Aucune API backend intermédiaire n'est utilisée. Cela signifie que :

- La sécurité repose **entièrement** sur les RLS Supabase (si elles sont désactivées, toute la base est exposée)
- Un attaquant peut construire des requêtes arbitraires avec la clé anonyme extraite
- Les requêtes RPC comme `get_profile_by_email` permettent potentiellement l'énumération d'utilisateurs
- L'accès au stockage (`property-images`, `documents`) n'est pas filtré côté client

Exemples de requêtes sensibles effectuées directement :

```typescript
// Récupération de TOUS les locataires — owner-actions.ts
await supabase.from('profiles').select('*').eq('role', 'tenant')

// Recherche par email — owner-actions.ts  
await supabase.rpc('get_profile_by_email', { p_email: email })

// URLs publiques de stockage — bien/[id].tsx
supabase.storage.from('property-images').getPublicUrl(img.storage_path)
```

**Recommandations :**

1. Auditer immédiatement les RLS sur toutes les tables Supabase
2. Migrer les opérations sensibles (création de bail, suppression de bien, notifications) vers des Edge Functions Supabase
3. Restreindre l'accès RPC `get_profile_by_email` aux utilisateurs authentifiés avec le rôle `owner`
4. Configurer les buckets de stockage en mode **privé** avec accès par signed URLs uniquement

---

### SEC-09 — URLs de stockage publiques sans contrôle d'accès

**Sévérité : MOYENNE**
**Fichiers :** `app/bien/[id].tsx` (ligne 167, 189), `app/(tabs)/biens.tsx` (ligne 155)
**CWE :** CWE-284 (Improper Access Control)

**Constat :**

Les images de propriétés sont accédées via `getPublicUrl()`, ce qui génère des URLs publiques permanentes sans authentification :

```typescript
supabase.storage.from('property-images').getPublicUrl(img.storage_path)
```

Toute personne connaissant (ou devinant) le `storage_path` peut accéder aux images. De plus, les documents sont accédés via des signed URLs avec un TTL de 60 secondes (`createSignedUrl(fullPath, 60)`), ce qui est meilleur mais insuffisant si le bucket est public.

**Recommandations :**

1. Configurer le bucket `property-images` en mode **privé**
2. Utiliser `createSignedUrl()` partout au lieu de `getPublicUrl()`
3. Réduire le TTL des signed URLs au minimum nécessaire
4. Ajouter des politiques de stockage Supabase pour vérifier l'identité du demandeur

---

### SEC-10 — Absence de protection contre le brute-force côté client

**Sévérité : MOYENNE**
**Fichier :** `app/login.tsx`
**CWE :** CWE-307 (Improper Restriction of Excessive Authentication Attempts)

**Constat :**

La page de connexion ne comporte **aucun mécanisme de limitation** :

- Pas de compteur de tentatives échouées
- Pas de délai exponentiel (exponential backoff)
- Pas de CAPTCHA après N échecs
- Pas de verrouillage temporaire du compte

Un attaquant peut automatiser des milliers de tentatives de connexion via `supabase.auth.signInWithPassword()` directement avec la clé anonyme, sans même passer par l'interface.

**Recommandations :**

1. Configurer le rate-limiting dans Supabase Auth (dashboard > Authentication > Rate Limits)
2. Implémenter un compteur côté client avec verrouillage après 5 tentatives (30 secondes)
3. Ajouter un CAPTCHA (hCaptcha est supporté nativement par Supabase) après 3 échecs
4. Logger les tentatives échouées côté serveur pour détection d'anomalies

---

### SEC-11 — Validation d'entrées insuffisante

**Sévérité : BASSE**
**Fichiers :** `lib/phone-validation.ts`, formulaires d'inscription
**CWE :** CWE-20 (Improper Input Validation)

**Constat :**

La validation des entrées est limitée :

- **Email** : regex simpliste `^[^\s@]+@[^\s@]+\.[^\s@]+$` — accepte des formats invalides comme `a@b.c`
- **Téléphone** : uniquement les formats français (0X ou +33X) — les utilisateurs internationaux sont exclus
- **Noms** : aucune validation (injection potentielle via `full_name` si utilisé dans des requêtes SQL brutes)
- **SIRET** : aucune validation de format (14 chiffres) ni de véracité

La sanitisation email (`sanitizeSignupEmailInput`) se limite à supprimer les espaces. La sanitisation téléphone (`sanitizeSignupPhoneInput`) ne filtre que les non-digits.

**Recommandations :**

1. Utiliser une bibliothèque de validation robuste (zod, yup)
2. Valider le SIRET (format 14 chiffres + clé de Luhn)
3. Échapper les entrées utilisateur avant insertion en base
4. Valider côté serveur (Edge Functions) en plus du client

---

### SEC-12 — Absence de certificate pinning et de détection de root/jailbreak

**Sévérité : BASSE**
**Fichier :** Configuration globale de l'application
**CWE :** CWE-295 (Improper Certificate Validation)

**Constat :**

L'application ne met en œuvre aucun mécanisme de :

- **Certificate pinning** : un attaquant sur le même réseau (Wi-Fi public) peut intercepter le trafic HTTPS via un proxy (Burp Suite, mitmproxy) en installant un certificat CA personnalisé
- **Détection de root/jailbreak** : l'application fonctionne sans restriction sur des appareils rootés/jailbreakés, facilitant le reverse engineering et l'extraction de tokens depuis `expo-secure-store`
- **Détection de Frida/debugger** : aucune protection contre l'instrumentation dynamique

**Recommandations :**

1. Implémenter le certificate pinning via `expo-certificate-transparency` ou une solution custom
2. Ajouter la détection de root/jailbreak (freeRASP, rootbeer)
3. Obfusquer le code JavaScript avec Hermes + ProGuard
4. Désactiver le mode debug en production

---

## Matrice de Risques

| ID | Vulnérabilité | Sévérité | Impact | Probabilité | Effort de Correction |
|----|--------------|----------|--------|-------------|---------------------|
| SEC-01 | Clé Supabase dans le bundle | CRITIQUE | Très élevé | Certaine | Moyen |
| SEC-02 | `.env` non protégé localement | CRITIQUE | Très élevé | Élevée | Faible |
| SEC-03 | Double projet Supabase | HAUTE | Élevé | Moyenne | Moyen |
| SEC-04 | Schéma deep link générique | HAUTE | Élevé | Moyenne | Faible |
| SEC-05 | `localStorage` pour sessions web | HAUTE | Élevé | Moyenne | Moyen |
| SEC-06 | Pas de politique de mot de passe | HAUTE | Élevé | Élevée | Faible |
| SEC-07 | Logs en production | MOYENNE | Moyen | Élevée | Faible |
| SEC-08 | Requêtes directes sans backend | MOYENNE | Élevé | Moyenne | Élevé |
| SEC-09 | URLs de stockage publiques | MOYENNE | Moyen | Moyenne | Faible |
| SEC-10 | Pas de protection brute-force | MOYENNE | Moyen | Moyenne | Faible |
| SEC-11 | Validation d'entrées faible | BASSE | Faible | Faible | Faible |
| SEC-12 | Pas de cert pinning/root detect | BASSE | Moyen | Faible | Moyen |

---

## Plan d'Action Prioritaire

### Immédiat (J+0 à J+7)
1. **Vérifier les RLS Supabase** sur toutes les tables — SEC-01
2. **Ajouter `.env*` au `.gitignore` local** — SEC-02
3. **Vérifier l'historique git** pour toute fuite antérieure — SEC-02
4. **Renommer le schéma de deep link** en `imovia://` — SEC-04

### Court terme (J+7 à J+30)
5. **Implémenter une politique de mot de passe** — SEC-06
6. **Supprimer tous les `console.log`** et configurer `no-console` — SEC-07
7. **Corriger la vérification de l'ancien mot de passe** — SEC-06
8. **Configurer les rate limits** Supabase Auth — SEC-10

### Moyen terme (J+30 à J+90)
9. **Migrer vers des Edge Functions** pour les opérations sensibles — SEC-08
10. **Passer les buckets en mode privé** — SEC-09
11. **Implémenter un stockage sécurisé web** (cookies httpOnly) — SEC-05
12. **Clarifier l'architecture multi-projets** Supabase — SEC-03

### Long terme (J+90+)
13. **Certificate pinning et détection root** — SEC-12
14. **Validation robuste avec zod** — SEC-11
15. **Obfuscation du bundle JS** — SEC-12

---

## Annexes

### A. Fichiers Audités

| Fichier | Vulnérabilités |
|---------|---------------|
| `lib/supabase.ts` | SEC-01, SEC-05 |
| `.gitignore` (local) | SEC-02 |
| `.gitignore` (racine) | SEC-02 |
| `app.json` | SEC-04 |
| `app/login.tsx` | SEC-10 |
| `app/register-owner.tsx` | SEC-06, SEC-07 |
| `app/register-form.tsx` | SEC-06 |
| `app/register-agency.tsx` | SEC-06, SEC-07 |
| `app/(tabs)/profile.tsx` | SEC-06, SEC-07 |
| `lib/supabase/owner-actions.ts` | SEC-07, SEC-08 |
| `lib/phone-validation.ts` | SEC-11 |
| `app/bien/[id].tsx` | SEC-09 |
| `app/(tabs)/biens.tsx` | SEC-09 |
| `components/documents/DocumentRow.tsx` | SEC-09 |
| `../site/next.config.ts` | SEC-03 |
| `package.json` | — |

### B. Dépendances Analysées

| Paquet | Version | Statut |
|--------|---------|--------|
| `@supabase/supabase-js` | ^2.97.0 | OK (dernière version) |
| `expo` | ~54.0.33 | OK |
| `expo-secure-store` | ~15.0.8 | OK (utilisé sur mobile) |
| `react` | 19.1.0 | OK |
| `react-native` | 0.81.5 | OK |
| `jszip` | ^3.10.1 | À surveiller (CVEs historiques) |
| `react-native-url-polyfill` | ^3.0.0 | OK |

Aucune dépendance avec CVE critique connue à ce jour, mais un `npm audit` régulier est recommandé.

### C. Méthodologie

- Analyse statique du code source (grep, AST analysis)
- Décodage et analyse des JWT
- Vérification des configurations de sécurité
- Revue des patterns d'authentification et d'autorisation
- Vérification des `.gitignore` et de l'historique de versioning
- Analyse des dépendances

---

*Fin du rapport — Document confidentiel à diffusion restreinte.*
