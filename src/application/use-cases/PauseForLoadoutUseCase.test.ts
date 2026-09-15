import { describe, expect, it } from 'vitest';
import { CampaignProgress } from '../../domain/campaign/CampaignProgress';
import { PhaseRun } from '../../domain/campaign/PhaseRun';
import { CombatState } from '../../domain/entities/CombatState';
import { GameState } from '../../domain/entities/GameState';
import { ActionTimerService } from '../../domain/services/combat/ActionTimerService';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { UpgradeService } from '../../domain/upgrades/UpgradeService';
import { PauseForLoadoutUseCase } from './PauseForLoadoutUseCase';

class MemoryRepository implements IGameStateRepository {
  constructor(private state: GameState) {}

  async load(): Promise<GameState> {
    return this.state;
  }

  async save(state: GameState): Promise<void> {
    this.state = state;
  }
}

describe('PauseForLoadoutUseCase', () => {
  const presenter = new GameStatePresenter(new UpgradeService());

  it('abre edição no acampamento e encerra a tentativa atual', async () => {
    const repository = new MemoryRepository(GameState.initial());
    const base = GameState.initial();
    const phaseRun = PhaseRun.start('1-1');
    const combat = CombatState.start(base.activeHeroes(), [], new ActionTimerService(), null);
    await repository.save(base.withPhaseRun(phaseRun).withCombat(combat));

    const useCase = new PauseForLoadoutUseCase(repository, presenter);
    const dto = await useCase.execute();

    expect(dto.loadoutEditOpen).toBe(true);
    expect(dto.phaseRestartOnResume).toBe(false);
    expect(dto.phaseRun).toBeNull();
    expect(dto.canEditParty).toBe(true);
    expect(dto.combatRound).toBe(1);
    expect(dto.enemies).toHaveLength(0);
  });

  it('rejeita pausa sem fase em andamento', async () => {
    const repository = new MemoryRepository(GameState.initial());
    const useCase = new PauseForLoadoutUseCase(repository, presenter);
    await expect(useCase.execute()).rejects.toThrow('Não há missão ativa para voltar ao acampamento');
  });

  it('permite pausa em replay após temporada concluída', async () => {
    const progress = CampaignProgress.restore({
      unlockedPhaseIds: ['4-1', '4-50'],
      clearedPhaseIds: ['4-50'],
      selectedPhaseId: '4-25',
      highestTierReached: 200,
      seasonCompleted: true,
    });
    const base = GameState.initial().withCampaignProgress(progress);
    const phaseRun = PhaseRun.start('4-25');
    const combat = CombatState.start(base.activeHeroes(), [], new ActionTimerService(), null);
    const repository = new MemoryRepository(base.withPhaseRun(phaseRun).withCombat(combat));

    const useCase = new PauseForLoadoutUseCase(repository, presenter);
    const dto = await useCase.execute();

    expect(dto.loadoutEditOpen).toBe(true);
    expect(dto.seasonCompleted).toBe(true);
  });
});
