-- COMIMa 0.7.0 — codes d'invitation des groupes (vue encadreur).
-- Migration ADDITIVE et ré-exécutable : s'exécute après `20261025000000_comptes.sql`.
-- Un élève rejoint un groupe avec le code donné par son encadreur ; l'encadreur voit alors
-- ses marque-pages (règles déjà en place : `comima.coaches(user_id)`).

alter table comima.groups add column if not exists join_code text;
update comima.groups set join_code = upper(substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 6))
  where join_code is null;
alter table comima.groups alter column join_code set default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
alter table comima.groups alter column join_code set not null;
create unique index if not exists groups_join_code on comima.groups (join_code);

-- Rejoindre un groupe avec son code (le profil COMIMa doit exister).
create or replace function comima.join_group(p_code text)
  returns table (id uuid, name text)
  language plpgsql security definer set search_path = comima as
$$
declare
  g comima.groups;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  if not exists (select 1 from comima.profiles where profiles.id = auth.uid()) then
    raise exception 'Profil requis';
  end if;
  select * into g from comima.groups where join_code = upper(trim(p_code));
  if not found then raise exception 'Code inconnu'; end if;
  insert into comima.group_members (group_id, user_id) values (g.id, auth.uid()) on conflict do nothing;
  return query select g.id, g.name;
end;
$$;
revoke all on function comima.join_group(text) from public;
grant execute on function comima.join_group(text) to authenticated;

-- Nouveau code pour un groupe (l'encadreur du groupe ou un admin) : l'ancien cesse de marcher.
create or replace function comima.renew_group_code(p_group uuid) returns text
  language plpgsql security definer set search_path = comima as
$$
declare
  c text := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
begin
  if not (comima.coaches_group(p_group) or comima.is_admin()) then raise exception 'Réservé à l''encadreur'; end if;
  update comima.groups set join_code = c where groups.id = p_group;
  return c;
end;
$$;
revoke all on function comima.renew_group_code(uuid) from public;
grant execute on function comima.renew_group_code(uuid) to authenticated;
