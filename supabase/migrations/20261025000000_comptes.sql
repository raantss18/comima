-- Comptes COMIMa : profils (inscription), rôles, groupes d'encadrement, tentatives
-- (statistiques), propositions d'exercices des encadreurs.
--
-- ISOLATION : tout vit dans le schéma `comima`. Rien dans `public`, aucun déclencheur sur
-- `auth.users`, aucune modification de ce qui existe déjà : ce fichier peut donc être exécuté
-- sans risque dans un projet Supabase déjà utilisé par d'autres applications (Mahay, Tontolo…),
-- puis rejoué tel quel dans un projet dédié. Les comptes (`auth.users`) sont communs au
-- projet ; un profil COMIMa n'existe qu'après l'appel explicite de `comima.register(...)`.
--
-- RÉ-EXÉCUTABLE : ce fichier peut être relancé sans erreur (rien n'est perdu, les données
-- existantes sont conservées) ; il met à jour les fonctions et les règles d'accès.
--
-- SÉCURITÉ : chaque table a la sécurité au niveau des lignes (RLS) ; un élève ne voit que ses
-- données, un encadreur celles de ses groupes, un admin (bureau) tout. Le rôle `anon` n'a
-- aucun accès au schéma.

create schema if not exists comima;

revoke all on schema comima from public;
grant usage on schema comima to authenticated;

-- ------------------------------------------------------------------ référentiels

create table if not exists comima.centres (
  id   text primary key,
  nom  text not null
);

insert into comima.centres (id, nom) values
  ('antananarivo', 'Antananarivo'),
  ('antsiranana', 'Antsiranana'),
  ('ambositra', 'Ambositra'),
  ('ambatondrazaka', 'Ambatondrazaka'),
  ('fianarantsoa', 'Fianarantsoa')
on conflict (id) do nothing;

do $$ begin
  create type comima.role as enum ('eleve', 'encadreur', 'admin');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------ profils

create table if not exists comima.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  display_name    text not null check (char_length(display_name) between 1 and 30),
  role            comima.role not null default 'eleve',
  -- Rôle demandé à l'inscription (« je suis encadreur ») : accordé par un admin uniquement.
  requested_role  comima.role,
  birth_year      int check (birth_year between 1900 and 2100),
  school          text check (char_length(school) <= 80),
  region          text check (char_length(region) <= 40),
  centre_id       text references comima.centres (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Fonctions d'aide (security definer : lisent profiles sans boucler sur les règles RLS).
create or replace function comima.my_role() returns comima.role
  language sql stable security definer set search_path = comima as
  $$ select role from comima.profiles where id = auth.uid() $$;

create or replace function comima.is_admin() returns boolean
  language sql stable security definer set search_path = comima as
  $$ select coalesce(comima.my_role() = 'admin', false) $$;

create or replace function comima.is_coach() returns boolean
  language sql stable security definer set search_path = comima as
  $$ select coalesce(comima.my_role() in ('encadreur', 'admin'), false) $$;

-- Inscription : appelée par l'application après la première connexion (e-mail, Google,
-- Facebook), et à chaque modification du profil. Crée ou met à jour le profil de l'appelant ;
-- ne touche jamais au rôle. Pas de déclencheur sur auth.users : les autres applications du
-- projet ne créent donc aucun profil COMIMa.
create or replace function comima.register(
  p_display_name   text,
  p_birth_year     int,
  p_school         text,
  p_region         text,
  p_centre_id      text,
  p_requested_role text default 'eleve'
) returns comima.profiles
  language plpgsql security definer set search_path = comima as
$$
declare
  uid uuid := auth.uid();
  r   comima.profiles;
begin
  if uid is null then
    raise exception 'Connexion requise';
  end if;
  insert into comima.profiles (id, display_name, requested_role, birth_year, school, region, centre_id)
  values (
    uid,
    left(coalesce(nullif(trim(p_display_name), ''), 'Élève'), 30),
    case when p_requested_role = 'encadreur' then 'encadreur'::comima.role end,
    p_birth_year,
    left(p_school, 80),
    left(p_region, 40),
    (select id from comima.centres where id = p_centre_id)
  )
  on conflict (id) do update set
    display_name   = excluded.display_name,
    requested_role = excluded.requested_role,
    birth_year     = excluded.birth_year,
    school         = excluded.school,
    region         = excluded.region,
    centre_id      = excluded.centre_id
  returning * into r;
  return r;
end;
$$;

revoke all on function comima.register(text, int, text, text, text, text) from public;
grant execute on function comima.register(text, int, text, text, text, text) to authenticated;

