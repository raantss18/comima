-- Marque-pages des élèves (version 0.6.0) : où en est l'élève sur chaque exercice, problème, sujet
-- et cours des bibliothèques. Migration ADDITIVE et RÉ-EXÉCUTABLE : elle ajoute une table au
-- schéma `comima`, sans toucher à aucune table, fonction ou règle existante, ni au schéma `public`.
-- Les anciennes versions de l'application ne la connaissent pas et n'en ont pas besoin.
-- À exécuter dans le SQL Editor APRÈS 20261025000000_comptes.sql (voir supabase/README.md).

create table if not exists comima.marks (
  user_id    uuid not null references comima.profiles (id) on delete cascade,
  -- « exo:<id> », « cours:<id> » ou « sujet:<id> » (mêmes identifiants que le site).
  item       text not null check (item ~ '^(exo|cours|sujet):[A-Za-z0-9._-]{1,120}$'),
  -- Absent (null) = pas encore vu, donc « non fait ».
  status     text check (status in ('lu', 'teste', 'continuer', 'fait')),
  starred    boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, item)
);

create index if not exists marks_user on comima.marks (user_id);

-- « Le plus récent gagne » : une mise à jour plus ancienne que la ligne enregistrée est ignorée
-- (un téléphone resté hors ligne ne doit pas écraser une modification faite depuis un autre appareil).
create or replace function comima.keep_newest_mark() returns trigger
  language plpgsql set search_path = comima as
$$
begin
  if new.updated_at < old.updated_at then
    return old;
  end if;
  new.user_id := old.user_id;
  new.item := old.item;
  return new;
end;
$$;

drop trigger if exists marks_newest on comima.marks;
create trigger marks_newest
  before update on comima.marks
  for each row execute function comima.keep_newest_mark();

alter table comima.marks enable row level security;

-- Chacun gère les siens ; l'encadreur lit ceux de ses élèves (comme les réponses) ; les admins lisent tout.
drop policy if exists "marque-pages : envoyer les siens" on comima.marks;
create policy "marque-pages : envoyer les siens" on comima.marks for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "marque-pages : modifier les siens" on comima.marks;
create policy "marque-pages : modifier les siens" on comima.marks for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "marque-pages : supprimer les siens" on comima.marks;
create policy "marque-pages : supprimer les siens" on comima.marks for delete to authenticated
  using (user_id = auth.uid());
drop policy if exists "marque-pages : soi, son encadreur, les admins" on comima.marks;
create policy "marque-pages : soi, son encadreur, les admins" on comima.marks for select to authenticated
  using (user_id = auth.uid() or comima.coaches(user_id) or comima.is_admin());

grant select, insert, update, delete on comima.marks to authenticated;
