// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest';
import { GameStateDto, GearDto } from '../../application/dto/GameStateDto';
import { DivineForgeModalRenderer } from './DivineForgeModalRenderer';

function gear(id: string, rarity: GearDto['rarity'] = 'common'): GearDto {
  return {
    id,
    name: id,
    templateId: 'equip_axe_1',
    slot: 'weapon',
    rarity,
    attackBonus: 1,
    defenseBonus: 0,
    healthBonus: 0,
    requirements: { minLevel: 1 },
  } as GearDto;
}

function forgeState(items: GearDto[]): GameStateDto {
  return {
    stage: 1,
    inventory: items,
    stash: [],
    storageCapacity: {
      inventoryUsed: items.length,
      inventoryLimit: 24,
      stashUsed: 0,
      stashLimit: 24,
      stashUnlocked: true,
    },
    featureFlags: { divineForge: true },
  } as GameStateDto;
}

describe('DivineForgeModalRenderer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('seleciona item sem recriar os nós da grade', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const renderer = new DivineForgeModalRenderer();
    const state = forgeState([gear('g1'), gear('g2')]);
    const handlers = {
      onTabChange: () => undefined,
      onFuse: () => undefined,
      onSalvage: () => undefined,
    };

    renderer.render(container, state, handlers);
    const firstSlot = container.querySelector('[data-forge-gear-id="g1"]') as HTMLElement;
    expect(firstSlot).toBeTruthy();

    firstSlot.click();

    const sameSlot = container.querySelector('[data-forge-gear-id="g1"]') as HTMLElement;
    expect(sameSlot).toBe(firstSlot);
    expect(sameSlot.classList.contains('forge-grid-slot--selected')).toBe(true);
    expect(container.querySelector('.forge-dock-badge')?.textContent).toBe('1/9');
  });

  it('limpa seleção in-place pelo botão do dock', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const renderer = new DivineForgeModalRenderer();
    const state = forgeState([gear('g1')]);

    renderer.render(container, state, {
      onTabChange: () => undefined,
      onFuse: () => undefined,
      onSalvage: () => undefined,
    });

    (container.querySelector('[data-forge-gear-id="g1"]') as HTMLElement).click();
    expect(container.querySelector('[data-forge-clear-selection]')).toBeTruthy();

    const slot = container.querySelector('[data-forge-gear-id="g1"]') as HTMLElement;
    (container.querySelector('[data-forge-clear-selection]') as HTMLElement).click();

    expect(slot.classList.contains('forge-grid-slot--selected')).toBe(false);
    expect(container.querySelector('[data-forge-clear-selection]')).toBeNull();
  });
});
