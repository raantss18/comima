# Tableau des tâches — COMIMa (source unique)

> Mis à jour le **27 oct. 2026**. **Antsa donne les ordres ; ARHeritiana conçoit et fabrique le contenu, en autonomie.**
> Claude et Codex sont leurs outils (mêmes consignes : `CLAUDE.md` = `AGENTS.md`). Règles et décisions : [`REPARTITION.md`](REPARTITION.md).
> Contenu : mode d'emploi dans [`CONTENU.md`](CONTENU.md). Détails historiques : `TODO.md` (site), `app/TODO.md` (application), `archives/`.
> **Avant de commencer une tâche : inscris ton nom ici (`@nom`), pousse, puis travaille. Ne prends jamais une tâche déjà prise.**

## 🎯 Objectif : la version 1.0 (jalons dans l'ordre)

| Jalon | Contenu | Qui | État |
| --- | --- | --- | --- |
| **0.8.x** | Sécurité, robustesse, interpréteur Python | Antsa | ✅ 0.8.0 publiée ; 0.8.1 (sécurité) en cours |
| **0.9.0** | **Accueil de l'application** : mot de bienvenue, raccourcis (S'entraîner, Défi, Bibliothèque, Actus, Profil/Réglages, **Interpréteur Python**), historique (derniers cours/exercices), logo = menu déroulant partout, raccourcis du haut retirés, design épuré | Antsa | à faire |
| **0.9.1** | **Site : « Espace personnel »** (onglet : connexion, progression, statistiques comme l'application) ; l'Entraînement reste libre sans compte | Antsa | à faire |
| **0.9.2** | **Cours et actus plus visuels** (application et site) : cartes, illustrations, peu de texte | Antsa (structure) + Heritiana (contenu visuel) | à faire |
| **0.9.3** | **Administration protégée** : accès réservé aux admins (liste d'e-mails chiffrée) | Antsa | à décider (voir « Questions ») |
| **1.0.0** | Revue finale : tous les tests, rapport de tests d'Heritiana, nettoyage, rien d'ouvert | les deux | — |

## 🧭 Antsa (donneur d'ordre) — dans l'ordre

1. Publier **0.8.1** (sécurité + corrections d'affichage) ; exécuter les 2 migrations Supabase (**faites le 27 oct.**).
2. Répondre aux **Questions** ci-dessous (elles bloquent 0.9.0 à 0.9.3).
3. Nommer le premier admin (SQL du README Supabase) ; tester Google et e-mail de bout en bout.
4. Facebook : désactivé (il faut une application Meta : numéro actif ou compte d'une autre personne du Bureau).
5. Sauvegarder `release-keys/` hors de la machine. Lire les rapports de tests d'Heritiana.
6. Plus tard : tableau de bord encadreur sur le site, statistiques par groupe, pseudo-code français.

## ✍️ ARHeritiana (autonome : contenu, compilation, tests) — dans l'ordre

1. **PY1** — chapitre « Python et algorithmes de base » (`content/cours/09-python-algorithmes/`, norme `STRUCTURE-COURS.md`).
2. **PY2** — notions d'entraînement `python-*` avec questions `code` (voir `CONTENU.md`, § Python).
3. **PY3** — exercices et problèmes d'algorithmique (thème `informatique`) tirés des ressources.
4. **Rapport de tests** — remplir [`RAPPORT-TESTS.md`](RAPPORT-TESTS.md), PR « Rapport de tests » (relecture : `raantss18`).
5. **Q1** — quiz des étapes d'Engel restantes (polynômes, équations fonctionnelles, jeux, autres stratégies).
6. **E1–E3** — énoncés des autres ressources (`ressource/`), IMO officiels, olympiades nationales.
7. **S2** — recueil complet (pagination continue, script `build-recueil.mjs` à relire par Antsa) ; **S3/E4** — solutions rédigées.
8. **Visuel (0.9.2)** — pour chaque chapitre : une image/schéma d'en-tête, 3 à 5 « points clés » courts, une illustration
   interactive ; pour chaque article : une photo, un titre court, un résumé de 2 lignes (voir `CONTENU.md`, § Visuel).
9. G1 jeu de constructions, G2 simulations, Q2/Q3/S1/S5 (voir `TODO.md`).

## ❓ Questions pour Antsa (réponse = déblocage)

| # | Question | Ma recommandation |
| --- | --- | --- |
| Q-A | **Liste des admins chiffrée** : où vit-elle et qui la déchiffre ? | Fichier **non versionné** `release-keys/admins.txt` (tes e-mails) → script qui publie dans le dépôt **seulement des empreintes salées** (impossibles à relire) + génère le SQL qui nomme les admins dans Supabase. Aucun e-mail en clair dans Git (dépôt public). |
| Q-B | **Page /admin** : elle reste un lien ; on exige quoi ? | Connexion obligatoire (compte COMIMa **admin**) pour voir la page ; le jeton GitHub reste nécessaire pour publier. |
| Q-C | **« Défi »** (bouton de l'accueil) : c'est quoi ? | **Défi du jour** : 5 questions tirées au hasard chaque jour, série de jours, partage du score. (Ligues et duels : plus tard.) |
| Q-D | **Interpréteur Python** de l'accueil | Éditeur + « Exécuter » + sortie, exemples prêts à lancer, sans `import`/fichiers (même moteur borné que les questions de code). |

## 🛡️ Règles anti-casse (courtes)

- **Contenu** (`content/**`, actualités, illustrations, docs) : Heritiana fusionne seul quand `check`, `web`, `supabase` sont verts.
- **Code, serveur, workflows, versions** : Antsa seul. Une PR qui touche ces chemins demande sa relecture (une seule fois, sur la racine).
- **L'application ne casse pas sur un contenu mal formé** : le CI affiche tous les textes tels que l'application les rend
  (LaTeX, HTML, Markdown) et **échoue** s'il reste du balisage brut ; le contenu est vérifié (SHA-256), installé d'un bloc, avec repli sur le contenu de l'APK.
- **Une seule source** : ce tableau pour les tâches, `REPARTITION.md` pour les règles, `CLAUDE.md`/`AGENTS.md` pour les consignes d'outils.
- Ne jamais supprimer la branche d'une PR qui sert de base à d'autres. Ne pas fusionner pendant un déploiement en cours.

## ✅ Fait récemment

27 oct. : sécurité + fuzz du moteur Python, tests d'attaque RLS, migrations Supabase, Facebook désactivé, correctifs d'affichage (LaTeX, articles, partage).
26 oct. : 0.4 → 0.8 (illustrations, marque-pages, groupes, contenu autonome, nouveau logo, À propos/Contact, interpréteur Python), chapitres normalisés, 1 356 exercices.
