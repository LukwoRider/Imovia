# Audit de Sécurité — Deep Linking & Configuration de Scheme

**Application :** Imovia (Expo/React Native)  
**Date :** 6 mai 2026  
**Périmètre :** Configuration des deep links, URL scheme, validation des routes, garde d'authentification  
**Fichiers audités :**  
- `app.json`  
- `app/_layout.tsx`  
- `app/bien/[id].tsx`  
- `app/(tabs)/_layout.tsx`  

---

## Synthèse Exécutive

L'application Imovia utilise un **URL scheme personnalisé** (`application://`) pour le deep linking via expo-router. L'audit révèle **5 vulnérabilités**, dont **2 critiques** et **1 haute**, qui, combinées, permettent à une application malveillante installée sur le même appareil de **déclencher la suppression de biens immobiliers** sans aucune vérification de propriété.

| Sévérité | Nombre |
|----------|--------|
| Critique | 2 |
| Haute    | 1 |
| Moyenne  | 1 |
| Basse    | 1 |

---

## Vulnérabilité 1 — Scheme URL Générique et Détournable

**Sévérité : CRITIQUE**  
**CVSS 3.1 estimé : 8.1** (AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N)  
**CWE-939 :** Improper Authorization in Handler for Custom URL Scheme

### Constat

Dans `app.json`, le scheme est défini comme :

```json
"scheme": "application"
```

Le terme `application` est **extrêmement générique**. Sur Android comme sur iOS, **n'importe quelle application tierce** peut enregistrer le même scheme. Le système d'exploitation ne garantit pas l'unicité des schemes personnalisés.

### Impact

- **Android :** Lorsque deux applications déclarent le même scheme, Android affiche un dialogue de désambiguïsation ou, dans certaines versions, redirige silencieusement vers l'application la plus récemment installée. Une application malveillante peut **intercepter tous les deep links** destinés à Imovia.
- **iOS :** Avant iOS 13, le comportement était non déterministe. Depuis iOS 13, Apple favorise la dernière application installée. Dans tous les cas, le scheme personnalisé seul **ne garantit pas la livraison à la bonne application**.

### Données interceptables

Les deep links Imovia contiennent des **identifiants de ressources sensibles** (IDs de biens immobiliers, potentiellement des IDs utilisateurs). Une application interceptant `application://bien/UUID-DU-BIEN` obtient ces identifiants.

### Preuve de concept

1. Un attaquant publie une application déclarant `<data android:scheme="application" />` dans son `AndroidManifest.xml`
2. L'utilisateur clique sur un lien `application://bien/abc-123`
3. L'application malveillante intercepte le lien et récupère l'ID du bien

### Recommandations

1. **Renommer le scheme** avec un identifiant unique et non prédictible :
```json
"scheme": "imovia"
```
Ou mieux, un format qualifié avec le nom de domaine inversé :
```json
"scheme": "com.imovia.app"
```

2. **Implémenter les Universal Links (iOS) et App Links (Android)** — voir Vulnérabilité 3.

---

## Vulnérabilité 2 — Chaîne d'Attaque : Deep Link + IDOR de Suppression

**Sévérité : CRITIQUE**  
**CVSS 3.1 estimé : 8.7** (AV:N/AC:L/PR:N/UI:R/S:C/C:N/I:H/A:H)  
**CWE-284 :** Improper Access Control  
**CWE-639 :** Authorization Bypass Through User-Controlled Key (IDOR)

### Constat

La route `app/bien/[id].tsx` expose une fonctionnalité de suppression qui effectue un `DELETE` sur Supabase **sans vérifier que l'utilisateur courant est le propriétaire du bien** :

```115:131:app/bien/[id].tsx
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

Le paramètre `id` provient directement de `useLocalSearchParams()` (ligne 65), qui est alimenté par l'URL du deep link **sans aucune validation**.

### Scénario d'attaque complet

1. L'attaquant connaît ou devine l'UUID d'un bien (les UUIDs Supabase sont prévisibles si la politique `gen_random_uuid()` est utilisée côté client)
2. L'attaquant envoie un SMS/email/message contenant le lien : `application://bien/VICTIM_PROPERTY_UUID`
3. La victime (propriétaire connecté) clique sur le lien
4. L'application navigue vers `bien/[id].tsx` avec l'ID de la victime
5. Si la victime est un `owner` ou `agency`, le bouton "Supprimer" est affiché (lignes 471-511)
6. Même sans cliquer, si le RLS Supabase est mal configuré, un appel direct pourrait supprimer le bien

