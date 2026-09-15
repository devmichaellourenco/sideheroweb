import { describe, expect, it } from 'vitest';
import { GameStateDto } from '../../application/dto/GameStateDto';
import {
  isOnboardingComplete,
  isOnboardingStepTriggered,
  ONBOARDING_STEP_ORDER,
  OnboardingUiContext,
  resolveOnboardingStep,
} from './OnboardingPolicy';

function mockState(overrides: Partial<GameStateDto> = {}): GameStateDto {
  return {
    pendingChestCount: 0,
    canEditParty: false,
    phaseRun: { phaseId: '1-1' },
    heroes: [{ id: 'h1', hasUnspentPoints: false } as GameStateDto['heroes'][number]],
    purchasableUpgradeCount: 0,
    ...overrides,
  } as GameStateDto;
}

function mockCampaignProgress(
  overrides: Partial<GameStateDto['campaignProgress']> = {},
): GameStateDto['campaignProgress'] {
  return {
    selectedPhaseId: '1-1',
    unlockedPhaseIds: ['1-1'],
    clearedPhaseIds: [],
    highestTierReached: 1,
    seasonCompleted: false,
    viewedActSceneIds: ['stendra-act-1'],
    ...overrides,
  };
}

/** Estado do primeiro acesso: cena de abertura vista, nenhuma fase concluída. */
function mockFirstRunState(overrides: Partial<GameStateDto> = {}): GameStateDto {
  return mockState({
    canEditParty: true,
    phaseRun: null,
    campaignProgress: mockCampaignProgress(),
    ...overrides,
  });
}

function mapUi(overrides: Partial<OnboardingUiContext> = {}): OnboardingUiContext {
  return { campaignMapOpen: true, missionPreviewOpen: false, ...overrides };
}

describe('OnboardingPolicy — boas-vindas e tutorial do mapa', () => {
  it('mostra boas-vindas no acampamento depois da cena de abertura', () => {
    const step = resolveOnboardingStep(mockFirstRunState(), new Set());
    expect(step?.id).toBe('welcome');
    expect(step?.variant).toBe('welcome');
    expect(step?.anchorSelector).toBe('');
    expect(step?.confirmLabel).toContain('mapa');
  });

  it('não mostra boas-vindas antes de a cena de abertura ser vista', () => {
    const state = mockFirstRunState({
      campaignProgress: mockCampaignProgress({ viewedActSceneIds: [] }),
    });
    expect(isOnboardingStepTriggered('welcome', state)).toBe(false);
  });

  it('aponta os pinos ao abrir o mapa sem local selecionado', () => {
    const step = resolveOnboardingStep(
      mockFirstRunState(),
      new Set(['welcome'] as const),
      mapUi(),
    );
    expect(step?.id).toBe('map-locations');
    expect(step?.anchorSelector).toBe('.campaign-mission-pin--main');
  });

  it('explica o preview e depois o início da missão com o local selecionado', () => {
    const state = mockFirstRunState();
    const ui = mapUi({ missionPreviewOpen: true });

    const preview = resolveOnboardingStep(state, new Set(['welcome', 'map-locations'] as const), ui);
    expect(preview?.id).toBe('map-mission-preview');
    expect(preview?.anchorSelector).toBe('.campaign-mission-popover');

    const start = resolveOnboardingStep(
      state,
      new Set(['welcome', 'map-locations', 'map-mission-preview'] as const),
      ui,
    );
    expect(start?.id).toBe('map-start-mission');
    expect(start?.anchorSelector).toBe('.campaign-phase-preview-start');
  });

  it('não guia o mapa quando ele está fechado', () => {
    expect(isOnboardingStepTriggered('map-locations', mockFirstRunState())).toBe(false);
    expect(isOnboardingStepTriggered('map-mission-preview', mockFirstRunState())).toBe(false);
  });

  it('encerra o tutorial do mapa após a primeira fase concluída', () => {
    const state = mockFirstRunState({
      campaignProgress: mockCampaignProgress({ clearedPhaseIds: ['1-1'] }),
    });

    expect(isOnboardingStepTriggered('welcome', state)).toBe(false);
    expect(isOnboardingStepTriggered('map-locations', state, mapUi())).toBe(false);
  });
});

