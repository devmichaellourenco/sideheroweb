import { describe, expect, it } from 'vitest';
import { GameState } from '../entities/GameState';
import { Gear } from '../entities/Gear';
import { Hero } from '../entities/Hero';
import { Experience } from '../value-objects/Experience';
import { LoadoutOptimizer } from './LoadoutOptimizer';

function heroAtLevel(id: string, heroClass: 'knight' | 'sorcerer' | 'priest', name: string, level: number): Hero {
  const base = Hero.createStarter(id, heroClass, name);
  return Hero.restore({
    ...base.toProps(),
    experience: Experience.restore(0, 100, level),
  });
}

function createGear(id: string, attackBonus: number, minLevel = 1): Gear {
  return Gear.create({
    id,
    name: `Gear ${id}`,
    slot: 'weapon',
    rarity: 'common',
    attackBonus,
    defenseBonus: 0,
    healthBonus: 0,
    requirements: { minLevel },
  });
}

describe('LoadoutOptimizer.previewUpgradeForGear', () => {
  it('ignora heróis que não atendem requisitos do item', () => {
    const hero = heroAtLevel('hero-1', 'knight', 'Galneon', 1);
    const gear = createGear('g1', 20, 5);
    const state = GameState.restore({
      ...GameState.initial().toProps(),
      heroes: [hero],
      inventory: [gear],
    });
    const optimizer = new LoadoutOptimizer();

    expect(optimizer.previewUpgradeForGear(state, gear)).toBeNull();
  });

  it('retorna melhor ganho entre heróis elegíveis', () => {
    const heroA = heroAtLevel('hero-1', 'knight', 'Galneon', 5);
    const heroB = heroAtLevel('hero-2', 'sorcerer', 'Mage', 5);
    const gear = createGear('g2', 15, 1);
    const state = GameState.restore({
      ...GameState.initial().toProps(),
      heroes: [heroA, heroB],
      inventory: [gear],
    });
    const optimizer = new LoadoutOptimizer();

    const preview = optimizer.previewUpgradeForGear(state, gear);
    expect(preview).not.toBeNull();
    expect(preview?.gain).toBe(15);
    expect(preview?.status).toBe('upgrade');
  });
});

describe('LoadoutOptimizer.countActivePartyUpgrades', () => {
  it('conta upgrades apenas para a party ativa', () => {
    const heroA = heroAtLevel('hero-1', 'knight', 'Galneon', 5);
    const heroB = heroAtLevel('hero-2', 'sorcerer', 'Mage', 5);
    const partyGear = createGear('party-gear', 12, 1);
    const benchOnlyGear = createGear('bench-gear', 30, 20);
    const state = GameState.restore({
      ...GameState.initial().toProps(),
      heroes: [heroA, heroB],
      activePartyIds: [heroA.id],
      inventory: [partyGear, benchOnlyGear],
    });
    const optimizer = new LoadoutOptimizer();

    expect(optimizer.countActivePartyUpgrades(state)).toBe(1);
  });
});

describe('LoadoutOptimizer.optimizeLoadout', () => {
  it('equipa em rodadas até estabilizar e redistribui itens substituídos', () => {
    const heroA = heroAtLevel('hero-1', 'knight', 'Galneon', 5);
    const heroB = heroAtLevel('hero-2', 'sorcerer', 'Mage', 5);
    const swordStrong = createGear('s-strong', 20, 1);
    const swordMedium = createGear('s-medium', 12, 1);

    let state = GameState.restore({
      ...GameState.initial().toProps(),
      heroes: [heroA, heroB],
      activePartyIds: [heroA.id, heroB.id],
      inventory: [swordStrong, swordMedium],
    });

    const optimizer = new LoadoutOptimizer();
    const result = optimizer.optimizeLoadout(state);

    expect(result.equippedCount).toBeGreaterThanOrEqual(2);
    expect(result.state.inventory).toHaveLength(0);
  });

  it('para mago preferência cajado com cast/elemental a espada de ATK maior', () => {
    const mage = heroAtLevel('mage-1', 'sorcerer', 'Mira', 8);
    const sword = Gear.create({
      id: 'sword-atk',
      name: 'Espada',
      templateId: 'patrol_sword',
      slot: 'weapon',
      rarity: 'rare',
      attackBonus: 24,
      defenseBonus: 0,
      healthBonus: 0,
      requirements: { minLevel: 1 },
    });
    const staff = Gear.create({
      id: 'staff-cast',
      name: 'Cajado',
      templateId: 'arcanist_staff',
      slot: 'weapon',
      rarity: 'rare',
      attackBonus: 15,
      defenseBonus: 1,
      healthBonus: 0,
      castSpeedBonus: 0.09,
      allElementalDamageBonus: 10,
      requirements: { minLevel: 1, int: 0 },
    });
    const mageWithSword = mage.equip(sword);
    const state = GameState.restore({
      ...GameState.initial().toProps(),
      heroes: [mageWithSword],
      activePartyIds: [mageWithSword.id],
      inventory: [staff],
    });

    const preview = new LoadoutOptimizer().previewUpgradeForGear(state, staff);
    expect(preview?.status).toBe('upgrade');
    expect(preview?.heroId).toBe(mageWithSword.id);
  });
});
