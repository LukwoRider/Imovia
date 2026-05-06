# Audit de Securite - Systeme de Paiements / Finances Imovia

**Date :** 6 mai 2026
**Auditeur :** Pentest Security Expert
**Perimetre :** Systeme de gestion des baux, loyers et paiements (frontend mobile, frontend site, fonctions Supabase/PostgreSQL)
**Classification :** CONFIDENTIEL

---

## Resume Executif

L'audit du systeme financier d'Imovia revele **12 vulnerabilites**, dont **3 critiques** et **4 elevees**. Les problemes les plus graves concernent la possibilite pour un locataire de marquer ses propres paiements comme payes, l'absence de verrou transactionnel dans les operations multi-etapes cote client, et l'enumeration complete de tous les locataires de la plateforme par n'importe quel utilisateur authentifie.

---

## Vulnerabilites Identifiees

---

### VULN-01 : Un locataire peut marquer ses propres paiements comme payes

**Severite : CRITIQUE**
**CVSS estimee : 9.1**

**Fichiers concernes :**
- `supabase/migrations/20260218123000_security_hardening.sql:321-326` (fonction `mark_payment_paid` hardenee)
- `supabase/migrations/20260218113647_remote_schema.sql:732-772` (fonction initiale)

**Description :**
La fonction RPC `mark_payment_paid` autorise a la fois le proprietaire (`v_owner_id = auth.uid()`) ET le locataire (`public.is_lease_tenant(v_payment.lease_id, auth.uid())`). Cela signifie qu'un locataire peut appeler cette fonction et declarer un montant paye arbitraire sans aucune verification de paiement reel (pas de lien avec un PSP, pas de preuve de virement).

```sql
-- security_hardening.sql ligne 321-326
if not (
    v_owner_id = auth.uid()
    or public.is_lease_tenant(v_payment.lease_id, auth.uid())
) then
    raise exception 'Not allowed';
end if;
```

**Scenario d'exploit :**
1. Le locataire Alice se connecte a l'app
2. Elle recupere l'ID de son `rent_payment` via la politique RLS `rent_payments_tenant_select`
3. Elle appelle `select mark_payment_paid('payment-uuid', 950.00)`
4. Le paiement est marque comme `paid`, `paid_at = now()` -- sans aucun transfert reel d'argent
5. Le proprietaire voit un paiement marque comme recu alors qu'il n'a rien percu

**Correction recommandee :**
- Retirer `public.is_lease_tenant(...)` de la condition d'autorisation de `mark_payment_paid`
- Seul le proprietaire (ou un webhook PSP cote `service_role`) devrait pouvoir marquer un paiement comme recu
- A terme, integrer un PSP (Stripe, GoCardless) et marquer les paiements via webhook backend signe

---

### VULN-02 : Operations multi-etapes non-atomiques (onboardTenant) -- Condition de course

**Severite : CRITIQUE**
**CVSS estimee : 8.5**

**Fichiers concernes :**
- `frontend/application/lib/supabase/owner-actions.ts:170-219` (mobile)
- `frontend/site/src/lib/supabase/tenant-onboarding-utils.ts:59-154` (site web)

**Description :**
La fonction `onboardTenant` execute 3 operations sequentielles depuis le client :
1. `INSERT INTO leases` (creation du bail)
2. `INSERT INTO lease_tenants` (lien locataire)
3. `UPDATE properties SET status = 'rented'` (marquage du bien)

Ces operations ne sont pas encapsulees dans une transaction. Si l'etape 2 ou 3 echoue :
- Un bail orphelin sans locataire lie existe en base
- Un bien peut rester "available" alors qu'il a un bail "active"
- Le constraint `ux_one_active_lease_per_property` empechera de creer un nouveau bail, laissant le bien dans un etat inconsistant

De plus, il n'y a pas de `FOR UPDATE` / verrou optimiste sur la propriete, donc deux proprietaires/onglets concurrents pourraient declencher deux baux pour le meme bien (la contrainte unique rattrape partiellement, mais l'etat de la propriete sera inconsistant).

