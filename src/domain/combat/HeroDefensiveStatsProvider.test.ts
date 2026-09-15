import { describe, expect, it } from 'vitest';
import { Gear } from '../entities/Gear';
import { Hero } from '../entities/Hero';
import { defensiveMitigationForHero } from './HeroDefensiveStatsProvider';

describe('HeroDefensiveStatsProvider', () => {
  it('soma dodge de gear com base de DEX', () => {
    let hero = Hero.createStarter('hero-1', 'knight', 'Test');
    hero = hero.equip(
      Gear.create({
        id: 'boots',
        name: 'Botas Ágeis',
        slot: 'armor',
        rarity: 'legendary',
        attackBonus: 0,
        defenseBonus: 2,
        healthBonus: 0,
        dodgeChanceBonus: 0.05,
      }),
    );

    const stats = defensiveMitigationForHero(hero);
    expect(stats.dodgeChance).toBeGreaterThan(0.05);
    expect(stats.blockChance).toBe(0);
  });

  it('redução e bloqueio vêm do equipamento (sem skills só-passivas)', () => {
    let hero = Hero.createStarter('hero-2', 'knight', 'Test');
    hero = hero.equip(
      Gear.create({
        id: 'shield',
        name: 'Escudo',
        slot: 'accessory',
        rarity: 'rare',
        attackBonus: 0,
        defenseBonus: 4,
        healthBonus: 0,
        blockChanceBonus: 0.03,
        damageReductionBonus: 0.08,
      }),
    );

    const stats = defensiveMitigationForHero(hero);
    expect(stats.damageReduction).toBeCloseTo(0.08);
    expect(stats.blockChance).toBeCloseTo(0.03);
  });
});
