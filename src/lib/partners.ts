/**
 * Partenaires et collaborateurs de COMIMa : source unique pour la page
 * « Partenaires », la section de l'accueil, la bande de logos du pied de page
 * et la page À propos.
 * Pour en ajouter un : logo dans public/ + une entrée ici (avec sa catégorie).
 */
export type GroupId = 'coeur' | 'partenaires' | 'etudiants' | 'locales';

export interface Partner {
  id: string;
  name: string;
  url: string;
  /** Chemin (sans base) du logo dans public/. */
  logo: string;
  group: GroupId;
  role_fr: string;
  role_en: string;
  text_fr: string;
  text_en: string;
}

export interface Group {
  id: GroupId;
  title_fr: string;
  title_en: string;
  intro_fr: string;
  intro_en: string;
}

export const groups: Group[] = [
  {
    id: 'coeur',
    title_fr: 'Le cœur',
    title_en: 'The heart',
    intro_fr: 'L’association nationale, autour de laquelle tout s’organise.',
    intro_en: 'The national association around which everything is organised.',
  },
  {
    id: 'partenaires',
    title_fr: 'Partenaires et sponsors',
    title_en: 'Partners and sponsors',
    intro_fr: 'Ceux qui soutiennent le club : accompagnement, financement, appui technique.',
    intro_en: 'Those who support the club: guidance, funding, technical help.',
  },
  {
    id: 'etudiants',
    title_fr: 'Appui aux encadrants',
    title_en: 'Support for coaches',
    intro_fr: 'Les étudiants qui donnent un coup de main aux encadrants.',
    intro_en: 'The students who lend a hand to the coaches.',
  },
  {
    id: 'locales',
    title_fr: 'Associations des centres',
    title_en: 'Centre associations',
    intro_fr: 'Des associations locales, indépendantes, qui font vivre les centres de COMIMa.',
    intro_en: 'Independent local associations that bring COMIMa’s centres to life.',
  },
];

export const partners: Partner[] = [
  {
    id: 'comima',
    name: 'COMIMa',
    url: '', // lien interne, résolu par la page (accueil)
    logo: 'logo-emblem.png',
    group: 'coeur',
    role_fr: 'Association nationale',
    role_en: 'National association',
    text_fr:
      'COMIMa, le Club Olympiade Mathématiques et Informatique de Madagascar, est le cœur du réseau : l’association nationale qui organise les camps, les regroupements et les ressources, et qui fédère les centres.',
    text_en:
      'COMIMa, the Mathematics and Computer Science Olympiad Club of Madagascar, is the heart of the network: the national association that runs the camps, the group sessions and the resources, and brings the centres together.',
  },
  {
    id: 'animath',
    name: 'Animath',
    url: 'https://www.animath.fr',
    logo: 'logo-animath.png',
    group: 'partenaires',
    role_fr: 'Partenaire',
    role_en: 'Partner',
    text_fr:
      'Association française d’animation mathématique, partenaire de COMIMa. Animath envoie des représentants auprès du club, surtout durant les camps nationaux.',
    text_en:
      'French mathematics outreach association and partner of COMIMa. Animath sends representatives to the club, especially during the national camps.',
  },
  {
    id: 'campus-france',
    name: 'Campus France',
    url: 'https://www.campusfrance.org',
    logo: 'logo-campus-france.png',
    group: 'partenaires',
    role_fr: 'Sponsor',
    role_en: 'Sponsor',
    text_fr:
      'Agence française pour l’enseignement supérieur et l’accueil des étudiants internationaux. Campus France a financé le camp national et soutiendra aussi les camps suivants.',
    text_en:
      'French agency for higher education and the reception of international students. Campus France funded the national camp and will also support the following camps.',
  },
  {
    id: 'fianarako',
    name: 'Fianarako',
    url: 'https://www.facebook.com/share/1UiHCjL5aA/',
    logo: 'logo-fianarako.png',
    group: 'partenaires',
    role_fr: 'Partenaire, collaborateur éventuel',
    role_en: 'Partner, possible collaborator',
    text_fr:
      'Plateforme de partage et lieu de soutien à des enseignants créateurs, qui promeut et accompagne les enseignants malagasy grâce à l’e-learning. Partenaire de COMIMa et collaborateur éventuel : appui technique et financement indirect.',
    text_en:
      'Sharing platform and place of support for teacher-creators, promoting and supporting Malagasy educators through e-learning. Partner of COMIMa and possible collaborator: technical support and indirect funding.',
  },
  {
    id: 'aemia',
    name: 'AEMIA',
    url: 'https://www.facebook.com/share/1HsWqbc3b1/',
    logo: 'logo-aemia.jpg',
    group: 'etudiants',
    role_fr: 'Association d’étudiants d’Antananarivo',
    role_en: 'Antananarivo students’ association',
    text_fr:
      'Association des Étudiants en Mathématiques et Informatique d’Antananarivo. Les étudiants de l’AEMIA aident les encadrants dans l’animation des séances et des regroupements.',
    text_en:
      'Association of Mathematics and Computer Science Students of Antananarivo. AEMIA students help the coaches run the sessions and group gatherings.',
  },
  {
    id: 'mahkinga',
    name: 'MahKinga',
    url: 'https://www.facebook.com/share/1CTjxSL6r6/',
    logo: 'logo-mahkinga.jpg',
    group: 'locales',
    role_fr: 'Antsiranana — filiale indépendante',
    role_en: 'Antsiranana — independent affiliate',
    text_fr:
      'Club de Maths-Info MahKinga : filiale indirecte de COMIMa à Antsiranana, mais indépendante. Elle fait vivre le centre d’Antsiranana.',
    text_en:
      'MahKinga Maths-CS Club: an indirect affiliate of COMIMa in Antsiranana, yet independent. It runs the Antsiranana centre.',
  },
  {
    id: 'imatematiko',
    name: 'iMatematiko',
    url: 'https://www.facebook.com/share/1FPBeux2Q3/',
    logo: 'logo-imatematiko.jpg',
    group: 'locales',
    role_fr: 'Fianarantsoa — association indépendante',
    role_en: 'Fianarantsoa — independent association',
    text_fr:
      'Club de mathématiques de l’École Normale Supérieure de Fianarantsoa. Association indépendante, co-animateur et partenaire du centre de Fianarantsoa.',
    text_en:
      'Mathematics club of the École Normale Supérieure de Fianarantsoa. Independent association, co-organiser and partner of the Fianarantsoa centre.',
  },
];

/** Partenaires affichés en logos cliquables (hors COMIMa, qui est le site lui-même). */
export const partnerLogos = partners.filter((p) => p.group !== 'coeur');

export const partnerUrl = (id: string) => partners.find((p) => p.id === id)!.url;
