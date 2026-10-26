// Quiz de la page Entraînement : mêmes questions et même moteur de correction (Rust compilé
// en WebAssembly) que l'application Android. Progression gardée dans ce navigateur.
import katex from 'katex';
import * as store from './web-store.ts';

type Q = Record<string, any>;
type Verdict = { status: 'correct' | 'incorrect' | 'invalid' | 'manual'; code?: string; parts?: Verdict[] };

const TXT = {
  fr: {
    loading: 'Chargement du correcteur…',
    engineFail: 'Le correcteur n’a pas pu se charger (navigateur trop ancien ?). Tu peux lire les questions et leurs explications.',
    check: 'Vérifier',
    next: 'Question suivante',
    finish: 'Voir le bilan',
    again: 'Recommencer',
    correct: 'Bonne réponse !',
    incorrect: 'Pas tout à fait.',
    explanation: 'Explication',
    hint: 'Indice',
    yourAnswer: 'Ta réponse',
    true: 'Vrai',
    false: 'Faux',
    several: 'Plusieurs réponses peuvent être justes.',
    order: 'Remets les étapes dans l’ordre avec ↑ et ↓ ; écarte l’étape fausse avec ✕.',
    manual: 'Ce type de question (code, simulation, preuve rédigée) se travaille avec ton encadreur ou dans l’application. Lis l’explication.',
    showExpl: 'Voir l’explication',
    bonus: (n: number) => `Défis au choix (${n}) — facultatifs, hors score`,
    bonusIntro: 'Code, simulation ou preuve rédigée : on ne peut pas les corriger automatiquement. Cherche sur papier, puis ouvre l’explication.',
    list: 'Sépare les éléments par « ; »',
    interval: 'Ex. [1; 5[  ou  ]-∞; 2]',
    score: (g: number, n: number) => `Bilan : ${g} / ${n} bonnes réponses`,
    order_intrus: 'Une étape fausse est restée dans la preuve.',
    order_missing: 'Une étape juste a été écartée.',
    order_order: 'Les étapes ne sont pas dans un ordre valable.',
    e: {
      empty: 'Écris ta réponse.',
      incomplete: 'Expression incomplète.',
      unclosed_paren: 'Une parenthèse n’est pas fermée.',
      unexpected: 'Symbole inattendu : ',
      unknown_var: 'Lettre inconnue dans cette question : ',
      too_long: 'Réponse trop longue.',
      too_big: 'Nombre trop grand.',
      bad_interval: 'Écris un intervalle, par exemple [1; 5[.',
      not_a_number: 'Ce n’est pas un nombre.',
      cannot_check: 'Réponse impossible à vérifier : simplifie-la.',
      other: 'Question mal formée : signale-la au club.',
    } as Record<string, string>,
  },
  en: {
    loading: 'Loading the grader…',
    engineFail: 'The grader could not load (old browser?). You can still read the questions and explanations.',
    check: 'Check',
    next: 'Next question',
    finish: 'See the summary',
    again: 'Start again',
    correct: 'Correct!',
    incorrect: 'Not quite.',
    explanation: 'Explanation',
    hint: 'Hint',
    yourAnswer: 'Your answer',
    true: 'True',
    false: 'False',
    several: 'Several answers may be correct.',
    order: 'Put the steps in order with ↑ and ↓; discard the wrong step with ✕.',
    manual: 'This kind of question (code, simulation, written proof) is worked on with your coach or in the app. Read the explanation.',
    showExpl: 'Show the explanation',
    bonus: (n: number) => `Optional challenges (${n}) — not scored`,
    bonusIntro: 'Code, simulation or written proof: they cannot be graded automatically. Work it out on paper, then open the explanation.',
    list: 'Separate items with “;”',
    interval: 'E.g. [1; 5)  or  (-∞; 2]',
    score: (g: number, n: number) => `Summary: ${g} / ${n} correct answers`,
    order_intrus: 'A wrong step is still in the proof.',
    order_missing: 'A correct step was discarded.',
    order_order: 'The steps are not in a valid order.',
    e: {
      empty: 'Type your answer.',
      incomplete: 'Incomplete expression.',
      unclosed_paren: 'A bracket is not closed.',
      unexpected: 'Unexpected symbol: ',
      unknown_var: 'Unknown letter for this question: ',
      too_long: 'Answer too long.',
      too_big: 'Number too large.',
      bad_interval: 'Write an interval, e.g. [1; 5).',
      not_a_number: 'This is not a number.',
      cannot_check: 'Cannot check this answer: simplify it.',
      other: 'Malformed question: please report it to the club.',
    } as Record<string, string>,
  },
};

