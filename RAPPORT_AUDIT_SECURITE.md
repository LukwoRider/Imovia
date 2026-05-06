# Rapport d'Audit de Securite — Imovia Frontend

**Date :** 6 mai 2026
**Auditeur :** Audit pentest API / Supabase
**Perimetre :** Tous les appels Supabase client-side et server-side dans `frontend/site/src/`
**Classification :** Confidentiel

---

## Resume Executif

L'audit revele **22 vulnerabilites** reparties sur l'ensemble du codebase frontend. La majorite sont liees a une **confiance excessive dans les donnees cote client**, a l'**absence de validation des entrees avant les operations DB**, et a des **controles d'autorisation insuffisants**. Deux vulnerabilites critiques permettent une **escalade de privileges** et une **usurpation d'identite**.

| Severite | Nombre |
|----------|--------|
| CRITIQUE | 3 |
| HAUTE | 7 |
| MOYENNE | 7 |
| BASSE | 5 |

---

## VULN-01 — Escalade de privileges via le choix du role a l'inscription

- **Severite :** CRITIQUE
- **Fichier :** `frontend/site/src/app/auth/actions.ts:42-71`
- **Type :** Escalade de privileges / Mass assignment

### Description

Lors de l'inscription, le champ `role` est lu directement depuis `formData` sans aucune validation ni whitelist. Le code met ensuite a jour le profil avec ce role :

```63:71:frontend/site/src/app/auth/actions.ts
    if (data.user && role && role !== 'tenant') {
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: role })
            .eq('id', data.user.id)

        if (updateError) {
        }
    }
```

### Scenario d'exploitation

1. Un attaquant s'inscrit via le formulaire
2. Il intercepte la requete POST et modifie le champ `role` en `admin`, `superadmin`, ou tout autre role privilegie
3. Le serveur met a jour le profil avec le role injecte sans verification
4. L'attaquant obtient des privileges eleves dans l'application

### Correction recommandee

```typescript
const ALLOWED_ROLES = ['tenant', 'owner', 'agency']
const role = formData.get('role') as string

if (!ALLOWED_ROLES.includes(role)) {
    return { error: "Role invalide" }
}
```

De plus, cette logique **ne devrait jamais etre cote client**. La mise a jour du role devrait passer par une fonction RPC server-side avec verification des conditions prealables (SIRET pour agency, etc.).

---

## VULN-02 — Envoi de notifications a n'importe quel utilisateur (IDOR)

- **Severite :** CRITIQUE
- **Fichier :** `frontend/site/src/lib/supabase/notification-utils.ts:17-47`
- **Type :** IDOR (Insecure Direct Object Reference)

### Description

La fonction `sendNotification` accepte un `userId` en parametre et insere directement une notification ciblee :

```27:36:frontend/site/src/lib/supabase/notification-utils.ts
    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            sender_id: currentUser?.id,
            title,
            message,
            type,
            link
        })
```

### Scenario d'exploitation

1. Un attaquant appelle cette fonction avec un `userId` arbitraire
2. Il peut envoyer des notifications de phishing/spam a n'importe quel utilisateur de la plateforme
3. Combine avec un `link` malveillant, il peut rediriger la victime vers un site de phishing
4. Le champ `type` et `title` sont aussi controlables, permettant de simuler des notifications systeme

### Correction recommandee

- Verifier cote RLS (Supabase) que le `sender_id` a le droit d'envoyer a ce `user_id` (relation proprietaire-locataire via lease)
- Ajouter une validation serveur avant l'insertion
- Limiter le nombre de notifications envoyees par periode (rate limiting)

---

## VULN-03 — Absence de verification de propriete sur terminateLease / updateLease

- **Severite :** CRITIQUE
- **Fichier :** `frontend/site/src/lib/supabase/tenant-onboarding-utils.ts:159-207, 241-261`
- **Type :** Broken Access Control / IDOR

### Description

Les fonctions `terminateLease` et `updateLease` prennent un `leaseId` en parametre sans verifier que l'utilisateur authentifie est bien le proprietaire du bail :

