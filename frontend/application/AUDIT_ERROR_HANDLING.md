# Rapport d'Audit de Sécurité — Gestion des Erreurs et Fuite d'Informations

**Application :** Imovia (Expo / React Native)  
**Périmètre :** `app/`, `lib/`, `components/` — 45 fichiers analysés  
**Date :** 6 mai 2026  
**Auditeur :** Pentest Expert  
**Classification :** CONFIDENTIEL

---

## Résumé Exécutif

L'audit révèle **64 vulnérabilités** réparties en 4 catégories critiques de gestion des erreurs. L'application expose systématiquement les messages d'erreur bruts de Supabase/PostgreSQL aux utilisateurs finaux, log des identifiants sensibles en production, et utilise un mécanisme de fallback de rôle côté client qui constitue un antipattern de sécurité majeur.

| Catégorie | Instances | Sévérité |
|---|---|---|
| A. `error.message` exposé à l'utilisateur | 18 | 🔴 CRITIQUE |
| B. `console.error`/`console.log` avec données sensibles | 54 | 🟠 ÉLEVÉE |
| C. Fallback `user_metadata.role` côté client | 5 | 🔴 CRITIQUE |
| D. `JSON.stringify` d'objets d'erreur Supabase | 2 | 🟠 ÉLEVÉE |

---

## A. Messages d'erreur bruts exposés à l'utilisateur via `Alert.alert`

**Sévérité : 🔴 CRITIQUE**

### Description

Les messages d'erreur Supabase/PostgreSQL sont affichés directement dans des `Alert.alert()` ou propagés via `throw new Error(error.message)`. Ces messages peuvent contenir :
- Des noms de tables et colonnes PostgreSQL
- Des contraintes de clé étrangère (ex: `violates foreign key constraint "leases_tenant_id_fkey"`)
- Des détails d'authentification Supabase (ex: `Email rate limit exceeded`, `User already registered`)
- Des messages RPC internes

### Instances détaillées (18 occurrences)

#### Fichiers `app/`

| # | Fichier | Ligne | Code vulnérable | Risque |
|---|---|---|---|---|
| 1 | `app/login.tsx` | 83 | `error.message` affiché si non "invalid credentials" | Expose les erreurs Supabase Auth (rate limit, configuration, etc.) |
| 2 | `app/register-form.tsx` | 85 | `Alert.alert("Erreur d'inscription", error.message)` | Expose les erreurs d'inscription (doublons email, contraintes) |
| 3 | `app/register-owner.tsx` | 87 | `Alert.alert("Erreur d'inscription", signUpError.message)` | Idem — erreurs Supabase Auth brutes |
| 4 | `app/register-agency.tsx` | 85 | `Alert.alert("Erreur d'inscription", signUpError.message)` | Idem — erreurs Supabase Auth brutes |
| 5 | `app/(tabs)/profile.tsx` | 104 | `"Impossible de se déconnecter : " + error.message` | Expose les détails d'erreur de déconnexion |
| 6 | `app/(tabs)/profile.tsx` | 137 | `"Impossible de mettre à jour le mot de passe : " + error.message` | Expose les contraintes de mot de passe Supabase |
| 7 | `app/(tabs)/profile.tsx` | 173 | `"Impossible de mettre à jour le profil : " + error.message` | Expose les erreurs de mise à jour profil |
| 8 | `app/(tabs)/paiements.tsx` | 105 | `Alert.alert("Erreur", error.message)` | Expose les erreurs de traitement de paiement |
| 9 | `app/(tabs)/paiements.tsx` | 134 | `Alert.alert("Erreur", error.message)` | Expose les erreurs d'ajout de locataire |

#### Fichiers `components/`