// ------------------------------------------------------------------ moteur WebAssembly

interface Engine {
  check(q: Q, a: unknown): Verdict;
  preview(input: string, vars: string[]): { ok: boolean; latex?: string; code?: string };
}

async function loadEngine(url: string): Promise<Engine> {
  const res = await fetch(url);
  const { instance } = await WebAssembly.instantiate(await res.arrayBuffer(), {});
  const e = instance.exports as any;
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const call = (fn: (a: number, b: number) => number, a: string, b: string) => {
    const bufs = [a, b].map((s) => {
      const u = enc.encode(s);
      const p = e.comima_alloc(u.length + 1) as number;
      const m = new Uint8Array(e.memory.buffer, p, u.length + 1);
      m.set(u);
      m[u.length] = 0;
      return [p, u.length + 1] as const;
    });
    try {
      const r = fn(bufs[0][0], bufs[1][0]);
      const mem = new Uint8Array(e.memory.buffer);
      let end = r;
      while (mem[end]) end++;
      const out = dec.decode(mem.subarray(r, end));
      e.comima_free(r);
      return JSON.parse(out);
    } finally {
      for (const [p, l] of bufs) e.comima_dealloc(p, l);
    }
  };
  return {
    check: (q, a) => call(e.comima_check, JSON.stringify(q), JSON.stringify(a ?? null)),
    preview: (input, vars) => call(e.comima_preview, input, JSON.stringify(vars)),
  };
}

// ------------------------------------------------------------------ outils

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, html = '') => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (html) el.innerHTML = html;
  return el;
};

const renderMath = () => document.dispatchEvent(new Event('comima:render-math'));

function message(L: (typeof TXT)['fr'], code?: string) {
  if (!code) return L.e.other;
  const [k, ...rest] = code.split(':');
  const arg = rest.join(':');
  return (L.e[k] ?? L.e.other) + (arg ? `« ${arg} »` : '');
}

