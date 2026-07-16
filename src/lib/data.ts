// Lecture (au build) des index générés par scripts/build-index.mjs.
// `npm run dev` et `npm run build` exécutent le script au préalable
// (hooks predev/prebuild), les fichiers existent donc toujours ici.
import fs from 'node:fs';
import path from 'node:path';

export interface ExerciceEntry {
  id: string;
  titre_fr: string;
  titre_en: string;
  theme: string[];
  niveau: 'collège' | 'lycée' | 'prépa';
  difficulte: number;
  source: { concours?: string; annee?: number; pays?: string };
  sourceLabel: string;
  langue: string;
  tags: string[];
  a_solution: boolean;
  enonceTex: string;
  pdf: string;
  pdfSolution: string | null;
  tex: string;
  texSolution: string | null;
}

export interface SujetEntry {
  id: string;
  titre_fr: string;
  titre_en: string;
  source: { concours?: string; annee?: number; pays?: string };
  sourceLabel: string;
  langue: string;
  tags: string[];
  description_fr: string;
  description_en: string;
  epreuveTex: string;
  pdf: string;
  pdfSolution: string | null;
  tex: string;
}

function readJson<T>(name: string): T {
  const p = path.join(process.cwd(), 'public', 'data', name);
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

export const exercices: ExerciceEntry[] = readJson<{ exercices: ExerciceEntry[] }>(
  'exercices-index.json'
).exercices;

export const sujets: SujetEntry[] = readJson<{ sujets: SujetEntry[] }>(
  'sujets-index.json'
).sujets;

export const themes = [...new Set(exercices.flatMap((e) => e.theme))].sort();
export const niveaux = ['collège', 'lycée', 'prépa'] as const;
