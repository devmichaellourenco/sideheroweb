export interface CriticalHitRollResult {
  isCrit: boolean;
  multiplier: number;
}

/**
 * Rola crítico com número aleatório de 0 a 100 (exclusivo do 100).
 * `critChance` é fração (ex.: 0.25 = 25%).
 */
export function rollCriticalHit(
  critChance: number,
  critDamage: number,
  rng: () => number = Math.random,
): CriticalHitRollResult {
  if (critChance <= 0) {
    return { isCrit: false, multiplier: 1 };
  }

  const chancePercent = Math.min(100, critChance * 100);
  const roll = rng() * 100;

  if (roll < chancePercent) {
    return { isCrit: true, multiplier: critDamage };
  }

  return { isCrit: false, multiplier: 1 };
}
