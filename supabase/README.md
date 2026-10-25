# Serveur de l'application (Supabase)

Comptes, inscriptions, statistiques des groupes et propositions d'exercices des encadreurs.
L'application fonctionne **sans compte et hors ligne** ; le compte sert à retrouver sa
progression, à être suivi par son encadreur et, pour les encadreurs, à proposer des exercices.

| Fichier | Rôle |
| --- | --- |
| `migrations/20261025000000_comptes.sql` | Tables, fonctions, règles d'accès (RLS) |
| `tests/run.sh` | Rejoue la migration et vérifie les règles d'accès dans un PostgreSQL jetable (CI) |

## Ce que le schéma garantit

- Un **élève** ne voit que son profil et ses tentatives.
- Un **encadreur** voit les profils et les statistiques des élèves de **ses** groupes, et peut
  **proposer des exercices** (énoncé + solution en LaTeX).
- Un **admin** (bureau) voit tout, attribue les rôles, relit et accepte les propositions.
- Le rôle « encadreur » demandé à l'inscription n'est **accordé que par un admin**.
- Une proposition ne peut plus être modifiée par son auteur une fois en relecture.
- Les tentatives envoyées par le téléphone ont un identifiant unique : renvoyer la file
  d'envoi après une coupure ne crée pas de doublon.

## Mise en place (Bureau, une seule fois, ~30 minutes)

### 1. Projet

1. Créer un compte sur <https://supabase.com> avec l'adresse e-mail du bureau COMIMa
   (pas un compte personnel : le projet doit survivre aux changements d'équipe).
2. **New project** : nom `comima`, offre gratuite, région la plus proche de Madagascar
   proposée dans la liste.
3. Noter le **mot de passe de la base** dans le gestionnaire de mots de passe du bureau.

### 2. Schéma

**SQL Editor** → *New query* → coller tout le contenu de
`migrations/20261025000000_comptes.sql` → **Run**.

### 3. Connexion par e-mail

**Authentication → Sign In / Providers → Email** : activé, *Confirm email* activé.

**Authentication → URL Configuration** :

- *Site URL* : `https://www.comima.mg`
- *Redirect URLs* : `mg.comima.app://login-callback` et `https://www.comima.mg/**`

**Authentication → Emails** : traduire les modèles en français (confirmation, mot de passe
oublié).

### 4. Google

1. <https://console.cloud.google.com> → nouveau projet `COMIMa` → **APIs & Services →
   OAuth consent screen** (externe, nom « COMIMa », logo, e-mail du bureau).
2. **Credentials → Create credentials → OAuth client ID → Web application**.
   *Authorized redirect URI* : `https://<ID-DU-PROJET>.supabase.co/auth/v1/callback`
   (affiché dans Supabase, page du fournisseur Google).
3. Copier *Client ID* et *Client secret* dans **Supabase → Authentication → Providers →
   Google**, activer.

### 5. Facebook

1. <https://developers.facebook.com> → **My Apps → Create app** (type « Consumer »),
   nom « COMIMa ».
2. Ajouter le produit **Facebook Login** ; *Valid OAuth Redirect URIs* :
   `https://<ID-DU-PROJET>.supabase.co/auth/v1/callback`.
3. **Settings → Basic** : copier *App ID* et *App Secret* dans **Supabase → Authentication
   → Providers → Facebook**, activer. Renseigner l'URL de la politique de confidentialité
   (`https://www.comima.mg/fr/mentions-legales/`) et passer l'application en mode *Live*.

### 6. Premier admin

Après s'être inscrit une fois depuis l'application ou le site, dans le **SQL Editor** :

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'adresse@du-bureau');
```

Les encadreurs demandent leur rôle à l'inscription ; un admin l'accorde :

```sql
update public.profiles set role = 'encadreur'
where requested_role = 'encadreur' and display_name = '…';
```

(un écran d'administration dans l'application remplacera ces requêtes).

### 7. Ce qu'il faut me transmettre

**Project Settings → API** :

- *Project URL* (`https://xxxx.supabase.co`)
- clé **anon / publishable** : elle est publique par nature (protégée par les règles RLS),
  elle sera intégrée à l'application et au site.

**Ne jamais transmettre ni publier** la clé `service_role` / *secret*, ni le mot de passe
de la base. Si un jour la CI en a besoin : secret GitHub `SUPABASE_SERVICE_ROLE_KEY`.

## Tester les règles localement

```bash
supabase/tests/run.sh
```
