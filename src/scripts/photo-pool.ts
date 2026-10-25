/**
 * Photothèque aléatoire par session.
 *
 * `data/photos-index.json` (généré au build) liste toutes les photos de
 * public/uploads. À la première visite d'une session, on les mélange et on garde
 * l'ordre dans sessionStorage : chaque visiteur a donc son propre défilement,
 * stable pendant sa session (même ordre d'une page à l'autre), différent à la
 * session suivante. Chaque emplacement reçoit une tranche distincte du mélange.
 *
 * Emplacements : [data-photo-pool] (pile de fondus : on remplace les src des
 * <img> existantes) et [data-photo-band="N"] (bande défilante : N photos, la
 * série est doublée pour la boucle sans couture).
 */
const KEY = 'comima-photos-v1';

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function loadOrder(): Promise<string[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/photos-index.json`);
  const { photos } = (await res.json()) as { photos: string[] };
  if (!photos?.length) return [];

  let saved: string[] = [];
  try {
    saved = JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
  } catch {
    saved = [];
  }
  const known = new Set(photos);
  // Garde l'ordre de la session pour les photos qui existent encore, puis ajoute
  // en fin de liste (mélangées) celles apparues depuis.
  const kept = saved.filter((p) => known.has(p));
  const fresh = shuffle(photos.filter((p) => !kept.includes(p)));
  const order = kept.length ? [...kept, ...fresh] : fresh;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    /* stockage indisponible : l'ordre vaut pour cette page seulement */
  }
  return order;
}

export async function fillPhotoPools(root: ParentNode = document): Promise<void> {
  const stacks = [...root.querySelectorAll<HTMLElement>('[data-photo-pool]')];
  const bands = [...root.querySelectorAll<HTMLElement>('[data-photo-band]')];
  if (!stacks.length && !bands.length) return;

  let order: string[];
  try {
    order = await loadOrder();
  } catch {
    return; // index indisponible : on garde les photos servies par défaut
  }
  if (!order.length) return;

  let cursor = 0;
  const take = (n: number): string[] =>
    Array.from({ length: n }, () => order[cursor++ % order.length]);
  const url = (p: string) => `${import.meta.env.BASE_URL}${p}`;

  for (const stack of stacks) {
    const imgs = [...stack.querySelectorAll('img')];
    take(imgs.length).forEach((p, i) => {
      imgs[i].src = url(p);
    });
  }

  for (const band of bands) {
    const n = Number(band.dataset.photoBand) || 12;
    const series = take(n);
    band.replaceChildren(
      ...[...series, ...series].map((p) => {
        const img = document.createElement('img');
        img.src = url(p);
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        return img;
      }),
    );
  }
}