```159:166:frontend/site/src/lib/supabase/tenant-onboarding-utils.ts
export async function terminateLease(leaseId: string, propertyId: string) {
    const supabase = createClient()

    // 1. Update lease status to 'ended'
    const { error: leaseError } = await supabase
        .from('leases')
        .update({ status: 'ended' })
        .eq('id', leaseId)
```

```241:254:frontend/site/src/lib/supabase/tenant-onboarding-utils.ts
export async function updateLease(leaseId: string, updates: {
    rent_amount?: number
    charges_amount?: number
    deposit_amount?: number
    start_date?: string
    payment_day?: number
}) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('leases')
        .update(updates)
        .eq('id', leaseId)
```

### Scenario d'exploitation

1. Un proprietaire A obtient l'UUID d'un bail appartenant au proprietaire B (via les reponses API par exemple)
2. Il appelle `terminateLease(leaseId_de_B, propertyId_de_B)` et resilient le bail d'un autre utilisateur
3. Ou il appelle `updateLease(leaseId_de_B, { rent_amount: 0 })` pour modifier le loyer du bail d'un autre

### Correction recommandee

```typescript
export async function terminateLease(leaseId: string, propertyId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Non authentifie")

    const { error: leaseError } = await supabase
        .from('leases')
        .update({ status: 'ended' })
        .eq('id', leaseId)
        .eq('owner_id', user.id) // VERIFICATION CRITIQUE
```

Idealement, s'appuyer aussi sur des RLS policies Supabase avec `auth.uid() = owner_id`.

---

## VULN-04 — Mass assignment sur le formulaire de propriete

- **Severite :** HAUTE
- **Fichier :** `frontend/site/src/components/dashboard/owner/properties/property-form.tsx:95-131`
- **Type :** Mass assignment

### Description

L'objet `propertyData` est construit directement depuis `formData` sans whitelist ni sanitisation, et le champ `status` est controlable par l'utilisateur :

```95:112:frontend/site/src/components/dashboard/owner/properties/property-form.tsx
        const propertyData = {
            owner_id: user.id,
            address: formData.get("address") as string,
            // ...
            status: (formData.get("status") as PropertyStatus) || initialData?.status || 'available',
            available_from: formData.get("available_from") as string || null
        }
```

### Scenario d'exploitation

1. Un attaquant modifie le formulaire HTML pour ajouter un champ `status` avec la valeur `rented`
2. En mode creation, le statut ne devrait jamais etre choisi par l'utilisateur
3. Plus grave : un attaquant pourrait injecter des champs supplementaires dans `formData` si le code evolue pour etendre `propertyData` dynamiquement

### Correction recommandee

- Ne jamais exposer `status` en mode creation — forcer `status: 'available'` cote serveur
- Valider chaque champ avec une schema Zod avant insertion
- Deplacer la logique d'insertion vers une server action Next.js

---

## VULN-05 — Absence de validation des entrees sur l'onboarding locataire

- **Severite :** HAUTE
- **Fichier :** `frontend/site/src/lib/supabase/tenant-onboarding-utils.ts:59-154`
- **Type :** Absence de validation / Injection de donnees

### Description

La fonction `onboardTenant` accepte un objet `OnboardingData` sans aucune validation :

```80:94:frontend/site/src/lib/supabase/tenant-onboarding-utils.ts
    const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .insert({
            property_id: data.propertyId,
            owner_id: data.ownerId,
            start_date: data.startDate,
            end_date: data.endDate || null,
            rent_amount: data.rentAmount,
            charges_amount: data.chargesAmount,
            payment_day: data.paymentDay,
            status: 'active'
        })
```

### Problemes identifies

- `rentAmount` et `chargesAmount` peuvent etre negatifs — aucune verification de borne
- `paymentDay` peut etre 0, 32, ou -1
- `startDate` et `endDate` ne sont pas valides comme dates reelles
- `ownerId` est fourni par le client et non verifie via `auth.getUser()` — un attaquant peut forger un bail au nom d'un autre proprietaire

### Correction recommandee

```typescript
import { z } from 'zod'

const OnboardingSchema = z.object({
    propertyId: z.string().uuid(),
    ownerId: z.string().uuid(),
    rentAmount: z.number().positive().max(100000),
    chargesAmount: z.number().min(0).max(50000),
    paymentDay: z.number().int().min(1).max(28),
    startDate: z.string().refine(d => !isNaN(Date.parse(d))),
    endDate: z.string().optional(),
})
```

