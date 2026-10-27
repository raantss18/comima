/**
 * Images d'aperçu de partage (Open Graph, 1200 × 630) générées au build par
 * scripts/build-og.mjs dans public/og/<type>/<id>-<lang>.jpg.
 */
export type OgKind = 'sim' | 'exo' | 'cours' | 'sujet' | 'news' | 'page' | 'notion';

export const ogPath = (kind: OgKind, id: string, lang: 'fr' | 'en') => `og/${kind}/${id}-${lang}.jpg`;
