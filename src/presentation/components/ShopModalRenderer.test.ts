// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { GameStateDto, GearDto } from '../../application/dto/GameStateDto';
import { ShopModalRenderer } from './ShopModalRenderer';

function gear(overrides: Partial<GearDto> = {}): GearDto {
  return {
    id: 'g1',
    name: 'Espada Longa do Vento Norte',
    templateId: 'equip_axe_1',
    slot: 'weapon',
    rarity: 'uncommon',
    attackBonus: 12,
    defenseBonus: 0,
    healthBonus: 0,
    requirements: { minLevel: 1 },
    ...overrides,
  } as GearDto;
}

function shopState(): GameStateDto {
  const h1 = {
    id: 'h1',
    name: 'Galneon',
    heroClass: 'knight',
    level: 5,
    totalAttributes: { str: 10, dex: 10, int: 10 },
    equipment: {
      weapon: {
        id: 'eq1',
        name: 'Adaga Velha',
        templateId: 'equip_dagger_1',
        slot: 'weapon',
        rarity: 'common',
        attackBonus: 3,
        defenseBonus: 0,
        healthBonus: 0,
      },
      armor: null,
      accessory: null,
    },
  };
  const h2 = {
    id: 'h2',
    name: 'Lyra',
    heroClass: 'mage',
    level: 4,
    totalAttributes: { str: 5, dex: 8, int: 12 },
    equipment: { weapon: null, armor: null, accessory: null },
  };

  return {
    difficultyTier: 1,
    gold: 100,
    heroes: [h1, h2],
    activeParty: [h1, h2],
    activePartyIds: ['h1', 'h2'],
    benchHeroes: [],
  } as unknown as GameStateDto;
}

describe('ShopModalRenderer', () => {
  it('exibe comparação, drag de oferta paga e drop nos slots do herói', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const renderer = new ShopModalRenderer();
    const state = shopState();

    renderer.render(
      container,
      state,
      {
        activeShop: {
          id: 'camp-quartermaster',
          name: 'Intendente do Acampamento',
          stockSeed: 0,
          difficultyTier: 1,
        },
        offers: [
          {
            id: 'offer-1',
            price: 42,
            canAfford: true,
            gear: gear(),
          },
        ],
        refreshCost: 10,
        canAffordRefresh: true,
        shopRefreshUnlocked: false,
        shopRefreshRemaining: 0,
      },
      { onBuyOffer: vi.fn(), onRefreshShop: vi.fn() },
    );

    expect(container.textContent).toContain('Intendente do Acampamento');

    expect(container.querySelector('.inventory-hero-select-label')?.textContent).toBe(
      'Comparar com',
    );
    expect(container.querySelector('.inventory-loadout')).toBeTruthy();
    expect(container.querySelector('[data-inventory-hero="h1"]')?.getAttribute('aria-pressed')).toBe(
      'true',
    );

    const tile = container.querySelector('[data-shop-offer="offer-1"]') as HTMLElement;
    expect(tile?.querySelector('.shop-offer-name')).toBeNull();
    expect(tile?.querySelector('.shop-offer-icon')).toBeTruthy();
    expect(tile?.querySelector('.inventory-grid-badge--upgrade')).toBeTruthy();
    expect(tile?.getAttribute('draggable')).toBe('true');
    expect(tile?.getAttribute('data-drag-gear')).toContain('shop');
    expect(
      container.querySelector('[data-drop-gear-hero="h1"][data-drop-gear-slot="weapon"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-drop-gear-hero="h1"]')?.getAttribute('data-drag-gear'),
    ).toBeNull();

    const sourceTooltip = tile?.querySelector('.shop-offer-tooltip');
    expect(sourceTooltip?.querySelector('.tooltip-preview-image')).toBeTruthy();
    expect(sourceTooltip?.querySelector('.shop-offer-tooltip-name')?.textContent).toBe(
      'Espada Longa do Vento Norte',
    );
    expect(sourceTooltip?.querySelector('.shop-offer-tooltip-equipped')?.textContent).toContain(
      'Adaga Velha',
    );
    expect(sourceTooltip?.querySelector('.shop-offer-tooltip-hero')?.textContent).toContain(
      'Galneon',
    );

    tile.dispatchEvent(new Event('mouseenter'));
    const portal = document.getElementById('gear-tooltip-portal');
    expect(portal?.classList.contains('hidden')).toBe(false);
    expect(portal?.querySelector('.tooltip-preview-image')).toBeTruthy();
    tile.dispatchEvent(new Event('mouseleave'));

    (container.querySelector('[data-inventory-hero="h2"]') as HTMLButtonElement).click();
    expect(container.querySelector('[data-inventory-hero="h2"]')?.getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(container.querySelector('.shop-offer-tooltip-hero')?.textContent).toContain('Lyra');
    expect(container.querySelector('.shop-offer-tooltip-equipped')?.textContent).toContain(
      'Slot vazio',
    );

    const unaffordable = gear({ id: 'g2', name: 'Caro', attackBonus: 20 });
    renderer.render(
      container,
      { ...state, gold: 1 },
      {
        offers: [{ id: 'offer-2', price: 999, canAfford: false, gear: unaffordable }],
        refreshCost: 10,
        canAffordRefresh: false,
        shopRefreshUnlocked: false,
        shopRefreshRemaining: 0,
      },
      { onBuyOffer: vi.fn(), onRefreshShop: vi.fn() },
    );
    expect(container.querySelector('[data-shop-offer="offer-2"]')?.getAttribute('draggable')).toBeNull();
    expect(
      container.querySelector('[data-shop-offer="offer-2"]')?.getAttribute('data-drag-gear'),
    ).toBeNull();

    container.remove();
  });
});
