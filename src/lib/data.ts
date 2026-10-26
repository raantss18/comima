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
  niveau: 'collège' | 'lycée' | 'prépa' | 'recherche';
  difficulte: number;
  /** 1–3 lycée, 4 universitaire, 5 recherche (ordre de la bibliothèque). */
  palier: number;
  /** Étape de la progression de l'année (1–7), sinon null. */
  progression: number | null;
  source: {
    concours?: string;
    annee?: number;
    pays?: string;
    reference?: string;
    url?: string;
    licence?: string;
  };
  sourceLabel: string;
  langue: string;
  tags: string[];
  a_solution: boolean;
  enonceTex: string;
  enonceTexEn: string;
  pdf: string;
  pdfEn: string;
  pdfSolution: string | null;
  tex: string;
  texEn: string;
  texSolution: string | null;
}

export interface SujetEntry {
  id: string;
  titre_fr: string;
  titre_en: string;
  source: {
    concours?: string;
    annee?: number;
    pays?: string;
    reference?: string;
    url?: string;
    licence?: string;
  };
  sourceLabel: string;
  langue: string;
  tags: string[];
  description_fr: string;
  description_en: string;
  epreuveTex: string;
  pdf: string;
  pdfSolution: string | null;
  /** Source téléchargeable : .tex (sujet compilé) ou sources.zip (PDF fourni), sinon null. */
  tex: string | null;
}

export interface CoursEntry {
  id: string;
  numero: number;
  titre_fr: string;
  titre_en: string;
  description_fr: string;
  description_en: string;
  pages: number | null;
  sourceLabel: string;
  tags: string[];
  pdf: string;
  /** Première page du chapitre dans le recueil (pagination continue). */
  pageDebut: number | null;
  /** Paquet .tex compilable (.zip) du chapitre. */
  texZip: string | null;
  /** Plan : sections numérotées ; `dest` = destination PDF (`cours.pdf#nameddest=<dest>`). */
  plan: CoursPlanItem[];
  /** Exercices inclus, dans l'ordre du PDF ; `numero` = numéro affiché (n.k). */
  exercices: CoursExercice[];
}

export interface CoursPlanItem {
  niveau: 1 | 2;
  numero: string;
  titre: string;
  slug: string;
  dest: string;
}

export interface CoursExercice {
  id: string;
  /** ex = exercice, exo = exercice guidé, pb = problème. */
  type: 'ex' | 'exo' | 'pb';
  numero: string;
  titre: string;
}

/** Titre LaTeX → texte brut (\texorpdfstring{a}{b} → b, signes $ retirés). */
export const texPlain = (s: string) =>
  s.replace(/\\texorpdfstring\{(?:[^{}]|\{[^{}]*\})*\}\{([^{}]*)\}/g, '$1').replace(/\$/g, '');

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

export const cours: CoursEntry[] = readJson<{ cours: CoursEntry[] }>('cours-index.json').cours;

/** Photothèque : chemins (sans base) de toutes les photos de public/uploads. */
export const photos: string[] = readJson<{ photos: string[] }>('photos-index.json').photos;

export const themes = [...new Set(exercices.flatMap((e) => e.theme))].sort();
export const niveaux = ['collège', 'lycée', 'prépa', 'recherche'] as const;

/** Un chapitre a une illustration animée si src/scripts/cours/<id>.ts existe. */
export const hasCoursFigure = (id: string) => fs.existsSync(path.join(process.cwd(), 'src', 'scripts', 'cours', `${id}.ts`));
