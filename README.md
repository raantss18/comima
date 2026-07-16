# Site web COMIMa

Site officiel du **Club Olympiade Mathématiques et Informatique de Madagascar (COMIMa)**,
association nationale présente à Antananarivo, Antsiranana et Ambositra, en partenariat avec [Animath](https://www.animath.fr).

Site 100 % statique (Astro), hébergé gratuitement sur **GitHub Pages**, avec compilation
LaTeX automatique des exercices en PDF via **GitHub Actions**. Aucune base de données,
aucun service payant : tout le contenu vit dans ce dépôt Git.

**URL de production** : `https://raantss18.github.io/comima/`

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

Prérequis : **Node.js ≥ 20** (npm inclus). TeX Live est optionnel en local
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
`sudo apt install latexmk texlive-latex-recommended texlive-lang-french texlive-fonts-recommended`
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
│       └── cours.pdf         ← chapitre PDF pré-composé (copié tel quel)
├── templates/
│   ├── preamble.tex          ← préambule LaTeX commun (aussi livré dans les ZIP exportés)
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

Les cours sont des **PDF pré-composés** (pas de compilation en CI) : créer
`content/cours/<id>/` avec `meta.yaml` (`id`, `numero`, `titre_fr`, `titre_en`,
`description_fr`, `description_en`, `pages`, `source`, `tags`) et `cours.pdf`.
`build-index.mjs` les copie vers `public/pdfs/cours/` et alimente
`public/data/cours-index.json`. Le recueil complet du club est servi depuis
`public/recueil-techniques-resolution-problemes.pdf`.

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

Attention : les liens internes dans le corps doivent inclure la base du site
(`/comima/fr/...`), car GitHub Pages sert le site sous un sous-chemin.

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

Si le dépôt est renommé ou passe sur un domaine personnalisé, ajuster `SITE_URL` /
`BASE_PATH` (variables d'environnement lues par `astro.config.mjs` ; par défaut
`https://raantss18.github.io` + `/comima`). Pour un domaine à la racine, mettre
`BASE_PATH=/`.

## Panneau d'administration (`/admin`)

`https://…/comima/admin/` — non indexé (`noindex`), sans backend :

- **Authentification** : coller un *Personal Access Token* GitHub. Il est stocké
  **uniquement dans le `localStorage` du navigateur** et transmis **uniquement à
  `api.github.com`** (Octokit.js).
- **Fonctions** : publier un article/événement (MDX), créer un exercice
  (`meta.yaml` + `enonce.tex` + `solution.tex`), téléverser un média dans
  `public/uploads/`. Chaque action = un commit sur `main`, qui déclenche le pipeline
  complet (compilation LaTeX incluse). Le site est à jour 2 à 5 minutes plus tard.
- **Choix documenté** : commit **direct sur `main`** (pas de PR) pour rester simple pour
  des non-développeurs. Pour un flux avec relecture, changer le champ « Branche » du
  panneau vers une branche de travail et ouvrir les PR à la main.

### Sécurité du token — à lire

- Utiliser un token **fine-grained** limité à CE dépôt, permission *Contents : Read and
  write* uniquement, avec expiration courte.
- Un token en `localStorage` est lisible par tout script s'exécutant sur la page ; le
  site n'embarque aucun script tiers, mais ne collez le token que sur un appareil de
  confiance et utilisez « Oublier le jeton » sur un poste partagé.
- Ne jamais utiliser de token classique à portée `repo` globale.

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
- **robots.txt** : sur un site de projet GitHub Pages (`/comima/`), le `robots.txt` à la
  racine du domaine n'est pas contrôlable ; la non-indexation de `/admin` repose sur la
  balise `meta noindex` (efficace) + exclusion du sitemap.
- **Uploads** : l'API GitHub limite les fichiers à ~20 Mo ; pour des vidéos lourdes,
  préférer un lien YouTube/PeerTube dans l'article.
- **E-mail de contact** : placeholder à remplacer dans `src/views/ContactView.astro`.

## Licence

Code du site sous licence MIT. Énoncés IMO © IMO (imo-official.org), reproduits à des
fins pédagogiques. Les exercices originaux du club sont librement réutilisables à des
fins pédagogiques non commerciales.
