# Supabase Setup

## Utilisation de supabase

Si vous n'avez pas le package supabase d'installer globalement sur votre machine, il est possible de passer par le package en local
### 1. Installer les dépendances
```bash
# Dans le dossier supabase/
npm install
```

### 2. Utiliser le cli
```bash
# Dans le dossier supabase/
npx supabase [CMD]
```

## Configuration pour une base de données distante

### 1. Créer un projet Supabase
- Allez sur [supabase.com](https://supabase.com) et créez un nouveau projet
- Notez votre `project_ref` (visible dans l'URL du dashboard)

### 2. Lier votre projet local au projet distant
```bash
# Dans le dossier supabase/
supabase login
supabase link --project-ref VOTRE_PROJECT_REF
```

### 3. Appliquer les migrations et seeds
```bash
# Appliquer les migrations et les données de seed
supabase db push --include-seed
```

### 4. Alternative : Lancer seulement les seeds
Si les migrations sont déjà appliquées, vous pouvez lancer uniquement les seeds :
```bash
npx supabase db query -f supabase/seed.sql --linked 2>&1
```

## Configuration pour le développement local

### Démarrer Supabase localement
```bash
supabase start
```

### Réinitialiser la base locale
```bash
supabase db reset
```

## Variables d'environnement
Assurez-vous que vos applications (frontend/backend) utilisent les bonnes URLs Supabase :
- Pour le développement local : `http://127.0.0.1:54321`
- Pour la production : l'URL de votre projet Supabase distant

## Notes importantes
- `supabase start` lance uniquement une instance locale
- `supabase db push` envoie vers le projet distant lié
- Les seeds contiennent des données de test pour le développement