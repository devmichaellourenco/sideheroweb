import { describe, expect, it } from 'vitest';
import { GameStateDto } from '../../application/dto/GameStateDto';
import { updateBattleAttemptBaseline } from './BattleAttemptRewardBaseline';

function state(partial: Partial<GameStateDto> = {}): GameStateDto {
  return {
    gold: 10,
    phaseRun: null,
    combatIntermission: null,
    ...partial,
  } as GameStateDto;
}

describe('updateBattleAttemptBaseline', () => {
  it('captura o hub quando a tentativa de combate começa', () => {
    const hub = state({ gold: 40, phaseRun: null });
    const combat = state({
      gold: 40,
      phaseRun: { phaseId: '1-2', displayName: 'Patrulha', waveIndex: 0, waveCount: 2, isBossWave: false },
    });

    const baseline = updateBattleAttemptBaseline(null, hub, combat);
    expect(baseline).toBe(hub);
  });

  it('mantém o snapshot durante a luta e na tela de derrota', () => {
    const hub = state({ gold: 40 });
    const midFight = state({
      gold: 48,
      phaseRun: { phaseId: '1-2', displayName: 'Patrulha', waveIndex: 1, waveCount: 2, isBossWave: false },
    });
    const kept = updateBattleAttemptBaseline(hub, hub, midFight);
    expect(kept).toBe(hub);

    const defeat = state({
      gold: 52,
      phaseRun: null,
      combatIntermission: {
        variant: 'defeat',
        clearedPhaseId: '1-2',
        clearedPhaseName: 'Patrulha',
        nextPhaseId: null,
        nextPhaseName: null,
      },
    });
    expect(updateBattleAttemptBaseline(hub, midFight, defeat)).toBe(hub);
  });

  it('limpa o snapshot ao voltar ao acampamento', () => {
    const hub = state({ gold: 40 });
    const camp = state({ gold: 52, phaseRun: null, combatIntermission: null });
    expect(updateBattleAttemptBaseline(hub, hub, camp)).toBeNull();
  });
});
