import { button, el, gcd, group, param, toggle, type LabDef } from './core';

/**
 * Chapitre 5 — Théorie des nombres.
 * Les puissances d'un entier a modulo m : un cycle, de longueur « ord_m(a) ».
 * Quel lien avec φ(m) ? Pour quels m existe-t-il un a dont le cycle est maximal ?
 */

const phi = (m: number) => {
  let r = 0;
  for (let k = 1; k <= m; k++) if (gcd(k, m) === 1) r++;
  return r;
};

interface Orbit {
  seq: number[]; // 1, a, a², … jusqu'à la première répétition (exclue)
  start: number; // indice où commence le cycle
  period: number;
}

function orbit(a: number, m: number): Orbit {
  const seen = new Map<number, number>();
  const seq: number[] = [];
  let x = 1 % m;
  while (!seen.has(x)) {
    seen.set(x, seq.length);
    seq.push(x);
    x = (x * a) % m;
  }
  const start = seen.get(x)!;
  return { seq, start, period: seq.length - start };
}

const order = (a: number, m: number) => (gcd(a, m) === 1 ? orbit(a, m).period : 0);

export const def: LabDef = {
  chapter: '05-theorie-des-nombres',
  numero: 5,
  title: { fr: 'Le cycle des puissances', en: 'The cycle of powers' },
  statement: {
    fr: 'Fixons un module $m$ et un entier $a$ premier avec $m$. On regarde la suite $1, a, a^2, a^3, \\dots$ modulo $m$. Elle finit par revenir à $1$ : au bout de combien de pas, au plus ?',
    en: 'Fix a modulus $m$ and an integer $a$ coprime to $m$. Look at the sequence $1, a, a^2, a^3, \\dots$ modulo $m$. It eventually returns to $1$: after how many steps, at most?',
  },
  goal: {
    fr: 'Pour plusieurs $(m, a)$, relève la longueur $\\operatorname{ord}_m(a)$ du cycle et compare-la au nombre $\\varphi(m)$ d’entiers premiers avec $m$. Quelle relation ? Pour quels $m$ atteint-on $\\varphi(m)$ ?',
    en: 'For several $(m, a)$, record the cycle length $\\operatorname{ord}_m(a)$ and compare it with the number $\\varphi(m)$ of integers coprime to $m$. What relation? For which $m$ is $\\varphi(m)$ reached?',
  },
  steps: {
    fr: [
      'Au départ : <strong>$m = 13$</strong> et <strong>$a = 2$</strong> (modifiables au curseur, au clavier, ou en cliquant une pastille de la liste des $a$).',
      'Le cercle porte les restes $0, 1, \\dots, m-1$. Les flèches suivent $1 \\to a \\to a^2 \\to \\cdots$ (modulo $m$) ; <span class="lab-bad">1</span> est le départ, les nœuds <span class="lab-ok">verts</span> forment le cycle.',
      'Sous le dessin : la <strong>longueur du cycle</strong> $\\operatorname{ord}_m(a)$ et $\\varphi(m)$. Les pastilles donnent l’ordre de chaque $a$ premier avec $m$ ; bord vert = ordre maximal.',
      '<strong>Balayer</strong> remplit le tableau pour $m = 2\\dots 40$ : pour quels $m$ existe-t-il un $a$ d’ordre maximal ? Le tableau « Comment c’est calculé » détaille les puissances.',
    ],
    en: [
      'At the start: <strong>$m = 13$</strong> and <strong>$a = 2$</strong> (editable with the slider, the keyboard, or by clicking a chip in the list of $a$).',
      'The circle holds the residues $0, 1, \\dots, m-1$. Arrows follow $1 \\to a \\to a^2 \\to \\cdots$ (modulo $m$); <span class="lab-bad">1</span> is the start, <span class="lab-ok">green</span> nodes form the cycle.',
      'Under the drawing: the <strong>cycle length</strong> $\\operatorname{ord}_m(a)$ and $\\varphi(m)$. Chips give the order of each $a$ coprime to $m$; green border = maximal order.',
      '<strong>Sweep</strong> fills the table for $m = 2\\dots 40$: for which $m$ is there an $a$ of maximal order? The “How it is computed” table details the powers.',
    ],
  },
  legend: [
    { color: '#d6362b', fr: 'départ : 1', en: 'start: 1' },
    { color: '#1d7a33', fr: 'nœud du cycle', en: 'node in the cycle' },
    { color: '#6b7280', fr: 'avant le cycle (a non premier avec m)', en: 'before the cycle (a not coprime to m)' },
  ],
  hints: {
    fr: [
      'Fixe $m$ premier (7, 11, 13…) et fais varier $a$ : que vaut toujours $\\operatorname{ord}_m(a)$ par rapport à $m - 1$ ?',
      'Passe à $m$ composé (8, 12, 15…). Compare avec $\\varphi(m)$ plutôt qu’avec $m - 1$. Les longueurs de cycle divisent-elles $\\varphi(m)$ ?',
      'Les $a$ premiers avec $m$ forment un groupe pour la multiplication : multiplier par $a$ permute ces résidus, et les cycles sont de même longueur.',
    ],
    en: [
      'Fix a prime $m$ (7, 11, 13…) and vary $a$: how does $\\operatorname{ord}_m(a)$ always compare with $m - 1$?',
      'Switch to composite $m$ (8, 12, 15…). Compare with $\\varphi(m)$ rather than $m - 1$. Does the cycle length divide $\\varphi(m)$?',
      'The $a$ coprime to $m$ form a group under multiplication: multiplying by $a$ permutes these residues, and all cycles have the same length.',
    ],
  },
  general: {
    fr: '<p><strong>Théorème d’Euler.</strong> Si $\\gcd(a, m) = 1$, alors $a^{\\varphi(m)} \\equiv 1 \\pmod m$. Donc $\\operatorname{ord}_m(a)$ <em>divise</em> $\\varphi(m)$. Pour $m = p$ premier c’est le petit théorème de Fermat : $a^{p-1} \\equiv 1$.</p><p>Il existe un $a$ d’ordre exactement $\\varphi(m)$ (racine primitive) <strong>si et seulement si</strong> $m \\in \\{1, 2, 4, p^k, 2p^k\\}$ avec $p$ premier impair : c’est ce que le balayage des $m$ laisse deviner.</p>',
    en: '<p><strong>Euler’s theorem.</strong> If $\\gcd(a, m) = 1$ then $a^{\\varphi(m)} \\equiv 1 \\pmod m$. Hence $\\operatorname{ord}_m(a)$ <em>divides</em> $\\varphi(m)$. For $m = p$ prime this is Fermat’s little theorem: $a^{p-1} \\equiv 1$.</p><p>An $a$ of order exactly $\\varphi(m)$ (primitive root) exists <strong>if and only if</strong> $m \\in \\{1, 2, 4, p^k, 2p^k\\}$ with $p$ an odd prime — which the sweep over $m$ lets you guess.</p>',
  },
  aspect: 0.78,
  logEmpty: { fr: 'Note quelques cas, ou lance le balayage des modules.', en: 'Record a few cases or run the sweep over moduli.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let m = 13;
    let a = 2;
    let showK = 16;
    log.setColumns(['m', 'a', 'ord', 'φ(m)', 'φ ÷ ord']);

    const chipBox = el('div', { class: 'lab-chips' });
    api.readout.after(chipBox);

    const factorStr = (n: number) => {
      const parts: string[] = [];
      let x = n;
      for (let p = 2; p * p <= x; p++) {
        let e = 0;
        while (x % p === 0) (x /= p), e++;
        if (e) parts.push(e > 1 ? `${p}^{${e}}` : String(p));
      }
      if (x > 1) parts.push(String(x));
      return parts.join(' \\cdot ') || '1';
    };
    const primesOf = (n: number) => {
      const out: number[] = [];
      let x = n;
      for (let p = 2; p * p <= x; p++) if (x % p === 0) (out.push(p), (() => { while (x % p === 0) x /= p; })());
      if (x > 1) out.push(x);
      return out;
    };

    const update = () => {
      a = Math.min(Math.max(1, a), Math.max(1, m - 1));
      const o = orbit(a, m);
      const coprime = gcd(a, m) === 1;
      const ph = phi(m);
      api.say(
        `<div class="lab-big">$${a}^k \\bmod ${m}$ : ${o.seq.slice(0, 16).join(', ')}${o.seq.length > 16 ? ', …' : ''}</div>` +
          (coprime
            ? `<div>${t('Longueur du cycle', 'Cycle length')} <strong>ord = ${o.period}</strong> · $\\varphi(${m}) = ${ph}$ · ${t('divise ?', 'divides?')} ${ph % o.period === 0 ? '<span class="lab-ok">✔</span>' : '<span class="lab-bad">✘</span>'}` +
              (o.period === ph ? ` · <span class="lab-ok">${t('cycle maximal : racine primitive', 'maximal cycle: primitive root')}</span>` : '') +
              '</div>'
            : `<div class="lab-note">${t(`$\\gcd(${a}, ${m}) = ${gcd(a, m)} \\neq 1$ : la suite ne revient pas à 1 (elle entre dans un cycle après ${o.start} pas).`, `$\\gcd(${a}, ${m}) = ${gcd(a, m)} \\neq 1$: the sequence never returns to 1 (it enters a cycle after ${o.start} steps).`)}</div>`),
      );
      // tableau des puissances : a^k = a^(k-1) · a mod m
      let x = 1 % m;
      const rows: string[] = [];
      for (let k = 0; k <= Math.min(showK, 40); k++) {
        rows.push(`<tr><td>${k}</td><td>${k === 0 ? '1' : `${rows.length ? '(prév.)' : ''}`}</td><td>${x}</td></tr>`);
        x = (x * a) % m;
      }
      const table =
        `<table><tr><th>k</th><th>${t('calcul', 'computation')}</th><th>$${a}^k \\bmod ${m}$</th></tr>` +
        (() => {
          let v = 1 % m;
          const out: string[] = [`<tr><td>0</td><td>1</td><td>${v}</td></tr>`];
          for (let k = 1; k <= Math.min(showK, 40); k++) {
            const prev = v;
            v = (prev * a) % m;
            out.push(`<tr><td>${k}</td><td>${prev} × ${a} = ${prev * a} = ${Math.floor((prev * a) / m)}·${m} + ${v}</td><td><strong>${v}</strong></td></tr>`);
          }
          return out.join('');
        })() +
        '</table>';
      void rows;
      const ps = primesOf(m);
      api.calc(
        `<p>$m = ${factorStr(m)}$ ⇒ $\\varphi(m) = m\\prod_{p \\mid m}(1 - \\tfrac1p) = ${m}${ps.map((p) => `\\cdot \\tfrac{${p - 1}}{${p}}`).join('')} = ${ph}$.</p>` +
          `<p>${t('Chaque puissance se calcule à partir de la précédente (inutile de calculer $a^k$ en entier)', 'Each power is computed from the previous one (no need to compute $a^k$ in full)')} :</p>` +
          table,
      );
      chipBox.replaceChildren(
        ...Array.from({ length: m - 1 }, (_, i) => i + 1)
          .filter((k) => gcd(k, m) === 1)
          .map((k) => {
            const ord = order(k, m);
            const b = el('button', { type: 'button', class: `lab-chip${k === a ? ' is-on' : ''}${ord === ph ? ' is-max' : ''}`, title: `a = ${k}` }, `${k}`, el('small', {}, `ord ${ord}`));
            b.addEventListener('click', () => {
              a = k;
              aP.set(k);
              update();
            });
            return b;
          }),
      );
      stage.redraw();
    };

    const mP = param('m', 2, 200, m, 1, (v) => {
      m = v;
      aP.setRange(1, Math.max(1, m - 1));
      update();
    });
    const aP = param('a', 1, m - 1, a, 1, (v) => {
      a = v;
      update();
    });
    const kP = param(t('lignes du tableau', 'table rows'), 4, 40, showK, 1, (v) => ((showK = v), update()));

    controls.append(
      group(t('Module et base', 'Modulus and base'), mP.row, aP.row, kP.row),
      group(
        t('Essais', 'Trials'),
        button(t('Noter', 'Record'), () => {
          const ord = order(a, m);
          const ph = phi(m);
          log.add([m, a, ord || '—', ph, ord ? ph / ord : '—'], ord === ph ? 'ok' : undefined);
        }, 'primary'),
        button(t('Balayer m = 2…40', 'Sweep m = 2…40'), () => {
          log.setColumns(['m', 'φ(m)', t('racines primitives', 'primitive roots'), t('existe ?', 'exists?')]);
          log.clear();
          for (let k = 40; k >= 2; k--) {
            const ph = phi(k);
            let cnt = 0;
            for (let x = 1; x < k; x++) if (gcd(x, k) === 1 && order(x, k) === ph) cnt++;
            log.add([k, ph, cnt, cnt > 0 ? '✔' : '✘'], cnt > 0 ? 'ok' : 'bad');
          }
        }),
        button(t('Réinitialiser le journal', 'Reset the log'), () => {
          log.setColumns(['m', 'a', 'ord', 'φ(m)', 'φ ÷ ord']);
          log.clear();
        }),
      ),
    );
    void toggle;

    stage.setDraw((ctx, w, h, p) => {
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) / 2 - 34;
      const o = orbit(a, m);
      const pos = (v: number) => ({
        x: cx + R * Math.cos(-Math.PI / 2 + (2 * Math.PI * v) / m),
        y: cy + R * Math.sin(-Math.PI / 2 + (2 * Math.PI * v) / m),
      });
      const inCycle = new Set(o.seq.slice(o.start));
      const inSeq = new Set(o.seq);
      ctx.strokeStyle = p.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = p.primary;
      ctx.lineWidth = 2;
      const arrow = (u: number, v: number) => {
        const A = pos(u);
        const B = pos(v);
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const len = Math.hypot(dx, dy) || 1;
        const mx = (A.x + B.x) / 2 + (-dy / len) * 0.12 * len;
        const my = (A.y + B.y) / 2 + (dx / len) * 0.12 * len;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.quadraticCurveTo(mx, my, B.x, B.y);
        ctx.stroke();
        const ang = Math.atan2(B.y - my, B.x - mx);
        ctx.beginPath();
        ctx.moveTo(B.x - 9 * Math.cos(ang - 0.4), B.y - 9 * Math.sin(ang - 0.4));
        ctx.lineTo(B.x, B.y);
        ctx.lineTo(B.x - 9 * Math.cos(ang + 0.4), B.y - 9 * Math.sin(ang + 0.4));
        ctx.stroke();
      };
      for (let i = 0; i < o.seq.length; i++) {
        const next = i + 1 < o.seq.length ? o.seq[i + 1] : o.seq[o.start];
        if (next !== o.seq[i]) arrow(o.seq[i], next);
      }
      const nodeR = m > 120 ? 4 : m > 60 ? 7 : m > 40 ? 9 : 12;
      for (let v = 0; v < m; v++) {
        const q = pos(v);
        const on = inSeq.has(v);
        ctx.fillStyle = v === 1 % m ? p.accent : inCycle.has(v) ? p.primary : on ? p.muted : p.surface;
        ctx.strokeStyle = p.ink;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(q.x, q.y, nodeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (nodeR >= 8) {
          ctx.fillStyle = on ? '#fff' : p.ink;
          ctx.font = `600 ${nodeR > 10 ? 10 : 8}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(v), q.x, q.y + 0.5);
        }
      }
      ctx.fillStyle = p.muted;
      ctx.font = '13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t(`multiplier par ${a} modulo ${m}`, `multiply by ${a} modulo ${m}`), cx, cy);
    });

    update();
  },
};
