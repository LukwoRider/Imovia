# Rapport d'Audit de Sécurité — IDOR & Contrôle d'Accès

**Cible :** Imovia — Recherche de biens, routes dynamiques `[id]`, formulaire d'édition  
**Périmètre :** Frontend Next.js (site), Frontend React Native (application), Politiques RLS Supabase  
**Date :** 6 mai 2026  
**Auditeur :** Audit de sécurité automatisé  
**Classification :** Confidentiel

---

## Résumé Exécutif

L'audit révèle **5 vulnérabilités** dont **2 critiques** et **1 haute**. Le problème structurel principal est que la majorité des contrôles d'autorisation sont délégués aux RLS Supabase côté base de données, tandis que le frontend ne vérifie **aucune possession** avant d'afficher un formulaire d'édition ou d'exécuter une suppression. Cela crée une surface d'attaque par manipulation d'URL et d'identifiants.

| Sévérité | Nombre | Résumé |
|----------|--------|--------|
| 🔴 Critique | 2 | IDOR sur édition de propriété + suppression sans vérification owner |
| 🟠 Haute | 1 | Divulgation de PII du propriétaire à tout visiteur authentifié |
| 🟡 Moyenne | 1 | Énumération d'identifiants de propriétés et accès aux biens non-publiés |
| 🔵 Faible | 1 | Fonctions RPC exposant l'annuaire complet des locataires |

---

## VULN-01 — IDOR Critique : Édition de propriété sans vérification de possession

**Sévérité : 🔴 CRITIQUE**  
**CVSS estimé : 8.1**  
**CWE-639 — Authorization Bypass Through User-Controlled Key**

### Fichiers affectés

- `frontend/site/src/app/dashboard/owner/properties/[id]/edit/page.tsx` (lignes 18–37)
- `frontend/site/src/components/dashboard/owner/properties/property-form.tsx` (lignes 95–131)

### Description

La page d'édition `EditPropertyPage` récupère un bien par son `id` depuis l'URL **sans aucune vérification que l'utilisateur connecté est le propriétaire (`owner_id`)** du bien.

```18:37:frontend/site/src/app/dashboard/owner/properties/[id]/edit/page.tsx
    useEffect(() => {
        async function fetchProperty() {
            setLoading(true)
            const { data, error } = await supabase
                .from('properties')
                .select('*, images:property_images(*)')
                .eq('id', propertyId)
                .single()

            if (error || !data) {
            } else {
                setProperty(data)
            }
            setLoading(false)
        }

        if (propertyId) {
            fetchProperty()
        }
    }, [propertyId, supabase])
```

Le formulaire `PropertyForm` envoie ensuite un `update` **sans contrainte `owner_id`** côté requête :

```117:121:frontend/site/src/components/dashboard/owner/properties/property-form.tsx
            if (mode === 'edit' && propertyId) {
                const { error } = await supabase
                    .from('properties')
                    .update(propertyData)
                    .eq('id', propertyId)
                if (error) throw error
```

### Facteurs atténuants

La politique RLS `properties_owner_update` bloque la modification au niveau base de données :

```sql
-- remote_schema.sql, ligne 1567
CREATE POLICY "properties_owner_update" ON "public"."properties"
  FOR UPDATE USING ((owner_id = public.current_user_id()))
  WITH CHECK ((owner_id = public.current_user_id()));
```

**Cependant**, la politique `properties_public_read_available` (ligne 1577) permet la lecture de **tout** bien disponible, ce qui signifie que :

1. L'attaquant peut **charger le formulaire d'édition** avec les données pré-remplies d'un bien qui ne lui appartient pas (`/dashboard/owner/properties/UUID-VICTIME/edit`).
2. L'UPDATE échouera silencieusement (aucun row matched), mais les **données sensibles du bien sont déjà exfiltrées** (description privée, loyer, etc.).
3. Le formulaire set `owner_id: user.id` dans `propertyData` (ligne 96), ce qui tente de **réassigner la propriété** à l'attaquant — bloqué par RLS mais indique une intention de design dangereuse.

### Scénario d'exploitation

```
1. Attaquant se connecte en tant que propriétaire B
2. Accède à /dashboard/owner/properties/<UUID-PROPRIETE-DE-A>/edit
3. Le formulaire se charge avec TOUTES les données du bien de A (adresse, loyer, description)
4. L'update échoue (RLS), MAIS les données sont déjà visibles
5. L'attaquant peut aussi tenter de supprimer les images via les boutons du formulaire
```

