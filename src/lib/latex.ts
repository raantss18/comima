/**
 * Conversion approximative d'un fragment LaTeX (énoncé d'exercice) en HTML.
 * Le texte est converti (gras, italique, listes, paragraphes) ; les formules
 * mathématiques ($…$, \[…\], \(…\)) sont laissées telles quelles et rendues
 * ensuite par KaTeX auto-render côté client.
 *
 * Limites assumées : cet aperçu couvre le sous-ensemble de LaTeX utilisé dans
 * les énoncés. Les figures TikZ sont remplacées par une note « voir le PDF »
 * et le code (verbatim) par un bloc préformaté ; le PDF compilé fait foi.
 */

const FIGURE_NOTE_FR = 'Figure — voir le PDF';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Retire les commentaires LaTeX (lignes % …) sans toucher aux \% échappés. */
function stripComments(tex: string): string {
  return tex
    .split('\n')
    .map((line) => {
      let out = '';
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '%' && line[i - 1] !== '\\') break;
        out += line[i];
      }
      return out;
    })
    .join('\n');
}

/** Masque les zones mathématiques pour ne pas altérer leur contenu. */
function protectMath(tex: string): { text: string; chunks: string[] } {
  const chunks: string[] = [];
  const push = (m: string) => {
    chunks.push(m);
    return `\u0001${chunks.length - 1}\u0002`;
  };
  const text = tex
    .replace(/\\\[[\s\S]*?\\\]/g, push)
    .replace(/\\\([\s\S]*?\\\)/g, push)
    .replace(/\$\$[\s\S]*?\$\$/g, push)
    .replace(/\$(?:\\.|[^$\\])+\$/g, push);
  return { text, chunks };
}

export function latexToHtml(tex: string): string {
  let src = stripComments(tex);

  // — Blocs à préserver tels quels (restaurés en fin de conversion) —
  const blocks: string[] = [];
  const hold = (h: string) => `\u0003${blocks.push(h) - 1}\u0004`;

  // Code (verbatim / Python) → bloc préformaté.
  src = src.replace(/\\begin\{verbatim\}\n?([\s\S]*?)\n?\\end\{verbatim\}/g, (_, code) =>
    hold(`<pre class="code-block">${escapeHtml(code)}</pre>`)
  );
  // Figures TikZ → note renvoyant au PDF.
  src = src.replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, () =>
    hold(`<p class="figure-note">▦ ${FIGURE_NOTE_FR}</p>`)
  );

  // Commandes de mise en page / dessin sans rendu web : on les efface.
  src = src
    .replace(/\\tdplotsetmaincoords\{[^}]*\}\{[^}]*\}/g, '')
    .replace(/\\usetikzlibrary\{[^}]*\}/g, '')
    .replace(/\\setcounter\{[^}]*\}\{[^}]*\}/g, '')
    .replace(/\\def\\[a-zA-Z]+\{[^}]*\}/g, '')
    .replace(/\\(?:newpage|clearpage|noindent|centering|vfill|par)\b/g, '')
    .replace(/\\begin\{minipage\}(?:\[[^\]]*\])?\{[^}]*\}/g, '')
    .replace(/\\end\{minipage\}/g, '');

  const { text, chunks } = protectMath(src);
  let html = escapeHtml(text);

  // Commandes de mise en forme courantes
  html = html
    .replace(/\\textbf\{([^{}]*)\}/g, '<strong>$1</strong>')
    .replace(/\\emph\{([^{}]*)\}/g, '<em>$1</em>')
    .replace(/\\textit\{([^{}]*)\}/g, '<em>$1</em>')
    .replace(/\\texttt\{([^{}]*)\}/g, '<code>$1</code>')
    .replace(/\\textsc\{([^{}]*)\}/g, '<span style="font-variant: small-caps">$1</span>')
    .replace(/\\subsection\*?\{([^{}]*)\}/g, '<h3>$1</h3>')
    .replace(/\\section\*?\{([^{}]*)\}/g, '<h2>$1</h2>')
    .replace(/\\begin\{center\}/g, '<div style="text-align:center">')
    .replace(/\\end\{center\}/g, '</div>')
    .replace(/\\begin\{enumerate\}(\[[^\]]*\])?/g, '<ol>')
    .replace(/\\end\{enumerate\}/g, '</ol>')
    .replace(/\\begin\{itemize\}/g, '<ul>')
    .replace(/\\end\{itemize\}/g, '</ul>')
    .replace(/\\item\s*/g, '</li><li>')
    .replace(/\\(?:bigskip|medskip|smallskip)\b/g, '')
    .replace(/\\hfill\s*/g, ' ')
    .replace(/\\blacksquare/g, '∎')
    .replace(/\\\\(\[[^\]]*\])?/g, '<br/>')
    .replace(/~/g, '&nbsp;')
    .replace(/\\og\b\s*/g, '«&nbsp;')
    .replace(/\\fg\b/g, '&nbsp;»')
    .replace(/---/g, '—')
    .replace(/--/g, '–');

  // Nettoyage des <li> : le premier </li> de chaque liste est parasite.
  html = html.replace(/<(ol|ul)>\s*<\/li>/g, '<$1>');
  html = html.replace(/<\/li>\s*<\/(ol|ul)>/g, '</li></$1>');
  html = html.replace(/(<li>[\s\S]*?)(?=<\/(?:ol|ul)>)/g, (m) =>
    m.endsWith('</li>') ? m : `${m}</li>`
  );

  // Restaure les blocs préservés (code, figures) avant le découpage en paragraphes.
  html = html.replace(/\u0003(\d+)\u0004/g, (_, i) => blocks[Number(i)]);
  // Fusionne les notes de figures consécutives (ex. 3 verres côte à côte).
  html = html.replace(
    /(?:<p class="figure-note">[^<]*<\/p>\s*){2,}/g,
    `<p class="figure-note">▦ ${FIGURE_NOTE_FR}</p>\n`
  );

  // Paragraphes : lignes vides → <p>
  html = html
    .split(/\n\s*\n/)
    .map((p) => {
      const t = p.trim();
      if (!t) return '';
      if (/^<(ol|ul|h2|h3|div|pre|p)\b/.test(t)) return t;
      return `<p>${t}</p>`;
    })
    .join('\n');

  // Restaure les formules pour KaTeX (échappées en HTML uniquement).
  html = html.replace(/\u0001(\d+)\u0002/g, (_, i) => escapeHtml(chunks[Number(i)]));

  return html;
}
