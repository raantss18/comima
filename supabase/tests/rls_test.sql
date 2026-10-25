-- Test des règles d'accès hors Supabase : imitation minimale de auth.* puis scénarios.
-- Lancer : supabase/tests/run.sh (PostgreSQL dans Docker).
\set ON_ERROR_STOP on
create schema auth;
create table auth.users (id uuid primary key, raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create role authenticated;
grant usage on schema public, auth to authenticated;
\i /migrations/20261025000000_comptes.sql
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Inscriptions : un élève, une élève, une encadreuse (demande), un admin.
insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a', '{"display_name":"Rova","birth_year":"2010","school":"Lycée X","region":"Analamanga","centre_id":"antananarivo"}'),
  ('00000000-0000-0000-0000-00000000000b', '{"display_name":"Hery","centre_id":"inconnu"}'),
  ('00000000-0000-0000-0000-00000000000c', '{"display_name":"Encadreuse","requested_role":"encadreur"}'),
  ('00000000-0000-0000-0000-00000000000d', '{"display_name":"Admin"}');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000d';

do $$ begin
  assert (select birth_year from public.profiles where display_name = 'Rova') = 2010, 'métadonnées';
  assert (select centre_id from public.profiles where display_name = 'Hery') is null, 'centre inconnu ignoré';
  assert (select role from public.profiles where display_name = 'Encadreuse') = 'eleve', 'rôle demandé non accordé';
end $$;

set role authenticated;

-- L'élève A ne voit que lui et ne peut pas se promouvoir.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
do $$ begin
  assert (select count(*) from public.profiles) = 1, 'élève : un seul profil visible';
  begin
    update public.profiles set role = 'admin' where id = auth.uid();
    raise exception 'ÉCHEC : promotion acceptée';
  exception when raise_exception then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;
  insert into public.attempts (id, user_id, question_id, ok, answered_at)
    values (gen_random_uuid(), auth.uid(), 'rs-01', true, now());
  begin
    insert into public.attempts (id, user_id, question_id, ok, answered_at)
      values (gen_random_uuid(), '00000000-0000-0000-0000-00000000000b', 'rs-01', true, now());
    raise exception 'ÉCHEC : tentative au nom d''un autre';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.exercise_proposals (author_id, titre_fr, enonce_tex, solution_tex)
      values (auth.uid(), 'Titre', 'Énoncé assez long', 'Solution assez longue');
    raise exception 'ÉCHEC : un élève a proposé un exercice';
  exception when insufficient_privilege then null;
  end;
end $$;

-- L'admin accorde le rôle d'encadreur.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
update public.profiles set role = 'encadreur' where display_name = 'Encadreuse';
do $$ begin assert (select count(*) from public.profiles) = 4, 'admin : tout voir'; end $$;

-- L'encadreuse crée un groupe avec A, voit A (et ses tentatives) mais pas B ; propose un exercice.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
do $$
declare g uuid;
begin
  insert into public.groups (name, coach_id) values ('Lycée X', auth.uid()) returning id into g;
  insert into public.group_members values (g, '00000000-0000-0000-0000-00000000000a');
  assert (select count(*) from public.profiles) = 2, 'encadreuse : elle-même + A';
  assert (select count(*) from public.attempts) = 1, 'encadreuse : tentatives de A';
  insert into public.exercise_proposals (author_id, titre_fr, enonce_tex, solution_tex, themes)
    values (auth.uid(), 'Une somme télescopique', '\[ \sum_{k=1}^n \frac{1}{k(k+1)} \]', 'On écrit $\frac1k - \frac1{k+1}$…', '{algèbre}');
  update public.exercise_proposals set status = 'accepte';
  assert (select status from public.exercise_proposals) = 'soumis', 'statut protégé';
end $$;

-- B ne voit ni A ni la proposition.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$ begin
  assert (select count(*) from public.profiles) = 1, 'B isolé';
  assert (select count(*) from public.exercise_proposals) = 0, 'propositions privées';
  assert (select count(*) from public.groups) = 0, 'groupes privés';
end $$;

-- L'admin relit et accepte ; l'auteur ne peut plus modifier.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
update public.exercise_proposals set status = 'accepte', review_comment = 'Merci !', published_id = 'alg-telescopique';
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
do $$ begin
  begin
    update public.exercise_proposals set titre_fr = 'Autre titre';
    raise exception 'ÉCHEC : modification après relecture';
  exception when raise_exception then
    if sqlerrm like 'ÉCHEC%' then raise; end if;
  end;
end $$;

\echo '✓ Toutes les règles d''accès se comportent comme prévu'
