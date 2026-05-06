# Imovia — Audit de Sécurité (Pentest Manuel)

Ce dépôt contient les résultats d'un audit de sécurité complet de l'application mobile Imovia (Expo/React Native), réalisé le 6 mai 2026.

## Structure

```
├── security_audit.py                          # Script Python d'analyse statique
├── AUDIT_SECURITE_COMPLET.md                  # Rapport complet (tout le projet)
├── frontend/application/
│   ├── AUDIT_SECURITE_MOBILE.md               # Rapport ciblé frontend/application (66 vulnérabilités)
│   └── security_audit.py                      # Copie du script pour exécution locale
├── audit_results.json                         # Résultats JSON (parseable)
├── audit_results.md                           # Résultats en markdown
└── RAPPORT_*.md                               # Rapports détaillés par domaine
```

## Prérequis

- Python 3.10+ (aucune dépendance externe, uniquement la stdlib)
- Git (pour le worktree)

## Lancer le script d'audit

### 1. Cloner et préparer

```bash
git clone git@github.com:LukwoRider/Imovia.git
cd Imovia
git checkout security-audit
```

### 2. Scanner uniquement l'app mobile (frontend/application)

```bash
python3 security_audit.py frontend/application
```

### 3. Scanner tout le projet

```bash
python3 security_audit.py .
```

### 4. Scanner un dossier spécifique

```bash
python3 security_audit.py supabase/migrations
python3 security_audit.py backend
```

## Sorties générées

Après exécution, le script génère automatiquement dans le dossier scanné :

| Fichier | Description |
|---------|-------------|
| `audit_results.json` | Résultats structurés (pour CI/CD, parsing) |
| `audit_results.md` | Rapport lisible en markdown |
| Terminal (stdout) | Résumé coloré avec compteurs par sévérité |

## Codes de sortie

| Code | Signification |
|------|---------------|
| `0` | Aucune vulnérabilité critique |
| `1` | Erreur (chemin invalide) |
| `2` | Vulnérabilités critiques détectées |

## Intégration CI/CD

```yaml
# .github/workflows/security-audit.yml
name: Security Audit
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - name: Run security audit
        run: python3 security_audit.py frontend/application
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: security-audit-results
          path: |
            frontend/application/audit_results.json
            frontend/application/audit_results.md
```

## Reproduire l'audit complet (20 agents parallèles)

L'audit manuel a été réalisé par 20 agents spécialisés couvrant :

| Agent | Domaine | Rapport |
|-------|---------|---------|
| 1 | IDOR bien/[id].tsx | `RAPPORT_SECURITE_IDOR.md` |
| 2 | Flux d'authentification | `AUDIT_AUTH_PENTEST.md` |
| 3 | owner-actions.ts IDOR | `RAPPORT_SECURITE_owner-actions.md` |
| 4 | Profil & changement MDP | `RAPPORT_SECURITE_PROFILE.md` |
| 5 | Paiements & enum tenants | `RAPPORT_SECURITE_PAIEMENTS.md` |
| 6 | Upload & stockage | `AUDIT_UPLOAD_SECURITY.md` |
| 7 | Incidents & statuts | `AUDIT_INCIDENTS.md` |
| 8 | Documents download/delete | `AUDIT_DOCUMENTS.md` |
| 9 | Secrets & .env | `AUDIT_SECRETS_EXPOSITION.md` |
| 10 | Tab layout & role bypass | `AUDIT_ACCESS_CONTROL_TABS.md` |
| 11 | Système de notifications | `AUDIT_NOTIFICATIONS.md` |
| 12 | Bail & location | `AUDIT_RENTALS.md` |
| 13 | Logement data exposure | `AUDIT_FUITE_DONNEES_LOGEMENT.md` |
| 14 | Config client Supabase | `AUDIT_SUPABASE_CLIENT.md` |
| 15 | Deep linking & scheme | `AUDIT_DEEP_LINKING.md` |
| 16 | Error handling & logging | `AUDIT_ERROR_HANDLING.md` |
| 17 | Validation des inputs | `AUDIT_VALIDATION_INPUTS.md` |
| 18 | AjouterBienModal | `RAPPORT_SECURITE_AjouterBienModal.md` |
| 19 | DeclarerIncidentModal | `RAPPORT_AUDIT_DeclarerIncidentModal.md` |
| 20 | Dépendances npm | `AUDIT_DEPENDENCIES.md` |

Pour reproduire manuellement, ouvrir chaque fichier source listé dans `AUDIT_SECURITE_MOBILE.md` et vérifier les lignes indiquées.

## Résumé des résultats (frontend/application uniquement)

| Sévérité | Nombre |
|----------|--------|
| CRITIQUE | 14 |
| HAUTE | 22 |
| MOYENNE | 18 |
| BASSE | 12 |
| **TOTAL** | **66** |

### Top 5 failles critiques

1. **IDOR DELETE** — Suppression de propriété sans vérification `owner_id`
2. **Auto-attribution de rôle** — `register-owner.tsx` permet de devenir owner
3. **Exposition de tous les locataires** — `getPotentialTenants()` expose tous les profils
4. **Changement MDP sans ré-authentification** — `currentPassword` collecté mais jamais vérifié
5. **Deep link scheme générique** — `application://` hijackable par toute app malveillante

## Méthodologie

- **OWASP Mobile Top 10 2024**
- **OWASP Web Application Top 10 2021**
- Revue manuelle ligne par ligne (pas de Semgrep, pas de Burp Suite)
- Focus : IDOR, broken access control, injection, auth failures, secrets exposure
- Outils : Python 3 stdlib uniquement

## Licence

Usage interne uniquement. Ce rapport contient des informations sensibles sur les vulnérabilités de l'application Imovia.
