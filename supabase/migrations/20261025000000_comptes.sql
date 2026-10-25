-- Comptes COMIMa : profils (inscription), rôles, groupes d'encadrement, tentatives
-- (statistiques), propositions d'exercices des encadreurs.
-- Règle d'or : chaque table a la sécurité au niveau des lignes (RLS) ; un élève ne voit que
-- ses données, un encadreur celles de ses groupes, un admin (bureau) tout.

-- ------------------------------------------------------------------ référentiels

create table public.centres (
  id   text primary key,
  nom  text not null
);

insert into public.centres (id, nom) values
  ('antananarivo', 'Antananarivo'),
  ('antsiranana', 'Antsiranana'),
  ('ambositra', 'Ambositra'),
  ('ambatondrazaka', 'Ambatondrazaka'),
  ('fianarantsoa', 'Fianarantsoa');

create type public.role as enum ('eleve', 'encadreur', 'admin');

-- ------------------------------------------------------------------ profils

create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  display_name    text not null check (char_length(display_name) between 1 and 30),
  role            public.role not null default 'eleve',
  -- Rôle demandé à l'inscription (« je suis encadreur ») : accordé par un admin uniquement.
  requested_role  public.role,
  birth_year      int check (birth_year between 1900 and 2100),
  school          text check (char_length(school) <= 80),
  region          text check (char_length(region) <= 40),
  centre_id       text references public.centres (id),
  -- Compte géré par un encadreur (élève sans e-mail) : connexion pseudo + PIN.
  managed         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Fonctions d'aide (security definer : lisent profiles sans boucler sur les règles RLS).
create function public.my_role() returns public.role
  language sql stable security definer set search_path = public as
  $$ select role from public.profiles where id = auth.uid() $$;

create function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as
  $$ select coalesce(public.my_role() = 'admin', false) $$;

create function public.is_coach() returns boolean
  language sql stable security definer set search_path = public as
  $$ select coalesce(public.my_role() in ('encadreur', 'admin'), false) $$;

