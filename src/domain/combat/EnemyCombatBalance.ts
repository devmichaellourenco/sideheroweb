/**
 * BAL-013: inimigos usam o mesmo modelo de attrs/level/fórmulas dos heróis.
 * Knobs de ATK/HP/skill/ASPD foram removidos — o poder vem do level + attrs do sheet.
 *
 * Flag de playtest (HP fixo) permanece para avançar fases rápido em dev.
 */

/**
 * Playtest: inimigos nascem com HP fixo para avançar fases rápido.
 * Desligar (`false`) antes de release ou balanceamento sério.
 */
export const ENEMY_QUICK_PHASE_TEST_HP = false;

export const ENEMY_QUICK_PHASE_TEST_MAX_HEALTH = 1;

export function resolveEnemySpawnMaxHealth(calculatedMaxHealth: number): number {
  if (ENEMY_QUICK_PHASE_TEST_HP) {
    return ENEMY_QUICK_PHASE_TEST_MAX_HEALTH;
  }

  return Math.max(1, calculatedMaxHealth);
}
