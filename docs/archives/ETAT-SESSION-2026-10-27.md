# État des travaux — session Claude d'ARHeritiana, 26–27 oct. 2026

> Point d'arrêt écrit avant épuisement du quota. À lire en premier pour reprendre. Les tâches vivantes sont dans
> [`../TACHES.md`](../TACHES.md) ; ceci est le détail de ce qui s'est passé, avec les pièges rencontrés.
> Dernier commit de `main` connu à l'écriture : `1306c8c7` (0.8.1).

## 1. Ce qui est fait (sur `main`, en ligne)

**Relecture complète du contenu** (demande : « formulations complètes, simples et exactes », attention aux leçons et résumés).
Un agent par chapitre (9), relecture seconde des leçons et résumés par des agents Opus 5.5, un agent par chapitre d'Engel (14),
un pour Dujella, un pour IMO/OM/sujets. Corrections de fond notables :
- ch. 2 : principe 3 faux (ensemble « fini » sans plus grand élément) ; problème 2.2 faux tel qu'énoncé (céviennes) ;
- ch. 3 : problème des cheveux (300 002 habitants, pas 300 001), énoncés 3.12 et 3.14 faux ; Erdős–Szekeres réécrit ;
- ch. 4 : six énoncés faux ou mal posés remplacés ; section « Notions utiles » complétée (parallélogramme, orthocentre…) ;
- ch. 5 : partie entière (« plus grand »), existence du PGCD, réciproque de Bézout ; ch. 7 : PGCD, monovariant, « strictement positifs » ;
- ch. 6 : arrangement, permutation, anagrammes définis ; ch. 1 : hérédité (« n quelconque »), récurrence forte ; ch. 0 et 8 : précisions ;
- OM nationales : solutions refaites (20706 et non 20416, etc.) ; IMO : quatre énoncés français précisés ;
- environ 77 énoncés d'Engel passés en « Montrer que… » ; plus de 1 000 traductions françaises relues.
- **Anglais d'Engel et de Dujella rétabli à l'identique** (règle du dépôt) ; coquilles de la source listées dans `docs/TODO.md`.

