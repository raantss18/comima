-- COMIMa — durcissement du serveur (audit du 14 nov. 2026).
-- Migration ADDITIVE et RÉ-EXÉCUTABLE : à exécuter APRÈS toutes les précédentes (SQL Editor, par Antsa).
-- Ne modifie aucune donnée existante : les contraintes nouvelles sont posées `NOT VALID` (les lignes déjà
-- en production ne bloquent jamais la migration) puis validées seulement si aucune ligne ne les viole ;
-- les codes d'invitation existants restent valables.
--
-- ATTENTION : `20261025000000_comptes.sql` redéfinit les fonctions et règles reprises ici. S'il est
-- relancé un jour, relancer ce fichier juste après.
--
--  1. Quotas : longueurs bornées et nombre de lignes par compte limité (réponses, marque-pages).
--  2. Statistiques : listes par thème, région et version limitées aux 30 premières.
--  3. Groupes : on n'entre dans un groupe que par son code (join_group) ; un encadreur retiré
--     (rôle repassé à « eleve ») perd l'accès à ses groupes et à leurs élèves.
--  4. Profil : un non-admin ne change ni `created_at` ni ne demande le rôle « admin ».
--  5. Codes d'invitation : 8 caractères tirés d'un générateur sûr, sans caractères ambigus ;
--     au plus 20 codes faux par heure et par compte.
--  6. Comptes anonymes (Supabase « anonymous sign-ins ») : ni inscription ni écriture.

-- ------------------------------------------------------------------ 6. comptes anonymes

-- Vrai si le jeton de connexion est celui d'un compte anonyme (auth.jwt() fourni par Supabase).
create or replace function comima.is_anonymous() returns boolean
  language sql stable set search_path = comima, pg_temp as
  $$ select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) $$;

-- Inscription : identique à 20261025000000_comptes.sql, sauf le refus des comptes anonymes.
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
  if comima.is_anonymous() then
    raise exception 'Connexion requise (compte anonyme refusé)';
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

-- ------------------------------------------------------------------ 4. profil protégé

-- Seul un admin change un rôle. Un non-admin ne change pas non plus la date de création, et ne peut
-- demander que le rôle « encadreur » (toute autre demande est effacée). Sans utilisateur connecté
-- (SQL Editor, service_role), tout reste permis.
create or replace function comima.protect_profile() returns trigger
  language plpgsql security definer set search_path = comima as
$$
begin
  if auth.uid() is not null and not comima.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Seul un admin peut changer un rôle';
    end if;
    new.created_at := old.created_at;
    if new.requested_role is distinct from 'encadreur'::comima.role then
      new.requested_role := null;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- ------------------------------------------------------------------ 1. réponses : longueurs et quota

-- Longueurs (les identifiants réels font moins de 40 caractères) et date de réponse pas dans le futur.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'attempts_longueurs' and conrelid = 'comima.attempts'::regclass) then
    alter table comima.attempts add constraint attempts_longueurs check (
      char_length(question_id) <= 160
      and (notion_id is null or char_length(notion_id) <= 120)
      and (theme is null or char_length(theme) <= 60)
      and (qtype is null or char_length(qtype) <= 30)) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'attempts_date' and conrelid = 'comima.attempts'::regclass) then
    alter table comima.attempts add constraint attempts_date check (answered_at < now() + interval '1 day') not valid;
  end if;
end $$;

-- Validées seulement si aucune ligne existante ne les viole (sinon elles restent NOT VALID :
-- appliquées aux nouvelles lignes seulement).
do $$ begin
  if not exists (select 1 from comima.attempts
                  where char_length(question_id) > 160 or char_length(notion_id) > 120
                     or char_length(theme) > 60 or char_length(qtype) > 30) then
    alter table comima.attempts validate constraint attempts_longueurs;
  end if;
  if not exists (select 1 from comima.attempts where answered_at >= now() + interval '1 day') then
    alter table comima.attempts validate constraint attempts_date;
  end if;
end $$;

create index if not exists attempts_user_received on comima.attempts (user_id, received_at desc);

-- Quota : au plus 3 000 réponses reçues par compte sur 24 heures glissantes (un élève assidu en
-- envoie quelques centaines ; le journal du téléphone est lui-même borné à 5 000). Au-delà, l'envoi
-- est refusé et l'application le retentera plus tard (rien n'est perdu sur le téléphone).
-- Un renvoi (même identifiant, ignoré par `on conflict`) ne compte pas. La date de réception est
-- toujours celle du serveur ; une date de réponse dans le futur (horloge du téléphone en avance) est
-- ramenée à maintenant. Sans utilisateur connecté (SQL Editor), pas de quota.
create or replace function comima.quota_attempts() returns trigger
  language plpgsql security definer set search_path = comima, pg_temp as