-- Profil créé automatiquement à l'inscription, à partir des métadonnées envoyées par l'app.
create function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as
$$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, display_name, requested_role, birth_year, school, region, centre_id, managed)
  values (
    new.id,
    left(coalesce(nullif(m ->> 'display_name', ''), nullif(m ->> 'full_name', ''), 'Élève'), 30),
    case when m ->> 'requested_role' = 'encadreur' then 'encadreur'::public.role end,
    nullif(m ->> 'birth_year', '')::int,
    left(m ->> 'school', 80),
    left(m ->> 'region', 40),
    (select id from public.centres where id = m ->> 'centre_id'),
    coalesce((m ->> 'managed')::boolean, false)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seul un admin change un rôle ; personne ne change `managed` après coup. Sans utilisateur
-- connecté (auth.uid() nul : éditeur SQL du tableau de bord, service_role), tout est permis :
-- c'est ainsi que le bureau nomme le premier admin.
create function public.protect_profile() returns trigger
  language plpgsql security definer set search_path = public as
$$
begin
  if auth.uid() is null then
    new.updated_at := now();
    return new;
  end if;
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Seul un admin peut changer un rôle';
  end if;
  new.managed := old.managed;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile();

-- ------------------------------------------------------------------ groupes d'encadrement

create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  centre_id   text references public.centres (id),
  coach_id    uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table public.group_members (
  group_id  uuid references public.groups (id) on delete cascade,
  user_id   uuid references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Fonctions d'aide sur les groupes (security definer : évitent que les règles de `groups` et
-- de `group_members` se référencent mutuellement, ce qui bouclerait).
create function public.in_group(gid uuid) returns boolean
  language sql stable security definer set search_path = public as
  $$ select exists (select 1 from public.group_members where group_id = gid and user_id = auth.uid()) $$;

create function public.coaches_group(gid uuid) returns boolean
  language sql stable security definer set search_path = public as
  $$ select exists (select 1 from public.groups where id = gid and coach_id = auth.uid()) $$;

-- Vrai si l'utilisateur courant encadre un groupe dont `uid` est membre.
create function public.coaches(uid uuid) returns boolean
  language sql stable security definer set search_path = public as
$$
  select exists (
    select 1 from public.group_members gm
    join public.groups g on g.id = gm.group_id
    where gm.user_id = uid and g.coach_id = auth.uid()
  )
$$;

-- ------------------------------------------------------------------ tentatives (statistiques)

create table public.attempts (
  -- UUID généré par le téléphone : renvoyer la file d'envoi ne crée pas de doublon.
  id           uuid primary key,
  user_id      uuid not null references public.profiles (id) on delete cascade,
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

create index attempts_user_time on public.attempts (user_id, answered_at desc);

-- ------------------------------------------------------------------ propositions d'exercices

create type public.proposal_status as enum ('soumis', 'en_relecture', 'accepte', 'refuse');

create table public.exercise_proposals (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references public.profiles (id) on delete cascade,
  titre_fr        text not null check (char_length(titre_fr) between 3 and 120),
  titre_en        text check (char_length(titre_en) <= 120),
  themes          text[] not null default '{}',
  niveau          text check (niveau in ('collège', 'lycée', 'prépa', 'recherche')),
  difficulte      smallint check (difficulte between 1 and 5),
  source          text check (char_length(source) <= 200),
  enonce_tex      text not null check (char_length(enonce_tex) between 10 and 20000),
  solution_tex    text not null check (char_length(solution_tex) between 10 and 50000),
  status          public.proposal_status not null default 'soumis',
  review_comment  text,
  reviewer_id     uuid references public.profiles (id),
  -- Identifiant de l'exercice publié sur le site (content/exercices/<id>) une fois accepté.
  published_id    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- L'auteur ne peut modifier que le contenu d'une proposition pas encore relue.
create function public.protect_proposal() returns trigger
  language plpgsql security definer set search_path = public as
$$
begin
  if auth.uid() is not null and not public.is_admin() then
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

create trigger proposals_protect
  before update on public.exercise_proposals
  for each row execute function public.protect_proposal();

-- ------------------------------------------------------------------ sécurité (RLS)

alter table public.centres enable row level security;
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.attempts enable row level security;
alter table public.exercise_proposals enable row level security;

create policy "centres lisibles par tous" on public.centres for select using (true);
create policy "centres gérés par les admins" on public.centres for all using (public.is_admin()) with check (public.is_admin());

create policy "profil : soi, son encadreur, les admins" on public.profiles for select
  using (id = auth.uid() or public.coaches(id) or public.is_admin());
create policy "profil : modifier le sien" on public.profiles for update
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "profil : suppression par un admin" on public.profiles for delete using (public.is_admin());

create policy "groupes : encadreur et membres" on public.groups for select
  using (coach_id = auth.uid() or public.is_admin() or public.in_group(id));
create policy "groupes : créés par un encadreur" on public.groups for insert
  with check (public.is_coach() and coach_id = auth.uid());
create policy "groupes : gérés par leur encadreur" on public.groups for update
  using (coach_id = auth.uid() or public.is_admin());
create policy "groupes : supprimés par leur encadreur" on public.groups for delete
  using (coach_id = auth.uid() or public.is_admin());

create policy "membres : visibles du groupe" on public.group_members for select
  using (user_id = auth.uid() or public.is_admin() or public.coaches_group(group_id));
create policy "membres : ajoutés par l'encadreur" on public.group_members for insert
  with check (public.is_admin() or public.coaches_group(group_id));
create policy "membres : retirés par l'encadreur ou soi-même" on public.group_members for delete
  using (user_id = auth.uid() or public.is_admin() or public.coaches_group(group_id));

create policy "tentatives : envoyer les siennes" on public.attempts for insert with check (user_id = auth.uid());
create policy "tentatives : soi, son encadreur, les admins" on public.attempts for select
  using (user_id = auth.uid() or public.coaches(user_id) or public.is_admin());

create policy "propositions : déposées par les encadreurs" on public.exercise_proposals for insert
  with check (author_id = auth.uid() and public.is_coach());
create policy "propositions : l'auteur et les admins" on public.exercise_proposals for select
  using (author_id = auth.uid() or public.is_admin());
create policy "propositions : modifiées par l'auteur ou un admin" on public.exercise_proposals for update
  using (author_id = auth.uid() or public.is_admin());
create policy "propositions : supprimées par l'auteur ou un admin" on public.exercise_proposals for delete
  using (public.is_admin() or (author_id = auth.uid() and status = 'soumis'));
