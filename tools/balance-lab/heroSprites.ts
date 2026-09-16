/** URLs de sprite de herói para o Balance Lab (fora do chrome.runtime). */

const HERO_CLASS_SPRITES: Record<string, string> = {
  knight: 'galneon_aprendiz.png',
  sorcerer: 'nix_aprendiz.png',
  priest: 'elara_aprendiz.png',
  berserker: 'berserker.png',
  archer: 'rain.png',
  paladin: 'valerius.png',
};

export function heroSpriteUrlForLab(heroClass: string): string {
  const file = HERO_CLASS_SPRITES[heroClass] ?? HERO_CLASS_SPRITES.knight;
  return `/panel/assets/characters/${encodeURIComponent(file)}`;
}

export function heroSpriteFallbackUrlForLab(): string {
  return '/panel/assets/characters/galneon_aprendiz.png';
}

export function bindHeroSpriteFallback(img: HTMLImageElement): void {
  img.addEventListener(
    'error',
    () => {
      const fallback = heroSpriteFallbackUrlForLab();
      if (img.src.endsWith(fallback) || img.dataset.fallbackApplied === '1') return;
      img.dataset.fallbackApplied = '1';
      img.src = fallback;
    },
    { once: true },
  );
}
