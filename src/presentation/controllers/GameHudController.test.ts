// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { GameStateDto } from '../../application/dto/GameStateDto';
import { GameHudController } from '../controllers/GameHudController';

function createButton(id: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.id = id;
  button.className = 'action-icon-btn';
  return button;
}

function createHud(): {
  hud: GameHudController;
  campaign: HTMLButtonElement;
  buttons: {
    heroes: HTMLButtonElement;
    formation: HTMLButtonElement;
    shop: HTMLButtonElement;
    inventory: HTMLButtonElement;
    stash: HTMLButtonElement;
    forge: HTMLButtonElement;
    optimize: HTMLButtonElement;
    openAllChests: HTMLButtonElement;
    upgrades: HTMLButtonElement;
    chest: HTMLButtonElement;
    pauseBattle: HTMLButtonElement;
    resumeBattle: HTMLButtonElement;
    pause: HTMLButtonElement;
    continue: HTMLButtonElement;
    battleStats: HTMLButtonElement;
  };
} {
  const campaign = document.createElement('button');
  campaign.id = 'campaign-context-btn';
  campaign.className = 'campaign-context-btn';
  campaign.type = 'button';
  const gold = document.createElement('div');
  const chest = document.createElement('div');
  const chestProgress = document.createElement('div');
  const buttons = {
    heroes: createButton('open-heroes-btn'),
    formation: createButton('open-formation-btn'),
    shop: createButton('open-shop-btn'),
    inventory: createButton('open-inventory-btn'),
    stash: createButton('open-stash-btn'),
    forge: createButton('open-forge-btn'),
    optimize: createButton('optimize-loadout-btn'),
    openAllChests: createButton('open-all-chests-btn'),
    upgrades: createButton('open-upgrades-btn'),
    chest: createButton('open-chest-btn'),
    pauseBattle: createButton('pause-battle-btn'),
    resumeBattle: createButton('resume-battle-btn'),
    pause: createButton('pause-loadout-btn'),
    continue: createButton('continue-loadout-btn'),
    battleStats: createButton('open-battle-stats-btn'),
  };

  const hud = new GameHudController(
    campaign,
    gold,
    chest,
    chestProgress,
    buttons.heroes,
    buttons.formation,
    buttons.shop,
    buttons.inventory,
    buttons.stash,
    buttons.forge,
    buttons.optimize,
    buttons.openAllChests,
    buttons.upgrades,
    buttons.chest,
    buttons.pauseBattle,
    buttons.resumeBattle,
    buttons.pause,
    buttons.continue,
    buttons.battleStats,
  );

  return { hud, campaign, buttons };
}

function mockState(overrides: Partial<GameStateDto> = {}): GameStateDto {
  return {
    mapId: 'stendra',
    mapName: 'Stendra',
    mapCombatHint: 'Ameaça: Bestas e bandidos · Favorável: Físico / Raio',
    campaignName: 'Campanha',
    phaseLabel: '1-1',
    stage: 1,
    gold: 0,
    pendingChestCount: 0,
    heroes: [],
    activeParty: [],
    activePartyUpgradeCount: 0,
    inventory: [],
    storageCapacity: {
      inventoryUsed: 0,
      inventoryLimit: 30,
      stashUnlocked: true,
      stashUsed: 0,
      stashLimit: 20,
    },
    featureFlags: {
      autoBattle: true,
      autoBattleMaxSpeed: 1,
      autoOpenChests: false,
      openAllChests: false,
      autoOpenAllChests: false,
      optimizeLoadout: true,
      optimizeInLootBatch: false,
      autoEquipLoot: false,
      autoEquipSilent: false,
      logFilter: false,
      battleStats: false,
      shopRefresh: false,
      backgroundTick: false,
      backgroundTickMultiplier: 1,
      itemStash: true,
      stashCapacity: 20,
      inventoryCapacity: 30,
      divineForge: false,
      improvementReset: 0,
    },
    chestProgress: { current: 0, target: 5, ratio: 0 },
    purchasableUpgradeCount: 0,
    campaignProgress: {
      selectedPhaseId: '1-1',
      unlockedPhaseIds: ['1-1'],
      clearedPhaseIds: [],
      highestTierReached: 1,
      seasonCompleted: false,
    },
    canEditParty: true,
    phaseRun: null,
    ...overrides,
  } as GameStateDto;
}

