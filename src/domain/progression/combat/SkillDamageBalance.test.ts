import { describe, expect, it } from 'vitest';
import { Hero } from '../../entities/Hero';
import { getHeroCombatIdentity } from '../../combat/HeroCombatIdentityCatalog';
import { getHeroCombatSkill } from './HeroCombatSkillCatalog';
import {
  applyHeroDamageSkillPower,
  calculateHeroSkillRawPower,
  skillRankMultiplier,
} from './SkillDamageBalance';
import { SkillPowerCalculator } from './SkillPowerCalculator';

describe('SkillDamageBalance — fórmula multiplicativa', () => {
  it('rank usa powerPerRank × nível desde o nível 1', () => {
    expect(skillRankMultiplier(10, 1)).toBe(10);
    expect(skillRankMultiplier(10, 2)).toBe(20);
    expect(skillRankMultiplier(5, 3)).toBe(15);
  });

  it('frost_shard = Base × (powerPerRank × rank) × (INT × fator)', () => {
    const skill = getHeroCombatSkill('frost_shard')!;
    const raw = calculateHeroSkillRawPower(skill, 2, 16);
    expect(skill.powerPerRank).toBe(15);
    expect(raw).toBeCloseTo(1 * 15 * 2 * 16 * 0.8, 5);
    expect(applyHeroDamageSkillPower(skill, raw, 20, 0.5)).toBe(Math.floor(raw));
  });

  it('não aplica multiplicador global de poder', () => {
    const skill = getHeroCombatSkill('fireball')!;
    const raw = calculateHeroSkillRawPower(skill, 1, 10);
    expect(applyHeroDamageSkillPower(skill, raw, 10, 0.5)).toBe(Math.max(1, Math.floor(raw)));
  });

  it('skill de dano nunca fica abaixo do ataque básico', () => {
    const skill = getHeroCombatSkill('thrust')!;
    const attack = 400;
    const ratio = getHeroCombatIdentity('knight').basicAttackDamageRatio;
    const basic = Math.max(1, Math.floor(attack * ratio));
    const raw = calculateHeroSkillRawPower(skill, 1, 12);
    expect(raw).toBeLessThan(basic);
    expect(applyHeroDamageSkillPower(skill, raw, attack, ratio)).toBe(basic);
  });
});

describe('SkillPowerCalculator — power multiplicativo', () => {
  const calculator = new SkillPowerCalculator();

  it('dobra o termo de rank ao subir de 1 para 2', () => {
    const skill = getHeroCombatSkill('frost_shard')!;
    const base = Hero.createStarter('s1', 'sorcerer', 'Nix');
    const r1 = Hero.restore({
      ...base.toProps(),
      skillRanks: { ...base.toProps().skillRanks, frost_shard: 1 },
    });
    const r2 = Hero.restore({
      ...base.toProps(),
      skillRanks: { ...base.toProps().skillRanks, frost_shard: 2 },
    });

    const p1 = calculator.calculateForHero(skill, r1);
    const p2 = calculator.calculateForHero(skill, r2);
    expect(p2).toBe(p1 * 2);
  });

  it('básico permanece ATK × ratio sem powerPerRank de skill', () => {
    const hero = Hero.createStarter('s1', 'sorcerer', 'Nix');
    const basic = calculator.calculateForHero(getHeroCombatSkill('basic_attack')!, hero);
    const ratio = getHeroCombatIdentity(hero.heroClass).basicAttackDamageRatio;
    expect(basic).toBe(Math.max(1, Math.floor(hero.attack * ratio)));
  });

  it('Investida Mortal sobe com rank quando acima do ataque básico', () => {
    const skill = getHeroCombatSkill('thrust')!;
    const base = Hero.createStarter('k1', 'knight', 'Galneon');
    const r1 = Hero.restore({
      ...base.toProps(),
      skillRanks: { ...base.toProps().skillRanks, thrust: 1 },
    });
    const r2 = Hero.restore({
      ...base.toProps(),
      skillRanks: { ...base.toProps().skillRanks, thrust: 2 },
    });
    const r3 = Hero.restore({
      ...base.toProps(),
      skillRanks: { ...base.toProps().skillRanks, thrust: 3 },
    });

    const basic = calculator.calculateForHero(getHeroCombatSkill('basic_attack')!, r1);
    const p1 = calculator.calculateForHero(skill, r1);
    const p2 = calculator.calculateForHero(skill, r2);
    const p3 = calculator.calculateForHero(skill, r3);

    expect(p1).toBeGreaterThanOrEqual(basic);
    expect(p2).toBeGreaterThan(p1);
    expect(p3).toBeGreaterThan(p2);
  });
});