Et surtout : `ownerId` devrait etre derive de `supabase.auth.getUser()`, jamais passe en parametre.

---

## VULN-06 — Suppression de proprietes sans verification de propriete

- **Severite :** HAUTE
- **Fichier :** `frontend/site/src/components/dashboard/owner/properties/properties-client.tsx:47-63`
- **Type :** IDOR / Broken Access Control

### Description

```50:55:frontend/site/src/components/dashboard/owner/properties/properties-client.tsx
            const { error } = await supabase
                .from('properties')
                .delete()
                .eq('id', id)
```

La suppression filtre uniquement sur `id` sans ajouter `.eq('owner_id', user.id)`. Si les RLS ne sont pas correctement configurees, n'importe quel utilisateur authentifie peut supprimer la propriete d'un autre.

### Correction recommandee

```typescript
const { data: { user } } = await supabase.auth.getUser()
const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)
```

---

## VULN-07 — Suppression de documents sans verification de propriete

- **Severite :** HAUTE
- **Fichier :** `frontend/site/src/components/dashboard/owner/documents/document-card.tsx:72-111`
- **Type :** IDOR / Broken Access Control

### Description

```92:96:frontend/site/src/components/dashboard/owner/documents/document-card.tsx
            const { data: deletedData, error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', doc.id)
                .select()
```

La suppression du document ne verifie pas que l'utilisateur courant est bien le `uploader_id`. De meme pour la suppression en storage ligne 83-85 : le path du document est fourni par le client (`doc.storagePath`) sans validation.

### Scenario d'exploitation

Un attaquant forge un objet `doc` avec le `storagePath` d'un document d'un autre utilisateur et le supprime du storage et de la base de donnees.

### Correction recommandee

```typescript
const { data: { user } } = await supabase.auth.getUser()
const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', doc.id)
    .eq('uploader_id', user.id)
```

---

## VULN-08 — Mise a jour d'incidents sans verification de propriete

- **Severite :** HAUTE
- **Fichier :** `frontend/site/src/app/dashboard/owner/incidents/page.tsx:62-81`
- **Type :** IDOR / Broken Access Control

### Description

```65:68:frontend/site/src/app/dashboard/owner/incidents/page.tsx
            const { error } = await supabase
                .from('incidents')
                .update({ status: newStatus })
                .eq('id', incidentId)
```

La mise a jour du statut d'un incident ne verifie pas que l'incident concerne une propriete detenue par l'utilisateur courant. Un utilisateur pourrait modifier le statut d'incidents sur des proprietes d'autres proprietaires.

### Correction recommandee

Ajouter une verification amont ou un filtre RLS cote Supabase. Cote application :

```typescript
const { error } = await supabase
    .from('incidents')
    .update({ status: newStatus })
    .eq('id', incidentId)
    .in('property_id', ownedPropertyIds)
```

---

## VULN-09 — Notification de lecture sans verification de propriete

- **Severite :** HAUTE
- **Fichier :** `frontend/site/src/lib/supabase/notification-utils.ts:78-91`
- **Type :** IDOR

### Description

```79:84:frontend/site/src/lib/supabase/notification-utils.ts
export async function markNotificationAsRead(notificationId: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
```

N'importe quel utilisateur authentifie peut marquer les notifications d'un autre utilisateur comme lues, en connaissant l'ID de la notification.

### Correction recommandee

```typescript
const { data: { user } } = await supabase.auth.getUser()
await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)
```

---

## VULN-10 — Suppression d'images de proprietes sans verification

- **Severite :** HAUTE
- **Fichier :** `frontend/site/src/components/dashboard/owner/properties/property-form.tsx:133-138`
- **Type :** IDOR

### Description

```133:138:frontend/site/src/components/dashboard/owner/properties/property-form.tsx
            if (deletedImageIds.length > 0) {
                await supabase
                    .from('property_images')
                    .delete()
                    .in('id', deletedImageIds)
            }
```

Les IDs d'images a supprimer sont fournis par le client dans `deletedImageIds`. Il n'y a aucune verification que ces images appartiennent a la propriete de l'utilisateur courant.

