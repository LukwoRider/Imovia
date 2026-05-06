# Rapport d'audit de sécurité — `paiements.tsx`

**Fichier audité :** `app/(tabs)/paiements.tsx` et `lib/supabase/owner-actions.ts`
**Date :** 6 mai 2026
**Auditeur :** Pentest Expert — Analyse statique de code
**Périmètre :** Vulnérabilités côté client et interactions Supabase

---

## Résumé exécutif

L'écran de gestion des paiements et d'onboarding de locataires présente **5 vulnérabilités** dont **2 critiques** et **1 haute**. Les problèmes principaux concernent une **fuite de données personnelles massive** (énumération de tous les profils locataires de la plateforme) et une **absence totale de validation des entrées financières**, permettant l'injection de valeurs aberrantes dans la base de données.

| Sévérité | Nombre |
|----------|--------|
| 🔴 Critique | 2 |
| 🟠 Haute | 1 |
| 🟡 Moyenne | 1 |
| 🔵 Faible | 1 |

---

## 🔴 CRITIQUE — CVE-pattern : Énumération massive de données personnelles (IDOR / Data Exposure)

**CVSS estimé : 8.5 — Fichiers concernés :** `owner-actions.ts:221-234`, `paiements.tsx:93-98`

### Description

Lorsqu'un propriétaire ouvre la modale "Ajouter un locataire", la fonction `handleOpenAddModal()` appelle `getPotentialTenants()` qui exécute :

```typescript
const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'tenant')
    .order('full_name', { ascending: true });
```

Cette requête retourne **l'intégralité des profils de tous les locataires inscrits sur la plateforme** — pas uniquement ceux en relation avec le propriétaire. Le `SELECT *` expose tous les champs de la table `profiles` : nom complet, email, téléphone, et potentiellement d'autres données sensibles (adresse, date de naissance, etc.).

### Preuve de concept

