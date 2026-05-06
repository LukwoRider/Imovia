# Rapport d'audit de sécurité — `DeclarerIncidentModal.tsx`

**Composant audité :** `frontend/application/components/incidents/DeclarerIncidentModal.tsx`  
**Date :** 6 mai 2026  
**Auditeur :** Pentest Expert (audit statique)  
**Périmètre :** Analyse du composant frontend + fonctions RPC backend associées + politiques RLS

---

## Résumé exécutif

Le composant `DeclarerIncidentModal.tsx` présente une **architecture de sécurité globalement solide**. L'utilisation d'une RPC `SECURITY DEFINER` avec validation serveur du bail, combinée à des politiques RLS défensives et des triggers de cohérence, constitue un modèle de défense en profondeur. Toutefois, **plusieurs faiblesses subsistent**, principalement liées à l'absence de validation des longueurs d'entrée et à la non-vérification du statut actif du bail.

| Sévérité | Nombre |
|----------|--------|
| Critique | 0 |
| Haute    | 1 |
| Moyenne  | 3 |
| Basse    | 3 |
| Info     | 2 |

---

## 1. Mécanisme de création d'incident : RPC vs INSERT direct

**Verdict : CONFORME** | Sévérité : **Info (positif)**

Le composant utilise correctement la RPC sécurisée `create_incident()` :

```typescript
const { data: incidentId, error: rpcError } = await supabase.rpc("create_incident", {
    p_lease_id: leaseId,
    p_property_id: null,
    p_title: null,
    p_description: description.trim(),
    p_incident_type: backendType,
    p_priority: 'medium',
    p_location_details: localisation.trim() || null,
    p_contact_phone: null,
    p_preferred_visit_date: null,
    p_allow_access_without_presence: true
});
```

**Points positifs :**
- La RPC est déclarée `SECURITY DEFINER` avec `set search_path = public, pg_catalog` (pas de search_path hijacking).
- Le `reporter_id` est dérivé de `auth.uid()` côté serveur, non passé par le client.
- Le `property_id` est résolu côté serveur à partir du `lease_id` via jointure.
- L'exécution est restreinte aux rôles `authenticated` et `service_role` (`REVOKE ... FROM public`).
- Un INSERT direct serait également protégé par la politique RLS `incidents_tenant_insert_if_member`.

---

## 2. Validation du bail (lease) — côté serveur vs côté client

### 2.1 Validation côté client (pré-vol)

**Verdict : ACCEPTABLE avec réserve** | Sévérité : **Basse**

Le frontend effectue une requête préalable pour vérifier l'existence d'un bail :

```typescript
const { data: leaseData, error: leaseError } = await supabase
    .from("lease_tenants")
    .select("lease_id")
    .eq("tenant_id", user.id)
    .maybeSingle();
```

**Problème identifié :** Cette vérification est purement cosmétique (UX). Elle ne filtre pas sur le statut du bail (`active`). Un bail `ended` ou `terminated` serait quand même retourné. Cependant, ce n'est pas exploitable en soi car la vraie validation se fait côté serveur.

### 2.2 Validation côté serveur (RPC `create_incident`)

**Verdict : PARTIELLEMENT CONFORME** | Sévérité : **Haute**

La RPC vérifie que l'utilisateur est bien locataire du bail fourni :

```sql
select l.property_id
  into v_property_id
from public.leases l
join public.lease_tenants lt
  on lt.lease_id = l.id
 and lt.tenant_id = v_uid
where l.id = p_lease_id;

if not found then
  raise exception 'Not allowed';
end if;
```

**VULNÉRABILITÉ : Absence de vérification du statut du bail.**

La requête ne filtre **pas** sur `l.status = 'active'`. Un locataire dont le bail est terminé (`ended`, `terminated`) ou en brouillon (`draft`) peut toujours créer des incidents sur ce bail. Cela constitue une violation de la logique métier et un risque de manipulation de données.

**Recommandation :**
```sql
where l.id = p_lease_id
  and l.status = 'active'::public.lease_status
```

---

## 3. Usurpation de propriété — un locataire peut-il créer un incident sur un bien hors bail ?

**Verdict : PROTÉGÉ** | Sévérité : **Info (positif)**

Non. La défense en profondeur est effective :

