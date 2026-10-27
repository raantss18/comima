# Guide technique du site COMIMa

> Référence détaillée (installation, structure des dossiers, ajouter du contenu, pipeline, domaine, choix techniques).
> **Pour une vue d'ensemble simple, lire le [README](../README.md).** Les chemins ci-dessous sont relatifs à la racine du dépôt.

Site officiel du **Club Olympiade Mathématiques et Informatique de Madagascar (COMIMa)**,
association nationale présente à Antananarivo, Antsiranana, Ambositra, Ambatondrazaka et Fianarantsoa, en partenariat avec [Animath](https://www.animath.fr).

Site 100 % statique (Astro), hébergé gratuitement sur **GitHub Pages**, avec compilation
LaTeX automatique des exercices en PDF via **GitHub Actions**. Aucune base de données,
aucun service payant : tout le contenu vit dans ce dépôt Git.

**URL de production** : **`https://www.comima.mg`** (voir « Domaine comima.mg ») ;
`comima.mg` et l'ancienne adresse `https://raantss18.github.io/comima/` y redirigent.

---

## Sommaire

1. [Installation locale](#installation-locale)
2. [Structure des dossiers](#structure-des-dossiers)
3. [Ajouter un exercice](#ajouter-un-exercice)
4. [Ajouter un sujet de concours](#ajouter-un-sujet-de-concours)
5. [Ajouter un article ou un événement](#ajouter-un-article-ou-un-événement)
6. [Pipeline GitHub Actions](#pipeline-github-actions)
7. [Configurer GitHub Pages](#configurer-github-pages)
8. [Panneau d'administration](#panneau-dadministration-admin)
9. [Choix techniques](#choix-techniques)
10. [Personnalisation (logo, couleurs)](#personnalisation-logo-couleurs)
11. [Limites connues](#limites-connues)

---

## Installation locale

Prérequis : **Node.js ≥ 22.23.4** (npm inclus ; `.nvmrc` indique la version de la CI). TeX Live est optionnel en local
(les PDF sont compilés par la CI).

```bash
git clone https://github.com/raantss18/comima.git
cd comima
npm install
npm run dev        # http://localhost:4321/comima/
```

Commandes utiles :

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement (régénère d'abord les index JSON) |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Sert `dist/` en local |
| `npm run index` | Régénère `public/data/*.json` + copie les sources `.tex` dans `public/sources/` |
| `npm run latex` | Compile les PDF (nécessite `latexmk` + TeX Live ; sinon, avertit et passe) |

Pour compiler les PDF en local (facultatif) :
`sudo apt install latexmk texlive-latex-recommended texlive-lang-french texlive-fonts-recommended texlive-pictures texlive-latex-extra`
puis `npm run latex && npm run build`. Sans TeX local, le site fonctionne mais les liens
PDF renvoient 404 jusqu'au déploiement CI (un message le signale sur les pages concernées).

## Structure des dossiers

```
├── content/                  ← DONNÉES (indépendantes du code du site)
│   ├── exercices/<id>/
│   │   ├── meta.yaml         ← métadonnées (titre, thème, niveau, difficulté, source…)
│   │   ├── enonce.tex        ← corps LaTeX de l'énoncé (fragment, sans préambule)
│   │   └── solution.tex      ← solution (optionnelle)
│   ├── sujets/<id>/
│   │   ├── meta.yaml
│   │   ├── epreuve.tex       ← épreuve complète (fragment)
│   │   └── solution.tex      ← corrigé (optionnel)
│   └── cours/<id>/
│       ├── meta.yaml         ← titre, description, nb de pages…
│       ├── cours.pdf         ← chapitre PDF pré-composé (copié tel quel)…
│       └── cours.tex         ← …ou chapitre LaTeX compilé en CI (paquet .tex exporté)
├── templates/
│   ├── preamble.tex          ← préambule LaTeX commun (aussi livré dans les ZIP exportés)
│   ├── preamble-cours.tex    ← mise en page des chapitres LaTeX (A5, encadrés, compteurs)
│   └── exercice.tex          ← gabarit de compilation d'un fragment
├── scripts/
│   ├── build-index.mjs       ← meta.yaml → public/data/*.json + public/sources/
│   ├── build-latex.mjs       ← fragments .tex → public/pdfs/ (latexmk, cache par hash)
│   └── content-lib.mjs       ← lecture commune de content/
├── src/
│   ├── content/actualites/{fr,en}/*.mdx   ← articles & événements
│   ├── pages/{fr,en,admin}/  ← routes (enveloppes minces)
│   ├── views/                ← contenu réel des pages (partagé FR/EN)
│   ├── components/           ← Header, Footer, cartes, KaTeX…
│   ├── scripts/              ← générateur (pdf-lib, JSZip) et admin (Octokit), côté client
│   ├── i18n/ui.ts            ← dictionnaires FR/EN + slugs de routes
│   └── styles/global.css     ← design system (variables CSS recolorables)
├── public/                   ← servi tel quel (logo, uploads/, favicon)
│   └── {data,pdfs,sources}/  ← GÉNÉRÉS par les scripts (gitignorés)
└── .github/workflows/deploy.yml  ← pipeline unique LaTeX + Astro + Pages
```

## Ajouter un exercice

1. Créer `content/exercices/<id>/` (l'`id` = nom du dossier, en kebab-case).
2. `meta.yaml` :

   ```yaml
   id: geo-mediane-2026          # doit égaler le nom du dossier
   titre_fr: Une médiane remarquable
   titre_en: A remarkable median
   theme: [géométrie]            # algèbre | géométrie | arithmétique | combinatoire | analyse | informatique
   niveau: lycée                 # collège | lycée | prépa
   difficulte: 3                 # 1 (très facile) → 5 (très difficile)
   source: { concours: Sélection COMIMa, annee: 2026, pays: Madagascar }
   langue: fr
   tags: [médiane, triangle]
   a_solution: true              # mettre false si pas de solution.tex
   ```

3. `enonce.tex` : **uniquement le corps** (texte + maths), sans `\documentclass`
   ni `\begin{document}` — le préambule commun est dans `templates/preamble.tex`.
4. (Optionnel) `solution.tex`, même format.
5. Commit + push sur `main` : la CI compile les PDF, régénère l'index et redéploie.

Contraintes sur les fragments : rester dans le sous-ensemble LaTeX classique
(`amsmath`, `enumerate`/`itemize`, `\textbf`, `\emph`…). L'aperçu web (KaTeX) couvre ce
sous-ensemble ; TikZ et compagnie compileront en PDF mais ne s'afficheront pas dans
l'aperçu (le PDF fait foi).

## Ajouter un sujet de concours

Même logique dans `content/sujets/<id>/` avec `epreuve.tex` (et `description_fr` /
`description_en` dans le meta.yaml). Voir `content/sujets/imo-2025/` comme modèle.

## Ajouter un chapitre de cours

Un chapitre est un dossier `content/cours/<NN>-<slug>/` avec `meta.yaml` (dont `pages` et
`page_debut`, pagination continue du recueil) et **un seul** `cours.tex`, document LaTeX
complet. Structure, macros autorisées, numérotation, nommage et contrôles : voir
[`docs/STRUCTURE-COURS.md`](docs/STRUCTURE-COURS.md) (modèle : `templates/cours-modele.tex`).
Un `cours.pdf` précompilé ou un `chapitre.tex` est refusé par `loadCours()`.

`build-latex.mjs` compile chaque `cours.tex` vers `public/pdfs/cours/<id>/cours.pdf` (avec
`templates/` et `content/exercices/` dans `TEXINPUTS`, et `page_debut` injecté par
`-usepretex`) ; `build-index.mjs` publie une archive `sources.zip` (`cours.tex`, préambules,
fragments des exercices inclus) et alimente `public/data/cours-index.json` (plan, liste
ordonnée des exercices). Les énoncés et solutions restent ceux de
`content/exercices/<id>/`, sans copie. `node scripts/pagination.mjs` vérifie la pagination
continue (`--write` recalcule `page_debut`). Le recueil complet du club est servi depuis
`public/recueil-techniques-resolution-problemes.pdf`.

L'état de chaque chapitre (format, pages, solutions) et le travail restant sur le
recueil sont suivis dans [`docs/TODO.md`](docs/TODO.md), section « Recueil ».

**Illustration d'un chapitre.** Chaque page de chapitre peut afficher une illustration animée et
interactive : un module `src/scripts/cours/<id-du-chapitre>.ts` (même socle que les fiches de
l'Entraînement, `src/scripts/fiche/core.ts`), déclaré dans `src/scripts/cours/index.ts`. Sans module, la
page n'affiche rien de plus. Les illustrations laissent la découverte à l'élève (pas de réponse affichée
d'avance).

## Ajouter un article ou un événement

Créer `src/content/actualites/fr/<slug>.mdx` (et, si traduit, `en/<slug>.mdx` — le **même
slug** relie les deux langues pour le sélecteur FR/EN) :

```mdx
---
titre: "Stage de Pâques 2027"
type: evenement            # article | evenement
date: 2027-04-05
dateFin: 2027-04-09        # optionnel
lieu: "Antananarivo"               # optionnel (événement)
delegation: "…"            # optionnel (événement)
lang: fr
resume: "Une phrase de résumé affichée dans les listes."
tags: [stage]
---

Corps en Markdown/MDX…
```

L'**aperçu au partage** (WhatsApp, Facebook…) utilise la photo `image:` de l'article ;
à défaut la 1re de `photos:`, puis la 1re image du texte, sinon le logo.

Les liens et images du corps s'écrivent **sans la base** (`/fr/contact/`,
`/uploads/photo.jpg`) : le plugin `src/plugins/rehype-base.mjs` ajoute au build
`/comima` sur github.io, rien sur comima.mg. Ne jamais écrire `/comima/…` en dur.

## Accueil : actualités tirées au hasard

Les diapos 1 et 4 de l'accueil affichent, à chaque session, deux actualités **récentes
distinctes** tirées au hasard parmi les 6 dernières (`initFeed` dans `HomeView.astro`).
Le badge « Événement en cours » n'apparaît que si l'actualité tirée porte `enCours: true`.
Sans JavaScript : diapo 1 = l'actualité `enCours` (sinon la dernière), diapo 4 = la suivante.

## Photos aléatoires

Toute photo déposée dans `public/uploads/` entre automatiquement dans la photothèque
(`public/data/photos-index.json`, généré au build). La bande de photos de l'accueil, le
fond du site et les fonds des diapos « problème / principe / actualité » en tirent une
sélection **aléatoire propre à chaque session** (mélange gardé dans `sessionStorage`,
`src/scripts/photo-pool.ts`) ; la diapo d'ouverture reste liée à l'événement en cours.

## Simulations interactives

`/fr/simulations/` (`/en/simulations/`) : un index filtrable (thème, niveau) et **une page par
simulation** (`/fr/simulations/<slug>/`). 18 simulations, au moins deux par chapitre du cours
et par thème des exercices (arithmétique, combinatoire, géométrie, algèbre, analyse, informatique).

- Catalogue (titre, résumé, chapitre, thèmes, niveau, durée) : `src/lib/sims.ts`.
- Code : `src/scripts/lab/<slug>.ts` (un `LabDef`), socle commun dans `core.ts` (scène canvas,
  curseurs + champs numériques, journal d'essais, panneau « Comment c'est calculé », mode d'emploi,
  légende, indices progressifs, généralisation, bouton « Valeurs par défaut »).
- Chaque module est chargé à la demande (`src/scripts/lab/index.ts`).
- Ajouter une simulation : créer `<slug>.ts`, l'inscrire dans `lab/index.ts` et dans `sims.ts`.
- L'accueil présente une simulation tirée au hasard par session ; la page Cours renvoie vers les
  simulations de chaque chapitre ; l'ancienne adresse `/fr/laboratoire/` redirige.

## Partenaires

La liste (nom, lien, logo, catégorie, rôle, description FR/EN) est dans `src/lib/partners.ts` ;
elle alimente la page **Partenaires** (`/fr/partenaires/`, 4 catégories : le cœur, partenaires et
sponsors, appui aux encadrants, associations des centres), la section « Notre réseau » de
l'accueil, la bande de logos cliquables sous chaque page et la diapo d'ouverture.
Pour ajouter un partenaire : logo dans `public/` + une entrée dans ce fichier.

## Aperçus de partage (Facebook, WhatsApp…)

Chaque contenu partagé a **sa propre image 1200 × 630**, générée au build par
`scripts/build-og.mjs` (dans `public/og/`, non versionnée) et référencée par `og:image` :

| Contenu | Image |
| --- | --- |
| Simulation | illustration dédiée (`scripts/og-art.mjs`) + titre + chapitre |
| Exercice, chapitre de cours, sujet | première page du PDF compilé (`pdftoppm`) + titre |
| Actualité | la photo de l'article (recadrée) + titre |
| Pages (accueil, cours, partenaires…) | photo ou composition de marque |

Les images sont régénérées seulement si leur contenu change (manifeste de hash ; `public/og/` est
dans le cache de la CI). Changer la mise en page : incrémenter `VERSION` dans `build-og.mjs`.
Pour ajouter l'illustration d'une nouvelle simulation : une fonction dans `og-art.mjs` portant son slug.
Facebook garde les aperçus en cache : après une correction, coller le lien dans le
[Débogueur de partage](https://developers.facebook.com/tools/debug/) et cliquer « Scrape Again ».

## Partage

Chaque article, exercice, chapitre de cours et sujet a des boutons de partage
(`src/components/ShareButtons.astro`) : menu natif du téléphone (Web Share API),
WhatsApp, Facebook, Telegram, X, e-mail et copie du lien ; le pied de page partage
le site. Aucun service tiers n'est chargé (pas de pistage).

## Sécurité et maintenance

- Dépendances à jour (`npm audit` : 0 vulnérabilité) ; Dependabot ouvre chaque
  semaine les PR de mise à jour (npm + GitHub Actions) ; le workflow lance
  `npm audit --omit=dev` et signale toute alerte.
- Politique de sécurité de contenu (CSP) et `referrer` posés en `<meta>` dans
  `Base.astro` (GitHub Pages n'autorise pas d'en-têtes HTTP) : aucune ressource
  tierce, connexions limitées à `api.github.com` (admin) et à l'Apps Script des
  compteurs. Si un jour un nouveau service est ajouté, l'autoriser dans cette CSP.
- Liens externes des articles en `rel="noopener noreferrer"`, images en
  chargement différé.
- Node ≥ 22.23.4 requis (CI en Node 24, voir `.nvmrc`).

## Pipeline GitHub Actions

Un **workflow unique** (`.github/workflows/deploy.yml`) s'exécute à chaque push sur
`main` (et manuellement via *workflow_dispatch*) :

1. **TeX Live minimal** installé par `teatimeguest/setup-texlive-action` (auto-caché).
2. **Compilation LaTeX incrémentale** : `scripts/build-latex.mjs` enveloppe chaque
   fragment dans `templates/exercice.tex` et le compile avec `latexmk`. Un manifest de
   hashes (`public/pdfs/manifest.json`, mis en cache par `actions/cache`) fait que **seuls
   les fichiers modifiés sont recompilés**.
3. **Index JSON** : `scripts/build-index.mjs` (via le hook `prebuild`) produit
   `public/data/exercices-index.json` et `sujets-index.json`, consommés par les pages et
   par le générateur côté client.
4. **Build Astro** puis **publication sur la branche `gh-pages`**
   (`peaceiris/actions-gh-pages`). La création de cette branche active GitHub Pages
   automatiquement — aucun réglage manuel requis (voir « Choix techniques »).

Une compilation LaTeX qui échoue **fait échouer le build** (le log d'erreur TeX est
affiché dans la sortie du job) : le site en production n'est jamais remplacé par une
version cassée.

## Configurer GitHub Pages

Le dépôt doit être **public** (GitHub Pages est payant sur les dépôts privés).
Il n'y a rien d'autre à configurer : au premier push sur `main`, le workflow crée la
branche `gh-pages`, ce qui active Pages automatiquement (source : branche `gh-pages`).
Le site sort sur `https://<owner>.github.io/comima/`.

En cas de doute, vérifier dans **Settings → Pages** que la source est bien
« Deploy from a branch : `gh-pages` / (root) ».

## Domaine comima.mg

Le site est publié sur **`www.comima.mg`** : c'est la valeur par défaut inscrite
dans `.github/workflows/deploy.yml` (build avec `SITE_URL=https://www.comima.mg`,
`BASE_PATH=/`, et publication du fichier `CNAME`). C'est ce fichier `CNAME` qui
indique à GitHub Pages que ce domaine appartient à **ce** dépôt. La variable de
dépôt `CUSTOM_DOMAIN` (Settings → Secrets and variables → Actions), si elle est
définie, remplace ce domaine.

1. **DNS chez le registrar (tranokala)** — serveurs de noms `dns1.tranokala.mg` /
   `dns2.tranokala.mg`, et la zone `comima.mg` (menu « Manage DNS ») doit contenir :

   | Nom | Type | Valeur |
   |-----|------|--------|
   | `@` | A | `185.199.108.153` |
   | `@` | A | `185.199.109.153` |
   | `@` | A | `185.199.110.153` |
   | `@` | A | `185.199.111.153` |
   | `www` | CNAME | `raantss18.github.io.` |

   (IPv6 facultatif : AAAA `2606:50c0:8000::153` … `2606:50c0:8003::153`.)
2. **Bascule** : le premier déploiement qui contient ce workflow publie le site
   sur le domaine. Ne le fusionner qu'une fois le DNS propagé (`dig +short
   comima.mg` affiche les 4 adresses ci-dessus).
3. **HTTPS** : dans Settings → Pages, cocher « Enforce HTTPS » dès que GitHub a
   émis le certificat (quelques minutes à 24 h).

Ne pas basculer avant que le DNS réponde : github.io redirigerait vers un domaine
injoignable. En local, `SITE_URL=https://comima.mg BASE_PATH=/ npm run build`
reproduit le build du domaine.

## Panneau d'administration (`/admin`)

`https://www.comima.mg/admin/` — non indexé (`noindex`), sans serveur. **L'accès est réservé** aux administrateurs :

1. **Connexion** avec le même compte que l'application (Google ou e-mail).
2. L'adresse du compte doit figurer dans `public/admins.json` (**empreintes salées**, aucun e-mail publié ; la liste en clair
   est dans `release-keys/admins.txt`, hors Git ; `node scripts/admins.mjs` la met à jour).
3. Le compte doit avoir le rôle **`admin`** sur le serveur (`node scripts/admins.mjs --sql`, à coller dans Supabase).

Liste introuvable : accès fermé. Liste vide : ouvert avec avertissement (pas encore configuré). Une fois ouvert, le panneau
publie par l'API GitHub (Octokit) avec un *Personal Access Token* collé par l'administrateur, gardé dans le `localStorage` et
transmis **uniquement à `api.github.com`**. Chaque action = un commit sur `main` (le pipeline se relance, 2 à 5 minutes).
La garde réserve l'écran ; la vraie clé d'écriture reste le jeton GitHub (token *fine-grained*, ce seul dépôt, *Contents :
Read and write*, expiration courte, « Oublier le jeton » sur un poste partagé).

## Choix techniques

| Décision | Choix | Pourquoi |
| --- | --- | --- |
| i18n | **i18n natif Astro** (dossiers `src/pages/fr/` et `src/pages/en/`, vues partagées dans `src/views/`) | `astro-i18next` n'est plus maintenu ; le natif donne des slugs traduits (`/fr/ressources/` ↔ `/en/resources/`) sans dépendance. FR = langue par défaut, `/` redirige selon la langue du navigateur (fallback FR). |
| Déploiement Pages | `peaceiris/actions-gh-pages` (branche `gh-pages`) plutôt que `actions/deploy-pages` (artefact) | La méthode « artefact » exige d'activer Pages à la main dans les réglages (l'activation par API est refusée au token du workflow) ; la branche `gh-pages` active Pages automatiquement → mise en ligne 100 % automatisée. |
| TeX en CI | `teatimeguest/setup-texlive-action` plutôt qu'une image Docker complète | Installe ~15 paquets au lieu de 4 Go, cache intégré, ~1 min par build à chaud. |
| Incrémentalité LaTeX | Manifest de hashes + `actions/cache` sur `public/pdfs/` | Ne recompile que les `.tex` modifiés ; purge les PDF orphelins. |
| Aperçu web des énoncés | Mini-convertisseur LaTeX→HTML maison (`src/lib/latex.ts`) + **KaTeX auto-render** | KaTeX ne rend que les maths ; le convertisseur gère listes/gras/paragraphes du sous-ensemble utilisé. Le PDF compilé reste la référence. |
| Fragments `.tex` | Corps seuls, préambule factorisé dans `templates/preamble.tex` | Compilables individuellement (CI), inclus tels quels dans les ZIP exportés, et prévisualisables par KaTeX. |
| Données exercices | `meta.yaml` + index JSON généré au build | Exigence du cahier des charges ; l'index sert à la fois au rendu statique et au générateur client. |
| Difficulté | Entier 1–5 affiché en étoiles (libellés « Très facile » → « Très difficile ») | Plus lisible que Bronze/Or pour des élèves ; trivial à changer dans `src/i18n/ui.ts`. |
| Générateur | 100 % navigateur : `pdf-lib` (fusion + page de garde dynamique avec logo), `JSZip` (paquet `.tex` + `sujet.tex` maître) | Aucune requête hors du site ; les PDF fusionnés sont ceux déjà compilés par la CI. |
| Polices | Inter + Source Serif 4 auto-hébergées (`@fontsource`) | Zéro requête externe (perf + vie privée), licences OFL. |
| Thème | Variables CSS + `data-theme` sur `<html>`, préférence `prefers-color-scheme`, persistance `localStorage` | Exigence du cahier des charges ; script inline anti-flash dans `<head>`. |

## Personnalisation (logo, couleurs)

- **Logo** : remplacer `public/logo.png` (utilisé partout : header, hero, page de garde
  des PDF exportés, OpenGraph). `public/logo-placeholder.svg` est un fallback vectoriel.
  Le favicon est `public/favicon.svg`.
- **Couleurs** : tout est dans les premières lignes de `src/styles/global.css`
  (`--c-primary`, `--c-accent`, etc., avec leurs variantes sombres) et, pour les PDF,
  dans `templates/preamble.tex` (`comimagreen`, `comimared`) et la page de garde du
  générateur (`src/scripts/generateur.ts`).

## Limites connues

- **Token admin** : voir la section sécurité ci-dessus — c'est la contrainte assumée
  d'un CMS sans backend. Alternative gratuite non retenue : Decap CMS exige un service
  OAuth externe, incompatible « zéro serveur ».
- **Aperçu KaTeX approximatif** : figures (TikZ), tableaux et macros exotiques ne
  s'affichent pas dans l'aperçu web (le PDF, lui, est complet).
- **PDF absents en dev local sans TeX** : les liens de téléchargement renvoient 404
  tant que la CI n'a pas tourné (message affiché sur les pages).
- **robots.txt** : généré par `src/pages/robots.txt.ts` selon la base. Sur github.io
  (`/comima/`), celui à la racine du domaine n'est pas contrôlable et la
  non-indexation de `/admin` repose sur la balise `meta noindex` + l'exclusion du
  sitemap ; sur comima.mg, il est servi à la racine et s'applique.
- **Uploads** : l'API GitHub limite les fichiers à ~20 Mo ; pour des vidéos lourdes,
  préférer un lien YouTube/PeerTube dans l'article.

## Licence

Code du site sous licence MIT. Énoncés IMO © IMO (imo-official.org), reproduits à des
fins pédagogiques. Les exercices originaux du club sont librement réutilisables à des
fins pédagogiques non commerciales.