### Correction recommandee

Filtrer par `property_id` en plus de `id`, et verifier que le `property_id` appartient a l'utilisateur.

---

## VULN-11 — Requetes sans pagination — risque de DoS

- **Severite :** MOYENNE
- **Fichier :** Multiples

### Occurrences

| Fichier | Ligne | Requete |
|---------|-------|---------|
| `owner-dashboard-utils.ts` | 24-28 | `properties` sans `.limit()` |
| `owner-dashboard-utils.ts` | 41-44 | `leases` sans `.limit()` |
| `owner-dashboard-utils.ts` | 50-56 | `rent_payments` sans `.limit()` |
| `owner-dashboard-utils.ts` | 64-68 | `rent_payments` (late) sans `.limit()` |
| `owner-dashboard-utils.ts` | 101-104 | `leases` sans `.limit()` |
| `tenant-onboarding-utils.ts` | 219-223 | `properties` sans `.limit()` |
| `properties-client.tsx` | 24-28 | `properties` sans `.limit()` |
| `property-grid.tsx` | 27-31 | `properties` (search) sans `.limit()` |
| `owner/incidents/page.tsx` | 39-47 | `incidents` sans `.limit()` |

### Scenario d'exploitation

Un proprietaire avec des milliers de biens (ou un attaquant qui en cree en masse) peut forcer le backend a retourner des milliers de lignes en une seule requete, causant un ralentissement du serveur et du client.

### Correction recommandee

Ajouter `.limit(100)` (ou une pagination serveur) a toutes les requetes. Pour `property-grid.tsx`, implementer une pagination reelle cote Supabase plutot que le filtrage cote client avec une fausse pagination UI.

---

## VULN-12 — Recherche de proprietes : toutes les donnees envoyees au client

- **Severite :** MOYENNE
- **Fichier :** `frontend/site/src/components/dashboard/tenant/search/property-grid.tsx:27-31`
- **Type :** Exposition de donnees / DoS

### Description

```27:31:frontend/site/src/components/dashboard/tenant/search/property-grid.tsx
            const { data, error } = await supabase
                .from('properties')
                .select('*, images:property_images(*)')
                .eq('status', 'available')
                .order('created_at', { ascending: false })
```

La recherche charge **toutes** les proprietes disponibles cote client, puis filtre en JavaScript. Cela expose toutes les donnees des proprietes et ne limite pas le volume transfere.

### Correction recommandee

- Pousser les filtres (`q`, `minSurface`, `maxSurface`, `minPrice`, `maxPrice`) dans la requete Supabase via `.ilike()`, `.gte()`, `.lte()`
- Ajouter `.limit(20)` avec pagination via `.range(from, to)`
- Ne selectionner que les colonnes necessaires au lieu de `*`

---

## VULN-13 — Fuite d'informations dans les messages d'erreur

- **Severite :** MOYENNE
- **Fichier :** Multiples

### Occurrences

| Fichier | Ligne | Probleme |
|---------|-------|----------|
| `tenant-onboarding-utils.ts` | 33 | `throw new Error(\`Erreur RPC: ${error.message}\`)` — expose message interne Supabase |
| `tenant-onboarding-utils.ts` | 103 | `throw new Error(\`...${leaseError.message || 'Contrainte violee ou RLS'}\`)` |
| `tenant-onboarding-utils.ts` | 121 | `throw new Error(\`...${ltError.message || 'Erreur inconnue'}\`)` |
| `tenant-onboarding-utils.ts` | 257 | `throw new Error(\`...${error.message}\`)` |
| `property-form.tsx` | 156 | `throw new Error(\`...${uploadError.message}\`)` |
| `property-form.tsx` | 168 | `throw new Error(\`...${dbError.message}\`)` |
| `auth/actions.ts` | 20 | `return { error: error.message }` — expose le message d'erreur Supabase auth |

### Scenario d'exploitation

Les messages d'erreur Supabase peuvent reveler des noms de tables, des noms de contraintes, des informations sur la structure du schema DB (ex: `ux_one_active_lease_per_property`). Ces informations facilitent l'enumeration de la base et la preparation d'attaques ciblees.

### Correction recommandee

