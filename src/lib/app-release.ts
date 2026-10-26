/**
 * Dernière version de l'application Android, lue dans app/release.json (le fichier que
 * l'application elle-même consulte pour se mettre à jour). Les boutons du site pointent vers la
 * release GitHub marquée « latest » (adresses sans numéro de version, toujours la dernière) ;
 * le site n'affiche jamais le numéro de version : version et nouveautés sont sur GitHub.
 * Les copies servies par le site (/app/download/, scripts/fetch-app-apk.mjs) restent pour les
 * anciens liens.
 */
import fs from 'node:fs';
import path from 'node:path';

const REPO = 'https://github.com/raantss18/comima';
/** Page de la dernière version (nouveautés, fichiers) sur GitHub. */
export const releasesUrl = `${REPO}/releases/latest`;

export type Abi = 'arm64-v8a' | 'armeabi-v7a' | 'universal';

export interface AppDownload {
  abi: Abi;
  url: string;
  bytes: number;
  sha256: string;
}

export interface AppRelease {
  version: string;
  build: number;
  date: string;
  notes: { fr: string; en: string };
  downloads: AppDownload[];
  history: { version: string; date: string; notes: { fr: string; en: string } }[];
}

export function appRelease(): AppRelease | null {
  const file = path.join(process.cwd(), 'app', 'release.json');
  if (!fs.existsSync(file)) return null;
  const r = JSON.parse(fs.readFileSync(file, 'utf8'));
  const l = r.latest;
  return {
    version: l.version,
    build: l.build,
    date: l.date,
    notes: l.notes,
    downloads: (['arm64-v8a', 'armeabi-v7a', 'universal'] as Abi[])
      .filter((abi) => l.apks[abi])
      .map((abi) => ({
        abi,
        url: `${REPO}/releases/latest/download/comima-${abi}.apk`,
        bytes: l.apks[abi].bytes,
        sha256: l.apks[abi].sha256,
      })),
    history: [...(r.history ?? [])].reverse(),
  };
}

export const mo = (b: number, fr: boolean) => `${(b / 1048576).toFixed(1).replace('.', fr ? ',' : '.')} ${fr ? 'Mo' : 'MB'}`;
