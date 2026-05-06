# Rapport de sécurité — `AjouterBienModal.tsx`

**Fichier audité** : `frontend/application/components/biens/AjouterBienModal.tsx`  
**Date** : 6 mai 2026  
**Auditeur** : Pentest automatisé (analyse statique + revue architecture Supabase)  
**Contexte** : Application React Native (Expo) + Supabase (PostgREST + Storage)

---

## Résumé exécutif

Le composant `AjouterBienModal` gère la création et la modification de biens immobiliers. L'analyse croisée du code frontend et des politiques RLS/contraintes backend révèle une architecture de sécurité **globalement correcte côté serveur**, mais avec des **faiblesses côté client** qui dégradent l'expérience de sécurité en profondeur (defense-in-depth) et exposent à des scénarios d'abus subtils.

| Sévérité | Nombre |
|----------|--------|
| 🔴 Critique | 1 |
| 🟠 Haute | 2 |
| 🟡 Moyenne | 4 |
| 🔵 Basse | 3 |
| ℹ️ Informatif | 2 |

---

## 1. Contrôle d'identité du propriétaire (`owner_id`)

### 🟠 HAUTE — Le `ownerId` est un prop client, non vérifié côté frontend

**Constat** :  
Le `ownerId` est passé en tant que prop au composant (ligne 53, 68) et directement injecté dans l'objet `propertyData` (ligne 176) sans aucune vérification que cette valeur correspond à l'utilisateur authentifié :

```typescript
const propertyData = {
  owner_id: ownerId,  // Prop passée par le parent — jamais vérifiée ici
  ...
};
```

Dans `biens.tsx`, `ownerId` est dérivé de `userId` qui vient de `supabase.auth.getSession()`, ce qui est correct. Cependant, le composant modal est exporté et **réutilisable** — n'importe quel parent pourrait passer un `ownerId` arbitraire.

**Protection backend** :  
La politique RLS `properties_owner_insert` impose `owner_id = current_user_id()` sur INSERT. La politique `properties_owner_update` impose `owner_id = current_user_id()` sur les USING et WITH CHECK de UPDATE. **Le backend bloque donc les tentatives d'usurpation.**

**Risque résiduel** :  
Si un développeur réutilise ce composant avec un `ownerId` incorrect, ou si un attaquant intercepte et modifie le state React (React DevTools, injection mémoire sur appareil jailbreaké), la requête échouera côté serveur mais l'erreur sera cryptique pour l'utilisateur.

**Recommandation** :  
Ajouter une vérification explicite dans `handleSave` :
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user || user.id !== ownerId) {
  Alert.alert('Erreur', 'Session invalide. Veuillez vous reconnecter.');
  return;
}
```

---

## 2. Mode édition — Vérification de propriété avant UPDATE

### 🔴 CRITIQUE — Aucune vérification côté client que l'utilisateur est propriétaire du bien édité

**Constat** :  
En mode édition, le composant exécute un `.update()` filtré par `.eq('id', editProperty.id)` (ligne 200-201), mais **ne vérifie pas que `editProperty.id` appartient à l'utilisateur courant** :

```typescript
const { data, error } = await supabase
  .from('properties')
  .update(propertyData)
  .eq('id', editProperty.id)  // Seul filtre : l'ID du bien
  .select()
  .single();
```

De plus, l'`owner_id` dans `propertyData` est **écrasé** à la valeur du prop `ownerId` lors de l'update. Si un attaquant pouvait appeler ce composant avec un `editProperty.id` d'un bien d'un autre utilisateur, la requête tenterait de changer le `owner_id` du bien.

**Protection backend** :  
La politique RLS `properties_owner_update` exige `owner_id = current_user_id()` dans les clauses USING (le bien doit déjà appartenir à l'utilisateur) ET WITH CHECK (la nouvelle valeur de `owner_id` doit aussi être l'utilisateur courant). **Le backend bloque l'attaque IDOR.**

**Risque résiduel** : **Moyen-Élevé**  
- La dépendance à RLS seule viole le principe de defense-in-depth
- Le message d'erreur Supabase en cas de refus RLS est "0 rows" (pas d'exception), ce qui peut être silencieusement ignoré si le code ne vérifie pas `data === null`
- Le code actuel fait `if (error) throw error` mais un refus RLS sur UPDATE **ne retourne pas d'erreur** — il retourne simplement `data: null`. La ligne `.single()` va alors lancer une erreur obscure ("JSON object requested, multiple (or no) rows returned") qui n'est pas informative.

**Recommandation** :  
1. Ajouter `.eq('owner_id', ownerId)` au filtre UPDATE
2. Vérifier que `data` n'est pas null après l'update
3. Vérifier `user.id === ownerId` avant toute opération

```typescript
const { data, error } = await supabase
  .from('properties')
  .update(propertyData)
  .eq('id', editProperty.id)
  .eq('owner_id', ownerId)  // Double sécurité
  .select()
  .single();
