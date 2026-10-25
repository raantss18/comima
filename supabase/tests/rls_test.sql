-- Test des règles d'accès hors Supabase : imitation minimale de auth.* puis scénarios.
-- Lancer : supabase/tests/run.sh (PostgreSQL dans Docker).
\set ON_ERROR_STOP on
create schema auth;
create table auth.users (id uuid primary key, raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create role authenticated;
create role anon;
grant usage on schema public, auth to authenticated, anon;

-- Un projet déjà utilisé par d'autres applications (comme Mahay ou Tontolo) : une table
-- publique avec ses données, lisible par anon. COMIMa ne doit rien y changer.
create table public.feedback (id serial primary key, message text);
insert into public.feedback (message) values ('déjà là');
grant select, insert on public.feedback to anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;

\i /migrations/20261025000000_comptes.sql
-- Rejouée une seconde fois : doit passer sans erreur (ré-exécutable).
\i /migrations/20261025000000_comptes.sql

-- ---------------------------------------------------------------- isolation
do $$ begin
  assert (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relkind in ('r','v','m','S') and c.relname <> 'feedback'
            and c.relname <> 'feedback_id_seq') = 0, 'ÉCHEC : objets COMIMa dans public';
  assert (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'auth' and not t.tgisinternal) = 0, 'ÉCHEC : déclencheur sur auth.users';
  assert (select count(*) from public.feedback) = 1, 'ÉCHEC : données existantes modifiées';
  assert not has_schema_privilege('anon', 'comima', 'usage'), 'ÉCHEC : anon accède au schéma comima';
  assert has_schema_privilege('authenticated', 'comima', 'usage'), 'authenticated doit accéder au schéma';
end $$;

-- Inscriptions dans le projet partagé : une personne qui n'a qu'un compte « autre appli »
-- n'a PAS de profil COMIMa.
insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a', '{"display_name":"Rova"}'),
  ('00000000-0000-0000-0000-00000000000b', '{"display_name":"Hery"}'),
  ('00000000-0000-0000-0000-00000000000c', '{"display_name":"Encadreuse"}'),
  ('00000000-0000-0000-0000-00000000000d', '{"display_name":"Admin"}'),
  ('00000000-0000-0000-0000-00000000000e', '{"display_name":"Utilisateur de Mahay"}');
do $$ begin
  assert (select count(*) from comima.profiles) = 0, 'ÉCHEC : profil créé sans inscription COMIMa';
end $$;

set role authenticated;

-- A, B, C et D s'inscrivent par comima.register (centre inconnu ignoré, rôle demandé non accordé).
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select comima.register('Rova', 2010, 'Lycée X', 'Analamanga', 'antananarivo');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
select comima.register('Hery', null, null, null, 'inconnu');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
select comima.register('Encadreuse', null, 'Lycée X', 'Analamanga', 'antananarivo', 'encadreur');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
select comima.register('Admin', null, null, null, null);

-- Rôle d'admin : posé par le tableau de bord / service_role (sans utilisateur connecté).
reset role;
select set_config('request.jwt.claim.sub', '', false);
update comima.profiles set role = 'admin' where display_name = 'Admin';
do $$ begin
  assert (select birth_year from comima.profiles where display_name = 'Rova') = 2010, 'année de naissance';
  assert (select centre_id from comima.profiles where display_name = 'Hery') is null, 'centre inconnu ignoré';
  assert (select role from comima.profiles where display_name = 'Encadreuse') = 'eleve', 'rôle demandé non accordé';
  assert (select requested_role from comima.profiles where display_name = 'Encadreuse') = 'encadreur', 'rôle demandé noté';
end $$;
set role authenticated;

-- Sans connexion, on ne s'inscrit pas.
select set_config('request.jwt.claim.sub', '', false);
do $$ begin
  begin
    perform comima.register('Intrus', null, null, null, null);
    raise exception 'ÉCHEC : inscription sans connexion';
  exception when raise_exception then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;
end $$;

-- L'élève A ne voit que lui, ne peut pas se promouvoir ni s'inscrire de force.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
do $$ begin
  assert (select count(*) from comima.profiles) = 1, 'élève : un seul profil visible';
  begin
    update comima.profiles set role = 'admin' where id = auth.uid();
    raise exception 'ÉCHEC : promotion acceptée';
  exception when raise_exception then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;
  begin
    insert into comima.profiles (id, display_name, role)
      values ('00000000-0000-0000-0000-00000000000e', 'Faux', 'admin');
    raise exception 'ÉCHEC : insertion directe d''un profil';
  exception when insufficient_privilege then null;
  end;
  insert into comima.attempts (id, user_id, question_id, ok, answered_at)
    values (gen_random_uuid(), auth.uid(), 'rs-01', true, now());
  begin
    insert into comima.attempts (id, user_id, question_id, ok, answered_at)
      values (gen_random_uuid(), '00000000-0000-0000-0000-00000000000b', 'rs-01', true, now());
    raise exception 'ÉCHEC : tentative au nom d''un autre';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into comima.exercise_proposals (author_id, titre_fr, enonce_tex, solution_tex)
      values (auth.uid(), 'Titre', 'Énoncé assez long', 'Solution assez longue');
    raise exception 'ÉCHEC : un élève a proposé un exercice';
  exception when insufficient_privilege then null;
  end;
  -- Se réinscrire (modifier son profil) ne change pas le rôle.
  perform comima.register('Rova R.', 2010, 'Lycée Y', 'Analamanga', 'antananarivo', 'encadreur');
  assert (select role from comima.profiles where id = auth.uid()) = 'eleve', 'réinscription : rôle intact';
  assert (select school from comima.profiles where id = auth.uid()) = 'Lycée Y', 'réinscription : mise à jour';
end $$;

-- L'utilisateur de Mahay (sans profil COMIMa) ne voit rien de COMIMa.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
do $$ begin
  assert (select count(*) from comima.profiles) = 0, 'sans profil : rien de visible';
  assert (select count(*) from comima.attempts) = 0, 'sans profil : aucune tentative';
end $$;

-- L'admin accorde le rôle d'encadreur.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
update comima.profiles set role = 'encadreur' where display_name = 'Encadreuse';
do $$ begin assert (select count(*) from comima.profiles) = 4, 'admin : tout voir'; end $$;

-- L'encadreuse crée un groupe avec A, voit A (et ses tentatives) mais pas B ; propose un exercice.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
do $$
declare g uuid;
begin
  insert into comima.groups (name, coach_id) values ('Lycée X', auth.uid()) returning id into g;
  insert into comima.group_members values (g, '00000000-0000-0000-0000-00000000000a');
  assert (select count(*) from comima.profiles) = 2, 'encadreuse : elle-même + A';
  assert (select count(*) from comima.attempts) = 1, 'encadreuse : tentatives de A';
  insert into comima.exercise_proposals (author_id, titre_fr, enonce_tex, solution_tex, themes)
    values (auth.uid(), 'Une somme télescopique', '\[ \sum_{k=1}^n \frac{1}{k(k+1)} \]', 'On écrit $\frac1k - \frac1{k+1}$…', '{algèbre}');
  update comima.exercise_proposals set status = 'accepte';
  assert (select status from comima.exercise_proposals) = 'soumis', 'statut protégé';
end $$;

-- B ne voit ni A ni la proposition.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$ begin
  assert (select count(*) from comima.profiles) = 1, 'B isolé';
  assert (select count(*) from comima.exercise_proposals) = 0, 'propositions privées';
  assert (select count(*) from comima.groups) = 0, 'groupes privés';
end $$;

-- L'admin relit et accepte ; l'auteur ne peut plus modifier.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
update comima.exercise_proposals set status = 'accepte', review_comment = 'Merci !', published_id = 'alg-telescopique';
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
do $$ begin
  begin
    update comima.exercise_proposals set titre_fr = 'Autre titre';
    raise exception 'ÉCHEC : modification après relecture';
  exception when raise_exception then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;
end $$;

-- A supprime son profil COMIMa : ses tentatives disparaissent, son compte (auth.users) reste.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
delete from comima.profiles where id = auth.uid();
reset role;
do $$ begin
  assert (select count(*) from comima.attempts) = 0, 'tentatives supprimées avec le profil';
  assert (select count(*) from auth.users where id = '00000000-0000-0000-0000-00000000000a') = 1, 'compte conservé';
  assert (select count(*) from public.feedback) = 1, 'données des autres applis intactes';
end $$;

\echo '✓ Toutes les règles d''accès et d''isolation se comportent comme prévu'
