# SETUP — Dossier sous Windows

Commandes **réellement exécutées et vérifiées** sur Windows 11, Node 24.15, Docker Desktop 29, PowerShell, le 2026-10-29. Mode « hybride » : PostgreSQL dans Docker, Node et Yarn en natif. Le mode 100 % Docker de [DEVELOPMENT.md](DEVELOPMENT.md) reste valable (non testé ici).

Tout se lance depuis `C:\Ebrain_os\ebrain\20_PROJECTS\ACTIVE\jobdom\04_code`. `yarn` n'est pas sur le PATH : on passe par Corepack (`corepack yarn …`).

## 1. Prérequis

| Outil | Version testée | Remarque |
| --- | --- | --- |
| Node.js | 24.15 | Corepack inclus |
| Docker Desktop | 29.4 | uniquement pour PostgreSQL |
| Ports libres | 5433 (base), 3300 (app) | 3000 et 5432 étaient pris sur cette machine ; adapte-les si besoin |

```powershell
$env:COREPACK_ENABLE_DOWNLOAD_PROMPT = '0'
corepack yarn install --immutable        # 748 paquets, yarn.lock inchangé (≈ 11 min la première fois)
```

## 2. Configuration (`.env`)

`.env` est ignoré par Git. Pars de `.env.example` (documente toutes les variables, aucun secret). Valeurs utilisées ici :

