import { describe, expect, it } from 'vitest';
import { GameStateDto } from '../../application/dto/GameStateDto';
import {
  renderInventoryGrid,
  renderInventoryGridSlot,
  resolveDefaultInventoryHeroId,
} from './InventoryGridPresentation';

function gear(id: string): GameStateDto['inventory'][0] {
  return {
    id,
    name: `Item ${id}`,
    slot: 'weapon',
    rarity: 'rare',
    attackBonus: 10,
    defenseBonus: 2,
    healthBonus: 0,
    attackSpeedBonus: 0,
    castSpeedBonus: 0,
    critChanceBonus: 0,
    critDamageBonus: 0,
    requirements: { minLevel: 1 },
  };
}

function minimalState(): GameStateDto {
  return {
    heroes: [
      {
        id: 'h1',
        name: 'Galneon',
        heroClass: 'knight',
        level: 1,
        totalAttributes: { str: 0, dex: 0, int: 0 },
        equipment: { weapon: null, armor: null, accessory: null },
      } as GameStateDto['heroes'][0],
    ],
    activeParty: [{ id: 'h1' } as GameStateDto['activeParty'][0]],
    activePartyIds: ['h1'],
    inventory: [gear('g1'), gear('g2')],
  } as GameStateDto;
}

describe('InventoryGridPresentation', () => {
  it('resolveDefaultInventoryHeroId usa herói da party', () => {
    expect(resolveDefaultInventoryHeroId(minimalState())).toBe('h1');
  });

  it('renderiza grid com slots compactos e badge ▲ quando só melhora', () => {
    const html = renderInventoryGrid(minimalState(), minimalState().inventory, 'h1');
    expect(html).toContain('inventory-grid');
    expect(html).toContain('data-inventory-gear-id="g1"');
    expect(html).toContain('inventory-grid-badge--upgrade');
    expect(html).toContain('▲');
    expect(html).not.toContain('inventory-grid-deltas');
  });

  it('inclui tooltip informativo sem ações de equipar/baú/destruir', () => {
    const state = minimalState();
    const hero = state.heroes[0];
    const html = renderInventoryGridSlot(gear('g1'), {
      hero,
      upgradeStatus: 'upgrade',
      equipMode: 'inventory',
    });

    expect(html).toContain('inventory-gear-tooltip-stats');
    expect(html).toContain('tooltip-preview-image');
    expect(html).not.toContain('data-inventory-equip=');
    expect(html).not.toContain('inventory-gear-action--equip');
    expect(html).not.toContain('data-move-to-stash=');
    expect(html).not.toContain('data-destroy-gear=');
    expect(html).toContain('stat-better');
    expect(html).toContain('ATK +10');
    expect(html).toContain('Slot vazio');
    expect(html).toContain('inventory-grid-badge--upgrade');
  });

  it('no tooltip compara com o item equipado; no ícone usa ▲▼ se misto', () => {
    const state = minimalState();
    const hero = {
      ...state.heroes[0],
      equipment: {
        weapon: {
          id: 'eq1',
          name: 'Espada velha',
          templateId: 'old',
          slot: 'weapon',
          rarity: 'common',
          attackBonus: 4,
          defenseBonus: 5,
          healthBonus: 0,
        },
        armor: null,
        accessory: null,
      },
    } as GameStateDto['heroes'][0];

    const html = renderInventoryGridSlot(gear('g1'), {
      hero,
      upgradeStatus: 'upgrade',
      equipMode: 'inventory',
    });

    expect(html).toContain('Vs. equipado: Espada velha');
    expect(html).toContain('ATK +6');
    expect(html).toContain('DEF −3');
    expect(html).toContain('inventory-grid-badge--mixed');
    expect(html).toContain('▲▼');
    expect(html).not.toContain('inventory-grid-delta--better');
  });

  it('não mostra badge no ícone quando os status são iguais', () => {
    const state = minimalState();
    const same = gear('same');
    same.attackBonus = 4;
    same.defenseBonus = 5;
    same.healthBonus = 0;
    const hero = {
      ...state.heroes[0],
      equipment: {
        weapon: {
          id: 'eq1',
          name: 'Espada velha',
          templateId: 'old',
          slot: 'weapon',
          rarity: 'common',
          attackBonus: 4,
          defenseBonus: 5,
          healthBonus: 0,
        },
        armor: null,
        accessory: null,
      },
    } as GameStateDto['heroes'][0];

    const html = renderInventoryGridSlot(same, {
      hero,
      upgradeStatus: 'equal',
      equipMode: 'inventory',
    });

    expect(html).not.toContain('inventory-grid-badge');
    expect(html).toContain('HP =');
  });

  it('inclui drag em itens do inventário para equipar/destruir via drop', () => {
    const state = minimalState();
    const hero = state.heroes[0];
    const html = renderInventoryGridSlot(gear('g1'), {
      hero,
      upgradeStatus: 'upgrade',
      equipMode: 'inventory',
    });

    expect(html).toContain('data-drag-gear=');
    expect(html).toContain('draggable="true"');
  });
});
