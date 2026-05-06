# Rapport d'Audit de Sécurité — Dépendances & Supply Chain

**Projet :** Imovia  
**Date :** 6 mai 2026  
**Périmètre :** `frontend/site`, `frontend/application`, `backend`, racine  
**Auditeur :** Audit automatisé (npm audit + analyse manuelle)

---

## Résumé Exécutif

| Composant | Vulnérabilités HIGH | Vulnérabilités MODERATE | Total |
|---|---|---|---|
| `frontend/site` | 8 | 3 | **11** |
| `frontend/application` | 4 | 8 | **12** |
| `backend` | 0 | 0 | **0** |
| Racine (`/`) | — | — | **Lockfile manquant** |

**Verdict global : RISQUE ÉLEVÉ** — Plusieurs vulnérabilités critiques sur les composants exposés au réseau (Next.js, Hono) avec des vecteurs d'attaque exploitables à distance sans authentification.

---

## 1. Vulnérabilités Connues (CVE / GHSA)

### 1.1 `frontend/site` — 11 vulnérabilités

#### HAUTE SÉVÉRITÉ

| Paquet | Version installée | Vulnérabilité | CVSS | Référence |
|---|---|---|---|---|
| **next** | 16.1.6 | DoS via Server Components | 7.5 | [GHSA-q4gf-8mx6-v5v3](https://github.com/advisories/GHSA-q4gf-8mx6-v5v3) |
| **next** | 16.1.6 | HTTP Request Smuggling via rewrites | — | [GHSA-ggv3-7p47-pfv8](https://github.com/advisories/GHSA-ggv3-7p47-pfv8) |
| **next** | 16.1.6 | Bypass CSRF sur Server Actions (null origin) | — | [GHSA-mq59-m269-xvcx](https://github.com/advisories/GHSA-mq59-m269-xvcx) |
| **next** | 16.1.6 | Disk cache exhaustion via next/image | — | [GHSA-3x4c-7xq6-9pq8](https://github.com/advisories/GHSA-3x4c-7xq6-9pq8) |
| **next** | 16.1.6 | DoS via postponed resume buffering | — | [GHSA-h27x-g6w4-24gq](https://github.com/advisories/GHSA-h27x-g6w4-24gq) |
| **hono** | 4.11.10 | Accès fichiers arbitraire via serveStatic | 7.5 | [GHSA-q5qw-h33p-qvwr](https://github.com/advisories/GHSA-q5qw-h33p-qvwr) |
| **hono** | 4.11.10 | Prototype Pollution via parseBody `__proto__` | 4.8 | [GHSA-v8w9-8mx6-g223](https://github.com/advisories/GHSA-v8w9-8mx6-g223) |
| **hono** | 4.11.10 | Cookie Injection, SSE Injection, Path Traversal, HTML Injection (10 CVEs) | 4.3–7.5 | Multiples GHSA (voir ci-dessous) |
| **@hono/node-server** | 1.19.9 | Bypass d'autorisation via slashes encodés dans serveStatic | 7.5 | [GHSA-wc8c-qw6v-h7f6](https://github.com/advisories/GHSA-wc8c-qw6v-h7f6) |
| **flatted** | 3.3.3 | DoS par récursion infinie + Prototype Pollution via parse() | 7.5 | [GHSA-25h7-pfq9-p65f](https://github.com/advisories/GHSA-25h7-pfq9-p65f), [GHSA-rf6f-7fwh-wjgh](https://github.com/advisories/GHSA-rf6f-7fwh-wjgh) |
| **minimatch** | 10.2.2 | ReDoS via GLOBSTAR et extglobs | 7.5 | [GHSA-7r86-cg39-jmmj](https://github.com/advisories/GHSA-7r86-cg39-jmmj), [GHSA-23c5-xmqv-rm74](https://github.com/advisories/GHSA-23c5-xmqv-rm74) |
| **picomatch** | 2.3.1 | ReDoS via extglob quantifiers + Method Injection | 7.5 | [GHSA-c2c7-rcm5-vvqj](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj) |
| **path-to-regexp** | 6.3.0 | DoS via sequential optional groups | 7.5 | [GHSA-j3q9-mxjg-w52f](https://github.com/advisories/GHSA-j3q9-mxjg-w52f) |
| **express-rate-limit** | 8.2.1 | Bypass du rate limiting via IPv4-mapped IPv6 | 7.5 | [GHSA-46wh-pxpv-q5gq](https://github.com/advisories/GHSA-46wh-pxpv-q5gq) |

#### SÉVÉRITÉ MODÉRÉE

| Paquet | Version installée | Vulnérabilité | CVSS | Référence |
|---|---|---|---|---|
| **postcss** | 8.5.6 | XSS via `</style>` non échappé | 6.1 | [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) |
| **brace-expansion** | 5.0.3 | DoS par hang mémoire (zero-step sequence) | 6.5 | [GHSA-f886-m6hf-6m8v](https://github.com/advisories/GHSA-f886-m6hf-6m8v) |
| **ip-address** | 10.0.1 | XSS dans Address6 HTML-emitting methods | — | [GHSA-v2v4-37r5-5v8g](https://github.com/advisories/GHSA-v2v4-37r5-5v8g) |

---

### 1.2 `frontend/application` — 12 vulnérabilités

#### HAUTE SÉVÉRITÉ

| Paquet | Version installée | Vulnérabilité | CVSS | Référence |
|---|---|---|---|---|
| **@xmldom/xmldom** | 0.8.11 | 5 vulnérabilités : DoS récursion, XML injection (DocumentType, PI, Comment, CDATA) | 7.5 | [GHSA-2v35-w6hq-6mfw](https://github.com/advisories/GHSA-2v35-w6hq-6mfw), [GHSA-f6ww-3ggp-fr8h](https://github.com/advisories/GHSA-f6ww-3ggp-fr8h), [GHSA-x6wf-f3px-wcqx](https://github.com/advisories/GHSA-x6wf-f3px-wcqx), [GHSA-j759-j44w-7fr8](https://github.com/advisories/GHSA-j759-j44w-7fr8), [GHSA-wh4c-j3r5-mjhp](https://github.com/advisories/GHSA-wh4c-j3r5-mjhp) |
| **flatted** | 3.3.3 | DoS récursion infinie + Prototype Pollution | 7.5 | [GHSA-25h7-pfq9-p65f](https://github.com/advisories/GHSA-25h7-pfq9-p65f), [GHSA-rf6f-7fwh-wjgh](https://github.com/advisories/GHSA-rf6f-7fwh-wjgh) |
| **minimatch** | 3.1.2 / 9.0.5 / 10.2.1 | ReDoS multiples (GLOBSTAR, extglobs, wildcards) | 7.5 | [GHSA-7r86-cg39-jmmj](https://github.com/advisories/GHSA-7r86-cg39-jmmj), [GHSA-23c5-xmqv-rm74](https://github.com/advisories/GHSA-23c5-xmqv-rm74), [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26) |
| **picomatch** | 2.3.1 / 4.0.3 | ReDoS + Method Injection | 7.5 | [GHSA-c2c7-rcm5-vvqj](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj) |

#### SÉVÉRITÉ MODÉRÉE

| Paquet | Version installée | Vulnérabilité | CVSS | Référence |
|---|---|---|---|---|
| **postcss** | 8.4.49 | XSS via `</style>` non échappé | 6.1 | [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) |
| **brace-expansion** | 1.1.12 / 2.0.2 / 5.0.2 | DoS hang mémoire (3 versions vulnérables) | 6.5 | [GHSA-f886-m6hf-6m8v](https://github.com/advisories/GHSA-f886-m6hf-6m8v) |
| **ajv** | 6.12.6 | ReDoS avec option `$data` | — | [GHSA-2g4f-4pwh-qvx6](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6) |
| **yaml** | 2.8.2 | Stack Overflow via collections YAML profondément imbriquées | 4.3 | [GHSA-48c2-rrv3-qjmp](https://github.com/advisories/GHSA-48c2-rrv3-qjmp) |
| **expo** (transitif) | ~54.0.33 | Vulnérable via @expo/metro-config → postcss | — | Transitif |

### 1.3 `backend` — 0 vulnérabilité

Le backend n'a que 2 dépendances transitives (`@supabase/supabase-js`, `dotenv`). **Aucune vulnérabilité connue détectée.**

---

## 2. Lockfile & Dependency Confusion

### 2.1 Lockfile manquant à la racine

| Problème | Sévérité | Détails |
|---|---|---|
| **Pas de `package-lock.json` à la racine** | **HAUTE** | Le fichier `/package.json` racine déclare `supabase` et `expo-linear-gradient` mais n'a **aucun lockfile**. Cela permet une attaque de type **dependency confusion** : un attaquant pourrait publier une version malveillante sur npm qui serait installée à la place de la version légitime. |

**Correction :** Exécuter `npm install` à la racine pour générer le lockfile, puis le committer dans le dépôt.

### 2.2 Noms de paquets génériques sans scope

| Paquet | Fichier | `private` | Risque |
|---|---|---|---|
| `"site"` | `frontend/site/package.json` | `true` | Faible (protégé par `private: true`) |
| `"application"` | `frontend/application/package.json` | `true` | Faible (protégé par `private: true`) |
| `"backend"` | `backend/package.json` | **`false`** | **MOYEN** — Le champ `private` est absent/false |

**Risque :** Le paquet `backend` avec `"private": false` (implicitement `"license": "ISC"`) pourrait théoriquement être publié sur npm par erreur. Un attaquant pourrait réclamer le nom `backend` sur npm pour mener une attaque de dependency confusion si un CI exécute `npm install` sans registre privé.

**Correction :**
- Ajouter `"private": true` dans `backend/package.json`
- Utiliser un scope npm pour tous les paquets internes : `@imovia/backend`, `@imovia/site`, etc.

### 2.3 Absence de `.npmrc`

Aucun fichier `.npmrc` n'est présent dans le projet. Cela signifie :
- Pas de restriction de registre (tout provient de `registry.npmjs.org` par défaut)
- Pas de `package-lock=true` forcé
- Pas de `ignore-scripts=true` pour bloquer les lifecycle hooks malveillants

---

## 3. Scripts & Lifecycle Hooks

### 3.1 Analyse des scripts

| Composant | Scripts | Lifecycle Hooks dangereux | Verdict |
|---|---|---|---|
| `frontend/site` | `dev`, `build`, `start`, `lint` | Aucun | OK |
| `frontend/application` | `start`, `reset-project`, `android`, `ios`, `web`, `lint` | Aucun | OK |
| `backend` | `check:syntax`, `test:flow`, `test` | Aucun | OK |
| Racine | (aucun) | Aucun | OK |

**Aucun `preinstall`, `postinstall`, `prepare` ou `prepublish` détecté.** Les scripts existants sont standards et non suspects.

### 3.2 Script notable

Le script `reset-project` dans `frontend/application` exécute `node ./scripts/reset-project.js`. Ce fichier devrait être audité manuellement pour vérifier qu'il ne contient pas d'opérations destructives non intentionnelles.

---

## 4. Surface d'attaque — Dépendances inutiles

### 4.1 Dépendances transitives

| Composant | Dépendances directes | Dépendances transitives totales |
|---|---|---|
| `frontend/site` | 20 | ~31 |
| `frontend/application` | 40 | ~45 |
| `backend` | 2 | ~14 |

### 4.2 Observations

| Problème | Sévérité | Détails |
|---|---|---|
| **`hono` comme dépendance transitive de Next.js** | **INFO** | `hono` 4.11.10 est tiré en transitif par Next.js 16.1.6 (serveur interne). Les 10 CVEs Hono impactent directement le serveur Next.js. |
| **`@types/jszip` inutile** | **BASSE** | `jszip` v3.10.1 inclut ses propres types depuis la v3.x. Le paquet `@types/jszip` (deprecated) est superflu et augmente la surface d'attaque en dev. |
| **`radix-ui` ET `@radix-ui/*` en doublon** | **BASSE** | `frontend/site` importe à la fois `radix-ui` (meta-paquet) et des paquets `@radix-ui/*` individuels. Cela double les dépendances sans nécessité. |
| **`typescript` en prod dans `application`** | **BASSE** | TypeScript est listé dans `dependencies` ET `devDependencies` dans `frontend/application`. Il ne devrait être qu'en `devDependencies`. |
| **`react-native-url-polyfill`** | **INFO** | Ce polyfill est souvent inutile avec les versions modernes de React Native (0.81+) qui supportent `URL` nativement. À vérifier. |

---

## 5. Subresource Integrity (SRI)

**Aucune configuration SRI détectée.** 

Pour le site Next.js déployé en production :
- Next.js génère des hashes pour les assets statiques via son système de build, mais cela ne couvre pas les scripts tiers éventuellement chargés via `<Script>` ou `next/script`.
- Vérifier que tous les scripts tiers (analytics, widgets, etc.) utilisent l'attribut `integrity` avec un hash SHA-384/SHA-512.

---

## 6. Correctifs Recommandés

### PRIORITÉ CRITIQUE (à faire immédiatement)

| # | Action | Commande / Détail |
|---|---|---|
| 1 | **Mettre à jour Next.js** 16.1.6 → **16.2.4+** | `cd frontend/site && npm install next@latest` — Corrige 6 vulnérabilités dont le DoS Server Components (CVSS 7.5), le CSRF bypass et le HTTP smuggling. |
| 2 | **Ajouter `private: true`** dans `backend/package.json` | Empêche la publication accidentelle sur npm. |
| 3 | **Générer le lockfile racine** | `cd / && npm install --package-lock-only` puis committer `package-lock.json`. |

### PRIORITÉ HAUTE

| # | Action | Commande / Détail |
|---|---|---|
| 4 | **Mettre à jour `@xmldom/xmldom`** → 0.8.13+ | `npm audit fix` dans `frontend/application` — Corrige 5 vulnérabilités d'injection XML. |
| 5 | **Forcer `minimatch` ≥ 10.2.3** | Ajouter dans `overrides` de chaque `package.json` : `"minimatch": ">=10.2.3"` |
| 6 | **Forcer `flatted` ≥ 3.4.2+** (si disponible) | Via overrides. Sinon, vérifier que parse() n'est pas exposé à des données utilisateur. |
| 7 | **Forcer `picomatch` ≥ 2.3.2 / 4.0.4** | Via overrides. |
| 8 | **Exécuter `npm audit fix`** sur `frontend/site` | Corrige automatiquement `brace-expansion`, `express-rate-limit`, `ip-address` et autres. |

### PRIORITÉ MOYENNE

| # | Action | Détail |
|---|---|---|
| 9 | **Créer un `.npmrc` global** | Contenu recommandé : `package-lock=true`, `ignore-scripts=true`, `audit=true` |
| 10 | **Supprimer `@types/jszip`** de `devDependencies` (site) | Paquet déprécié, types inclus nativement. |
| 11 | **Dédupliquer `radix-ui`** | Garder soit `radix-ui` soit les imports `@radix-ui/*` individuels. |
| 12 | **Déplacer `typescript` en devDependencies** (application) | Ne doit pas être dans `dependencies` en production. |
| 13 | **Mettre à jour `yaml`** → 2.8.3+ dans application | Corrige le Stack Overflow. |
| 14 | **Mettre à jour `postcss`** → 8.5.10+ | Corrige le XSS. Pour `site`, passe par la mise à jour de Next.js. Pour `application`, via overrides expo. |

### PRIORITÉ BASSE

| # | Action | Détail |
|---|---|---|
| 15 | Évaluer si `react-native-url-polyfill` est encore nécessaire | React Native 0.81 supporte `URL` nativement. |
| 16 | Ajouter des scopes `@imovia/` pour les paquets internes | Protection supplémentaire contre la dependency confusion. |
| 17 | Configurer Dependabot ou Renovate | Alertes automatiques sur les nouvelles CVEs. |

---

## 7. Résumé des Risques par Vecteur d'Attaque

| Vecteur | Impact | Composants affectés | Exploitabilité |
|---|---|---|---|
| **DoS distant (sans auth)** | Haute | Next.js, flatted, minimatch, picomatch, brace-expansion, path-to-regexp, yaml | Facile — requêtes HTTP crafted |
| **Accès fichiers arbitraire** | Haute | Hono serveStatic (via Next.js) | Facile — path traversal via URL |
| **Bypass CSRF** | Haute | Next.js Server Actions | Moyenne — nécessite null origin |
| **HTTP Request Smuggling** | Haute | Next.js rewrites | Moyenne — nécessite proxy reverse |
| **Injection XML** | Haute | @xmldom/xmldom | Moyenne — si XML utilisateur traité |
| **Prototype Pollution** | Haute | flatted, hono | Moyenne — dépend du contexte |
| **Bypass rate limiting** | Haute | express-rate-limit | Facile — IPv4-mapped IPv6 |
| **XSS** | Moyenne | postcss, ip-address | Faible — contexte SSR/build |
| **Dependency confusion** | Moyenne | Racine (no lockfile), backend (non private) | Moyenne — nécessite publication npm |

---

## 8. Conclusion

Le projet Imovia présente **23 vulnérabilités connues** réparties sur les deux frontends. Les plus critiques sont :

1. **Next.js 16.1.6** — 6 vulnérabilités dont un DoS exploitable à distance (CVSS 7.5) et un bypass CSRF. La mise à jour vers 16.2.4+ est **urgente**.
2. **Hono 4.11.10** (transitive via Next.js) — 10 vulnérabilités incluant un accès fichier arbitraire. Résolu par la mise à jour de Next.js.
3. **@xmldom/xmldom 0.8.11** — 5 vulnérabilités d'injection XML. Mise à jour vers 0.8.13+ requise.
4. **Lockfile manquant à la racine** — Risque de dependency confusion.
5. **`backend` sans `private: true`** — Risque de publication accidentelle.

Le backend est sain. La priorité immédiate est la mise à jour de Next.js et la sécurisation de la supply chain (lockfiles, `.npmrc`, `private: true`).
