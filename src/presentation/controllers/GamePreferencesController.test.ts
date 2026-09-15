// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameStateDto } from '../../application/dto/GameStateDto';
import { GamePreferencesController } from './GamePreferencesController';
import { UI_THEME_ATTR } from '../theme/applyUiTheme';

const sessionStore = new Map<string, string>();
const localStore = new Map<string, string>();

vi.stubGlobal('sessionStorage', {
  getItem: (key: string) => sessionStore.get(key) ?? null,
  setItem: (key: string, value: string) => {
    sessionStore.set(key, value);
  },
  removeItem: (key: string) => {
    sessionStore.delete(key);
  },
  clear: () => {
    sessionStore.clear();
  },
});

vi.stubGlobal('localStorage', {
  getItem: (key: string) => localStore.get(key) ?? null,
  setItem: (key: string, value: string) => {
    localStore.set(key, value);
  },
  removeItem: (key: string) => {
    localStore.delete(key);
  },
  clear: () => {
    localStore.clear();
  },
});

function createStateWithAutoBattle(): GameStateDto {
  return {
    stage: 1,
    gold: 0,
    heroes: [],
    inventory: [],
    chests: [],
    pendingChestCount: 0,
    battleLog: [],
    currentEnemy: null,
    upgradeLevels: {},
    shopRefreshLimit: 0,
    shopRefreshUses: 0,
    featureFlags: {
      autoBattle: true,
      autoBattleMaxSpeed: 1,
      autoOpenChests: false,
      openAllChests: false,
      autoOpenAllChests: false,
      optimizeLoadout: false,
      optimizeInLootBatch: false,
      autoEquipLoot: false,
      autoEquipSilent: false,
      logFilter: false,
      battleStats: false,
      shopRefresh: false,
      backgroundTick: false,
      backgroundTickMultiplier: 1,
    },
  } as GameStateDto;
}

describe('GamePreferencesController', () => {
  beforeEach(() => {
    sessionStore.clear();
    localStore.clear();
    document.documentElement.removeAttribute(UI_THEME_ATTR);
  });

  it('liga auto-batalha por padrão em sessão nova', () => {
    const controller = new GamePreferencesController();
    const state = createStateWithAutoBattle();

    controller.apply(state);

    expect(controller.preferences.autoBattle).toBe(true);
    expect(controller.autoBattleEnabled).toBe(true);
  });

  it('persiste auto-batalha ao atualizar preferência', () => {
    const controller = new GamePreferencesController();
    const state = createStateWithAutoBattle();

    const result = controller.update('autoBattle', true, state);

    expect(result.applied).toBe(true);
    expect(controller.preferences.autoBattle).toBe(true);
    expect(controller.autoBattleEnabled).toBe(true);
  });

  it('usa tema escuro por padrão em sessão nova', () => {
    const controller = new GamePreferencesController();
    const state = createStateWithAutoBattle();

    controller.apply(state);

    expect(controller.preferences.uiTheme).toBe('dark');
  });

  it('persiste tema escuro e aplica data-ui-theme', () => {
    const controller = new GamePreferencesController();
    const state = createStateWithAutoBattle();

    const result = controller.update('uiTheme', 'dark', state);

    expect(result.applied).toBe(true);
    expect(controller.preferences.uiTheme).toBe('dark');
    expect(localStore.get('sidehero_ui_theme')).toBe('dark');
    expect(document.documentElement.getAttribute(UI_THEME_ATTR)).toBe('dark');
  });

  it('intervalo 1× alinha tick com COMBAT_DELTA (1s de combate ≈ 1s real)', () => {
    const controller = new GamePreferencesController();
    const state = createStateWithAutoBattle();
    controller.apply(state);

    expect(controller.getAutoBattleIntervalMs(state)).toBe(1000);
  });

  it('velocidade 2× e 3× encurtam o intervalo proporcionalmente', () => {
    const controller = new GamePreferencesController();
    const state = {
      ...createStateWithAutoBattle(),
      featureFlags: {
        ...createStateWithAutoBattle().featureFlags,
        autoBattleMaxSpeed: 3 as const,
      },
    };
    controller.apply(state);
    controller.update('autoBattleSpeed', 2, state);
    expect(controller.getAutoBattleIntervalMs(state)).toBe(500);
    controller.update('autoBattleSpeed', 3, state);
    expect(controller.getAutoBattleIntervalMs(state)).toBe(333);
  });
});
