import { describe, expect, it } from 'vitest';
import { getTargetPriorityPercent } from './CombatSkillTargeting';
import { BASIC_ATTACK_SKILL } from './BasicAttackSkill';
import { getHeroCombatSkill } from './HeroCombatSkillCatalog';

describe('CombatSkillTargeting', () => {
  it('aplica overrides conhecidos', () => {
    expect(getTargetPriorityPercent(BASIC_ATTACK_SKILL)).toBe(70);
    expect(getTargetPriorityPercent(getHeroCombatSkill('power_attack')!)).toBe(90);
    expect(getTargetPriorityPercent(getHeroCombatSkill('mil_cap_lance')!)).toBe(80);
  });

  it('usa padrão para skills de dano sem override', () => {
    const fireball = getHeroCombatSkill('fireball');
    expect(fireball).toBeDefined();
    expect(getTargetPriorityPercent(fireball!)).toBe(78);
  });
});