| # | Fichier | Ligne | Code vulnérable | Risque |
|---|---|---|---|---|
| 10 | `components/rentals/RentalCardOwner.tsx` | 99 | `Alert.alert("Erreur", error.message \|\| "...")` | Expose les erreurs de résiliation de bail |
| 11 | `components/rentals/RentalCardOwner.tsx` | 139 | `Alert.alert("Erreur", error.message)` | Expose les erreurs de mise à jour de bail |
| 12 | `components/rentals/BailLocation.tsx` | 99 | `Alert.alert("Erreur", error.message \|\| "...")` | Idem — composant dupliqué |
| 13 | `components/rentals/BailLocation.tsx` | 139 | `Alert.alert("Erreur", error.message)` | Idem — composant dupliqué |
| 14 | `components/incidents/DeclarerIncidentModal.tsx` | 114 | `Alert.alert("Erreur", error.message \|\| "...")` | Expose les erreurs de déclaration d'incident |
| 15 | `components/documents/DocumentRow.tsx` | 45 | `"Impossible de récupérer le fichier : " + error.message` | Expose les erreurs de téléchargement (chemins storage) |
| 16 | `components/documents/AjouterDocumentModal.tsx` | 282 | `Alert.alert("Erreur", error.message \|\| "...")` | Expose les erreurs d'upload de document |
| 17 | `components/biens/AjouterBienModal.tsx` | 337 | `error.message \|\| "Une erreur est survenue..."` | Expose les erreurs d'enregistrement de bien |

#### Fichiers `lib/`

| # | Fichier | Ligne | Code vulnérable | Risque |
|---|---|---|---|---|
| 18 | `lib/supabase/owner-actions.ts` | 37 | `throw new Error(\`...: ${error.message}\`)` | Propage l'erreur brute Supabase vers l'appelant qui l'affiche |
| 18b | `lib/supabase/owner-actions.ts` | 59 | `throw new Error(\`...: ${leaseError.message}\`)` | Idem — erreur de résiliation |
| 18c | `lib/supabase/owner-actions.ts` | 127 | `throw new Error(\`...: ${error.message}\`)` | Idem — erreur de mise à jour de bail |
| 18d | `lib/supabase/owner-actions.ts` | 194 | `throw new Error(\`...: ${leaseError.message}\`)` | Idem — erreur de création de bail |

### Exemple d'exploitation

Un attaquant peut déclencher volontairement des erreurs (champs invalides, requêtes dupliquées) pour obtenir :
```
"Erreur lors de la mise à jour du bail: duplicate key value violates unique constraint "leases_pkey""
```
Cela révèle le nom de la table (`leases`), le type de contrainte, et la structure du schéma.

### Cas spécifique : `login.tsx` — Fallback partiel

```typescript
const isInvalidCredentials =
  error.message?.toLowerCase().includes("invalid login credentials") ||
  error.message?.toLowerCase().includes("invalid credentials");

const message = isInvalidCredentials
  ? "Email ou mot de passe incorrect."
  : error.message;  // ← FUITE si l'erreur n'est pas "invalid credentials"
```

Ce code tente de masquer l'erreur pour les identifiants invalides, mais **toute autre erreur Supabase Auth** (rate limiting, email non confirmé, compte désactivé, erreur serveur) est affichée en clair.

---

## B. Journalisation de données sensibles via `console.error` / `console.log`

**Sévérité : 🟠 ÉLEVÉE**

### Description

L'application contient **54 appels** à `console.error`/`console.log`/`console.warn` répartis sur **18 fichiers**. Dans une application React Native en production, ces logs sont :
- Accessibles via **Remote JS Debugging** (Chrome DevTools)
- Capturables par des outils de **log collection** (Sentry, Bugsnag, Datadog)
- Visibles via `adb logcat` sur Android
- Accessibles via la Console macOS sur iOS (en mode debug)

### Sous-catégorie B1 : Identifiants d'entités métier dans `console.log`

**6 occurrences — Sévérité : 🟠 ÉLEVÉE**

| # | Fichier | Ligne | Donnée exposée |
|---|---|---|---|
| 1 | `lib/supabase/owner-actions.ts` | 44 | `lease ${leaseId}` + `property ${propertyId}` — UUIDs de bail et bien |
| 2 | `lib/supabase/owner-actions.ts` | 103 | `lease ${leaseId}` — confirmation avec UUID |
| 3 | `components/rentals/RentalCardOwner.tsx` | 89 | `lease.id` — UUID du bail |
| 4 | `components/rentals/BailLocation.tsx` | 89 | `lease.id` — UUID du bail |
| 5 | `app/(tabs)/biens.tsx` | 80 | `role` de l'utilisateur depuis metadata |
| 6 | `app/(tabs)/biens.tsx` | 128 | `uid` — UUID du propriétaire |

### Sous-catégorie B2 : Objets d'erreur complets dans `console.error`

**35 occurrences — Sévérité : 🟠 ÉLEVÉE**

