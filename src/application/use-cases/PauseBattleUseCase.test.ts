import { describe, expect, it } from 'vitest';
import { CombatState } from '../../domain/entities/CombatState';
import { GameState } from '../../domain/entities/GameState';
import { PhaseRun } from '../../domain/campaign/PhaseRun';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { UpgradeService } from '../../domain/upgrades/UpgradeService';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { PauseBattleUseCase } from './PauseBattleUseCase';
import { ResumeBattleUseCase } from './ResumeBattleUseCase';

class MemoryRepository implements IGameStateRepository {
  constructor(private state: GameState) {}

  async load(): Promise<GameState> {
    return this.state;
  }

  async save(state: GameState): Promise<void> {
    this.state = state;
  }
}

describe('PauseBattle / ResumeBattle', () => {
  const presenter = new GameStatePresenter(new UpgradeService());

  it('pausa mantendo combate e retoma do mesmo ponto', async () => {
    const base = GameState.initial();
    const phaseRun = PhaseRun.start('1-1');
    const withRun = base.withPhaseRun(phaseRun);
    const combat = CombatState.start(withRun.activeHeroes(), [], undefined, {
      phaseId: '1-1',
      waveIndex: 0,
      waveCount: 3,
      isBossWave: false,
    });
    const repository = new MemoryRepository(withRun.withCombat(combat));

    const paused = await new PauseBattleUseCase(repository, presenter).execute();
    expect(paused.battlePaused).toBe(true);
    expect(paused.canEditParty).toBe(false);

    const afterPause = await repository.load();
    expect(afterPause.combat).not.toBeNull();
    expect(afterPause.phaseRun?.waveIndex).toBe(0);

    const resumed = await new ResumeBattleUseCase(repository, presenter).execute();
    expect(resumed.battlePaused).toBe(false);

    const afterResume = await repository.load();
    expect(afterResume.combat).not.toBeNull();
    expect(afterResume.phaseRun?.waveIndex).toBe(0);
  });

  it('rejeita pausa sem combate ativo', async () => {
    const repository = new MemoryRepository(GameState.initial());

    await expect(new PauseBattleUseCase(repository, presenter).execute()).rejects.toThrow(
      /batalha ativa/,
    );
  });
});