### Correctif recommandé

```typescript
// Dans EditPropertyPage, après le fetch :
const { data: { user } } = await supabase.auth.getUser()
if (data && data.owner_id !== user?.id) {
    setProperty(null) // Bloquer l'accès
    return
}
```

```typescript
// Dans PropertyForm, ajouter un filtre owner_id :
.update(propertyData)
.eq('id', propertyId)
.eq('owner_id', user.id) // Double vérification
```

---

## VULN-02 — IDOR Critique : Suppression de propriété sans vérification de possession (Mobile)

**Sévérité : 🔴 CRITIQUE**  
**CVSS estimé : 8.5**  
**CWE-639 — Authorization Bypass Through User-Controlled Key**

### Fichier affecté

- `frontend/application/app/bien/[id].tsx` (lignes 115–131)

### Description

La fonction `executeDelete` supprime un bien en utilisant uniquement l'`id` de l'URL, **sans vérifier que `userId === owner_id`** :

```115:131:frontend/application/app/bien/[id].tsx
const executeDelete = async () => {
    try {
        const { error } = await supabase
            .from("properties")
            .delete()
            .eq("id", id);

        if (error) throw error;
        router.back();
    } catch (error) {
        if (Platform.OS === 'web') {
            window.alert("Erreur : Impossible de supprimer le bien");
        } else {
            Alert.alert("Erreur", "Impossible de supprimer le bien");
        }
    }
};
```

De plus, le bouton de suppression est protégé uniquement par **le rôle** (`owner` ou `agency`), pas par la possession :

```471:471:frontend/application/app/bien/[id].tsx
                        {(userRole === 'owner' || userRole === 'agency') && (
```

### Facteurs atténuants

La RLS `properties_owner_delete` bloque la suppression :

```sql
CREATE POLICY "properties_owner_delete" ON "public"."properties"
  FOR DELETE USING ((owner_id = public.current_user_id()));
```

### Risque résiduel

- **Fuite d'information** : le bouton est affiché même pour les biens d'autres propriétaires.
- **Tentative de suppression** : l'erreur est catchée mais le message est générique — pas d'audit trail côté client.
- **Race condition** potentielle si un propriétaire malveillant manipule les requêtes directement via le SDK Supabase.

### Correctif recommandé

```typescript
// Remplacer la condition d'affichage du bouton :
{(userRole === 'owner' || userRole === 'agency') && userId === rawPropertyData?.owner_id && (
```

```typescript
// Dans executeDelete, ajouter :
.eq("id", id)
.eq("owner_id", userId) // Vérification explicite
```

---

## VULN-03 — Divulgation de PII du Propriétaire (Téléphone, Email, Nom, Avatar)

**Sévérité : 🟠 HAUTE**  
**CVSS estimé : 6.5**  
**CWE-200 — Exposure of Sensitive Information**

### Fichier affecté

- `frontend/site/src/app/dashboard/tenant/search/[id]/page.tsx` (lignes 54–87)

### Description

La page de détail d'un bien récupère le **profil complet du propriétaire** (nom, téléphone, email, avatar) et l'affiche **à tout utilisateur authentifié** qui accède à l'URL :

```54:59:frontend/site/src/app/dashboard/tenant/search/[id]/page.tsx
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name, phone, email, avatar_url, role')
                    .eq('id', data.owner_id)
                    .maybeSingle()
```

Ces données sont ensuite affichées en clair dans le sidebar (lignes 398–449), incluant :
- **Nom complet** du propriétaire
- **Numéro de téléphone** personnel (avec lien `tel:`)
- **Adresse email** personnelle (avec lien `mailto:`)
- **Photo de profil**

### Analyse RLS

Les politiques `profiles_select_own` et `profiles_select_lease_participants` devraient normalement empêcher la lecture de profils tiers. **Cependant**, cette requête est exécutée côté client avec `createClient()` (clé anon). Si les politiques RLS sont correctement appliquées, la requête devrait retourner `null` pour un utilisateur non lié au propriétaire.

