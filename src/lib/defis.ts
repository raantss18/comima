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
  {
    slug: 'choix-des-invites',
    famille: 'logique',
    themes: ['combinatoire', 'informatique'],
    level: 'collège',
    icon: '🎉',
    title: { fr: 'Choix des invités', en: 'Choosing the guests' },
    summary: {
      fr: 'Dans un réseau de connaissances, choisir 8 personnes dont aucune ne connaît une autre.',
      en: 'In a network of acquaintances, choose 8 people none of whom know each other.',
    },
    versions: [
      {
        consigne: {
          fr: '<p>Julie veut organiser une petite fête avec 8 personnes qui ne se connaissent pas les unes les autres.</p><p>Sur le diagramme, chaque personne est représentée par un rond, et les personnes qui se connaissent sont reliées par un trait.</p><p>Aide Julie à choisir un maximum de personnes qui ne se connaissent pas les unes les autres, en cliquant sur les ronds pour les sélectionner ou les désélectionner.</p>',
          en: '<p>Julie wants to throw a small party with 8 people who do not know one another.</p><p>On the diagram, each person is a circle, and people who know each other are joined by a line.</p><p>Help Julie choose as many people as possible who do not know one another, by clicking the circles to select or deselect them.</p>',
        },
      },
    ],
    source: {
      titre: 'Choix des invités',
      annee: 2013,
      auteurs: 'Arthur Charguéraud, Luc Baille, Mahdi Miled, France-ioi',
      url: `${CASTOR}/2013/2013-FR-12b`,
    },
  },
  {
    slug: 'robot-qui-tourne',
    famille: 'programmation',
    themes: ['informatique'],
    level: 'collège',
    icon: '🔄',
    title: { fr: 'Robot qui tourne', en: 'Turning robot' },
    summary: {
      fr: 'Le robot avance tout droit et tourne à droite devant un obstacle : placer les obstacles qui le mènent au but.',
      en: 'The robot goes straight and turns right at an obstacle: place the obstacles that lead it to the goal.',
    },
    versions: [0, 1, 2].map(() => ({
      consigne: {
        fr: '<p>Le robot bleu avance s’il n’a pas d’obstacle devant lui. Sinon, il tourne d’un quart de tour à droite.</p><p>Cliquez pour ajouter des obstacles, afin que le robot atteigne le rond vert.</p>',
        en: '<p>The blue robot moves forward if there is no obstacle in front of it. Otherwise, it turns a quarter turn to the right.</p><p>Click to add obstacles so that the robot reaches the green circle.</p>',
      },
    })),
    source: {
      titre: 'Robot qui tourne',
      annee: 2015,
      auteurs: 'Arthur Charguéraud, France-ioi',
      url: `${CASTOR}/2015/2015-FR-07-placing-arrows`,
    },
  },
  {
    slug: 'code-du-cadenas',
    famille: 'codage',
    themes: ['combinatoire'],
    level: 'collège',
    icon: '🔒',
    title: { fr: 'Code du cadenas', en: 'Padlock code' },
    summary: {
      fr: 'Essayer méthodiquement tous les codes qui respectent des règles, si possible en un minimum d’étapes.',
      en: 'Try every code that fits the rules, methodically, and if possible in as few steps as possible.',
    },
    versions: [
      {
        consigne: {
          fr: '<p>Pour ouvrir le cadenas de Castor, essayez tous les codes qui :</p><ul><li>commencent par le chiffre 8,</li><li>et contiennent deux fois le chiffre 5,</li><li>et contiennent une fois le chiffre 3.</li></ul>',
          en: '<p>To open Castor’s padlock, try every code that:</p><ul><li>starts with the digit 8,</li><li>and contains the digit 5 twice,</li><li>and contains the digit 3 once.</li></ul>',
        },
      },
      {
        consigne: {
          fr: '<p>Pour ouvrir le cadenas de Castor, essayez tous les codes qui :</p><ul><li>commencent par le chiffre 8,</li><li>et contiennent deux fois le chiffre 5,</li><li>et contiennent soit un 1 soit un 2.</li></ul>',
          en: '<p>To open Castor’s padlock, try every code that:</p><ul><li>starts with the digit 8,</li><li>and contains the digit 5 twice,</li><li>and contains either a 1 or a 2.</li></ul>',
        },
      },
      {
        consigne: {
          fr: '<p>Pour ouvrir le cadenas de Castor, essayez tous les codes qui :</p><ul><li>contiennent deux fois le chiffre 3,</li><li>et contiennent deux fois le chiffre 5.</li></ul><p>Essayez d’ouvrir le cadenas en faisant le moins d’étapes possible. N’hésitez pas à vous aider d’un papier !</p>',
          en: '<p>To open Castor’s padlock, try every code that:</p><ul><li>contains the digit 3 twice,</li><li>and contains the digit 5 twice.</li></ul><p>Try to open the padlock in as few steps as possible. Feel free to use a sheet of paper!</p>',
        },
      },
    ],
    source: {
      titre: 'Code du cadenas',
      annee: 2015,
      auteurs: 'Arthur Charguéraud, France-ioi',
      url: `${CASTOR}/2015/2015-FR-13-open-lock`,
    },
  },
];

export function defiBySlug(slug: string): DefiMeta | undefined {
  return defis.find((d) => d.slug === slug);
}
