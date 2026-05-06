# Rapport d'Audit de Sécurité PostgreSQL/Supabase — Imovia

**Date :** 6 mai 2026  
**Auditeur :** Pentest SQL / Supabase  
**Périmètre :** 24 fichiers de migration dans `/tmp/imovia-audit/supabase/migrations/`  
**Classification :** Confidentiel

---

## Résumé Exécutif

L'application Imovia présente une architecture de sécurité **globalement correcte** avec des efforts notables de hardening (migration `20260218123000`). Cependant, **16 vulnérabilités** ont été identifiées, dont **3 critiques**, **5 hautes**, **5 moyennes** et **3 basses**.

| Sévérité | Nombre | Impact |
|----------|--------|--------|
| CRITIQUE | 3 | Fuite de données massive, escalade de privilèges |
| HAUTE | 5 | Injection de notifications, contournement d'autorisation |
| MOYENNE | 5 | Race conditions, incohérences de politique |
| BASSE | 3 | Bonnes pratiques manquantes |

---

## CRITIQUE-01 : `get_all_tenants()` — Fuite de données massive de tous les locataires

**Fichier :** `20260222115000_search_profile_rpc.sql`, lignes 30-54  
**Sévérité :** CRITIQUE  
**CVSS estimé :** 8.6

### Description

La fonction `get_all_tenants()` retourne **l'intégralité** des profils locataires (id, full_name, phone, avatar_url, email) à **tout utilisateur authentifié**, sans aucune vérification de rôle ni de relation.

```sql
-- Ligne 30-54
create or replace function public.get_all_tenants()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_result jsonb;
begin
  select jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'phone', p.phone,
      'avatar_url', p.avatar_url,
      'email', au.email
    )
  ) into v_result
  from auth.users au
  join public.profiles p on p.id = au.id
  where p.role = 'tenant';
  return coalesce(v_result, '[]'::jsonb);
end;
$$;
```

### Scénario d'exploit

1. Un attaquant crée un compte (même en tant que `tenant`)
2. Il appelle `select get_all_tenants()` via l'API Supabase
3. Il reçoit tous les noms, téléphones et emails de tous les locataires
4. **Violation RGPD massive** — données personnelles exposées sans consentement

### Correction recommandée

```sql
create or replace function public.get_all_tenants()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role;
  v_result jsonb;
begin
  select role into v_role from public.profiles where id = v_uid;
  if v_role not in ('owner', 'agency', 'admin') then
    raise exception 'Not allowed';
  end if;

  -- Ne retourner que les locataires liés aux biens du propriétaire
  select jsonb_agg(jsonb_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url
  )) into v_result
  from public.profiles p
  join public.lease_tenants lt on lt.tenant_id = p.id
  join public.leases l on l.id = lt.lease_id
  where l.owner_id = v_uid
    and p.role = 'tenant';

  return coalesce(v_result, '[]'::jsonb);
end;
$$;
```

---

## CRITIQUE-02 : `get_profile_by_email()` — Énumération de comptes et fuite PII

**Fichier :** `20260222115000_search_profile_rpc.sql`, lignes 4-27  
**Sévérité :** CRITIQUE  
**CVSS estimé :** 7.5

### Description

La fonction permet à **tout utilisateur authentifié** de chercher n'importe quel profil locataire par email, exposant id, full_name, phone, avatar_url et email.

```sql
create or replace function public.get_profile_by_email(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth  -- ⚠ search_path non sécurisé
```

### Problèmes multiples

1. **Aucune vérification de rôle** : un tenant peut espionner d'autres tenants
2. **Énumération de comptes** : un attaquant peut vérifier l'existence d'emails dans le système
3. **`search_path = public, auth`** : le schéma `public` est dans le search_path d'une fonction `SECURITY DEFINER` — un utilisateur avec droit de créer des objets dans `public` pourrait faire du search_path hijacking
4. **Pas de rate limiting** côté SQL

