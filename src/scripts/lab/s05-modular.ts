import { button, el, gcd, slider, type LabDef } from './core';

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
    log.setColumns(['m', 'a', 'ord', 'φ(m)', 'φ ÷ ord']);

    const chipBox = el('div', { class: 'lab-chips' });
    api.readout.after(chipBox);

    const update = () => {
      a = Math.min(Math.max(1, a), m - 1 || 1);
      const o = orbit(a, m);
      const coprime = gcd(a, m) === 1;
      const ph = phi(m);
      const lines = [
        `<div class="lab-big">$${a}^k \\bmod ${m}$ : ${o.seq.slice(0, 16).join(', ')}${o.seq.length > 16 ? ', …' : ''}</div>`,
      ];
      if (coprime) {
        lines.push(
          `<div>${t('Longueur du cycle', 'Cycle length')} <strong>ord = ${o.period}</strong> · $\\varphi(${m}) = ${ph}$ · ` +
            `${t('divise ?', 'divides?')} ${ph % o.period === 0 ? '<span class="lab-ok">✔</span>' : '<span class="lab-bad">✘</span>'}` +
            (o.period === ph ? ` · <span class="lab-ok">${t('cycle maximal : racine primitive', 'maximal cycle: primitive root')}</span>` : '') +
            '</div>',
        );
      } else {
        lines.push(
          `<div class="lab-note">${t(`$\\gcd(${a}, ${m}) = ${gcd(a, m)} \\neq 1$ : la suite ne revient pas à 1 (elle entre dans un cycle après ${o.start} pas).`, `$\\gcd(${a}, ${m}) = ${gcd(a, m)} \\neq 1$: the sequence never returns to 1 (it enters a cycle after ${o.start} steps).`)}</div>`,
        );
      }
      api.say(lines.join(''));
      // pastilles : ordre de chaque a premier avec m
      chipBox.replaceChildren(
        ...Array.from({ length: m - 1 }, (_, i) => i + 1)
          .filter((k) => gcd(k, m) === 1)
          .map((k) => {
            const ord = order(k, m);
            const b = el('button', { type: 'button', class: `lab-chip${k === a ? ' is-on' : ''}${ord === ph ? ' is-max' : ''}`, title: `a = ${k}` }, `${k}`, el('small', {}, `ord ${ord}`));
            b.addEventListener('click', () => {
              a = k;
              aSlider.set(k);
              update();
            });
            return b;
          }),
      );
      document.dispatchEvent(new CustomEvent('comima:render-math'));
      stage.redraw();
    };

    const mSlider = slider('m', 2, 60, m, 1, (v) => {
      m = v;
      aSlider.input.max = String(Math.max(1, m - 1));
      update();
    });
    const aSlider = slider('a', 1, m - 1, a, 1, (v) => {
      a = v;
      update();
    });

    controls.append(
      mSlider.row,
      aSlider.row,
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
    );

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
      // flèches 1 → a → a² → …
      ctx.strokeStyle = p.primary;
      ctx.fillStyle = p.primary;
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
        ctx.moveTo(B.x - 9 * Math.cos(ang - 0.4) , B.y - 9 * Math.sin(ang - 0.4));
        ctx.lineTo(B.x, B.y);
        ctx.lineTo(B.x - 9 * Math.cos(ang + 0.4), B.y - 9 * Math.sin(ang + 0.4));
        ctx.stroke();
      };
      for (let i = 0; i < o.seq.length; i++) {
        const next = i + 1 < o.seq.length ? o.seq[i + 1] : o.seq[o.start];
        if (next !== o.seq[i]) arrow(o.seq[i], next);
      }
      for (let v = 0; v < m; v++) {
        const q = pos(v);
        const on = inSeq.has(v);
        ctx.fillStyle = v === 1 % m ? p.accent : inCycle.has(v) ? p.primary : on ? p.muted : p.surface;
        ctx.strokeStyle = p.ink;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(q.x, q.y, m > 40 ? 9 : 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = on ? '#fff' : p.ink;
        ctx.font = `600 ${m > 40 ? 8 : 10}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(v), q.x, q.y + 0.5);
      }
      ctx.fillStyle = p.muted;
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(t(`multiplier par ${a} modulo ${m}`, `multiply by ${a} modulo ${m}`), cx, cy);
    });

    update();
  },
};
