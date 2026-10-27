# Répartition et règles de travail

> **Le tableau des tâches à jour est [`TACHES.md`](TACHES.md)** (court, une seule source). Ce fichier ne garde que les
> **règles** et le **journal des décisions**. L'ancienne liste détaillée (choix C1–C8, tâches B/E/G/Q/S…) est archivée
> dans [`archives/REPARTITION-2026-10-27.md`](archives/REPARTITION-2026-10-27.md) : ne plus s'y fier pour savoir quoi faire.

## Qui est qui

- **Antsa** : donneur d'ordre. Décide les priorités et les versions, valide, **publie**. Code de l'application et du site,
  serveur (Supabase), clés, comptes.
- **ARHeritiana** : conception et contenu, **autonome** : cours, chapitres, recueil, exercices, solutions, quiz et fiches
  d'entraînement, illustrations, simulations, énoncés des ressources, leur compilation et leurs tests.
- **Claude et Codex** sont les outils des deux : leurs consignes (`CLAUDE.md` et `AGENTS.md`) sont **identiques** (un test
  le vérifie : `node scripts/sync-consignes.mjs` les resynchronise). En cas de doute, ce qui est écrit ici et dans `TACHES.md`
  l'emporte sur toute autre note.

## Règles de coordination

1. **`git pull` avant de brancher**, une branche + une PR par tâche, PR petites. Titre en français,
   message de commit à l'impératif ou au passé, mention de l'ID de tâche (ex. « Q1a : notion Suites »).
   **Une tâche terminée et poussée = une PR ouverte tout de suite** (sans attendre qu'on la demande),
   vers `main`, avec `npm test` vert ; pour les sessions Claude, la PR est ouverte automatiquement.
   Une PR de pur contenu se fusionne soi-même quand les contrôles sont verts (règle 11).
2. **Fichiers « chauds »** (conflits fréquents) : `app/CHANGELOG.md` (section `## [Non publié]`
   seulement, **une ligne par changement**), `docs/TODO.md`, `docs/app/TODO.md`, ce fichier.
   Les modifier par petits commits, jamais les réécrire en entier.
3. **Contenu sourcé, rien d'inventé** : chaque énoncé garde sa source (livre, chapitre, numéro,
   page, concours d'origine) ; les traductions sont signalées ; **aucune solution du livre recopiée**.
4. **Léger et confortable** : vérifier le poids (`public/app/v1/library.json`), pas d'image
   inutile, pas de dépendance nouvelle sans raison. Tester le site sur mobile.
5. **Secrets** : jamais de clé, mot de passe ni `service_role` dans Git, dans une PR, un journal
   ou une discussion. `release-keys/` et `ressource/` sont ignorés par Git.
6. **Publication** (rappel, `app/RELEASING.md`) : release GitHub **avant** de fusionner
   `release.json` ; marquée *Latest* ; fichiers aussi sans numéro de version
   (`comima-universal.apk`…) ; le site n'affiche jamais le numéro de version.
7. **Compilation des PDF : c'est ARHeritiana qui s'en charge** (décision du 26 oct.) : après un lot
   d'énoncés ou de chapitres, `node scripts/build-latex.mjs` en local, corriger les erreurs LaTeX *avant* la
   PR. Antsa ne compile plus les lots d'ARHeritiana.
8. **Ne pas empiler les fusions sur `main`** : chaque fusion relance le déploiement et **annule celui en
   cours** ; or la compilation des PDF n'enregistre son cache qu'à la fin d'un déploiement réussi. Regrouper
   les fusions, et attendre la fin du déploiement (onglet Actions) avant la suivante. Tâche A10 : enregistrer
   le cache même en cas d'annulation.
9. **Une PR ne se fusionne que lorsque tous ses contrôles sont verts.**
10. **Mettre à jour ce fichier** en fin de tâche : colonne « État » (`fait`, `en cours`,
   `bloqué : …`) et, si besoin, une ligne dans `TODO.md`.
11. **Contenu : ARHeritiana est autonome, y compris tout l'entraînement (notions, fiches, questions).** Il fusionne seul ses PR qui ne touchent que du contenu, quand les
   contrôles sont verts ; le contenu arrive dans l'application **sans nouvelle version** (voir `CONTENU.md`,
   liste « Autonomie » et garde-fous contre les redondances).
12. **Qui fusionne quoi** : voir `CLAUDE.md`, section « Collaboration ». Contenu, entraînement, illustrations, docs :
   fusion autonome. Gabarits LaTeX, scripts, code du site et de l'application, serveur, workflows : relecture
   d'Antsa (demandée une seule fois, sur la PR racine d'une pile). Versions, clés, serveur : Antsa seul.
13. **Le contenu et sa compilation sont à ARHeritiana, de bout en bout, y compris les tests** (décision du 26 oct.) :
   il teste sur le site en ligne et dans l'application, remplit `docs/RAPPORT-TESTS.md` et le renvoie à Antsa par une
   PR « Rapport de tests » (relecture demandée à `raantss18`). Antsa n'intervient sur le contenu que si quelque chose casse.


## Journal des décisions

| Date | Décision |
| --- | --- |
| 26 oct. 2026 | Facebook par l'application Facebook : reporté (branche `facebook-app`). |
| 26 oct. 2026 | Les compilations de PDF des lots de contenu sont faites par ARHeritiana (règle 7). |
| 26 oct. 2026 | **Contenu autonome** : ARHeritiana fusionne seul le contenu (sans version d'application) ; mises à jour en ligne des quiz, de la bibliothèque et des illustrations ; contrôle anti-redondance (`CONTENU.md`). |
| 26 oct. 2026 | Marque-pages des élèves : idée acceptée, **0.6.0** (la 0.5.0 est déjà publiée), tâches B1 à B5. |
| 26 oct. 2026 | Publier = machine d'Antsa ; contenu et site = les deux machines. |
| 26 oct. 2026 | **La conception de cours (chapitres, fiches, quiz, illustrations, jeu, recueil, solutions) est la part d'ARHeritiana** ; Antsa garde la technique et la publication. |
| 26 oct. 2026 | Extraction des livres : Engel terminé (ch. 1 à 14, 1 113 énoncés) ; autres documents à suivre. |
