import { describe, expect, it } from 'vitest';
import { ENEMY_MONSTER_COMBAT_SKILL_CATALOG } from './EnemyMonsterCombatSkillCatalog';

describe('ENEMY_MONSTER_COMBAT_SKILL_CATALOG — timing por skill', () => {
  it('cada skill declara recovery, redução por rank e teto/piso de CDR', () => {
    expect(ENEMY_MONSTER_COMBAT_SKILL_CATALOG.length).toBeGreaterThan(0);
    for (const skill of ENEMY_MONSTER_COMBAT_SKILL_CATALOG) {
      expect(typeof skill.actionRecoverySeconds).toBe('number');
      expect(typeof skill.cooldownSecondsPerRank).toBe('number');
      expect(typeof skill.maxCooldownReduction).toBe('number');
      expect(typeof skill.minCooldownReduction).toBe('number');
      expect(skill.actionRecoverySeconds).toBeGreaterThanOrEqual(0);
      expect(skill.cooldownSecondsPerRank).toBeGreaterThanOrEqual(0);
    }
  });
});