**Le risque principal** : si un locataire a un bail actif avec ce propriétaire, il peut accéder aux PII via **n'importe quelle** propriété de ce propriétaire (pas seulement celle de son bail). De plus, la requête sur `agency_profiles` (lignes 71-75) fuit aussi les données métier de l'agence.

### Scénario d'exploitation

```
1. Locataire A a un bail avec Propriétaire X pour l'appartement P1
2. Propriétaire X possède aussi P2, P3, P4
3. Via la policy "profiles_select_lease_participants", le locataire A peut voir le profil de X
4. Le locataire A accède à /dashboard/tenant/search/<UUID-P2>
5. La requête profil fonctionne car il a accès au profil de X via le bail P1
6. Le locataire voit le téléphone/email personnel de X dans le contexte d'un bien sans rapport
```

### Correctif recommandé

Ne pas exposer les données PII directement. Utiliser une RPC dédiée avec des données masquées :

```sql
CREATE FUNCTION public.get_property_contact(p_property_id uuid)
RETURNS jsonb AS $$
  SELECT jsonb_build_object(
    'display_name', COALESCE(ap.agency_name, p.full_name),
    'phone_masked', overlay(p.phone placing '****' from 5 for 4),
    'has_email', p.email IS NOT NULL
  )
  FROM profiles p
  JOIN properties pr ON pr.owner_id = p.id
  LEFT JOIN agency_profiles ap ON ap.profile_id = p.id
  WHERE pr.id = p_property_id
    AND pr.status = 'available';
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## VULN-04 — Énumération d'IDs et Accès aux Biens Non-Publiés

**Sévérité : 🟡 MOYENNE**  
**CVSS estimé : 4.3**  
**CWE-200 / CWE-284**

### Fichiers affectés

- `frontend/site/src/app/dashboard/tenant/search/[id]/page.tsx` (lignes 44–48)
- `frontend/application/app/bien/[id].tsx` (lignes 136–148)
- `frontend/site/src/components/dashboard/tenant/search/property-grid.tsx` (lignes 27–31)

### Description

**Problème 1 : Accès direct sans filtre de statut**

La page de détail récupère un bien par `id` **sans filtrer par `status = 'available'`** :

```44:48:frontend/site/src/app/dashboard/tenant/search/[id]/page.tsx
            const { data, error } = await supabase
                .from('properties')
                .select('*, images:property_images(*)')
                .eq('id', propertyId)
                .single()
```

Alors que la grille de recherche filtre correctement :

```27:31:frontend/site/src/components/dashboard/tenant/search/property-grid.tsx
            const { data, error } = await supabase
                .from('properties')
                .select('*, images:property_images(*)')
                .eq('status', 'available')
                .order('created_at', { ascending: false })
```

**Conséquence** : la RLS permet la lecture de tous les biens `available` via `properties_public_read_available`. Un bien en statut `rented` ou `maintenance` reste accessible si l'utilisateur a un bail lié (via `properties_tenant_select_if_member`).

Mais sur le **frontend mobile** (`bien/[id].tsx`), la requête ne filtre **ni le statut ni le rôle** — elle récupère tout bien par ID.

**Problème 2 : UUIDs prévisibles**

Les IDs sont des UUID v4 (non-séquentiels), ce qui limite l'énumération par force brute. Cependant, les premiers caractères de l'UUID sont exposés dans le frontend :

```455:455:frontend/site/src/app/dashboard/tenant/search/[id]/page.tsx
                                    Ref: {property.id.split('-')[0].toUpperCase()}
```

Et les URLs contiennent les UUIDs complets, visibles dans l'historique du navigateur et les logs réseau.

### Correctif recommandé

```typescript
// Ajouter le filtre statut dans la page de détail côté tenant :
.eq('id', propertyId)
.eq('status', 'available') // ou utiliser .in('status', ['available'])
.single()
```

---

## VULN-05 — Fonctions RPC `get_all_tenants()` et `get_profile_by_email()` trop permissives

**Sévérité : 🔵 FAIBLE**  
**CVSS estimé : 3.7**  
**CWE-284 — Improper Access Control**

### Fichier affecté

- `supabase/migrations/20260222115000_search_profile_rpc.sql` (lignes 29–54)

### Description

La fonction `get_all_tenants()` retourne **l'intégralité** de la base locataires (id, nom, téléphone, avatar, email) à **tout utilisateur authentifié** :

```sql
-- search_profile_rpc.sql, lignes 30-53
CREATE FUNCTION public.get_all_tenants()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'phone', p.phone,
      'avatar_url', p.avatar_url,
      'email', au.email
    )
  ) FROM auth.users au
  JOIN public.profiles p ON p.id = au.id
  WHERE p.role = 'tenant';