function shuffle<T>(xs: T[], seed: string): T[] {
  let s = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ------------------------------------------------------------------ saisies par type

type Input = { el: HTMLElement; value: () => unknown };

function mathField(q: Q, L: (typeof TXT)['fr'], engine: Engine | null, label = L.yourAnswer): Input {
  const wrap = h('div', { class: 'tq-field' });
  const input = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': label, placeholder: label }) as HTMLInputElement;
  const keysFor: Record<string, string[]> = {
    expression: [...(q.variables ?? []), '^', '/', '(', ')', '√(', 'π'],
    ensemble: [';', '-', '/', '√('],
    'n-uplet': [';', '-', '/', '√('],
    intervalle: ['[', ']', ';', '-∞', '+∞'],
  };
  const keys = h('div', { class: 'tq-keys' });
  for (const k of keysFor[q.type] ?? ['-', '/', '^', '√(', 'π']) {
    const b = h('button', { type: 'button', class: 'btn btn-outline btn-sm' });
    b.textContent = k;
    b.addEventListener('click', () => {
      const s = input.selectionStart ?? input.value.length;
      const e = input.selectionEnd ?? s;
      input.value = input.value.slice(0, s) + k + input.value.slice(e);
      input.focus();
      input.setSelectionRange(s + k.length, s + k.length);
      input.dispatchEvent(new Event('input'));
    });
    keys.append(b);
  }
  const help = q.type === 'intervalle' ? L.interval : q.type === 'ensemble' || q.type === 'n-uplet' ? L.list : '';
  const preview = h('div', { class: 'tq-preview' });
  if (engine && (q.type === 'expression' || q.type === 'numeric')) {
    input.addEventListener('input', () => {
      if (!input.value.trim()) return void (preview.textContent = '');
      const p = engine.preview(input.value, q.variables ?? []);
      if (p.ok) katex.render(p.latex!, preview, { throwOnError: false, displayMode: true });
      else preview.innerHTML = `<span class="tq-error">${message(L, p.code)}</span>`;
    });
  }
  wrap.append(input, keys);
  if (help) wrap.append(h('p', { class: 'muted small' }, help));
  wrap.append(preview);
  return { el: wrap, value: () => input.value };
}

function inputFor(q: Q, L: (typeof TXT)['fr'], engine: Engine | null): Input {
  switch (q.type) {
    case 'qcm': {
      const wrap = h('div', { class: 'tq-choices' }, `<p class="muted small">${L.several}</p>`);
      const boxes: HTMLInputElement[] = [];
      (q.choixHtml as string[]).forEach((html, i) => {
        const lab = h('label', { class: 'tq-choice' });
        const cb = h('input', { type: 'checkbox', value: String(i) }) as HTMLInputElement;
        boxes.push(cb);
        lab.append(cb, h('span', {}, html));
        wrap.append(lab);
      });
      return { el: wrap, value: () => boxes.filter((b) => b.checked).map((b) => Number(b.value)) };
    }
    case 'vrai-faux': {
      let v: boolean | null = null;
      const wrap = h('div', { class: 'tq-tf' });
      for (const [val, txt] of [[true, L.true], [false, L.false]] as const) {
        const b = h('button', { type: 'button', class: 'btn btn-outline', 'aria-pressed': 'false' });
        b.textContent = txt;
        b.addEventListener('click', () => {
          v = val;
          wrap.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        });
        wrap.append(b);
      }
      return { el: wrap, value: () => v };
    }
    case 'ordre': {
      const all = [...(q.etapesHtml as string[]), ...((q.intrusHtml as string[]) ?? [])].map((html, i) => ({ i, html }));
      let items = shuffle(all, String(q.id));
      if (items.every((x, k) => x.i === k)) items = [...items.slice(1), items[0]];
      const out = new Set<number>();
      const list = h('ol', { class: 'tq-order' });
      const draw = () => {
        list.innerHTML = '';
        items.forEach((it, k) => {
          const li = h('li', { class: out.has(it.i) ? 'is-out' : '' }, `<div class="tq-step">${it.html}</div>`);
          const tools = h('div', { class: 'tq-step-tools' });
          const mk = (txt: string, label: string, fn: () => void, disabled = false) => {
            const b = h('button', { type: 'button', class: 'btn btn-outline btn-sm', 'aria-label': label });
            b.textContent = txt;
            (b as HTMLButtonElement).disabled = disabled;
            b.addEventListener('click', () => {
              fn();
              draw();
              renderMath();
            });
            tools.append(b);
          };
          mk('↑', 'Monter', () => ([items[k - 1], items[k]] = [items[k], items[k - 1]]), k === 0);
          mk('↓', 'Descendre', () => ([items[k + 1], items[k]] = [items[k], items[k + 1]]), k === items.length - 1);
          mk(out.has(it.i) ? '↺' : '✕', 'Écarter', () => (out.has(it.i) ? out.delete(it.i) : out.add(it.i)));
          li.append(tools);
          list.append(li);
        });
      };
      draw();
      const wrap = h('div', {}, `<p class="muted small">${L.order}</p>`);
      wrap.append(list);
      return { el: wrap, value: () => items.filter((x) => !out.has(x.i)).map((x) => x.i) };
    }
    case 'trous': {
      const wrap = h('div', { class: 'tq-gaps' });
      wrap.append(h('div', { class: 'card' }, String(q.texteHtml).replace(/\{\{(\d+)\}\}/g, '<strong>[$1]</strong>')));
      const fields = (q.trous as Q[]).map((t, k) => mathField(t, L, engine, `[${k + 1}]`));
      for (const f of fields) wrap.append(f.el);
      return { el: wrap, value: () => fields.map((f) => f.value()) };
    }
    default:
      return mathField(q, L, engine);
  }
}

// ------------------------------------------------------------------ déroulement

export async function startQuiz() {
  const root = document.getElementById('quiz')!;
  const data = JSON.parse(document.getElementById('quiz-data')!.textContent!);
  const L = TXT[data.lang as 'fr' | 'en'];
  // Les questions qu'on ne peut pas corriger (code, simulation, preuve rédigée) ne font pas partie de la série :
  // elles sont proposées à la fin, au choix, sans score.
  const isManual = (q: Q) => ['code', 'simulation', 'preuve'].includes(q.type);
  const qs: Q[] = (data.questions as Q[]).filter((q) => !isManual(q));
  const bonus: Q[] = (data.questions as Q[]).filter(isManual);
  root.innerHTML = `<p class="muted">${L.loading}</p>`;
  let engine: Engine | null = null;
  try {
    engine = await loadEngine(data.engine);
  } catch {
    root.innerHTML = `<p class="tq-error">${L.engineFail}</p>`;
  }

  let i = 0;
  let good = 0;
  let graded = 0;

  const show = () => {
    root.innerHTML = '';
    if (i >= qs.length) {
      const end = h('div', { class: 'card tq' }, qs.length ? `<h2>${L.score(good, graded)}</h2>` : '');
      if (bonus.length) {
        const box = h('details', { class: 'tq-bonus' }, `<summary>${L.bonus(bonus.length)}</summary><p class="muted small">${L.bonusIntro}</p>`);
        for (const b of bonus) {
          const item = h('div', { class: 'tq-bonus-item latex-preview' }, `<div class="tq-statement">${b.enonceHtml}</div>`);
          if (b.indiceHtml) item.append(h('details', { class: 'tq-hint' }, `<summary>💡 ${L.hint}</summary>${b.indiceHtml}`));
          item.append(h('details', { class: 'tq-expl' }, `<summary>${L.showExpl}</summary>${b.explicationHtml}`));
          box.append(item);
        }
        end.append(box);
      }
      const again = h('button', { type: 'button', class: 'btn btn-primary' });
      again.textContent = L.again;
      again.hidden = qs.length === 0;
      again.addEventListener('click', () => {
        i = good = graded = 0;
        show();
      });
      end.append(again);
      root.append(end);
      return;
    }
    const q = qs[i];
    const manual = false; // jamais dans la série (voir « défis au choix » à la fin)
    const startedAt = performance.now(); // temps passé sur la question (statistiques)
    const card = h('article', { class: 'card tq latex-preview' });
    card.append(h('p', { class: 'muted small' }, `${i + 1} / ${qs.length} · ${'★'.repeat(q.difficulte)}`));
    card.append(h('div', { class: 'tq-statement' }, q.enonceHtml));
    if (q.indiceHtml) {
      const d = h('details', { class: 'tq-hint' }, `<summary>💡 ${L.hint}</summary>${q.indiceHtml}`);
      card.append(d);
    }
    const input = manual || !engine ? null : inputFor(q, L, engine);
    if (input) card.append(input.el);
    else if (manual) card.append(h('p', { class: 'muted' }, L.manual));
    const feedback = h('div', { class: 'tq-feedback', role: 'status' });
    const actions = h('div', { class: 'tq-actions' });
    const btn = h('button', { type: 'button', class: 'btn btn-primary' }) as HTMLButtonElement;
    const explanation = () => `<div class="tq-expl"><strong>${L.explanation}</strong>${q.explicationHtml}</div>`;
    const next = () => {
      btn.textContent = i + 1 < qs.length ? L.next : L.finish;
      btn.onclick = () => {
        i++;
        show();
        root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    };
    if (input) {
      btn.textContent = L.check;
      btn.onclick = () => {
        const v = engine!.check(q, input.value());
        if (v.status === 'invalid') {
          const code = v.parts?.find((p) => p.status === 'invalid')?.code ?? v.code;
          feedback.innerHTML = `<p class="tq-error">${message(L, code)}</p>`;
          return;
        }
        const ok = v.status === 'correct';
        graded++;
        if (ok) good++;
        store.record({
          q: String(q.id),
          ok,
          type: String(q.type),
          d: Number(q.difficulte) || undefined,
          n: data.notion,
          th: data.theme,
          ms: Math.round(performance.now() - startedAt),
        });
        input.el.classList.add('is-locked');
        input.el.querySelectorAll('input, button').forEach((x) => ((x as HTMLInputElement).disabled = true));
        const why = !ok && v.code ? ` ${(L as any)[`order_${v.code}`] ?? ''}` : '';
        feedback.innerHTML = `<p class="${ok ? 'tq-ok' : 'tq-ko'}">${ok ? '✔ ' + L.correct : '✘ ' + L.incorrect + why}</p>${explanation()}`;
        renderMath();
        next();
      };
    } else {
      btn.textContent = L.showExpl;
      btn.onclick = () => {
        feedback.innerHTML = explanation();
        renderMath();
        next();
      };
    }
    actions.append(btn);
    card.append(feedback, actions);
    root.append(card);
    renderMath();
  };
  show();
}
