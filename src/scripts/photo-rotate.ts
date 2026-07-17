/**
 * Rotation en fondu enchaîné d'ensembles de photos.
 *
 * Chaque conteneur ciblé contient plusieurs <img> ; une seule porte la classe
 * `active` (opacité 1), les autres sont masquées. À intervalle régulier, on
 * passe à la suivante. Respecte « prefers-reduced-motion » (aucune animation).
 *
 * Utilisé pour le fond dynamique du site (.site-bg) et les diapos du carrousel
 * d'accueil (.slide-bg-stack).
 */
export function rotatePhotoStacks(
  root: ParentNode,
  selector: string,
  interval = 6000,
): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.querySelectorAll<HTMLElement>(selector).forEach((stack) => {
    const imgs = [...stack.querySelectorAll('img')];
    if (imgs.length < 2) return;
    let i = 0;
    const step = () => {
      imgs[i].classList.remove('active');
      i = (i + 1) % imgs.length;
      imgs[i].classList.add('active');
    };
    // Léger décalage aléatoire pour que les différents ensembles ne changent
    // pas tous en même temps.
    window.setTimeout(() => window.setInterval(step, interval), Math.random() * 1500);
  });
}
