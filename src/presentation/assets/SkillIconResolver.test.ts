import { describe, expect, it } from 'vitest';
import { ALL_COMBAT_SKILL_IDS } from '../../domain/progression/combat/CombatSkillRegistry';
import { resolveSkillIconKey } from './SkillIconResolver';

const GENERIC_ICONS = new Set(['attack', 'magic', 'weapon']);

describe('SkillIconResolver', () => {
  it('mapeia skills elementais para ícones temáticos', () => {
    expect(resolveSkillIconKey('fireball')).toBe('fireball');
    expect(resolveSkillIconKey('frost_shard')).toBe('frost_shard');
    expect(resolveSkillIconKey('blizzard')).toBe('blizzard');
    expect(resolveSkillIconKey('smite')).toBe('smite');
    expect(resolveSkillIconKey('inn_fei_flame')).toBe('fireball');
    expect(resolveSkillIconKey('arc_mag_bolt')).toBe('arcane_bolt');
    expect(resolveSkillIconKey('minor_heal')).toBe('heal');
    expect(resolveSkillIconKey('reaver_cleave')).toBe('power_attack');
    expect(resolveSkillIconKey('guardian_strike')).toBe('power_attack');
  });

  it('cobre a maioria das skills de combate sem cair em placeholder genérico', () => {
    const genericCount = ALL_COMBAT_SKILL_IDS.filter((skillId) =>
      GENERIC_ICONS.has(resolveSkillIconKey(skillId)),
    ).length;

    expect(genericCount / ALL_COMBAT_SKILL_IDS.length).toBeLessThan(0.2);
  });
});
