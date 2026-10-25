/**
 * Partenaires et collaborateurs de COMIMa : source unique pour la bande de logos
 * du pied de page, la diapo d'accueil et la page À propos.
 * Pour en ajouter un : déposer son logo dans public/ et ajouter une entrée ici.
 */
export interface Partner {
  id: string;
  name: string;
  url: string;
  /** Chemin (sans base) du logo dans public/. */
  logo: string;
}

export const partners: Partner[] = [
  { id: 'animath', name: 'Animath', url: 'https://www.animath.fr', logo: 'logo-animath.png' },
  {
    id: 'fianarako',
    name: 'Fianarako',
    url: 'https://www.facebook.com/share/1UiHCjL5aA/',
    logo: 'logo-fianarako.png',
  },
  {
    id: 'campus-france',
    name: 'Campus France',
    url: 'https://www.campusfrance.org',
    logo: 'logo-campus-france.png',
  },
  {
    id: 'aemia',
    name: 'AEMIA',
    url: 'https://www.facebook.com/share/1HsWqbc3b1/',
    logo: 'logo-aemia.jpg',
  },
];

export const partnerUrl = (id: string) => partners.find((p) => p.id === id)!.url;