Ne jamais exposer `error.message` directement au client. Logger cote serveur et retourner un message generique :

```typescript
if (error) {
    console.error('[LEASE_CREATE]', error)
    throw new Error("Une erreur est survenue lors de la creation du bail")
}
```

---

## VULN-14 — Upload de fichiers sans validation de type/taille

- **Severite :** MOYENNE
- **Fichier :** `frontend/site/src/components/dashboard/owner/properties/property-form.tsx:140-171`
- **Fichier :** `frontend/site/src/components/dashboard/profile/personal-info-form.tsx:90-113`
- **Fichier :** `frontend/site/src/components/dashboard/owner/documents/add-document-dialog.tsx:117-170`
- **Type :** Upload non securise

### Description

Les uploads de fichiers ne valident pas :
- La taille maximale du fichier (un fichier de 5 Go ferait crasher le client et surcharger le storage)
- Le type MIME reel du fichier (seule l'extension HTML `accept` est verifiee, facilement contournable)
- Le contenu du fichier (un attaquant peut uploader un executable renomme en `.jpg`)

Pour `property-form.tsx` :

```140:153:frontend/site/src/components/dashboard/owner/properties/property-form.tsx
            for (let i = 0; i < images.length; i++) {
                const img = images[i]

                if (!img.isExisting && img.file) {
                    const file = img.file
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
                    const filePath = `properties/${propertyId}/${fileName}`

                    const { error: uploadError } = await supabase.storage
                        .from('property-images')
                        .upload(filePath, file)
```

### Correction recommandee

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

if (file.size > MAX_FILE_SIZE) {
    throw new Error("Fichier trop volumineux (max 10 Mo)")
}
if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Format de fichier non supporte")
}
```

---

## VULN-15 — Path traversal potentiel dans les noms de fichiers

- **Severite :** MOYENNE
- **Fichier :** `frontend/site/src/components/dashboard/owner/properties/property-form.tsx:145-147`
- **Fichier :** `frontend/site/src/components/dashboard/profile/personal-info-form.tsx:95-96`
- **Type :** Path traversal

### Description

L'extension du fichier est extraite directement du nom fourni par l'utilisateur :

```typescript
const fileExt = file.name.split('.').pop()
const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
```

Si `file.name` est `../../../etc/passwd`, `fileExt` sera `passwd` et le path pourrait devenir previsible. Plus dangereux : si l'API Storage ne sanitise pas, un nom comme `file.jpg/../../admin/hack` pourrait causer un path traversal.

### Correction recommandee

```typescript
const SAFE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
const fileExt = file.name.split('.').pop()?.toLowerCase()
if (!fileExt || !SAFE_EXTENSIONS.includes(fileExt)) {
    throw new Error("Extension de fichier non supportee")
}
```

---

## VULN-16 — Confiance client pour `propertyId` dans la declaration d'incident

- **Severite :** MOYENNE
- **Fichier :** `frontend/site/src/components/dashboard/tenant/incidents/create-incident-dialog.tsx:75-123`
- **Type :** Confiance client

### Description

Le `propertyId` et `leaseId` sont derives d'une requete cote client puis utilises pour l'insertion. Un attaquant peut modifier ces valeurs avant la soumission :

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

### Scenario d'exploitation

Un locataire modifie `propertyId` pour creer un incident sur une propriete a laquelle il n'est pas associe, causant du bruit chez un autre proprietaire.

### Correction recommandee

Deriver `propertyId` et `leaseId` cote serveur a partir du `user.id` authentifie, ou verifier la relation via RLS.

---

## VULN-17 — Absence de limite de longueur sur les champs texte

- **Severite :** MOYENNE
- **Fichier :** Multiples (formulaires)

### Description

Aucun champ de texte n'est limite cote application :
- `description` dans les incidents (affiche `500 caractères` mais aucune `maxLength` ou validation)
- `description` dans property-form (textarea sans maxLength)
- `title` dans add-document-dialog
- `message` dans sendNotification

### Scenario d'exploitation

Un attaquant soumet une description de 10 Mo, saturant la base de donnees et potentiellement causant des problemes d'affichage pour les autres utilisateurs.

### Correction recommandee

Ajouter `maxLength` aux composants HTML et valider cote application avant insertion.

---

## VULN-18 — Exposition de donnees sensibles des proprietaires

- **Severite :** BASSE
- **Fichier :** `frontend/site/src/app/dashboard/tenant/search/[id]/page.tsx:55-87`
- **Type :** Exposition d'informations

### Description

La page de detail d'un bien expose le telephone, l'email et l'avatar du proprietaire a tout utilisateur authentifie :

```55:59:frontend/site/src/app/dashboard/tenant/search/[id]/page.tsx
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name, phone, email, avatar_url, role')
                    .eq('id', data.owner_id)
                    .maybeSingle()