**Note critique :** La vérification côté client (`userRole === 'owner' || userRole === 'agency'`, ligne 471) est une vérification **d'affichage uniquement**. Elle ne constitue pas un contrôle d'accès. La fonction `executeDelete` n'ajoute pas de filtre `.eq("owner_id", userId)`.

### Impact

- **Suppression de biens immobiliers** appartenant à d'autres utilisateurs
- **Perte de données irréversible** (l'interface affiche "Cette action est irréversible")
- **Atteinte à l'intégrité** de la plateforme

### Recommandations

1. **Ajouter un filtre `owner_id` côté client** dans `executeDelete` :
```typescript
const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id)
    .eq("owner_id", userId);
```

2. **Implémenter une Row-Level Security (RLS) stricte** côté Supabase :
```sql
CREATE POLICY "owners_delete_own_properties" ON properties
  FOR DELETE USING (owner_id = auth.uid());
```

3. **Valider le paramètre `id`** avant toute opération (format UUID v4).

---

## Vulnérabilité 3 — Absence d'Universal Links / App Links

**Sévérité : HAUTE**  
**CVSS 3.1 estimé : 7.4** (AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:N/A:N)  
**CWE-295 :** Improper Certificate Validation (pas de vérification de domaine)

### Constat

Le fichier `app.json` ne contient **aucune configuration** pour :

- **iOS :** `associatedDomains` (requis pour les Universal Links)
- **Android :** `intentFilters` avec `autoVerify: true` (requis pour les App Links)

Configuration iOS actuelle (incomplète) :

```11:13:app.json
    "ios": {
      "supportsTablet": true
    },
```

Configuration Android actuelle (incomplète) :

```14:23:app.json
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false
    },
```

### Impact

L'application repose **exclusivement** sur le custom scheme (`application://`), qui est :
- Non sécurisé (pas de vérification cryptographique de l'émetteur)
- Détournable (cf. Vulnérabilité 1)
- Non vérifié par l'OS (contrairement aux Universal/App Links qui utilisent un fichier `.well-known` servi via HTTPS)

### Recommandations

Ajouter la configuration suivante dans `app.json` :

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "associatedDomains": ["applinks:imovia.fr"],
      "bundleIdentifier": "fr.imovia.app"
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "imovia.fr",
              "pathPrefix": "/app"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ],
      "package": "fr.imovia.app"
    }
  }
}
```

Puis héberger les fichiers de vérification :
- **iOS :** `https://imovia.fr/.well-known/apple-app-site-association`
- **Android :** `https://imovia.fr/.well-known/assetlinks.json`

---

## Vulnérabilité 4 — Condition de Course sur la Garde d'Authentification

**Sévérité : MOYENNE**  
**CVSS 3.1 estimé : 5.3** (AV:L/AC:H/PR:N/UI:R/S:U/C:L/I:H/A:N)  
**CWE-362 :** Concurrent Execution Using Shared Resource with Improper Synchronization

### Constat

La garde d'authentification dans `app/_layout.tsx` repose sur un `useEffect` asynchrone :

```39:59:app/_layout.tsx
  useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/(tabs)");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const inAuthGroup = segments[0] === "(tabs)";

      if (session && !inAuthGroup) {
        router.replace("/(tabs)");
      } else if (!session) {
        router.replace("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
```

### Problème

1. `getSession()` lit depuis le stockage local de manière **asynchrone**
2. Pendant la résolution de cette promesse, le composant `Stack` est déjà rendu (ligne 68) avec **toutes les routes accessibles**, y compris `bien/[id]`
3. Un deep link `application://bien/SOME_ID` pourrait déclencher la navigation vers `bien/[id]` **avant** que la vérification de session ne soit terminée
4. Le tableau de dépendances vide `[]` signifie que ce check ne se réexécute **jamais** après le montage initial

