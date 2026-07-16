/**
 * « Principe du jour » : un principe clé par chapitre du recueil COMIMa
 * « Techniques de résolution de problèmes ». Le choix tourne chaque jour
 * côté client (même mécanique que le problème du jour).
 * Les formules sont rendues par KaTeX.
 */
export interface Principe {
  fr: string;
  en: string;
  chapitreFr: string;
  chapitreEn: string;
  coursId: string;
}

export const principes: Principe[] = [
  {
    fr: "Quelques exemples favorables ne constituent jamais une démonstration : il faut une preuve générale — ou un contre-exemple.",
    en: 'A few favourable examples never make a proof: you need a general argument — or a counterexample.',
    chapitreFr: 'Chapitre 0 — Exemples et Contre-exemples',
    chapitreEn: 'Chapter 0 — Examples and Counterexamples',
    coursId: '00-exemples-contre-exemples',
  },
  {
    fr: "Pour prouver une propriété pour tout $n$ : on la vérifie au départ, puis on montre qu'elle se transmet de $n$ à $n+1$.",
    en: 'To prove a property for every $n$: check it at the start, then show it passes from $n$ to $n+1$.',
    chapitreFr: 'Chapitre 1 — Récurrence',
    chapitreEn: 'Chapter 1 — Induction',
    coursId: '01-recurrence',
  },
  {
    fr: "Tout sous-ensemble fini non-vide de $\\mathbb{N}$ admet un plus petit élément et un plus grand élément.",
    en: 'Every non-empty finite subset of $\\mathbb{N}$ has a smallest element and a largest element.',
    chapitreFr: 'Chapitre 2 — Principe Extrémal',
    chapitreEn: 'Chapter 2 — Extremal Principle',
    coursId: '02-principe-extremal',
  },
  {
    fr: "Si vous placez $n+1$ objets dans $n$ tiroirs, alors au moins un tiroir contiendra plus d'un objet.",
    en: 'If you place $n+1$ objects into $n$ boxes, then at least one box contains more than one object.',
    chapitreFr: 'Chapitre 3 — Principe des Tiroirs',
    chapitreEn: 'Chapter 3 — Pigeonhole Principle',
    coursId: '03-principe-des-tiroirs',
  },
  {
    fr: "Le centroïde $S$ de $n$ points $A_1, \\ldots, A_n$ vérifie $\\sum_{i=1}^{n} \\overrightarrow{SA_i} = \\vec{0}$.",
    en: 'The centroid $S$ of $n$ points $A_1, \\ldots, A_n$ satisfies $\\sum_{i=1}^{n} \\overrightarrow{SA_i} = \\vec{0}$.',
    chapitreFr: 'Chapitre 4 — Géométrie',
    chapitreEn: 'Chapter 4 — Geometry',
    coursId: '04-geometrie',
  },
  {
    fr: "Petit théorème de Fermat : si $p$ est premier, alors $a^p \\equiv a \\pmod{p}$.",
    en: "Fermat's little theorem: if $p$ is prime, then $a^p \\equiv a \\pmod{p}$.",
    chapitreFr: 'Chapitre 5 — Théorie des nombres',
    chapitreEn: 'Chapter 5 — Number Theory',
    coursId: '05-theorie-des-nombres',
  },
  {
    fr: "Principe additif : si l'on choisit ceci ou cela, on additionne. Principe multiplicatif : si l'on choisit ceci puis cela, on multiplie.",
    en: 'Additive principle: choosing this or that, you add. Multiplicative principle: choosing this then that, you multiply.',
    chapitreFr: 'Chapitre 6 — Combinatoire',
    chapitreEn: 'Chapter 6 — Combinatorics',
    coursId: '06-combinatoire',
  },
  {
    fr: "Si l'état initial et l'état visé n'ont pas la même valeur de l'invariant, alors l'état visé est inaccessible.",
    en: 'If the initial state and the target state do not share the same invariant value, the target state is unreachable.',
    chapitreFr: 'Chapitre 7 — Invariants',
    chapitreEn: 'Chapter 7 — Invariants',
    coursId: '07-invariants',
  },
];
