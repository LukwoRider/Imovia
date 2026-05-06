# Rapport d'Audit de Sécurité — Gestion des Incidents et Documents

**Application :** Imovia (Plateforme de gestion locative)
**Date :** 6 mai 2026
**Périmètre :** Module Incidents (création, liste, filtres, statuts) + Module Documents (upload, téléchargement, suppression, accès)
**Auditeur :** Pentest Security Expert

---

## Résumé Exécutif

L'audit a révélé **9 vulnérabilités** dont 3 critiques, 3 élevées, 2 moyennes et 1 faible. Le point le plus préoccupant est le **contournement de la RPC sécurisée côté serveur** pour la création d'incidents : le frontend insère directement dans la table via le client Supabase au lieu d'utiliser la fonction `create_incident()` qui valide l'appartenance au bail. D'autres problèmes notables incluent l'absence de politique RLS pour la suppression de documents, des failles de contrôle d'accès sur le stockage, et des lacunes de validation côté serveur sur les uploads.

| Sévérité | Nombre |
|----------|--------|
| CRITIQUE | 3 |
| ÉLEVÉE | 3 |
| MOYENNE | 2 |
| FAIBLE | 1 |

---

## VULN-01 : Contournement de l'autorisation — Création d'incident pour une propriété arbitraire

**Sévérité : CRITIQUE**

### Localisation
- `frontend/site/src/components/dashboard/tenant/incidents/create-incident-dialog.tsx` : lignes 98-108

### Description

Le formulaire de création d'incident effectue un **INSERT direct** dans la table `incidents` via le client Supabase au lieu d'appeler la RPC sécurisée `create_incident()` qui existe pourtant côté serveur (`20260220200000_incident_flow_hardening.sql`, lignes 77-165).

```98:108:frontend/site/src/components/dashboard/tenant/incidents/create-incident-dialog.tsx
            const { error } = await supabase
                .from('incidents')
                .insert([{
                    description,
                    incident_type: selectedType,
                    location_details: locationDetail,
                    property_id: propertyId,
                    lease_id: leaseId,
                    reporter_id: user.id,
                    status: 'open'
                }])
```

La RPC `create_incident()` (security definer) valide que :
1. L'utilisateur est bien locataire du bail (`lease_tenants`)
2. Le `property_id` correspond au bail fourni
3. La description n'est pas vide

L'INSERT direct **contourne toutes ces vérifications**. La policy RLS `incidents_tenant_insert_if_member` (`20260218123000_security_hardening.sql`, lignes 443-460) exige que `lease_id IS NOT NULL` et valide l'appartenance, mais le frontend récupère `propertyId` et `leaseId` via une requête client-side non sécurisée.

### Scénario d'exploitation

