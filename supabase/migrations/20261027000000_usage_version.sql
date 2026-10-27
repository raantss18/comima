-- COMIMa 1.1.0 — statistiques d'usage : version de l'application et dernière activité.
-- Migration ADDITIVE et ré-exécutable : s'exécute après les précédentes. Rien d'autre n'est collecté :
-- ni position, ni identifiant d'appareil, ni langue. (La localisation d'un élève, c'est la région et le centre
-- qu'il a lui-même choisis dans son profil.)

alter table comima.profiles add column if not exists app_version text check (char_length(app_version) <= 20);
alter table comima.profiles add column if not exists last_seen_at timestamptz;

-- L'application signale sa version à chaque synchronisation. Ne touche que le profil de l'appelant.
create or replace function comima.touch(p_app_version text) returns void
  language sql security definer set search_path = comima as
$$
  update comima.profiles
     set app_version = left(nullif(trim(p_app_version), ''), 20),
         last_seen_at = now()
   where id = auth.uid();
$$;
revoke all on function comima.touch(text) from public;
grant execute on function comima.touch(text) to authenticated;
