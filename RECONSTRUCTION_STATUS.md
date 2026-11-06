# RECONSTRUCTION_STATUS — Dossier

Dernière mise à jour : 2026-10-31 (mesures du 2026-10-29, état Git et contrôle de secrets du 2026-10-31) · **Phases 0 et 2 terminées, Phase 1 (référence) faite, base qualité établie.** Phases métier (5 à 11) : vérifiées **contre des simulations seulement** ; aucune clé réelle n'est disponible.

Le suivi détaillé (journal, décisions, risques, registre des vérifications, plan, backlog) est tenu **hors dépôt**, dans le vault : `jobdom/01_plan` et `jobdom/03_project_monitoring`.

Légende : ✅ vérifié · 🟡 vérifié partiellement ou contre des simulations · ❌ non vérifié / en échec · ⏳ à faire

## 1. Architecture observée

Racine : le dossier `04_code` du projet `jobdom`.

| Couche | Constat |
| --- | --- |
| Projet | Dossier `1.9.2` (AienTech/dossier, AGPL-3.0), mono-utilisateur, auto-hébergé. Dépôt **complet** : aucune fonctionnalité à recréer |
| Stack | Next.js 16.3.6 (App Router), React 19.3, TypeScript, Tailwind 4, Zod 4, Prisma 7.10 (adaptateur `pg`), PostgreSQL 18, Yarn 4.18.1 (Corepack) |
| IA | `src/lib/ai` : local (Ollama/llama.cpp), OpenAI-compatible, Anthropic, Mistral, LM Studio ; tâches `src/lib/ai/tasks` ; garde-fou factuel |
| Offres | `src/lib/job-search` : JSearch, Adzuna, Bundesagentur (non officiel, Allemagne, opt-in) ; `src/lib/startups` ; cache mémoire 30 min |
| Agent / sauvegardes | timers **en mémoire** : une seule instance, rien ne tourne si le serveur est arrêté |
| PDF | Chromium de `playwright-core` ; Google : Gmail + Calendar (OAuth) ; connecteur Claude (`/api/mcp`) |
| Auth | mot de passe unique (hash argon2id dans `DOSSIER_PASSWORD`), session JWE, limitation de débit |
| Données | 31 migrations, seed (+ `--demo`) ; tests : 210 fichiers Vitest, 25 specs Playwright (137 tests) |

## 2. Mise en service

