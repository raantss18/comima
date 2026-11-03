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
  {
    slug: 'installation-d-antennes',
    famille: 'logique',
    themes: ['combinatoire', 'géométrie'],
    level: 'collège',
    icon: '📡',
    title: { fr: 'Installation d’antennes', en: 'Installing antennas' },
    summary: {
      fr: 'Couvrir toute une grille avec des antennes dont les ondes ne se recouvrent jamais.',
      en: 'Cover a whole grid with antennas whose waves never overlap.',
    },
    versions: [
      { consigne: { fr: '<p>Cliquez sur les cases de la grille pour y placer des antennes, afin que toutes les cases blanches soient couvertes par des ondes.</p><p>Les ondes des antennes ne doivent pas se superposer.</p>', en: '<p>Click cells of the grid to place antennas there, so that every white cell is covered by waves.</p><p>The waves of the antennas must not overlap.</p>' } },
      { consigne: { fr: '<p>Cliquez sur les cases de la grille pour y placer des antennes, afin que toutes les cases blanches soient couvertes par des ondes.</p><p>Les ondes des antennes ne doivent pas se superposer.</p>', en: '<p>Click cells of the grid to place antennas there, so that every white cell is covered by waves.</p><p>The waves of the antennas must not overlap.</p>' } },
      { consigne: { fr: '<p>Cliquez sur les cases <strong>blanches et grises</strong> de la grille pour y placer des antennes, afin que toutes les cases blanches soient couvertes par des ondes.</p><p>Les ondes des antennes ne doivent pas se superposer.</p>', en: '<p>Click <strong>white and grey</strong> cells of the grid to place antennas there, so that every white cell is covered by waves.</p><p>The waves of the antennas must not overlap.</p>' } },
    ],
    source: {
      titre: 'Installation d’antennes',
      annee: 2015,
      auteurs: 'Arthur Charguéraud, France-ioi',
      url: `${CASTOR}/2015/2015-FR-02-spreading-secret`,
    },
  },
  {
    slug: 'traverser-le-pont',
    famille: 'logique',
    themes: ['combinatoire', 'arithmétique'],
    level: 'collège',
    icon: '🌉',
    title: { fr: 'Traverser le pont', en: 'Crossing the bridge' },
    summary: {
      fr: 'Ordonner des bûches pour que deux bûches voisines ne dépassent jamais la charge du pont.',
      en: 'Order logs so that two neighbouring logs never exceed what the bridge can hold.',
    },
    versions: [
      { consigne: { fr: '<p>Castor doit faire passer une série de bûches sur un pont qui supporte au maximum 6 kg.</p><p>Sur chaque bûche est indiqué son poids en kg. Changez leur ordre pour que le pont ne s’écroule pas.</p>', en: '<p>Castor must get a series of logs across a bridge that holds at most 6 kg.</p><p>Each log shows its weight in kg. Change their order so that the bridge does not collapse.</p>' } },
      { consigne: { fr: '<p>Castor doit faire passer une série de bûches sur un pont qui supporte au maximum 10 kg.</p><p>Sur chaque bûche est indiqué son poids en kg. Changez leur ordre pour que le pont ne s’écroule pas.</p>', en: '<p>Castor must get a series of logs across a bridge that holds at most 10 kg.</p><p>Each log shows its weight in kg. Change their order so that the bridge does not collapse.</p>' } },
      { consigne: { fr: '<p>Castor doit faire passer une série de bûches sur un pont qui supporte au maximum 14 kg.</p><p>Sur chaque bûche est indiqué son poids en kg. Changez leur ordre pour que le pont ne s’écroule pas.</p>', en: '<p>Castor must get a series of logs across a bridge that holds at most 14 kg.</p><p>Each log shows its weight in kg. Change their order so that the bridge does not collapse.</p>' } },
    ],
    source: {
      titre: 'Traverser le pont',
      annee: 2014,
      auteurs: 'Mathias Hiron, France-ioi',
      url: `${CASTOR}/2014/2014-FR-06-bridge`,
    },
  },
  {
    slug: 'trier-par-poids',
    famille: 'programmation',
    themes: ['informatique'],
    level: 'collège',
    icon: '⚖️',
    title: { fr: 'Trier par poids', en: 'Sorting by weight' },
    summary: {
      fr: 'Ranger six frisbees du plus léger au plus lourd avec une balance : un premier algorithme de tri.',
      en: 'Order six frisbees from lightest to heaviest with a balance: a first sorting algorithm.',
    },
    versions: [
      {
        consigne: {
          fr: '<p>Castor possède 6 frisbees de différentes couleurs et de différents poids. Il souhaite les ranger sur son étagère du plus léger (à gauche) au plus lourd (à droite).</p><p>Aidez Castor à ranger ses frisbees. Pour comparer le poids de deux frisbees, sélectionnez-les puis appuyez sur « Comparer ». La balance vous indiquera alors quel est le plus léger des deux.</p>',
          en: '<p>Castor owns 6 frisbees of different colours and different weights. He wants to put them on his shelf from the lightest (on the left) to the heaviest (on the right).</p><p>Help Castor tidy his frisbees. To compare the weights of two frisbees, select them and press “Compare”. The balance will then tell you which one is lighter.</p>',
        },
      },
    ],
    source: {
      titre: 'Trier par poids',
      annee: 2013,
      auteurs: 'France-ioi',
      url: `${CASTOR}/2013/2013-FR-13`,
    },
  },
  {
    slug: 'dessine-un-castor',
    famille: 'codage',
    themes: ['combinatoire', 'informatique'],
    level: 'collège',
    icon: '🖼️',
    title: { fr: 'Dessine un castor', en: 'Draw a beaver' },
    summary: {
      fr: 'Chaque clic inverse un bloc de quatre pixels : retrouver l’image d’un castor.',
      en: 'Each click flips a block of four pixels: rebuild the picture of a beaver.',
    },
    versions: [
      {
        consigne: {
          fr: '<p>Cliquez où vous voulez sur votre dessin, jusqu’à obtenir le même dessin que l’objectif. Comme vous pourrez le voir, chaque clic inverse un bloc de 4 cases d’un coup.</p><p>Un conseil : soyez méthodique pour avoir une chance de réussir en un temps raisonnable !</p>',
          en: '<p>Click anywhere on your drawing until you get the same drawing as the goal. As you will see, each click flips a block of 4 cells at once.</p><p>A tip: be methodical if you want to succeed in a reasonable time!</p>',
        },
      },
    ],
    source: {
      titre: 'Dessine un castor',
      annee: 2012,
      auteurs: 'France-ioi',
      url: `${CASTOR}/2012/2012-FR-08`,
    },
  },
  {
    slug: 'marquage-d-oiseaux',
    famille: 'codage',
    themes: ['combinatoire', 'informatique'],
    level: 'collège',
    icon: '🐦',
    title: { fr: 'Marquage d’oiseaux', en: 'Marking the birds' },
    summary: {
      fr: 'Marquer chaque oiseau avec quelques cases noires ou blanches, pour le reconnaître après le mélange.',
      en: 'Mark each bird with a few black or white boxes, so you can recognise it after the shuffle.',
    },
    versions: [
      {
        consigne: {
          fr: '<p>Cliquez sur les cases pour dessiner des motifs différents sur les pattes des oiseaux. Cliquez ensuite sur le bouton pour les laisser s’envoler. Les oiseaux se mélangeront, et il vous faudra les remettre à leur place d’origine.</p><p>5 oiseaux, 5 cases sur chaque patte.</p>',
          en: '<p>Click on the boxes to draw different patterns on the birds’ legs. Then click on the button to let them fly away. The birds will get mixed up, and you will have to return them to their original place.</p><p>5 birds, 5 boxes on each leg.</p>',
        },
      },
      {
        consigne: {
          fr: '<p>Cliquez sur les cases pour dessiner des motifs différents sur les pattes des oiseaux. Cliquez ensuite sur le bouton pour les laisser s’envoler. Les oiseaux se mélangeront, et il vous faudra les remettre à leur place d’origine.</p><p>8 oiseaux, 4 cases sur chaque patte.</p>',
          en: '<p>Click on the boxes to draw different patterns on the birds’ legs. Then click on the button to let them fly away. The birds will get mixed up, and you will have to return them to their original place.</p><p>8 birds, 4 boxes on each leg.</p>',
        },
      },
      {
        consigne: {
          fr: '<p>Cliquez sur les cases pour dessiner des motifs différents sur les pattes des oiseaux. Cliquez ensuite sur le bouton pour les laisser s’envoler. Les oiseaux se mélangeront, et il vous faudra les remettre à leur place d’origine.</p><p>8 oiseaux, 3 cases sur chaque patte.</p>',
          en: '<p>Click on the boxes to draw different patterns on the birds’ legs. Then click on the button to let them fly away. The birds will get mixed up, and you will have to return them to their original place.</p><p>8 birds, 3 boxes on each leg.</p>',
        },
      },
    ],
    source: {
      titre: 'Marquage d’oiseaux',
      annee: 2015,
      auteurs: 'Arthur Charguéraud, France-ioi',
      url: `${CASTOR}/2015/2015-FR-03-mark-and-shuffle`,
    },
  },
  {
    slug: 'curseurs',
    famille: 'codage',
    themes: ['arithmétique', 'informatique'],
    level: 'collège',
    icon: '🎚️',
    title: { fr: 'Curseurs', en: 'Sliders' },
    summary: {
      fr: 'Comprendre l’effet de chaque curseur pour afficher les symboles demandés.',
      en: 'Work out what each slider does to display the requested symbols.',
    },
    versions: [
      {
        consigne: {
          fr: '<p>Castor utilise des curseurs pour représenter un symbole. Déplacez ces curseurs pour que le résultat soit identique à l’objectif.</p>',
          en: '<p>Castor uses sliders to represent a symbol. Move these sliders so that the result becomes identical to the target.</p>',
        },
      },
      {
        consigne: {
          fr: '<p>Castor utilise des curseurs pour représenter 2 symboles. Déplacez ces curseurs pour que le résultat soit identique à l’objectif.</p>',
          en: '<p>Castor uses sliders to represent 2 symbols. Move these sliders so that the result becomes identical to the target.</p>',
        },
      },
      {
        consigne: {
          fr: '<p>Castor utilise des curseurs pour représenter 3 symboles. Déplacez ces curseurs pour que le résultat soit identique à l’objectif.</p>',
          en: '<p>Castor uses sliders to represent 3 symbols. Move these sliders so that the result becomes identical to the target.</p>',
        },
      },
    ],
    source: {
      titre: 'Curseurs',
      annee: 2019,
      auteurs: 'Arthur Charguéraud, Mathias Hiron, France-ioi',
      url: `${CASTOR}/2019/FR-2019-17-base-4-encoding`,
    },
  },
  {
    slug: 'attaques-croisees',
    famille: 'logique',
    themes: ['combinatoire'],
    level: 'collège',
    icon: '♜',
    title: { fr: 'Attaques croisées', en: 'Crossed attacks' },
    summary: {
      fr: 'Placer des jetons sur une grille pour que leurs alignements dessinent le diagramme demandé.',
      en: 'Place tokens on a grid so that their alignments draw the requested diagram.',
    },
    versions: [
      {
        consigne: {
          fr: '<p>Déplacez les jetons de la grille pour que votre diagramme ait les mêmes traits que l’objectif.</p><p>Il y a un trait entre deux jetons s’ils sont sur la même rangée ou sur la même colonne dans la grille.</p>',
          en: '<p>Move the tokens in the grid so that your diagram has the same lines as the target.</p><p>There is a line between two tokens if they are in the same row or in the same column of the grid.</p>',
        },
      },
      {
        consigne: {
          fr: '<p>Déplacez les jetons de la grille pour que votre diagramme ait les mêmes traits que l’objectif.</p><p>Il y a un trait entre deux jetons s’ils sont sur la même rangée ou sur la même colonne dans la grille.</p>',
          en: '<p>Move the tokens in the grid so that your diagram has the same lines as the target.</p><p>There is a line between two tokens if they are in the same row or in the same column of the grid.</p>',
        },
      },
      {
        consigne: {
          fr: '<p>Déplacez les jetons de la grille pour que votre diagramme ait les mêmes traits que l’objectif.</p><p>Il y a un trait entre deux jetons s’ils sont sur la même rangée ou sur la même colonne dans la grille.</p>',
          en: '<p>Move the tokens in the grid so that your diagram has the same lines as the target.</p><p>There is a line between two tokens if they are in the same row or in the same column of the grid.</p>',
        },
      },
    ],
    source: {
      titre: 'Attaques croisées',
      annee: 2018,
      auteurs: 'France-ioi',
      url: `${CASTOR}/2018/2018-FR-07-checkers-graph`,
    },
  },
  {
    slug: 'territoire-castor',
    famille: 'logique',
    themes: ['combinatoire', 'géométrie'],
    level: 'collège',
    icon: '🏠',
    title: { fr: 'Territoire castor', en: 'Castor’s territory' },
    summary: {
      fr: 'Colorier toutes les cases que Castor atteint en 5 pas au plus, en contournant les obstacles.',
      en: 'Colour every cell Castor can reach in at most 5 steps, going around the obstacles.',
    },
    versions: [
      {
        consigne: {
          fr: '<p>Coloriez en bleu les cases que Castor peut atteindre en 5 pas ou moins à partir de sa maison, représentée par une croix.</p><p>En un pas, Castor se déplace d’une case au-dessus, au-dessous, à droite ou à gauche (mais pas en diagonale). Il ne va pas sur les cases noires.</p><p>Les nombres au milieu des cases coloriées n’ont pas d’importance pour la réponse, mais peuvent vous aider à vous organiser.</p>',
          en: '<p>Colour in blue the cells that Castor can reach in 5 steps or fewer from his home, shown by a cross.</p><p>In one step, Castor moves one cell up, down, right or left (but not diagonally). He does not go on the black cells.</p><p>The numbers in the middle of the coloured cells do not matter for the answer, but they can help you organise yourself.</p>',
        },
      },
    ],
    source: {
      titre: 'Territoire castor',
      annee: 2012,
      auteurs: 'France-ioi',
      url: `${CASTOR}/2012/2012-FR-07`,
    },
  },
];

export function defiBySlug(slug: string): DefiMeta | undefined {
  return defis.find((d) => d.slug === slug);
}