Ces appels loguent l'objet erreur complet qui peut contenir des stack traces, des détails de requête PostgreSQL, des tokens, etc.

| # | Fichier | Nb | Détail |
|---|---|---|---|
| 1 | `lib/supabase/owner-actions.ts` | 7 | Erreurs Supabase complètes (lease, property, notification) |
| 2 | `components/biens/AjouterBienModal.tsx` | 5 | Erreurs d'upload/delete incluant chemins storage |
| 3 | `components/documents/DocumentRow.tsx` | 4 | Erreurs storage + database |
| 4 | `components/documents/AjouterDocumentModal.tsx` | 4 | Erreurs de propriétés, locataires, fichiers |
| 5 | `app/(tabs)/profile.tsx` | 4 | Erreurs de profil, logout, mot de passe |
| 6 | `app/(tabs)/incidents.tsx` | 3 | Erreurs d'initialisation et de chargement |
| 7 | `app/(tabs)/documents.tsx` | 3 | Erreurs ZIP, fetch, erreurs générales |
| 8 | `app/(tabs)/biens.tsx` | 2 | Erreurs d'initialisation et de fetch |
| 9 | `components/rentals/RentalCardOwner.tsx` | 1 | Erreur de résiliation |
| 10 | `components/rentals/BailLocation.tsx` | 1 | Erreur de résiliation |
| 11 | `components/incidents/IncidentCard.tsx` | 1 | Erreur de mise à jour de statut |
| 12 | `components/incidents/DeclarerIncidentModal.tsx` | 1 | Erreur de soumission |
| 13 | `app/register-owner.tsx` | 1 | Erreur de rôle |
| 14 | `app/register-agency.tsx` | 2 | Erreurs de rôle et profil agence |
| 15 | `app/bien/[id].tsx` | 1 | Erreur de fetch |
| 16 | `app/(tabs)/paiements.tsx` | 1 | Erreur de fetch leases |
| 17 | `app/(tabs)/logement.tsx` | 1 | Erreur de fetch |
| 18 | `app/(tabs)/index.tsx` | 1 | Erreur dashboard |

### Sous-catégorie B3 : Chemins de stockage et données de fichiers dans les logs

**8 occurrences — Sévérité : 🟡 MOYENNE**

| # | Fichier | Ligne | Donnée exposée |
|---|---|---|---|
| 1 | `components/biens/AjouterBienModal.tsx` | 228 | Chemin storage de l'image supprimée |
| 2 | `components/biens/AjouterBienModal.tsx` | 239 | Confirmation de suppression avec chemin |
| 3 | `components/biens/AjouterBienModal.tsx` | 251 | Nombre total d'images sélectionnées |
| 4 | `components/biens/AjouterBienModal.tsx` | 267 | URI locale de l'image |
| 5 | `components/biens/AjouterBienModal.tsx` | 272 | Taille et type du blob |
| 6 | `components/biens/AjouterBienModal.tsx` | 290 | Données de retour d'upload Supabase |
| 7 | `components/biens/AjouterBienModal.tsx` | 302 | Chemin du fichier sauvegardé (inclut `property.id`) |
| 8 | `components/biens/AjouterBienModal.tsx` | 316 | Compteur de succès d'upload |

### Sous-catégorie B4 : `JSON.stringify` d'erreurs Supabase dans les logs

**2 occurrences — Sévérité : 🟠 ÉLEVÉE**

| # | Fichier | Ligne | Code |
|---|---|---|---|
| 1 | `components/biens/AjouterBienModal.tsx` | 287 | `JSON.stringify(uploadError)` — objet erreur Supabase Storage complet |
| 2 | `components/biens/AjouterBienModal.tsx` | 298 | `JSON.stringify(dbError)` — objet erreur Supabase Database complet |

Ces appels sérialisent l'intégralité de l'objet d'erreur Supabase, qui peut contenir : l'URL de l'API, le status HTTP, des headers, des détails PostgreSQL internes.

---

## C. Antipattern de fallback `user_metadata.role`

**Sévérité : 🔴 CRITIQUE**

### Description

L'application utilise un pattern récurrent où le rôle de l'utilisateur est d'abord extrait de `user.user_metadata?.role` (donnée côté client, modifiable par l'utilisateur), puis éventuellement corrigé par une requête à la table `profiles`. Ce pattern présente plusieurs vulnérabilités :

