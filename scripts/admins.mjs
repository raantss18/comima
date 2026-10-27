#!/usr/bin/env node
// Liste des administrateurs de COMIMa (site et application).
//
//   Les e-mails vivent HORS de Git : release-keys/admins.txt (un par ligne, « # » pour un commentaire) ou, chiffré,
//   release-keys/admins.enc. Le dépôt (public) ne reçoit que des EMPREINTES SALÉES (public/admins.json), illisibles :
//   elles permettent à la page /admin de vérifier qu'un compte connecté est bien dans la liste, sans jamais publier un e-mail.
//
//   node scripts/admins.mjs              met à jour public/admins.json (empreintes) depuis la liste
//   node scripts/admins.mjs --sql        affiche le SQL à coller dans Supabase pour nommer les admins
//   node scripts/admins.mjs --encrypt    chiffre admins.txt en admins.enc (phrase secrète), puis supprime admins.txt
//   node scripts/admins.mjs --decrypt    redonne admins.txt à partir d'admins.enc (pour modifier la liste)
//   La phrase secrète : variable COMIMA_ADMINS_PASS, sinon demandée au clavier.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'release-keys');
const TXT = path.join(DIR, 'admins.txt');
const ENC = path.join(DIR, 'admins.enc');
const OUT = path.join(ROOT, 'public', 'admins.json');

export const normalise = (e) => String(e).trim().toLowerCase();
export const hashEmail = (salt, email) => crypto.createHash('sha256').update(`${salt}:${normalise(email)}`).digest('hex');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseList(text) {
  const out = [];
  for (const raw of String(text).split('\n')) {
    const l = raw.replace(/#.*/, '').trim();
    if (!l) continue;
    if (!EMAIL.test(l)) throw new Error(`adresse invalide : « ${l} »`);
    out.push(normalise(l));
  }
  return [...new Set(out)];
}

/** Chiffrement : scrypt (phrase → clé) + AES-256-GCM. Format : « COMIMA1 » + sel(16) + iv(12) + étiquette(16) + données. */
export function encrypt(plain, pass) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(pass, salt, 32);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return Buffer.concat([Buffer.from('COMIMA1'), salt, iv, c.getAuthTag(), data]);
}

export function decrypt(buf, pass) {
  if (buf.subarray(0, 7).toString() !== 'COMIMA1') throw new Error('fichier chiffré inconnu');
  const salt = buf.subarray(7, 23);
  const iv = buf.subarray(23, 35);
  const tag = buf.subarray(35, 51);
  const key = crypto.scryptSync(pass, salt, 32);
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(tag);
  try {
    return Buffer.concat([d.update(buf.subarray(51)), d.final()]).toString('utf8');
  } catch {
    throw new Error('phrase secrète incorrecte');
  }
}

async function passphrase() {
  if (process.env.COMIMA_ADMINS_PASS) return process.env.COMIMA_ADMINS_PASS;
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  const p = await new Promise((r) => rl.question('Phrase secrète : ', r));
  rl.close();
  if (!p) throw new Error('phrase secrète vide');
  return p;
}

async function readList() {
  if (fs.existsSync(TXT)) return parseList(fs.readFileSync(TXT, 'utf8'));
  if (fs.existsSync(ENC)) return parseList(decrypt(fs.readFileSync(ENC), await passphrase()));
  throw new Error('release-keys/admins.txt (ou admins.enc) introuvable : y écrire un e-mail par ligne');
}

async function main() {
  const arg = process.argv[2] ?? '';
  if (arg === '--encrypt') {
    if (!fs.existsSync(TXT)) throw new Error('release-keys/admins.txt introuvable');
    parseList(fs.readFileSync(TXT, 'utf8')); // validation avant de chiffrer
    fs.writeFileSync(ENC, encrypt(fs.readFileSync(TXT, 'utf8'), await passphrase()), { mode: 0o600 });
    fs.rmSync(TXT);
    console.log('✓ release-keys/admins.enc écrit ; admins.txt supprimé');
    return;
  }
  if (arg === '--decrypt') {
    fs.writeFileSync(TXT, decrypt(fs.readFileSync(ENC), await passphrase()), { mode: 0o600 });
    console.log('✓ release-keys/admins.txt recréé (à re-chiffrer après modification : --encrypt)');
    return;
  }
  const emails = await readList();
  if (arg === '--sql') {
    const list = emails.map((e) => `'${e.replace(/'/g, "''")}'`).join(', ');
    console.log(`-- À coller dans le SQL Editor de Supabase (après l'inscription des personnes dans l'application ou le site)\nupdate comima.profiles set role = 'admin'\nwhere id in (select id from auth.users where lower(email) in (${list}));`);
    return;
  }
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
  const salt = prev?.salt ?? crypto.randomBytes(16).toString('hex'); // sel conservé : les empreintes ne changent pas pour rien
  const hashes = emails.map((e) => hashEmail(salt, e)).sort();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ salt, hashes }, null, 2) + '\n');
  console.log(`✓ ${hashes.length} administrateur(s) → public/admins.json (empreintes salées, aucun e-mail)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  });
}
