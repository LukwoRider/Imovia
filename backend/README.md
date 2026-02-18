# Backend (Supabase integration test)

Ce dossier contient un script Node.js (`test.mjs`) qui execute un scenario complet de test integration contre Supabase.

## Objectif

Valider le flux metier principal cote backend:

1. Connexion owner
2. Creation d'un bien
3. Connexion tenant + creation d'une candidature
4. Acceptation de la candidature (RPC `accept_application`)
5. Generation des loyers (RPC `generate_rent_payments`)
6. Gestion d'incident (creation tenant + mise a jour owner)
7. Gestion de travaux (creation tenant + approbation/fin owner)
8. Upload d'un document dans Storage + insertion BDD
9. Lecture du dashboard owner (RPC `get_owner_dashboard`)

## Prerequis

- Node.js 18+ (recommande)
- Un projet Supabase configure avec:
  - les tables utilisees dans `test.mjs`
  - les fonctions RPC:
    - `accept_application`
    - `generate_rent_payments`
    - `get_owner_dashboard`
  - un bucket Storage nomme `documents`
  - les policies RLS compatibles avec le scenario
- Deux comptes utilisateurs existants:
  - un owner
  - un tenant

## Installation

Depuis la racine du repo:

```bash
cd backend
npm install
```

## Configuration

Creer `backend/.env` avec les variables suivantes:

```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...

OWNER_EMAIL=owner@imovia.test
OWNER_PASS=...

TENANT_EMAIL=tenant@imovia.test
TENANT_PASS=...
```

Le script charge explicitement `backend/.env`, donc il fonctionne:

- depuis la racine: `node backend/test.mjs`
- depuis `backend`: `node test.mjs`

## Fichiers importants

- `backend/test.mjs`: scenario de test integration
- `backend/sample.txt`: fichier local uploade dans le bucket `documents`
- `backend/package.json`: dependances Node (`@supabase/supabase-js`, `dotenv`)

## Execution

Depuis la racine:

```bash
node backend/test.mjs
```

ou depuis le dossier backend:

```bash
node test.mjs
```

## Resultat attendu

En cas de succes, la sortie termine par:

`TEST COMPLET REUSSI (documents inclus)`

et affiche aussi le payload du dashboard owner.

## Important (environnement de test)

- Chaque execution cree de nouvelles donnees (biens, candidatures, incidents, etc.).
- Chaque execution upload un nouveau fichier dans Storage.
- Le script ne fait pas de nettoyage automatique.

Utiliser de preference une base Supabase de dev/staging, pas la prod.

## Depannage rapide

- `Missing SUPABASE_URL or SUPABASE_ANON_KEY`:
  verifier `backend/.env`.
- Erreur RLS sur `documents`:
  verifier les policies et la relation tenant <-> lease.
- Erreur RPC:
  verifier que les fonctions SQL existent et sont executables avec le role connecte.
