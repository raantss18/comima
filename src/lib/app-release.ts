/**
 * Dernière version de l'application Android, lue dans app/release.json (le fichier que
 * l'application elle-même consulte pour se mettre à jour). Les APK sont servis par le site
 * (public/app/download/, copiés au déploiement par scripts/fetch-app-apk.mjs) ; s'ils sont
 * absents (build local), on renvoie vers la release GitHub.
 */
import fs from 'node:fs';
import path from 'node:path';
import { withBase } from './site';

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
  const served = (abi: Abi) => fs.existsSync(path.join(process.cwd(), 'public', 'app', 'download', `comima-${abi}.apk`));
  return {
    version: l.version,
    build: l.build,
    date: l.date,
    notes: l.notes,
    downloads: (['arm64-v8a', 'armeabi-v7a', 'universal'] as Abi[])
      .filter((abi) => l.apks[abi])
      .map((abi) => ({
        abi,
        url: served(abi) ? withBase(`app/download/comima-${abi}.apk`) : l.apks[abi].url,
        bytes: l.apks[abi].bytes,
        sha256: l.apks[abi].sha256,
      })),
    history: [...(r.history ?? [])].reverse(),
  };
}

export const mo = (b: number, fr: boolean) => `${(b / 1048576).toFixed(1).replace('.', fr ? ',' : '.')} ${fr ? 'Mo' : 'MB'}`;