1. **`user_metadata` est contrôlé par le client** — L'utilisateur peut modifier ses propres metadata via `supabase.auth.updateUser({ data: { role: "owner" } })`.
2. **Le fallback à `"tenant"` masque les erreurs** — Si la requête `profiles` échoue (réseau, RLS), l'utilisateur obtient un rôle par défaut au lieu d'une erreur.
3. **Race condition** — Le rôle metadata est utilisé avant que la requête profil ne se termine, créant une fenêtre de temps où un rôle falsifié est actif.

### Instances détaillées (5 fichiers)

| # | Fichier | Ligne | Pattern exact | Impact |
|---|---|---|---|---|
| 1 | `app/(tabs)/_layout.tsx` | 30 | `let role = user.user_metadata?.role \|\| "tenant"` | Détermine les **onglets affichés** dans la navigation — un tenant pourrait voir les onglets propriétaire |
| 2 | `app/(tabs)/biens.tsx` | 79 | `let role = user.user_metadata?.role \|\| 'tenant'` | Détermine les **biens affichés** et les actions disponibles |
| 3 | `app/(tabs)/incidents.tsx` | 49 | `let role = user.user_metadata?.role \|\| "tenant"` | Détermine la **vue incidents** (gestionnaire vs locataire) |
| 4 | `app/(tabs)/documents.tsx` | 175 | `profile?.role \|\| user.user_metadata?.role \|\| "tenant"` | Détermine les **documents accessibles** et les permissions |
| 5 | `app/(tabs)/profile.tsx` | 65 | `profile.role \|\| user.user_metadata?.role \|\| "tenant"` | Détermine les **informations de profil** affichées |

### Analyse du pattern dans `biens.tsx`

```typescript
let role = user.user_metadata?.role || 'tenant';           // ← Valeur client, falsifiable
console.log('[Biens] Initial role from metadata:', role);   // ← Log le rôle

const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .maybeSingle();

if (profile?.role) {
  role = profile.role;                                      // ← Correction... si la requête réussit
}
```

**Problème fondamental :** Si la requête `profiles` échoue silencieusement (erreur réseau, timeout, RLS mal configurée), `maybeSingle()` retourne `null` sans erreur, et le rôle falsifié depuis `user_metadata` reste actif.

### Cas aggravant dans `biens.tsx`

```typescript
} catch (err) {
  console.error('[Biens] Initialization error:', err);
  setUserRole('tenant');        // ← Fallback silencieux à "tenant"
  fetchBiens('tenant');         // ← Charge des données sans authentification de rôle fiable
}
```

En cas d'erreur d'initialisation, le code **continue l'exécution** avec un rôle par défaut au lieu de bloquer l'accès.

---

## D. Synthèse par fichier

| Fichier | A (error.message) | B (console.log/error) | C (metadata.role) | Total |
|---|---|---|---|---|
| `lib/supabase/owner-actions.ts` | 4 | 9 | — | 13 |
| `components/biens/AjouterBienModal.tsx` | 1 | 13 | — | 14 |
| `components/documents/DocumentRow.tsx` | 1 | 5 | — | 6 |
| `components/documents/AjouterDocumentModal.tsx` | 1 | 4 | — | 5 |
| `components/rentals/RentalCardOwner.tsx` | 2 | 2 | — | 4 |
| `components/rentals/BailLocation.tsx` | 2 | 2 | — | 4 |
| `components/incidents/DeclarerIncidentModal.tsx` | 1 | 2 | — | 3 |
| `components/incidents/IncidentCard.tsx` | — | 1 | — | 1 |
| `app/(tabs)/profile.tsx` | 3 | 4 | 1 | 8 |
| `app/(tabs)/paiements.tsx` | 2 | 1 | — | 3 |
| `app/(tabs)/biens.tsx` | — | 4 | 1 | 5 |
| `app/(tabs)/incidents.tsx` | — | 3 | 1 | 4 |
| `app/(tabs)/documents.tsx` | — | 3 | 1 | 4 |
| `app/(tabs)/_layout.tsx` | — | — | 1 | 1 |
| `app/(tabs)/logement.tsx` | — | 1 | — | 1 |
| `app/(tabs)/index.tsx` | — | 1 | — | 1 |
| `app/login.tsx` | 1 | — | — | 1 |
| `app/register-form.tsx` | 1 | — | — | 1 |
| `app/register-owner.tsx` | 1 | 1 | — | 2 |
| `app/register-agency.tsx` | 1 | 2 | — | 3 |
| `app/bien/[id].tsx` | — | 1 | — | 1 |

