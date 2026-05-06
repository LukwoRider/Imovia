# Rapport d'Audit de Sécurité — `profile.tsx`

**Fichier audité :** `app/(tabs)/profile.tsx`
**Date :** 6 mai 2026
**Auditeur :** Pentest Expert
**Portée :** Analyse statique du code source (revue de code)

---

## Résumé exécutif

L'écran de profil utilisateur présente **7 vulnérabilités** identifiées, dont **2 critiques** et **2 élevées**. La faille la plus grave permet à un attaquant ayant accès à une session (vol de token, appareil non verrouillé, XSS) de **changer le mot de passe du compte sans connaître l'ancien**, ce qui constitue un détournement complet du compte (*Account Takeover*).

| Sévérité | Nombre |
|----------|--------|
| 🔴 Critique | 2 |
| 🟠 Élevée | 2 |
| 🟡 Moyenne | 2 |
| 🔵 Faible | 1 |

---

## Vulnérabilités détaillées

---

### VULN-01 — Changement de mot de passe sans ré-authentification

| | |
|---|---|
| **Sévérité** | 🔴 **CRITIQUE** |
| **CVSS v3.1** | 8.8 (AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H) |
| **CWE** | CWE-306 — Missing Authentication for Critical Function |
| **Lignes** | 110–141 |

**Constat :**

La fonction `handleUpdatePassword()` appelle directement `supabase.auth.updateUser({ password: newPassword })` sans jamais vérifier le mot de passe actuel de l'utilisateur. Un champ d'interface `currentPassword` est bien défini (ligne 33) et un `<Input>` est rendu dans l'UI (lignes 273–279), mais **cette valeur n'est jamais utilisée dans la logique de mise à jour**.

```110:141:/tmp/imovia-audit/frontend/application/app/(tabs)/profile.tsx
  async function handleUpdatePassword() {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }
    // ...
    const { error } = await supabase.auth.updateUser({
      password: newPassword,   // ← currentPassword jamais vérifié
    });
```

**Scénario d'attaque :**

1. L'attaquant obtient un accès temporaire à la session (appareil non verrouillé, vol de JWT via XSS, etc.).
2. Il navigue sur l'écran profil et saisit un nouveau mot de passe sans connaître l'ancien.
3. Le mot de passe est changé → le propriétaire légitime est verrouillé hors de son compte (*Account Takeover*).

**Remédiation :**

Avant d'appeler `updateUser`, ré-authentifier l'utilisateur via `supabase.auth.signInWithPassword()` avec le mot de passe actuel :

```typescript
const { error: authError } = await supabase.auth.signInWithPassword({
  email: (await supabase.auth.getUser()).data.user?.email || "",
  password: currentPassword,
});
if (authError) {
  Alert.alert("Erreur", "Le mot de passe actuel est incorrect.");
  return;
}
```

---

### VULN-02 — Absence de politique de complexité du mot de passe

| | |
|---|---|
| **Sévérité** | 🔴 **CRITIQUE** |
| **CVSS v3.1** | 8.1 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N) |
| **CWE** | CWE-521 — Weak Password Requirements |
| **Lignes** | 111–113 |

**Constat :**

La seule validation effectuée est la non-vacuité des champs et la correspondance entre `newPassword` et `confirmPassword`. Aucune vérification n'est faite sur :

- La longueur minimale (recommandation : ≥ 12 caractères, ANSSI / NIST SP 800-63B)
- La complexité (majuscules, chiffres, caractères spéciaux)
- La non-réutilisation d'anciens mots de passe
- La présence dans des dictionnaires de mots de passe compromis (ex. Have I Been Pwned)

```111:113:/tmp/imovia-audit/frontend/application/app/(tabs)/profile.tsx
    if (!newPassword || !confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
```

**Impact :** Un utilisateur peut définir `"a"` comme mot de passe, rendant le compte trivial à compromettre par force brute ou *credential stuffing*.

**Remédiation :**

Implémenter une validation côté client ET côté serveur (via Supabase Auth hooks ou un *edge function*) :

```typescript
function validatePassword(password: string): string | null {
  if (password.length < 12) return "Le mot de passe doit contenir au moins 12 caractères.";
  if (!/[A-Z]/.test(password)) return "Le mot de passe doit contenir au moins une majuscule.";
  if (!/[a-z]/.test(password)) return "Le mot de passe doit contenir au moins une minuscule.";
  if (!/[0-9]/.test(password)) return "Le mot de passe doit contenir au moins un chiffre.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Le mot de passe doit contenir au moins un caractère spécial.";
  return null;
}
```

