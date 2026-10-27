# Campagne de lancement — application COMIMa 1.1

> Préparée le 27 oct. 2026. **Rien n'est publié** : Antsa relit, ajuste, puis publie depuis la page du club.
> Une vidéo de 36 secondes (9:16, sous-titrée, sans voix), 3 posts Facebook, 2 posts LinkedIn, sur 6 jours.

## 1. L'idée, en une phrase

**Une conjecture qui a l'air vraie pendant 40 essais, puis tombe : voilà ce que l'application te fait vivre en 30 secondes.**
Tout part d'un vrai moment de l'application : l'illustration « n² + n + 41 est premier » de la fiche *Exemples et contre-exemples*.
Elle donne 40 nombres premiers de suite (n = 0 à 39), puis 40² + 40 + 41 = 1681 = 41². C'est de la vraie olympiade, ça se voit
sans explication, et ça se filme sans rien inventer.

## 2. Pour qui, où

| Canal | Qui on veut toucher | Ce qu'on veut qu'ils fassent |
| --- | --- | --- |
| **Facebook** (la page COMIMa) | élèves, parents, encadreurs des 5 centres (Antananarivo, Antsiranana, Ambositra, Ambatondrazaka, Fianarantsoa) | installer l'application, partager à un camarade ou à un professeur |
| **LinkedIn** | enseignants, universités, partenaires et mécènes, diaspora, développeurs curieux | nous écrire pour un retour concret ou un partenariat ; lire le code |

Facebook parle à celui qui s'entraîne ; LinkedIn parle à celui qui peut aider. Même vidéo, deux textes différents.

## 3. Ce qu'on a le droit de dire (tout est vérifiable)

| Affirmation | Vérification |
| --- | --- |
| Gratuite, pour Android | page `/fr/application/`, aucune offre payante |
| **11 Mo** | APK arm64 de la 1.1.0 : 11,2 Mo |
| **Marche sans connexion** | contenus dans l'APK ; testé en mode avion (c'est dans la vidéo) |
| **Correction à l'instant**, formes équivalentes acceptées | moteur de correction (Rust), page d'entraînement du site |
| **123 questions** corrigées automatiquement (sur 127), 12 notions | paquets de l'application, `app/assets/content/packs/` ; la règle est `ProgressStore.autoGraded` |
| **1 356 exercices** de recueil, **9 chapitres** de cours | `library.json` de l'application |
| Un **défi de 3 minutes** | écran Défi |
| Un **interpréteur Python** (courbes comprises) | écran Python |
| **Compte facultatif** ; avec un compte, la progression suit d'un téléphone à l'autre | 0.5 et suivantes |
| Code **ouvert** (licence MIT) | dépôt public `raantss18/comima`, `README.md` |
| Le moteur de correction est **commun au site et à l'application** | `app/native/`, `engine.wasm` du site |

