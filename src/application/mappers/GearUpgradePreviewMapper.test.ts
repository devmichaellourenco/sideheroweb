import { describe, expect, it } from 'vitest';
import { GameState } from '../../domain/entities/GameState';
import { Gear } from '../../domain/entities/Gear';
import { Hero } from '../../domain/entities/Hero';
import { Experience } from '../../domain/value-objects/Experience';
import { buildInventoryUpgradeHints } from './GearUpgradePreviewMapper';

function heroAtLevel(id: string, level: number): Hero {
  const base = Hero.createStarter(id, 'knight', 'Hero');
  return Hero.restore({
    ...base.toProps(),
    experience: Experience.restore(0, 100, level),
  });
}

describe('GearUpgradePreviewMapper', () => {
  it('gera hints de upgrade alinhados ao LoadoutOptimizer', () => {
    const hero = heroAtLevel('hero-1', 5);
    const gear = Gear.create({
      id: 'gear-1',
      name: 'Espada',
      slot: 'weapon',
      rarity: 'common',
      attackBonus: 8,
      defenseBonus: 0,
      healthBonus: 0,
      requirements: { minLevel: 1 },
    });
    const state = GameState.restore({
      ...GameState.initial().toProps(),
      heroes: [hero],
      inventory: [gear],
    });

    const hints = buildInventoryUpgradeHints(state);
    expect(hints['gear-1']).toEqual({
      status: 'upgrade',
      gain: 8,
      heroId: 'hero-1',
      heroName: 'Hero',
      equipped: null,
    });
  });

  it('omite itens sem herói elegível', () => {
    const hero = heroAtLevel('hero-1', 1);
    const gear = Gear.create({
      id: 'gear-2',
      name: 'Espada rara',
      slot: 'weapon',
      rarity: 'rare',
      attackBonus: 20,
      defenseBonus: 0,
      healthBonus: 0,
      requirements: { minLevel: 10 },
    });
    const state = GameState.restore({
      ...GameState.initial().toProps(),
      heroes: [hero],
      inventory: [gear],
    });

    const hints = buildInventoryUpgradeHints(state);
    expect(hints['gear-2']).toBeUndefined();
  });
});
