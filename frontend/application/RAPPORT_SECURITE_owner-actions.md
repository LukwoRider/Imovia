# Rapport d'audit de sécurité — `owner-actions.ts`

**Fichier audité :** `lib/supabase/owner-actions.ts`
**Date :** 6 mai 2026
**Périmètre :** Analyse statique du code côté client (actions propriétaire)
**Niveau de confiance :** Élevé (code source complet disponible, analyse ligne par ligne)

---

## Résumé exécutif

Le fichier `owner-actions.ts` expose **6 fonctions** constituant l'ensemble des opérations propriétaire de l'application Imovia. L'audit révèle **3 vulnérabilités critiques**, **2 élevées** et **1 moyenne**, portant principalement sur l'absence de contrôle d'accès côté applicatif, la fuite massive de données personnelles, et des vecteurs d'usurpation d'identité (IDOR).

| Sévérité | Nombre |
|----------|--------|
| 🔴 CRITIQUE | 3 |
| 🟠 ÉLEVÉE | 2 |
| 🟡 MOYENNE | 1 |

---

## Vulnérabilités détaillées

---

### VULN-01 — Fuite massive de données personnelles (PII) via `getPotentialTenants()`

**Sévérité : 🔴 CRITIQUE**
**Lignes :** 221–234
**CWE :** CWE-200 (Exposure of Sensitive Information), CWE-862 (Missing Authorization)

#### Description

```typescript
export async function getPotentialTenants() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tenant')
        .order('full_name', { ascending: true });
    // ...
    return data;
}
```

Cette fonction effectue un `SELECT *` sur la table `profiles` filtrée par `role = 'tenant'`. Elle ne vérifie **ni l'authentification** (aucun appel à `getUser()`), **ni le rôle** de l'appelant, **ni aucune relation** entre l'appelant et les locataires retournés.

#### Impact

- **Tout utilisateur authentifié** (y compris un simple locataire) peut récupérer l'intégralité des profils de tous les locataires de la plateforme.
- Les données exposées incluent potentiellement : `full_name`, `email`, `phone`, `avatar_url`, `address`, `created_at`, et tout autre champ de la table `profiles`.
- C'est une violation directe du RGPD (art. 5 — minimisation des données) et constitue un vecteur d'énumération de la base utilisateur complète.

#### Recommandation

```typescript
export async function getPotentialTenants() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilisateur non authentifié");

    // Vérifier que l'appelant est bien un propriétaire
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'owner') {
        throw new Error("Accès non autorisé");
    }

    // Ne retourner que les champs strictement nécessaires
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'tenant')
        .order('full_name', { ascending: true });

    if (error) throw new Error("Erreur lors de la récupération des locataires");
    return data;
}
```

---

### VULN-02 — Usurpation d'identité propriétaire via `onboardTenant()` (IDOR)

**Sévérité : 🔴 CRITIQUE**
**Lignes :** 170–219
**CWE :** CWE-639 (Authorization Bypass Through User-Controlled Key), CWE-284 (Improper Access Control)

#### Description

```typescript
export async function onboardTenant(data: {
    propertyId: string;
    ownerId: string;    // ⚠️ Fourni par le CALLER
    tenantId: string;
    // ...
}) {
    const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .insert({
            property_id: data.propertyId,
            owner_id: data.ownerId,     // ⚠️ Aucune vérification
            // ...
        })
```

Le champ `owner_id` est accepté directement depuis les paramètres de l'appelant sans **aucune vérification** que la valeur correspond à `auth.uid()`. De plus :

- `propertyId` n'est pas validé comme appartenant au propriétaire authentifié.
- `tenantId` n'est pas validé comme étant un utilisateur existant avec le rôle `tenant`.
- Aucun appel à `supabase.auth.getUser()` n'est effectué dans cette fonction.

#### Impact

- Un attaquant peut créer des baux **au nom d'un autre propriétaire** en fournissant un `ownerId` arbitraire.
- Un attaquant peut lier n'importe quel bien à n'importe quel locataire.
- La ligne 213–216 met à jour le statut du bien en `'rented'` **sans vérification de propriété** (`owner_id` non filtré) :

