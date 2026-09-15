import { describe, expect, it } from 'vitest';
import { PhaseRun } from '../../domain/campaign/PhaseRun';
import { GameState } from '../../domain/entities/GameState';
import { CombatPipeline } from '../../domain/services/combat/CombatPipeline';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { UpgradeService } from '../../domain/upgrades/UpgradeService';
import { MetaService } from '../../domain/meta/MetaService';
import { AchievementService } from '../../domain/achievements/AchievementService';
import { MemoryMetaRepository } from '../testing/MemoryMetaRepository';
import { MemoryAchievementRepository } from '../testing/MemoryAchievementRepository';
import { TickGameUseCase } from './TickGameUseCase';

class MemoryRepository implements IGameStateRepository {
  constructor(private state: GameState) {}

  async load(): Promise<GameState> {
    return this.state;
  }

  async save(state: GameState): Promise<void> {
    this.state = state;
  }
}

describe('TickGameUseCase — retomada de pausa', () => {
  const presenter = new GameStatePresenter(new UpgradeService());
  const metaService = new MetaService();

  it('reinicia a fase atual ao continuar pausa manual', async () => {
    const phaseRun = PhaseRun.start('1-1').advanceWave();
    const repository = new MemoryRepository(
      GameState.initial()
        .withPhaseRun(phaseRun)
        .withCombat(null)
        .withLoadoutEditOpen(true)
        .withPhaseRestartOnResume(true),
    );

    const tick = new TickGameUseCase(
      repository,
      new MemoryMetaRepository(),
      metaService,
      new CombatPipeline(),
      presenter,
      new MemoryAchievementRepository(),
      new AchievementService(),
    );
    const result = await tick.execute(1, { restartCurrentPhase: true });

    expect(result.state.loadoutEditOpen).toBe(false);
    expect(result.state.phaseRestartOnResume).toBe(false);
    expect(result.state.phaseRun?.waveIndex).toBe(0);
    expect(result.state.enemies.length).toBeGreaterThan(0);
  });

  it('inicia fase selecionada ao continuar pausa após trocar fase na campanha', async () => {
    const repository = new MemoryRepository(
      GameState.initial()
        .withPhaseRun(null)
        .withCombat(null)
        .withLoadoutEditOpen(true)
        .withPhaseRestartOnResume(true),
    );

    const tick = new TickGameUseCase(
      repository,
      new MemoryMetaRepository(),
      metaService,
      new CombatPipeline(),
      presenter,
      new MemoryAchievementRepository(),
      new AchievementService(),
    );
    const result = await tick.execute(1, { restartCurrentPhase: true });

    expect(result.state.loadoutEditOpen).toBe(false);
    expect(result.state.phaseRestartOnResume).toBe(false);
    expect(result.state.phaseRun?.phaseId).toBe('1-1');
    expect(result.state.phaseRun?.waveIndex).toBe(0);
    expect(result.state.enemies.length).toBeGreaterThan(0);
  });
});