**Scenario d'exploit :**
1. Le proprietaire ouvre deux onglets et clique "Finaliser" quasi-simultanement pour le meme bien avec deux locataires differents
2. Les deux `INSERT leases` se lancent ; un seul reussit grace a la contrainte unique
3. Mais le second onglet a deja execute l'etape 3 (property → rented) avant l'echec
4. Etat incoherent : le bail cree n'a potentiellement pas le bon locataire lie

**Correction recommandee :**
- Creer une RPC `SECURITY DEFINER` cote PostgreSQL qui encapsule les 3 etapes dans un `BEGIN ... COMMIT` unique (comme `accept_application` le fait deja)
- Utiliser `SELECT ... FOR UPDATE` sur la propriete dans la RPC
- Supprimer la logique multi-etape cote client

---

### VULN-03 : Mise a jour du bail (updateLease site) sans verification d'ownership

**Severite : CRITIQUE**
**CVSS estimee : 9.0**

**Fichier concerne :**
- `frontend/site/src/lib/supabase/tenant-onboarding-utils.ts:241-261`

**Description :**
La fonction `updateLease` du site web n'ajoute PAS le filtre `.eq('owner_id', user.id)` dans la requete `UPDATE`. Elle se repose uniquement sur la politique RLS `leases_owner_all`, ce qui est correct... SAUF que la RLS utilise `public.current_user_id()` qui fait `auth.uid()`. Cependant, la fonction ne verifie meme pas que l'utilisateur est connecte avant d'appeler Supabase.

Comparaison avec la version mobile qui est correcte :

```typescript
// MOBILE (owner-actions.ts:117-123) -- CORRECT : double filtre
.update(updates)
.eq('id', leaseId)
.eq('owner_id', user.id)  // <-- defense en profondeur

// SITE (tenant-onboarding-utils.ts:249-251) -- VULNERABLE : pas de filtre owner
.update(updates)
.eq('id', leaseId)
// <-- PAS de .eq('owner_id', ...) : repose uniquement sur RLS
```

La RLS devrait bloquer, mais la defense en profondeur est absente. Si la politique RLS est temporairement desactivee (migration, debug en prod), TOUT utilisateur authentifie peut modifier le loyer de N'IMPORTE quel bail.

**Correction recommandee :**
- Ajouter `.eq('owner_id', user.id)` a la requete du site, comme sur le mobile
- Ajouter une verification `if (!user) throw` au debut de la fonction
- Valider cote serveur (RPC) les montants financiers modifies

---

### VULN-04 : Terminaison de bail (site) sans verification d'ownership

**Severite : ELEVEE**
**CVSS estimee : 7.8**

**Fichier concerne :**
- `frontend/site/src/lib/supabase/tenant-onboarding-utils.ts:159-207`

**Description :**
La fonction `terminateLease` du site web n'ajoute PAS `.eq('owner_id', user.id)` ni meme ne verifie l'utilisateur courant. La RLS `leases_owner_all` protege normalement, mais le code n'a aucune defense en profondeur.

Compare au mobile :

```typescript
// MOBILE (owner-actions.ts:49-54) -- CORRECT
.update({ status: 'ended' })
.eq('id', leaseId)
.eq('owner_id', user.id)  // <-- present

// SITE (tenant-onboarding-utils.ts:163-166) -- PAS DE FILTRE
.update({ status: 'ended' })
.eq('id', leaseId)
// <-- owner_id absent
```

**Correction recommandee :**
- Ajouter la verification d'identite et le filtre `owner_id`
- Migrer vers une RPC server-side pour les operations de terminaison

---

### VULN-05 : Absence de validation des montants financiers cote client

**Severite : ELEVEE**
**CVSS estimee : 7.5**