1. **RPC** : La jointure `leases ⟕ lease_tenants` avec `lt.tenant_id = auth.uid()` vérifie l'appartenance.
2. **RPC** : Le `property_id` est dérivé du bail côté serveur (`v_property_id := l.property_id`). Même si le client envoie un `p_property_id` différent, la RPC lève une exception `'Lease and property mismatch'`.
3. **RLS** : La politique `incidents_tenant_insert_if_member` vérifie indépendamment la cohérence `lease_id`/`property_id` et l'appartenance du locataire.
4. **Trigger** : `trg_incidents_lease_property_consistency` empêche toute incohérence `lease_id`/`property_id` au niveau INSERT/UPDATE.

Triple vérification : **la couverture est excellente.**

---

## 4. Validation des entrées

### 4.1 Description — absence de limite de longueur

**Verdict : VULNÉRABLE** | Sévérité : **Moyenne**

**Côté frontend :** Aucun `maxLength` n'est défini sur le `TextInput` de description. Un utilisateur peut soumettre un texte de taille arbitraire.

**Côté backend :** La colonne `description` est de type `text` sans contrainte `CHECK` de longueur. Contrairement à `properties.description` qui est limitée à 500 caractères, **`incidents.description` n'a aucune limite**.

La RPC applique `btrim()` mais aucune validation de longueur :
```sql
btrim(p_description)  -- trim uniquement, pas de limite
```

**Risques :**
- Déni de service (DoS) par payload volumineux (descriptions de plusieurs Mo).
- Augmentation du coût de stockage.
- Potentiel débordement dans les interfaces d'affichage.

**Recommandation :**
- Frontend : Ajouter `maxLength={5000}` sur le TextInput.
- Backend : Ajouter un `CHECK (char_length(description) <= 5000)` sur la table et une validation dans la RPC.

### 4.2 Localisation (`location_details`) — absence de limite de longueur

**Verdict : VULNÉRABLE** | Sévérité : **Moyenne**

Même constat que pour la description. Aucune limite côté frontend ni côté backend. Le champ est libre en `text` sans `CHECK`.

**Recommandation :** Limiter à 500 caractères côté frontend et backend.

### 4.3 Sanitisation XSS / injection HTML

**Verdict : RISQUE FAIBLE** | Sévérité : **Basse**

Dans le contexte React Native, les composants `<Text>` ne rendent pas de HTML brut, donc le risque XSS classique est quasi nul sur mobile. Cependant :
- Si les données sont affichées sur un dashboard web (backoffice propriétaire), une description contenant du HTML/JS malveillant pourrait être exploitée si le rendu n'est pas échappé.
- Aucune sanitisation n'est effectuée côté RPC (`btrim` ne supprime pas les balises HTML).

**Recommandation :** S'assurer que tout affichage côté web utilise un rendu text-safe. Envisager un filtre de caractères de contrôle côté RPC.

---

## 5. Sécurité de l'upload d'images/photos

**Verdict : FONCTIONNALITÉ ABSENTE** | Sévérité : **Moyenne**

Le composant **ne propose aucune fonctionnalité d'upload de photos** pour accompagner la déclaration d'incident. Aucune référence à Supabase Storage, `ImagePicker`, ou quelconque mécanisme d'upload n'est présent dans ce fichier ni dans le répertoire `components/incidents/`.