**Refonte de la structure des cours (tâche S2, étapes 1 à 4)** — norme `docs/STRUCTURE-COURS.md`, gabarits
`templates/preamble-cours.tex` et `templates/cours-modele.tex`, 9 chapitres en `cours.tex` (+ `meta.yaml`), énoncés inclus par id
(plus de double écriture), pagination continue (`page_debut` : 5, 20, 28, 32, 40, 48, 54, 81, 103), scripts
(`parseCoursTex`, `pagination.mjs`, plan et exercices dans `cours-index.json`), tests, correctif du numéro de page en A5.
Fusionné (PR #81, #82, #93, #91, #96) et déployé (runs 90 à 92 verts).

**Décisions d'ARHeritiana** (norme, § 9) : chapitres 1 à 7 au rendu de 0 et 8 ; pages continues ; notes `[E9]`, `[12]`… = renvois au
livre d'Engel (gardées en commentaire TeX) ; 7 solutions masquées du chapitre 3 **non publiées** (origine incertaine).

**Note de relais pour Antsa** : `docs/POUR-ANTSA.md`.

## 2. Ce qui est commencé (PR ouvertes)

| PR | Objet | Attend |
| --- | --- | --- |
| **#103** | Rapport de tests — 2026-10-27, **partiel** : section C faite (27/27, `check-content`, `build-latex` 2576/0 échec, `cargo test` 22/0, `astro build` 2858 pages), A1/A3/A4/B7 en partie ; le reste « non testé » | relecture de `raantss18` |
| **#95** | `.gitignore` : `node_modules/` → `node_modules` (le lien lui-même n'est plus suivi sur `main`) | `raantss18` |

## 3. Ce qui reste

1. **Priorité absolue, décidée par Antsa : PY1 à PY4** (voir `TACHES.md`) — chapitre `content/cours/09-python-algorithmes/` au format de la norme
   (`page_debut` = 130), notions `python-*` avec questions `code`, exercices d'algorithmique, pseudo-code. **Rien n'est commencé.**
2. **Terminer le rapport de tests** sur le site en ligne et l'application : A2, A5, A7, B1 à B6, D1 à D3, et le côté « en ligne » de A3/A4.
   Impossible depuis le conteneur (www.comima.mg injoignable) : à faire sur téléphone ou ordinateur, puis mettre à jour `RAPPORT-TESTS.md`.
3. ~~Régénérer `epreuve.pdf` et `sources.zip` des OM nationales~~ **fait le 27 oct.** (corrections reportées dans les sources `Ex0N.tex` par fusion à trois voies, compilation LuaLaTeX ; voir § 4 pour installer les paquets).
4. **Recueil complet** (`public/recueil-techniques-resolution-problemes.pdf` encore ancien) : script `scripts/build-recueil.mjs` à écrire
   (relecture d'Antsa), tout est prêt (`cours.tex` ×9, `page_debut`).
5. Confronter au livre d'Engel les « probables coquilles » et énoncés douteux de `docs/TODO.md` (le dossier `ressource/` n'est pas dans le
   conteneur) ; faire valider par un encadreur les traductions (E5) ; solutions des chapitres 1 à 7 (S3/E4, toutes `a_solution: false`) ;
   origine des 7 solutions du chapitre 3.
6. Vérifier à l'œil sur le site les 5 figures d'énoncé ajoutées à `scripts/build-figures.mjs` (`recueil-1-p7-pavage-trominos`,
   `recueil-3-p1-cinq-points-grille`, `recueil-3-p9-couronne`, `recueil-6-chemins-quadrillage`, `recueil-6-binomes`).
7. Autres tâches de `TACHES.md` : Q1 (quiz d'Engel), E1 à E3, visuel (0.9.2), G1/G2.

## 4. Pièges et savoir-faire (conteneur de la session)

- **LaTeX** : au départ absent. `apt-get update`, puis `apt-get install -y --no-install-recommends texlive-latex-base texlive-latex-extra
  texlive-fonts-recommended texlive-science latexmk lmodern texlive-lang-french texlive-pictures texlive-plain-generic
  texlive-latex-recommended cm-super`. Les agents ont d'abord cru `pdflatex` « non installable » : vérifier soi-même.
- **Node** : 22.22.0 (Astro exige ≥ 22.23.4). Contournement : `npm install --prefix <dossier> node@22.23.4`, puis
  `PATH=<dossier>/node_modules/node/bin:$PATH npx astro build`. Le `prebuild` de `npm run build` (`fetch-app-apk`, `build-og`) a besoin du réseau.
- **`node_modules`** : après des `git worktree remove --force` sur des worktrees contenant un lien `node_modules`, le dossier principal
  avait perdu `yaml` et `rolldown` ; `npm install` règle cela, puis `git checkout package-lock.json`.
- **Fichiers générés périmés** : `public/app/v1/library.json` ancien fait échouer le test « articles de l'application » ; lancer
  `node scripts/build-index.mjs && node scripts/build-app-packs.mjs` avant `npm test`.
- **LuaLaTeX (sujets OM)** : en plus des paquets ci-dessus, `texlive-luatex texlive-pstricks texlive-science texlive-fonts-extra texlive-xetex`
  (`piton`, `luacas`, `fontawesome5`, `realscripts`). Compiler avec `latexmk -lualatex Main.tex` dans un dossier neuf (sources extraites de `sources.zip`).
- **Cache LaTeX** : `public/pdfs/manifest.json` ; un changement de hash recompile 2 500 fragments (≈ 1 h). Ne pas lancer deux builds à la fois.
- **Signature des commits** : le serveur de signature renvoie parfois 502 ; réessayer après quelques secondes, ne jamais la désactiver.
- **Agents en worktree** : leur worktree ne part pas toujours de la branche demandée (`git checkout -B <branche> <base>` au début) ;
  verrouillés, il faut `git worktree unlock` avant `remove`. Le dossier `.claude/` est exclu via `.git/info/exclude`.
- **Un agent peut ignorer « ne pas committer `node_modules` »** et un lien absolu a fini dans `main` (PR #91) : relire `git diff --stat` avant de pousser.
- **PR empilées** : ne pas supprimer la branche de base (ferme les PR dessus) ; retarget avec `update_pull_request base=main`.
- **CI** : `app.yml` ne tourne que si la PR touche `app/`, `content/`, `scripts/`, `src/…`, `tests/`, `templates/**` ; une PR `docs/**` seule n'a aucun
  contrôle. Chaque fusion sur `main` annule le déploiement en cours : regrouper.
- **GitHub** : outils `mcp__github__*` (le `gh` CLI n'est pas disponible) ; ils se déconnectent parfois, se recharger avec `ToolSearch`.

## 5. Branches distantes à nettoyer (quand plus aucune PR ne s'appuie dessus)

`arh/relecture-coquilles`, `arh/structure-cours`, `arh/cours-integration`, `arh/scripts-cours-tex`, `arh/cours-00-08-labels`,
`arh/cours-01-recurrence` … `arh/cours-07-invariants`, `arh/note-antsa`, `ccr-5dfd5175-hnso3c`. À garder tant qu'ouvertes : `arh/retire-lien-node-modules` (#95),
`arh/rapport-tests-2026-10-27` (#103).

## 6. Reprendre

```bash
git checkout main && git pull
npm install && git checkout package-lock.json
node scripts/build-index.mjs && node scripts/build-app-packs.mjs && npm test
cat docs/TACHES.md docs/RAPPORT-TESTS.md        # tâches vivantes, tests restants
```
