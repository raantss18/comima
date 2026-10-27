-- Statistiques d'usage COMIMa : à coller dans le SQL Editor de Supabase (lecture seule, agrégats uniquement,
-- aucune adresse ni aucun nom). La localisation vient UNIQUEMENT de la région et du centre déclarés dans le profil :
-- jamais de la langue de l'appareil (« français » ne veut pas dire France) ni de l'adresse IP.
-- Les dates sont en UTC ; Madagascar est à UTC+3 (écart sans effet sur des fenêtres de 7 ou 30 jours).
-- Versions : depuis la 1.1.0 l'application envoie sa version à la synchronisation (colonne app_version) ; les comptes
-- qui n'ont pas encore mis à jour apparaissent comme « inconnue ».
select k, v from (
select 10 o, 'Comptes (auth)' k, count(*)::text v from auth.users
union all select 11, 'Comptes confirmés', count(*)::text from auth.users where email_confirmed_at is not null
union all select 12, 'Connexion ' || coalesce(raw_app_meta_data->>'provider','?'), count(*)::text from auth.users group by raw_app_meta_data->>'provider'
union all select 13, 'Comptes créés 7 derniers jours', count(*)::text from auth.users where created_at > now() - interval '7 days'
union all select 14, 'Connexions 7 derniers jours', count(*)::text from auth.users where last_sign_in_at > now() - interval '7 days'
union all select 20, 'Profils synchronisés', count(*)::text from comima.profiles
union all select 21, 'Rôle validé : ' || role::text, count(*)::text from comima.profiles group by role
union all select 22, 'Encadreurs demandés en attente de validation', count(*)::text from comima.profiles where requested_role = 'encadreur' and role = 'eleve'
union all select 23, 'Profils sans région', count(*)::text from comima.profiles where coalesce(region,'') = ''
union all select 30, 'Région : ' || coalesce(nullif(region,''),'(non renseignée)'), count(*)::text from comima.profiles group by region
union all select 31, 'Centre : ' || coalesce(c.nom, '(aucun)'), count(*)::text from comima.profiles p left join comima.centres c on c.id = p.centre_id group by c.nom
union all select 32, 'Naissance : ' || case when birth_year is null then '(non renseignée)' when birth_year >= 2011 then '2011 et après' when birth_year >= 2001 then '2001-2010' when birth_year >= 1991 then '1991-2000' else 'avant 1991' end, count(*)::text from comima.profiles group by 2
union all select 40, 'Comptes ayant envoyé des réponses', count(distinct user_id)::text from comima.attempts
union all select 41, 'Réponses reçues (total)', count(*)::text from comima.attempts
union all select 42, 'Réussite globale (%)', round(100.0 * avg(ok::int), 1)::text from comima.attempts
union all select 43, 'Comptes actifs 7 derniers jours (réponses)', count(distinct user_id)::text from comima.attempts where answered_at > now() - interval '7 days'
union all select 44, 'Comptes actifs 30 derniers jours (réponses)', count(distinct user_id)::text from comima.attempts where answered_at > now() - interval '30 days'
union all select 45, 'Première / dernière réponse', coalesce(min(answered_at)::date::text,'-') || ' / ' || coalesce(max(answered_at)::date::text,'-') from comima.attempts
union all select 46, 'Type de question : ' || coalesce(qtype,'?'), count(*)::text from comima.attempts group by qtype
union all select 47, 'Thème : ' || coalesce(theme,'?'), count(*)::text from comima.attempts group by theme
union all select 50, 'Comptes avec marque-pages', count(distinct user_id)::text from comima.marks
union all select 51, 'Marque-pages (total)', count(*)::text from comima.marks
union all select 52, 'Groupes', count(*)::text from comima.groups
union all select 53, 'Membres de groupes', count(*)::text from comima.group_members
union all select 54, 'Propositions d''exercices : ' || status::text, count(*)::text from comima.exercise_proposals group by status
) t order by o, k;

-- ---------------------------------------------------------------- lecture des cours, exercices et sujets (suivi automatique)
-- Ouvrir un cours, un exercice ou un sujet le marque « lu » (application et site) ; ces marques se synchronisent avec le compte.
select 'Éléments ' || split_part(item, ':', 1) || ' : ' || coalesce(status, '(étoile seule)') as k, count(*)::text as v
  from comima.marks group by split_part(item, ':', 1), status order by 1;
select 'Cours le plus lu : ' || item as k, count(distinct user_id)::text || ' compte(s)' as v
  from comima.marks where item like 'cours:%' and status is not null group by item order by count(distinct user_id) desc, item limit 10;
select 'Exercice le plus vu : ' || item as k, count(distinct user_id)::text || ' compte(s)' as v
  from comima.marks where item like 'exo:%' and status is not null group by item order by count(distinct user_id) desc, item limit 10;
select 'Sujet le plus vu : ' || item as k, count(distinct user_id)::text || ' compte(s)' as v
  from comima.marks where item like 'sujet:%' and status is not null group by item order by count(distinct user_id) desc, item limit 10;
select 'Notion la plus travaillée : ' || coalesce(notion_id, '?') as k, count(*)::text || ' réponses, ' || round(100.0 * avg(ok::int)) || ' % de réussite' as v
  from comima.attempts group by notion_id order by count(*) desc limit 10;

-- ---------------------------------------------------------------- version de l'application (1.1.0)
select coalesce(app_version, '(inconnue : avant la 1.1.0)') as k, count(*)::text || ' compte(s)' as v
  from comima.profiles group by app_version order by app_version desc nulls last;
select 'Actifs 7 derniers jours, version ' || coalesce(app_version, '?') as k, count(*)::text as v
  from comima.profiles where last_seen_at > now() - interval '7 days' group by app_version order by 1;
