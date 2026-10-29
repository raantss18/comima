-- COMIMa 1.5.1 — statistiques agrégées pour le tableau de bord (Google Sheet, Apps Script).
-- Migration ADDITIVE et ré-exécutable. Rien de personnel n'en sort : uniquement des comptes (pas de nom,
-- d'e-mail, d'école ni de réponse). Accès par jeton : seul le hachage SHA-256 est stocké ici, jamais le jeton.
-- Un jeton se révoque en supprimant sa ligne de comima.stats_acces.

create table if not exists comima.stats_acces (
  nom        text primary key check (char_length(nom) between 1 and 40),
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);
alter table comima.stats_acces enable row level security;  -- aucune règle : ni anon ni authenticated n'y touchent
revoke all on comima.stats_acces from anon, authenticated;

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
                               from (select coalesce(app_version, 'inconnue') v, count(*) n from comima.profiles group by 1) x), '[]'),
    'par_region',  coalesce((select jsonb_agg(jsonb_build_object('region', v, 'comptes', n) order by n desc, v)
                               from (select coalesce(region, 'non renseignée') v, count(*) n from comima.profiles group by 1) x), '[]'),
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
                             from (select coalesce(theme, 'autre') v, count(*) n, count(*) filter (where ok) r from comima.attempts group by 1) x), '[]'),
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

-- Point d'entrée appelable par l'API (rpc/comima_stats_sheet) sans ouvrir le schéma comima à anon.
create or replace function public.comima_stats_sheet(p_token text) returns jsonb
  language sql stable security definer set search_path = comima, pg_temp as
  $$ select comima.stats_sheet(p_token) $$;
revoke all on function public.comima_stats_sheet(text) from public;
grant execute on function public.comima_stats_sheet(text) to anon, authenticated;
