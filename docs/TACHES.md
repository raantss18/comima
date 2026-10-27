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
| **0.9.3** | **Administration protégée** : accès réservé aux admins (empreintes salées, connexion admin) | Antsa | ✅ garde posée (PR en cours). **À faire par Antsa** : écrire ses e-mails dans `release-keys/admins.txt`, `node scripts/admins.mjs` puis publier `public/admins.json`, et coller le SQL de `--sql` dans Supabase. Tant que la liste est vide, `/admin` reste ouvert (avec un avertissement) |
| **1.0.0** | Revue finale : tous les tests, rapport de tests d'Heritiana, nettoyage, rien d'ouvert | les deux | ✅ publiée le 27 oct. (revue du site en mobile : aucun défilement horizontal) ; restent : rapport de tests complet et contenu visuel d'Heritiana, 2 comptes admin |
| **1.1.0** | **Entraînement et Défi liés à ce qu'on a lu** (cours lus + exercices vus, tirage toujours au hasard, choix annoncé) ; **suivi automatique** (ouvrir = « lu ») ; **statistiques d'usage** (version de l'application, lectures) | Antsa | ✅ publiée le 27 oct. (migration `20261027000000_usage_version.sql` passée en production) |

## 🧭 Antsa (donneur d'ordre) — dans l'ordre

- [x] Publier 0.8.1, 0.9.0, 0.9.1, 1.0.0, 1.1.0 ; migrations Supabase passées (comptes, marque-pages, groupes, version).
- [x] Premier admin nommé (Antsa, Heritiana) ; garde de `/admin` en ligne ; e-mails des admins hors Git.
- [ ] Christalin : créer son compte avec son adresse institutionnelle, puis poser son rôle admin (`node scripts/admins.mjs --sql`).
- [ ] Tester Google et e-mail de bout en bout avec un compte d'élève réel.
- [ ] Facebook : désactivé (il faut une application Meta : numéro actif ou compte d'une autre personne du Bureau).
- [ ] Sauvegarder `release-keys/` hors de la machine ; lire les rapports de tests d'Heritiana.
- [ ] Facebook Sharing Debugger : « Scrape Again » sur les anciens liens partagés.
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
- [ ] Sujets de concours : pas de chapitre ni de thème dans leurs métadonnées, donc ils comptent comme « lus » (statistiques) sans alimenter le tirage des questions.
- [ ] Site : choix « ce que j'ai lu » dans l'Entraînement web (aujourd'hui seulement dans l'application).

## ✍️ ARHeritiana (autonome : contenu, compilation, tests) — dans l'ordre

0. **Installer un émulateur Android** pour tester l'application de son côté (guide : `RAPPORT-TESTS.md`, § « Tester l'application sur un émulateur »).

1. **PY1** — chapitre « Python et algorithmes de base » (`content/cours/09-python-algorithmes/`, norme `STRUCTURE-COURS.md`).
2. **PY2** — notions d'entraînement `python-*` avec questions `code` (voir `CONTENU.md`, § Python).
3. **PY3** — exercices et problèmes d'algorithmique (thème `informatique`) tirés des ressources.
4. **Rapport de tests** — remplir [`RAPPORT-TESTS.md`](RAPPORT-TESTS.md), PR « Rapport de tests » (relecture : `raantss18`). **Partiel déposé et fusionné (PR #103, 27 oct.)** : commandes OK ; reste à tester sur le site en ligne et l'application : A2, A5, A7, B1 à B6, D1 à D3.
5. **Q1** — quiz des étapes d'Engel restantes (polynômes, équations fonctionnelles, jeux, autres stratégies).
6. **E1–E3** — énoncés des autres ressources (`ressource/`), IMO officiels, olympiades nationales.
7. **S2** — étapes 1 à 4 faites et déployées (norme, 9 chapitres en `cours.tex`, scripts, pagination continue) ; **reste** : recueil complet (script `build-recueil.mjs` à relire par Antsa) ; PDF et zips des OM nationales 2025/2026 régénérés le 27 oct. ; **S3/E4** — solutions rédigées.
8. **Visuel (0.9.2)** — pour chaque chapitre : une image/schéma d'en-tête, 3 à 5 « points clés » courts, une illustration
   interactive ; pour chaque article : une photo, un titre court, un résumé de 2 lignes (voir `CONTENU.md`, § Visuel).
9. G1 jeu de constructions, G2 simulations, Q2/Q3/S1/S5 (voir `TODO.md`).

## ✅ Décisions d'Antsa (27 oct. 2026) — à appliquer, ne pas rediscuter

| Sujet | Décision |
| --- | --- |
| **Admins** | Les e-mails des admins vivent **hors Git** dans `release-keys/admins.txt` (fichier privé d'Antsa). Le dépôt ne reçoit que des **empreintes salées** (illisibles) ; un script génère le SQL qui nomme les admins dans Supabase. La page `/admin` exige une **connexion admin** ; le jeton GitHub reste nécessaire pour publier. |
| **Défi** (bouton de l'accueil) | **Défi chronométré** : un maximum de questions en 3 minutes, meilleur score personnel, partage du score. Hors ligne. |
| **Interpréteur Python** | Éditeur + Exécuter + exemples, **avec `input()`** (le programme est relancé avec les réponses saisies) **et mini-graphiques** (`point`, `ligne`, `courbe`, rendus dans un canevas). Toujours borné et sans `import` ni fichiers. |
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