$$
declare
  n int;
begin
  new.received_at := now();
  if new.answered_at > now() then
    new.answered_at := now();
  end if;
  if auth.uid() is null then
    return new;
  end if;
  if exists (select 1 from comima.attempts where id = new.id) then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('comima.attempts:' || new.user_id::text, 0));
  select count(*) into n from (
    select 1 from comima.attempts
     where user_id = new.user_id and received_at > now() - interval '1 day'
     limit 3000) x;
  if n >= 3000 then
    raise exception 'Quota atteint : 3000 réponses par jour au plus';
  end if;
  return new;
end;
$$;

drop trigger if exists attempts_quota on comima.attempts;
create trigger attempts_quota
  before insert on comima.attempts
  for each row execute function comima.quota_attempts();

-- ------------------------------------------------------------------ 1. marque-pages : quota

-- Au plus 10 000 marque-pages par compte (un par exercice, cours ou sujet : la bibliothèque en compte
-- moins de 2 000). La mise à jour d'un marque-page existant (upsert) ne compte pas.
create or replace function comima.quota_marks() returns trigger
  language plpgsql security definer set search_path = comima, pg_temp as
$$
declare
  n int;
begin
  if auth.uid() is null then
    return new;
  end if;
  if exists (select 1 from comima.marks where user_id = new.user_id and item = new.item) then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('comima.marks:' || new.user_id::text, 0));
  select count(*) into n from (select 1 from comima.marks where user_id = new.user_id limit 10000) x;
  if n >= 10000 then
    raise exception 'Quota atteint : 10000 marque-pages au plus';
  end if;
  return new;
end;
$$;

drop trigger if exists marks_quota on comima.marks;
create trigger marks_quota
  before insert on comima.marks
  for each row execute function comima.quota_marks();

-- ------------------------------------------------------------------ 3. groupes

-- Un encadreur retiré (rôle repassé à « eleve ») n'encadre plus rien : is_coach() est vérifié à chaque appel.
create or replace function comima.coaches_group(gid uuid) returns boolean
  language sql stable security definer set search_path = comima as
  $$ select comima.is_coach() and exists (select 1 from comima.groups where id = gid and coach_id = auth.uid()) $$;

create or replace function comima.coaches(uid uuid) returns boolean
  language sql stable security definer set search_path = comima as
$$
  select comima.is_coach() and exists (
    select 1 from comima.group_members gm
    join comima.groups g on g.id = gm.group_id
    where gm.user_id = uid and g.coach_id = auth.uid()
  )
$$;

drop policy if exists "groupes : encadreur et membres" on comima.groups;
create policy "groupes : encadreur et membres" on comima.groups for select to authenticated
  using ((coach_id = auth.uid() and comima.is_coach()) or comima.is_admin() or comima.in_group(id));
drop policy if exists "groupes : créés par un encadreur" on comima.groups;
create policy "groupes : créés par un encadreur" on comima.groups for insert to authenticated
  with check (comima.is_coach() and coach_id = auth.uid() and not comima.is_anonymous());
drop policy if exists "groupes : gérés par leur encadreur" on comima.groups;
create policy "groupes : gérés par leur encadreur" on comima.groups for update to authenticated
  using ((coach_id = auth.uid() and comima.is_coach()) or comima.is_admin())
  with check ((coach_id = auth.uid() and comima.is_coach()) or comima.is_admin());
drop policy if exists "groupes : supprimés par leur encadreur" on comima.groups;
create policy "groupes : supprimés par leur encadreur" on comima.groups for delete to authenticated
  using ((coach_id = auth.uid() and comima.is_coach()) or comima.is_admin());

-- On n'entre dans un groupe que par son code (comima.join_group, qui contourne cette règle) ; un
-- admin peut encore ajouter quelqu'un à la main. L'encadreur garde le droit de retirer un membre
-- (règle de suppression inchangée, via coaches_group).
drop policy if exists "membres : ajoutés par l'encadreur" on comima.group_members;
drop policy if exists "membres : ajoutés par un admin (sinon par le code)" on comima.group_members;
create policy "membres : ajoutés par un admin (sinon par le code)" on comima.group_members for insert to authenticated
  with check (comima.is_admin() and not comima.is_anonymous());

-- ------------------------------------------------------------------ 6. règles d'insertion : pas de compte anonyme

drop policy if exists "tentatives : envoyer les siennes" on comima.attempts;
create policy "tentatives : envoyer les siennes" on comima.attempts for insert to authenticated
  with check (user_id = auth.uid() and not comima.is_anonymous());