**À ne pas écrire** : un nombre d'utilisateurs ou de téléchargements (trop peu pour que ça serve), un témoignage (aucun n'existe),
« 1 356 exercices corrigés » (seuls 32 ont une solution rédigée dans l'application), « disponible sur iPhone » (Android seulement),
« tableau de bord encadreur » (pas encore). Les groupes (un encadreur crée un groupe, les élèves le rejoignent avec un code) existent.

## 4. Éviter l'effet « texte écrit par une IA »

Ce qui trahit un texte générique, et ce qu'on fait à la place :

| On évite | On fait |
| --- | --- |
| « Découvrez », « plongez dans », « révolutionnez », « boostez », « débloquez votre potentiel » | une scène précise (n = 40, 1681 = 41²) |
| des adjectifs sans preuve (« innovant », « incroyable », « complet ») | un chiffre (11 Mo, 123 questions, 3 minutes) |
| la série de trois qualités « simple, rapide et efficace » | une seule idée par post |
| une pluie d'emojis, des puces à emojis, 10 hashtags | zéro emoji sur Facebook ; 3 hashtags au plus sur LinkedIn |
| « Que vous soyez élève, parent ou enseignant… » | parler à une seule personne à la fois |
| une chute morale (« Et vous, êtes-vous prêt ? ») | une vraie question de maths à laquelle on peut répondre |
| des tirets longs et des antithèses partout (« pas X, mais Y ») | des phrases de longueurs inégales, comme on parle |

Test avant de publier : **lire le post à voix haute à un élève.** S'il sonne comme une publicité de banque, on réécrit.

## 5. La vidéo : `comima-demo.mp4` (36 s, 1080 × 1920)

Écrans **réels** de l'application 1.1.0 filmés sur émulateur Android (profil « Champion », aucun vrai nom), sous-titres en français, sans voix ni musique (la plupart des gens regardent sans le son).

| Temps | Plan | Texte à l'écran |
| --- | --- | --- |
| 0–10 s | l'illustration défile de n = 6 à n = 51 ; les nombres deviennent rouges à partir de 40 | « n² + n + 41 est premier pour n = 0, 1, 2… » → « On teste. Encore un. Encore un. » → « n = 40 : 1681 = 41². Un seul contre-exemple suffit. » |
| 10–16 s | la question de la fiche, réponse « 40 », « Bonne réponse » et l'explication | « Question suivante : le plus petit n qui casse ? » → « Bonne réponse. L'explication arrive tout de suite. » |
| 16–22 s | le Défi : trois bonnes cases cochées, le score passe à 1 | « Le défi : 3 minutes, un maximum de bonnes réponses. » |
| 22–27 s | l'interpréteur Python trace y = x² | « Du Python, sur le téléphone. Courbes comprises. » |
| 27–33 s | mode avion activé (l'icône est visible), la bibliothèque défile | « Pas de réseau ? Rien ne change. » |
| 33–36 s | logo | « Gratuite. Hors ligne. 11 Mo. » et `comima.mg/fr/application` |

Les fichiers : `comima-demo.mp4` (à publier), `miniature.png` (image d'aperçu : l'instant où 40 devient rouge). Ils ne sont **pas** dans Git
(trop lourds, et ils se refont en une commande à partir de l'émulateur) ; Antsa les reçoit avec ce document.

## 6. Les posts

### Facebook

**Jour 1 — avec la vidéo**

> n² + n + 41 est un nombre premier pour n = 0, 1, 2… et ainsi de suite jusqu'à 39. Quarante nombres premiers de suite, ça ressemble à une loi.
>
> Pour n = 40, on obtient 1681. C'est 41 × 41.
>
> Un seul contre-exemple et la « loi » tombe. C'est le premier réflexe qu'on apprend en olympiade, et c'est la première fiche de l'application COMIMa.
>
> Elle est gratuite, pèse 11 Mo et marche sans connexion : des fiches, des questions corrigées à l'instant, un défi de 3 minutes et un petit interpréteur Python. Pour Android : comima.mg/fr/application
>
> À quel n est-ce que vous auriez arrêté de tester ?

**Jour 3 — une question, sans la réponse**

> Dans un triangle qui n'est pas équilatéral, quels points sont toujours sur la droite d'Euler ?
> A. le centre de gravité
> B. l'orthocentre
> C. le centre du cercle circonscrit
> D. le centre du cercle inscrit
>
> Plusieurs réponses sont justes. On donne la solution demain dans les commentaires.
>
> Une question de ce genre tombe à chaque partie du défi de 3 minutes de l'application COMIMa : comima.mg/fr/application

*Réponse à poster en commentaire le jour 4 : A, B et C (le centre du cercle inscrit n'y est que si le triangle est isocèle). Répondre aux premiers commentaires, justes ou faux, sans corriger sèchement.*

**Jour 6 — pour les encadreurs et les professeurs**

> Vous préparez des élèves aux olympiades ? Trois choses que l'application fait déjà :
>
> Un cours, un exercice ou un sujet ouvert est marqué « lu » tout seul. L'entraînement au hasard peut se limiter à ce que l'élève a lu.
> Un encadreur crée un groupe, les élèves le rejoignent avec un code.
> Tout marche sans connexion, donc aussi en dehors du centre.
>
> Si une chose vous manque, écrivez-nous en commentaire ou sur comima.mg/fr/contact : on la note dans la liste de ce qu'on construit.

### LinkedIn

**Jour 1 — avec la vidéo**

> Pour préparer les olympiades, on donne souvent à l'élève un PDF et un conseil : « entraîne-toi ».
>
> Avec COMIMa (Club Olympiade Mathématiques et Informatique de Madagascar), nous avons essayé autre chose : une application Android de 11 Mo qui marche sans connexion et corrige chaque réponse à l'instant, y compris quand l'élève écrit une forme équivalente de l'expression attendue.
>
> Dedans : 123 questions corrigées automatiquement, 1 356 exercices de recueil, 9 chapitres de cours, un défi de 3 minutes, un interpréteur Python. Aucun compte requis ; avec un compte, la progression suit l'élève d'un téléphone à l'autre.
>
> Le moteur de correction est écrit en Rust et partagé avec le site. Le code est ouvert (MIT) : github.com/raantss18/comima
>
> Si vous enseignez, encadrez ou financez la formation de jeunes en maths et en informatique, nous cherchons des retours concrets plutôt que des compliments : comima.mg/fr/contact
>
> #Olympiades #Mathématiques #Madagascar

**Jour 4 — pourquoi cette première fiche**

> Notre première fiche d'entraînement n'est pas un théorème. C'est une conjecture fausse : n² + n + 41 est premier pour n de 0 à 39, puis 40² + 40 + 41 = 41².
>
> On l'a choisie parce qu'elle enseigne ce qu'un élève de lycée comprend le plus tard : tester quarante fois ne prouve rien, un seul contre-exemple suffit.
>
> L'élève fait défiler les valeurs, voit le premier nombre rouge, puis répond à une question dont la réponse est ce 40. Tout le cours est construit comme ça : une scène, une règle, des questions.
>
> Application gratuite, hors ligne, 11 Mo : comima.mg/fr/application
>
> #Mathématiques #Olympiades

## 7. Calendrier (6 jours, 5 posts)

| Jour | Facebook | LinkedIn |
| --- | --- | --- |
| J1 (en soirée, après les cours) | post 1 + vidéo | post 1 + vidéo |
| J3 | question du triangle | |
| J4 | réponse en commentaire | post 2 |
| J6 | post pour les encadreurs | |

Après J6, on s'arrête : un autre contenu seulement s'il y a quelque chose de nouveau à dire (une nouvelle version, un nouveau centre).

## 8. Mesurer sans se raconter d'histoires

- **Comptes créés et versions** : `supabase/stats.sql` (le nombre de comptes avant J1, puis à J7 ; la colonne « version » montre qui a installé la 1.1.0).
- **Téléchargements** : le compteur de la release GitHub (`gh release view app-v1.1.0`), en sachant que nos propres tests y comptent aussi.
- **Partages et commentaires** : à lire dans Facebook et LinkedIn, pas à convertir en pourcentage.
- Un seul succès compte : **des élèves qui répondent à des questions** (réponses reçues dans `comima.attempts`).

## 9. Avant de publier (Antsa)

- [ ] Relire chaque post à voix haute ; remplacer toute phrase qui ne ressemble pas au club.
- [ ] Vérifier que le lien `comima.mg/fr/application` ouvre bien la dernière version.
- [ ] Publier la vidéo en **natif** (la téléverser sur Facebook et LinkedIn, pas un lien YouTube).
- [ ] Mettre la miniature ; activer les sous-titres (ils sont déjà dans l'image).
- [ ] Prévoir quelqu'un pour répondre aux commentaires dans l'heure suivant la publication.
