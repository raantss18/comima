// Choisit le bon APK pour ce téléphone : un APK 64 bits ne s'installe pas sur un système 32 bits
// (même si le processeur est 64 bits). `userAgentData` (Chrome Android) donne la taille de mot du
// navigateur, donc du système. Sans cette information, on propose le fichier universel, qui
// fonctionne partout.
type Hint = { architecture?: string; bitness?: string };

export async function pickApk(): Promise<'arm64-v8a' | 'armeabi-v7a' | 'universal'> {
  const nav = navigator as Navigator & { userAgentData?: { getHighEntropyValues(h: string[]): Promise<Hint> } };
  try {
    const h = await nav.userAgentData?.getHighEntropyValues(['architecture', 'bitness']);
    if (h?.architecture === 'arm') return h.bitness === '64' ? 'arm64-v8a' : h.bitness === '32' ? 'armeabi-v7a' : 'universal';
  } catch {
    /* indisponible : repli ci-dessous */
  }
  return 'universal';
}

export async function initAppDownload() {
  const abi = await pickApk();
  document.querySelectorAll<HTMLAnchorElement>('[data-apk-auto]').forEach((a) => {
    const target = document.querySelector<HTMLAnchorElement>(`[data-apk="${abi}"]`);
    if (target) {
      a.href = target.href;
      const size = a.querySelector<HTMLElement>('[data-apk-size]');
      if (size) size.textContent = target.dataset.size ?? '';
    }
  });
  document.querySelectorAll<HTMLElement>(`[data-apk="${abi}"]`).forEach((el) => el.classList.add('is-recommended'));
}