drop policy if exists "marque-pages : envoyer les siens" on comima.marks;
create policy "marque-pages : envoyer les siens" on comima.marks for insert to authenticated
  with check (user_id = auth.uid() and not comima.is_anonymous());

drop policy if exists "propositions : déposées par les encadreurs" on comima.exercise_proposals;
create policy "propositions : déposées par les encadreurs" on comima.exercise_proposals for insert to authenticated
  with check (author_id = auth.uid() and comima.is_coach() and not comima.is_anonymous());

-- ------------------------------------------------------------------ 5. codes d'invitation

-- 8 caractères parmi 32 (sans I, O, 0 ni 1) tirés de gen_random_uuid() (générateur sûr du serveur,
-- sans extension) : 40 bits, contre 24 pour les anciens codes hexadécimaux, qui restent valables.
-- Octets 0 à 5, 10 et 11 de l'UUID : entièrement aléatoires (la version et la variante sont ailleurs).
create or replace function comima.new_join_code() returns text
  language sql volatile set search_path = comima, pg_temp as
$$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', get_byte(s.b, i) % 32 + 1, 1), '' order by i)
    from (select uuid_send(gen_random_uuid()) as b) s, unnest(array[0, 1, 2, 3, 4, 5, 10, 11]) as i
$$;

alter table comima.groups alter column join_code set default comima.new_join_code();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'groups_join_code_format' and conrelid = 'comima.groups'::regclass) then
    alter table comima.groups add constraint groups_join_code_format check (join_code ~ '^[A-Z0-9]{6,16}$') not valid;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from comima.groups where join_code !~ '^[A-Z0-9]{6,16}$') then
    alter table comima.groups validate constraint groups_join_code_format;
  end if;
end $$;

create or replace function comima.renew_group_code(p_group uuid) returns text
  language plpgsql security definer set search_path = comima as
$$
declare
  c text := comima.new_join_code();
begin
  if not (comima.coaches_group(p_group) or comima.is_admin()) then raise exception 'Réservé à l''encadreur'; end if;
  update comima.groups set join_code = c where groups.id = p_group;
  return c;
end;
$$;
revoke all on function comima.renew_group_code(uuid) from public;
grant execute on function comima.renew_group_code(uuid) to authenticated;