### Scénario d'exploit

```
-- Un tenant malveillant peut scanner des emails
SELECT get_profile_by_email('victime@example.com');
-- Retourne: {"id": "...", "full_name": "Jean Dupont", "phone": "+33612345678", ...}
```

### Correction recommandée

```sql
create or replace function public.get_profile_by_email(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog  -- JAMAIS 'public' dans un SECURITY DEFINER
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role;
  v_result jsonb;
begin
  select role into v_role from public.profiles where id = v_uid;
  if v_role not in ('owner', 'agency', 'admin') then
    raise exception 'Not allowed';
  end if;

  -- Limiter les champs retournés
  select jsonb_build_object('id', p.id, 'full_name', p.full_name)
  into v_result
  from auth.users au
  join public.profiles p on p.id = au.id
  where au.email = lower(btrim(p_email))
    and p.role = 'tenant';

  return v_result; -- NULL si non trouvé (pas d'erreur différenciée)
end;
$$;
```

---

## CRITIQUE-03 : Notifications — INSERT sans contrôle = spam/phishing/usurpation

**Fichier :** `20260222121500_notifications_init.sql`, lignes 36-40  
**Fichier :** `20260222125000_notifications_sender_fix.sql`, lignes 17-23  
**Sévérité :** CRITIQUE  
**CVSS estimé :** 8.1

### Description

La politique INSERT sur `notifications` est `with check (true)` — **tout utilisateur authentifié peut insérer une notification pour n'importe quel autre utilisateur**.

```sql
-- notifications_init.sql:36-40
create policy "Authenticated users can insert notifications"
    on public.notifications
    for insert
    to authenticated
    with check (true);  -- ⚠ AUCUNE restriction
```

### Scénario d'exploit

```sql
-- Un tenant malveillant envoie un faux message au nom du "système"
INSERT INTO notifications (user_id, title, message, type, link)
VALUES (
  'uuid-de-la-victime',
  'URGENT: Paiement en retard',
  'Cliquez ici pour régulariser: https://phishing-site.com',
  'payment',
  'https://phishing-site.com/pay'
);
```

**Impact :** Phishing ciblé, ingénierie sociale, usurpation d'identité de l'application.

### Correction recommandée

```sql
drop policy if exists "Authenticated users can insert notifications" on public.notifications;
create policy "Owners can notify their tenants"
on public.notifications for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.leases l
    join public.lease_tenants lt on lt.lease_id = l.id
    where l.owner_id = auth.uid()
      and lt.tenant_id = notifications.user_id
  )
);
```

---

## HAUTE-01 : Grants massifs `anon` dans le schéma initial — DELETE/TRUNCATE/TRIGGER

**Fichier :** `20260218113647_remote_schema.sql`, lignes 868-1370  
**Sévérité :** HAUTE

### Description

Le schéma initial accorde à **`anon`** (utilisateurs non authentifiés) les droits `delete`, `insert`, `update`, `truncate`, `trigger`, `references` sur **toutes les tables** : `documents`, `incidents`, `lease_tenants`, `leases`, `maintenance_requests`, `profiles`, `properties`, `property_history`, `property_images`, `rent_payments`, `rental_applications`, `user_actions`.

```sql
-- Lignes 868-880 (et même pattern ~500 lignes)
grant delete on table "public"."documents" to "anon";
grant insert on table "public"."documents" to "anon";
grant truncate on table "public"."documents" to "anon";
grant trigger on table "public"."documents" to "anon";
-- ... répété pour TOUTES les tables
```

### Analyse du hardening

La migration `20260218123000_security_hardening.sql` (lignes 531-547) **révoque partiellement** avec :

```sql
revoke truncate, trigger, references on table %I.%I from anon, authenticated;
```

