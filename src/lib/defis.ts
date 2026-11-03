/**
 * Catalogue des défis interactifs (une page chacune : /defis/<slug>/).
 *
 * Un défi = une tâche à manipuler, vérifiée automatiquement, sur le modèle du
 * Concours Castor, d'Algorea et d'Alkindi. Chaque défi est adapté d'une tâche du
 * Concours Castor publiée par France-ioi sous licence CC BY-SA 3.0 : la source,
 * les auteurs et la licence sont affichés sur la page, et l'adaptation (énoncé et
 * code dans src/scripts/defis/<slug>.ts) reste sous la même licence.
 *
 * Aucune solution n'est stockée : la vérification contrôle seulement que les règles
 * de la consigne sont respectées par la configuration de l'élève.
 */
import type { Level } from './sims';

export type Famille = 'logique' | 'programmation' | 'codage';

export interface Version {
  /** Consigne, en HTML simple (p, ul, li, strong). */
  consigne: { fr: string; en: string };
}

export interface DefiMeta {
  slug: string;
  famille: Famille;
  themes: string[];
  level: Level;
  icon: string;
  title: { fr: string; en: string };
  summary: { fr: string; en: string };
  /** Une à trois versions de difficulté croissante (★, ★★, ★★★). */
  versions: Version[];
  source: {
    /** Titre original de la tâche. */
    titre: string;
    annee: number;
    auteurs: string;
    /** Dossier de la tâche dans le dépôt public de France-ioi. */
    url: string;
  };
}

export const familles: { id: Famille; icon: string; title: { fr: string; en: string }; intro: { fr: string; en: string } }[] = [
  {
    id: 'logique',
    icon: '🧩',
    title: { fr: 'Logique et contraintes', en: 'Logic and constraints' },
    intro: {
      fr: 'Placer, échanger, retourner : trouver une configuration qui respecte toutes les règles.',
      en: 'Place, swap, flip: find a configuration that satisfies every rule.',
    },
  },
  {
    id: 'programmation',
    icon: '🤖',
    title: { fr: 'Programmation', en: 'Programming' },
    intro: {
      fr: 'Écrire une suite d’instructions, la faire exécuter, corriger : la démarche d’Algorea.',
      en: 'Write a sequence of instructions, run it, fix it: the Algorea way.',
    },
  },
  {
    id: 'codage',
    icon: '🔐',
    title: { fr: 'Codage et cryptographie', en: 'Coding and cryptography' },
    intro: {
      fr: 'Coder, décoder, retrouver une règle cachée : l’esprit d’Alkindi.',
      en: 'Encode, decode, uncover a hidden rule: the Alkindi spirit.',
    },
  },
];

const CASTOR = 'https://github.com/France-ioi/bebras-tasks/tree/master/bebras';

