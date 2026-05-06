# Rapport d'Audit de Sécurité — IDOR & Fuites de Données

**Fichier audité :** `app/bien/[id].tsx`
**Date :** 6 mai 2026
**Auditeur :** Pentest Expert (analyse statique)
**Périmètre :** Vulnérabilités IDOR (Insecure Direct Object Reference), fuites de données personnelles (PII), contrôles d'accès côté client

---

## Résumé exécutif

L'analyse du composant `BienDetailPage` révèle **4 vulnérabilités critiques ou hautes** liées à l'absence totale de vérification de propriété (ownership) côté serveur lors des opérations de lecture, modification et suppression de biens immobiliers. Le fichier s'appuie exclusivement sur des vérifications côté client (rôle utilisateur) qui sont triviales à contourner. Un attaquant authentifié peut **supprimer n'importe quel bien**, **consulter les données de n'importe quel bien**, et **accéder aux numéros de téléphone personnels** des propriétaires et locataires.

---

## Vulnérabilité n°1 — Suppression arbitraire de bien (IDOR DELETE)

| Attribut | Valeur |
|---|---|
| **Sévérité** | **CRITIQUE** |
| **Lignes** | 115–131 |
| **CWE** | CWE-639 (Authorization Bypass Through User-Controlled Key) |
| **CVSS 3.1 estimé** | 9.1 (Critique) |

### Description

La fonction `executeDelete` effectue une suppression dans la table `properties` en filtrant uniquement sur l'`id` du bien, récupéré depuis le paramètre d'URL :

```typescript
const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id);
```

**Aucun filtre `owner_id`** n'est appliqué. Il n'y a aucune vérification que l'utilisateur connecté est bien le propriétaire du bien ciblé.

### Vecteur d'attaque (côté client)

Le bouton de suppression (ligne 471–512) est conditionné par `userRole === 'owner' || userRole === 'agency'`. C'est un contrôle **purement cosmétique** côté UI. Un attaquant peut :

1. S'authentifier avec n'importe quel compte ayant le rôle `owner` ou `agency`
2. Naviguer vers `/bien/{ID_VICTIME}` (l'UUID d'un bien appartenant à un autre utilisateur)
3. Le bouton "Supprimer" apparaît car le contrôle est basé sur le rôle, pas sur la propriété du bien
4. Cliquer sur "Supprimer" → le bien de la victime est **définitivement supprimé**

**Variante sans UI :** Un attaquant peut directement invoquer la requête Supabase depuis la console navigateur ou via un script :

```javascript
// Depuis la console du navigateur, avec le token JWT de l'attaquant
const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", "UUID-DU-BIEN-VICTIME");
```

### Impact

- **Destruction de données** : Suppression irréversible de biens immobiliers d'autres utilisateurs
- **Déni de service ciblé** : Un attaquant peut supprimer tous les biens d'un concurrent (agence immobilière rivale)
- **Perte de confiance** : Les propriétaires perdent leurs annonces, baux associés, et historique
- **Impact métier majeur** : Perturbation directe de l'activité commerciale de la plateforme

### Correction recommandée

**Côté client (défense en profondeur) :**

```typescript
const executeDelete = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { error } = await supabase
            .from("properties")
            .delete()
            .eq("id", id)
            .eq("owner_id", session.user.id); // Vérification de propriété

        if (error) throw error;
        router.back();
    } catch (error) {
        // ...gestion d'erreur
    }
};
```

**Côté serveur (OBLIGATOIRE — Row Level Security Supabase) :**

```sql
CREATE POLICY "owners_delete_own_properties" ON properties
    FOR DELETE
    USING (owner_id = auth.uid());
```

> **Important :** La correction côté client seule est **insuffisante**. Un attaquant peut toujours forger des requêtes directes à l'API Supabase. La RLS est le seul rempart fiable.

---

## Vulnérabilité n°2 — Lecture arbitraire de bien (IDOR READ)

| Attribut | Valeur |
|---|---|
| **Sévérité** | **HAUTE** |
| **Lignes** | 133–148 |
| **CWE** | CWE-639 (Authorization Bypass Through User-Controlled Key) |
| **CVSS 3.1 estimé** | 6.5 (Moyenne-Haute) |

### Description

La fonction `fetchBienDetail` récupère **l'intégralité des données d'un bien** (incluant toutes les colonnes via `*`) pour n'importe quel `id` passé en paramètre d'URL :

