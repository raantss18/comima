# Banque de questions de l'application

Une **notion** par fichier : `content/app/notions/<id>.yaml` (l'`id` = nom du fichier).
`npm run app-packs` (et la CI) valide tout et publie les paquets dans `public/app/`.
Une erreur de format **fait échouer le build** avec un message précis (fichier, question, champ).
Conception complète : `docs/app/CONCEPTION.md`.

## Fiche de notion

```yaml
id: recurrence-sommes
theme: algèbre        # algèbre | géométrie | arithmétique | combinatoire | analyse | informatique
niveau: 2             # 1 → 10
chapitre: 01-recurrence   # optionnel : lien vers le cours du site
titre: { fr: …, en: … }
fiche: { fr: "Markdown + $LaTeX$", en: … }
questions: [ … ]
```

## Champs communs d'une question

| Champ | Obligatoire | Sens |
| --- | --- | --- |
| `id` | oui | unique dans toute la banque (préfixe de la notion conseillé) |
| `type` | oui | voir ci-dessous |
| `difficulte` | oui | 1 → 5 (les étapes sont formées par difficulté croissante) |
| `enonce` | oui | `{ fr, en }`, Markdown + LaTeX |
| `explication` | oui | `{ fr, en }`, affichée après la réponse |
| `indice` | non | `{ fr, en }` |
| `temps` | non | durée conseillée en secondes |

## Types et champs de réponse

| `type` | Champs | Exemple |
| --- | --- | --- |
| `qcm` | `choix` (liste de `{fr,en}`), `bonnes` (indices à partir de 0) | `bonnes: [1, 3]` |
| `vrai-faux` | `reponse: true / false` | |
| `numeric` | `reponse` exact (`"55"`, `"-3/4"`, `"0.125"`) **ou** décimal + `tolerance` | `reponse: 3.1416`, `tolerance: 0.001` |
| `expression` | `reponse` (syntaxe : `+ - * / ^ ( )`, `sqrt()`), `variables` | `reponse: "n*(n+1)/2"`, `variables: [n]` |
| `ensemble` | `reponse` : liste (ordre ignoré) | `[1, 2, 3, 4, 6, 12]` |
| `n-uplet` | `reponse` : liste (ordre respecté) | `[9, 2]` |
| `intervalle` | `reponse` : notation française `[a; b[`, `]-inf; 2]` | `"[1; +inf["` |
| `ordre` | `etapes` (dans un ordre correct), `dependances` (paires `[i, j]` : *i* avant *j* ; sans elles l'ordre donné est le seul accepté), `intrus` (étapes fausses à écarter) | |
| `trous` | `texte` avec `{{1}}`, `{{2}}`… ; `trous` : liste de `{ type, reponse, choix? }` | |
| `code` | `langage: pseudo | python`, `fonction`, `squelette` (`{fr,en}`), `tests` et `tests_caches` : listes de `{ entree: [...], sortie }` ; en Python, `reference` : une solution complète (jamais publiée) que `cargo test` passe contre les tests. **Corrigé automatiquement en Python** (sous-ensemble : `def`, boucles, listes, chaînes, compréhensions…) ; pseudo-code : pas encore | |
| `simulation` | `simulation` (slug d'une simulation du site), `cible` (ce que la réponse doit produire) | |
| `preuve` | `elements_attendus` (`{fr,en}`), `bareme` (points) — **validée par un encadreur** | |

## Illustration de la fiche (site)

Une notion peut avoir une illustration **animée et interactive** sous sa fiche, sur la page
Entraînement du site : un module `src/scripts/fiche/<id-de-la-notion>.ts` exportant `figure`
(taille, description pour lecteurs d'écran, `draw(fig)`), déclaré dans `src/scripts/fiche/index.ts`.
Le socle (`fiche/core.ts`) fournit le cadre SVG, les curseurs/boutons, la phrase d'état et des
animations qui respectent « réduire les animations ». Sans module, la page n'affiche rien de plus.
Dans l'application, les mêmes figures sont empaquetées en pages HTML autonomes
(`scripts/build-app-figures.mjs`, lancé par `app/tool/build_apk.sh`) et affichées hors ligne dans une
WebView (`app/lib/ui/figure_view.dart`) : elles n'arrivent donc qu'avec une nouvelle version de l'APK,
pas avec la mise à jour des paquets de questions.

Conseils : une question = une seule chose à trouver ; l'explication montre **la méthode**, pas
seulement le résultat ; préférer `expression` / `numeric` / `ensemble` au QCM dès que possible.