if (error) throw error;
if (!data) throw new Error('Bien introuvable ou accès refusé.');
```

---

## 3. Upload d'images — Validation MIME, taille, path traversal

### 🟡 MOYENNE — Validation MIME type insuffisante côté client

**Constat** :  
Le type MIME est déduit de l'extension du fichier (ligne 264-265), pas du contenu réel :

```typescript
const ext = imageUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
```

Un fichier `malware.svg.jpg` serait classé en `image/jpeg`. Un fichier sans extension serait aussi classé en `image/jpeg`.

**Protection backend** :  
- La politique storage `property_images_storage_insert` vérifie que le chemin correspond à `properties/{property_id}` et que `properties.owner_id = auth.uid()`. Cela empêche l'upload vers le chemin d'un autre utilisateur.
- Cependant, **Supabase Storage n'effectue pas de validation MIME côté serveur par défaut** sauf si une restriction est configurée sur le bucket.

**Recommandation** :  
- Configurer `allowedMimeTypes` sur le bucket `property-images` côté Supabase : `['image/jpeg', 'image/png', 'image/webp']`
- Configurer `maxFileSize` sur le bucket (ex: 10 Mo)

### 🔵 BASSE — Pas de limite sur le nombre d'images uploadées

**Constat** :  
`pickImages` ajoute les nouvelles images aux images existantes sans limite :

```typescript
setSelectedImages((prev) => [
  ...prev,
  ...result.assets.map((a) => a.uri),
]);
```

Un utilisateur pourrait accumuler des centaines d'images, générant un coût storage disproportionné et un temps d'upload excessif.

**Recommandation** :  
Limiter à un maximum raisonnable (ex: 20 images par bien) côté client ET côté serveur (via un trigger ou un check dans la table `property_images`).

### 🔵 BASSE — Path traversal neutralisé mais construction du chemin fragile

**Constat** :  
Le `fileName` est construit côté client (ligne 266) :

```typescript
const fileName = `properties/${property.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
```

L'utilisation de `property.id` (UUID retourné par Supabase) et d'un timestamp+random rend le path traversal impossible en pratique. Le backend valide aussi le chemin via `storage_property_id_from_path()`. C'est correct.

**Risque résiduel** : Négligeable.

---

## 4. Statut du bien — Escalade de privilèges

### 🟡 MOYENNE — Le statut est forcé à `'available'` mais le type `property_status` autorise des valeurs sensibles

**Constat** :  
Le code force `status: 'available'` en dur (ligne 184) pour la création et la modification :

```typescript
const propertyData = {
  ...
  status: 'available',
  ...
};
```

C'est correct : un propriétaire ne devrait pas pouvoir forcer `status: 'rented'` sans passer par le flux officiel de bail. L'enum PostgreSQL autorise `draft`, `available`, `rented`, `maintenance`, `archived`.

**Vulnérabilité** :  
Via un proxy HTTP (Burp Suite, mitmproxy) ou un appel direct à l'API PostgREST, un attaquant pourrait modifier le payload pour envoyer `status: 'rented'` ou `status: 'draft'`. **Il n'existe pas de contrainte CHECK ni de trigger côté serveur empêchant un owner de mettre un statut arbitraire sur son propre bien.** La RLS autorise l'update si `owner_id = current_user_id()`, sans restriction sur les colonnes modifiées.

**Impact** :  
- Un propriétaire pourrait marquer un bien comme `rented` sans bail actif, faussant les KPI et les vues de tableau de bord
- Un propriétaire pourrait mettre un bien en `archived` pour le cacher des résultats de recherche tout en gardant un bail actif

