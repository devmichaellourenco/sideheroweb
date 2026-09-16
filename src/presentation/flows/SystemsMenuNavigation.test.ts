import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  adjacentSystemsMenu,
  isSystemsMenuAvailable,
  isSystemsSurfaceOpen,
  listAvailableSystemsMenus,
  resolveCurrentSystemsMenu,
  SYSTEMS_MENU_ORDER,
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
    expect(isSystemsMenuAvailable('stats', { ...campUnlocked, battleStats: false })).toBe(true);
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

    expect(
      resolveCurrentSystemsMenu({
        logVisible: false,
        statsVisible: false,
        drawerOpen: false,
        modalOpen: true,
        modalStackRootType: 'shop',
        campaignOpen: true,
        trackedId: 'shop',
      }),
    ).toBe('shop');
  });

  it('toggle do rail fecha só o sheet daquele menu (mapa embutido não conta)', () => {
    const shopOpen = {
      logVisible: false,
      statsVisible: false,
      drawerOpen: false,
      modalOpen: true,
      modalStackRootType: 'shop',
      campaignOpen: false,
      trackedId: 'shop' as const,
    };
    expect(isSystemsSurfaceOpen('shop', shopOpen)).toBe(true);
    expect(isSystemsSurfaceOpen('campaign', shopOpen)).toBe(false);
    expect(isSystemsSurfaceOpen('upgrades', shopOpen)).toBe(false);

    const shopWhileHubMapExists = { ...shopOpen, campaignOpen: true };
    expect(isSystemsSurfaceOpen('shop', shopWhileHubMapExists)).toBe(true);
    expect(isSystemsSurfaceOpen('campaign', shopWhileHubMapExists)).toBe(false);

    expect(
      isSystemsSurfaceOpen('campaign', {
        logVisible: false,
        statsVisible: false,
        drawerOpen: false,
        modalOpen: true,
        modalStackRootType: null,
        campaignOpen: true,
        trackedId: 'campaign',
      }),
    ).toBe(true);

    expect(
      isSystemsSurfaceOpen('campaign', {
        logVisible: false,
        statsVisible: false,
        drawerOpen: false,
        modalOpen: false,
        modalStackRootType: null,
        campaignOpen: false,
        trackedId: null,
      }),
    ).toBe(false);

    expect(
      isSystemsSurfaceOpen('heroes', {
        logVisible: false,
        statsVisible: false,
        drawerOpen: true,
        modalOpen: false,
        modalStackRootType: null,
        campaignOpen: false,
        trackedId: 'heroes',
      }),
    ).toBe(true);
    expect(
      isSystemsSurfaceOpen('inventory', {
        logVisible: false,
        statsVisible: false,
        drawerOpen: true,
        modalOpen: false,
        modalStackRootType: null,
        campaignOpen: false,
        trackedId: 'heroes',
      }),
    ).toBe(false);

    expect(
      isSystemsSurfaceOpen('log', {
        logVisible: true,
        statsVisible: false,
        drawerOpen: false,
        modalOpen: false,
        modalStackRootType: null,
        campaignOpen: false,
        trackedId: 'log',
      }),
    ).toBe(true);

    expect(isSystemsSurfaceOpen('forge', {
        logVisible: false,
        statsVisible: false,
        drawerOpen: false,
        modalOpen: true,
        modalStackRootType: 'divine-forge',
        campaignOpen: false,
        trackedId: 'forge',
      }),
    ).toBe(true);

    const shopUnderLog = {
      logVisible: true,
      statsVisible: true,
      drawerOpen: false,
      modalOpen: true,
      modalStackRootType: 'shop',
      campaignOpen: false,
      trackedId: 'shop' as const,
    };
    expect(isSystemsSurfaceOpen('shop', shopUnderLog)).toBe(true);
    expect(isSystemsSurfaceOpen('formation', {
      ...shopUnderLog,
      modalStackRootType: 'formation',
      trackedId: 'formation' as const,
    })).toBe(true);
    expect(isSystemsSurfaceOpen('upgrades', {
      ...shopUnderLog,
      modalStackRootType: 'upgrades',
      trackedId: 'upgrades' as const,
    })).toBe(true);
    expect(isSystemsSurfaceOpen('achievements', {
      ...shopUnderLog,
      modalStackRootType: 'achievements',
      trackedId: 'achievements' as const,
    })).toBe(true);
    expect(isSystemsSurfaceOpen('settings', {
      ...shopUnderLog,
      modalStackRootType: 'settings',
      trackedId: 'settings' as const,
    })).toBe(true);
  });

  it('alinha SYSTEMS_MENU_ORDER aos botões do rail inferior em panel.html', () => {
    const html = readFileSync(resolve(__dirname, '../panel/panel.html'), 'utf8');
    const buttonId: Record<(typeof SYSTEMS_MENU_ORDER)[number], string> = {
      heroes: 'open-heroes-btn',
      formation: 'open-formation-btn',
      log: 'open-battle-log-btn',
      stats: 'open-battle-stats-btn',
      campaign: 'open-campaign-btn',
      shop: 'open-shop-btn',
      inventory: 'open-inventory-btn',
      stash: 'open-stash-btn',
      forge: 'open-forge-btn',
      upgrades: 'open-upgrades-btn',
      achievements: 'open-achievements-btn',
      settings: 'open-settings-btn',
    };
    const positions = SYSTEMS_MENU_ORDER.map((id) => html.indexOf(`id="${buttonId[id]}"`));
    expect(positions.every((pos) => pos >= 0)).toBe(true);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });
});
