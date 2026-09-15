import { describe, expect, it } from 'vitest';
import { Hero } from '../../entities/Hero';
import {
  getHeroCombatSkill,
  HERO_COMBAT_SKILL_CATALOG,
  listHeroCombatSkills,
} from './HeroCombatSkillCatalog';

describe('HERO_COMBAT_SKILL_CATALOG — BAL-015 poder ×3', () => {
  it('skills com cooldown têm powerPerRank 3× o valor legado; básico e sem CD intactos', () => {
    expect(getHeroCombatSkill('frost_shard')?.powerPerRank).toBe(15);
    expect(getHeroCombatSkill('minor_heal')?.powerPerRank).toBe(30);
    expect(getHeroCombatSkill('fireball')?.powerPerRank).toBe(18);
    expect(getHeroCombatSkill('thrust')?.powerPerRank).toBe(15);
    expect(getHeroCombatSkill('arcane_touch')?.powerPerRank).toBe(5);
    expect(getHeroCombatSkill('basic_attack')?.powerPerRank).toBe(0);

    const withCd = HERO_COMBAT_SKILL_CATALOG.filter(
      (skill) => skill.skillId !== 'basic_attack' && skill.cooldownTurns > 0,
    );
    expect(withCd.length).toBeGreaterThan(70);
    expect(withCd.every((skill) => skill.powerPerRank % 3 === 0)).toBe(true);
  });

  it('cada skill declara recovery, redução por rank e teto/piso de CDR', () => {
    for (const skill of HERO_COMBAT_SKILL_CATALOG) {
      expect(typeof skill.actionRecoverySeconds).toBe('number');
      expect(typeof skill.cooldownSecondsPerRank).toBe('number');
      expect(typeof skill.maxCooldownReduction).toBe('number');
      expect(typeof skill.minCooldownReduction).toBe('number');
      expect(skill.actionRecoverySeconds).toBeGreaterThanOrEqual(0);
      expect(skill.cooldownSecondsPerRank).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('listHeroCombatSkills', () => {
  it('só retorna skills equipadas com rank, sem fallback implícito', () => {
    const hero = Hero.restore({
      ...Hero.createStarter('h1', 'knight', 'Galneon').toProps(),
      skillRanks: { basic_attack: 1 },
      equippedSkillIds: ['basic_attack'],
    });

    expect(listHeroCombatSkills(hero).map((skill) => skill.skillId)).toEqual(['basic_attack']);
  });

  it('ignora skills equipadas sem rank', () => {
    const hero = Hero.restore({
      ...Hero.createStarter('h1', 'sorcerer', 'Lyra').toProps(),
      skillRanks: { basic_attack: 1 },
      equippedSkillIds: ['basic_attack', 'fireball'],
    });

    expect(listHeroCombatSkills(hero).map((skill) => skill.skillId)).toEqual(['basic_attack']);
  });
});