export const defis: DefiMeta[] = [
  {
    slug: 'bons-voisins',
    famille: 'logique',
    themes: ['combinatoire'],
    level: 'collège',
    icon: '🔵',
    title: { fr: 'Bons voisins', en: 'Good neighbours' },
    summary: {
      fr: 'Réordonner des formes pour que deux voisines ne se ressemblent jamais.',
      en: 'Rearrange shapes so that no two neighbours look alike.',
    },
    versions: [
      {
        consigne: {
          fr: '<p>Changez l’ordre des objets pour que deux objets identiques ne soient jamais côte à côte.</p>',
          en: '<p>Rearrange the objects so that two identical objects are never side by side.</p>',
        },
      },
      {
        consigne: {
          fr: '<p>Changez l’ordre des objets pour que :</p><ul><li>deux ronds ou deux carrés ne soient jamais côte à côte ;</li><li>deux petits objets ou deux gros objets ne soient jamais côte à côte.</li></ul>',
          en: '<p>Rearrange the objects so that:</p><ul><li>two circles or two squares are never side by side;</li><li>two small objects or two big objects are never side by side.</li></ul>',
        },
      },
      {
        consigne: {
          fr: '<p>Changez les positions des objets dans la grille pour que :</p><ul><li>deux ronds ou deux carrés ne se touchent jamais <strong>par un côté</strong> ;</li><li>deux petits objets ou deux gros objets ne se touchent jamais <strong>par un coin</strong> (en diagonale).</li></ul>',
          en: '<p>Rearrange the objects in the grid so that:</p><ul><li>two circles or two squares never touch <strong>by a side</strong>;</li><li>two small objects or two big objects never touch <strong>by a corner</strong> (diagonally).</li></ul>',
        },
      },
    ],
    source: {
      titre: 'Bons voisins',
      annee: 2016,
      auteurs: 'Arthur Charguéraud, Mathias Hiron, Nir Lavee, France-ioi',
      url: `${CASTOR}/2016/2016-FR-09-constraints`,
    },
  },
  {
    slug: 'jeu-de-parite',
    famille: 'logique',
    themes: ['combinatoire', 'arithmétique'],
    level: 'collège',
    icon: '⚫',
    title: { fr: 'Jeu de parité', en: 'Parity game' },
    summary: {
      fr: 'Retourner des pions pour que chaque ligne et chaque colonne ait un nombre pair de pions noirs.',
      en: 'Flip tokens so that every row and every column has an even number of black tokens.',
    },
    versions: [
      {
        consigne: {
          fr: '<p>Castor vous défie à son nouveau jeu de plateau. L’objectif est de réussir à ce que chaque ligne et chaque colonne du plateau contienne un nombre pair de pions noirs.</p><p>Vous pouvez retourner des pions carrés en cliquant dessus et les faire passer de noir à blanc, ou vice versa. Remarque : retourner le pion encadré de rouge suffirait pour gagner, mais il est rond donc vous ne pouvez pas changer sa couleur.</p>',
          en: '<p>Castor challenges you to his new board game. The goal is to make every row and every column of the board contain an even number of black tokens.</p><p>You can flip square tokens by clicking on them, turning them from black to white or the other way round. Note: flipping the token framed in red would be enough to win, but it is round, so you cannot change its colour.</p>',
        },
      },
    ],
    source: {
      titre: 'Jeu de parité',
      annee: 2013,
      auteurs: 'Françoise Tort, Mahdi Miled, France-ioi',
      url: `${CASTOR}/2013/2013-FR-14`,
    },
  },
  {
    slug: 'par-quatre-chemins',
    famille: 'programmation',
    themes: ['informatique'],
    level: 'collège',
    icon: '🤖',
    title: { fr: 'Par quatre chemins', en: 'Four ways' },
    summary: {
      fr: 'Une seule séquence de flèches, répétée quatre fois, doit mener le robot jusqu’à la zone verte.',
      en: 'A single sequence of arrows, repeated four times, must lead the robot to the green area.',
    },
    versions: [
      {
        consigne: {
          fr: '<p>Programmez le robot pour qu’il atteigne la zone verte située à droite.</p><p>Composez une séquence de flèches (8 au plus). Le robot va exécuter la séquence 4 fois.</p><p>Pour réussir, chaque exécution de la séquence doit se terminer par la traversée d’une ligne bleue.</p>',
          en: '<p>Program the robot so that it reaches the green area on the right.</p><p>Build a sequence of arrows (at most 8). The robot will run the sequence 4 times.</p><p>To succeed, every run of the sequence must end by crossing a blue line.</p>',
        },
      },
      {
        consigne: {
          fr: '<p>Programmez le robot pour qu’il atteigne la zone verte située à droite.</p><p>Composez une séquence de flèches (15 au plus). Le robot va exécuter la séquence 4 fois.</p><p>Pour réussir, chaque exécution de la séquence doit se terminer par la traversée d’une ligne bleue.</p><p>Astuce : vous pouvez cliquer sur des cases du labyrinthe pour les marquer.</p>',
          en: '<p>Program the robot so that it reaches the green area on the right.</p><p>Build a sequence of arrows (at most 15). The robot will run the sequence 4 times.</p><p>To succeed, every run of the sequence must end by crossing a blue line.</p><p>Tip: you can click on cells of the maze to mark them.</p>',
        },
      },
      {
        consigne: {
          fr: '<p>Programmez le robot pour qu’il atteigne la zone verte située à droite.</p><p>Composez une séquence de flèches (16 au plus). Le robot va exécuter la séquence 4 fois.</p><p>Pour réussir, chaque exécution de la séquence doit se terminer par la traversée d’une ligne bleue.</p><p>Astuce : vous pouvez cliquer sur des cases du labyrinthe pour les marquer.</p>',
          en: '<p>Program the robot so that it reaches the green area on the right.</p><p>Build a sequence of arrows (at most 16). The robot will run the sequence 4 times.</p><p>To succeed, every run of the sequence must end by crossing a blue line.</p><p>Tip: you can click on cells of the maze to mark them.</p>',
        },
      },
    ],
    source: {
      titre: 'Par quatre chemins',
      annee: 2016,
      auteurs: 'Arthur Charguéraud, Mathias Hiron, Nir Lavee, France-ioi',
      url: `${CASTOR}/2016/2016-FR-08-repeating-pattern`,
    },
  },
];

export function defiBySlug(slug: string): DefiMeta | undefined {
  return defis.find((d) => d.slug === slug);
}
