# Serveur de l'application (Supabase)

Comptes, inscriptions, statistiques des groupes et propositions d'exercices des encadreurs.
L'application fonctionne **sans compte et hors ligne** ; le compte sert à retrouver sa
progression, à être suivi par son encadreur et, pour les encadreurs, à proposer des exercices.

| Fichier | Rôle |
| --- | --- |
| `migrations/20261025000000_comptes.sql` | Schéma `comima` : tables, fonctions, règles d'accès (RLS) |
| `tests/run.sh` | Rejoue la migration et vérifie accès **et isolation** dans un PostgreSQL jetable (CI) |

## Hébergement : le projet de Mahay, en attendant un projet dédié

L'offre gratuite de Supabase limite à **2 projets actifs**, déjà pris par Mahay et Tontolo.
COMIMa s'installe donc **temporairement dans un projet existant**, sans le perturber :

- **Quel projet ?** Celui de **Mahay** : son SQL et ses fournisseurs de connexion ne sont pas
  encore en service. **Pas celui de Tontolo**, qui reçoit déjà les statistiques et les notes
  des utilisateurs réels.
- **Isolation.** Tout COMIMa vit dans son propre schéma `comima`. La migration ne crée **rien**
  dans `public`, ne pose **aucun déclencheur sur `auth.users`** et ne modifie rien d'existant ;
  le rôle `anon` n'a aucun accès au schéma. Les tests le vérifient (un projet qui contient déjà
  une table `public` avec des données reste intact).
- **Comptes partagés.** `auth.users` est commun au projet : une personne connectée avec Google
  pour Mahay a le même compte pour COMIMa, mais n'a **aucun profil COMIMa** tant qu'elle ne
  s'est pas inscrite dans l'application COMIMa (appel de `comima.register(...)`).
- **Aucune clé à partager avec Mahay.** L'application COMIMa utilise l'URL et la clé `anon`
  du projet, et appelle l'API avec le schéma `comima` (`.schema('comima')`).

### Ce qui est commun, donc à ne pas casser

| Réglage (tout le projet) | Consigne |
| --- | --- |
| *Site URL* | **Ne pas la changer** ; elle sert aux autres applications |
| *Redirect URLs* | **Ajouter** celle de COMIMa, ne rien retirer |
| Modèles d'e-mails | Communs aux 3 applications : ne pas les personnaliser pour COMIMa seule |
| Fournisseurs Google / GitHub | Un seul jeu d'identifiants par projet : l'écran de consentement Google affichera le nom de l'application configurée (celle de Mahay), pas « COMIMa ». À corriger au passage à un projet dédié |

### Limites de l'offre gratuite (à garder en tête)

- Base de **500 Mo** et **50 000** utilisateurs actifs par mois, partagés entre les applications.
- Un projet gratuit **inactif pendant 7 jours est mis en pause** (réactivation à la main) : les
  trois applications fonctionnent hors ligne, mais la synchronisation s'arrête tant que le projet
  est en pause. Une application active (Mahay) le garde éveillé.
- Une panne ou une erreur de configuration touche les trois applications : ne jamais modifier
  le SQL d'une application dans le projet sans relire cette page.

## Mise en place (Bureau, ~20 minutes)

Rien à créer : tout se fait dans le **projet de Mahay**.

### 1. Schéma

**SQL Editor** → *New query* → coller tout le contenu de
`migrations/20261025000000_comptes.sql` → **Run**.
Le fichier peut être **relancé sans risque** (rien n'est perdu, rien ne casse) : s'il a déjà été
exécuté, il met simplement à jour les fonctions et les règles d'accès.
Vérification : *Table Editor* → menu des schémas → `comima` doit afficher `centres`,
`profiles`, `groups`, `group_members`, `attempts`, `exercise_proposals`.

### 2. Exposer le schéma à l'API

**Project Settings → Data API** (anciennement *API*) → *Exposed schemas* : **ajouter**
`comima` à la liste (garder `public` et les autres). Enregistrer.

### 3. Connexion

**Authentication → URL Configuration → Redirect URLs** : **ajouter** (sans rien retirer)
`mg.comima.app://login-callback`

**Authentication → Sign In / Providers** :

- **E-mail** : à **activer** (réglage commun au projet ; Mahay n'utilise que Google et GitHub, il n'est
  pas touché). Garder *Confirm email* activé.
- **Google** et **GitHub** : s'ils sont déjà configurés pour Mahay, **rien à faire** (COMIMa utilise
  les mêmes). Sinon, voir `mahay/docs/ACCOUNTS_SETUP.md`, étapes 3 et 4.
