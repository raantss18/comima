import { button, fmt, group, numField, param, select, type LabDef } from './core';

/**
 * Chapitre 1 — Récurrence.
 * u(n+2) = a·u(n+1) + b·u(n) : somme, déterminant de Cassini, carrés, pgcd, rapport.
 * Le calcul est exact (BigInt) ; chaque identité est testée terme à terme.
 */

type Ident = 'sum' | 'cassini' | 'squares' | 'gcd';

function sequence(a: bigint, b: bigint, u0: bigint, u1: bigint, N: number): bigint[] {
  const u = [u0, u1];
  for (let i = 2; i <= N; i++) u.push(a * u[i - 1] + b * u[i - 2]);
  return u.slice(0, N + 1);
}
const gcdBig = (x: bigint, y: bigint): bigint => {
  x = x < 0n ? -x : x;
  y = y < 0n ? -y : y;
  while (y) [x, y] = [y, x % y];
  return x;
};
const short = (v: bigint) => {
  const s = v.toString();
  return s.length > 12 ? `${s.slice(0, 1)}.${s.slice(1, 5)}e${s.length - 1}` : s;
};

export const def: LabDef = {
  chapter: '01-recurrence',
  numero: 1,
  title: { fr: 'Suites récurrentes et identités', en: 'Recurrent sequences and identities' },
  statement: {
    fr: 'Soit la suite $u_0, u_1, \\dots$ définie par $u_{n+2} = a\\,u_{n+1} + b\\,u_n$. Pour Fibonacci ($a = b = 1$, $u_0 = 0$, $u_1 = 1$) on connaît des identités : $\\sum_{k \\le n} u_k = u_{n+2} - 1$, $u_{n+1}u_{n-1} - u_n^2 = (-1)^n$… Lesquelles survivent quand on change $a$, $b$, $u_0$, $u_1$ ?',
    en: 'Let the sequence $u_0, u_1, \\dots$ be defined by $u_{n+2} = a\\,u_{n+1} + b\\,u_n$. For Fibonacci ($a = b = 1$, $u_0 = 0$, $u_1 = 1$) we know identities: $\\sum_{k \\le n} u_k = u_{n+2} - 1$, $u_{n+1}u_{n-1} - u_n^2 = (-1)^n$… Which ones survive when $a$, $b$, $u_0$, $u_1$ change?',
  },
  goal: {
    fr: 'Pour chaque identité, trouve les valeurs de $(a, b, u_0, u_1)$ où elle reste vraie, <em>puis</em> la formule qui la remplace quand elle devient fausse. Observe aussi la limite de $u_{n+1}/u_n$.',
    en: 'For each identity, find the values of $(a, b, u_0, u_1)$ where it stays true, <em>then</em> the formula replacing it when it fails. Also watch the limit of $u_{n+1}/u_n$.',
  },
  steps: {
    fr: [
      'Au départ : <strong>Fibonacci</strong> — $a = 1,\\ b = 1,\\ u_0 = 0,\\ u_1 = 1$, 15 termes (tout est modifiable : curseurs ou clavier). Les boutons « Suites célèbres » chargent Lucas, Pell, etc.',
      'En haut : les termes $u_n$ (barres, échelle logarithmique). En bas : le rapport $u_{n+1}/u_n$ et sa limite (pointillés).',
      'Choisis une <strong>identité à tester</strong> : le tableau « Comment c’est calculé » compare le membre de gauche et celui de droite pour chaque $n$ (✔ ou ✘).',
      'Change les paramètres jusqu’à trouver quand l’identité est vraie. <strong>Noter</strong> enregistre le cas ; pour « pgcd », règle aussi $m$ et $n$.',
    ],
    en: [
      'At the start: <strong>Fibonacci</strong> — $a = 1,\\ b = 1,\\ u_0 = 0,\\ u_1 = 1$, 15 terms (everything is editable: sliders or keyboard). The “Famous sequences” buttons load Lucas, Pell, etc.',
      'Top: the terms $u_n$ (bars, logarithmic scale). Bottom: the ratio $u_{n+1}/u_n$ and its limit (dotted).',
      'Pick an <strong>identity to test</strong>: the “How it is computed” table compares the left and right sides for each $n$ (✔ or ✘).',
      'Change the parameters until you find when the identity holds. <strong>Record</strong> saves the case; for “gcd”, also set $m$ and $n$.',
    ],
  },
  legend: [
    { color: '#2563eb', fr: 'terme positif', en: 'positive term' },
    { color: '#d6362b', fr: 'terme négatif', en: 'negative term' },
    { color: '#1d7a33', fr: 'rapport u(n+1)/u(n)', en: 'ratio u(n+1)/u(n)' },
    { color: '#f59e0b', fr: 'limite (racine dominante)', en: 'limit (dominant root)' },
  ],
  hints: {
    fr: [
      'Teste la somme avec Fibonacci, puis avec Lucas ($u_0 = 2$) : que devient $\\sum u_k - u_{n+2}$ ? Cette différence est-elle constante ?',
      'Pour Cassini, regarde le rapport $D_{n+1}/D_n$ sur plusieurs suites. Quel lien avec $b$ ?',
      'Les rapports $u_{n+1}/u_n$ convergent vers une racine de $x^2 = ax + b$. Laquelle ? Que se passe-t-il quand $a^2 + 4b < 0$ ?',
    ],
    en: [
      'Test the sum with Fibonacci, then with Lucas ($u_0 = 2$): what becomes of $\\sum u_k - u_{n+2}$? Is the difference constant?',
      'For Cassini, look at the ratio $D_{n+1}/D_n$ across several sequences. How does it relate to $b$?',
      'The ratios $u_{n+1}/u_n$ converge to a root of $x^2 = ax + b$. Which one? What happens when $a^2 + 4b < 0$?',
    ],
  },
  general: {
    fr: '<p><strong>Cassini généralisé.</strong> $D_n = u_{n+1}u_{n-1} - u_n^2$ vérifie $D_{n+1} = (-b)\\,D_n$, donc $D_n = (-b)^{n-1} D_1$ avec $D_1 = u_2u_0 - u_1^2$. Pour Fibonacci : $D_n = (-1)^n$.</p><p><strong>Sommes.</strong> Si $a = b = 1$ : $\\sum_{k=0}^{n} u_k = u_{n+2} - u_1$ (télescopage), pour toute valeur initiale. Si $a = b = 1$ et $u_0 = 0$, $u_1 = 1$ : $\\sum u_k^2 = u_nu_{n+1}$ et $\\gcd(u_m, u_n) = u_{\\gcd(m,n)}$.</p><p><strong>Limite.</strong> Si $r_+ = \\frac{a + \\sqrt{a^2+4b}}{2}$ est la racine de plus grand module, $u_{n+1}/u_n \\to r_+$ (le nombre d’or $\\varphi$ pour Fibonacci).</p>',
    en: '<p><strong>Generalised Cassini.</strong> $D_n = u_{n+1}u_{n-1} - u_n^2$ satisfies $D_{n+1} = (-b)\\,D_n$, so $D_n = (-b)^{n-1} D_1$ with $D_1 = u_2u_0 - u_1^2$. For Fibonacci: $D_n = (-1)^n$.</p><p><strong>Sums.</strong> If $a = b = 1$: $\\sum_{k=0}^{n} u_k = u_{n+2} - u_1$ (telescoping), for any initial values. If $a = b = 1$ and $u_0 = 0$, $u_1 = 1$: $\\sum u_k^2 = u_nu_{n+1}$ and $\\gcd(u_m, u_n) = u_{\\gcd(m,n)}$.</p><p><strong>Limit.</strong> If $r_+ = \\frac{a + \\sqrt{a^2+4b}}{2}$ is the root of larger modulus, $u_{n+1}/u_n \\to r_+$ (the golden ratio $\\varphi$ for Fibonacci).</p>',
  },
  aspect: 0.8,
  logEmpty: { fr: 'Appuie sur « Noter » pour garder un cas.', en: 'Press “Record” to keep a case.' },
  init(api) {
    const { t, stage, controls, log } = api;
    let a = 1;
    let b = 1;
    let u0 = 0;
    let u1 = 1;
    let N = 15;
    let ident: Ident = 'sum';
    let gm = 6;
    let gn = 9;
    log.setColumns(['(a,b)', '(u₀,u₁)', t('identité', 'identity'), t('vraie ?', 'true?')]);

    const data = () => {
      const u = sequence(BigInt(a), BigInt(b), BigInt(u0), BigInt(u1), Math.max(N, gm, gn) + 2);
      return u;
    };

    /** Lignes du tableau de test : n, membre gauche, membre droit. */
    const rows = (u: bigint[]) => {
      const out: { n: number; l: bigint; r: bigint; ln: string; rn: string }[] = [];
      if (ident === 'sum') {
        let s = 0n;
        for (let n = 0; n <= N; n++) {
          s += u[n];
          const r = u[n + 2] - u[1];
          out.push({ n, l: s, r, ln: 'Σ u_k', rn: 'u(n+2) − u₁' });
        }
      } else if (ident === 'cassini') {
        for (let n = 1; n <= N; n++) {
          const d = u[n + 1] * u[n - 1] - u[n] * u[n];
          const d1 = u[2] * u[0] - u[1] * u[1];
          const r = d1 * (BigInt(-b) ** BigInt(n - 1));
          out.push({ n, l: d, r, ln: 'u(n+1)u(n−1) − u(n)²', rn: '(−b)^(n−1)·D₁' });
        }
      } else if (ident === 'squares') {
        let s = 0n;
        for (let n = 0; n <= N; n++) {
          s += u[n] * u[n];
          out.push({ n, l: s, r: u[n] * u[n + 1], ln: 'Σ u_k²', rn: 'u(n)·u(n+1)' });
        }
      }
      return out;
    };

    const analyse = () => {
      const u = data();
      const disc = a * a + 4 * b;
      const rp = disc >= 0 ? (a + Math.sqrt(disc)) / 2 : NaN;
      const rm = disc >= 0 ? (a - Math.sqrt(disc)) / 2 : NaN;
      let verdict = '';
      let allOk = true;
      let table = '';
      if (ident === 'gcd') {
        const g = gcdBig(u[gm], u[gn]);
        const idx = Number(gcdBig(BigInt(gm), BigInt(gn)));
        const ok = g === gcdBig(u[idx], 0n) && true;
        allOk = ok;
        table = `<p>$\\gcd(u_{${gm}}, u_{${gn}}) = \\gcd(${short(u[gm])}, ${short(u[gn])}) = ${short(g)}$</p>` +
          `<p>$\\gcd(${gm}, ${gn}) = ${idx}$ ⇒ $u_{${idx}} = ${short(u[idx])}$ ${ok ? '✔' : '✘'}</p>`;
        verdict = ok ? '✔' : '✘';
      } else {
        const rs = rows(u);
        allOk = rs.every((x) => x.l === x.r);
        const first = rs.find((x) => x.l !== x.r);
        verdict = allOk ? `✔ ${t('vraie pour tous les n testés', 'true for every tested n')}` : `✘ ${t('fausse dès n =', 'false from n =')} ${first!.n}`;
        table =
          `<p>${t('Membre gauche', 'Left side')} : $${rs[0]?.ln}$ — ${t('membre droit', 'right side')} : $${rs[0]?.rn}$</p>` +
          `<table><tr><th>n</th><th>${t('gauche', 'left')}</th><th>${t('droite', 'right')}</th><th></th></tr>` +
          rs.slice(0, 18).map((x) => `<tr><td>${x.n}</td><td>${short(x.l)}</td><td>${short(x.r)}</td><td>${x.l === x.r ? '✔' : '✘'}</td></tr>`).join('') +
          '</table>';
      }
      api.say(
        `<div class="lab-big">$u_{n+2} = ${a}\\,u_{n+1} ${b < 0 ? '-' : '+'} ${Math.abs(b)}\\,u_n$ · $u_0 = ${u0},\\ u_1 = ${u1}$</div>` +
          `<div>${t('Termes', 'Terms')} : ${u.slice(0, 10).map(short).join(', ')}${u.length > 10 ? ', …' : ''}</div>` +
          `<div>${t('Identité testée', 'Tested identity')} : <strong class="${allOk ? 'lab-ok' : 'lab-bad'}">${verdict}</strong></div>`,
      );
      api.calc(
        `<p>$r^2 = ${a}r ${b < 0 ? '-' : '+'} ${Math.abs(b)}$ ⇒ ${t('discriminant', 'discriminant')} $\\Delta = a^2 + 4b = ${a * a} + ${4 * b} = ${disc}$` +
          (disc >= 0 ? `, ${t('racines', 'roots')} $r_\\pm = ${fmt(rp, 4)}\\ ;\\ ${fmt(rm, 4)}$` : `, ${t('racines complexes : les rapports ne convergent pas', 'complex roots: the ratios do not converge')}`) +
          `</p>` + table,
      );
      stage.redraw();
      return { allOk };
    };

    const gmF = numField('m', gm, (v) => ((gm = Math.round(v)), analyse()), { min: 1, max: 28, width: '3.6rem' });
    const gnF = numField('n', gn, (v) => ((gn = Math.round(v)), analyse()), { min: 1, max: 28, width: '3.6rem' });
    const identSel = select<Ident>(
      t('Identité à tester', 'Identity to test'),
      [
        { value: 'sum', label: t('somme  Σ u_k = u(n+2) − u₁', 'sum  Σ u_k = u(n+2) − u₁') },
        { value: 'cassini', label: t('Cassini  u(n+1)u(n−1) − u(n)² = (−b)^(n−1)·D₁', 'Cassini  u(n+1)u(n−1) − u(n)² = (−b)^(n−1)·D₁') },
        { value: 'squares', label: t('carrés  Σ u_k² = u(n)u(n+1)', 'squares  Σ u_k² = u(n)u(n+1)') },
        { value: 'gcd', label: t('pgcd  gcd(u_m,u_n) = u_gcd(m,n)', 'gcd  gcd(u_m,u_n) = u_gcd(m,n)') },
      ],
      ident,
      (v) => {
        ident = v;
        gmF.row.hidden = gnF.row.hidden = v !== 'gcd';
        analyse();
      },
    );
    gmF.row.hidden = gnF.row.hidden = true;

    const aP = param('a', -6, 6, a, 1, (v) => ((a = v), analyse()));
    const bP = param('b', -6, 6, b, 1, (v) => ((b = v), analyse()));
    const u0P = param('u₀', -20, 20, u0, 1, (v) => ((u0 = v), analyse()));
    const u1P = param('u₁', -20, 20, u1, 1, (v) => ((u1 = v), analyse()));
    const NP = param(t('termes', 'terms'), 5, 28, N, 1, (v) => ((N = v), analyse()));

    const preset = (name: string, pa: number, pb: number, p0: number, p1: number) =>
      button(name, () => {
        a = pa; b = pb; u0 = p0; u1 = p1;
        aP.set(a); bP.set(b); u0P.set(u0); u1P.set(u1);
        analyse();
      });

    controls.append(
      group(t('Récurrence', 'Recurrence'), aP.row, bP.row, u0P.row, u1P.row, NP.row),
      group(
        t('Suites célèbres', 'Famous sequences'),
        preset('Fibonacci', 1, 1, 0, 1),
        preset('Lucas', 1, 1, 2, 1),
        preset('Pell', 2, 1, 0, 1),
        preset('Jacobsthal', 1, 2, 0, 1),
        preset(t('arithmétique', 'arithmetic'), 2, -1, 3, 5),
        preset(t('puissances de 2', 'powers of 2'), 2, 0, 1, 2),
      ),
      group(t('Identité', 'Identity'), identSel.row, gmF.row, gnF.row),
      group(
        t('Essais', 'Trials'),
        button(t('Noter', 'Record'), () => {
          const { allOk } = analyse();
          log.add([`(${a},${b})`, `(${u0},${u1})`, ident, allOk ? '✔' : '✘'], allOk ? 'ok' : 'bad');
        }, 'primary'),
        button(t('Vider', 'Clear'), () => log.clear()),
      ),
    );

    stage.setDraw((ctx, w, h, p) => {
      const u = data().slice(0, N + 1);
      const split = h * 0.58;
      ctx.font = '11px system-ui, sans-serif';
      // barres (échelle log signée)
      const mag = (v: bigint) => Math.log10(Math.abs(Number(v)) + 1);
      const maxM = Math.max(1, ...u.map(mag));
      const axis = split * 0.5;
      ctx.strokeStyle = p.line;
      ctx.beginPath();
      ctx.moveTo(30, axis);
      ctx.lineTo(w - 8, axis);
      ctx.stroke();
      const bw = (w - 40) / u.length;
      u.forEach((v, i) => {
        const hgt = (mag(v) / maxM) * (axis - 12);
        ctx.fillStyle = v >= 0n ? '#2563eb' : '#d6362b';
        ctx.globalAlpha = 0.85;
        const x = 32 + i * bw + bw * 0.12;
        if (v >= 0n) ctx.fillRect(x, axis - hgt, bw * 0.76, hgt);
        else ctx.fillRect(x, axis, bw * 0.76, hgt);
        ctx.globalAlpha = 1;
        if (bw > 22) {
          ctx.fillStyle = p.muted;
          ctx.textAlign = 'center';
          ctx.fillText(String(i), x + bw * 0.38, split - 2);
        }
      });
      ctx.fillStyle = p.muted;
      ctx.textAlign = 'left';
      ctx.fillText(t('u(n), échelle log', 'u(n), log scale'), 34, 12);
      // rapports
      const r: { i: number; v: number }[] = [];
      for (let i = 1; i < u.length - 1; i++) if (u[i] !== 0n) r.push({ i, v: Number(u[i + 1]) / Number(u[i]) });
      const clip = (v: number) => Math.max(-8, Math.min(8, v));
      const disc = a * a + 4 * b;
      const lim = disc >= 0 ? (a + Math.sqrt(disc)) / 2 : NaN;
      const vals = r.map((q) => clip(q.v)).concat(isFinite(lim) ? [clip(lim)] : []);
      const lo = Math.min(...vals, 0) - 0.2;
      const hi = Math.max(...vals, 1) + 0.2;
      const top = split + 18;
      const bot = h - 14;
      const Y = (v: number) => bot - ((clip(v) - lo) / (hi - lo || 1)) * (bot - top);
      const X = (i: number) => 32 + i * bw + bw / 2;
      ctx.strokeStyle = p.line;
      ctx.beginPath();
      ctx.moveTo(30, Y(0));
      ctx.lineTo(w - 8, Y(0));
      ctx.stroke();
      if (isFinite(lim)) {
        ctx.strokeStyle = '#f59e0b';
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30, Y(lim));
        ctx.lineTo(w - 8, Y(lim));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#b45309';
        ctx.textAlign = 'right';
        ctx.fillText(`${fmt(lim, 4)}`, w - 10, Y(lim) - 4);
      }
      ctx.strokeStyle = '#1d7a33';
      ctx.lineWidth = 2;
      ctx.beginPath();
      r.forEach((q, k) => (k ? ctx.lineTo(X(q.i), Y(q.v)) : ctx.moveTo(X(q.i), Y(q.v))));
      ctx.stroke();
      r.forEach((q) => {
        ctx.fillStyle = '#1d7a33';
        ctx.beginPath();
        ctx.arc(X(q.i), Y(q.v), 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = p.muted;
      ctx.textAlign = 'left';
      ctx.fillText(t('rapport u(n+1)/u(n)', 'ratio u(n+1)/u(n)'), 34, split + 12);
    });

    analyse();
  },
};
