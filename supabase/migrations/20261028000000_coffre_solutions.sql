-- COMIMa 1.4.0 — coffre des solutions : textes des solutions d'exercices et explications des questions, lisibles
-- UNIQUEMENT par un encadreur ou un administrateur validés (rôle posé par le Bureau sur le serveur), jamais par un élève
-- ni par une personne sans compte. Les paquets publics de l'application et le site n'en contiennent plus rien.
-- Migration ADDITIVE et ré-exécutable ; à exécuter après les précédentes. Les écritures se font depuis le SQL Editor
-- (scripts/build-app-packs.mjs avec COMIMA_COFFRE_SQL=1 produit le fichier à coller) : aucune clé secrète dans l'application.

create table if not exists comima.coffre (
  -- « exo:<id d'exercice> » (solution) ou « q:<id de question> » (explication).
  item       text primary key check (item ~ '^(exo|q):[A-Za-z0-9._:-]{1,160}$'),
  -- {"fr": "...", "en": "..."} : LaTeX / Markdown tels qu'écrits par les auteurs.
  contenu    jsonb not null,
  updated_at timestamptz not null default now()
);

alter table comima.coffre enable row level security;

drop policy if exists coffre_lecture on comima.coffre;
create policy coffre_lecture on comima.coffre for select to authenticated using (comima.is_coach());

-- Aucune écriture par l'application (le SQL Editor / service_role contournent ces règles).
revoke insert, update, delete, truncate on comima.coffre from authenticated;
revoke all on comima.coffre from anon;
