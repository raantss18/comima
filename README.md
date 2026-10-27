# COMIMa — site et application

**COMIMa** (Club Olympiade Mathématiques et Informatique de Madagascar) prépare les jeunes Malagasy aux
olympiades de mathématiques et d'informatique. Ce dépôt contient **tout** : le site, l'application Android et le contenu.

| | |
| --- | --- |
| 🌐 **Site** | <https://www.comima.mg> (français et anglais) |
| 📱 **Application Android** | <https://www.comima.mg/fr/application/> (gratuite, fonctionne hors ligne) |
| 📋 **Qui fait quoi, où on en est** | [`docs/TACHES.md`](docs/TACHES.md) |

## Ce que contient le dépôt

| Dossier | Quoi | Technique |
| --- | --- | --- |
| `src/`, `public/` | le **site** : cours, exercices, sujets, actualités, entraînement, espace personnel, simulations | Astro (site statique), GitHub Pages |
| `app/` | l'**application** : accueil, entraînement, défi chronométré, bibliothèque, actualités, interpréteur Python, profil et compte | Flutter + moteur Rust (`app/native/`) |
| `content/` | le **contenu** : exercices, sujets, cours (LaTeX), questions d'entraînement | YAML + LaTeX |
| `supabase/` | les **comptes** et la synchronisation (migrations, tests d'accès, `stats.sql`) | Supabase (PostgreSQL) |
| `scripts/`, `templates/` | la chaîne de fabrication (index, PDF, paquets de l'application) | Node.js, LaTeX |
| `docs/` | les consignes, les todos, les guides | Markdown |

Le site et l'application montrent **le même contenu** : ce qui est ajouté dans `content/` apparaît sur les deux, sans nouvelle version.

## Démarrer

```bash
git clone https://github.com/raantss18/comima.git && cd comima
npm install
npm run dev          # le site sur http://localhost:4321/comima/
npm test             # les tests du site (à passer avant toute PR)
```

L'application (Flutter) : `cd app && flutter pub get && flutter run`. Les APK de test : `bash app/tool/build_apk.sh`.
Le moteur de correction : `cd app/native && cargo test`. Prérequis : Node ≥ 22.23.4 (voir `.nvmrc`).

## Je veux…

| …faire ceci | Lire |
| --- | --- |
| ajouter un exercice, un sujet, un cours, un article | [`docs/CONTENU.md`](docs/CONTENU.md) et [`docs/GUIDE-TECHNIQUE.md`](docs/GUIDE-TECHNIQUE.md) |
| comprendre la structure d'un chapitre de cours | [`docs/STRUCTURE-COURS.md`](docs/STRUCTURE-COURS.md) |
| tester l'application (liste de contrôle, émulateur) | [`docs/RAPPORT-TESTS.md`](docs/RAPPORT-TESTS.md) |
| publier une nouvelle version de l'application | [`app/RELEASING.md`](app/RELEASING.md) (réservé à Antsa) |
| configurer les comptes (Supabase) | [`supabase/README.md`](supabase/README.md) |
| voir les statistiques d'usage | [`supabase/stats.sql`](supabase/stats.sql) (à coller dans le SQL Editor) |
| connaître les règles de travail à deux (Antsa, ARHeritiana) | [`docs/REPARTITION.md`](docs/REPARTITION.md) et [`CLAUDE.md`](CLAUDE.md) |

## Comment ça se publie

- **Le site** : chaque fusion sur `main` lance le déploiement (PDF LaTeX, index, build Astro, GitHub Pages) ; le site est à jour 5 à 15 minutes plus tard.
- **Le contenu** (`content/`, actualités, docs) : ARHeritiana le fusionne seul quand les trois contrôles (`check`, `web`, `supabase`) sont verts.
- **Le code, le serveur, les versions de l'application** : Antsa. Une PR qui touche ces chemins demande sa relecture.
- **L'application** : une version = un APK signé sur GitHub Releases ; l'application se met à jour d'elle-même. Les messages de mise à jour disent simplement **ce que la version permet de faire**.

## Comptes, données et sécurité

- Un **compte est facultatif** : sans compte, tout fonctionne et reste sur l'appareil. Avec un compte (Google ou e-mail), la progression suit l'élève d'un appareil à l'autre.
- Le serveur reçoit : le profil (prénom, année de naissance, établissement, région, centre), les réponses, ce qui a été lu (cours, exercices, sujets) et la version de l'application. **Jamais la position**, jamais rien de publié.
- **La localisation est celle déclarée dans le profil** (région, centre), jamais déduite de la langue ou de l'adresse IP.
- La page **`/admin`** est réservée : connexion + adresse dans la liste des administrateurs (empreintes salées, `public/admins.json`) + rôle `admin`. Les e-mails des admins ne sont **jamais** dans Git (`release-keys/`).
- Aucune clé, aucun mot de passe dans Git ; les clés de signature restent hors du dépôt.

## Licence

Code sous licence MIT. Énoncés IMO © IMO ([imo-official.org](https://www.imo-official.org)), reproduits à des fins pédagogiques. Les exercices originaux du club sont librement réutilisables à des fins pédagogiques non commerciales.