**Recommandation** :  
Créer un trigger `BEFORE UPDATE ON properties` qui valide les transitions de statut autorisées :
```sql
CREATE FUNCTION enforce_property_status_transition() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'available' AND NEW.status NOT IN ('available', 'rented', 'archived') THEN
    RAISE EXCEPTION 'Transition de statut invalide';
  END IF;
  IF NEW.status = 'rented' AND NOT EXISTS (
    SELECT 1 FROM leases WHERE property_id = NEW.id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Impossible de passer en loué sans bail actif';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Validation des champs financiers et numériques

### 🟠 HAUTE — Aucune validation côté client sur les valeurs numériques

**Constat** :  
Les champs `rent`, `surface`, `rooms`, `bathrooms`, `floor` sont stockés comme des strings (state `useState('')`) et convertis en nombres via `Number()` sans validation :

```typescript
monthly_rent: Number(rent),     // "" → 0, "abc" → NaN, "-50" → -50
surface_m2: Number(surface),    // "" → 0, "0" → 0
rooms: Number(rooms),           // "-1" → -1
bathrooms: Number(bathrooms) || 0,
floor_number: Number(floor) || 0,
```

**Scénarios d'attaque** :

| Entrée | Résultat `Number()` | Accepté par RLS ? | Accepté par CHECK ? |
|--------|---------------------|--------------------|--------------------|
| `""` | `0` | Oui | Oui (`>= 0`) |
| `"-50"` | `-50` | Oui | **Non** (CHECK refuse `monthly_rent < 0`) |
| `"abc"` | `NaN` | PostgreSQL rejette | — |
| `"99999999999"` | `99999999999` | Oui | **Overflow `numeric(10,2)`** |
| `"0"` | `0` | Oui | Oui (`>= 0`, pas `> 0`) |

**Protection backend** :  
- `properties_monthly_rent_non_negative` : `monthly_rent >= 0` — autorise **0 €** de loyer
- `properties_rooms_non_negative` : `rooms >= 0` — autorise **0 pièces**
- `properties_bathrooms_non_negative` : `bathrooms >= 0`
- `properties_floor_number_non_negative` : `floor_number >= 0`
- `surface_m2` est de type `numeric(10,2)` mais **aucune contrainte CHECK n'est définie** (ni `>= 0`, ni `> 0`)

**Risques** :
1. Un bien avec **loyer = 0 €**, **surface = 0 m²**, **0 pièces** peut être créé — données aberrantes
2. La `surface_m2` peut être **négative** (pas de CHECK)
3. `NaN` sera rejeté par PostgreSQL mais génère une erreur non gérée côté UI
4. Le `keyboardType="numeric"` sur mobile n'empêche pas les valeurs négatives ni les caractères non-numériques sur tous les claviers (notamment Android)

**Recommandations** :  
- **Frontend** : Ajouter une validation avant soumission :
```typescript
const rentNum = Number(rent);
if (isNaN(rentNum) || rentNum <= 0) {
  Alert.alert('Erreur', 'Le loyer doit être un nombre positif.');
  return;
}
```
- **Backend** : Modifier les contraintes pour interdire les zéros sur les champs critiques :
```sql
ALTER TABLE properties DROP CONSTRAINT properties_monthly_rent_non_negative;
ALTER TABLE properties ADD CONSTRAINT properties_monthly_rent_positive
  CHECK (monthly_rent IS NULL OR monthly_rent > 0);

ALTER TABLE properties ADD CONSTRAINT properties_surface_positive
  CHECK (surface_m2 IS NULL OR surface_m2 > 0);

ALTER TABLE properties DROP CONSTRAINT properties_rooms_non_negative;
ALTER TABLE properties ADD CONSTRAINT properties_rooms_positive
  CHECK (rooms IS NULL OR rooms > 0);
```

---

## 6. Valeurs négatives et zéro

### 🟡 MOYENNE — Surface peut être négative (aucun CHECK backend)

**Constat** :  
Voir section 5. Le champ `surface_m2` de type `numeric(10,2)` n'a **aucune contrainte CHECK** dans les migrations auditées. Seuls `monthly_rent`, `rooms`, `bathrooms` et `floor_number` ont des contraintes `>= 0`.

Un utilisateur pourrait soumettre `surface_m2 = -100` qui serait accepté.

**Recommandation** :  
```sql
ALTER TABLE public.properties
  ADD CONSTRAINT properties_surface_positive
  CHECK (surface_m2 IS NULL OR surface_m2 > 0);
```

---

## 7. Champ description — Longueur et XSS

### 🔵 BASSE — Risque XSS faible mais pas nul

**Constat** :  
Le composant `TextInput` a une `maxLength={500}` (ligne 706) et la base de données a une contrainte `properties_description_max_500` (`char_length(description) <= 500`). Le compteur est visible en UI (ligne 710-712). C'est bien.

**XSS** :  
- React Native utilise des composants natifs (`<Text>`), pas du HTML. Il n'y a **pas de `dangerouslySetInnerHTML`** ni de WebView dans ce composant. Le risque XSS est donc **très faible** dans le contexte React Native.
- **Cependant**, si ces données sont affichées dans une application web (backoffice, site vitrine) sans échappement, un payload comme `<img onerror=alert(1) src=x>` dans la description serait exécuté.

**Contournement `maxLength`** :  
La propriété `maxLength` sur un `TextInput` est une protection côté UI uniquement. Un appel direct à l'API Supabase (curl, Postman) contourne cette limite. **La contrainte CHECK backend** bloque correctement les descriptions > 500 caractères.

**Recommandation** :  
- S'assurer que tout affichage web futur de la description utilise un échappement HTML approprié
- Envisager un sanitize côté serveur (trigger) si un frontend web est prévu

### ℹ️ INFORMATIF — Pas de sanitization des entrées textuelles

Les champs `address`, `city`, `postal_code` n'ont aucun filtrage de caractères spéciaux. Dans un contexte React Native c'est acceptable, mais ces données pourraient être exploitées si elles sont injectées dans des requêtes SQL raw, des templates email, ou des exports PDF.

---

## 8. Suppression d'images — IDOR potentiel atténué

### 🟡 MOYENNE — La suppression d'images en mode édition ne vérifie pas la propriété côté client

**Constat** :  
Lors de la suppression d'images existantes (lignes 218-244), le code :
1. Identifie les images supprimées par comparaison d'URL
2. Extrait le `storage_path` de l'URL publique
3. Supprime de `property_images` via `.eq('property_id', property.id).eq('storage_path', storagePath)`
4. Supprime du bucket storage

```typescript
await supabase
  .from('property_images')
  .delete()
  .eq('property_id', property.id)
  .eq('storage_path', storagePath);