**Mais les droits `SELECT`, `INSERT`, `UPDATE`, `DELETE` sur `anon` ne sont PAS révoqués.** La protection repose uniquement sur les politiques RLS, ce qui est fragile — une politique mal écrite ou manquante expose directement les données.

### Correction recommandée

```sql
-- Révoquer TOUS les droits d'anon sur toutes les tables
do $do$
declare r record;
begin
  for r in select schemaname, tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke all on table %I.%I from anon;', r.schemaname, r.tablename);
  end loop;
end;
$do$;
-- Ne conserver que SELECT sur properties pour les listings publics si nécessaire
grant select on table public.properties to anon;
```

---

## HAUTE-02 : `handle_new_user()` régressé — perte de la sélection de rôle au signup

**Fichier :** `20260222214500_owner_contact_info.sql`, lignes 6-22  
**Sévérité :** HAUTE

### Description

La dernière migration **écrase** la fonction `handle_new_user()` et **supprime** l'appel à `signup_role_from_metadata()` introduit dans `20260221120000_signup_role_selection.sql`. Tous les nouveaux utilisateurs sont maintenant forcés en `'tenant'`.

```sql
-- owner_contact_info.sql:6-22
CREATE OR REPLACE FUNCTION public.handle_new_user()
...
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    new.id,
    'tenant'::public.user_role,  -- ⚠ Hardcodé, ignore raw_user_meta_data
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
```

**Impact :** Les utilisateurs s'inscrivant comme `owner` ou `agency` sont tous créés comme `tenant`, cassant le flux d'inscription.

### Correction recommandée

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    new.id,
    public.signup_role_from_metadata(new.raw_user_meta_data),
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  RETURN new;
END;
$function$;
```

---

## HAUTE-03 : `owner_update_incident_status()` — Injection de statut via `p_status text`

**Fichier :** `20260218113647_remote_schema.sql`, lignes 829-857  
**Fichier :** `20260220103000_user_flow_alignment.sql`, lignes 301-365  
**Sévérité :** HAUTE

### Description

La version initiale dans `remote_schema.sql` (ligne 853) utilise directement le paramètre `text` sans cast vers l'enum :

```sql
-- remote_schema.sql:852-854
update public.incidents
set status = p_status  -- ⚠ text brut, pas de cast enum
where id = p_incident_id;
```

Bien que la migration `security_hardening.sql` corrige cela (ligne 419 avec `p_status::public.incident_status`), et que `user_flow_alignment.sql` valide aussi, **la version à 2 arguments** (lignes 353-365 de `user_flow_alignment.sql`) délègue à l'overload à 3 arguments — ce qui est correct.

**Résidu de risque :** Le cast `::public.incident_status` lèvera une erreur PostgreSQL si la valeur est invalide, mais l'erreur exposera des détails internes (noms d'enum, etc.). Il vaut mieux valider explicitement.

### Correction recommandée

```sql
if p_status not in ('open', 'in_progress', 'resolved', 'closed') then
  raise exception 'Invalid status value';
end if;
```

---

## HAUTE-04 : `log_action()` — Pollution des journaux d'audit sans restriction

**Fichier :** `20260218113647_remote_schema.sql`, lignes 720-730  
**Sévérité :** HAUTE

### Description

La fonction `log_action(p_action text, p_entity text, p_entity_id uuid, p_payload jsonb)` est `SECURITY DEFINER` et accepte **n'importe quelle valeur** pour `p_action`, `p_entity` et `p_payload` — un utilisateur authentifié peut injecter des entrées d'audit factices.

```sql
create or replace function public.log_action(
  p_action text,     -- ⚠ Aucune validation
  p_entity text,     -- ⚠ Aucune validation
  p_entity_id uuid,
  p_payload jsonb default '{}'::jsonb  -- ⚠ JSONB arbitraire
)
```

### Scénario d'exploit

```sql
SELECT log_action(
  'admin_override',
  'profiles',
  'uuid-admin',
  '{"role": "admin", "action": "privilege_escalation"}'::jsonb
);
```

Un attaquant peut polluer la table `user_actions` avec des faux logs, rendant l'audit inutile et masquant de vraies attaques.

### Correction recommandée

```sql
if p_action not in ('create', 'update', 'delete', 'view') then
  raise exception 'Invalid action';
