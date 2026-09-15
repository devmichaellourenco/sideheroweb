// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { GameStateDto, GearDto, HeroDto } from '../../application/dto/GameStateDto';
import { InventoryModalRenderer } from './InventoryModalRenderer';

function gear(id: string, slot: GearDto['slot']): GearDto {
  return {
    id,
    name: `Item ${id}`,
    slot,
    rarity: 'common',
    attackBonus: 1,
    defenseBonus: 0,
    healthBonus: 0,
    attackSpeedBonus: 0,
    castSpeedBonus: 0,
    critChanceBonus: 0,
    critDamageBonus: 0,
    requirements: { minLevel: 1 },
  };
}

function minimalHero(): HeroDto {
  return {
    id: 'h1',
    name: 'Galneon',
    heroClass: 'knight',
    emoji: '⚔️',
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    attack: 10,
    defense: 5,
    attackSpeed: 0.4,
    castSpeed: 1,
    critChance: 0.05,
    critDamage: 1.65,
    health: 80,
    maxHealth: 90,
    baseAttributes: { str: 10, dex: 5, int: 5 },
    allocatedAttributes: { str: 0, dex: 0, int: 0 },
    totalAttributes: { str: 10, dex: 5, int: 5 },
    unspentImprovementPoints: 0,
    unspentAscensionPoints: 0,
    skillRanks: {},
    equippedSkillIds: [],
    activeSkills: [null, null, null],
    maxActiveSkills: 3,
    unlockedActiveSkillSlots: 1,
    ascensionId: null,
    hasUnspentPoints: false,
    equipment: { weapon: null, armor: null, accessory: null },
    combatIntent: null,
    combatSkills: [],
    combatSkillCooldowns: [],
    statusEffects: [],
    combatResists: { fire: 0, cold: 0, lightning: 0, air: 0 },
    combatStatSheet: [],
  } as HeroDto;
}

function minimalState(): GameStateDto {
  return {
    heroes: [minimalHero()],
    activeParty: [minimalHero()],
    activePartyIds: ['h1'],
    benchHeroes: [],
    inventory: [gear('w1', 'weapon'), gear('a1', 'armor'), gear('x1', 'accessory')],
    storageCapacity: {
      inventoryUsed: 3,
      inventoryLimit: 30,
      stashUsed: 0,
      stashLimit: 50,
      stashUnlocked: false,
    },
    featureFlags: { optimizeLoadout: false },
  } as GameStateDto;
}

function noopHandlers() {
  return {
    onEquipGear: () => undefined,
    onUnequipGear: () => undefined,
    onSlotClick: () => undefined,
    onSortChange: () => undefined,
    onHeroChange: () => undefined,
    onUpgradesOnlyChange: () => undefined,
    onOptimizeLoadout: () => undefined,
    onOpenStash: () => undefined,
  };
}

describe('InventoryModalRenderer', () => {
  it('embedded não renderiza filtros texto de categoria', () => {
    const container = document.createElement('div');
    const renderer = new InventoryModalRenderer();

    renderer.renderEmbedded(container, minimalState(), 'h1', noopHandlers());

    expect(container.innerHTML).not.toContain('data-filter="all"');
    expect(container.innerHTML).not.toContain('data-filter="weapon"');
    expect(container.innerHTML).toContain('data-sort="gain"');
    expect(container.innerHTML).toContain('data-inventory-gear-id="w1"');
    expect(container.innerHTML).toContain('data-inventory-gear-id="a1"');
  });

  it('modo slot ativo filtra grid in-place com pick mode', () => {
    const container = document.createElement('div');
    const renderer = new InventoryModalRenderer();

    renderer.renderEmbedded(container, minimalState(), 'h1', noopHandlers(), {
      inlineActiveSlot: { heroId: 'h1', slot: 'weapon' },
    });

    expect(container.innerHTML).toContain('inventory-panel--slot-active');
    expect(container.innerHTML).toContain('inventory-slot-context');
    expect(container.innerHTML).toContain('data-pick-gear="w1"');
    expect(container.innerHTML).not.toContain('data-inventory-gear-id="a1"');
    expect(container.innerHTML).toContain('data-sort="gain"');
  });
});