-- Seul un admin change un rôle. Sans utilisateur connecté (auth.uid() nul : éditeur SQL du
-- tableau de bord, service_role), tout est permis : c'est ainsi que le bureau nomme le
-- premier admin.
create or replace function comima.protect_profile() returns trigger
  language plpgsql security definer set search_path = comima as
$$
begin
  if auth.uid() is not null and new.role is distinct from old.role and not comima.is_admin() then
    raise exception 'Seul un admin peut changer un rôle';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_protect on comima.profiles;
create trigger profiles_protect
  before update on comima.profiles
  for each row execute function comima.protect_profile();

-- ------------------------------------------------------------------ groupes d'encadrement

create table if not exists comima.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  centre_id   text references comima.centres (id),
  coach_id    uuid not null references comima.profiles (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists comima.group_members (
  group_id  uuid references comima.groups (id) on delete cascade,
  user_id   uuid references comima.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Fonctions d'aide sur les groupes (security definer : évitent que les règles de `groups` et
-- de `group_members` se référencent mutuellement, ce qui bouclerait).
create or replace function comima.in_group(gid uuid) returns boolean
  language sql stable security definer set search_path = comima as
  $$ select exists (select 1 from comima.group_members where group_id = gid and user_id = auth.uid()) $$;

create or replace function comima.coaches_group(gid uuid) returns boolean
  language sql stable security definer set search_path = comima as
  $$ select exists (select 1 from comima.groups where id = gid and coach_id = auth.uid()) $$;

-- Vrai si l'utilisateur courant encadre un groupe dont `uid` est membre.
create or replace function comima.coaches(uid uuid) returns boolean
  language sql stable security definer set search_path = comima as
$$
  select exists (
    select 1 from comima.group_members gm
    join comima.groups g on g.id = gm.group_id
    where gm.user_id = uid and g.coach_id = auth.uid()
  )
$$;

-- ------------------------------------------------------------------ tentatives (statistiques)

create table if not exists comima.attempts (
  -- UUID généré par le téléphone : renvoyer la file d'envoi ne crée pas de doublon.
  id           uuid primary key,
  user_id      uuid not null references comima.profiles (id) on delete cascade,
  question_id  text not null,
  notion_id    text,
  theme        text,
  qtype        text,
  difficulty   smallint,
  ok           boolean not null,
  duration_ms  int check (duration_ms >= 0),
  answered_at  timestamptz not null,
  received_at  timestamptz not null default now()
);

create index if not exists attempts_user_time on comima.attempts (user_id, answered_at desc);

-- ------------------------------------------------------------------ propositions d'exercices

do $$ begin
  create type comima.proposal_status as enum ('soumis', 'en_relecture', 'accepte', 'refuse');
exception when duplicate_object then null; end $$;

create table if not exists comima.exercise_proposals (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references comima.profiles (id) on delete cascade,
  titre_fr        text not null check (char_length(titre_fr) between 3 and 120),
  titre_en        text check (char_length(titre_en) <= 120),
  themes          text[] not null default '{}',
  niveau          text check (niveau in ('collège', 'lycée', 'prépa', 'recherche')),
  difficulte      smallint check (difficulte between 1 and 5),
  source          text check (char_length(source) <= 200),
  enonce_tex      text not null check (char_length(enonce_tex) between 10 and 20000),
  solution_tex    text not null check (char_length(solution_tex) between 10 and 50000),
  status          comima.proposal_status not null default 'soumis',
  review_comment  text,
  reviewer_id     uuid references comima.profiles (id),
  -- Identifiant de l'exercice publié sur le site (content/exercices/<id>) une fois accepté.
  published_id    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- L'auteur ne peut modifier que le contenu d'une proposition pas encore relue.
create or replace function comima.protect_proposal() returns trigger
  language plpgsql security definer set search_path = comima as
$$
begin
  if auth.uid() is not null and not comima.is_admin() then
    if old.status <> 'soumis' then
      raise exception 'Proposition déjà en relecture';
    end if;
    new.status := old.status;
    new.review_comment := old.review_comment;
    new.reviewer_id := old.reviewer_id;
    new.published_id := old.published_id;
  end if;
  new.author_id := old.author_id;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists proposals_protect on comima.exercise_proposals;
create trigger proposals_protect
  before update on comima.exercise_proposals
  for each row execute function comima.protect_proposal();

-- ------------------------------------------------------------------ sécurité (RLS)

alter table comima.centres enable row level security;
alter table comima.profiles enable row level security;
alter table comima.groups enable row level security;
alter table comima.group_members enable row level security;
alter table comima.attempts enable row level security;
alter table comima.exercise_proposals enable row level security;

drop policy if exists "centres lisibles" on comima.centres;
create policy "centres lisibles" on comima.centres for select to authenticated using (true);
drop policy if exists "centres gérés par les admins" on comima.centres;
create policy "centres gérés par les admins" on comima.centres for all to authenticated
  using (comima.is_admin()) with check (comima.is_admin());

-- Pas de règle d'insertion : un profil ne se crée que par comima.register().
drop policy if exists "profil : soi, son encadreur, les admins" on comima.profiles;
create policy "profil : soi, son encadreur, les admins" on comima.profiles for select to authenticated
  using (id = auth.uid() or comima.coaches(id) or comima.is_admin());
drop policy if exists "profil : modifier le sien" on comima.profiles;
create policy "profil : modifier le sien" on comima.profiles for update to authenticated
  using (id = auth.uid() or comima.is_admin()) with check (id = auth.uid() or comima.is_admin());
drop policy if exists "profil : supprimer le sien (ou un admin)" on comima.profiles;
create policy "profil : supprimer le sien (ou un admin)" on comima.profiles for delete to authenticated
  using (id = auth.uid() or comima.is_admin());

drop policy if exists "groupes : encadreur et membres" on comima.groups;
create policy "groupes : encadreur et membres" on comima.groups for select to authenticated
  using (coach_id = auth.uid() or comima.is_admin() or comima.in_group(id));
drop policy if exists "groupes : créés par un encadreur" on comima.groups;
create policy "groupes : créés par un encadreur" on comima.groups for insert to authenticated
  with check (comima.is_coach() and coach_id = auth.uid());
drop policy if exists "groupes : gérés par leur encadreur" on comima.groups;
create policy "groupes : gérés par leur encadreur" on comima.groups for update to authenticated
  using (coach_id = auth.uid() or comima.is_admin());
drop policy if exists "groupes : supprimés par leur encadreur" on comima.groups;
create policy "groupes : supprimés par leur encadreur" on comima.groups for delete to authenticated
  using (coach_id = auth.uid() or comima.is_admin());

drop policy if exists "membres : visibles du groupe" on comima.group_members;
create policy "membres : visibles du groupe" on comima.group_members for select to authenticated
  using (user_id = auth.uid() or comima.is_admin() or comima.coaches_group(group_id));
drop policy if exists "membres : ajoutés par l'encadreur" on comima.group_members;
create policy "membres : ajoutés par l'encadreur" on comima.group_members for insert to authenticated
  with check (comima.is_admin() or comima.coaches_group(group_id));
drop policy if exists "membres : retirés par l'encadreur ou soi-même" on comima.group_members;
create policy "membres : retirés par l'encadreur ou soi-même" on comima.group_members for delete to authenticated
  using (user_id = auth.uid() or comima.is_admin() or comima.coaches_group(group_id));

drop policy if exists "tentatives : envoyer les siennes" on comima.attempts;
create policy "tentatives : envoyer les siennes" on comima.attempts for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "tentatives : soi, son encadreur, les admins" on comima.attempts;
create policy "tentatives : soi, son encadreur, les admins" on comima.attempts for select to authenticated
  using (user_id = auth.uid() or comima.coaches(user_id) or comima.is_admin());

drop policy if exists "propositions : déposées par les encadreurs" on comima.exercise_proposals;
create policy "propositions : déposées par les encadreurs" on comima.exercise_proposals for insert to authenticated
  with check (author_id = auth.uid() and comima.is_coach());
drop policy if exists "propositions : l'auteur et les admins" on comima.exercise_proposals;
create policy "propositions : l'auteur et les admins" on comima.exercise_proposals for select to authenticated
  using (author_id = auth.uid() or comima.is_admin());
drop policy if exists "propositions : modifiées par l'auteur ou un admin" on comima.exercise_proposals;
create policy "propositions : modifiées par l'auteur ou un admin" on comima.exercise_proposals for update to authenticated
  using (author_id = auth.uid() or comima.is_admin());
drop policy if exists "propositions : supprimées par l'auteur ou un admin" on comima.exercise_proposals;
create policy "propositions : supprimées par l'auteur ou un admin" on comima.exercise_proposals for delete to authenticated
  using (comima.is_admin() or (author_id = auth.uid() and status = 'soumis'));

-- ------------------------------------------------------------------ droits (API Data)

-- Les règles RLS ci-dessus restreignent les lignes ; ces droits ouvrent les tables aux
-- seuls utilisateurs connectés. `anon` n'a rien.
grant select, insert, update, delete on all tables in schema comima to authenticated;
alter default privileges in schema comima grant select, insert, update, delete on tables to authenticated;