> **Note :** La validation côté client n'est qu'un confort UX ; la véritable protection doit être appliquée côté serveur.

---

### VULN-03 — Absence d'invalidation des sessions après changement de mot de passe

| | |
|---|---|
| **Sévérité** | 🟠 **ÉLEVÉE** |
| **CVSS v3.1** | 7.1 (AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:L/A:N) |
| **CWE** | CWE-613 — Insufficient Session Expiration |
| **Lignes** | 127–132 |

**Constat :**

Après un changement de mot de passe réussi (ligne 129), aucune invalidation des autres sessions n'est effectuée. Tous les tokens JWT précédemment émis restent valides jusqu'à leur expiration naturelle.

```127:132:/tmp/imovia-audit/frontend/application/app/(tabs)/profile.tsx
      if (error) throw error;

      Alert.alert("Succès", "Votre mot de passe a été mis à jour.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
```

**Scénario d'attaque :**

1. L'utilisateur détecte un accès non autorisé à son compte.
2. Il change son mot de passe en espérant révoquer l'accès de l'attaquant.
3. L'attaquant conserve son JWT actif et continue d'accéder au compte.

**Remédiation :**

Après la mise à jour réussie, invalider toutes les autres sessions :

```typescript
await supabase.auth.signOut({ scope: "others" });
```

---

### VULN-04 — Escalade de privilèges via `user_metadata.role`

| | |
|---|---|
| **Sévérité** | 🟠 **ÉLEVÉE** |
| **CVSS v3.1** | 7.5 (AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:L/A:N) |
| **CWE** | CWE-639 — Authorization Bypass Through User-Controlled Key |
| **Lignes** | 65 |

**Constat :**

La détermination du rôle de l'utilisateur utilise une chaîne de *fallback* :

```65:65:/tmp/imovia-audit/frontend/application/app/(tabs)/profile.tsx
        const role = profile.role || user.user_metadata?.role || "tenant";
```

Le champ `user_metadata` est **contrôlable par le client** via `supabase.auth.updateUser({ data: { role: "agency" } })`. Si `profile.role` est `null` ou vide (ce qui peut survenir lors de la création du compte, avant que le profil ne soit complet), le rôle est déterminé par `user_metadata`, ce qui permet une escalade de privilèges.

**Scénario d'attaque :**

1. Un locataire (`tenant`) appelle `supabase.auth.updateUser({ data: { role: "agency" } })` depuis la console navigateur ou un outil API.
2. Si `profile.role` est `null`, l'application lui attribue le rôle `"agency"`.
3. L'utilisateur accède aux fonctionnalités réservées aux agences (SIRET, gestion de biens, etc.).

**Remédiation :**

- Ne **jamais** utiliser `user_metadata` comme source de vérité pour le rôle.
- Lire le rôle **uniquement** depuis la table `profiles` côté serveur.
- Supprimer le *fallback* vers `user_metadata` :

```typescript
const role = profile.role || "tenant";
```

- Ajouter une *Row Level Security* (RLS) policy empêchant la mise à jour du champ `role` par l'utilisateur.

---

### VULN-05 — Désynchronisation de l'email entre Auth et Profiles

| | |
|---|---|
| **Sévérité** | 🟡 **MOYENNE** |
| **CVSS v3.1** | 5.4 (AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:N) |
| **CWE** | CWE-1255 — Comparison Logic is Vulnerable to Power Side-Channel Attacks / CWE-345 — Insufficient Verification of Data Authenticity |
| **Lignes** | 144–178, 229–234 |

**Constat :**

L'UI permet de modifier le champ email (lignes 229–234 : `<ProfileInfoField icon="mail" value={email} onChangeText={setEmail} />`), mais la fonction `handleUpdateProfile()` ne met **pas** à jour l'email via `supabase.auth.updateUser({ email })`. L'email modifié dans l'UI est ignoré.

Cela crée deux problèmes :

1. **Confusion UX** : l'utilisateur croit avoir changé son email, mais `auth.users.email` reste inchangé.
2. **Fausse sécurité** : si le champ email était propagé vers `profiles` sans passer par le flux de vérification Supabase Auth, cela contournerait la vérification d'email.

**Remédiation :**

- Rendre le champ email **en lecture seule** (`editable={false}`) ou le retirer de l'UI éditable.
- Si le changement d'email est souhaité, le traiter via `supabase.auth.updateUser({ email: newEmail })` qui déclenche un flux de confirmation par email.