end if;
-- Limiter la taille du payload
if pg_column_size(p_payload) > 10240 then
  raise exception 'Payload too large';
end if;
```

---

## HAUTE-05 : `accept_application()` — Race condition sur le verrouillage

**Fichier :** `20260218113647_remote_schema.sql`, lignes 423-496  
**Sévérité :** HAUTE

### Description

La version initiale de `accept_application()` dans `remote_schema.sql` **ne prend pas de verrou** (`FOR UPDATE`) sur la ligne application, ni ne vérifie le statut `pending`. Deux appels concurrents peuvent accepter la même candidature et créer deux baux.

```sql
-- remote_schema.sql:433-435 (version initiale)
select * into v_app
from public.rental_applications
where id = p_application_id;
-- ⚠ Pas de FOR UPDATE, pas de check status = 'pending'
```

### Analyse du hardening

La migration `security_hardening.sql` (lignes 167-171) **corrige bien** ce problème avec `FOR UPDATE` et la vérification `status <> 'pending'`. **Cette vulnérabilité est corrigée**, mais la correction dépend de l'exécution séquentielle des migrations.

---

## MOYENNE-01 : Politiques RLS ciblant `to public` au lieu de `to authenticated`

**Fichier :** `20260218113647_remote_schema.sql`, multiples lignes  
**Sévérité :** MOYENNE

### Description

De nombreuses politiques RLS dans le schéma initial ciblent `to public` au lieu de `to authenticated`, par exemple :

```sql
-- Ligne 1373-1380
create policy "documents_insert_pro"
on "public"."documents"
as permissive
for insert
to public  -- ⚠ Inclut 'anon' !
with check (...)
```

**Politiques affectées (non corrigées) :**
- `incidents_owner_select` (ligne 1404)
- `incidents_owner_update` (ligne 1415)
- `incidents_tenant_select_own` (ligne 1438)
- `lease_tenants_owner_all` (ligne 1447)
- `lease_tenants_tenant_select_own` (ligne 1457)
- `leases_owner_all` (ligne 1466)
- `leases_tenant_select_if_member` (ligne 1476)
- `maintenance_owner_all` (ligne 1498)
- `maintenance_tenant_select` (ligne 1512)
- `profiles_select_own` (ligne 1521)
- `profiles_update_own` (ligne 1530)
- `properties_*` (lignes 1540-1582)
- `property_history_owner_select` (ligne 1586)
- `property_images_*` (lignes 1597-1618)
- `rent_payments_*` (lignes 1622-1641)
- `applications_*` (lignes 1645-1678)
- `user_actions_select_own` (ligne 1682)

La migration `security_hardening.sql` ne corrige que 4 politiques INSERT critiques (applications, incidents, maintenance, documents). **Toutes les autres restent `to public`.**

Bien que `auth.uid()` retourne `NULL` pour `anon` (rendant la plupart des politiques théoriquement sûres), c'est une défense en profondeur insuffisante.

### Correction recommandée

Remplacer `to public` par `to authenticated` sur toutes les politiques non destinées aux anonymes.

---

## MOYENNE-02 : Bucket `property-images` rendu public sans restriction de lecture

**Fichier :** `20260220232500_make_property_images_public.sql`, lignes 3-16  
**Fichier :** `20260221123000_public_media_buckets_alignment.sql`, lignes 8-18  
**Sévérité :** MOYENNE

### Description

Le bucket `property-images` est passé en `public = true` avec une politique de lecture **sans aucune restriction** :

```sql
-- make_property_images_public.sql:9-16
create policy property_images_storage_read
on storage.objects for select to public
using (bucket_id = 'property-images');
```

Et confirmé dans `public_media_buckets_alignment.sql` :

```sql
update storage.buckets set public = true
where id in ('property-images', 'avatars');
```

**Impact :** Toutes les photos de biens (y compris ceux en statut `draft`, `rented`, `maintenance`, `archived`) sont accessibles à des utilisateurs non authentifiés. Cela annule le travail de la migration `property_images_backend_alignment.sql` qui avait restreint la lecture aux propriétaires et locataires affiliés.

### Correction recommandée

Si un accès public est requis pour le listing, restreindre aux biens `available` :

```sql
create policy property_images_storage_read
on storage.objects for select to public
using (
  bucket_id = 'property-images'
  and exists (
    select 1 from public.properties p
    where p.id = public.storage_property_id_from_path(name)
      and p.status = 'available'::public.property_status
  )
);
```

---

## MOYENNE-03 : `storage_lease_id_from_path()` — Crash sur entrée malformée

**Fichier :** `20260218113647_remote_schema.sql`, lignes 859-866  
**Fichier :** `20260218154000_security_advisor_fixes.sql`, lignes 19-26  
**Sévérité :** MOYENNE

### Description

La fonction tente un cast `::uuid` direct sans gestion d'erreur :

```sql
-- remote_schema.sql:864
select nullif(split_part(p_path, '/', 2), '')::uuid
```

Si le deuxième segment du path n'est pas un UUID valide, la fonction crashe avec une erreur PostgreSQL. Contrairement à `storage_property_id_from_path()` et `storage_user_id_from_path()` (dans `media_storage_buckets.sql`) qui gèrent l'erreur via `exception when others then return null`, cette fonction ne le fait pas.

**Impact :** Les politiques de storage sur le bucket `documents` qui utilisent cette fonction échoueront bruyamment au lieu de retourner `false`, potentiellement bloquant des opérations légitimes.

### Correction recommandée

```sql
create or replace function public.storage_lease_id_from_path(p_path text)
returns uuid language plpgsql stable
set search_path = pg_catalog
as $function$
declare v_part text;
begin
  v_part := nullif(split_part(p_path, '/', 2), '');
  if v_part is null then return null; end if;
  begin return v_part::uuid;
  exception when others then return null;
  end;
