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
-- Marque-pages (0.6.0) : migration additive, elle aussi ré-exécutable.
\i /migrations/20261026000000_marque_pages.sql
\i /migrations/20261026000000_marque_pages.sql
-- Codes d'invitation des groupes (0.7.0) : additive, ré-exécutable.
\i /migrations/20261026010000_groupes_codes.sql
\i /migrations/20261026010000_groupes_codes.sql
-- Version de l'application (1.1.0) : additive, ré-exécutable.
\i /migrations/20261027000000_usage_version.sql
\i /migrations/20261027000000_usage_version.sql
-- Coffre des solutions (1.4.0) : additif, ré-exécutable.
\i /migrations/20261028000000_coffre_solutions.sql
\i /migrations/20261028000000_coffre_solutions.sql
\i /migrations/20261029000000_stats_sheet.sql
\i /migrations/20261029000000_stats_sheet.sql

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

-- ------------------------------------------------------------------ marque-pages (0.6.0)

-- A pose des marque-pages ; B n'en voit aucun de A ; l'encadreuse C voit ceux de son élève A.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
insert into comima.marks (user_id, item, status, starred, updated_at)
  values (auth.uid(), 'exo:engel-09-15', 'fait', true, '2026-10-26 10:00:00+00'),
         (auth.uid(), 'cours:03-principe-des-tiroirs', 'continuer', false, '2026-10-26 10:00:00+00');
do $$ begin
  begin
    insert into comima.marks (user_id, item, status) values (auth.uid(), 'exo:engel-09-16', 'nimporte');
    raise exception 'ÉCHEC : état inconnu accepté';
  exception when check_violation then null; end;
  begin
    insert into comima.marks (user_id, item, status) values (auth.uid(), 'dossier:x', 'lu');
    raise exception 'ÉCHEC : élément inconnu accepté';
  exception when check_violation then null; end;
  begin
    insert into comima.marks (user_id, item, status) values ('00000000-0000-0000-0000-00000000000b', 'exo:x', 'lu');
    raise exception 'ÉCHEC : marque-page au nom d''un autre';
  exception when insufficient_privilege then null; end;
end $$;

-- « Le plus récent gagne » : une mise à jour plus ancienne est ignorée, une plus récente est prise.
insert into comima.marks (user_id, item, status, starred, updated_at)
  values (auth.uid(), 'exo:engel-09-15', 'lu', false, '2026-10-26 09:00:00+00')
  on conflict (user_id, item) do update set status = excluded.status, starred = excluded.starred, updated_at = excluded.updated_at;
do $$ begin
  assert (select status from comima.marks where item = 'exo:engel-09-15') = 'fait', 'mise à jour plus ancienne ignorée';
end $$;
insert into comima.marks (user_id, item, status, starred, updated_at)
  values (auth.uid(), 'exo:engel-09-15', null, true, '2026-10-26 11:00:00+00')
  on conflict (user_id, item) do update set status = excluded.status, starred = excluded.starred, updated_at = excluded.updated_at;
do $$ begin
  assert (select status from comima.marks where item = 'exo:engel-09-15') is null, 'mise à jour plus récente prise (état retiré)';
  assert (select starred from comima.marks where item = 'exo:engel-09-15'), 'étoile conservée';
  assert (select count(*) from comima.marks) = 2, 'A voit ses deux marque-pages';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$ begin assert (select count(*) from comima.marks) = 0, 'B ne voit pas les marque-pages de A'; end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
do $$ begin assert (select count(*) from comima.marks) = 2, 'l''encadreuse voit les marque-pages de son élève'; end $$;
-- ... mais ne peut ni les modifier ni les supprimer.
update comima.marks set status = 'lu';
delete from comima.marks;
do $$ begin assert (select count(*) from comima.marks where status = 'continuer') = 1, 'l''encadreuse ne modifie ni ne supprime'; end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
do $$ begin assert (select count(*) from comima.marks) = 0, 'sans profil : aucun marque-page visible'; end $$;

-- ---------------------------------------------------------------- codes d'invitation (0.7.0)
-- B rejoint le groupe de l'encadreuse C avec son code ; il devient visible de C.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
create temp table t_code as select join_code as code, id as gid from comima.groups limit 1;
grant select on t_code to authenticated;
do $$ begin assert (select length(code) from t_code) = 6, 'code à 6 caractères'; end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$ begin
  begin perform comima.join_group('ZZZZZZ'); assert false, 'code inconnu accepté';
  exception when others then if sqlerrm not like 'Code inconnu%' then raise; end if; end;
  perform comima.join_group(lower((select code from t_code)));
  perform comima.join_group((select code from t_code)); -- deux fois : pas d'erreur, pas de doublon
  assert (select count(*) from comima.group_members where user_id = auth.uid()) = 1, 'B est membre une seule fois';
end $$;
-- E (sans profil COMIMa) ne peut pas rejoindre.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
do $$ begin
  begin perform comima.join_group((select code from t_code)); assert false, 'sans profil accepté';
  exception when others then if sqlerrm not like 'Profil requis%' then raise; end if; end;