- **Facebook** (nouveau) : <https://developers.facebook.com> → *My Apps → Create app* (type
  « Consumer »), nom « COMIMa » → ajouter **Facebook Login** → *Valid OAuth Redirect URIs* :
  `https://<ID-DU-PROJET>.supabase.co/auth/v1/callback` (affiché dans Supabase, page du
  fournisseur Facebook). *Settings → Basic* : copier *App ID* et *App Secret* dans **Supabase →
  Providers → Facebook**, activer. Renseigner la politique de confidentialité
  (`https://www.comima.mg/fr/mentions-legales/`) puis passer l'application en mode *Live*.

### 4. Vérifier que tout est prêt

Depuis le dépôt (sans créer de compte, sans lire de donnée) :

```bash
node scripts/check-supabase.mjs
```

Il liste chaque point avec ✓ / ✗ et, pour chaque ✗, **où cliquer** pour le corriger. Les
vérifications comprennent : clé publique (et non secrète), fournisseurs Google / Facebook / e-mail,
schéma `comima` exposé, tables créées, accès refusé sans connexion.

### 5. Premier admin

Après s'être inscrit une fois depuis l'application COMIMa, dans le **SQL Editor** :

```sql
update comima.profiles set role = 'admin'
where id = (select id from auth.users where email = 'adresse@du-bureau');
```

Les encadreurs demandent leur rôle à l'inscription ; un admin l'accorde :

```sql
update comima.profiles set role = 'encadreur'
where requested_role = 'encadreur' and display_name = '…';
```

(un écran d'administration dans l'application remplacera ces requêtes).

### 6. Ce qu'il faut me transmettre

**Project Settings → API** : l'**URL du projet** (`https://xxxx.supabase.co`) et la clé
**anon / publishable** — publique par nature, protégée par les règles RLS. Ce sont les mêmes
que celles de Mahay.

**Ne jamais transmettre ni publier** la clé `service_role` / *secret* ni le mot de passe de la
base. Si un jour la CI en a besoin : secret GitHub `SUPABASE_SERVICE_ROLE_KEY`.

## Passer plus tard à un projet dédié

Quand le budget le permet (offre payante, ou un projet libéré) :

1. **Nouveau projet** → exécuter **le même fichier de migration** (étapes 1 à 3 ci-dessus).
2. **Données COMIMa** : sur l'ancien projet, copier uniquement le schéma `comima` :
   `pg_dump --data-only --schema=comima "<chaîne de connexion de l'ancien projet>" > comima.sql`
   puis `psql "<chaîne du nouveau projet>" -f comima.sql`.
3. **Comptes concernés** : seuls ceux qui ont un profil COMIMa doivent suivre
   (`select * from auth.users where id in (select id from comima.profiles)`, avec leurs lignes de
   `auth.identities`). Les importer **avec les mêmes `id`** garde tous les profils, groupes et
   tentatives rattachés. *Cette étape n'a pas été essayée ici : la répéter d'abord sur un projet de
   test, certaines colonnes de `auth.users` sont calculées et ne s'importent pas.*
4. Publier une **nouvelle version de l'application** avec la nouvelle URL et la nouvelle clé
   `anon` (mise à jour automatique, voir `app/RELEASING.md`). Les anciennes versions continuent de
   fonctionner hors ligne ; elles reprennent la synchronisation à la mise à jour.
5. Si l'import des comptes échoue, **rien n'est perdu** : la progression reste sur les téléphones
   (l'application est « hors ligne d'abord » et les tentatives portent un identifiant unique, donc
   se renvoient sans doublon). Les élèves se reconnectent et tout est renvoyé.
6. Une fois vérifié, supprimer le schéma dans l'ancien projet : `drop schema comima cascade;`
   (et retirer `comima` de *Exposed schemas*).

## Tester les règles localement

```bash
supabase/tests/run.sh
```