end;
$function$;
```

---

## MOYENNE-04 : `notifications.type` est un `text` libre sans contrainte

**Fichier :** `20260222121500_notifications_init.sql`, ligne 7  
**Sévérité :** MOYENNE

### Description

```sql
type text not null default 'info', -- 'info', 'warning', 'payment', 'incident'
```

Le type de notification est un `text` libre. Combiné avec la politique INSERT `with check (true)`, un attaquant peut injecter des types arbitraires.

### Correction recommandée

```sql
create type public.notification_type as enum ('info', 'warning', 'payment', 'incident');
-- Puis utiliser ce type pour la colonne
```

---

## MOYENNE-05 : `notifications` — Absence de politique DELETE et données fantômes

**Fichier :** `20260222121500_notifications_init.sql`  
**Sévérité :** MOYENNE

### Description

Aucune politique DELETE n'existe sur la table `notifications`. Les utilisateurs ne peuvent pas supprimer leurs notifications. Les notifications de phishing (voir CRITIQUE-03) ne peuvent pas être supprimées par la victime.

De plus, aucune politique ne restreint ce que l'UPDATE peut modifier — un utilisateur pourrait théoriquement modifier le `title`, `message`, `type`, `link` de ses propres notifications (pas seulement `is_read`).

### Correction recommandée

```sql
-- Permettre aux utilisateurs de supprimer leurs notifications
create policy "Users can delete their own notifications"
on public.notifications for delete to authenticated
using (auth.uid() = user_id);