---

## E. Recommandations de Remédiation

### Priorité 1 — CRITIQUE : Supprimer l'exposition de `error.message`

**Effort estimé : 2-3 heures**

Créer un utilitaire centralisé de gestion des erreurs :

```typescript
// lib/error-handler.ts
type ErrorCategory = 'auth' | 'network' | 'validation' | 'storage' | 'unknown';

const USER_FACING_MESSAGES: Record<ErrorCategory, string> = {
  auth: "Erreur d'authentification. Veuillez réessayer.",
  network: "Erreur de connexion. Vérifiez votre réseau.",
  validation: "Les données saisies sont invalides.",
  storage: "Erreur lors du traitement du fichier.",
  unknown: "Une erreur est survenue. Veuillez réessayer.",
};

export function getDisplayError(error: unknown): string {
  // Ne JAMAIS exposer error.message à l'utilisateur
  // Logger côté serveur/monitoring uniquement
  return USER_FACING_MESSAGES[categorizeError(error)];
}
```

Remplacer tous les `Alert.alert("Erreur", error.message)` par `Alert.alert("Erreur", getDisplayError(error))`.

### Priorité 2 — CRITIQUE : Sécuriser la détermination du rôle

**Effort estimé : 3-4 heures**

1. **Ne JAMAIS utiliser `user_metadata.role` comme source de vérité.** Le rôle doit provenir exclusivement de la table `profiles` protégée par RLS.
2. **Échouer de manière sécurisée** — Si la requête profil échoue, **bloquer l'accès** au lieu de fallback à un rôle par défaut.
3. **Implémenter une vérification côté serveur** — Toutes les opérations sensibles doivent vérifier le rôle via RLS PostgreSQL, pas via le client.

```typescript
// Pattern corrigé
async function getVerifiedRole(userId: string): Promise<string> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();  // single() au lieu de maybeSingle() — erreur si absent

  if (error || !profile?.role) {
    throw new Error("ROLE_VERIFICATION_FAILED");
    // NE PAS fallback à "tenant" ou user_metadata
  }

  return profile.role;
}
```

### Priorité 3 — ÉLEVÉE : Supprimer les `console.log`/`console.error` en production

**Effort estimé : 1-2 heures**

1. Installer un outil de monitoring (Sentry, Bugsnag) pour capturer les erreurs de manière sécurisée.
2. Configurer `babel-plugin-transform-remove-console` pour supprimer automatiquement tous les `console.*` du build de production.
3. Alternative : créer un logger conditionnel :

```typescript
// lib/logger.ts
const isDev = __DEV__;

export const logger = {
  error: (tag: string, error: unknown) => {
    if (isDev) console.error(`[${tag}]`, error);
    // En production : envoyer à Sentry/Bugsnag sans données PII
  },
  log: (tag: string, message: string) => {
    if (isDev) console.log(`[${tag}]`, message);
  },
};
```

### Priorité 4 — MOYENNE : Audit des `JSON.stringify` sur erreurs

Remplacer les 2 occurrences de `JSON.stringify(uploadError)` et `JSON.stringify(dbError)` dans `AjouterBienModal.tsx` par un logging structuré qui filtre les champs sensibles.

---

## F. Score de Risque Global

| Critère | Score |
|---|---|
| **Fuite d'information technique** | 9/10 |
| **Escalade de privilèges (rôle côté client)** | 8/10 |
| **Surface d'attaque (journalisation)** | 7/10 |
| **Facilité d'exploitation** | 8/10 |
| **Impact métier** | 7/10 |
| **Score global** | **7.8/10 — ÉLEVÉ** |

---

## G. Méthodologie

- Analyse statique exhaustive via `ripgrep` de tous les fichiers `.tsx` et `.ts` dans `app/` (16 fichiers), `lib/` (4 fichiers), `components/` (25 fichiers)
- Patterns recherchés : `error.message`, `Alert.alert`, `console.error`, `console.log`, `console.warn`, `catch(`, `user_metadata`, `.role`, `JSON.stringify`
- Vérification manuelle de chaque occurrence pour classification de sévérité
- Aucun test dynamique (analyse statique uniquement)

---

*Fin du rapport — Document confidentiel à diffusion restreinte*
