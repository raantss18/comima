/**
 * Générateur de sujets — 100 % côté client.
 * - charge l'index JSON des exercices,
 * - filtre + panier (persisté en localStorage),
 * - export PDF fusionné (pdf-lib) avec page de garde,
 * - export paquet .tex (JSZip) avec fichier maître.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { latexToHtml } from '../lib/latex';

interface Exo {
  id: string;
  titre_fr: string;
  titre_en: string;
  theme: string[];
  niveau: string;
  difficulte: number;
  sourceLabel: string;
  tags: string[];
  a_solution: boolean;
  enonceTex: string;
  pdf: string;
  pdfSolution: string | null;
  tex: string;
  texSolution: string | null;
}

interface Strings {
  lang: 'fr' | 'en';
  add: string;
  added: string;
  remove: string;
  up: string;
  down: string;
  preview: string;
  cartEmpty: string;
  exportPdf: string;
  exportPdfBusy: string;
  exportTex: string;
  exportTexBusy: string;
  errorPdf: string;
  docTitleDefault: string;
  empty: string;
  solution: string;
}

const CART_KEY = 'comima-gen-cart';

function base(path: string): string {
  const b = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${b}/${path.replace(/^\//, '')}`;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: (Node | string)[] = []
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

export async function initGenerator(): Promise<void> {
  const strings: Strings = JSON.parse(document.getElementById('gen-i18n')!.textContent!);
  const listEl = document.getElementById('gen-list')!;
  const emptyEl = document.getElementById('gen-empty')!;
  const cartEl = document.getElementById('gen-cart-items')!;
  const form = document.getElementById('gen-filters') as HTMLFormElement;
  const btnPdf = document.getElementById('g-export-pdf') as HTMLButtonElement;
  const btnTex = document.getElementById('g-export-tex') as HTMLButtonElement;
  const errEl = document.getElementById('g-error') as HTMLElement;

  const res = await fetch(base('data/exercices-index.json'));
  const { exercices } = (await res.json()) as { exercices: Exo[] };
  const byId = new Map(exercices.map((e) => [e.id, e]));

  let cart: string[] = [];
  try {
    cart = (JSON.parse(localStorage.getItem(CART_KEY) ?? '[]') as string[]).filter((id) =>
      byId.has(id)
    );
  } catch {
    cart = [];
  }

  // Lien « Ajouter au sujet » depuis une page exercice : ?add=<id>
  const addParam = new URLSearchParams(location.search).get('add');
  if (addParam && byId.has(addParam) && !cart.includes(addParam)) cart.push(addParam);

  const titre = (e: Exo) => (strings.lang === 'fr' ? e.titre_fr : e.titre_en);

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function renderList() {
    const data = new FormData(form);
    const search = String(data.get('search') ?? '').toLowerCase().trim();
    const theme = String(data.get('theme') ?? '');
    const niveau = String(data.get('niveau') ?? '');
    const diff = String(data.get('difficulte') ?? '');

    const visible = exercices.filter((e) => {
      const hay = `${titre(e)} ${e.tags.join(' ')} ${e.sourceLabel}`.toLowerCase();
      if (search && !hay.includes(search)) return false;
      if (theme && !e.theme.includes(theme)) return false;
      if (niveau && e.niveau !== niveau) return false;
      if (diff && String(e.difficulte) !== diff) return false;
      return true;
    });

    listEl.replaceChildren(
      ...visible.map((e) => {
        // Bouton bascule : ajoute si absent, retire si déjà dans le panier.
        // (auparavant désactivé une fois ajouté → impossible de retirer depuis
        //  la liste, seul point de suppression était le ✕ du panier.)
        const inCart = cart.includes(e.id);
        const btn = el(
          'button',
          {
            class: `btn btn-sm ${inCart ? 'btn-outline' : 'btn-primary'}`,
            type: 'button',
            'data-add': e.id,
            'aria-pressed': String(inCart),
          },
          [inCart ? `✓ ${strings.remove}` : strings.add]
        );
        btn.addEventListener('click', () => {
          const idx = cart.indexOf(e.id);
          if (idx >= 0) cart.splice(idx, 1);
          else cart.push(e.id);
          saveCart();
          renderList();
          renderCart();
        });

        const badges = el('div', { class: 'badges' }, [
          ...e.theme.map((th) => el('span', { class: 'badge badge-theme' }, [th])),
          el('span', { class: 'badge' }, [e.niveau]),
          el('span', { class: 'badge' }, ['★'.repeat(e.difficulte)]),
          ...(e.a_solution ? [el('span', { class: 'badge' }, [`✓ ${strings.solution}`])] : []),
        ]);

        const preview = el('div', { class: 'latex-preview', style: 'margin-top: 0.8rem;' });
        preview.innerHTML = latexToHtml(e.enonceTex);

        const details = el('details', {}, [
          el('summary', {}, [strings.preview]),
          preview,
        ]);
        details.addEventListener('toggle', () => {
          if (details.open) document.dispatchEvent(new CustomEvent('comima:render-math'));
        });

        return el('div', { class: 'gen-item' }, [
          el('div', { class: 'gen-item-head' }, [
            el('div', {}, [
              el('h3', { style: 'margin: 0 0 0.3rem; font-size: 1.05rem;' }, [titre(e)]),
              el('p', { class: 'muted small', style: 'margin: 0 0 0.4rem;' }, [e.sourceLabel]),
              badges,
            ]),
            btn,
          ]),
          details,
        ]);
      })
    );
    emptyEl.hidden = visible.length > 0;
  }

  function renderCart() {
    btnPdf.disabled = cart.length === 0;
    btnTex.disabled = cart.length === 0;
    if (cart.length === 0) {
      cartEl.replaceChildren(el('p', { class: 'muted small' }, [strings.cartEmpty]));
      return;
    }
    const ol = el('ol');
    cart.forEach((id, i) => {
      const e = byId.get(id)!;
      const actions = el('span', { class: 'cart-actions' });
      const mk = (label: string, title: string, fn: () => void, disabled = false) => {
        const b = el('button', { type: 'button', title, 'aria-label': `${title} — ${titre(e)}` }, [
          label,
        ]);
        b.disabled = disabled;
        b.addEventListener('click', () => {
          fn();
          saveCart();
          renderList();
          renderCart();
        });
        actions.append(b);
      };
      mk('↑', strings.up, () => cart.splice(i - 1, 2, cart[i], cart[i - 1]), i === 0);
      mk(
        '↓',
        strings.down,
        () => cart.splice(i, 2, cart[i + 1], cart[i]),
        i === cart.length - 1
      );
      mk('✕', strings.remove, () => cart.splice(i, 1));
      ol.append(el('li', {}, [titre(e), actions]));
    });
    cartEl.replaceChildren(ol);
  }

  form.addEventListener('input', renderList);
  form.addEventListener('submit', (ev) => ev.preventDefault());
  renderList();
  renderCart();

  const docTitle = () =>
    (document.getElementById('g-title') as HTMLInputElement).value.trim() ||
    strings.docTitleDefault;
  const includeSolutions = () =>
    (document.getElementById('g-solutions') as HTMLInputElement).checked;

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: filename });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function slugify(s: string): string {
    return (
      s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'sujet'
    );
  }

  // ---------- Export PDF fusionné ----------
  async function exportPdf() {
    errEl.hidden = true;
    btnPdf.textContent = strings.exportPdfBusy;
    btnPdf.disabled = true;
    try {
      const selection = cart.map((id) => byId.get(id)!);
      const out = await PDFDocument.create();
      out.setTitle(docTitle());
      out.setAuthor('COMIMa');

      // — Page de garde —
      const cover = out.addPage([595.28, 841.89]); // A4 portrait (points)
      const font = await out.embedFont(StandardFonts.HelveticaBold);
      const fontReg = await out.embedFont(StandardFonts.Helvetica);
      const green = rgb(0.11, 0.48, 0.2);
      const red = rgb(0.84, 0.21, 0.17);
      const { width, height } = cover.getSize();

      try {
        const logoBytes = await fetch(base('logo.png')).then((r) => {
          if (!r.ok) throw new Error('logo');
          return r.arrayBuffer();
        });
        const logo = await out.embedPng(logoBytes);
        const lw = 140;
        const lh = (logo.height / logo.width) * lw;
        cover.drawImage(logo, { x: (width - lw) / 2, y: height - 240, width: lw, height: lh });
      } catch {
        // Logo indisponible : page de garde sans image.
      }

      const centerText = (
        text: string,
        y: number,
        size: number,
        f = fontReg,
        color = rgb(0.1, 0.12, 0.11)
      ) => {
        const w = f.widthOfTextAtSize(text, size);
        cover.drawText(text, { x: (width - w) / 2, y, size, font: f, color });
      };

      centerText(docTitle(), height - 330, 26, font, green);
      centerText(
        strings.lang === 'fr'
          ? 'Club Olympiade Mathématiques et Informatique de Madagascar'
          : 'Mathematics & Computer Science Olympiad Club of Madagascar',
        height - 365,
        12
      );
      centerText(
        new Date().toLocaleDateString(strings.lang === 'fr' ? 'fr-FR' : 'en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        height - 388,
        12,
        fontReg,
        red
      );

      let y = height - 450;
      centerText(strings.lang === 'fr' ? 'Sommaire' : 'Contents', y, 14, font);
      y -= 26;
      selection.forEach((e, i) => {
        const label = `${i + 1}. ${titre(e)}  —  ${e.sourceLabel}  (${e.difficulte}/5)`;
        cover.drawText(label, { x: 80, y, size: 11, font: fontReg, color: rgb(0.2, 0.22, 0.21) });
        y -= 18;
      });

      cover.drawText(`${location.host}${import.meta.env.BASE_URL}`, {
        x: 80,
        y: 60,
        size: 9,
        font: fontReg,
        color: rgb(0.5, 0.53, 0.51),
      });

      // — Énoncés (PDF déjà compilés par la CI) —
      const failures: string[] = [];
      const append = async (path: string, label: string) => {
        const r = await fetch(base(path));
        if (!r.ok) {
          failures.push(label);
          return;
        }
        const src = await PDFDocument.load(await r.arrayBuffer());
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      };

      for (const e of selection) await append(e.pdf, titre(e));
      if (includeSolutions()) {
        for (const e of selection) {
          if (e.pdfSolution) await append(e.pdfSolution, `${titre(e)} (solution)`);
        }
      }

      if (failures.length === selection.length && selection.length > 0) {
        throw new Error('no-pdf');
      }
      if (failures.length > 0) {
        errEl.textContent = `${strings.errorPdf} (${failures.join(', ')})`;
        errEl.hidden = false;
      }

      download(
        new Blob([await out.save()], { type: 'application/pdf' }),
        `${slugify(docTitle())}.pdf`
      );
    } catch (err) {
      console.error('[comima] export PDF:', err);
      errEl.textContent = strings.errorPdf;
      errEl.hidden = false;
    } finally {
      btnPdf.textContent = strings.exportPdf;
      btnPdf.disabled = cart.length === 0;
    }
  }

  // ---------- Export paquet .tex ----------
  async function exportTex() {
    errEl.hidden = true;
    btnTex.textContent = strings.exportTexBusy;
    btnTex.disabled = true;
    try {
      const selection = cart.map((id) => byId.get(id)!);
      const zip = new JSZip();

      const preamble = await fetch(base('sources/preamble.tex')).then((r) => r.text());
      zip.file('preamble.tex', preamble);

      const withSol = includeSolutions();
      const master: string[] = [
        '% Sujet généré sur le site COMIMa — prêt à compiler avec latexmk/pdflatex.',
        '\\documentclass[11pt]{article}',
        '\\input{preamble.tex}',
        '\\begin{document}',
        '',
        '\\begin{center}',
        `  {\\LARGE\\bfseries ${texEscape(docTitle())}}\\\\[6pt]`,
        '  {\\normalsize Club Olympiade Mathématiques et Informatique de Madagascar}\\\\[2pt]',
        `  {\\small \\today}`,
        '\\end{center}',
        '\\bigskip\\hrule\\bigskip',
        '',
      ];

      for (const [i, e] of selection.entries()) {
        const texSrc = await fetch(base(e.tex)).then((r) => r.text());
        zip.file(`exercices/${e.id}.tex`, texSrc);
        master.push(
          `\\section*{${strings.lang === 'fr' ? 'Exercice' : 'Problem'} ${i + 1} --- ${texEscape(titre(e))}}`,
          `{\\small\\itshape ${texEscape(e.sourceLabel)}}`,
          '\\medskip',
          '',
          `\\input{exercices/${e.id}.tex}`,
          '\\bigskip',
          ''
        );
      }

      if (withSol) {
        const withSolutions = selection.filter((e) => e.texSolution);
        if (withSolutions.length > 0) {
          master.push('\\clearpage', '\\section*{Solutions}', '');
          for (const e of withSolutions) {
            const solSrc = await fetch(base(e.texSolution!)).then((r) => r.text());
            zip.file(`solutions/${e.id}.tex`, solSrc);
            master.push(
              `\\subsection*{${texEscape(titre(e))}}`,
              `\\input{solutions/${e.id}.tex}`,
              '\\bigskip',
              ''
            );
          }
        }
      }

      master.push('\\end{document}', '');
      zip.file('sujet.tex', master.join('\n'));
      zip.file(
        'README.txt',
        [
          'Paquet LaTeX généré par le site COMIMa.',
          '',
          'Compilation :',
          '  latexmk -pdf sujet.tex',
          '(ou pdflatex sujet.tex, deux passes)',
          '',
          'Fichiers :',
          '  sujet.tex        — document maître',
          '  preamble.tex     — préambule commun COMIMa',
          '  exercices/*.tex  — énoncés',
          '  solutions/*.tex  — solutions (si incluses)',
        ].join('\n')
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      download(blob, `${slugify(docTitle())}.zip`);
    } catch (err) {
      console.error('[comima] export ZIP:', err);
      errEl.textContent = strings.errorPdf;
      errEl.hidden = false;
    } finally {
      btnTex.textContent = strings.exportTex;
      btnTex.disabled = cart.length === 0;
    }
  }

  function texEscape(s: string): string {
    return s.replace(/([%$#&_{}])/g, '\\$1');
  }

  btnPdf.addEventListener('click', exportPdf);
  btnTex.addEventListener('click', exportTex);
}