---

### VULN-06 — Exposition de messages d'erreur internes

| | |
|---|---|
| **Sévérité** | 🟡 **MOYENNE** |
| **CVSS v3.1** | 4.3 (AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N) |
| **CWE** | CWE-209 — Generation of Error Message Containing Sensitive Information |
| **Lignes** | 104, 134–138, 169–173 |

**Constat :**

Les messages d'erreur bruts de Supabase (`error.message`) sont affichés directement à l'utilisateur via `Alert.alert()` :

```134:138:/tmp/imovia-audit/frontend/application/app/(tabs)/profile.tsx
      console.error("[Profile] Update password error:", error);
      Alert.alert(
        "Erreur",
        "Impossible de mettre à jour le mot de passe : " + error.message
      );
```

Ces messages peuvent contenir :

- Des noms de tables/colonnes de la base de données
- Des messages d'erreur PostgreSQL (violation de contrainte, etc.)
- Des détails sur l'infrastructure Supabase (URL, version)

**Remédiation :**

Afficher un message d'erreur générique à l'utilisateur et logger le détail en interne :

```typescript
console.error("[Profile] Update password error:", error);
Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
```

---

### VULN-07 — `SELECT *` sur la table `profiles`

| | |
|---|---|
| **Sévérité** | 🔵 **FAIBLE** |
| **CVSS v3.1** | 3.1 (AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:N/A:N) |
| **CWE** | CWE-200 — Exposure of Sensitive Information to an Unauthorized Actor |
| **Lignes** | 56–60 |

**Constat :**

La requête récupère toutes les colonnes de la table `profiles` :

```56:60:/tmp/imovia-audit/frontend/application/app/(tabs)/profile.tsx
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
```

Si la table `profiles` contient des champs sensibles (ex. `password_hash`, `internal_notes`, `kyc_document_url`, `iban`, etc.), ceux-ci sont transférés au client même s'ils ne sont pas affichés.

**Remédiation :**

Spécifier explicitement les colonnes nécessaires :

```typescript
.select("role, full_name, phone")
```

Et s'assurer que les RLS policies de Supabase restreignent l'accès aux colonnes sensibles.

---

## Matrice de risques

| ID | Vulnérabilité | Sévérité | Exploitabilité | Impact |
|---|---|---|---|---|
| VULN-01 | Changement MDP sans ré-auth | 🔴 Critique | Facile | Account Takeover |
| VULN-02 | Pas de politique MDP | 🔴 Critique | Facile | Compromission par brute force |
| VULN-03 | Sessions non invalidées | 🟠 Élevée | Facile | Persistance d'accès malveillant |
| VULN-04 | Rôle via user_metadata | 🟠 Élevée | Moyen | Escalade de privilèges |
| VULN-05 | Désync email Auth/Profiles | 🟡 Moyenne | Facile | Confusion / contournement |
| VULN-06 | Exposition erreurs internes | 🟡 Moyenne | Facile | Fuite d'information |
| VULN-07 | SELECT * | 🔵 Faible | Difficile | Fuite de données potentielle |

---

## Recommandations prioritaires

### Immédiat (Sprint en cours)
1. **VULN-01** : Implémenter la ré-authentification via `signInWithPassword` avant tout changement de mot de passe.
2. **VULN-02** : Ajouter une validation de complexité du mot de passe côté client et serveur.
3. **VULN-03** : Appeler `signOut({ scope: "others" })` après changement de mot de passe.

### Court terme (< 2 semaines)
4. **VULN-04** : Supprimer le fallback `user_metadata.role` et verrouiller le champ `role` via RLS.
5. **VULN-05** : Rendre le champ email en lecture seule ou implémenter le flux de changement d'email Supabase.

### Moyen terme (< 1 mois)
6. **VULN-06** : Centraliser la gestion des erreurs avec des messages utilisateur génériques.
7. **VULN-07** : Remplacer `SELECT *` par une sélection explicite des colonnes sur toutes les requêtes client.

---

## Annexes

### Références
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST SP 800-63B — Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [ANSSI — Recommandations relatives à l'authentification](https://www.ssi.gouv.fr/guide/recommandations-relatives-a-lauthentification-multifacteur-et-aux-mots-de-passe/)
- [Supabase Auth — Security Best Practices](https://supabase.com/docs/guides/auth)
- [CWE — Common Weakness Enumeration](https://cwe.mitre.org/)
