// Espace personnel : la progression d'entraînement de ce navigateur (et du compte, une fois connecté),
// présentée comme dans l'application : niveau, série de jours, réussite, avancement par notion, marque-pages.
import * as store from './web-store.ts';

interface NotionInfo {
  id: string;
  t: string;
  th: string;
  total: number;
  href: string;
}
interface SpaceData {
  lang: 'fr' | 'en';
  notions: NotionInfo[];
  themes: Record<string, string>;
}

const TXT = {
  fr: {
    level: 'Niveau',
    xp: 'points',
    streak: 'jours de suite',
    answers: 'réponses',
    success: 'de réussite',
    mastered: 'questions réussies',
    empty: 'Pas encore de réponse : choisis une notion dans l’Entraînement pour commencer.',
    go: 'S’entraîner →',
    byTopic: 'Avancement par notion',
    resume: 'Reprendre',
    marks: 'Mes marque-pages',
    star: 'à voir',
    lu: 'lus',
    teste: 'testés',
    continuer: 'à continuer',
    fait: 'faits',
    hello: (n: string) => `Bonjour, ${n} 👋`,
    helloAnon: 'Bonjour 👋',
    free: 'L’entraînement reste libre : le compte sert seulement à garder ta progression d’un appareil à l’autre.',
  },
  en: {
    level: 'Level',
    xp: 'points',
    streak: 'days in a row',
    answers: 'answers',
    success: 'success',
    mastered: 'questions solved',
    empty: 'No answers yet: pick a topic in Training to start.',
    go: 'Practise →',
    byTopic: 'Progress by topic',
    resume: 'Continue',
    marks: 'My bookmarks',
    star: 'to review',
    lu: 'read',
    teste: 'tried',
    continuer: 'to continue',
    fait: 'done',
    hello: (n: string) => `Hello, ${n} 👋`,
    helloAnon: 'Hello 👋',
    free: 'Training stays free: an account only keeps your progress across devices.',
  },
};

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Points et niveau, comme dans l'application : 10 × difficulté à la première réussite de chaque question. */
export function xpOf(log: store.Entry[]): number {
  const seen = new Set<string>();
  let xp = 0;
  for (const e of [...log].sort((a, b) => Date.parse(a.t) - Date.parse(b.t))) {
    if (e.ok && !seen.has(e.q)) {
      seen.add(e.q);
      xp += 10 * Math.min(10, Math.max(1, e.d ?? 1));
    }
  }
  return xp;
}
export const levelOf = (xp: number): number => 1 + Math.floor(Math.sqrt(xp / 100));

/** Jours consécutifs avec au moins une réponse, jusqu'à aujourd'hui (ou hier : la série n'est pas perdue avant la fin du jour). */
export function streakOf(log: store.Entry[], now = new Date()): number {
  const days = new Set(log.map((e) => dayKey(new Date(e.t))));
  const d = new Date(now);
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function initSpace(): void {
  const root = document.getElementById('space-stats');
  const dataEl = document.getElementById('space-data');
  if (!root || !dataEl) return;
  const data = JSON.parse(dataEl.textContent ?? '{}') as SpaceData;
  const T = TXT[data.lang === 'en' ? 'en' : 'fr'];

  function render() {
    const l = store.load();
    const log = l.log;
    const good = log.filter((e) => e.ok).length;
    const xp = xpOf(log);
    const lv = levelOf(xp);
    const lo = 100 * (lv - 1) * (lv - 1);
    const hi = 100 * lv * lv;
    const pct = log.length ? Math.round((100 * good) / log.length) : 0;
    const name = l.profile?.name?.trim();
    const solved = [...store.lastResults().values()].filter(Boolean).length;
    const per = store.byNotion();
    const rows = data.notions.filter((n) => per[n.id]);
    // Dernières notions travaillées, la plus récente d'abord.
    const lastSeen = new Map<string, number>();
    for (const e of log) if (e.n) lastSeen.set(e.n, Math.max(lastSeen.get(e.n) ?? 0, Date.parse(e.t)));
    const recent = rows.sort((a, b) => (lastSeen.get(b.id) ?? 0) - (lastSeen.get(a.id) ?? 0)).slice(0, 3);

    let html = `<h2 class="space-hello">${name ? T.hello(esc(name)) : T.helloAnon}</h2>`;
    if (!log.length) {
      html += `<p class="muted">${T.empty}</p>`;
    } else {
      html += `<div class="space-tiles">
        <div class="space-tile"><b>⭐ ${T.level} ${lv}</b><span>${xp} ${T.xp}</span><div class="space-bar" role="progressbar" aria-valuemin="${lo}" aria-valuemax="${hi}" aria-valuenow="${xp}"><i style="width:${Math.min(100, Math.round((100 * (xp - lo)) / (hi - lo)))}%"></i></div></div>
        <div class="space-tile"><b>🔥 ${streakOf(log)}</b><span>${T.streak}</span></div>
        <div class="space-tile"><b>${log.length}</b><span>${T.answers}</span></div>
        <div class="space-tile"><b>${pct} %</b><span>${T.success}</span></div>
        <div class="space-tile"><b>${solved}</b><span>${T.mastered}</span></div></div>`;
      if (recent.length) {
        html += `<h3>${T.resume}</h3><div class="space-list">${recent.map((n) => `<a class="space-row" href="${esc(n.href)}"><span>${esc(n.t)}</span><em>${per[n.id].correct}/${n.total}</em></a>`).join('')}</div>`;
      }
      if (rows.length) {
        html += `<h3>${T.byTopic}</h3><div class="space-list">${[...rows]
          .sort((a, b) => a.th.localeCompare(b.th) || a.t.localeCompare(b.t))
          .map((n) => {
            const c = per[n.id].correct;
            return `<a class="space-row" href="${esc(n.href)}"><span>${esc(n.t)}<small>${esc(data.themes[n.th] ?? n.th)}</small></span><span class="space-bar space-bar-sm"><i style="width:${Math.round((100 * c) / n.total)}%"></i></span><em>${c}/${n.total}</em></a>`;
          })
          .join('')}</div>`;
      }
    }
    const marks = Object.values(l.marks ?? {});
    if (marks.some((m) => m.st || m.star)) {
      const count = (k: string) => marks.filter((m) => m.st === k).length;
      const star = marks.filter((m) => m.star).length;
      html += `<h3>${T.marks}</h3><p class="space-marks">${(['lu', 'teste', 'continuer', 'fait'] as const).filter(count).map((k) => `<span class="badge">${count(k)} ${T[k]}</span>`).join(' ')}${star ? ` <span class="badge">⭐ ${star} ${T.star}</span>` : ''}</p>`;
    }
    html += `<p class="muted small">${T.free}</p>`;
    root!.innerHTML = html;
  }

  render();
  window.addEventListener('comima:synced', render);
  window.addEventListener('comima:answered', render);
  window.addEventListener('comima:marks', render);
}
