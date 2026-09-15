import { describe, expect, it } from 'vitest';
import { ENEMY_ROSTER } from './EnemyRosterCatalog';
import { getEnemyCombatIdentity, listEnemyCombatIdentities } from './EnemyCombatIdentityCatalog';

describe('EnemyCombatIdentityCatalog', () => {
  it('cada tipo de monstro tem identidade própria (básico, CD, ASPD, crescimento)', () => {
    expect(listEnemyCombatIdentities()).toHaveLength(ENEMY_ROSTER.length);
    const rat = getEnemyCombatIdentity('giant_rat');
    const dragon = getEnemyCombatIdentity('young_green_dragon');
    expect(rat).not.toBe(dragon);
    expect(rat.basicAttackDamageRatio).toBeGreaterThan(0);
    expect(dragon.skillCooldownTurnSeconds).toBeGreaterThan(0);
    expect(rat.attackSpeedFactor).toBeGreaterThan(0);
    expect(dragon.levelUpAttackGain).toBe(3);
    expect(dragon.levelUpDefenseGain).toBe(3);
    expect(dragon.levelUpHealthGain).toBe(15);
  });
});
