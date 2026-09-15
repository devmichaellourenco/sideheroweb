import { describe, expect, it } from 'vitest';
import {
  adjacentSystemsMenu,
  isSystemsMenuAvailable,
  listAvailableSystemsMenus,
  resolveCurrentSystemsMenu,
  systemsMenuFromModalViewType,
  type SystemsMenuAvailability,
} from './SystemsMenuNavigation';

const campUnlocked: SystemsMenuAvailability = {
  canEditParty: true,
  stashUnlocked: true,
  battleStats: true,
  divineForge: true,
};

const inBattle: SystemsMenuAvailability = {
  canEditParty: false,
  stashUnlocked: true,
  battleStats: true,
  divineForge: true,
};

describe('SystemsMenuNavigation', () => {
  it('filtra menus de acampamento e unlocks', () => {
    expect(listAvailableSystemsMenus(inBattle)).toEqual([
      'log',
      'stats',
      'campaign',
      'forge',
      'upgrades',
      'achievements',
      'settings',
    ]);

    expect(isSystemsMenuAvailable('stash', { ...campUnlocked, stashUnlocked: false })).toBe(
      false,
    );
    expect(isSystemsMenuAvailable('stats', { ...campUnlocked, battleStats: false })).toBe(false);
    expect(isSystemsMenuAvailable('forge', { ...campUnlocked, divineForge: false })).toBe(false);
  });

  it('circula prev/next com wrap', () => {
    const available = listAvailableSystemsMenus(campUnlocked);
    expect(adjacentSystemsMenu('heroes', 'prev', available)).toBe('settings');
    expect(adjacentSystemsMenu('settings', 'next', available)).toBe('heroes');
    expect(adjacentSystemsMenu('shop', 'next', available)).toBe('inventory');
    expect(adjacentSystemsMenu('shop', 'prev', available)).toBe('campaign');
  });

  it('retorna null quando há no máximo um menu disponível', () => {
    expect(adjacentSystemsMenu('campaign', 'next', ['campaign'])).toBeNull();
    expect(adjacentSystemsMenu('campaign', 'next', [])).toBeNull();
  });

  it('mapeia tipos de modal para ids de sistema', () => {
    expect(systemsMenuFromModalViewType('divine-forge')).toBe('forge');
    expect(systemsMenuFromModalViewType('equip-picker')).toBeNull();
  });

  it('resolve superfície atual priorizando overlays e drawer', () => {
    expect(
      resolveCurrentSystemsMenu({
        logVisible: true,
        statsVisible: true,
        drawerOpen: true,
        modalOpen: true,
        modalStackRootType: 'shop',
        campaignOpen: false,
        trackedId: 'shop',
      }),
    ).toBe('log');

    expect(
      resolveCurrentSystemsMenu({
        logVisible: false,
        statsVisible: false,
        drawerOpen: true,
        modalOpen: false,
        modalStackRootType: null,
        campaignOpen: false,
        trackedId: 'inventory',
      }),
    ).toBe('inventory');

    expect(
      resolveCurrentSystemsMenu({
        logVisible: false,
        statsVisible: false,
        drawerOpen: false,
        modalOpen: true,
        modalStackRootType: null,
        campaignOpen: true,
        trackedId: null,
      }),
    ).toBe('campaign');
  });
});
