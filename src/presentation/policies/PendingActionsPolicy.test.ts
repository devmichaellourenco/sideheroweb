import { describe, expect, it } from 'vitest';
import { GameStateDto } from '../../application/dto/GameStateDto';
import { buildPendingActions } from './PendingActionsPolicy';

function mockState(overrides: Partial<GameStateDto> = {}): GameStateDto {
  return {
    pendingChestCount: 0,
    purchasableUpgradeCount: 0,
    heroes: [],
    inventory: [],
    ...overrides,
  } as GameStateDto;
}

describe('buildPendingActions', () => {
  it('rotula heróis com saldo como Aprimoramento', () => {
    const actions = buildPendingActions(
      mockState({
        heroes: [
          { id: 'h1', name: 'Nix', hasUnspentPoints: true },
          { id: 'h2', name: 'Elara', hasUnspentPoints: false },
        ] as GameStateDto['heroes'],
      }),
    );

    expect(actions).toEqual([{ kind: 'hero-points', label: 'Aprimoramento: Nix' }]);
  });

  it('sugere campanha quando há outra fase unlockada no acampamento', () => {
    const actions = buildPendingActions(
      mockState({
        canEditParty: true,
        phaseRun: null,
        campaignProgress: {
          selectedPhaseId: '1-1',
          unlockedPhaseIds: ['1-1', '1-2'],
          clearedPhaseIds: ['1-1'],
          seasonCompleted: false,
        } as GameStateDto['campaignProgress'],
      }),
    );

    expect(actions.some((action) => action.kind === 'campaign')).toBe(true);
  });

  it('sugere stash quando inventário está cheio e baú tem espaço', () => {
    const actions = buildPendingActions(
      mockState({
        storageCapacity: {
          inventoryUsed: 30,
          inventoryLimit: 30,
          stashUnlocked: true,
          stashUsed: 0,
          stashLimit: 40,
        } as GameStateDto['storageCapacity'],
        featureFlags: { divineForge: false } as GameStateDto['featureFlags'],
      }),
    );

    expect(actions.some((action) => action.kind === 'stash')).toBe(true);
  });

  it('sugere forja quando inventário cheio sem espaço no stash', () => {
    const actions = buildPendingActions(
      mockState({
        storageCapacity: {
          inventoryUsed: 30,
          inventoryLimit: 30,
          stashUnlocked: false,
          stashUsed: 0,
          stashLimit: 0,
        } as GameStateDto['storageCapacity'],
        featureFlags: { divineForge: true } as GameStateDto['featureFlags'],
      }),
    );

    expect(actions.some((action) => action.kind === 'forge')).toBe(true);
  });
});
