# UI_REFERENCE — Dossier

Dernière mise à jour : 2026-10-29 · Source : les 9 captures de `asset/images/` + `src/app/globals.css`.
Statut : **référence rédigée à partir des captures et du code ; application lancée et comparée sur 4 écrans (§5). Les 5 autres (profile, new, application, inbox, calendar) sont rendus sans erreur mais pas comparés image par image.**

## 1. Réserves sur les captures

- Elles montrent **Dossier v1.7.0 / v1.7.1** (pied de la barre latérale) ; le code est en **1.9.2**. Des écarts sont donc attendus et ne sont pas des défauts : entrées **Agent** et **Startups** absentes des captures, `/calendar` redirigé vers `/` dans le code (`next.config.ts`) alors que la capture montre encore l'entrée « Calendar ».
- Données de démo (Jane Doe) : à retrouver avec `prisma db seed -- --demo` pour comparer à données égales.
- `demo.gif` (1280×800) est une animation : non analysée image par image.
- Taille : 2880×1800 (1440×900 à @2×) ; `applications.png` 3360×1800 (1680×900 @2×) ; `calendar.png` montre le tableau de bord en fenêtre large.

## 2. Écrans

| Capture | Route | Contenu observé | Données / états à vérifier |
| --- | --- | --- | --- |
| `dashboard.png` | `/` | Titre serif « Good evening, Jane », phrase de bilan, bascule *Last 30 days / Last 90 days / All time*, carte **Your funnel** (Sankey Sent→Screening→Interview→Offer→Accepted, 3 chiffres clés), carte **Week by week** (barres Started/Sent), bouton « + New application » | Funnel calculé depuis `StatusEvent` ; état vide sans candidature ; « Show the numbers » |
| `calendar.png` | `/` (large) | Même tableau de bord + colonne **Calendar** (mois, jour courant en pastille noire, points d'événements, liste Today/Tomorrow…), cartes **Where things stand** et **Worth a look** (« Soon », « Open/Review → ») | Dépend de Google Calendar (sinon uniquement les entretiens de Dossier) |
| `profile.png` | `/profile` | Jauge **Profile strength 100 %**, sections *Basics 11/11, Skills & languages, Experience, Education, References*, formulaire (nom, titre, e-mail, téléphone, date de naissance, site, adresse, ville, pays, LinkedIn), « All changes saved », *Import from a resume*, *See base resume →* | Enregistrement automatique ; validation Zod ; sections supplémentaires dans le code (projets, publications, faits) |
| `resume.png` | `/resume` | **Base resume** : aperçu A4 (thème *Editorial*), panneau *Themes / Customize* avec miniatures (Built-in : Editorial, Classic, Modern, Minimal, Technical, Ledger…), *Edit profile*, *Download PDF*, « A4 · 1 page » | PDF réel via Chromium ; 12 thèmes dans le README vs 6 intégrés dans la doc de développement → à compter dans l'app |
| `find-jobs.png` | `/jobs` | Onglets *Search / Past searches / Saved / Dismissed*, formulaire (What, Where, Country, Within, Posted, Remote only), liste de résultats + détail (Start application →, Save, Open posting ↗, Dismiss), *Show more*, *Search again* | Source JSearch/Adzuna ; états : clé manquante, aucun résultat, source en erreur, quota |
| `new-application.png` | `/new` | **How you match** (« 4 of 5 covered by your profile », coches / tiret, « + Add to profile »), **Tailoring** (ton Warm/Direct/Formal, « Anything I should know? ») | Extraction + matching réels par IA ; jamais d'expérience inventée |
| `application.png` | `/applications/[id]` | Fil d'Ariane, titre serif, statut *Draft ▾*, *Mark as sent*, *Download PDF*, menu « … », méta (lieu, mode, salaire, date limite), onglets *Resume / Cover letter / Email / Job posting · 5/7 match / Notes*, aperçu du CV (« Hover a section to edit or regenerate it », *History*), panneau **Refine with AI** (puces, suggestions, champ « Ask for a change », *Send*) | Chat d'affinage, annulation, versions |
| `applications.png` | `/applications` | **Board** (Draft, Sent, Screening, Interview, Offer) + bascule *Table*, recherche, filtres *All / In progress / Closed*, cartes (entreprise, titre, lieu, pastille « Apply by… », « 5/7 match », ancienneté), « Drag a card to change its status » | Glisser-déposer `@dnd-kit` ; changement de statut uniquement via `setStatus` |
| `inbox.png` | `/inbox` | Groupes **Needs an answer / Needs a look / Updates**, type de message (Interview invite, Question, Acknowledgement, Rejection), sélecteur *Choose application…* + *Link*, *Not job-related*, *Check now*, badge « 3 » dans la barre latérale | Nécessite Gmail ; état « non configuré » à vérifier |

Écrans non couverts par les captures (à documenter depuis le code puis l'app) : `/agent`, `/startups`, `/settings`, `/login`, `/profile/import`, `/oauth/authorize`, pages d'impression `/print/*`.

## 3. Composants partagés

- **Barre latérale** (~180 px à @1×, repliable via `PanelLeftClose/Open`) : logo « D » + « Dossier / Your job search, on your s… », bouton primaire **+ New application**, *Dashboard*, groupe **You** (Profile, Base resume), groupe **Job search** (Find jobs, Applications, Inbox, Calendar sur la capture), pied : Settings, *Dark mode*, utilisateur (« Jane Doe · Self-hosted · v1.7.0 ») + déconnexion.
- **Panneau d'écran** : contenu dans une surface arrondie (12 px) détachée du cadre ; titre serif 40 px précédé d'une icône ; phrase d'intro en gris (15 px).
- **Cartes** `--color-card`, bordure `--color-line-card`, rayon 12 px ; **champs** 14,5 px, bordure forte `--color-line-input`, rayon 8 px ; **segments** (bascules) avec segment actif surélevé ; **chips/filtres** avec compteur ; **badges de statut** par couleur ; **boutons** primaire (fond `#222`), secondaire (bordure), lien.
- **Icônes** : `lucide-react` (déjà installé, trait fin) — ne pas en ajouter d'autre.

## 4. Tokens (source : `src/app/globals.css`, clair / sombre)

| Rôle | Clair | Sombre |
| --- | --- | --- |
| Cadre / barre latérale (`paper`) | `#eeebe4` | `#1a1917` |
| Surface de l'écran | `#f4f2ed` | `#22201d` |
| Carte | `#fbfaf7` | `#2a2825` |
| Fond d'aperçu de document (`canvas`) | `#e8e5de` | `#141311` |
| Texte (`ink`) / secondaire (`muted`) | `#1d1c1a` / `#69655d` | `#f0ede7` / `#aaa59c` |
| Primaire | `#222222` (texte `#fbfaf7`) | `#ebe7df` (texte `#1d1c1a`) |
| Statuts | draft `#a29d94` · sent `oklch(.62 .09 250)` · screening `oklch(.62 .09 205)` · interview `oklch(.6 .09 295)` · offer `oklch(.68 .1 80)` · accepted `oklch(.6 .1 150)` · rejected `oklch(.58 .1 30)` | — |
| Rayons | contrôle 8 px · carte/panneau 12 px · dialogue 16 px | — |
| Ombres | `--shadow-page`, `-control`, `-cta`, `-menu`, `-dialog`, `-toast` | — |
| Typographie | sans **Geist** · serif **Newsreader** (titres 40 px / sections 24 px, poids 400/500) · mono **IBM Plex Mono** · polices additionnelles (EB Garamond, Inter, Lora, Fraunces…) pour les thèmes de CV | — |
| Tailles de texte | label 12,5 · meta 13 · control 13,5 · field 14,5 · lead 15 · section 24 · title 40 | — |

Les polices sont **embarquées** dans `src/fonts/` (20 familles) : aucune dépendance à Google Fonts.

## 5. Résultat de la comparaison (2026-10-29)

Base `dossier_demo` (`db seed -- --demo`), Chromium 1440×900 @2×, thème clair, serveur de dev. Les 10 routes répondent 200 sans erreur console ni réponse 5xx ; la suite e2e (`e2e/accessibility.spec.ts`) vérifie en plus les règles WCAG 2.2 AA sur chaque écran.

| Écran | Verdict | Écarts, tous expliqués |
| --- | --- | --- |
| `/` Dashboard | ✅ identique | entrées Startups et Agent, lien « Star on GitHub », Calendar fusionné ; barres « Week by week » (dates relatives au jour du seed) ; pastille « N » = outils de dev de Next |
| `/applications` | ✅ identique | 5ᵉ colonne *Offer* qui défile à 1440 px (la capture fait 1680 px) ; dates « Apply by » relatives au seed |
| `/resume` | ✅ identique | « A4 · 2 pages » au lieu d'« 1 page » : la démo 1.9 ajoute une section *Projects* |
| `/jobs` | ✅ état « non configuré » clair | pas de résultats sans clé : « Choose where to search… Until then, nothing is sent anywhere » + bouton *Set up job search* (la capture montre des résultats JSearch) |

Non comparés visuellement : `/profile`, `/new` (nécessite l'IA), `/applications/[id]`, `/inbox` (nécessite Gmail), calendrier du tableau de bord (nécessite Google).

## 6. Méthode de contrôle de fidélité

1. `prisma db seed -- --demo` pour avoir les mêmes données que les captures.
2. Navigateur à 1440×900, thème clair, DPR 2 ; ouvrir chaque route du tableau §2.
3. Comparer : structure, alignements, espacements, rayons, couleurs de statut, typographie, états survolés ; noter les écarts dans `RECONSTRUCTION_STATUS.md`.
4. Ne corriger que les écarts qui ne s'expliquent pas par la différence de version (1.7.x → 1.9.2).
5. Vérifier ensuite le mode sombre, un viewport étroit (« Desktop only » dans les limites connues) et les états vide / chargement / erreur.