**Risque métier :** L'absence de pièces jointes photographiques affaiblit la valeur probante des déclarations d'incidents. C'est un manque fonctionnel plus qu'une vulnérabilité, mais cela implique que si cette fonctionnalité est ajoutée ultérieurement, elle devra faire l'objet d'un audit dédié couvrant :
- Validation du type MIME (pas seulement l'extension).
- Limite de taille de fichier.
- Nommage aléatoire pour éviter les path traversal.
- Politiques de bucket Supabase Storage restrictives.

---

## 6. Validation du type d'incident

**Verdict : PROTÉGÉ** | Sévérité : **Info (positif)**

### Côté frontend

Le mapping est strict via `mapToBackendType()` :
```typescript
function mapToBackendType(uiKey: string): string {
    switch (uiKey) {
        case "plomberie": return "plumbing";
        case "electrique": return "electricity";
        case "panne": return "appliance";
        case "autre":
        default: return "other";
    }
}
```

Toute valeur non reconnue retourne `"other"`. Le frontend ne peut pas envoyer un type arbitraire via cette UI.

### Côté backend

Le paramètre `p_incident_type` est typé `public.incident_type` qui est un **enum PostgreSQL** :
```sql
create type public.incident_type as enum (
    'plumbing', 'electricity', 'appliance', 'other'
);
```

Toute valeur hors enum sera rejetée par PostgreSQL avec une erreur de cast. **Protection complète.**

### Réserve mineure

**Sévérité : Basse** — L'appel RPC côté frontend passe `p_incident_type` comme une string :
```typescript
p_incident_type: backendType,
```

Un attaquant modifiant le code client (ou appelant l'API directement) pourrait envoyer une valeur arbitraire (ex: `"injection_test"`). Cependant, le cast PostgreSQL vers l'enum échouera, donc **pas d'impact réel**.

---

## 7. Autres constats

### 7.1 Gestion `maybeSingle()` et baux multiples

**Sévérité : Basse**

Le frontend utilise `.maybeSingle()` pour récupérer le bail du locataire. Si la contrainte d'unicité du bail actif par locataire n'était pas appliquée, cette requête échouerait avec une erreur Supabase (résultats multiples). La migration `20260220230000_single_active_lease_per_tenant` applique cette contrainte via trigger, ce qui sécurise ce scénario. Toutefois, la requête frontend ne filtre pas les baux inactifs, ce qui pourrait retourner un bail terminé.

**Recommandation :** Ajouter un filtre côté frontend :
```typescript
.eq("tenant_id", user.id)
.eq("status", "active")  // Filtrer sur le bail actif uniquement
```

Cela nécessiterait une jointure ou un appel à la table `leases` pour filtrer sur le statut.

### 7.2 Fuite d'information dans les messages d'erreur

**Sévérité : Basse**

Le `catch` expose le message d'erreur brut à l'utilisateur :
```typescript
Alert.alert("Erreur", error.message || "Une erreur est survenue lors de l'envoi.");
```

Les messages d'exception PostgreSQL (ex: `"Lease and property mismatch"`, `"Not allowed"`) sont affichés directement. Dans ce cas précis, les messages sont suffisamment vagues pour ne pas constituer une fuite critique, mais la pratique n'est pas idéale.

### 7.3 Valeur `p_allow_access_without_presence` hardcodée à `true`

**Sévérité : Basse**

Le composant envoie systématiquement `p_allow_access_without_presence: true` sans laisser le choix au locataire. C'est un problème UX/métier plutôt que de sécurité, mais cela pourrait avoir des implications juridiques (consentement présumé pour accès au logement).

---

## Synthèse des recommandations

| # | Recommandation | Sévérité | Effort |
|---|---------------|----------|--------|
| 1 | **Ajouter `l.status = 'active'` dans la RPC `create_incident`** pour empêcher la création d'incidents sur des baux inactifs | Haute | Faible |
| 2 | Ajouter une contrainte `CHECK (char_length(description) <= 5000)` sur `incidents.description` | Moyenne | Faible |
| 3 | Ajouter une contrainte `CHECK (char_length(location_details) <= 500)` sur `incidents.location_details` | Moyenne | Faible |
| 4 | Ajouter `maxLength` sur les `TextInput` frontend (description: 5000, localisation: 500) | Moyenne | Faible |
| 5 | Filtrer sur le statut de bail actif dans la requête frontend `lease_tenants` | Basse | Faible |
| 6 | Généraliser les messages d'erreur affichés à l'utilisateur | Basse | Faible |
| 7 | Prévoir un audit dédié si une fonctionnalité d'upload photo est ajoutée | Moyenne | — |
| 8 | Permettre au locataire de choisir `allow_access_without_presence` | Basse | Faible |

---

## Conclusion

Le composant `DeclarerIncidentModal.tsx` repose sur une **architecture sécurisée en profondeur** (RPC SECURITY DEFINER + RLS + triggers). La vulnérabilité la plus significative est l'**absence de vérification du statut actif du bail** dans la RPC serveur, qui permettrait à un ancien locataire de créer des incidents après la fin de son bail. Les autres constats sont principalement des durcissements recommandés (limites de longueur, sanitisation) qui n'ont pas d'impact critique immédiat mais doivent être corrigés pour une posture de sécurité production-ready.