$$;
```

La fonction `get_profile_by_email()` permet aussi une recherche par email, ce qui facilite la vérification d'inscription d'une personne sur la plateforme.

Ces deux fonctions sont `SECURITY DEFINER`, ce qui signifie qu'elles **contournent toutes les RLS**. Elles sont accessibles à tout `authenticated` user (propriétaire OU locataire).

### Scénario d'exploitation

```
1. Un locataire malveillant appelle supabase.rpc('get_all_tenants')
2. Il récupère les noms, téléphones et emails de TOUS les locataires de la plateforme
3. Exploitation RGPD : collecte massive de données personnelles
```

### Correctif recommandé

```sql
-- Restreindre à 'owner' et 'agency' uniquement :
CREATE FUNCTION public.get_all_tenants()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_role text;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role NOT IN ('owner', 'agency') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  -- ... suite existante ...
END; $$;
```

---

## Analyse complémentaire — Points vérifiés et conformes

### Injection via les filtres de recherche ✅

La `FilterBar` (`filter-bar.tsx`) utilise `URLSearchParams` et des `Number()` pour les valeurs numériques. Le filtrage dans `PropertyGrid` est effectué **côté client** en JavaScript (`.filter()`) après un fetch Supabase, ce qui empêche l'injection SQL. Les valeurs textuelles passent par `.toLowerCase().includes()` — pas de vecteur d'injection.

### RLS sur les opérations d'écriture ✅

Les politiques `properties_owner_insert`, `properties_owner_update`, `properties_owner_delete` vérifient toutes `owner_id = current_user_id()`. C'est une protection solide **côté base de données**.

### Stockage d'images ✅

Les politiques storage vérifient `p.owner_id = auth.uid()` pour l'upload, update et delete. La lecture est publique pour le bucket `property-images`, ce qui est cohérent avec l'affichage public des annonces.

---

## Matrice des Risques et Priorités

| ID | Vulnérabilité | Sévérité | Impact | Exploitabilité | Action |
|----|--------------|----------|--------|----------------|--------|
| VULN-01 | IDOR édition sans vérification owner (Site) | 🔴 Critique | Fuite de données + tentative de modification | Facile — URL prévisible | **Immédiat** |
| VULN-02 | IDOR suppression sans vérification owner (Mobile) | 🔴 Critique | Tentative de suppression + UI trompeuse | Facile — manipulation d'URL | **Immédiat** |
| VULN-03 | Divulgation PII propriétaire | 🟠 Haute | Fuite téléphone/email/nom | Facile — accès à toute fiche bien | **Sous 1 semaine** |
| VULN-04 | Énumération et accès biens non-publiés | 🟡 Moyenne | Accès biens rented/maintenance | Modéré — nécessite UUID | **Sous 2 semaines** |
| VULN-05 | RPC get_all_tenants() trop permissive | 🔵 Faible | Dump annuaire locataires | Facile — 1 appel RPC | **Sous 1 mois** |

---

## Recommandations Architecturales

1. **Principe de défense en profondeur** : Ne jamais se reposer uniquement sur les RLS. Ajouter des vérifications `owner_id === user.id` côté frontend avant d'afficher tout formulaire ou bouton d'action destructive.

2. **Pattern Guard Clause** : Implémenter un composant `<OwnerGuard propertyId={id}>` qui vérifie la possession avant le rendu de toute page d'édition/suppression.

3. **API dédiée pour les contacts** : Remplacer les requêtes directes sur `profiles` par des RPC qui masquent les données sensibles et vérifient le contexte d'accès.

4. **Audit de logs** : Les tentatives d'accès à des biens non-possédés devraient être logguées via `log_action()` pour détecter les comportements malveillants.

5. **Filtrage systématique par statut** : Toute requête côté tenant devrait inclure `.eq('status', 'available')` ou être protégée par une RPC qui enforce cette contrainte.

---

*Fin du rapport. Ce document est destiné à l'équipe de développement Imovia pour remédiation.*
