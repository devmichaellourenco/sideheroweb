/** URLs de sprite de inimigo para o Balance Lab (fora do chrome.runtime). */

export function enemySpriteUrlForLab(enemyId: string): string {
  return `/panel/assets/characters/${encodeURIComponent(enemyId)}.png`;
}

export function enemySpriteFallbackUrlForLab(): string {
  return '/panel/assets/characters/goblin.png';
}