1. Se connecter en tant que propriétaire (rôle `owner`).
2. Cliquer sur "Ajouter un locataire".
3. Observer dans la réponse réseau (ou via l'état React) la liste complète de TOUS les locataires de la plateforme avec leurs informations personnelles.
4. Le champ de recherche filtre côté client (`filteredTenants`), ce qui signifie que **toutes les données sont déjà chargées en mémoire**.

### Impact

- **Violation du RGPD** (Art. 5 — Principe de minimisation des données) : exposition de données personnelles à des tiers non autorisés.
- **Énumération d'utilisateurs** : un propriétaire malveillant peut extraire la base complète des locataires (noms, emails, téléphones) à des fins de phishing, spam ou ingénierie sociale.
- **Scalabilité de l'attaque** : sur une plateforme avec 10 000 locataires, un seul appel API suffit.

### Remédiation

```typescript
// AVANT (vulnérable) — retourne TOUS les locataires
export async function getPotentialTenants() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tenant');
    return data;
}

// APRÈS (corrigé) — recherche ciblée par email exact, champs limités
export async function searchTenantByEmailExact(email: string) {
    if (!email || email.length < 5) return [];

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'tenant')
        .eq('email', email.toLowerCase().trim())
        .limit(1);

    if (error) throw new Error("Erreur de recherche");
    return data || [];
}
```

**Actions complémentaires :**
- Remplacer le sélecteur de liste par un champ de saisie d'email avec recherche serveur (debounced).
- Ajouter une Row Level Security (RLS) sur la table `profiles` pour empêcher tout `SELECT` non filtré par un propriétaire.
- Ne jamais utiliser `SELECT *` — spécifier explicitement les colonnes nécessaires (`id`, `full_name`).

---

## 🔴 CRITIQUE — Absence de validation des montants financiers (Business Logic Bypass)

**CVSS estimé : 8.1 — Fichiers concernés :** `paiements.tsx:126-127`, `owner-actions.ts:179-191`

### Description

Les montants de loyer et de charges sont parsés avec un fallback silencieux à zéro :

```typescript
rentAmount: parseInt(onboardingForm.rentAmount) || 0,
chargesAmount: parseInt(onboardingForm.chargesAmount) || 0,
```

Il n'existe **aucune validation** côté client ni côté serveur (la fonction `onboardTenant` dans `owner-actions.ts` insère directement les valeurs reçues). Un propriétaire malveillant peut :

1. **Créer un bail à 0€ de loyer** — contournant toute logique métier de loyer minimum.
2. **Injecter des valeurs négatives** — `parseInt("-500")` retourne `-500`, ce qui est truthy et passe le `|| 0`. Un loyer négatif peut corrompre les calculs de paiement, créer des "crédits" fictifs.
3. **Injecter des valeurs excessives** — aucun plafond n'est vérifié.

### Preuve de concept

```javascript
// Via la console ou en interceptant la requête réseau
// Injecter un loyer négatif
onboardTenant({
    propertyId: "...",
    ownerId: "...",
    tenantId: "...",
    startDate: "2026-05-01",
    rentAmount: -99999,     // Loyer négatif
    chargesAmount: -500,    // Charges négatives
    paymentDay: 5
});
```

### Impact

- **Corruption de données financières** : des montants négatifs ou nuls dans la table `leases` faussent tous les calculs de paiements, quittances, et soldes.
- **Fraude potentielle** : un propriétaire pourrait créer un bail fictif avec des montants manipulés.
- **Effet cascade** : si d'autres modules (génération de quittances, rappels de paiement, comptabilité) se basent sur `rent_amount`, les montants aberrants se propagent.

### Remédiation

**Côté client (première barrière) :**
```typescript
const validateFinancialInputs = () => {
    const rent = parseInt(onboardingForm.rentAmount);
    const charges = parseInt(onboardingForm.chargesAmount);

    if (isNaN(rent) || rent < 1 || rent > 50000) {
        Alert.alert("Erreur", "Le loyer doit être compris entre 1€ et 50 000€.");
        return false;
    }
    if (isNaN(charges) || charges < 0 || charges > 10000) {
        Alert.alert("Erreur", "Les charges doivent être comprises entre 0€ et 10 000€.");
        return false;
    }
    return true;
};
```

**Côté serveur (obligatoire) :**
```typescript
export async function onboardTenant(data: { /* ... */ }) {
    if (data.rentAmount < 1 || data.rentAmount > 50000) {
        throw new Error("Montant de loyer invalide");
    }
    if (data.chargesAmount < 0 || data.chargesAmount > 10000) {
        throw new Error("Montant de charges invalide");
    }
    // ... suite de l'insertion
}
```

**Côté base de données (dernière ligne de défense) :**
```sql
ALTER TABLE leases ADD CONSTRAINT chk_rent_positive CHECK (rent_amount > 0);
ALTER TABLE leases ADD CONSTRAINT chk_charges_non_negative CHECK (charges_amount >= 0);
```

---

## 🟠 HAUTE — Jour de paiement sans validation (Data Integrity / Denial of Service)

**CVSS estimé : 6.8 — Fichiers concernés :** `paiements.tsx:128`, `owner-actions.ts:187`

### Description

Le champ `paymentDay` est parsé sans aucune borne :

```typescript
paymentDay: parseInt(onboardingForm.paymentDay) || 5,
```

Les valeurs acceptées en entrée n'ont aucune limite. Même si la base de données possède une contrainte `CHECK (payment_day BETWEEN 1 AND 28)`, l'erreur PostgreSQL remontée n'est pas traitée de manière explicite — elle tombera dans le `catch` générique qui affiche le message brut de l'erreur Supabase.

### Scénarios d'attaque

| Valeur envoyée | Comportement |
|---|---|
| `0` | Rejeté par la BDD (si CHECK existe), sinon jour invalide |
| `-1` | Potentiellement stocké si pas de CHECK |
| `31` | Rejeté par CHECK — erreur PostgreSQL exposée à l'utilisateur |
| `abc` | `parseInt("abc")` → `NaN` → fallback à `5` (masque l'erreur) |
| `5; DROP TABLE leases--` | `parseInt()` retourne `5` (pas d'injection SQL ici grâce à Supabase) |

### Impact

- **Fuite d'information** : le message d'erreur PostgreSQL brut peut révéler des détails sur le schéma de la base (nom de contrainte, nom de table).
- **Expérience utilisateur dégradée** : erreur incompréhensible pour l'utilisateur final.
- **Risque d'intégrité** : si la contrainte CHECK est un jour retirée, aucune autre barrière n'empêche les valeurs aberrantes.

### Remédiation

```typescript
const paymentDay = parseInt(onboardingForm.paymentDay);
if (isNaN(paymentDay) || paymentDay < 1 || paymentDay > 28) {
    Alert.alert("Erreur", "Le jour de paiement doit être entre 1 et 28.");
    return;
}
```

---

## 🟡 MOYENNE — Affichage des données personnelles dans le sélecteur (UI Data Leakage)

**CVSS estimé : 5.0 — Fichier concerné :** `paiements.tsx:358-375`

### Description

Le sélecteur de locataire affiche en clair `full_name` et `email` pour chaque locataire de la plateforme :

```tsx
<Text style={{ fontWeight: "700", color: "#1e293b" }}>{tenant.full_name}</Text>
<Text style={{ fontSize: 13, color: "#64748b" }}>{tenant.email}</Text>
```

Combiné avec la vulnérabilité critique n°1, cela expose visuellement les données personnelles de tous les locataires. De plus, le filtrage client-side via `filteredTenants` (lignes 36-42) opère sur l'ensemble des données déjà chargées — un simple dump de l'état React (via les DevTools ou l'inspection mémoire) expose la totalité des enregistrements.

### Impact

- Exposition visuelle de données personnelles à des utilisateurs non autorisés.
- Les données sont consultables même sans interaction avec le champ de recherche.

### Remédiation

Cette vulnérabilité est automatiquement résolue si la vulnérabilité critique n°1 est corrigée (passage à une recherche serveur ciblée). En complément :
- Masquer partiellement l'email affiché (ex. : `j***@gmail.com`).
- Ne charger les résultats qu'après saisie d'au moins 3 caractères.

---

## 🔵 FAIBLE — Utilisation de `user!.id` avec assertion non-null (Robustness / Crash Risk)

**CVSS estimé : 3.0 — Fichier concerné :** `paiements.tsx:123`

### Description

```typescript
const { data: { user } } = await supabase.auth.getUser();
await onboardTenant({
    // ...
    ownerId: user!.id,  // <-- assertion non-null dangereuse
    // ...
});
```

L'opérateur `!` (non-null assertion) force TypeScript à considérer que `user` n'est jamais `null`. Si le token d'authentification expire entre l'ouverture de la modale et la soumission du formulaire, `user` sera `null` et `user!.id` provoquera un crash runtime (`TypeError: Cannot read property 'id' of null`).

### Impact

- **Crash de l'application** en cas de session expirée.
- **Pas de vulnérabilité directe**, mais un crash non géré peut laisser l'application dans un état inconsistant.

### Remédiation

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
    Alert.alert("Session expirée", "Veuillez vous reconnecter.");
    return;
}
await onboardTenant({
    ownerId: user.id,  // plus besoin de !
    // ...
});
```

---

## Vulnérabilités complémentaires identifiées

### Absence de Row Level Security (RLS) apparente

La fonction `getPotentialTenants()` effectue un `SELECT *` sur `profiles` sans filtre propriétaire. Si la table `profiles` n'a pas de politique RLS restrictive dans Supabase, **n'importe quel utilisateur authentifié** peut lire tous les profils. Il est indispensable de vérifier les politiques RLS en base.

### `onboardTenant` — Pas de vérification d'autorisation côté serveur

La fonction `onboardTenant()` dans `owner-actions.ts` n'effectue **aucune vérification** que l'`ownerId` reçu correspond bien à l'utilisateur authentifié. Elle fait confiance à la valeur envoyée par le client :

```typescript
// owner-actions.ts:181 — ownerId est inséré tel quel
owner_id: data.ownerId,
```

Un attaquant pourrait manipuler la requête pour insérer l'ID d'un autre propriétaire. La remédiation consiste à récupérer l'`ownerId` côté serveur via `supabase.auth.getUser()` comme c'est fait dans `terminateLease()` et `updateLease()`.

### `SELECT *` sur la table `profiles`

L'utilisation de `SELECT *` (ligne 224 de `owner-actions.ts`) est une mauvaise pratique qui expose potentiellement des colonnes sensibles ajoutées ultérieurement à la table (ex. : hash de mot de passe, token de réinitialisation, données bancaires). Toujours spécifier explicitement les colonnes nécessaires.

---

## Matrice de remédiation priorisée

| Priorité | Vulnérabilité | Effort | Impact |
|----------|--------------|--------|--------|
| **P0** | Énumération des locataires (`getPotentialTenants`) | Moyen | Critique — RGPD |
| **P0** | Validation des montants financiers | Faible | Critique — Intégrité financière |
| **P1** | Vérification `ownerId` côté serveur dans `onboardTenant` | Faible | Haute — Usurpation |
| **P1** | Validation du jour de paiement | Faible | Haute — Intégrité |
| **P2** | Remplacement de `SELECT *` par colonnes explicites | Faible | Moyenne |
| **P2** | Gestion du `user!.id` / session expirée | Faible | Faible |
| **P3** | Audit des politiques RLS Supabase | Moyen | Variable |

---

## Conclusion

Les deux vulnérabilités critiques identifiées (énumération de données personnelles et absence de validation financière) doivent être corrigées **avant toute mise en production**. La fuite de données via `getPotentialTenants()` constitue une violation directe du RGPD et un risque juridique majeur pour la plateforme. L'absence de validation sur les montants financiers ouvre la porte à la corruption de données et potentiellement à la fraude.

La remédiation prioritaire est estimée à **2-3 jours de développement** pour les correctifs P0 et P1, incluant les tests.