```

### Scenario d'exploitation

Un attaquant authentifie (meme en tant que locataire sans bail) peut parcourir toutes les proprietes et collecter les coordonnees de tous les proprietaires pour du spam/phishing.

### Correction recommandee

- Ne pas exposer l'email et le telephone tant que l'utilisateur n'a pas manifeste un interet reel (formulaire de contact intermediaire)
- Ou limiter via RLS l'acces aux profils proprietaires

---

## VULN-19 — Enumeration des locataires via RPC

- **Severite :** BASSE
- **Fichier :** `frontend/site/src/lib/supabase/tenant-onboarding-utils.ts:28-37`
- **Type :** Enumeration d'utilisateurs

### Description

```29:31:frontend/site/src/lib/supabase/tenant-onboarding-utils.ts
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_all_tenants')
```

La fonction `getAllTenants` retourne tous les profils avec le role `tenant`. Si la RPC n'est pas filtree par proprietaire, n'importe quel utilisateur authentifie peut obtenir la liste complete de tous les locataires de la plateforme.

### Correction recommandee

Verifier que la RPC `get_all_tenants` est restreinte cote Supabase (par exemple, filtrer par proprietaire ou verifier le role de l'appelant).

---

## VULN-20 — Absence de select explicite (`SELECT *`)

- **Severite :** BASSE
- **Fichier :** Multiples

### Occurrences

| Fichier | Ligne |
|---------|-------|
| `tenant-dashboard-utils.ts` | 57 | `.select('*')` sur `rent_payments` |
| `tenant-dashboard-utils.ts` | 89 | `.select('*')` sur `documents` |
| `tenant-dashboard-utils.ts` | 25-35 | `.select('*, property:properties(...)')` sur `leases` |
| `tenant/documents/page.tsx` | 30 | `.select('*')` sur `documents` |
| `property-grid.tsx` | 29 | `.select('*, images:...')` sur `properties` |
| `properties-client.tsx` | 26 | `.select('*, images:...')` sur `properties` |
| `notification-utils.ts` | 58 | `.select('*')` sur `notifications` |

### Probleme

`SELECT *` retourne toutes les colonnes, y compris potentiellement des champs sensibles (timestamps internes, metadonnees, champs deprecies). Cela augmente aussi le volume de donnees transferees.

### Correction recommandee

Remplacer tous les `SELECT *` par une liste explicite de colonnes necessaires.

---

## VULN-21 — Client Supabase instancie hors composant (fuite memoire potentielle)

- **Severite :** BASSE
- **Fichier :** `frontend/site/src/components/dashboard/owner/documents/document-card.tsx:16`
- **Fichier :** `frontend/site/src/components/dashboard/tenant/documents/document-list.tsx:16`

### Description

```16:16:frontend/site/src/components/dashboard/owner/documents/document-card.tsx
const supabase = createClient()
```

Le client Supabase est instancie au niveau du module, en dehors du composant React. Cela cree un client unique partage par toutes les instances du composant, ce qui peut causer des problemes de cache/session si l'utilisateur change, et empeche le garbage collection.

### Correction recommandee

Instancier le client dans le composant ou dans un hook custom.

---

## VULN-22 — Absence de gestion d'erreur silencieuse (fail-open)

- **Severite :** BASSE
- **Fichier :** Multiples

### Occurrences

| Fichier | Ligne | Contexte |
|---------|-------|----------|
| `tenant-onboarding-utils.ts` | 129-130 | `propError` ignore silencieusement l'echec de la mise a jour du statut |
| `tenant-onboarding-utils.ts` | 150 | `catch {}` vide sur l'envoi de notification |
| `tenant-onboarding-utils.ts` | 178-179 | `propError` ignore silencieusement |
| `tenant-onboarding-utils.ts` | 203 | `catch {}` vide |
| `auth/actions.ts` | 69-70 | `updateError` ignore silencieusement |
| `property-form.tsx` | 180 | `checkError` ignore silencieusement |

### Probleme

Les erreurs ignorees silencieusement (`catch {}` vide, variables d'erreur non traitees) peuvent masquer des defaillances critiques. Par exemple, si la mise a jour du statut de propriete echoue apres la creation du bail (ligne 129), la propriete reste marquee comme `available` alors qu'un bail `active` existe.

### Correction recommandee

Au minimum, logger toutes les erreurs. Pour les operations critiques, implementer un rollback ou une notification d'echec.

---

## Matrice de risques et priorisation

| # | Vulnerabilite | Severite | Effort fix | Priorite |
|---|---------------|----------|------------|----------|
| 01 | Escalade de privileges (role) | CRITIQUE | Faible | P0 |
| 02 | IDOR notifications | CRITIQUE | Moyen | P0 |
| 03 | IDOR terminateLease/updateLease | CRITIQUE | Faible | P0 |
| 04 | Mass assignment property | HAUTE | Moyen | P1 |
| 05 | Validation onboarding | HAUTE | Moyen | P1 |
| 06 | IDOR suppression proprietes | HAUTE | Faible | P1 |
| 07 | IDOR suppression documents | HAUTE | Faible | P1 |
| 08 | IDOR mise a jour incidents | HAUTE | Faible | P1 |
| 09 | IDOR notifications lues | HAUTE | Faible | P1 |
| 10 | IDOR suppression images | HAUTE | Faible | P1 |
| 11 | Absence de pagination | MOYENNE | Moyen | P2 |
| 12 | Requete search non filtree | MOYENNE | Moyen | P2 |
| 13 | Fuite messages d'erreur | MOYENNE | Faible | P2 |
| 14 | Upload sans validation | MOYENNE | Faible | P2 |
| 15 | Path traversal upload | MOYENNE | Faible | P2 |
| 16 | Confiance client incident | MOYENNE | Moyen | P2 |
| 17 | Champs texte sans limite | MOYENNE | Faible | P2 |
| 18 | Exposition donnees proprio | BASSE | Moyen | P3 |
| 19 | Enumeration locataires | BASSE | Faible | P3 |
| 20 | SELECT * partout | BASSE | Moyen | P3 |
| 21 | Client Supabase hors composant | BASSE | Faible | P3 |
| 22 | Erreurs silencieuses | BASSE | Moyen | P3 |

---

## Recommandations generales

### 1. Implementer des RLS (Row-Level Security) strictes
La majorite des IDOR peuvent etre neutralises par des RLS policies Supabase bien configurees. **Verifier que chaque table a des policies** pour INSERT, UPDATE, DELETE et SELECT basees sur `auth.uid()`.

### 2. Deplacer la logique critique vers des Server Actions / Edge Functions
Les operations sensibles (creation de bail, gestion de roles, terminaison de bail) ne devraient jamais etre effectuees directement depuis le client Supabase avec l'`anon` key. Utiliser des server actions Next.js ou des Edge Functions Supabase.

### 3. Valider toutes les entrees avec Zod
Ajouter un schema de validation Zod pour chaque operation d'ecriture (insert/update). Valider cote client ET cote serveur.

### 4. Ne jamais faire confiance aux identifiants fournis par le client
Tout `userId`, `ownerId`, `propertyId` doit etre derive de la session authentifiee (`supabase.auth.getUser()`) ou verifie via une jointure/RLS.

### 5. Mettre en place du rate limiting
Particulierement pour les operations sensibles (envoi de notifications, creation d'incidents, upload de fichiers).

### 6. Audit des RLS Supabase
Ce rapport couvre uniquement le code frontend. **Un audit complementaire des RLS policies et des fonctions RPC dans Supabase est indispensable** pour confirmer si les failles IDOR sont effectivement exploitables ou mitigees au niveau DB.

---

*Fin du rapport*