```typescript
await supabase
    .from('properties')
    .update({ status: 'rented' })
    .eq('id', data.propertyId);  // Pas de .eq('owner_id', user.id)
```

Ceci permet à un attaquant de modifier le statut de n'importe quel bien de la plateforme.

#### Recommandation

```typescript
export async function onboardTenant(data: {
    propertyId: string;
    tenantId: string;
    startDate: string;
    rentAmount: number;
    chargesAmount: number;
    paymentDay: number;
}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilisateur non authentifié");

    // Valider que le bien appartient au propriétaire authentifié
    const { data: property } = await supabase
        .from('properties')
        .select('id')
        .eq('id', data.propertyId)
        .eq('owner_id', user.id)
        .single();

    if (!property) throw new Error("Bien introuvable ou non autorisé");

    const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .insert({
            property_id: data.propertyId,
            owner_id: user.id,  // Toujours utiliser l'ID authentifié
            // ...
        })
        .select()
        .maybeSingle();

    // ... puis mise à jour du statut avec filtre owner_id :
    await supabase
        .from('properties')
        .update({ status: 'rented' })
        .eq('id', data.propertyId)
        .eq('owner_id', user.id);

    return lease;
}
```

---

### VULN-03 — Énumération de profils et phishing via `sendNotification()`

**Sévérité : 🔴 CRITIQUE**
**Lignes :** 14–41
**CWE :** CWE-862 (Missing Authorization), CWE-1270 (Generation of Incorrect Security Identifiers)

#### Description

```typescript
export async function sendNotification(
    userId: string,       // ⚠️ N'importe quel UUID cible
    title: string,        // ⚠️ Contenu libre
    message: string,      // ⚠️ Contenu libre
    type: Notification['type'] = 'info',
    link?: string         // ⚠️ URL libre — vecteur de phishing
) {
    // ...
    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            sender_id: currentUser?.id,
            title,
            message,
            type,
            link
        });
```

N'importe quel utilisateur authentifié peut envoyer une notification **à n'importe quel autre utilisateur** de la plateforme. Les champs `title`, `message`, `type` et `link` sont entièrement contrôlés par l'appelant.

#### Impact

- **Phishing interne** : un attaquant peut envoyer un message de type `'payment'` ou `'warning'` avec un `link` malveillant pointant vers un site de phishing externe.
- **Spam massif** : aucun rate limiting, un script peut bombarder tous les utilisateurs.
- **Usurpation de confiance** : le type `'warning'` donne au message une apparence officielle côté UI.
- **Énumération d'utilisateurs** : en testant différents UUID comme `userId`, un attaquant peut déterminer quels UUID correspondent à des comptes existants (l'insert réussira ou échouera selon les contraintes FK).

#### Recommandation

- Vérifier que l'appelant a une relation légitime avec le destinataire (co-locataire, propriétaire du bail, etc.).
- Créer les notifications uniquement côté serveur (Edge Function ou Database Function) et non côté client.
- Filtrer/sanitiser le champ `link` (whitelist de domaines internes uniquement).
- Limiter les types de notification utilisables par l'appelant.

---

### VULN-04 — Énumération de locataires par email via `searchTenantByEmail()`

**Sévérité : 🟠 ÉLEVÉE**
**Lignes :** 157–168
**CWE :** CWE-200 (Information Exposure), CWE-250 (Execution with Unnecessary Privileges)

#### Description

```typescript
export async function searchTenantByEmail(email: string) {
    const { data, error } = await supabase.rpc('get_profile_by_email', {
        p_email: email.toLowerCase().trim()
    });
    // ...
    return data;
}
```

Cette fonction appelle une RPC `get_profile_by_email` qui est vraisemblablement définie en `SECURITY DEFINER` côté PostgreSQL (bypass complet du RLS). Aucune vérification d'authentification ni de rôle n'est effectuée côté applicatif.

#### Impact

- **Énumération d'emails** : un attaquant peut tester l'existence de n'importe quel email dans la base.
- **Fuite de PII** : la RPC retourne probablement le profil complet (nom, téléphone, avatar, etc.).
- L'utilisation de `SECURITY DEFINER` signifie que même si le RLS protège la table `profiles`, cette fonction le contourne entièrement.

