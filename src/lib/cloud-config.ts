/**
 * Projet Supabase utilisé par le site (comptes et synchronisation, page Entraînement).
 * L'URL et la clé publique « anon » sont PUBLIQUES par nature (elles figurent aussi dans l'APK) :
 * la protection est dans les règles d'accès du serveur. Sources, par ordre :
 *   1. variables d'environnement COMIMA_SUPABASE_URL / COMIMA_SUPABASE_KEY (CI : variables du dépôt) ;
 *   2. release-keys/accounts.env (poste du mainteneur, ignoré par Git).
 * Sans configuration, le site n'affiche simplement aucune connexion.
 * Ne jamais y mettre la clé secrète « service_role ».
 */
import fs from 'node:fs';
import path from 'node:path';

export interface CloudConfig {
  url: string;
  key: string;
  origin: string;
}

function fromFile(): Record<string, string> {
  const file = path.join(process.cwd(), 'release-keys', 'accounts.env');
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
  );
}

export function cloudConfig(): CloudConfig | null {
  const f = fromFile();
  const url = (process.env.COMIMA_SUPABASE_URL || f.COMIMA_SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.COMIMA_SUPABASE_KEY || f.COMIMA_SUPABASE_KEY || '';
  if (!url.startsWith('https://') || !key) return null;
  // Garde-fou : une clé secrète ne doit jamais atteindre le navigateur.
  try {
    const role = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role;
    if (role && role !== 'anon') throw new Error(`clé « ${role} » refusée : seule la clé anon peut être publiée`);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('clé')) throw e;
  }
  if (key.startsWith('sb_secret_')) throw new Error('clé secrète refusée : seule la clé publique peut être publiée');
  return { url, key, origin: new URL(url).origin };
}