| Variable | Valeur |
| --- | --- |
| `DOSSIER_SECRET` | 32 octets aléatoires : `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `DOSSIER_PASSWORD` | le **hash** de ton mot de passe (voir §4), jamais le mot de passe |
| `POSTGRES_PASSWORD` | aléatoire (hex), `POSTGRES_PORT=5433`, `POSTGRES_USER=postgres`, `POSTGRES_DB=dossier` |
| `DATABASE_URL` | `"postgresql://postgres:<POSTGRES_PASSWORD>@localhost:5433/dossier"` |
| `DOSSIER_DATA_DIR` | `./data` (sinon `/data` devient `C:\data`) |

Fournisseur IA et source d'offres : voir §6.

## 3. Base de données

`compose.override.yml` (ajouté ici) publie PostgreSQL sur `127.0.0.1:5433` et l'application Docker sur `127.0.0.1:3300`.

```powershell
docker compose -p dossier up -d db       # postgres:18-alpine, volume pgdata
corepack yarn prisma generate
corepack yarn prisma migrate deploy      # 31 migrations
corepack yarn prisma db seed             # thèmes intégrés, profil vide, réglages (idempotent)
```

Arrêter / reprendre : `docker compose -p dossier stop` · `docker compose -p dossier start`. **Ne pas** utiliser `down -v` : il supprime les données.

## 4. Mot de passe de connexion

```powershell
corepack yarn hash-password              # demande le mot de passe deux fois, affiche « argon2id:… »
```

Copie la ligne dans `.env` : `DOSSIER_PASSWORD=argon2id:…`. (Vérifié en entrée par tube ; la saisie masquée au clavier n'a pas été testée ici.)

## 5. Lancer l'application

```powershell
corepack yarn next dev -p 3300 -H 127.0.0.1
```

Ouvre <http://127.0.0.1:3300>. `-H 127.0.0.1` évite d'exposer le serveur au réseau local. `GET /api/health` répond 200.

Notes : `next dev` crée `AGENTS.md`, `CLAUDE.md` et `next-env.d.ts`. En dev, une pastille « N » (outils de développement de Next) apparaît en bas à gauche : elle n'existe pas en production.

**Données de démonstration** (Jane Doe, 9 candidatures, celles des captures), dans une base séparée pour ne pas toucher aux tiens :

```powershell
$env:DATABASE_URL = ((Get-Content .env | Where-Object { $_ -match '^DATABASE_URL=' }) -replace '^DATABASE_URL=', '').Trim('"') -replace '/dossier$', '/dossier_demo'
corepack yarn prisma migrate deploy
corepack yarn prisma db seed -- --demo
corepack yarn next dev -p 3300 -H 127.0.0.1     # dans ce même terminal
```

## 6. Ce qui demande une clé ou un compte (non configuré)

| Fonction | À fournir | Où |
| --- | --- | --- |
| IA (extraction, matching, CV, lettre, e-mail, chat) | clé OpenAI-compatible / Anthropic / Mistral, **ou** Ollama / LM Studio local | Réglages → AI provider (ou `DOSSIER_AI_*`) |
| Recherche d'offres | clé JSearch (OpenWeb Ninja ou RapidAPI) ou Adzuna (app ID + clé) | Réglages → Job search (ou `DOSSIER_JSEARCH_KEY`, `DOSSIER_ADZUNA_*`) |
| Gmail / Calendar | client OAuth « Web application » Google | Réglages → Google |

Sans ces éléments l'application démarre et affiche des états explicites (ex. Find jobs : « Choose where to search… Until then, nothing is sent anywhere »), mais **aucune génération ni recherche réelle n'est possible**. Rien n'est envoyé (candidature, e-mail) sans ta confirmation.

## 7. Contrôles

Les tests de base de données et les e2e lisent `DATABASE_URL` dans l'environnement du processus (Docker le faisait via Compose) :

```powershell
$env:DATABASE_URL = ((Get-Content .env | Where-Object { $_ -match '^DATABASE_URL=' }) -replace '^DATABASE_URL=', '').Trim('"')
corepack yarn lint
corepack yarn typecheck
corepack yarn test                       # Vitest : unitaires, jsdom, base de données (base dossier_test créée à la volée)
```

**Build** : arrête d'abord le serveur de dev (même dossier `.next`). Si le build échoue sur `.next/dev/types/routes.d.ts`, c'est un fichier de cache corrompu par un arrêt brutal : supprime `.next\dev` et relance.

```powershell
corepack yarn build
```

**PDF** : Dossier imprime avec le Chromium de `playwright-core` (révision précise). Une fois :

```powershell
node node_modules/playwright-core/cli.js install --only-shell chromium
```

**E2E** (Playwright, serveur de production sur 3100, base `dossier_e2e`, faux fournisseurs IA / offres / Google) : après un `build`, avec le fuseau en UTC comme dans Docker :

```powershell
$env:TZ = 'UTC'
corepack yarn test:e2e
```

Dernier résultat sur cette machine : **135 réussis / 2 échecs** (`applications.spec.ts` « moves a card from the keyboard », persistant ; `versions.spec.ts`, intermittent). Une passe a aussi vu le serveur d'application cesser de répondre en cours de route. Détails et causes probables dans `RECONSTRUCTION_STATUS.md` §4. Ferme les autres applications gourmandes avant de lancer les e2e.

Sans `TZ=UTC`, `e2e/calendar.spec.ts` échoue sur une machine hors UTC (le pilote `pg` du test lit les `timestamp` sans fuseau en heure locale, d'où 1 h d'écart). Ces tests n'utilisent **aucune vraie clé** : ils prouvent le fonctionnement contre des simulations, pas contre les services réels.

## 8. Adaptations Windows apportées au dépôt

Originaux sauvegardés dans `..\_archive\originals-2026-10-29\`.

| Fichier | Changement |
| --- | --- |
| `src/test/db-global-setup.ts` | lance la CLI Prisma avec `process.execPath` au lieu de `yarn` |
| `src/lib/env.test.ts` | attend `path.resolve("/data")` (identique sous Linux) |
| `src/lib/session-audit.test.ts` | normalise les chemins `globSync` en `/` ; l'audit « toutes les actions et routes sont protégées » fonctionne désormais sous Windows |
| `e2e/support.ts` | seed via `process.execPath` ; dossier de données dans `os.tmpdir()` |
| `e2e/serve-app.mjs` (nouveau) + `playwright.config.ts` | démarre l'app e2e en Node pur (migrations, copie des statiques, serveur) au lieu de `yarn … && cp -r …` |
| `e2e/email.spec.ts` | le presse-papiers Windows renvoie du CRLF : normalisé avant comparaison |
| `compose.override.yml` (nouveau) | ports liés à `127.0.0.1` (5433, 3300) |

## 9. Dépannage

- `Error: spawnSync yarn ENOENT` : tu lances une version non adaptée (voir §8).
- `Database tests need DATABASE_URL` : exporte `DATABASE_URL` (§7).
- Connexion refusée / mot de passe invalide : régénère le hash (§4) ; après plusieurs échecs, le débit est limité 30 s à 15 min (table `LoginThrottle`).
- `0xC0000409` à la fin de `prisma db seed` pendant les e2e : plantage intermittent de Node sous Windows après la fin du seed ; relancer le test.
- Voir aussi `RECONSTRUCTION_STATUS.md` (limites connues).