#### Recommandation

- Ajouter une vérification d'authentification (`getUser()`).
- Vérifier le rôle de l'appelant (seul un `owner` devrait pouvoir rechercher).
- Limiter les champs retournés par la RPC au strict minimum (`id`, `full_name`, `email`).
- Envisager un rate limiting sur cette RPC côté Supabase (pg_net ou Edge Function).
- Revoir si `SECURITY DEFINER` est vraiment nécessaire ; préférer `SECURITY INVOKER` si le RLS peut être configuré adéquatement.

---

### VULN-05 — Mass assignment potentiel dans `updateLease()`

**Sévérité : 🟠 ÉLEVÉE**
**Lignes :** 107–131
**CWE :** CWE-915 (Improperly Controlled Modification of Dynamically-Determined Object Attributes)

#### Description

```typescript
export async function updateLease(leaseId: string, updates: {
    rent_amount?: number;
    charges_amount?: number;
    deposit_amount?: number;
    start_date?: string;
    payment_day?: number;
}) {
    // ...
    const { data, error } = await supabase
        .from('leases')
        .update(updates)    // ⚠️ L'objet entier est passé directement
        .eq('id', leaseId)
        .eq('owner_id', user.id)
        .select()
        .maybeSingle();
```

Bien que la signature TypeScript définisse un type restreint, **TypeScript n'est pas une barrière de sécurité** — le typage est effacé à la compilation. Au runtime, l'objet `updates` peut contenir n'importe quel champ additionnel.

#### Impact

Un attaquant peut injecter des champs non autorisés dans l'objet `updates`, par exemple :
- `{ status: 'active', owner_id: 'attacker-uuid' }` — réactiver un bail terminé ou s'en attribuer la propriété.
- `{ tenant_id: 'other-tenant' }` — modifier le locataire associé.

Le filtre `.eq('owner_id', user.id)` protège partiellement, mais l'injection du champ `owner_id` dans l'UPDATE pourrait court-circuiter cette protection selon l'implémentation Supabase/PostgREST.

#### Recommandation

```typescript
const allowedFields = ['rent_amount', 'charges_amount', 'deposit_amount', 'start_date', 'payment_day'] as const;

const sanitizedUpdates: Record<string, unknown> = {};
for (const key of allowedFields) {
    if (updates[key] !== undefined) {
        sanitizedUpdates[key] = updates[key];
    }
}

const { data, error } = await supabase
    .from('leases')
    .update(sanitizedUpdates)
    .eq('id', leaseId)
    .eq('owner_id', user.id)
    .select()
    .maybeSingle();
```

---

### VULN-06 — Paramètre `propertyId` non dérivé du bail dans `terminateLease()`

**Sévérité : 🟡 MOYENNE**
**Lignes :** 43–105 (spécifiquement 67–71)
**CWE :** CWE-639 (Authorization Bypass Through User-Controlled Key)

#### Description

```typescript
export async function terminateLease(leaseId: string, propertyId: string) {
    // ...
    // Ligne 49-55 : Mise à jour du bail — CORRECT, filtre owner_id ✓
    const { data: updatedLease, error: leaseError } = await supabase
        .from('leases')
        .update({ status: 'ended' })
        .eq('id', leaseId)
        .eq('owner_id', user.id)  // ✓ Bon contrôle
        // ...

    // Ligne 67-71 : Mise à jour du bien — propertyId non dérivé du bail
    const { error: propError } = await supabase
        .from('properties')
        .update({ status: 'available' })
        .eq('id', propertyId)           // ⚠️ Paramètre externe
        .eq('owner_id', user.id);       // ✓ Atténuation partielle
```

Le `propertyId` est fourni en paramètre par l'appelant et n'est pas dérivé du bail qui vient d'être terminé. Cependant, la présence du filtre `.eq('owner_id', user.id)` atténue significativement le risque : l'attaquant ne peut cibler que **ses propres biens**.

#### Impact

Un propriétaire malveillant pourrait terminer un bail et simultanément mettre en `'available'` un **autre** de ses propres biens (incohérence de données). Ce n'est pas un dépassement de privilèges mais une altération logique de l'état des données.