### Fenêtre d'exploitation

La fenêtre est courte (quelques centaines de millisecondes), mais sur des appareils lents ou lors d'un démarrage à froid, elle peut s'étendre. De plus, si `AsyncStorage` est lent à répondre, la fenêtre s'agrandit.

### Recommandations

1. **Bloquer le rendu** tant que l'état d'authentification n'est pas déterminé :
```typescript
const [authReady, setAuthReady] = useState(false);

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      router.replace("/(tabs)");
    }
    setAuthReady(true);
  });
  // ...
}, []);

if (!fontsLoaded || !authReady) {
  return null; // ou SplashScreen
}
```

2. **Valider la session dans chaque route protégée** (défense en profondeur), pas uniquement dans le layout racine.

---

## Vulnérabilité 5 — Absence de Validation des Paramètres de Route

**Sévérité : BASSE**  
**CVSS 3.1 estimé : 3.7** (AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:L/A:N)  
**CWE-20 :** Improper Input Validation

### Constat

Le paramètre `[id]` dans `app/bien/[id].tsx` est utilisé directement sans aucune validation :

```65:65:app/bien/[id].tsx
    const { id } = useLocalSearchParams<{ id: string }>();
```

Ce paramètre est ensuite passé directement à une requête Supabase :

```136:148:app/bien/[id].tsx
            const { data, error } = await supabase
                .from("properties")
                .select(`
                    *,
                    property_images (
                        storage_path
                    ),
                    profiles:owner_id (
                        phone
                    )
                `)
                .eq("id", id)
                .single();
```

Et à la suppression :

```117:120:app/bien/[id].tsx
        const { error } = await supabase
            .from("properties")
            .delete()
            .eq("id", id);
```

### Impact

- Bien que le client Supabase JS utilise des requêtes paramétrées (réduisant le risque d'injection SQL), l'absence de validation signifie que :
  - Des valeurs arbitraires sont envoyées au serveur (charge inutile, logs pollués)
  - Des erreurs non gérées peuvent survenir si le format n'est pas un UUID
  - Le paramètre pourrait contenir des caractères spéciaux pouvant affecter d'autres couches

### Recommandations

Ajouter une validation du format UUID avant toute utilisation :

```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const { id } = useLocalSearchParams<{ id: string }>();

if (!id || !UUID_REGEX.test(id)) {
  router.back();
  return null;
}
```

---

## Tableau Récapitulatif

| # | Vulnérabilité | Sévérité | CWE | Fichier | Ligne(s) |
|---|--------------|----------|-----|---------|----------|
| 1 | Scheme URL générique détournable | Critique | CWE-939 | `app.json` | 8 |
| 2 | IDOR suppression via deep link | Critique | CWE-284/639 | `app/bien/[id].tsx` | 115-131 |
| 3 | Absence Universal Links / App Links | Haute | CWE-295 | `app.json` | 11-23 |
| 4 | Race condition sur garde d'auth | Moyenne | CWE-362 | `app/_layout.tsx` | 39-59 |
| 5 | Absence de validation paramètres | Basse | CWE-20 | `app/bien/[id].tsx` | 65, 120, 148 |

---

## Plan de Remédiation Prioritaire

| Priorité | Action | Effort | Délai recommandé |
|----------|--------|--------|-------------------|
| P0 | Ajouter RLS Supabase `owner_id = auth.uid()` sur DELETE | Faible | Immédiat |
| P0 | Ajouter `.eq("owner_id", userId)` dans `executeDelete` | Faible | Immédiat |
| P1 | Renommer le scheme en `imovia` ou `com.imovia.app` | Faible | < 1 semaine |
| P1 | Bloquer le rendu avant résolution de `getSession()` | Faible | < 1 semaine |
| P2 | Configurer Universal Links (iOS) et App Links (Android) | Moyen | < 2 semaines |
| P2 | Valider le format UUID du paramètre `[id]` | Faible | < 1 semaine |
| P3 | Ajouter une vérification de session dans chaque route protégée | Moyen | < 3 semaines |

---

*Rapport généré dans le cadre de l'audit de sécurité Imovia — Deep Linking & URL Scheme.*