**Fichiers concernes :**
- `frontend/application/app/(tabs)/paiements.tsx:126` (`parseInt(onboardingForm.rentAmount) || 0`)
- `frontend/application/components/rentals/BailLocation.tsx:129-132` (`parseInt(leaseForm.rent_amount)`)
- `frontend/site/src/components/dashboard/owner/rentals/add-tenant-dialog.tsx:292` (`Number(e.target.value)`)
- `frontend/site/src/components/dashboard/owner/rentals/rental-card.tsx:356` (`parseInt(e.target.value) || 0`)

**Description :**
Aucune validation cote client n'est effectuee sur les montants financiers :
- `rentAmount` peut etre 0 (la contrainte BD `chk_lease_rent_positive` rejettera, mais l'UX est mauvaise)
- `parseInt("abc")` retourne `NaN`, converti en `0` par `|| 0`
- Aucune limite superieure n'est verifiee (un montant de 999999999.99 est accepte)
- Le `keyboardType="numeric"` ne protege que l'UI native, pas les appels API directs
- `parseInt` tronque les decimales : un loyer de "750.50" devient "750"

Les contraintes BD protegent partiellement :
- `chk_lease_rent_positive` : `rent_amount > 0` -- mais `0.01` est accepte
- `chk_lease_charges_nonnegative` : `charges_amount >= 0`
- `chk_lease_payment_day_range` : `payment_day BETWEEN 1 AND 28`

**Mais** : sur le site, `rental-card.tsx:422` genere un select avec les jours 1 a **31**, alors que la BD limite a 28 :

```tsx
// rental-card.tsx:422-423 -- Jours 1 a 31 proposes
{[...Array(31)].map((_, i) => (
    <option key={i + 1} value={i + 1}>Le {i + 1} du mois</option>
))}
```

**Correction recommandee :**
- Ajouter une validation client stricte : `rentAmount > 0`, `chargesAmount >= 0`, `paymentDay 1-28`
- Utiliser `parseFloat` au lieu de `parseInt` pour les montants, ou mieux, un champ Currency dedie
- Limiter le montant a une valeur plafond raisonnable (ex: 50000 EUR)
- Harmoniser le select payment_day pour respecter la contrainte BD (1-28)

---

### VULN-06 : Enumeration de tous les locataires de la plateforme

**Severite : ELEVEE**
**CVSS estimee : 7.2**

**Fichiers concernes :**
- `supabase/migrations/20260222115000_search_profile_rpc.sql:30-54` (RPC `get_all_tenants`)
- `frontend/application/lib/supabase/owner-actions.ts:221-234` (mobile: `getPotentialTenants`)

**Description :**
Deux mecanismes permettent a TOUT utilisateur authentifie (y compris un locataire !) d'enumerer TOUS les profils locataires :

1. **RPC `get_all_tenants()`** : retourne `id`, `full_name`, `phone`, `avatar_url`, `email` de TOUS les utilisateurs avec role `tenant`. Aucune restriction : n'importe quel utilisateur `authenticated` peut appeler cette fonction.

2. **Mobile `getPotentialTenants()`** : fait un `SELECT * FROM profiles WHERE role = 'tenant'`. Ceci devrait normalement etre bloque par la RLS `profiles_select_own` (qui ne retourne que son propre profil), mais si le proprietaire a une politique plus permissive via d'autres migrations, les donnees fuiteraient.

La RPC `get_all_tenants` est `SECURITY DEFINER`, donc elle bypass les RLS et retourne tout.

**Impact :**
- Fuite de donnees personnelles (nom, email, telephone) de tous les locataires
- Violation RGPD potentielle
- Un locataire peut voir les informations de tous les autres locataires de la plateforme

**Correction recommandee :**
- Ajouter `if (select role from profiles where id = auth.uid()) <> 'owner' then raise exception 'Not allowed'` dans `get_all_tenants()`
- Idealement, restreindre aux locataires ayant une relation avec les proprietes du proprietaire appelant
- Meme correction pour `get_profile_by_email`

---

### VULN-07 : Absence de `FOR UPDATE` dans `mark_payment_paid` -- Double-paiement

**Severite : ELEVEE**
**CVSS estimee : 7.0**

**Fichier concerne :**
- `supabase/migrations/20260218123000_security_hardening.sql:309-311`

**Description :**
La fonction `mark_payment_paid` lit le paiement avec un simple `SELECT ... INTO`, puis fait un `UPDATE` separe. Il n'y a pas de `SELECT ... FOR UPDATE` ni de condition `WHERE status != 'paid'` dans l'UPDATE.

```sql
-- Pas de verrou
select * into v_payment
from public.rent_payments
where id = p_payment_id;
-- ...puis...
update public.rent_payments
set amount_paid = least(p_amount_paid, amount_due), ...
where id = p_payment_id;
```

Compare a `accept_application` qui utilise correctement `FOR UPDATE` :

```sql
-- accept_application (hardened) -- CORRECT
select * into v_app
from public.rental_applications
where id = p_application_id
for update;  -- <-- verrou
```

**Scenario d'exploit (condition de course) :**
1. Deux requetes concurrentes appellent `mark_payment_paid` sur le meme paiement
2. Les deux lisent `status = 'due'` avant que l'autre ne fasse l'UPDATE
3. Les deux UPDATE s'executent ; le paiement est marque "paid" deux fois, potentiellement avec `paid_at` different
4. Si un systeme externe declenche une action sur `paid_at` (webhook, notification), elle est executee en double

**Correction recommandee :**
- Ajouter `FOR UPDATE` au `SELECT` : `select * into v_payment from public.rent_payments where id = p_payment_id for update;`
- Ajouter une condition `AND status != 'paid'` dans la clause WHERE de l'UPDATE

---

### VULN-08 : Absence de piste d'audit pour les modifications de loyer

**Severite : MOYENNE**
**CVSS estimee : 6.0**

**Fichiers concernes :**
- `frontend/application/lib/supabase/owner-actions.ts:107-131` (mobile `updateLease`)
- `frontend/site/src/lib/supabase/tenant-onboarding-utils.ts:241-261` (site `updateLease`)

**Description :**
Le trigger `trg_audit_payments` existe sur `rent_payments` et enregistre les modifications dans `user_actions`. MAIS il n'y a PAS de trigger d'audit sur la table `leases` elle-meme.

Un proprietaire peut donc modifier le montant du loyer (`rent_amount`, `charges_amount`) sans qu'aucune trace ne soit gardee en base. La table `user_actions` ne capture pas ces modifications car le trigger `audit_row_change` n'est installe que sur : `documents`, `incidents`, `maintenance_requests`, `rent_payments`.

```sql
-- Triggers d'audit existants (remote_schema.sql:1690-1696)
CREATE TRIGGER trg_audit_documents ...
CREATE TRIGGER trg_audit_incidents ...
CREATE TRIGGER trg_audit_maintenance ...
CREATE TRIGGER trg_audit_payments ...
-- MANQUANT : CREATE TRIGGER trg_audit_leases ON public.leases
```

**Impact :**
- Un proprietaire malveillant peut augmenter le loyer sans preuve de l'ancien montant
- Pas de piste d'audit en cas de litige locataire/proprietaire

**Correction recommandee :**
```sql
CREATE TRIGGER trg_audit_leases
AFTER INSERT OR DELETE OR UPDATE ON public.leases
FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
```

---

### VULN-09 : `generate_rent_payments` sans verification du statut du bail

**Severite : MOYENNE**
**CVSS estimee : 5.5**

**Fichier concerne :**
- `supabase/migrations/20260218123000_security_hardening.sql:244-290`

**Description :**
La fonction `generate_rent_payments` ne verifie pas que le bail est en statut `active`. Un proprietaire peut generer des echeances de paiement pour un bail `ended` ou `draft`, creant des obligations de paiement fictives.

```sql
-- Pas de verification de statut :
select * into v_lease from public.leases where id = p_lease_id;
-- devrait avoir : AND status = 'active'
```

**Correction recommandee :**
```sql
if v_lease.status <> 'active'::public.lease_status then
    raise exception 'Lease must be active to generate payments';
end if;
```

---

### VULN-10 : `onboardTenant` (mobile) -- Le `ownerId` est passe depuis le client

**Severite : MOYENNE**
**CVSS estimee : 5.8**

**Fichier concerne :**
- `frontend/application/app/(tabs)/paiements.tsx:120-128`
- `frontend/application/lib/supabase/owner-actions.ts:179-191`

**Description :**
Dans `handleFinishOnboarding`, le code recupere `user.id` puis le passe comme `ownerId` dans l'objet `onboardTenant`. Ce `ownerId` est directement insere dans la colonne `owner_id` du bail cree. La RLS `leases_owner_all` exige que `owner_id = current_user_id()`, donc la RLS protege... mais c'est un anti-pattern. Si jamais la RLS est bypassee ou modifiee, un utilisateur pourrait creer un bail "au nom" d'un autre proprietaire.

```typescript
// paiements.tsx:120-128
const { data: { user } } = await supabase.auth.getUser();
await onboardTenant({
    ownerId: user!.id,  // <-- vient du client
    // ...
});
```

**Correction recommandee :**
- Ne jamais faire confiance a un `ownerId` envoye par le client
- Utiliser `auth.uid()` cote serveur (RPC) pour determiner le proprietaire

---

### VULN-11 : Absence de contrainte d'unicite sur les echeances (lease_id, due_date) dans `rent_payments` -- Corrigee mais avec risque residuel

**Severite : FAIBLE**
**CVSS estimee : 3.5**

**Fichier concerne :**
- `supabase/migrations/20260218123000_security_hardening.sql:21-22`

**Description :**
La migration de hardening ajoute correctement un index unique `ux_rent_payments_lease_due_date` et la fonction `generate_rent_payments` utilise `ON CONFLICT (lease_id, due_date) DO NOTHING`. Cependant, la politique RLS `rent_payments_owner_all` permet au proprietaire un acces `FOR ALL` (INSERT, UPDATE, DELETE). Un proprietaire pourrait theoriquement INSERT directement dans `rent_payments` via le client Supabase, sans passer par la RPC, et creer des echeances avec des `amount_due` differents de ceux du bail.

**Correction recommandee :**
- Restreindre l'INSERT direct sur `rent_payments` : changer la RLS pour n'autoriser que SELECT/UPDATE pour les proprietaires, et forcer les INSERT via la RPC `generate_rent_payments`
- Ou ajouter un trigger `BEFORE INSERT` qui verifie que `amount_due = lease.rent_amount + lease.charges_amount`

---

### VULN-12 : Exposition de donnees dans les erreurs client

**Severite : FAIBLE**
**CVSS estimee : 3.0**

**Fichiers concernes :**
- `frontend/application/lib/supabase/owner-actions.ts:59` (`leaseError.message`)
- `frontend/application/lib/supabase/owner-actions.ts:194` (`leaseError.message`)
- `frontend/site/src/lib/supabase/tenant-onboarding-utils.ts:103` (`leaseError.message`)

**Description :**
Les messages d'erreur PostgreSQL bruts sont remontes dans les alertes utilisateur (via `error.message`). Ces messages peuvent contenir des noms de contraintes, de tables, ou de colonnes qui facilitent la reconnaissance du schema par un attaquant.

Exemple : `"duplicate key value violates unique constraint \"ux_one_active_lease_per_property\""` revele le nom exact de la contrainte et la logique metier.

**Correction recommandee :**
- Mapper les codes d'erreur PostgreSQL (`23505`, `23503`, etc.) vers des messages generiques en francais
- Ne jamais afficher `error.message` brut a l'utilisateur en production

---

## Matrice de Risques

| ID | Vulnerabilite | Severite | Impact | Exploitabilite | Statut |
|---|---|---|---|---|---|
| VULN-01 | Locataire marque paiement comme paye | CRITIQUE | Finance | Facile | Ouvert |
| VULN-02 | Operations non-atomiques (race condition) | CRITIQUE | Integrite | Moyenne | Ouvert |
| VULN-03 | updateLease (site) sans filtre owner | CRITIQUE | Finance | Facile (si RLS down) | Ouvert |
| VULN-04 | terminateLease (site) sans filtre owner | ELEVEE | Integrite | Facile (si RLS down) | Ouvert |
| VULN-05 | Pas de validation montants client | ELEVEE | Finance/UX | Facile | Ouvert |
| VULN-06 | Enumeration de tous les locataires | ELEVEE | Confidentialite/RGPD | Facile | Ouvert |
| VULN-07 | Double-paiement (pas de FOR UPDATE) | ELEVEE | Finance | Moyenne | Ouvert |
| VULN-08 | Pas d'audit sur modifications de bail | MOYENNE | Conformite | N/A | Ouvert |
| VULN-09 | generate_rent_payments sans check statut | MOYENNE | Integrite | Facile | Ouvert |
| VULN-10 | ownerId passe depuis le client | MOYENNE | Integrite | Difficile | Ouvert |
| VULN-11 | INSERT direct dans rent_payments | FAIBLE | Finance | Moyenne | Ouvert |
| VULN-12 | Erreurs PostgreSQL exposees | FAIBLE | Reconnaissance | N/A | Ouvert |

---

## Recommandations Prioritaires

### Immediat (Semaine 1)
1. **VULN-01** : Retirer le droit locataire de `mark_payment_paid`
2. **VULN-07** : Ajouter `FOR UPDATE` dans `mark_payment_paid`
3. **VULN-03/04** : Ajouter le filtre `owner_id` dans les fonctions site

### Court terme (Semaine 2-3)
4. **VULN-02** : Migrer `onboardTenant` vers une RPC PostgreSQL transactionnelle
5. **VULN-06** : Ajouter verification du role dans `get_all_tenants` et `get_profile_by_email`
6. **VULN-08** : Ajouter le trigger d'audit sur la table `leases`
7. **VULN-09** : Verifier le statut du bail dans `generate_rent_payments`

### Moyen terme (Sprint suivant)
8. **VULN-05** : Implementer une validation stricte des montants (client + serveur)
9. **VULN-10** : Migrer toute la logique financiere vers des RPCs server-side
10. **VULN-11** : Restreindre les politiques RLS d'INSERT sur `rent_payments`
11. **VULN-12** : Mapper les erreurs PostgreSQL vers des messages generiques

### Long terme
12. Integrer un PSP (Stripe/GoCardless) pour les paiements reels avec webhooks signes
13. Ajouter un champ `payment_method` et `transaction_reference` a `rent_payments`
14. Implementer une signature HMAC sur les montants financiers pour detecter les manipulations

---

## Points Positifs Notes

- **Contraintes BD solides** : `chk_lease_rent_positive`, `chk_payment_amount_due_positive`, `chk_payment_paid_not_more_than_due`, `chk_payment_amount_paid_nonnegative` protegent contre les montants negatifs et les surpaiements au niveau de la base
- **Index unique `ux_one_active_lease_per_property`** : empeche les baux en double par propriete
- **Trigger d'audit sur `rent_payments`** : les modifications de paiements sont tracees
- **`accept_application` hardenee** : utilise `FOR UPDATE`, verifie le statut `pending`, verifie l'ownership via la propriete
- **RLS actif sur toutes les tables financieres** : defense en profondeur presente (mais necessitant des ameliorations)
- **Revocation des privileges `public`** sur les RPCs critiques : seuls `authenticated` et `service_role` peuvent appeler les fonctions financieres
- **Contrainte `least(p_amount_paid, amount_due)`** dans `mark_payment_paid` : empeche de declarer un paiement superieur au montant du

---

*Fin du rapport d'audit.*
