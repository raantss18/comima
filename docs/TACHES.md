# Tableau des tâches — COMIMa (source unique)

> Mis à jour le **27 oct. 2026** (version 1.1.0). Cases : `[x]` fait, `[ ]` à faire. **Antsa donne les ordres ; ARHeritiana conçoit et fabrique le contenu, en autonomie.**
> Claude et Codex sont leurs outils (mêmes consignes : `CLAUDE.md` = `AGENTS.md`). Règles et décisions : [`REPARTITION.md`](REPARTITION.md).
> Contenu : mode d'emploi dans [`CONTENU.md`](CONTENU.md). Détails historiques : `TODO.md` (site), `app/TODO.md` (application), `archives/`.
> **Avant de commencer une tâche : inscris ton nom ici (`@nom`), pousse, puis travaille. Ne prends jamais une tâche déjà prise.**

## 🎯 Objectif : la version 1.0 (jalons dans l'ordre)

| Jalon | Contenu | Qui | État |
| --- | --- | --- | --- |
| **0.8.x** | Sécurité, robustesse, interpréteur Python | Antsa | ✅ 0.8.0 et 0.8.1 publiées |
| **0.9.0** | **Accueil de l'application** : mot de bienvenue, raccourcis (S'entraîner, Défi, Bibliothèque, Actus, Profil/Réglages, **Interpréteur Python**), historique (derniers cours/exercices), logo = menu déroulant partout, raccourcis du haut retirés, design épuré | @Antsa (session Codex) | ✅ publiée le 27 oct. (accueil, menu du logo, Python avec `input` et dessins, Défi chronométré) |
| **0.9.1** | **Site : « Espace personnel »** (onglet : connexion, progression, statistiques comme l'application) ; l'Entraînement reste libre sans compte | Antsa | ✅ réalisé (page `/fr/espace/`, `/en/space/`) ; PR en cours |
| **0.9.2** | **Cours et actus plus visuels** (application et site) : cartes, illustrations, peu de texte | Antsa (structure) + Heritiana (contenu visuel) | ✅ cartes faites (site et application) ; reste le contenu visuel d'Heritiana (§ Visuel) |
| **0.9.3** | **Administration protégée** : accès réservé aux admins (empreintes salées, connexion admin) | Antsa | ✅ garde posée (PR en cours). **À faire par Antsa** : écrire ses e-mails dans `release-keys/admins.txt`, `node scripts/admins.mjs` puis publier `public/admins.json`, et coller le SQL de `--sql` dans Supabase. **Fait le 27 oct. pour Antsa et Heritiana** ; reste Christalin (créer son compte avec son adresse institutionnelle, puis rôle admin). Tant que la liste est vide, `/admin` reste ouvert (avec un avertissement) |
| **1.0.0** | Revue finale : tous les tests, rapport de tests d'Heritiana, nettoyage, rien d'ouvert | les deux | ✅ publiée le 27 oct. (revue du site en mobile : aucun défilement horizontal) ; restent : rapport de tests complet et contenu visuel d'Heritiana, compte de Christalin (admin) |
| **1.1.0** | **Entraînement et Défi liés à ce qu'on a lu** (cours lus + exercices vus, tirage toujours au hasard, choix annoncé) ; **suivi automatique** (ouvrir = « lu ») ; **statistiques d'usage** (version de l'application, lectures) | Antsa | ✅ publiée le 27 oct. (migration `20261027000000_usage_version.sql` passée en production) |
| **1.2.0** | **Réponses cachées aux élèves** (application et site), solutions retirées du site public, chapitres du cours en édition élèves (sans solutions) | Antsa | ✅ publiée le 27 oct. |
| **1.3.0** | **Quiz variés à chaque session** : 31 modèles de questions à nombres tirés au hasard et réponse calculée (application et site), dans les étapes, « Questions au hasard » et le Défi ; puis banque rédigée d'Heritiana | Antsa + Heritiana | ✅ générateurs en cours de publication ; banque rédigée : voir la liste d'Heritiana |

## 🧭 Antsa (donneur d'ordre) — dans l'ordre

- [x] Publier 0.8.1, 0.9.0, 0.9.1, 1.0.0, 1.1.0 ; migrations Supabase passées (comptes, marque-pages, groupes, version).
- [x] Premier admin nommé (Antsa, Heritiana) ; garde de `/admin` en ligne ; e-mails des admins hors Git.
- [ ] Christalin : créer son compte avec son adresse institutionnelle, puis poser son rôle admin (`node scripts/admins.mjs --sql`).
- [ ] Tester Google et e-mail de bout en bout avec un compte d'élève réel.
- [ ] Facebook : désactivé (il faut une application Meta : numéro actif ou compte d'une autre personne du Bureau).
- [ ] Sauvegarder `release-keys/` hors de la machine ; lire les rapports de tests d'Heritiana.
- [ ] Facebook Sharing Debugger : « Scrape Again » sur les anciens liens partagés.
- [ ] **Campagne de lancement** : relire et publier ([`campagne/CAMPAGNE.md`](campagne/CAMPAGNE.md) : vidéo, 3 posts Facebook, 2 LinkedIn) ; suivre avec `supabase/stats.sql`.
- [ ] Plus tard : tableau de bord encadreur sur le site, statistiques par groupe, pseudo-code français, relier les sujets (concours) aux notions d'entraînement.

### 📊 Suivi de conception 1.1.0 (fait / à faire)

- [x] Statistiques d'usage : `supabase/stats.sql` (comptes, rôles, régions et centres déclarés, activité, lectures, notions) — **localisation = région et centre du profil**, jamais la langue ni l'IP.
- [x] Version de l'application et dernière activité envoyées à la synchronisation (`comima.touch`), tolérant un serveur sans la fonction.
- [x] Entraînement : carte « Questions au hasard » (10 questions), choix « Tous les cours / Ce que j'ai lu » annoncé ; mention « cours lu » sur les notions.
- [x] Défi : même choix, tirage toujours au hasard.
- [x] Suivi automatique : ouvrir un cours, un exercice ou un sujet le marque « lu » (application et site), sans toucher à un état déjà posé.
- [x] Les exercices vus rattachent leur chapitre (étiquette « chapitre N ») aux questions proposées.
- [x] README réécrit (court, lisible) ; ancien contenu conservé dans `GUIDE-TECHNIQUE.md`.
- [ ] Voir les premières statistiques par version quand les élèves auront mis à jour (relancer `supabase/stats.sql`).
- [ ] **Coffre des solutions (étape 2)** : sortir `solution.tex` et les `explication` du dépôt public vers un coffre Supabase réservé aux encadreurs validés ; rétablir leur accès sur le site pour eux.
- [ ] Sujets de concours : pas de chapitre ni de thème dans leurs métadonnées, donc ils comptent comme « lus » (statistiques) sans alimenter le tirage des questions.
- [ ] Site : choix « ce que j'ai lu » dans l'Entraînement web (aujourd'hui seulement dans l'application).

## ✍️ ARHeritiana (autonome : contenu, compilation, tests) — dans l'ordre

`[x]` fait · `[~]` en partie (compte pour moitié) · `[ ]` à faire.

- [~] **P1 — suites-lineaires, étape 1** : **@Codex**, contenu fusionné (#128), validation des textes faite, réception Android restant à tester ; lot sur `codex/p1-lineaires-etape1` : quatre sous-questions de lecture des exemples E1, E5 et E6 d’Engel, p. 222–224 ; étape portée de 3 à 7 questions (5 formats). Références contrôlées dans le PDF, traductions/adaptations signalées, réponses recalculées indépendamment.

- [~] **P1 — suites-periodes-sommes, étape 5** : **@Codex**, contenu fusionné et déployé (#127), réception Android restant à tester ; lot sur `codex/p1-periodes-sources` : `sp-31` et `sp-32`, problèmes 9.35(c) et 9.44 d’Engel (p. 227–228), étape portée de 2 à 4 questions ; références contrôlées dans le PDF, traductions signalées, corrections indépendantes. Formats ordre et vrai-faux ; textes Flutter FR/EN à 320 px et police ×2 validés. Réserve : débordement préexistant de l’en-tête à cinq étoiles, également reproduit sur `sp-07` ; signalement dans le rapport de tests.

- [x] **P1 — suites-periodes-sommes, étape 1** : **@Codex**, lot rédigé et validé le 28 oct. sur `codex/p1-periodes-etape1` : 5 questions originales FR/EN (`sp-26` à `sp-30`), étape portée de 1 à 6 questions. Recalcul indépendant : `python3 docs/verification/p1-periodes-etape1.py` ; paquets, moteur et tests du site validés. Reste P1 sur les autres étapes et notions.

- [x] **Banque de questions rédigées (1.3.0)** (@ARHeritiana, session Codex — PR #123) : les 12 notions atteignent au moins 25 questions (315 au total, 25 à 30 par notion), réparties par difficulté. Complément final : `suites-lineaires` +5, `tiroirs-bases` +2, `invariants` +2, `suites-periodes-sommes` +1 ; énoncés FR/EN, sources et corrections détaillées. Vérification reproductible : `node docs/verification/banque-1-3-0.mjs`. Les 31 modèles générés complètent cette banque sans remplacer les questions rédigées.
- [ ] **Émulateur Android** : l'installer pour tester l'application de son côté (guide : `RAPPORT-TESTS.md`, § « Tester l'application sur un émulateur »).
- [x] **PY1** — chapitre « Python et algorithmes de base » : **@Codex**, fusionné et déployé (PR #130, 28 oct.) : neuf pages A5, dix exercices FR/EN issus de Python et CodEx, sources et adaptations détaillées ; 1 435 vérifications des programmes Python/COMIMa. Compilation, contrôles locaux et distribution en ligne validés (`verification/py1-cours.md`) ; manifeste `48f20a475941`. Ouverture manuelle Android/hors ligne encore à tester, signalée dans le rapport #129.
- [ ] **PY2** — notions d'entraînement `python-*` avec questions `code` (voir `CONTENU.md`, § Python).
- [ ] **PY3** — exercices et problèmes d'algorithmique (thème `informatique`) tirés des ressources.
- [~] **Rapport de tests** — **@Codex**, complément du 28 oct. rédigé sur `codex/rapport-p1-2026-10-28` (lots P1 #127 et #128, sources, déploiements et paquets vérifiés, rendu mobile et réserve d’en-tête) ; PR de rapport à relire par Antsa.
- [~] **Rapport de tests initial** — remplir [`RAPPORT-TESTS.md`](RAPPORT-TESTS.md), PR « Rapport de tests » (relecture : `raantss18`). Partiel fusionné (PR #103, 27 oct.) : commandes OK ; reste à tester sur le site en ligne et l'application : A2, A5, A7, B1 à B6, D1 à D3.
- [ ] **Q1** — quiz des étapes d'Engel restantes (polynômes, équations fonctionnelles, jeux, autres stratégies).
- [ ] **E1–E3** — énoncés des autres ressources (`ressource/`), IMO officiels, olympiades nationales.
- [~] **S2** — étapes 1 à 4 faites et déployées (norme, 9 chapitres en `cours.tex`, scripts, pagination continue, PDF et zips des OM nationales 2025/2026 régénérés le 27 oct.) ; reste : recueil complet (script `build-recueil.mjs` à relire par Antsa), puis **S3/E4** — solutions rédigées.
- [ ] **Illustration « n² + n + 41 »** : la grille fait 15 colonnes, donc sur téléphone n = 10 à 14, 25 à 29 et 40 à 44 sont cachés (il faut faire glisser) ; passer à 10 colonnes sur petit écran (`src/scripts/fiche/contre-exemples.ts`).
- [ ] **Visuel (0.9.2)** — pour chaque chapitre : une image/schéma d'en-tête, 3 à 5 « points clés » courts, une illustration interactive ; pour chaque article : une photo, un titre court, un résumé de 2 lignes (voir `CONTENU.md`, § Visuel).
- [ ] G1 jeu de constructions, G2 simulations, Q2/Q3/S1/S5 (voir `TODO.md`).

## ✅ Décisions d'Antsa (27 oct. 2026) — à appliquer, ne pas rediscuter

| Sujet | Décision |
| --- | --- |
| **Admins** | Les e-mails des admins vivent **hors Git** dans `release-keys/admins.txt` (fichier privé d'Antsa). Le dépôt ne reçoit que des **empreintes salées** (illisibles) ; un script génère le SQL qui nomme les admins dans Supabase. La page `/admin` exige une **connexion admin** ; le jeton GitHub reste nécessaire pour publier. |
| **Défi** (bouton de l'accueil) | **Défi chronométré** : un maximum de questions en 3 minutes, meilleur score personnel, partage du score. Hors ligne. |
| **Interpréteur Python** | Éditeur + Exécuter + exemples, **avec `input()`** (le programme est relancé avec les réponses saisies) **et mini-graphiques** (`point`, `ligne`, `courbe`, rendus dans un canevas). Toujours borné et sans `import` ni fichiers. |
| **Réponses et solutions** | **Jamais visibles d'un élève** (profil non « encadreur », y compris sans compte) : ni solution d'exercice, ni réponse ou explication après une erreur (un seul essai, puis la suivante). **Encadreur = dès le choix dans le profil** (décision d'Antsa ; à durcir plus tard par la validation du Bureau). Étape 1 (1.2.0) : tout masqué, plus aucune solution publiée sur le site (ni PDF, ni sources, ni index, ni chapitres de cours). Étape 2 (« coffre ») : solutions retirées du dépôt public vers un coffre Supabase réservé aux encadreurs. |
| **Variété des quiz** | Générateurs de questions (nombres tirés au hasard, réponse calculée par le moteur), puis banque rédigée d'Heritiana : chaque session est différente (1.3.0). |
| **Contenu visuel** | Cartes, illustrations, courts textes : voir `CONTENU.md`, § Visuel. |

## 🛡️ Règles anti-casse (courtes)

- **Contenu** (`content/**`, actualités, illustrations, docs) : Heritiana fusionne seul quand `check`, `web`, `supabase` sont verts.
- **Code, serveur, workflows, versions** : Antsa seul. Une PR qui touche ces chemins demande sa relecture (une seule fois, sur la racine).
- **L'application ne casse pas sur un contenu mal formé** : le CI affiche tous les textes tels que l'application les rend
  (LaTeX, HTML, Markdown) et **échoue** s'il reste du balisage brut ; le contenu est vérifié (SHA-256), installé d'un bloc, avec repli sur le contenu de l'APK.
- **Une seule source** : ce tableau pour les tâches, `REPARTITION.md` pour les règles, `CLAUDE.md`/`AGENTS.md` pour les consignes d'outils.
- Ne jamais supprimer la branche d'une PR qui sert de base à d'autres. Ne pas fusionner pendant un déploiement en cours.

## ✅ Fait récemment

27 oct. (ARHeritiana) : relecture complète du contenu, refonte de la structure des cours (S2), rapport de tests partiel — détail et pièges dans [`archives/ETAT-SESSION-2026-10-27.md`](archives/ETAT-SESSION-2026-10-27.md).
27 oct. : sécurité + fuzz du moteur Python, tests d'attaque RLS, migrations Supabase, Facebook désactivé, correctifs d'affichage (LaTeX, articles, partage).
26 oct. : 0.4 → 0.8 (illustrations, marque-pages, groupes, contenu autonome, nouveau logo, À propos/Contact, interpréteur Python), chapitres normalisés, 1 356 exercices.
