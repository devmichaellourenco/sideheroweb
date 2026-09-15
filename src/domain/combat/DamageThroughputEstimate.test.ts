import { describe, expect, it } from 'vitest';
import { Gear } from '../entities/Gear';
import { Hero } from '../entities/Hero';
import { BASIC_ATTACK_SKILL } from '../progression/combat/BasicAttackSkill';
import { getHeroCombatSkill } from '../progression/combat/HeroCombatSkillCatalog';
import {
  basicAttackActionsPerSecond,
  estimateHeroSkillThroughput,
  skillCastsPerSecond,
} from './DamageThroughputEstimate';

describe('DamageThroughputEstimate', () => {
  it('calcula APS = ASPD do combatente (sem piso global)', () => {
    expect(basicAttackActionsPerSecond(1)).toBeCloseTo(1, 5);
    expect(basicAttackActionsPerSecond(0.5)).toBeCloseTo(0.5, 5);
    expect(basicAttackActionsPerSecond(0.4)).toBeCloseTo(0.4, 5);
  });

  it('aplica CDR e recovery ao estimar casts/s', () => {
    const skill = getHeroCombatSkill('frost_shard')!;
    const withoutCdr = skillCastsPerSecond(4, 0, 1, skill);
    const withCdr = skillCastsPerSecond(4, 0.25, 1, skill);

    expect(withCdr.effectiveCooldownSeconds).toBeCloseTo(3, 5);
    expect(withCdr.rate).toBeGreaterThan(withoutCdr.rate);
  });

  it('estima DPS de ataque básico com perfil real (sem NaN)', () => {
    const hero = Hero.createStarter('h1', 'knight', 'Galneon');
    const estimate = estimateHeroSkillThroughput(hero, BASIC_ATTACK_SKILL);

    expect(estimate).not.toBeNull();
    expect(Number.isFinite(estimate!.dps)).toBe(true);
    expect(estimate!.dps).toBeGreaterThan(0);
    expect(estimate!.effectiveCooldownSeconds).toBeNull();
    expect(estimate!.dpsBreakdown.length).toBeGreaterThan(3);
    expect(estimate!.powerBreakdown.some((line) => line.text.includes('ATK'))).toBe(true);
    expect(estimate!.powerBreakdown.some((line) => line.text.includes('Poder final'))).toBe(true);
  });

  it('aumenta DPS de skill com CDR de gear', () => {
    const fireball = getHeroCombatSkill('fireball');
    expect(fireball).toBeTruthy();

    const base = Hero.createStarter('h2', 'sorcerer', 'Nix');
    const without = Hero.restore({
      ...base.toProps(),
      skillRanks: { ...base.toProps().skillRanks, fireball: 2 },
      equippedSkillIds: ['basic_attack', 'fireball'],
    });

    const wand = Gear.create({
      id: 'cdr-wand',
      name: 'Cajado CDR',
      templateId: 'staff',
      slot: 'weapon',
      rarity: 'rare',
      attackBonus: 0,
      defenseBonus: 0,
      healthBonus: 0,
      cooldownReductionBonus: 20,
      requirements: { minLevel: 1 },
    });

    const withCdr = Hero.restore({
      ...without.toProps(),
      equipment: { weapon: wand, armor: null, accessory: null },
    });

    const baseEstimate = estimateHeroSkillThroughput(without, fireball!);
    const cdrEstimate = estimateHeroSkillThroughput(withCdr, fireball!);

    expect(baseEstimate!.dps).toBeGreaterThan(0);
    expect(cdrEstimate!.dps).toBeGreaterThan(baseEstimate!.dps);
    expect(cdrEstimate!.effectiveCooldownSeconds!).toBeLessThan(
      baseEstimate!.effectiveCooldownSeconds!,
    );
  });

  it('estima eficácia vs resists típicas do mapa', () => {
    const hero = Hero.createStarter('h3', 'sorcerer', 'Nix');
    const withFire = Hero.restore({
      ...hero.toProps(),
      skillRanks: { ...hero.toProps().skillRanks, fireball: 2 },
      equippedSkillIds: ['basic_attack', 'fireball'],
    });
    const fireball = getHeroCombatSkill('fireball')!;
    const onGruftall = estimateHeroSkillThroughput(withFire, fireball, undefined, undefined, {
      targetResists: { fire: 20, cold: -15, lightning: 0, air: 0, allElemental: 0 },
    });
    const onValdris = estimateHeroSkillThroughput(withFire, fireball, undefined, undefined, {
      targetResists: { fire: -15, cold: 0, lightning: 0, air: 15, allElemental: 0 },
    });

    expect(onGruftall?.efficacyRatio).not.toBeNull();
    expect(onValdris?.efficacyRatio).toBeGreaterThan(onGruftall!.efficacyRatio!);
    expect(onValdris?.efficacyLabel).toBe('Bom');
  });
});