-- Codes faux récents (limite d'essais). Fermée à tous : seule join_group y écrit.
create table if not exists comima.join_failures (
  user_id   uuid not null references comima.profiles (id) on delete cascade,
  failed_at timestamptz not null default now()
);
create index if not exists join_failures_user on comima.join_failures (user_id, failed_at desc);
alter table comima.join_failures enable row level security;  -- aucune règle
revoke all on comima.join_failures from public, anon, authenticated;

-- Rejoindre un groupe avec son code. Au plus 20 codes faux par heure et par compte.
-- Un code faux doit être COMPTÉ, donc la transaction doit aboutir : la fonction ne lève pas d'erreur
-- mais renvoie une réponse d'erreur au format de l'API ({"message": "Code inconnu", …}) avec le
-- statut HTTP 400 (`response.status`, lu par PostgREST). L'application cherche « Code inconnu » dans
-- le message, comme avant. En cas de succès : {"id": …, "name": …} (l'application lit `name` dans un
-- objet comme dans une liste d'objets : toutes ses versions restent compatibles).
drop function if exists comima.join_group(text);
create function comima.join_group(p_code text) returns jsonb
  language plpgsql security definer set search_path = comima, pg_temp as
$$
declare
  uid uuid := auth.uid();
  g   comima.groups;
  n   int;
begin
  if uid is null or comima.is_anonymous() then raise exception 'Connexion requise'; end if;
  if not exists (select 1 from comima.profiles where profiles.id = uid) then
    raise exception 'Profil requis';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('comima.join_group:' || uid::text, 0));
  delete from comima.join_failures where failed_at < now() - interval '1 day';
  select count(*) into n from comima.join_failures where user_id = uid and failed_at > now() - interval '1 hour';
  if n >= 20 then
    raise exception 'Trop d''essais : réessayer dans une heure';
  end if;
  select * into g from comima.groups where join_code = upper(trim(p_code));
  if not found then
    insert into comima.join_failures (user_id) values (uid);
    perform set_config('response.status', '400', true);
    return jsonb_build_object('code', 'P0001', 'message', 'Code inconnu', 'details', null, 'hint', null);
  end if;
  insert into comima.group_members (group_id, user_id) values (g.id, uid) on conflict do nothing;
  return jsonb_build_object('id', g.id, 'name', g.name);
end;
$$;
revoke all on function comima.join_group(text) from public;
grant execute on function comima.join_group(text) to authenticated;

-- ------------------------------------------------------------------ 2. statistiques : listes bornées

-- Identique à 20261029000000_stats_sheet.sql (même signature, mêmes droits, même forme), sauf
-- par_version, par_region et par_theme : les 30 premiers seulement (valeurs libres envoyées par les
-- comptes ; sans borne, n'importe qui gonflerait le tableau).
create or replace function comima.stats_sheet(p_token text) returns jsonb
  language plpgsql stable security definer set search_path = comima, pg_temp as
$$
declare
  v_hash text := encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex');
begin
  if not exists (select 1 from comima.stats_acces where token_hash = v_hash) then
    raise exception 'jeton refusé' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'genere_le', now(),
    'comptes', jsonb_build_object(
      'total',        (select count(*) from comima.profiles),
      'eleves',       (select count(*) from comima.profiles where role = 'eleve'),
      'encadreurs',   (select count(*) from comima.profiles where role = 'encadreur'),
      'admins',       (select count(*) from comima.profiles where role = 'admin'),
      'encadreur_demande_non_valide', (select count(*) from comima.profiles where requested_role = 'encadreur' and role = 'eleve'),
      'nouveaux_7j',  (select count(*) from comima.profiles where created_at > now() - interval '7 days'),
      'actifs_7j',    (select count(*) from comima.profiles where last_seen_at > now() - interval '7 days'),
      'actifs_30j',   (select count(*) from comima.profiles where last_seen_at > now() - interval '30 days')),
    'par_version', coalesce((select jsonb_agg(jsonb_build_object('version', v, 'comptes', n) order by n desc, v)
                               from (select coalesce(app_version, 'inconnue') v, count(*) n from comima.profiles
                                      group by 1 order by 2 desc, 1 limit 30) x), '[]'),
    'par_region',  coalesce((select jsonb_agg(jsonb_build_object('region', v, 'comptes', n) order by n desc, v)
                               from (select coalesce(region, 'non renseignée') v, count(*) n from comima.profiles
                                      group by 1 order by 2 desc, 1 limit 30) x), '[]'),
    'par_centre',  coalesce((select jsonb_agg(jsonb_build_object('centre', v, 'comptes', n) order by n desc, v)
                               from (select coalesce(c.nom, 'sans centre') v, count(*) n
                                       from comima.profiles p left join comima.centres c on c.id = p.centre_id group by 1) x), '[]'),
    'par_naissance', coalesce((select jsonb_agg(jsonb_build_object('tranche', v, 'comptes', n) order by v)
                               from (select case when birth_year is null then 'non renseignée'
                                                 else (birth_year / 5 * 5)::text || '–' || (birth_year / 5 * 5 + 4)::text end v, count(*) n
                                       from comima.profiles group by 1) x), '[]'),
    'entrainement', jsonb_build_object(
      'reponses',      (select count(*) from comima.attempts),
      'reussies',      (select count(*) filter (where ok) from comima.attempts),
      'reponses_7j',   (select count(*) from comima.attempts where answered_at > now() - interval '7 days'),
      'eleves_actifs_7j', (select count(distinct user_id) from comima.attempts where answered_at > now() - interval '7 days')),
    'par_theme', coalesce((select jsonb_agg(jsonb_build_object('theme', v, 'reponses', n, 'reussies', r) order by n desc, v)
                             from (select coalesce(theme, 'autre') v, count(*) n, count(*) filter (where ok) r from comima.attempts
                                    group by 1 order by 2 desc, 1 limit 30) x), '[]'),
    'lectures', jsonb_build_object(
      'cours',   (select count(*) from comima.marks where item like 'cours:%' and status is not null),
      'exercices', (select count(*) from comima.marks where item like 'exo:%' and status is not null),
      'sujets',  (select count(*) from comima.marks where item like 'sujet:%' and status is not null),
      'etoiles', (select count(*) from comima.marks where starred)),
    'cours_les_plus_lus', coalesce((select jsonb_agg(jsonb_build_object('cours', v, 'lecteurs', n) order by n desc, v)
                             from (select substr(item, 7) v, count(*) n from comima.marks
                                    where item like 'cours:%' and status is not null group by 1 order by 2 desc limit 15) x), '[]'),
    'groupes', jsonb_build_object(
      'groupes',  (select count(*) from comima.groups),
      'membres',  (select count(*) from comima.group_members)),
    'propositions_exercices', (select count(*) from comima.exercise_proposals)
  );
end;
$$;
revoke all on function comima.stats_sheet(text) from public;
revoke execute on function comima.stats_sheet(text) from anon, authenticated;