```

**Protection backend** :  
- La politique RLS `property_images_owner_all` impose que `properties.owner_id = current_user_id()` pour les opérations DELETE. Un attaquant ne peut donc pas supprimer les images d'un bien qui ne lui appartient pas.
- La politique storage `property_images_storage_delete` vérifie aussi la propriété.

**Risque résiduel** : Faible. La protection repose entièrement sur RLS.

---

## 9. Fuite d'information dans les logs

### ℹ️ INFORMATIF — Logs verbeux en production

**Constat** :  
Le code contient de nombreux `console.log` et `console.error` (lignes 228, 239, 251, 267, 272, 286, 293, 299, 302, 317, 334) qui exposent en console :
- Les chemins de stockage des images
- Les tailles de blob
- Les erreurs Supabase avec détails

En production React Native, ces logs sont visibles via `adb logcat` (Android) ou la console Xcode (iOS), et sur les outils de monitoring type Sentry si configurés.

**Recommandation** :  
Utiliser un wrapper de log conditionnel (`__DEV__`) ou supprimer les logs verbeux en production.

---

## 10. Gestion de la date `available_from`

### 🔵 INFORMATIF — Parsing de date permissif

**Constat** :  
Le parsing de la date (lignes 168-173) ne valide pas que la date est réelle :

```typescript
if (availableFrom && availableFrom.length === 10) {
  const parts = availableFrom.split('/');
  if (parts.length === 3) {
    isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
}
```

L'entrée `99/99/9999` produirait `9999-99-99` qui serait rejeté par PostgreSQL (date invalide). Pas de risque de sécurité mais une mauvaise expérience utilisateur.

---

## Tableau récapitulatif

| # | Vulnérabilité | Sévérité | Backend protège ? | Action requise |
|---|--------------|----------|-------------------|----------------|
| 1 | `ownerId` non vérifié contre session | 🟠 Haute | ✅ RLS bloque | Ajouter vérification client |
| 2 | UPDATE sans vérification propriété | 🔴 Critique | ✅ RLS bloque | Ajouter `.eq('owner_id')` + vérif `data != null` |
| 3 | MIME type déduit de l'extension | 🟡 Moyenne | ❌ Pas de validation bucket | Configurer `allowedMimeTypes` sur bucket |
| 4 | Pas de limite nombre d'images | 🔵 Basse | ❌ Aucune limite | Ajouter limite client + trigger |
| 5 | Statut manipulable via API directe | 🟡 Moyenne | ❌ Pas de transition check | Ajouter trigger de transition |
| 6 | Valeurs 0 / NaN acceptées | 🟠 Haute | ⚠️ Partiel (`>= 0`) | Renforcer CHECK (`> 0`) |
| 7 | `surface_m2` peut être négative | 🟡 Moyenne | ❌ Pas de CHECK | Ajouter contrainte |
| 8 | XSS via description (futur web) | 🔵 Basse | ⚠️ Partiel (max 500) | Sanitize si affichage web |
| 9 | Suppression images IDOR | 🟡 Moyenne | ✅ RLS bloque | OK — monitoring recommandé |
| 10 | Logs verbeux | ℹ️ Info | N/A | Supprimer en production |

---

## Conclusion

La sécurité de ce composant repose **quasi-exclusivement sur les politiques RLS de Supabase**, ce qui est un choix d'architecture courant mais fragile en cas de misconfiguration future. Les contrôles côté client sont insuffisants pour un composant critique de gestion de patrimoine immobilier.

**Actions prioritaires** :
1. **Ajouter des CHECK constraints** plus strictes (`> 0` au lieu de `>= 0`) sur `monthly_rent`, `rooms`, `surface_m2`
2. **Configurer le bucket** `property-images` avec `allowedMimeTypes` et `maxFileSize`
3. **Ajouter un trigger de transition de statut** sur `properties`
4. **Renforcer la validation client** pour une meilleure UX et defense-in-depth
5. **Supprimer les logs** verbeux avant la mise en production