describe('GameHudController — acesso no acampamento', () => {
  it('exibe sistemas de acampamento quando canEditParty', () => {
    const { hud, buttons } = createHud();

    hud.render(mockState({ canEditParty: true }), { openingChests: false });

    expect(buttons.heroes.classList.contains('hidden')).toBe(false);
    expect(buttons.formation.classList.contains('hidden')).toBe(false);
    expect(buttons.shop.classList.contains('hidden')).toBe(false);
    expect(buttons.inventory.classList.contains('hidden')).toBe(false);
    expect(buttons.stash.classList.contains('hidden')).toBe(false);
    expect(buttons.stash.dataset.menuTooltip).toBe('stash');
    expect(buttons.stash.dataset.menuTooltipDetail).toBe('Itens guardados: 0/20');
    // OTIMIZAR EQUIPE DESATIVADO (2026-08)
    expect(buttons.optimize.classList.contains('hidden')).toBe(true);
  });

  it('esconde sistemas de acampamento em missão', () => {
    const { hud, buttons } = createHud();

    hud.render(
      mockState({
        canEditParty: false,
        phaseRun: {
          phaseId: '1-1',
          waveIndex: 0,
          waveCount: 3,
          isBossWave: false,
        } as GameStateDto['phaseRun'],
      }),
      { openingChests: false },
    );

    expect(buttons.heroes.classList.contains('hidden')).toBe(true);
    expect(buttons.formation.classList.contains('hidden')).toBe(true);
    expect(buttons.shop.classList.contains('hidden')).toBe(true);
    expect(buttons.inventory.classList.contains('hidden')).toBe(true);
    expect(buttons.stash.classList.contains('hidden')).toBe(true);
    expect(buttons.optimize.classList.contains('hidden')).toBe(true);
  });

  it('mantém campanha e baús visíveis fora do acampamento', () => {
    const { hud, buttons } = createHud();

    hud.render(mockState({ canEditParty: false, pendingChestCount: 1 }), {
      openingChests: false,
    });

    expect(buttons.chest.classList.contains('hidden')).toBe(false);
    expect(buttons.upgrades.classList.contains('hidden')).toBe(false);
  });

  it('monta trilha à esquerda e wave à direita', () => {
    const { hud, campaign } = createHud();

    hud.render(
      mockState({
        mapName: 'Stendra',
        campaignProgress: {
          selectedPhaseId: '1-20',
          unlockedPhaseIds: ['1-1'],
          clearedPhaseIds: [],
          highestTierReached: 1,
          seasonCompleted: false,
        },
        phaseRun: {
          phaseId: '1-20',
          waveIndex: 0,
          waveCount: 3,
          isBossWave: false,
        } as GameStateDto['phaseRun'],
      }),
      { openingChests: false },
    );

    expect(campaign.querySelector('.campaign-context-btn__map')?.textContent).toBe('Stendra');
    expect(campaign.querySelector('.campaign-context-btn__phase')?.textContent).toBe('1-20');
    expect(campaign.querySelector('.campaign-context-btn__wave-label')?.textContent).toBe('Wave');
    expect(campaign.querySelector('.campaign-context-btn__wave-value')?.textContent).toBe('1/3');
    expect(campaign.getAttribute('data-campaign-theme')).toBe('stendra');
  });

  it('mostra Pausar em missão e Continuar na pausa de batalha', () => {
    const { hud, buttons } = createHud();

    hud.render(
      mockState({
        canEditParty: false,
        battlePaused: false,
        combatIntermission: null,
        phaseRun: {
          phaseId: '1-1',
          waveIndex: 0,
          waveCount: 3,
          isBossWave: false,
        } as GameStateDto['phaseRun'],
      }),
      { openingChests: false, battlePauseActive: false },
    );

    expect(buttons.pauseBattle.classList.contains('hidden')).toBe(false);
    expect(buttons.resumeBattle.classList.contains('hidden')).toBe(true);

    hud.render(
      mockState({
        canEditParty: false,
        battlePaused: true,
        combatIntermission: null,
        phaseRun: {
          phaseId: '1-1',
          waveIndex: 0,
          waveCount: 3,
          isBossWave: false,
        } as GameStateDto['phaseRun'],
      }),
      { openingChests: false, battlePauseActive: true },
    );

    expect(buttons.pauseBattle.classList.contains('hidden')).toBe(true);
    expect(buttons.resumeBattle.classList.contains('hidden')).toBe(false);
    expect(buttons.heroes.classList.contains('hidden')).toBe(true);
    expect(buttons.formation.classList.contains('hidden')).toBe(true);
  });

  it('mantém Batalhar oculto no hub e após Acampamento', () => {
    const { hud, buttons } = createHud();

    hud.render(
      mockState({
        canEditParty: true,
        loadoutEditOpen: true,
        phaseRestartOnResume: false,
        phaseRun: null,
      }),
      { openingChests: false, loadoutPauseActive: false },
    );
    expect(buttons.continue.classList.contains('hidden')).toBe(true);

    hud.render(
      mockState({
        canEditParty: true,
        loadoutEditOpen: true,
        phaseRestartOnResume: true,
        phaseRun: {
          phaseId: '1-1',
          waveIndex: 0,
          waveCount: 3,
          isBossWave: false,
        } as GameStateDto['phaseRun'],
      }),
      { openingChests: false, loadoutPauseActive: true },
    );
    expect(buttons.continue.classList.contains('hidden')).toBe(true);
    expect(buttons.continue.disabled).toBe(true);
  });

  it('mantém botão Acampamento mid-missão oculto', () => {
    const { hud, buttons } = createHud();

    hud.render(
      mockState({
        canEditParty: false,
        phaseRun: {
          phaseId: '1-1',
          waveIndex: 0,
          waveCount: 3,
          isBossWave: false,
        } as GameStateDto['phaseRun'],
      }),
      { openingChests: false, loadoutPauseActive: false },
    );

    expect(buttons.pause.classList.contains('hidden')).toBe(true);
    expect(buttons.pause.disabled).toBe(true);
  });

  it('exibe menu Stats desde o início', () => {
    const { hud, buttons } = createHud();

    hud.render(mockState({ featureFlags: { ...mockState().featureFlags, battleStats: false } }), {
      openingChests: false,
    });
    expect(buttons.battleStats.classList.contains('hidden')).toBe(false);

    hud.render(mockState({ featureFlags: { ...mockState().featureFlags, battleStats: true } }), {
      openingChests: false,
    });
    expect(buttons.battleStats.classList.contains('hidden')).toBe(false);
  });
});