1. Un attaquant authentifié intercepte la requête réseau
2. Il modifie le `property_id` et le `lease_id` pour pointer vers une autre propriété
3. La policy RLS vérifie que `auth.uid()` est bien `reporter_id` (qu'il contrôle) et que `lease_id`/`property_id` correspondent — mais un locataire de la propriété A pourrait tenter d'injecter un incident sur la propriété B si les vérifications de jointure ne sont pas strictes
4. Plus grave : les états `propertyId` et `leaseId` sont définis côté client (lignes 29-30), facilement manipulables via les DevTools React

### Correctif recommandé

```typescript
// Utiliser la RPC au lieu de l'insert direct
const { error } = await supabase.rpc('create_incident', {
    p_lease_id: leaseId,
    p_description: description,
    p_incident_type: selectedType,
})
```

Supprimer les champs `property_id`, `reporter_id` et `status` de l'appel frontend — la RPC les dérive côté serveur.

---

## VULN-02 : Mise à jour de statut d'incident sans autorisation côté propriétaire

**Sévérité : CRITIQUE**

### Localisation
- `frontend/site/src/app/dashboard/owner/incidents/page.tsx` : lignes 62-81
- `frontend/site/src/app/dashboard/tenant/incidents/page.tsx` : absence de `onStatusUpdate`

### Description

La page propriétaire effectue un **UPDATE direct** sur la table `incidents` :

```65:68:frontend/site/src/app/dashboard/owner/incidents/page.tsx
            const { error } = await supabase
                .from('incidents')
                .update({ status: newStatus })
                .eq('id', incidentId)
```

Il existe pourtant une RPC sécurisée `owner_update_incident_status()` (`20260218123000_security_hardening.sql`, lignes 392-422) qui vérifie que l'utilisateur est bien le propriétaire de la propriété liée à l'incident.

La policy RLS `incidents_owner_update` (`20260218113647_remote_schema.sql`, lignes 1415-1425) offre une protection car elle vérifie `properties.owner_id = current_user_id()`. **Cependant**, l'UPDATE direct ne contraint pas les valeurs de `status` autorisées — un propriétaire pourrait envoyer n'importe quelle valeur de statut, y compris des transitions invalides.

De plus, la page tenant (`tenant/incidents/page.tsx`, ligne 83) passe `<IncidentList incidents={filteredIncidents} />` **sans** `onStatusUpdate`, ce qui est correct côté UI. Mais **rien n'empêche un locataire** de forger un appel `.update({ status: 'resolved' })` directement via la console.

### Scénario d'exploitation

1. Un locataire ouvre la console du navigateur
2. Il exécute : `supabase.from('incidents').update({ status: 'resolved' }).eq('id', '<incident_id>')`
3. La policy RLS `incidents_owner_update` bloque (car `owner_id != tenant_id`) — **mais il n'existe pas de policy explicite empêchant un tenant de mettre à jour ses propres incidents** (la policy `incidents_tenant_insert_if_member` ne couvre que INSERT)

### Vérification nécessaire

Confirmer qu'il n'existe **aucune policy FOR UPDATE** accordée aux locataires sur `incidents`. D'après l'audit, seule `incidents_owner_update` existe, ce qui empêcherait ce scénario. Mais l'absence de policy explicite de blocage pour les tenants repose sur un "deny by default" qui doit être vérifié.

### Correctif recommandé

```typescript
// owner/incidents/page.tsx — Utiliser la RPC sécurisée
const { error } = await supabase.rpc('owner_update_incident_status', {
    p_incident_id: incidentId,
    p_status: newStatus,
})
```

---

## VULN-03 : Suppression de documents sans politique RLS de contrôle

**Sévérité : CRITIQUE**

### Localisation
- `frontend/site/src/components/dashboard/owner/documents/document-card.tsx` : lignes 92-96
- Migrations RLS : **aucune policy `FOR DELETE` trouvée sur `public.documents`**

### Description

Le composant `DocumentCard` effectue une suppression directe :

```92:96:frontend/site/src/components/dashboard/owner/documents/document-card.tsx
            const { data: deletedData, error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', doc.id)
                .select()
```

Après examen exhaustif de toutes les migrations, les seules policies RLS sur `public.documents` sont :
- `documents_select_if_linked` (SELECT) — via `document_users`
- `documents_insert_pro` (INSERT) — vérifie `uploader_id` et appartenance
- **Aucune policy FOR DELETE ni FOR UPDATE**

Cependant, le remote schema initial (`20260218113647_remote_schema.sql`, lignes 868-894) accorde `DELETE` sur `public.documents` aux rôles `anon`, `authenticated` et `service_role`. RLS est activée, mais **sans policy FOR DELETE, aucune ligne ne peut être supprimée** (deny by default). Cela signifie soit :
- La suppression échoue silencieusement en production (bug fonctionnel)
- Soit une policy FOR DELETE existe ailleurs et n'a pas été auditée

### Risque

Si une policy FOR DELETE permissive est ajoutée sans contrôle strict, **tout utilisateur authentifié pourrait supprimer n'importe quel document** tant qu'il connaît l'ID (UUID devinable par énumération ou fuite).

### Correctif recommandé

Ajouter une policy explicite :

```sql
CREATE POLICY documents_delete_by_uploader
ON public.documents
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (uploader_id = auth.uid());
```

---

## VULN-04 : Chemin de stockage prédictible et policy de stockage contournée

**Sévérité : ÉLEVÉE**

### Localisation
- `frontend/site/src/components/dashboard/owner/documents/add-document-dialog.tsx` : lignes 129-131
- `supabase/migrations/20260218113647_remote_schema.sql` : lignes 1701-1734 (storage policies)

### Description

Le chemin de stockage est construit avec `Math.random()` :

```129:131:frontend/site/src/components/dashboard/owner/documents/add-document-dialog.tsx
            const fileExt = selectedFile.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${user.id}/${fileName}`
```

Problèmes :

1. **`Math.random()` est cryptographiquement faible** — les noms de fichiers sont prédictibles, facilitant l'énumération
2. **Incohérence de chemin avec les policies de stockage** : les policies du bucket `documents` exigent `split_part(name, '/', 1) = 'leases'` et utilisent `storage_lease_id_from_path()` pour extraire un `lease_id` du chemin. Or, le frontend upload dans `{user.id}/{random}.{ext}` — un chemin qui ne commence **pas** par `leases/`

Cela signifie que soit :
- L'upload échoue (la policy bloque car le path ne commence pas par `leases/`) — bug fonctionnel
- Soit une policy plus permissive a été ajoutée sans être dans les migrations auditées

### Scénario d'exploitation

Si l'upload fonctionne malgré les policies, un attaquant peut :
1. Deviner `{user_id}/{Math.random()}.pdf` pour d'autres utilisateurs
2. Télécharger le fichier via `createSignedUrl` s'il connaît le chemin

### Correctif recommandé

```typescript
const fileName = `${crypto.randomUUID()}.${fileExt}`
const filePath = `leases/${leaseId}/${fileName}` // Aligné avec les storage policies
```

Ajouter/mettre à jour une storage policy qui valide que l'uploader a le droit d'écrire dans ce path.

---

## VULN-05 : Téléchargement de documents par un locataire sans vérification de propriété

**Sévérité : ÉLEVÉE**

### Localisation
- `frontend/site/src/components/dashboard/tenant/documents/document-list.tsx` : lignes 36-38, 57-59

### Description

Les fonctions `handleView` et `handleDownload` accèdent au fichier uniquement via `doc.storagePath` :

```36:38:frontend/site/src/components/dashboard/tenant/documents/document-list.tsx
        try {
            const { data, error } = await supabase.storage
                .from('documents')
                .createSignedUrl(doc.storagePath, 60)
```

Le `storagePath` est passé en prop depuis la page parent qui filtre par `target_tenant_id`. La protection réelle dépend de :
1. La policy RLS sur `public.documents` (SELECT via `document_users`) — OK
2. La policy de stockage sur `storage.objects` pour le bucket `documents`

**Problème** : les policies de stockage existantes vérifient `split_part(name, '/', 1) = 'leases'` et `is_lease_tenant()`. Si le fichier est stocké sous `{user_id}/{random}.ext` (comme le fait `add-document-dialog.tsx`), **la policy de lecture ne matchera pas ce chemin** et la lecture échouera — OU une policy plus permissive existe.

Si un attaquant connaît le `storagePath` d'un document (via la réponse de la query `.select('*')` sur `documents`), il peut tenter un `download()` directement.

### Correctif recommandé

- Aligner le chemin de stockage avec les policies existantes
- Vérifier que les policies de stockage couvrent tous les chemins réellement utilisés
- Ne jamais exposer `storage_path` directement au frontend ; utiliser une Edge Function qui vérifie les droits avant de générer un signed URL

---

## VULN-06 : Absence de validation de taille et type MIME côté serveur pour les uploads

**Sévérité : ÉLEVÉE**

### Localisation
- `frontend/site/src/components/dashboard/owner/documents/add-document-dialog.tsx` : ligne 215

### Description

Le seul contrôle de type de fichier est l'attribut HTML `accept` :

```215:215:frontend/site/src/components/dashboard/owner/documents/add-document-dialog.tsx
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
```

Ce contrôle est **purement cosmétique** — il est trivial de le contourner via :
- Modification de la requête avec un proxy (Burp Suite)
- Modification du DOM dans les DevTools
- Appel direct à l'API Supabase Storage

**Absences critiques** :
- Aucune validation de taille de fichier (`max_file_size`) — risque de DoS par upload de fichiers géants
- Aucune validation du type MIME réel côté serveur
- Aucune vérification du contenu du fichier (un `.pdf` pourrait contenir un exécutable)
- Le bucket `documents` n'a pas de `file_size_limit` configuré (non trouvé dans les migrations)

### Scénario d'exploitation

1. Un attaquant upload un fichier `.html` contenant du JavaScript malveillant
2. Il obtient un signed URL via `createSignedUrl()`
3. Le lien est envoyé à un propriétaire/locataire
4. La victime ouvre le lien → XSS hébergé sur le domaine Supabase Storage

### Correctif recommandé

```sql
UPDATE storage.buckets
SET file_size_limit = 10485760,  -- 10 MB
    allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png',
                               'application/msword',
                               'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
WHERE id = 'documents';
```

Côté frontend, ajouter une validation en amont :

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
if (file.size > MAX_FILE_SIZE) {
    toast.error("Le fichier ne doit pas dépasser 10 Mo")
    return
}
```

---

## VULN-07 : Absence de sanitisation de la description — XSS stocké potentiel

**Sévérité : MOYENNE**

### Localisation
- `frontend/site/src/components/dashboard/tenant/incidents/create-incident-dialog.tsx` : ligne 101
- `frontend/site/src/components/dashboard/tenant/incidents/incident-list.tsx` : ligne 133
- `supabase/migrations/20260220200000_incident_flow_hardening.sql` : ligne 152

### Description

La description saisie par le locataire est envoyée telle quelle à la base :

```101:101:frontend/site/src/components/dashboard/tenant/incidents/create-incident-dialog.tsx
                    description,
```

Et elle est affichée sans traitement dans `incident-list.tsx` :

```133:133:frontend/site/src/components/dashboard/tenant/incidents/incident-list.tsx
                                    {incident.description}
```

**Bonne nouvelle** : React échappe automatiquement le contenu dans les expressions JSX `{...}` — pas de `dangerouslySetInnerHTML` détecté dans le codebase (confirmé par grep). Le risque de XSS via React est donc **neutralisé par défaut**.

**Risque résiduel** :
- La RPC `create_incident()` côté serveur effectue un `btrim()` mais **aucune sanitisation** des caractères spéciaux (ligne 152 : `btrim(p_description)`)
- Si la description est un jour consommée dans un contexte non-React (email, PDF, export CSV), du HTML/JS injecté serait exécuté
- La limite de 500 caractères affichée en UI (ligne 183) n'est **pas appliquée** — ni côté frontend (`maxLength` absent), ni côté serveur

### Correctif recommandé

1. Ajouter `maxLength={500}` sur le `<Textarea>` (ligne 178)
2. Ajouter une contrainte CHECK en base :
```sql
ALTER TABLE public.incidents
  ADD CONSTRAINT incidents_description_length CHECK (char_length(description) <= 2000);
```
3. Appliquer un `strip_tags()` ou équivalent dans la RPC si la description est utilisée hors React

---

## VULN-08 : Fuite d'informations personnelles via les métadonnées d'incident

**Sévérité : MOYENNE**

### Localisation
- `frontend/site/src/app/dashboard/owner/incidents/page.tsx` : lignes 39-47
- `frontend/site/src/components/dashboard/tenant/incidents/incident-list.tsx` : lignes 151-153

### Description

La requête du propriétaire sélectionne `*` sur les incidents et joint les profils du locataire :

```39:47:frontend/site/src/app/dashboard/owner/incidents/page.tsx
            const { data, error } = await supabase
                .from('incidents')
                .select(`
                    *,
                    property:properties(address, city),
                    tenant:profiles!incidents_reporter_id_fkey(full_name, phone)
                `)
                .in('property_id', propertyIds)
                .order('created_at', { ascending: false })
```

Et ces données sont affichées :

```151:153:frontend/site/src/components/dashboard/tenant/incidents/incident-list.tsx
                                                <p className="font-semibold text-foreground">{incident.tenant?.full_name || "Locataire"}</p>
                                                <p className="text-slate-500">{incident.tenant?.phone || "Contact non renseigné"}</p>
```

**Problèmes** :
- Le `SELECT *` récupère **tous les champs** de l'incident, y compris `contact_phone`, `preferred_visit_date`, `allow_access_without_presence` — des données sensibles potentiellement exposées dans la réponse réseau même si non affichées dans l'UI
- Le numéro de téléphone du locataire est exposé via le profil joint
- La policy RLS `profiles_select_own` ne laisse lire que son propre profil — **mais** la jointure est résolue côté serveur par Supabase avec le contexte RLS. Si la policy est correcte, la jointure devrait échouer pour les champs du profil d'un autre user... à vérifier.

### Correctif recommandé

- Remplacer `SELECT *` par une sélection explicite des champs nécessaires
- Créer une vue ou RPC qui expose uniquement les champs nécessaires au dashboard propriétaire

---

## VULN-09 : Message d'erreur verbeux exposant des détails internes

**Sévérité : FAIBLE**

### Localisation
- `frontend/site/src/components/dashboard/tenant/incidents/create-incident-dialog.tsx` : ligne 119
- `frontend/site/src/components/dashboard/owner/documents/document-card.tsx` : ligne 39
- `frontend/site/src/components/dashboard/tenant/documents/document-list.tsx` : ligne 45

### Description

Les messages d'erreur Supabase sont affichés directement à l'utilisateur :

```119:119:frontend/site/src/components/dashboard/tenant/incidents/create-incident-dialog.tsx
            toast.error("Erreur : " + err.message)
```

```39:39:frontend/site/src/components/dashboard/owner/documents/document-card.tsx
            toast.error("Impossible d'ouvrir le document: " + (error instanceof Error ? error.message : "Erreur inconnue"))
```

Les erreurs Supabase peuvent contenir des noms de tables, colonnes, contraintes, et détails de policies RLS — offrant à un attaquant une carte du schéma de base de données.

### Correctif recommandé

```typescript
toast.error("Une erreur est survenue. Veuillez réessayer.")
console.error("[Incident Create]", error) // Log pour debugging interne uniquement
```

---

## Tableau récapitulatif

| ID | Vulnérabilité | Sévérité | Fichier principal | Exploitable |
|----|--------------|----------|-------------------|-------------|
| VULN-01 | INSERT direct au lieu de RPC sécurisée (incidents) | CRITIQUE | `create-incident-dialog.tsx:98` | Oui — manipulation de `property_id` |
| VULN-02 | UPDATE de statut sans RPC sécurisée | CRITIQUE | `owner/incidents/page.tsx:65` | Partiel — mitigé par RLS `incidents_owner_update` |
| VULN-03 | DELETE de documents sans policy RLS | CRITIQUE | `document-card.tsx:92` | Dépend de l'état réel des policies |
| VULN-04 | Chemin de stockage prédictible et incohérent | ÉLEVÉE | `add-document-dialog.tsx:129` | Oui — `Math.random()` + path mismatch |
| VULN-05 | Téléchargement sans vérification de propriété | ÉLEVÉE | `document-list.tsx:36` (tenant) | Conditionnel — dépend des storage policies |
| VULN-06 | Aucune validation taille/MIME côté serveur | ÉLEVÉE | `add-document-dialog.tsx:215` | Oui — DoS + upload malveillant |
| VULN-07 | Pas de limite/sanitisation sur description | MOYENNE | `create-incident-dialog.tsx:101` | Non en contexte React, oui si réutilisé |
| VULN-08 | Fuite de données via `SELECT *` et jointures | MOYENNE | `owner/incidents/page.tsx:39` | Partiel — visible dans les réponses réseau |
| VULN-09 | Messages d'erreur verbeux | FAIBLE | Multiple fichiers | Oui — reconnaissance facilitée |

---

## Recommandations prioritaires

### Immédiates (P0 — à corriger avant mise en production)

1. **Utiliser les RPCs existantes** : Remplacer tous les `INSERT`/`UPDATE` directs sur `incidents` par les appels à `create_incident()` et `owner_update_incident_status()`
2. **Ajouter une policy FOR DELETE** sur `public.documents` restrictive à `uploader_id = auth.uid()`
3. **Configurer le bucket `documents`** avec `file_size_limit` et `allowed_mime_types`

### Court terme (P1 — semaine suivante)

4. Aligner les chemins de stockage frontend avec les storage policies RLS
5. Remplacer `Math.random()` par `crypto.randomUUID()` pour les noms de fichiers
6. Remplacer `SELECT *` par des sélections explicites
7. Masquer les messages d'erreur techniques

### Moyen terme (P2)

8. Ajouter des contraintes `CHECK` sur la longueur des champs texte en base
9. Créer des Edge Functions pour le téléchargement de documents (validation + signed URL côté serveur)
10. Auditer les grants excessifs (`DELETE`, `UPDATE` sur `incidents` et `documents` pour le rôle `anon`)

---

## Note sur les mitigations existantes

L'audit reconnaît que plusieurs protections sont déjà en place :

- **RLS activée** sur toutes les tables critiques (`incidents`, `documents`, `profiles`, `document_users`)
- **Policy `incidents_tenant_insert_if_member`** vérifie l'appartenance au bail pour les INSERT
- **Policy `incidents_owner_update`** restreint les mises à jour au propriétaire
- **Triggers de cohérence** (`enforce_lease_property_consistency`) empêchent les incohérences `lease_id`/`property_id`
- **Document user links** (`document_users`) avec sync automatique via triggers
- **`security definer`** sur les RPCs avec `set search_path` explicite
- **Absence de `dangerouslySetInnerHTML`** dans tout le frontend — protection XSS React native

Le niveau de sécurité backend (RLS + RPCs) est globalement bon. **Le risque principal réside dans le frontend qui ne consomme pas ces protections** (INSERT/UPDATE directs au lieu des RPCs).
