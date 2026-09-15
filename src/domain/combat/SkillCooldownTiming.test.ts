import { describe, expect, it } from 'vitest';
import { getCooldownSeconds, getInitialCooldownSeconds } from './SkillCooldownTiming';
import { CombatSkillDefinition } from '../progression/combat/CombatSkillDefinition';
import { getHeroCombatIdentity } from './HeroCombatIdentityCatalog';
import { getEnemyCombatIdentity } from '../enemies/EnemyCombatIdentityCatalog';

const EARLY_SKILL: CombatSkillDefinition = {
  skillId: 'arcane_bolt',
  kind: 'damage',
  targetPool: 'enemies',
  targetScope: 'single',
  targetPriority: 'lowest_hp_percent',
  usePriority: 80,
  initialCooldown: 0,
  cooldownTurns: 2,
  cooldownSecondsPerRank: 1.5,
  actionRecoverySeconds: 0.7,
  maxCooldownReduction: 0.45,
  minCooldownReduction: -0.25,
  basePower: 1,
  powerPerRank: 4,
  attributeFactor: 1,
};

describe('SkillCooldownTiming — cadência por combatente e skill', () => {
  const nixTurns = getHeroCombatIdentity('sorcerer').skillCooldownTurnSeconds;
  const ratTurns = getEnemyCombatIdentity('giant_rat').skillCooldownTurnSeconds;

  it('skills iniciais (~2 turns) usam segundos/turno do herói', () => {
    expect(getCooldownSeconds(EARLY_SKILL, { turnSeconds: nixTurns })).toBe(2 * nixTurns);
    expect(getCooldownSeconds(EARLY_SKILL, { turnSeconds: nixTurns })).toBe(10);
  });

  it('cada level reduz a recarga pelo valor da skill, sem piso global', () => {
    const perRank = EARLY_SKILL.cooldownSecondsPerRank ?? 0;
    expect(getCooldownSeconds(EARLY_SKILL, { rank: 2, turnSeconds: nixTurns })).toBe(
      10 - perRank,
    );
    expect(getCooldownSeconds(EARLY_SKILL, { rank: 3, turnSeconds: nixTurns })).toBe(
      10 - 2 * perRank,
    );
    expect(getCooldownSeconds(EARLY_SKILL, { rank: 99, turnSeconds: nixTurns })).toBe(0);
  });

  it('inimigo usa os segundos/turno do próprio tipo', () => {
    expect(getCooldownSeconds(EARLY_SKILL, { turnSeconds: ratTurns })).toBe(2 * ratTurns);
    expect(
      getInitialCooldownSeconds({ ...EARLY_SKILL, initialCooldown: 4 }, { turnSeconds: ratTurns }),
    ).toBe(4 * ratTurns);
  });
});
