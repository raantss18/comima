# TODO COMIMa — contenus du site

Mis à jour à chaque envoi de fichiers/actualités. Cocher = en ligne sur www.comima.mg.

## Événement en cours (accueil)
La diapo 1 de l'accueil affiche l'actualité marquée `enCours: true` (la plus récente),
sinon la dernière actualité. Pour changer d'événement : mettre `enCours: true` (+ `photos: [...]`)
dans le nouvel article FR et EN, et retirer le drapeau de l'ancien.

- [x] Regroupements 2026-2027 : Antsiranana (9 oct. 2026) — lancement
- [x] Ambatondrazaka (17 oct. 2026) : séance d'information des enseignants
- [x] Fianarantsoa (24 oct. 2026) : premier regroupement
- [x] Ambatondrazaka (24 oct. 2026) : premier regroupement — `enCours: true`

## Articles à mettre en ligne
- [ ] Lancement des regroupements à Antananarivo (en attente d'infos + photos)
- [ ] Lancement des regroupements à Ambositra (en attente d'infos + photos)

## Articles à reprendre / remplacer
- [ ] `camp-olympiade-juillet-2026` : annonce du camp, passée — ajouter un lien vers la clôture si utile
- [ ] Antsiranana (9 oct.) : ajouter nom de l'encadrant / du lycée et le rythme des séances si fournis

## Ressources (exercices, sujets, cours)
- [ ] Aucune en attente

## Divers
- [ ] Encadrants à lister sur la page Contact : Ambatondrazaka, Fianarantsoa, Antananarivo (noms + rôle)
- [ ] Liste des centres : `src/lib/centres.ts` (ajouter une ligne à l'ouverture d'un centre)
- [x] Logos Fianarako et Campus France (accueil)
- [ ] Remplacer l'e-mail de contact placeholder dans `src/views/ContactView.astro`

## Fait : partage, sources LaTeX, sécurité (oct. 2026)
- [x] Boutons de partage (articles, ressources, cours, sujets, site)
- [x] `.tex` + `sources.zip` compilable pour chaque chapitre de cours
- [x] Astro 7, dépendances à jour (0 vulnérabilité), CSP, Dependabot
- [x] Bande de logos partenaires (Animath, Fianarako, Campus France, AEMIA) sous chaque page ; source unique `src/lib/partners.ts`
- [x] Partenaires Mahkinga (Antsiranana) et iMatematiko (Fianarantsoa) : logos, À propos, articles
