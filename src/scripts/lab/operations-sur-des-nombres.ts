import { button, el, group, param, select, type LabDef } from './core';

/**
 * Chapitre 7 — Invariants.
 * Une liste de nombres ; à chaque étape on efface deux nombres a, b et on écrit f(a, b).
 * Quelle quantité ne dépend jamais de l'ordre des choix ?
 */

type Op = 'diff' | 'sumsub' | 'prodplus' | 'sum' | 'custom';

const big = (v: number) => BigInt(Math.round(v));
const absB = (v: bigint) => (v < 0n ? -v : v);

export const def: LabDef = {
  chapter: '07-invariants',
  numero: 7,
  title: { fr: 'Remplacer deux nombres par un seul', en: 'Replace two numbers by one' },
  statement: {
    fr: 'Au tableau : les nombres $1, 2, \\dots, 7$. À chaque étape on efface deux nombres $a$ et $b$ et on écrit à la place $f(a, b)$ (par exemple $|a - b|$). Après 6 étapes il reste un seul nombre. Que peut-on dire de ce nombre, <em>quel que soit l’ordre</em> des choix ?',
    en: 'On the board: the numbers $1, 2, \\dots, 7$. At each step erase two numbers $a$ and $b$ and write $f(a, b)$ instead (for example $|a - b|$). After 6 steps one number remains. What can be said about that number, <em>whatever order</em> you choose?',
  },
  goal: {
    fr: 'Pour chaque opération $f$, cherche une quantité calculée à partir du tableau qui <strong>ne change jamais</strong> d’une étape à l’autre (somme ? parité ? produit ?). Puis invente tes propres opérations.',
    en: 'For each operation $f$, look for a quantity computed from the board that <strong>never changes</strong> from one step to the next (sum? parity? product?). Then invent your own operations.',
  },
  steps: {
    fr: [
      'Au départ : les nombres <strong>1 2 3 4 5 6 7</strong> (modifiables dans le champ « Nombres ») et l’opération <strong>$|a-b|$</strong> (menu « Opération » ; l’option « personnalisée » donne $f = \\alpha a + \\beta b + \\gamma ab + \\delta$ avec tes coefficients).',
      '<strong>Clique deux jetons</strong> pour les remplacer par $f(a,b)$ — ou utilise « Un pas au hasard » / « Tout jouer ». « Recommencer » remet la liste de départ.',
      'Le tableau « Quantités candidates » compare chaque quantité (somme, parité de la somme, produit, produit de $(x+1)$…) <em>avant</em> et <em>maintenant</em> : ✔ signifie qu’elle n’a pas changé.',
      '« Mille parties » joue 1000 ordres différents jusqu’au bout et montre les résultats finaux possibles : est-il toujours le même ? Sinon, que garde-t-il de commun ?',
    ],
    en: [
      'At the start: the numbers <strong>1 2 3 4 5 6 7</strong> (editable in the “Numbers” field) and the operation <strong>$|a-b|$</strong> (“Operation” menu; the “custom” option gives $f = \\alpha a + \\beta b + \\gamma ab + \\delta$ with your coefficients).',
      '<strong>Click two tokens</strong> to replace them by $f(a,b)$ — or use “A random step” / “Play all”. “Restart” restores the starting list.',
      'The “Candidate quantities” table compares each quantity (sum, parity of the sum, product, product of $(x+1)$…) <em>before</em> and <em>now</em>: ✔ means it has not changed.',
      '“Thousand games” plays 1000 different orders to the end and shows the possible final results: is it always the same? If not, what do they share?',
    ],
  },
  legend: [
    { color: '#2563eb', fr: 'nombre sur le tableau', en: 'number on the board' },
    { color: '#f59e0b', fr: 'jeton sélectionné', en: 'selected token' },
    { color: '#1d9a45', fr: 'quantité inchangée', en: 'unchanged quantity' },
  ],
  hints: {
    fr: [
      'Avec $|a - b|$ : regarde la parité de la somme des nombres avant et après un pas. Pourquoi $|a - b|$ et $a + b$ ont-ils la même parité ?',
      'Avec $a + b + ab$ : calcule $(a+1)(b+1)$ et compare à $f(a,b) + 1$. Que devient le produit de tous les $(x+1)$ ?',
      'Avec $a + b - 1$ : combien de nombres reste-t-il à chaque étape, et que vaut la somme moins le nombre de jetons ?',
      'Opération personnalisée : essaie de trouver des coefficients $(\\alpha, \\beta, \\gamma, \\delta)$ pour lesquels le résultat final est toujours le même. Qu’est-ce qui est nécessaire ?',
    ],
    en: [
      'With $|a - b|$: look at the parity of the sum before and after a step. Why do $|a - b|$ and $a + b$ have the same parity?',
      'With $a + b + ab$: compute $(a+1)(b+1)$ and compare with $f(a,b) + 1$. What becomes of the product of all $(x+1)$?',
      'With $a + b - 1$: how many numbers remain at each step, and what is the sum minus the number of tokens?',
      'Custom operation: try to find coefficients $(\\alpha, \\beta, \\gamma, \\delta)$ for which the final result is always the same. What is needed?',
    ],
  },
  general: {
    fr: '<p><strong>Principe de l’invariant.</strong> Une quantité $Q$ est invariante si un pas ne la change pas. Alors la valeur finale est <em>déterminée</em> par $Q$ de départ.</p><ul><li>$f = |a - b|$ : $|a-b| \\equiv a + b \\pmod 2$, donc la <strong>parité de la somme</strong> est invariante ⇒ pour $1,\\dots,7$ (somme 28, paire) le résultat final est pair.</li><li>$f = a + b + ab$ : $f + 1 = (a+1)(b+1)$, donc $\\prod (x_i + 1)$ est invariant ⇒ résultat final $= 8! - 1 = 40319$ <em>dans tous les ordres</em>.</li><li>$f = a + b - 1$ : $\\sum x_i - (\\text{nombre de jetons})$ est invariant ⇒ résultat $= 28 - 7 + 1 = 22$.</li></ul><p>Pour $f = \\alpha a + \\beta b + \\gamma ab + \\delta$, un invariant « magique » existe en général quand l’opération est associative et commutative.</p>',
    en: '<p><strong>The invariant principle.</strong> A quantity $Q$ is invariant if a step does not change it. Then the final value is <em>determined</em> by the starting $Q$.</p><ul><li>$f = |a - b|$: $|a-b| \\equiv a + b \\pmod 2$, so the <strong>parity of the sum</strong> is invariant ⇒ for $1,\\dots,7$ (sum 28, even) the final result is even.</li><li>$f = a + b + ab$: $f + 1 = (a+1)(b+1)$, so $\\prod (x_i + 1)$ is invariant ⇒ final result $= 8! - 1 = 40319$ <em>in every order</em>.</li><li>$f = a + b - 1$: $\\sum x_i - (\\text{number of tokens})$ is invariant ⇒ result $= 28 - 7 + 1 = 22$.</li></ul><p>For $f = \\alpha a + \\beta b + \\gamma ab + \\delta$, a “magic” invariant exists in general when the operation is associative and commutative.</p>',
  },
  aspect: 0.5,
  logEmpty: { fr: 'Joue puis appuie sur « Noter ».', en: 'Play then press “Record”.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let start: bigint[] = [1n, 2n, 3n, 4n, 5n, 6n, 7n];
    let board: bigint[] = [...start];
    let op: Op = 'diff';
    let coef = { al: 1, be: 1, ga: 1, de: 0 };
    let selected = -1;
    let history: string[] = [];
    let thousand: { values: Map<string, number>; total: number } | null = null;
    log.setColumns([t('opération', 'operation'), t('départ', 'start'), t('résultat', 'result'), t('toujours pareil ?', 'always the same?')]);

    const f = (a: bigint, b: bigint): bigint => {
      switch (op) {
        case 'diff':
          return absB(a - b);
        case 'sum':
          return a + b;
        case 'sumsub':
          return a + b - 1n;
        case 'prodplus':
          return a + b + a * b;
        default:
          return big(coef.al) * a + big(coef.be) * b + big(coef.ga) * a * b + big(coef.de);
      }
    };
    const opLabel = () => {
      switch (op) {
        case 'diff':
          return '|a − b|';
        case 'sum':
          return 'a + b';
        case 'sumsub':
          return 'a + b − 1';
        case 'prodplus':
          return 'a + b + ab';
        default:
          return `${coef.al}a + ${coef.be}b + ${coef.ga}ab + ${coef.de}`;
      }
    };
    const opTex = () => {
      switch (op) {
        case 'diff':
          return '|a-b|';
        case 'sum':
          return 'a+b';
        case 'sumsub':
          return 'a+b-1';
        case 'prodplus':
          return 'a+b+ab';
        default:
          return `${coef.al}a + ${coef.be}b + ${coef.ga}ab + ${coef.de}`;
      }
    };

    const quantities = (v: bigint[]) => {
      const sum = v.reduce((s, x) => s + x, 0n);
      const prod = v.reduce((s, x) => s * x, 1n);
      const prod1 = v.reduce((s, x) => s * (x + 1n), 1n);
      return [
        { name: t('somme Σx', 'sum Σx'), val: sum },
        { name: t('parité de la somme', 'parity of the sum'), val: ((sum % 2n) + 2n) % 2n },
        { name: t('Σx − nombre de jetons', 'Σx − number of tokens'), val: sum - BigInt(v.length) },
        { name: t('produit Πx', 'product Πx'), val: prod },
        { name: t('produit Π(x+1)', 'product Π(x+1)'), val: prod1 },
        { name: t('plus grand nombre', 'largest number'), val: v.reduce((m, x) => (x > m ? x : m), v[0]) },
      ];
    };
    const str = (v: bigint) => {
      const s = v.toString();
      return s.length > 14 ? `${s.slice(0, 1)}.${s.slice(1, 5)}e${s.length - 1}` : s;
    };

    const update = () => {
      const q0 = quantities(start);
      const q1 = quantities(board);
      const done = board.length === 1;
      api.say(
        `<div class="lab-big">${t('Opération', 'Operation')} $f(a,b) = ${opTex()}$ · ${t('jetons restants', 'tokens left')} : <strong>${board.length}</strong>${done ? ` · ${t('résultat final', 'final result')} : <strong>${str(board[0])}</strong>` : ''}</div>`,
      );
      api.calc(
        `<table><tr><th>${t('quantité candidate', 'candidate quantity')}</th><th>${t('avant', 'before')}</th><th>${t('maintenant', 'now')}</th><th></th></tr>` +
          q1.map((q, i) => `<tr><td style="text-align:left">${q.name}</td><td>${str(q0[i].val)}</td><td>${str(q.val)}</td><td>${q.val === q0[i].val ? '<span class="lab-ok">✔</span>' : ''}</td></tr>`).join('') +
          '</table>' +
          (history.length ? `<p>${t('Derniers pas', 'Last steps')} : ${history.slice(-6).map((h) => `$${h}$`).join(' ; ')}</p>` : '') +
          (thousand
            ? `<p>${t('1000 parties', '1000 games')} : ${[...thousand.values.entries()].sort((a, b) => Number(BigInt(a[0]) - BigInt(b[0]))).slice(0, 12).map(([v, c]) => `<strong>${v}</strong> (${c}×)`).join(', ')}${thousand.values.size > 12 ? ' …' : ''} — ${thousand.values.size === 1 ? `<span class="lab-ok">${t('toujours le même résultat', 'always the same result')}</span>` : `${thousand.values.size} ${t('résultats différents', 'different results')}`}</p>`
            : ''),
      );
      stage.redraw();
    };

    const combine = (i: number, j: number) => {
      const a = board[i];
      const b = board[j];
      const c = f(a, b);
      history.push(`f(${str(a)},${str(b)}) = ${str(c)}`);
      board = board.filter((_, k) => k !== i && k !== j);
      board.push(c);
      selected = -1;
      thousand = null;
      update();
    };
    const randomStep = () => {
      if (board.length < 2) return;
      const i = Math.floor(Math.random() * board.length);
      let j = Math.floor(Math.random() * (board.length - 1));
      if (j >= i) j++;
      combine(i, j);
    };
    const restart = () => {
      board = [...start];
      history = [];
      selected = -1;
      thousand = null;
      update();
    };

    // saisie de la liste
    const listInput = el('input', { type: 'text', class: 'lab-text', value: '1 2 3 4 5 6 7', 'aria-label': t('Nombres', 'Numbers') }) as HTMLInputElement;
    const applyList = () => {
      const nums = listInput.value.trim().split(/[\s,;]+/).filter(Boolean).map(Number);
      if (nums.length < 2 || nums.length > 12 || nums.some((x) => !Number.isInteger(x) || Math.abs(x) > 1000)) {
        api.say(`<div class="lab-bad">${t('Saisis de 2 à 12 entiers (valeurs absolues ≤ 1000) séparés par des espaces.', 'Enter 2 to 12 integers (absolute value ≤ 1000) separated by spaces.')}</div>`);
        return;
      }
      start = nums.map((x) => BigInt(x));
      restart();
    };
    listInput.addEventListener('change', applyList);

    const opSel = select<Op>(
      t('Opération', 'Operation'),
      [
        { value: 'diff', label: '|a − b|' },
        { value: 'sum', label: 'a + b' },
        { value: 'sumsub', label: 'a + b − 1' },
        { value: 'prodplus', label: 'a + b + ab' },
        { value: 'custom', label: t('personnalisée αa + βb + γab + δ', 'custom αa + βb + γab + δ') },
      ],
      op,
      (v) => {
        op = v;
        customBox.hidden = v !== 'custom';
        restart();
      },
    );
    const mk = (label: string, key: keyof typeof coef) =>
      param(label, -3, 3, coef[key], 1, (v) => {
        coef[key] = v;
        restart();
      });
    const customBox = group(t('Coefficients de f', 'Coefficients of f'), mk('α', 'al').row, mk('β', 'be').row, mk('γ', 'ga').row, mk('δ', 'de').row);
    customBox.hidden = true;

    controls.append(
      group(t('Nombres de départ', 'Starting numbers'), listInput, button(t('Appliquer', 'Apply'), applyList)),
      group(t('Opération', 'Operation'), opSel.row),
      customBox,
      group(
        t('Jeu', 'Game'),
        button(t('Un pas au hasard', 'A random step'), randomStep, 'primary'),
        button(t('Tout jouer', 'Play all'), () => {
          while (board.length > 1) randomStep();
        }),
        button(t('Recommencer', 'Restart'), restart),
        button(t('Mille parties', 'Thousand games'), () => {
          const values = new Map<string, number>();
          for (let g = 0; g < 1000; g++) {
            const b = [...start];
            while (b.length > 1) {
              const i = Math.floor(Math.random() * b.length);
              let j = Math.floor(Math.random() * (b.length - 1));
              if (j >= i) j++;
              const c = f(b[i], b[j]);
              const rest = b.filter((_, k) => k !== i && k !== j);
              rest.push(c);
              b.splice(0, b.length, ...rest);
            }
            const key = b[0].toString();
            values.set(key, (values.get(key) ?? 0) + 1);
          }
          thousand = { values, total: 1000 };
          update();
        }),
      ),
      group(
        t('Essais', 'Trials'),
        button(t('Noter', 'Record'), () => {
          const res = board.length === 1 ? str(board[0]) : '—';
          const same = thousand ? (thousand.values.size === 1 ? t('oui', 'yes') : t('non', 'no')) : '?';
          log.add([opLabel(), start.map(str).join(' '), res, same], thousand?.values.size === 1 ? 'ok' : undefined);
        }),
        button(t('Vider', 'Clear'), () => log.clear()),
      ),
    );

    const layout = () => {
      const r = Math.min(30, (stage.w - 16) / (board.length * 2.2));
      return { r: Math.max(16, r) };
    };
    stage.setDraw((ctx, w, h, p) => {
      const { r } = layout();
      const gap = (w - 16) / board.length;
      ctx.font = `700 ${Math.round(r * 0.7)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      board.forEach((v, i) => {
        const x = 8 + gap * (i + 0.5);
        const y = h / 2;
        ctx.fillStyle = i === selected ? '#f59e0b' : '#2563eb';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = p.surface;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        const txt = str(v);
        ctx.font = `700 ${Math.round(Math.min(r * 0.7, (r * 1.6) / Math.max(1, txt.length * 0.6)))}px system-ui, sans-serif`;
        ctx.fillText(txt, x, y + 1);
      });
    });
    stage.cv.style.cursor = 'pointer';
    stage.cv.addEventListener('pointerdown', (e) => {
      const rect = stage.cv.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * stage.w;
      const { r } = layout();
      const gap = (stage.w - 16) / board.length;
      const i = Math.floor((x - 8) / gap);
      if (i < 0 || i >= board.length) return;
      void r;
      if (selected < 0) {
        selected = i;
        stage.redraw();
      } else if (selected === i) {
        selected = -1;
        stage.redraw();
      } else combine(selected, i);
    });

    update();
  },
};