end $$;
-- Seul l'encadreur renouvelle le code ; l'ancien cesse de marcher.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$ begin
  begin perform comima.renew_group_code((select gid from t_code)); assert false, 'élève a renouvelé le code';
  exception when others then if sqlerrm not like 'Réservé%' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
do $$ declare c text; begin
  c := comima.renew_group_code((select gid from t_code));
  assert c <> (select code from t_code), 'nouveau code différent';
  assert (select join_code from comima.groups where id = (select gid from t_code)) = c, 'code enregistré';
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$ begin
  begin perform comima.join_group((select code from t_code)); assert false, 'ancien code encore valide';
  exception when others then if sqlerrm not like 'Code inconnu%' then raise; end if; end;
end $$;

-- ---------------------------------------------------------------- tentatives d'attaque (sécurité, 0.8.1)
reset role;
insert into auth.users values ('00000000-0000-0000-0000-00000000000f', '{"display_name":"Fara"}');
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
select comima.register('Fara', null, null, null, 'antananarivo');
insert into comima.marks (user_id, item, status) values (auth.uid(), 'exo:secret-de-fara', 'fait');
insert into comima.attempts (id, user_id, question_id, ok, answered_at)
  values (gen_random_uuid(), auth.uid(), 'q-f', true, now());

-- B (élève, membre du groupe de C) essaie d'élargir ses droits.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$ declare n int; begin
  -- 1. ajouter quelqu'un d'autre dans un groupe
  begin
    insert into comima.group_members (group_id, user_id) select id, '00000000-0000-0000-0000-00000000000f' from comima.groups limit 1;
    assert false, 'B a ajouté F à un groupe';
  exception when others then if sqlstate <> '42501' then raise; end if; end;
  -- 2. créer un groupe sans être encadreur
  begin
    insert into comima.groups (name, coach_id) values ('Faux groupe', auth.uid());
    assert false, 'un élève a créé un groupe';
  exception when others then if sqlstate <> '42501' then raise; end if; end;
  -- 3. modifier ou supprimer le groupe de l'encadreuse : aucune ligne touchée
  update comima.groups set name = 'piraté';
  get diagnostics n = row_count; assert n = 0, 'B a modifié un groupe';
  delete from comima.groups;
  get diagnostics n = row_count; assert n = 0, 'B a supprimé un groupe';
  -- 4. se donner un rôle
  begin
    update comima.profiles set role = 'admin' where id = auth.uid();
    assert false, 'B s''est fait admin';
  exception when others then if sqlstate = 'P0004' then raise; end if; end;
  begin
    update comima.profiles set role = 'encadreur' where id = auth.uid();
    assert false, 'B s''est fait encadreur';
  exception when others then if sqlstate = 'P0004' then raise; end if; end;
  -- 5. voir les profils, réponses et marque-pages des autres
  assert (select count(*) from comima.profiles) = 1, 'B voit d''autres profils';
  assert (select count(*) from comima.marks where user_id <> auth.uid()) = 0, 'B voit les marque-pages d''autrui';
  assert (select count(*) from comima.attempts where user_id <> auth.uid()) = 0, 'B voit les réponses d''autrui';
  -- 6. écrire au nom d'un autre
  begin
    insert into comima.marks (user_id, item, status) values ('00000000-0000-0000-0000-00000000000f', 'exo:x', 'lu');
    assert false, 'B a écrit un marque-page pour F';
  exception when others then if sqlstate <> '42501' then raise; end if; end;
  begin
    insert into comima.attempts (id, user_id, question_id, ok, answered_at)
      values (gen_random_uuid(), '00000000-0000-0000-0000-00000000000f', 'q', true, now());
    assert false, 'B a écrit une réponse pour F';
  exception when others then if sqlstate <> '42501' then raise; end if; end;
  -- 7. changer le propriétaire d'un marque-page
  update comima.marks set user_id = '00000000-0000-0000-0000-00000000000f';
end $$;

-- C (encadreuse) ne voit que les élèves de ses groupes : pas F, qui n'est dans aucun groupe.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
do $$ begin
  assert (select count(*) from comima.profiles where id = '00000000-0000-0000-0000-00000000000f') = 0, 'C voit un profil hors de ses groupes';
  assert (select count(*) from comima.marks where user_id = '00000000-0000-0000-0000-00000000000f') = 0, 'C voit les marque-pages de F';
  assert (select count(*) from comima.attempts where user_id = '00000000-0000-0000-0000-00000000000f') = 0, 'C voit les réponses de F';
  -- ... et elle ne peut ni renommer le profil d'un élève ni modifier ses marque-pages
  update comima.profiles set display_name = 'x' where id = '00000000-0000-0000-0000-00000000000b';
  assert (select display_name from comima.profiles where id = '00000000-0000-0000-0000-00000000000b') <> 'x', 'C a renommé un élève';
end $$;

