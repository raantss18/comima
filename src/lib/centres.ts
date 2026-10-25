/**
 * Centres (antennes) de COMIMa : source unique pour la page À propos, la page
 * Contact, le pied de page et les mentions légales.
 * Pour ouvrir un centre : ajouter une entrée (avec `article` = slug de l'actualité
 * qui l'annonce, si elle existe).
 */
import type { Lang } from '../i18n/ui';

export interface Centre {
  id: string;
  name: string;
  /** Slug de l'actualité liée (sans langue ni extension). */
  article?: string;
  note_fr?: string;
  note_en?: string;
}

export const centres: Centre[] = [
  { id: 'antananarivo', name: 'Antananarivo' },
  {
    id: 'antsiranana',
    name: 'Antsiranana',
    article: 'regroupements-antsiranana-octobre-2026',
    note_fr: 'Avec le club MahKinga, filiale indépendante de COMIMa : premier regroupement de l’année le 9 octobre 2026.',
    note_en: 'With the MahKinga club, COMIMa’s independent affiliate: first group session of the year on 9 October 2026.',
  },
  { id: 'ambositra', name: 'Ambositra' },
  {
    id: 'ambatondrazaka',
    name: 'Ambatondrazaka',
    article: 'premier-regroupement-ambatondrazaka-octobre-2026',
    note_fr:
      'Séance d’information des enseignants le 17 octobre, premier regroupement le 24 octobre 2026, accueillis par le lycée d’Ambatondrazaka.',
    note_en:
      'Teachers’ information session on 17 October, first group session on 24 October 2026, hosted by Ambatondrazaka’s lycée.',
  },
  {
    id: 'fianarantsoa',
    name: 'Fianarantsoa',
    article: 'premier-regroupement-fianarantsoa-octobre-2026',
    note_fr: 'En partenariat avec le club iMatematiko (École Normale Supérieure) : premier regroupement le 24 octobre 2026.',
    note_en: 'In partnership with the iMatematiko club (École Normale Supérieure): first group session on 24 October 2026.',
  },
];

/** « A, B, C et D » / « A, B, C and D ». */
export function centresList(lang: Lang, prefix = ''): string {
  const names = centres.map((c) => `${prefix}${c.name}`);
  const and = lang === 'fr' ? ' et ' : ' and ';
  return `${names.slice(0, -1).join(', ')}${and}${names.at(-1)}`;
}