-- Restreindre l'UPDATE au seul champ is_read via une fonction RPC dédiée
```

---

## BASSE-01 : `search_path` incluant `public` dans des fonctions SECURITY DEFINER

**Fichiers :** `20260222115000_search_profile_rpc.sql` (lignes 8, 34)  
**Sévérité :** BASSE

### Description

Les fonctions `get_profile_by_email` et `get_all_tenants` utilisent `set search_path = public, auth` dans un contexte `SECURITY DEFINER`. Bien que Supabase restreint la création d'objets dans `public` par les rôles standard, inclure `public` dans le search_path d'une fonction SECURITY DEFINER est une mauvaise pratique qui peut mener à du **search_path hijacking** si un rôle avec plus de privilèges est compromis.

La migration `security_advisor_fixes.sql` avait correctement identifié ce problème et corrigé d'autres fonctions avec `set search_path = pg_catalog`. Ces deux nouvelles fonctions n'ont pas suivi cette convention.

### Correction

Utiliser `set search_path = pg_catalog` et qualifier explicitement les schémas.

---

## BASSE-02 : Table `notifications` référence `auth.users` directement

**Fichier :** `20260222121500_notifications_init.sql`, ligne 4  
**Sévérité :** BASSE

### Description

```sql
user_id uuid not null references auth.users(id) on delete cascade,
```

La plupart des autres tables référencent `public.profiles(id)`. Cette incohérence peut poser problème si un profil est supprimé indépendamment du user auth (bien que la FK cascade soit présente).

---

## BASSE-03 : Politiques RLS dupliquées sur `properties` pour les tenants

**Fichier :** `20260220224500_tenant_property_visibility.sql`  
**Fichier :** `20260222123500_tenant_visibility_fix.sql`  
**Sévérité :** BASSE

### Description

Deux politiques SELECT identiques existent pour les tenants sur `properties` :
- `properties_tenant_select_if_member` (tenant_visibility.sql)
- `properties_tenant_select` (tenant_visibility_fix.sql)

Ces politiques sont fonctionnellement identiques (elles vérifient toutes deux l'existence d'un lease_tenant lié). La duplication est inutile et peut créer de la confusion lors du debugging.

---

## Vérification du Hardening (`security_hardening.sql` + `security_advisor_fixes.sql`)

### Ce qui est correctement traité

| Mesure | Statut | Fichier |
|--------|--------|---------|
| `FOR UPDATE` sur `accept_application` | ✅ Corrigé | security_hardening.sql:171 |
| Vérification `status = 'pending'` | ✅ Corrigé | security_hardening.sql:177 |
| `search_path` sur fonctions SECURITY DEFINER | ✅ Corrigé | security_hardening.sql:160, 251, 299, etc. |
| Validation `p_months` borné 1-120 | ✅ Corrigé | security_hardening.sql:259 |
| Validation `p_amount_paid >= 0` | ✅ Corrigé | security_hardening.sql:305 |
| Révocation `truncate, trigger, references` | ✅ Corrigé | security_hardening.sql:531-547 |
| Révocation `execute` sur RPCs pour `public` | ✅ Corrigé | security_hardening.sql:550-568 |
| Politiques INSERT restreintes à `authenticated` | ✅ Corrigé | security_hardening.sql:425-528 |
| `security_invoker = true` sur vues | ✅ Corrigé | security_advisor_fixes.sql:4-7 |
| `search_path = pg_catalog` sur helpers SQL | ✅ Corrigé | security_advisor_fixes.sql:10-26 |
| Cast explicite vers enum | ✅ Corrigé | security_hardening.sql:419 |

### Ce qui manque dans le hardening

| Lacune | Impact | Priorité |
|--------|--------|----------|
| Grants `SELECT/INSERT/UPDATE/DELETE` pour `anon` non révoqués | Les tables sont protégées uniquement par RLS | HAUTE |
| Politiques SELECT/UPDATE sur tables existantes restent `to public` | Exposées aux rôles `anon` si RLS est désactivé par erreur | MOYENNE |
| `storage_lease_id_from_path` non corrigé (crash sur input invalide) | Blocage d'opérations storage | MOYENNE |
| Pas de validation `p_action`/`p_entity` dans `log_action()` | Pollution des logs d'audit | HAUTE |
| Pas de vérification de rôle dans les fonctions `get_all_tenants`/`get_profile_by_email` (ajoutées après) | Fuite de données PII | CRITIQUE |
| Régression `handle_new_user` (migration ultérieure écrase le fix) | Perte de fonctionnalité signup | HAUTE |
| Notifications INSERT `with check (true)` (ajouté après le hardening) | Phishing/spam | CRITIQUE |

---

## Matrice de Risques par Table

| Table | RLS | Grants anon | Vulnérabilités |
|-------|-----|-------------|----------------|
| `profiles` | ✅ | ⚠ SELECT/INSERT/UPDATE/DELETE | BASSE — protégé par RLS mais grants excessifs |
| `properties` | ✅ | ⚠ Idem | BASSE — `available` visible à `anon` (voulu) |
| `leases` | ✅ | ⚠ Idem | BASSE — protégé par RLS |
| `lease_tenants` | ✅ | ⚠ Idem | BASSE |
| `documents` | ✅ | ⚠ Idem | BASSE |
| `document_users` | ✅ | ✅ Révoqué | OK |
| `incidents` | ✅ | ⚠ Idem | BASSE |
| `maintenance_requests` | ✅ | ⚠ Idem | BASSE |
| `rent_payments` | ✅ | ⚠ Idem | BASSE |
| `rental_applications` | ✅ | ⚠ Idem | BASSE |
| `user_actions` | ✅ | ⚠ Idem | HAUTE — `log_action()` sans validation |
| `property_history` | ✅ | ⚠ Idem | BASSE |
| `property_images` | ✅ | ⚠ Idem | MOYENNE — bucket public sans restriction |
| `notifications` | ✅ | ❌ Pas de grant anon | **CRITIQUE** — INSERT `with check (true)` |
| `agency_profiles` | ✅ | ✅ OK (auth only) | OK |
| `property_tenant_contacts` | ✅ | ✅ OK (auth only) | OK |

---

## Recommandations Prioritaires

### Immédiat (avant mise en production)

1. **CRITIQUE-01** : Restreindre ou supprimer `get_all_tenants()` — fuite PII massive
2. **CRITIQUE-02** : Ajouter vérification de rôle à `get_profile_by_email()`, fixer search_path
3. **CRITIQUE-03** : Restreindre la politique INSERT sur `notifications`
4. **HAUTE-02** : Restaurer `signup_role_from_metadata()` dans `handle_new_user()`
5. **HAUTE-01** : Révoquer tous les grants `anon` sauf SELECT sur `properties`

### Court terme (sprint suivant)

6. **HAUTE-03** : Valider explicitement les valeurs de statut dans les RPC
7. **HAUTE-04** : Ajouter des contraintes de validation à `log_action()`
8. **MOYENNE-01** : Migrer toutes les politiques RLS de `to public` vers `to authenticated`
9. **MOYENNE-02** : Restreindre la lecture du bucket `property-images` aux biens `available`
10. **MOYENNE-03** : Corriger `storage_lease_id_from_path()` avec gestion d'erreur

### Moyen terme (hardening continu)

11. Ajouter un type enum pour `notifications.type`
12. Ajouter une politique DELETE sur `notifications`
13. Supprimer les politiques RLS dupliquées
14. Auditer les triggers pour s'assurer qu'aucun n'expose des données via les erreurs PostgreSQL
15. Mettre en place un système de rate limiting applicatif sur les RPCs sensibles

---

*Fin du rapport. Ce document contient des informations de sécurité sensibles et ne doit pas être partagé en dehors de l'équipe de développement.*