-- B quitte le groupe : C ne voit plus ses marque-pages.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
insert into comima.marks (user_id, item, status) values (auth.uid(), 'exo:de-b', 'lu') on conflict do nothing;
delete from comima.group_members where user_id = auth.uid();
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
do $$ begin
  assert (select count(*) from comima.marks where user_id = '00000000-0000-0000-0000-00000000000b') = 0, 'C voit encore B après son départ';
end $$;

-- 1.4.0 : coffre des solutions — lu par l'encadreur validé et l'admin, jamais par un élève ni par anon ; aucune écriture.
reset role;
insert into comima.coffre (item, contenu) values ('exo:essai', '{"fr":"solution secrète"}'), ('q:essai', '{"fr":"explication secrète"}');
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$ begin
  assert (select count(*) from comima.coffre) = 0, 'ÉCHEC : un élève lit le coffre';
  begin insert into comima.coffre (item, contenu) values ('exo:pirate', '{}'); raise exception 'ÉCHEC : un élève écrit dans le coffre';
  exception when insufficient_privilege then null; end;
  begin perform comima.is_coach(); end;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
do $$ begin
  assert (select count(*) from comima.coffre) = 2, 'ÉCHEC : l''encadreur ne lit pas le coffre';
  begin update comima.coffre set contenu = '{}'; raise exception 'ÉCHEC : un encadreur modifie le coffre';
  exception when insufficient_privilege then null; end;
  begin delete from comima.coffre; raise exception 'ÉCHEC : un encadreur vide le coffre';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
do $$ begin assert (select count(*) from comima.coffre) = 2, 'ÉCHEC : l''admin ne lit pas le coffre'; end $$;
set role anon;
do $$ begin
  begin perform count(*) from comima.coffre; raise exception 'ÉCHEC : anon lit le coffre';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set role authenticated;

-- 1.1.0 : `touch` ne modifie que le profil de l'appelant ; anon ne peut pas l'appeler.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
select comima.touch('1.1.0');
do $$ begin
  assert (select app_version from comima.profiles where id = '00000000-0000-0000-0000-00000000000b') = '1.1.0', 'touch : version non enregistrée';
  assert (select last_seen_at from comima.profiles where id = '00000000-0000-0000-0000-00000000000b') is not null, 'touch : dernière activité absente';
  assert (select count(*) from comima.profiles where app_version is not null) = 1, 'touch a modifié un autre profil';
end $$;
select comima.touch('1.1.0-' || repeat('x', 50));
do $$ begin
  assert char_length((select app_version from comima.profiles where id = '00000000-0000-0000-0000-00000000000b')) = 20, 'touch : version non bornée';
end $$;
set role anon;
do $$ begin
  begin perform comima.touch('9.9.9'); raise exception 'ÉCHEC : anon a pu appeler touch';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set role authenticated;

-- A supprime son profil COMIMa : ses tentatives disparaissent, son compte (auth.users) reste.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
delete from comima.profiles where id = auth.uid();
reset role;
do $$ begin
  assert (select count(*) from comima.attempts where user_id = '00000000-0000-0000-0000-00000000000a') = 0, 'tentatives supprimées avec le profil';
  assert (select count(*) from comima.marks where user_id = '00000000-0000-0000-0000-00000000000a') = 0, 'marque-pages supprimés avec le profil';
  assert (select count(*) from auth.users where id = '00000000-0000-0000-0000-00000000000a') = 1, 'compte conservé';
  assert (select count(*) from public.feedback) = 1, 'données des autres applis intactes';
end $$;

-- 1.5.1 : statistiques agrégées par jeton — refusées sans jeton valide, sans donnée personnelle, table des jetons fermée.
insert into comima.stats_acces (nom, token_hash) values ('essai', encode(sha256(convert_to('jeton-de-test', 'UTF8')), 'hex'));
set role anon;
do $$ declare r jsonb; begin
  begin perform public.comima_stats_sheet('mauvais'); raise exception 'ÉCHEC : mauvais jeton accepté';
  exception when insufficient_privilege then null; end;
  begin perform public.comima_stats_sheet(null); raise exception 'ÉCHEC : jeton nul accepté';
  exception when insufficient_privilege then null; end;
  r := public.comima_stats_sheet('jeton-de-test');
  assert (r->'comptes'->>'total')::int >= 1, 'stats : comptes absents';
  assert r::text !~ '@', 'ÉCHEC : une adresse e-mail dans les statistiques';
  begin perform comima.stats_sheet('jeton-de-test'); raise exception 'ÉCHEC : anon appelle la fonction interne';
  exception when insufficient_privilege then null; end;
  begin perform count(*) from comima.stats_acces; raise exception 'ÉCHEC : anon lit la table des jetons';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set role authenticated;
do $$ begin
  begin perform count(*) from comima.stats_acces; raise exception 'ÉCHEC : un compte lit la table des jetons';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

\echo '✓ Toutes les règles d''accès et d''isolation se comportent comme prévu'