```typescript
const { data, error } = await supabase
    .from("properties")
    .select(`
        *,
        property_images ( storage_path ),
        profiles:owner_id ( phone )
    `)
    .eq("id", id)
    .single();
```

Problèmes identifiés :

1. **Aucune vérification de propriété ou de relation légitime** — N'importe quel utilisateur authentifié peut lire les détails de n'importe quel bien
2. **`SELECT *`** — Toutes les colonnes sont récupérées, y compris des données potentiellement sensibles (prix, notes internes, etc.)
3. **Jointure `profiles:owner_id (phone)`** — Le numéro de téléphone du propriétaire est systématiquement récupéré, même pour des utilisateurs n'ayant aucun lien avec ce bien

### Scénario d'exploitation

1. Un utilisateur malveillant énumère les UUID de biens (par force brute ou en observant le trafic réseau d'autres pages listant les biens)
2. Il navigue vers `/bien/{UUID}` pour chaque bien trouvé
3. Il accède aux détails complets : adresse exacte, prix du loyer, description, photos, et **numéro de téléphone du propriétaire**

### Impact

- **Fuite de données personnelles (PII)** : Numéros de téléphone des propriétaires exposés à tous les utilisateurs authentifiés
- **Reconnaissance** : Un attaquant peut cartographier l'ensemble du parc immobilier de la plateforme
- **Violation RGPD** : Exposition non consentie de données personnelles (article 5.1.f — intégrité et confidentialité)

### Correction recommandée

**Politique RLS (lecture) :**

```sql
-- Les propriétaires/agences voient leurs propres biens
-- Les locataires voient uniquement les biens liés à un bail actif
CREATE POLICY "read_own_or_leased_properties" ON properties
    FOR SELECT
    USING (
        owner_id = auth.uid()
        OR id IN (
            SELECT l.property_id FROM leases l
            JOIN lease_tenants lt ON lt.lease_id = l.id
            WHERE lt.tenant_id = auth.uid() AND l.status = 'active'
        )
    );
```

**Réduire la surface d'exposition :**

```typescript
// Remplacer SELECT * par une liste explicite de colonnes
.select(`
    id, address, city, property_type, rooms, bathrooms,
    surface_m2, monthly_rent, is_furnished, energy_class,
    description, available_from,
    property_images ( storage_path )
`)
```

> Ne joindre `profiles:owner_id (phone)` que lorsque l'utilisateur a un bail actif sur ce bien.

---

## Vulnérabilité n°3 — Fuite de numéros de téléphone (PII Leak)

| Attribut | Valeur |
|---|---|
| **Sévérité** | **HAUTE** |
| **Lignes** | 196–226 |
| **CWE** | CWE-200 (Exposure of Sensitive Information to an Unauthorized Actor) |
| **CVSS 3.1 estimé** | 6.5 (Moyenne-Haute) |

### Description

La logique d'affichage du contact téléphonique (lignes 196–226) présente **deux failles distinctes** :

#### Faille 3a — Fuite du téléphone du propriétaire vers tout locataire

```typescript
} else {
    // Tenant viewing: get owner phone
    const ownerProfile = data.profiles as any;
    if (ownerProfile?.phone) {
        setContactPhone(ownerProfile.phone);
    }
}
```

Le téléphone du propriétaire est exposé à **tout utilisateur ayant le rôle `tenant`** (ou n'étant ni `owner` ni `agency`), **sans vérifier que ce locataire a un bail actif sur ce bien spécifique**. Un locataire d'un bien A peut voir le téléphone du propriétaire d'un bien B en naviguant simplement vers `/bien/{ID_BIEN_B}`.

#### Faille 3b — Fuite du téléphone du locataire sans vérification de propriété

```typescript
if (viewerRole === 'owner' || viewerRole === 'agency') {
    const { data: leaseData } = await supabase
        .from("leases")
        .select("id")
        .eq("property_id", data.id)
        .eq("status", "active")
        .maybeSingle();

    if (leaseData) {
        const { data: tenantLink } = await supabase
            .from("lease_tenants")
            .select("tenant_id, profiles:tenant_id(phone)")
            .eq("lease_id", leaseData.id)
            .limit(1)
            .maybeSingle();

        const tenantProfile = tenantLink?.profiles as any;
        if (tenantProfile?.phone) {
            setContactPhone(tenantProfile.phone);
        }
    }
}
```

Ce bloc vérifie qu'il existe un bail actif sur le bien, mais **ne vérifie pas que le viewer est le propriétaire de ce bien**. Tout utilisateur avec le rôle `owner` ou `agency` peut :

1. Naviguer vers `/bien/{ID_BIEN_AUTRE_PROPRIO}`
2. Obtenir le numéro de téléphone du locataire de ce bien

### Scénario d'exploitation combiné

Un attaquant crée un compte `owner` et itère sur les UUID de biens pour récolter :
- Les numéros de téléphone de tous les locataires actifs (via faille 3b)
- Les numéros de téléphone de tous les propriétaires (en se faisant passer pour un `tenant`, via faille 3a)

Cela constitue une **collecte massive de données personnelles**.

### Impact

- **Violation RGPD grave** : Exposition non autorisée de numéros de téléphone personnels
- **Harcèlement / phishing** : Les numéros collectés peuvent être utilisés pour du spam, vishing (voice phishing), ou harcèlement ciblé
- **Atteinte à la réputation** : En cas de fuite publique, responsabilité légale du responsable de traitement

### Correction recommandée

```typescript
// Pour un locataire : vérifier qu'il a un bail actif sur CE bien
if (viewerRole === 'tenant') {
    const { data: myLease } = await supabase
        .from("leases")
        .select("id")
        .eq("property_id", data.id)
        .eq("status", "active")
        .in("id",
            supabase.from("lease_tenants")
                .select("lease_id")
                .eq("tenant_id", session.user.id)
        );

    if (myLease && myLease.length > 0) {
        setContactPhone(data.profiles?.phone);
    }
}

// Pour un propriétaire/agence : vérifier qu'il possède CE bien
if ((viewerRole === 'owner' || viewerRole === 'agency')
    && data.owner_id === session.user.id) {
    // ... logique existante pour récupérer le téléphone du locataire
}
```

**Côté serveur (RLS sur `profiles`) :**

```sql
CREATE POLICY "restrict_phone_access" ON profiles
    FOR SELECT
    USING (
        id = auth.uid()
        OR id IN (
            -- Propriétaires dont je suis locataire actif
            SELECT p.owner_id FROM properties p
            JOIN leases l ON l.property_id = p.id
            JOIN lease_tenants lt ON lt.lease_id = l.id
            WHERE lt.tenant_id = auth.uid() AND l.status = 'active'
        )
        OR id IN (
            -- Locataires de mes propres biens
            SELECT lt.tenant_id FROM lease_tenants lt
            JOIN leases l ON l.id = lt.lease_id
            JOIN properties p ON p.id = l.property_id
            WHERE p.owner_id = auth.uid() AND l.status = 'active'
        )
    );
```

---

## Vulnérabilité n°4 — Contrôle d'accès côté client uniquement (Broken Access Control)

| Attribut | Valeur |
|---|---|
| **Sévérité** | **HAUTE** |
| **Lignes** | 471–512 |
| **CWE** | CWE-602 (Client-Side Enforcement of Server-Side Security) |
| **CVSS 3.1 estimé** | 8.1 (Haute) |

### Description

L'affichage des boutons "Modifier" et "Supprimer" est conditionné par un test côté client :

```typescript
{(userRole === 'owner' || userRole === 'agency') && (
    <>
        <Pressable onPress={() => setIsEditModalVisible(true)}>
            {/* Modifier le logement */}
        </Pressable>
        <Pressable onPress={handleDelete}>
            {/* Supprimer le logement */}
        </Pressable>
    </>
)}
```

Ce contrôle cumule **trois erreurs** :

1. **Contrôle côté client uniquement** — Le rôle `userRole` est stocké dans le state React, facilement modifiable via React DevTools ou en interceptant les réponses réseau
2. **Vérification du rôle, pas de la propriété** — Un `owner` peut voir les boutons pour les biens d'un **autre** `owner`
3. **Aucune protection serveur sous-jacente** — Les fonctions `executeDelete` et le modal d'édition n'ajoutent pas de vérification supplémentaire

### Scénario d'exploitation

**Sans manipulation du client :**
1. L'attaquant possède un compte `owner`
2. Il navigue vers `/bien/{UUID_BIEN_AUTRE_OWNER}`
3. Les boutons "Modifier" et "Supprimer" sont visibles et fonctionnels
4. Il peut modifier ou supprimer le bien d'un autre utilisateur

**Avec manipulation du client :**
1. Un utilisateur avec le rôle `tenant` ouvre React DevTools
2. Il modifie le state `userRole` de `"tenant"` à `"owner"`
3. Les boutons apparaissent
4. Il peut exécuter les actions destructives

**Sans aucune UI (bypass complet) :**
Puisque la protection est uniquement côté client, un attaquant peut directement appeler l'API Supabase :

```javascript
await supabase.from("properties").delete().eq("id", "TARGET_UUID");
await supabase.from("properties").update({ monthly_rent: 1 }).eq("id", "TARGET_UUID");
```

### Impact

- Identique à la vulnérabilité n°1 (suppression) et aggravé par la possibilité de **modification** arbitraire
- Un attaquant peut modifier les loyers, adresses, descriptions de biens qui ne lui appartiennent pas
- Potentiel de fraude : modifier le prix d'un bien pour tromper des locataires

### Correction recommandée

**Côté client (défense en profondeur) — vérifier la propriété, pas seulement le rôle :**

```typescript
{(userRole === 'owner' || userRole === 'agency')
 && rawPropertyData?.owner_id === userId && (
    // ... boutons Modifier / Supprimer
)}
```

**Côté serveur (OBLIGATOIRE) :**

```sql
CREATE POLICY "owners_update_own_properties" ON properties
    FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owners_delete_own_properties" ON properties
    FOR DELETE
    USING (owner_id = auth.uid());
```

---

## Synthèse des vulnérabilités

| # | Vulnérabilité | Sévérité | Ligne(s) | Exploitabilité | Impact |
|---|---|---|---|---|---|
| 1 | IDOR DELETE — Suppression arbitraire | **CRITIQUE** | 115–131 | Triviale | Destruction de données |
| 2 | IDOR READ — Lecture arbitraire | **HAUTE** | 133–148 | Triviale | Fuite de données, reconnaissance |
| 3 | Fuite PII — Numéros de téléphone | **HAUTE** | 196–226 | Triviale | Violation RGPD, harcèlement |
| 4 | Contrôle d'accès côté client | **HAUTE** | 471–512 | Triviale | Modification/suppression arbitraire |

---

## Recommandations globales

### 1. Activer les Row Level Security (RLS) Policies sur Supabase (PRIORITÉ ABSOLUE)

Toutes les tables touchées (`properties`, `profiles`, `leases`, `lease_tenants`) doivent avoir des politiques RLS actives qui vérifient que `auth.uid()` correspond au propriétaire légitime de la ressource. **C'est le seul mécanisme de sécurité fiable** — tout contrôle côté client est contournable.

```sql
-- Vérifier que RLS est activé
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_tenants ENABLE ROW LEVEL SECURITY;
```

### 2. Principe du moindre privilège sur les requêtes

- Remplacer `SELECT *` par des listes de colonnes explicites
- Ne joindre les données sensibles (`phone`) que lorsque la relation est vérifiée côté serveur
- Utiliser des vues Supabase pour exposer un sous-ensemble de colonnes selon le rôle

### 3. Ne jamais faire confiance au client

- Les vérifications de rôle côté client (`userRole === 'owner'`) ne doivent servir qu'à l'**UX** (masquer/afficher des éléments), jamais à la **sécurité**
- Toute opération sensible (CRUD) doit être autorisée côté serveur

### 4. Audit complémentaire recommandé

- **Vérifier les politiques RLS existantes** sur la base Supabase (possibilité qu'elles soient désactivées ou permissives)
- **Auditer `AjouterBienModal`** (composant d'édition, ligne 553–562) pour les mêmes failles IDOR sur la modification
- **Vérifier les tables `leases` et `lease_tenants`** pour des IDOR similaires
- **Tester les storage policies** sur le bucket `property-images` (accès public aux images via `getPublicUrl`)
- **Mettre en place un logging** des opérations DELETE pour détecter les suppressions malveillantes

### 5. Conformité RGPD

- Les numéros de téléphone sont des données personnelles au sens du RGPD
- Leur exposition non contrôlée constitue une violation de l'article 5.1.f (intégrité et confidentialité)
- Documenter la base légale du traitement et mettre en place des contrôles d'accès proportionnés
- En cas de fuite avérée, obligation de notification à la CNIL sous 72h (article 33)

---

## Classification OWASP

Les vulnérabilités identifiées correspondent aux catégories suivantes du **OWASP Top 10 (2021)** :

- **A01:2021 – Broken Access Control** (vulnérabilités n°1, 2, 4)
- **A04:2021 – Insecure Design** (vulnérabilité n°3 — absence de modèle de menace pour l'accès aux PII)

---

*Fin du rapport — Ce document est confidentiel et destiné uniquement à l'équipe de développement d'Imovia.*
