import { describe, expect, it } from 'vitest';
import { Hero } from '../entities/Hero';
import { Gear } from '../entities/Gear';
import { GearRequirementChecker } from './GearRequirementChecker';

describe('GearRequirementChecker', () => {
  const checker = new GearRequirementChecker();

  it('permite equipar sem requisitos extras', () => {
    const hero = Hero.createStarter('h1', 'knight', 'Test');
    const gear = Gear.create({
      id: 'g1',
      name: 'Espada',
      templateId: 'rusty_blade',
      slot: 'weapon',
      rarity: 'common',
      attackBonus: 5,
      defenseBonus: 0,
      healthBonus: 0,
      requirements: { minLevel: 1 },
    });

    expect(checker.meets(hero, gear)).toBe(true);
  });

  it('bloqueia quando STR insuficiente', () => {
    const hero = Hero.createStarter('h1', 'sorcerer', 'Mage');
    const gear = Gear.create({
      id: 'g2',
      name: 'Machado',
      templateId: 'pixel_axe',
      slot: 'weapon',
      rarity: 'rare',
      attackBonus: 10,
      defenseBonus: 0,
      healthBonus: 0,
      requirements: { minLevel: 1, str: 20 },
    });

    expect(checker.meets(hero, gear)).toBe(false);
  });

  it('usa requisitos declarados no catálogo (cajado com INT)', () => {
    const reqs = GearRequirementChecker.inferRequirementsForTemplate(
      'arcanist_staff',
      6,
      'weapon',
      'rare',
    );

    expect(reqs).toEqual({ minLevel: 6, int: 3 });
  });
});