describe('OnboardingPolicy', () => {
  it('prioriza primeiro baú quando há baús pendentes', () => {
    const step = resolveOnboardingStep(mockState({ pendingChestCount: 1 }), new Set());
    expect(step?.id).toBe('first-chest');
  });

  it('após baú segue para Aprimoramento quando há pontos (sem dica do botão Acampamento)', () => {
    const dismissed = new Set(['first-chest'] as const);
    const step = resolveOnboardingStep(
      mockState({
        canEditParty: true,
        phaseRun: null,
        pendingChestCount: 0,
        heroes: [{ id: 'h1', hasUnspentPoints: true } as GameStateDto['heroes'][number]],
      }),
      dismissed,
    );
    expect(step?.id).toBe('hero-points');
    expect(isOnboardingStepTriggered('pause-loadout', mockState({ phaseRun: { phaseId: '1-1' } }))).toBe(
      false,
    );
  });

  it('detecta Aprimoramento pendente no acampamento', () => {
    const dismissed = new Set(['first-chest', 'pause-loadout'] as const);
    const step = resolveOnboardingStep(
      mockState({
        canEditParty: true,
        phaseRun: null,
        heroes: [{ id: 'h1', hasUnspentPoints: true } as GameStateDto['heroes'][number]],
      }),
      dismissed,
    );
    expect(step?.id).toBe('hero-points');
  });

  it('não aponta Heróis fora do acampamento', () => {
    const dismissed = new Set(['first-chest', 'pause-loadout'] as const);
    const step = resolveOnboardingStep(
      mockState({
        canEditParty: false,
        heroes: [{ id: 'h1', hasUnspentPoints: true } as GameStateDto['heroes'][number]],
      }),
      dismissed,
    );
    expect(step?.id).not.toBe('hero-points');
  });

  it('detecta melhoria disponível no acampamento', () => {
    const dismissed = new Set(['first-chest', 'pause-loadout', 'hero-points'] as const);
    const step = resolveOnboardingStep(
      mockState({
        canEditParty: true,
        phaseRun: null,
        purchasableUpgradeCount: 1,
      }),
      dismissed,
    );
    expect(step?.id).toBe('first-upgrade');
    expect(step?.message).toContain('ui/rune.png');
    expect(step?.message).not.toContain('★');
    expect(step?.message).not.toContain('estrela');
  });

  it('não aponta runas no meio do combate mesmo com ouro suficiente', () => {
    const dismissed = new Set(['first-chest', 'pause-loadout', 'hero-points'] as const);
    const step = resolveOnboardingStep(
      mockState({
        canEditParty: false,
        phaseRun: { phaseId: '1-1' },
        purchasableUpgradeCount: 1,
      }),
      dismissed,
    );
    expect(step?.id).not.toBe('first-upgrade');
    expect(isOnboardingStepTriggered('first-upgrade', mockState({
      canEditParty: false,
      purchasableUpgradeCount: 1,
    }))).toBe(false);
  });

  it('sugere mapa da campanha após clear', () => {
    const dismissed = new Set([
      'first-chest',
      'pause-loadout',
      'hero-points',
      'first-upgrade',
    ] as const);
    const step = resolveOnboardingStep(
      mockState({
        campaignProgress: { clearedPhaseIds: ['1-1'] } as GameStateDto['campaignProgress'],
      }),
      dismissed,
    );
    expect(step?.id).toBe('open-campaign');
  });

  it('marca onboarding completo quando todos os passos foram dispensados', () => {
    expect(isOnboardingComplete(new Set(ONBOARDING_STEP_ORDER))).toBe(true);
  });

  it('aciona gatilhos individuais', () => {
    expect(isOnboardingStepTriggered('first-chest', mockState({ pendingChestCount: 2 }))).toBe(true);
    expect(isOnboardingStepTriggered('hero-points', mockState({
      canEditParty: true,
      heroes: [{ hasUnspentPoints: true } as GameStateDto['heroes'][number]],
    }))).toBe(true);
    expect(isOnboardingStepTriggered('hero-points', mockState({
      canEditParty: false,
      heroes: [{ hasUnspentPoints: true } as GameStateDto['heroes'][number]],
    }))).toBe(false);
  });
});