| Étape | Résultat |
| --- | --- |
| Git | ✅ dépôt initialisé par Exhorte le 2026-10-29 (après mon audit, qui n'en trouvait pas) : branche `main`, remote `origin` = `exhorte/jobdom` (**public**), 1 commit `f7faa02` « project construction » (13:53), 806 fichiers suivis, arbre propre à la date du contrôle. `.env` non suivi. **Aucun secret** (`DOSSIER_SECRET`, mot de passe de la base) dans les fichiers suivis ni dans l'historique (contrôlé le 2026-10-31). Les modifications de ce document et de `SETUP.md` faites ensuite ne sont pas commitées |
| Dépendances | ✅ `yarn install --immutable`, 748 paquets, lockfile inchangé |
| `.env` | ✅ secrets locaux générés ; `DOSSIER_PASSWORD` **vide, à remplir par toi** |
| PostgreSQL | ✅ conteneur `dossier-db-1` sur `127.0.0.1:5433` (5432 pris par un autre PostgreSQL) |
| Prisma | ✅ `generate`, `migrate deploy` (31), `db seed`. `prisma7.config.ts` est bien chargé par Prisma 7.10 (pas un défaut) |
| Serveur | ✅ `next dev -p 3300 -H 127.0.0.1` ; `/api/health` 200 ; pages privées → 307 `/login` |
| Écrans | ✅ 10 routes : 200, 0 erreur console, 0 réponse 5xx |
| Lint / types | ✅ `yarn lint` et `yarn typecheck` : exit 0 |
| Vitest | ✅ **1 681 réussis, 0 échec**, 26 ignorés (tests « live » sans clés) |
| Build | ✅ `yarn build` : 35 pages. Les traces `EnvError` à la génération sont normales (build sans secrets, pages rendues à la demande) |
| Chromium PDF | ✅ headless shell r1243 installé (celui de la machine était r1234, inutilisable) |
| E2E | 🟡 **135/137** à la dernière passe complète (voir §4) |

## 3. Écarts Windows et fichiers modifiés

Originaux sauvegardés dans `jobdom/_archive/originals-2026-10-29/`.

| Fichier | Problème | Correction |
| --- | --- | --- |
| `src/test/db-global-setup.ts` | `execFileSync("yarn")` impossible sous Windows | CLI Prisma lancée avec `process.execPath` |
| `src/lib/env.test.ts` | attendait `"/data"` (`path.resolve` donne `C:\data`) | attentes via `path.resolve` |
| `src/lib/session-audit.test.ts` | audit de sécurité « actions/routes protégées » : chemins `\` contre listes `/` | chemins normalisés ; l'audit passe |
| `e2e/support.ts` | `yarn` et `/tmp` en dur | `process.execPath`, `os.tmpdir()` |
| `e2e/serve-app.mjs` (nouveau), `playwright.config.ts` | `yarn … && cp -r …` | démarrage en Node pur |
| `e2e/email.spec.ts` | presse-papiers Windows renvoie du CRLF | normalisé |

Aussi : `compose.override.yml` (ports 127.0.0.1:5433 et :3300), `.env` ; `next dev` génère `AGENTS.md`, `CLAUDE.md`, `next-env.d.ts`. README, `site/build.sh` et `e2e/readme-*.ts` pointent vers `.github/…` (renommé `asset`) : sans effet sur l'exécution, à corriger si tu le souhaites ; workflows non restaurés.

## 4. E2E : détail honnête

Trois passes complètes, aucune entièrement verte :

| Passe | Résultat | Cause |
| --- | --- | --- |
| A (premier essai) | 131 ✅ / 6 ❌ | calendrier : le pilote `pg` du test lit des `timestamp` sans fuseau en heure locale → **1 h d'écart hors UTC** (corrigé en lançant avec `TZ=UTC`, vérifié) ; e-mail : CRLF du presse-papiers (corrigé, vérifié) + 3 échecs en **cascade** (Playwright rejoue `beforeAll` après un échec) ; **clavier** (voir ci-dessous) |
| B (`TZ=UTC`) | 67 ✅ puis `ERR_CONNECTION_RESET` | le serveur d'application a cessé de répondre à partir du test 68. Aucune trace dans le journal Windows ; le même fichier relancé seul : 77/77 ✅. **Cause non établie** |
| C (`TZ=UTC`, code corrigé) | **135 ✅ / 2 ❌** | clavier (persistant) ; `versions.spec.ts` : bouton « Read the posting → » encore désactivé après `fill()`, typique d'un remplissage avant l'hydratation de React (intermittent : réussi aux passes A et B) |

**Échec persistant : `applications.spec.ts` « moves a card from the keyboard ».** Le menu s'ouvre, mais le focus reste sur le conteneur `menu` au lieu du premier élément. Reproduit seulement quand le test suit `resetData()` ; une sonde équivalente sans reset place bien le focus sur « Draft ». Hypothèse non démontrée : timing ou événements pointeur de Chromium sous Windows. Non lié à une fonctionnalité métier ; à ne pas masquer.

**Autres instabilités vues sous Windows** : un démarrage du serveur e2e sans réponse en 120 s (une fois) ; `prisma db seed` terminé mais processus Node en `0xC0000409` à la sortie (une fois), ce qui fait échouer `resetData()` ; passes B et C 2× plus lentes que A (machine chargée par d'autres conteneurs).

## 5. Fidélité visuelle (Phase 1)

Comparaison faite sur `/`, `/applications`, `/resume` et `/jobs` (état non configuré) : structure, tokens, typographie et graphiques **identiques aux captures**, écarts tous expliqués par la version (captures 1.7.x, code 1.9.2) ou par les dates relatives. Les 5 autres écrans (profile, new, application, inbox, calendrier) sont rendus sans erreur, mais non comparés image par image. Détails : `UI_REFERENCE.md`.

## 6. Critères de terminaison (Phase 16)

| Domaine | État |
| --- | --- |
| Application | ✅ dépendances, variables documentées (`.env.example`, `SETUP.md`), base, migrations, serveur, pages, 0 erreur bloquante |
| Interface | ✅ captures inventoriées, pages présentes, navigation, icônes (lucide), formulaires, états vides/erreurs · 🟡 fidélité contrôlée sur 4 écrans sur 9 |
| IA | 🟡 abstraction, erreurs de configuration, contrats de tâches, sorties validées (Zod) : tests unitaires + e2e contre un faux serveur OpenAI-compatible · ❌ **aucun fournisseur réel testé** (pas de clé) · 🟡 secrets chiffrés et jamais renvoyés au navigateur : vu dans le code et les tests, pas audité en profondeur |
| Recherche d'emploi | ✅ adaptateurs identifiés · 🟡 normalisation, déduplication, cache, erreurs : fixtures et faux serveurs · ❌ **aucune source réelle interrogée** |
| Matching et documents | 🟡 analyse, score expliqué, lacunes, CV, lettre : e2e contre faux IA · ✅ **export PDF réel** (e2e `resume`, `photo`) · 🟡 garde-fou factuel : tests unitaires, pas contre un vrai modèle |
| Candidatures et agent | 🟡 brouillon, documents associés, statuts persistés, agent (limites, déduplication) : e2e contre simulations · 🟡 envois (Gmail) soumis à confirmation : e2e contre faux Google |
| Qualité | ✅ lint, types, Vitest, build · 🟡 e2e 135/137, échecs documentés (§4) |

## 7. Ce que seul toi peux fournir

Mot de passe (hash) · clé API Anthropic (fournisseur par défaut déjà configuré dans `.env`, `claude-sonnet-5-5`, voir `SETUP.md` §6 bis) ou autre fournisseur IA (Ollama/LM Studio) · source d'offres (clé JSearch ou Adzuna) · client OAuth Google (optionnel). Sans eux, l'application fonctionne et affiche des états explicites, mais aucune génération ni recherche réelle n'est possible.

L'abonnement Claude **ne peut pas servir de fournisseur** à Dossier (conditions d'Anthropic) : il passe par le connecteur Claude, où c'est Claude qui appelle Dossier. Vérifié en e2e et sur serveur local ; jamais avec un vrai compte.

## 8. Prochaines étapes

1. Définir `DOSSIER_PASSWORD` (`SETUP.md` §4) et saisir la clé API Anthropic dans Réglages (`SETUP.md` §6 bis) ; ou, sans frais, un modèle local (Ollama/LM Studio). Pour l'abonnement Claude : activer le connecteur puis `claude mcp add` (§6 bis B).
2. Tester en réel : connexion IA, New application, CV/PDF, garde-fou factuel ; puis une source d'offres, Find jobs, agent.
3. Revue sécurité approfondie (secrets, contenus externes non fiables) ; décider si le dépôt reste public (il contient une copie du code AGPL-3.0 d'AienTech/dossier : conserver `LICENSE` et signaler l'origine) et corriger les liens `.github/images` du README.
4. Fiabiliser les e2e sous Windows (focus clavier, hydratation, plantage du serveur) ou les exécuter en conteneur comme le prévoit le projet.

## 9. Risques

- Dépôt **public** : ne jamais y mettre de secret ni de note privée (les clés restent dans `.env`, ignoré). Les 6 fichiers de test modifiés pour Windows ont aussi une copie hors dépôt dans `jobdom/_archive/originals-2026-10-29/`.
- Les tests « live » dépensent des appels payants : jamais sans ton accord.
- Une instance unique : l'agent et les sauvegardes dépendent d'un processus qui doit rester lancé.
- L'intermittence du serveur sous charge (§4, passe B) n'est pas expliquée : à surveiller avant tout usage durable.
