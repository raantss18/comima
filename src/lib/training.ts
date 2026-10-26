/**
 * Entraînement sur le site : les mêmes notions et questions que l'application
 * (content/app/notions/*.yaml), corrigées dans le navigateur par le même moteur Rust
 * compilé en WebAssembly (public/app/engine.wasm).
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import type { Lang } from '../i18n/ui';

export type Bi = { fr: string; en: string };

export interface Notion {
  id: string;
  theme: string;
  niveau: number;
  chapitre?: string;
  titre: Bi;
  fiche: Bi;
  questions: Record<string, unknown>[];
}

const DIR = path.join(process.cwd(), 'content', 'app', 'notions');
const THEMES = ['algèbre', 'géométrie', 'arithmétique', 'combinatoire', 'analyse', 'informatique'];

export const notions: Notion[] = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => YAML.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) as Notion)
  .sort((a, b) => THEMES.indexOf(a.theme) - THEMES.indexOf(b.theme) || a.niveau - b.niveau || a.id.localeCompare(b.id));

/** Une notion a une illustration animée si src/scripts/fiche/<id>.ts existe. */
export const hasFicheFigure = (id: string) => fs.existsSync(path.join(process.cwd(), 'src', 'scripts', 'fiche', `${id}.ts`));

export const notionById = (id: string) => notions.find((n) => n.id === id);

export const themeLabel: Record<string, Bi> = {
  algèbre: { fr: 'Algèbre', en: 'Algebra' },
  géométrie: { fr: 'Géométrie', en: 'Geometry' },
  arithmétique: { fr: 'Arithmétique', en: 'Number theory' },
  combinatoire: { fr: 'Combinatoire', en: 'Combinatorics' },
  analyse: { fr: 'Analyse', en: 'Analysis' },
  informatique: { fr: 'Informatique', en: 'Computer science' },
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Markdown léger → HTML (paragraphes, listes, gras, code) ; les formules restent pour KaTeX. */
export function md(src: string): string {
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  return src
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split('\n');
      if (lines.every((l) => /^\s*(-|\d+\.)\s/.test(l) || /^\s{2,}\S/.test(l))) {
        const ordered = /^\s*\d+\./.test(lines[0]);
        const items: string[] = [];
        for (const l of lines) {
          if (/^\s*(-|\d+\.)\s/.test(l)) items.push(l.replace(/^\s*(-|\d+\.)\s+/, ''));
          else items[items.length - 1] += ' ' + l.trim();
        }
        const tag = ordered ? 'ol' : 'ul';
        return `<${tag}>${items.map((i) => `<li>${inline(i)}</li>`).join('')}</${tag}>`;
      }
      return `<p>${inline(lines.join(' '))}</p>`;
    })
    .join('');
}

/** Données envoyées au navigateur : textes de la langue choisie, Markdown déjà converti. */
export function clientQuestions(n: Notion, lang: Lang) {
  const tr = (v: unknown) => (v && typeof v === 'object' && lang in (v as object) ? (v as Bi)[lang] : v);
  return n.questions.map((q) => {
    const out: Record<string, unknown> = { ...q };
    delete out.reference; // solution de l'auteur (questions de code) : jamais envoyée au navigateur
    if (q.squelette) out.squelette = String(tr(q.squelette));
    for (const k of ['enonce', 'explication', 'indice', 'texte']) if (q[k]) out[`${k}Html`] = md(String(tr(q[k])));
    if (Array.isArray(q.choix)) out.choixHtml = q.choix.map((c) => md(String(tr(c))));
    if (Array.isArray(q.etapes)) out.etapesHtml = q.etapes.map((c) => md(String(tr(c))));
    if (Array.isArray(q.intrus)) out.intrusHtml = q.intrus.map((c) => md(String(tr(c))));
    return out;
  });
}