De plus, lignes 84–88, la requête de récupération des données du bien pour la notification utilise le même `propertyId` non validé, ce qui pourrait mener à un message de notification erroné.

#### Recommandation

```typescript
// Dériver le propertyId du bail terminé
const { data: updatedLease, error: leaseError } = await supabase
    .from('leases')
    .update({ status: 'ended' })
    .eq('id', leaseId)
    .eq('owner_id', user.id)
    .select('id, status, property_id')  // ← Récupérer le property_id
    .maybeSingle();

if (!updatedLease) { /* ... */ }

// Utiliser le property_id issu du bail
await supabase
    .from('properties')
    .update({ status: 'available' })
    .eq('id', updatedLease.property_id)
    .eq('owner_id', user.id);
```

---

## Observations complémentaires

### Absence de validation côté serveur

Toutes ces fonctions s'exécutent **côté client** via le SDK Supabase. La sécurité repose donc entièrement sur les politiques RLS (Row Level Security) de Supabase. Or :

- Si la politique RLS sur `notifications` INSERT est `WITH CHECK (true)`, aucun contrôle n'est appliqué — VULN-01 est alors pleinement exploitable.
- Si la politique RLS sur `leases` INSERT ne vérifie pas `owner_id = auth.uid()`, VULN-02 est pleinement exploitable.

**Recommandation globale :** les opérations sensibles (création de bail, envoi de notifications, recherche de profils) doivent être migrées vers des **Edge Functions** ou des **Database Functions** sécurisées côté serveur.

### Journalisation d'informations sensibles

Plusieurs fonctions utilisent `console.error` avec des détails techniques (lignes 36, 44, 63, 74, 100, 229). En environnement navigateur, ces logs sont visibles dans les DevTools et peuvent révéler des informations utiles à un attaquant.

### Absence de validation des entrées

Aucune des fonctions ne valide le format des entrées :
- Pas de validation de format UUID pour les identifiants (`leaseId`, `propertyId`, `userId`, `tenantId`, `ownerId`).
- Pas de validation numérique pour `rentAmount`, `chargesAmount`, `paymentDay` (valeurs négatives ? zéro ?).
- Pas de validation de format de date pour `startDate`.

---

## Matrice de risque

| Réf | Fonction | Vulnérabilité | Sévérité | Exploitabilité | Impact |
|-----|----------|---------------|----------|----------------|--------|
| VULN-01 | `sendNotification` | Notification arbitraire / Phishing | 🔴 Critique | Facile | Élevé |
| VULN-02 | `onboardTenant` | IDOR — usurpation de propriétaire | 🔴 Critique | Facile | Très élevé |
| VULN-03 | `getPotentialTenants` | Fuite de PII massive | 🔴 Critique | Triviale | Très élevé |
| VULN-04 | `searchTenantByEmail` | Énumération + fuite PII via RPC | 🟠 Élevée | Facile | Élevé |
| VULN-05 | `updateLease` | Mass assignment | 🟠 Élevée | Moyenne | Élevé |
| VULN-06 | `terminateLease` | PropertyId non dérivé du bail | 🟡 Moyenne | Facile | Modéré |

---

## Priorisation des corrections

1. **Immédiat (P0)** : VULN-02 (`onboardTenant`) — Ajouter `getUser()`, forcer `owner_id = user.id`, valider la propriété du bien.
2. **Immédiat (P0)** : VULN-03 (`getPotentialTenants`) — Ajouter contrôle de rôle + remplacer `SELECT *` par des colonnes explicites.
3. **Immédiat (P0)** : VULN-01 (`sendNotification`) — Migrer vers une Edge Function côté serveur ou vérifier la relation appelant/destinataire.
4. **Court terme (P1)** : VULN-04 (`searchTenantByEmail`) — Ajouter auth + contrôle de rôle, limiter les champs retournés par la RPC.
5. **Court terme (P1)** : VULN-05 (`updateLease`) — Implémenter un whitelist explicite des champs modifiables.
6. **Moyen terme (P2)** : VULN-06 (`terminateLease`) — Dériver `propertyId` depuis le bail.

---

*Rapport généré le 6 mai 2026 — Audit statique du fichier `owner-actions.ts`*
