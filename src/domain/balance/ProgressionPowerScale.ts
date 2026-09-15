/** Stat primário base de loot rolado pelo nível do item. */
export function gearPrimaryStatBase(itemLevel: number): number {
  const level = Math.max(1, Math.floor(itemLevel));
  return Math.floor(6 + level * 3.5 + level * level * 0.38);
}

/** Escala adicional de loot por nível de item (complementa o tier da fase). */
export function lootPrimaryStatScaleForItemLevel(itemLevel: number): number {
  const level = Math.max(1, Math.floor(itemLevel));
  return 1 + Math.pow(level, 1.28) * 0.016;
}

/** @deprecated BAL-013: poder de inimigo vem de level/attrs; não usar no spawn. */
export const ENEMY_CAMPAIGN_STAT_SCALE = 1.12;
