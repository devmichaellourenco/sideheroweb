import { describe, expect, it } from 'vitest';
import { CampaignProgress } from '../../domain/campaign/CampaignProgress';
import { GameState } from '../../domain/entities/GameState';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { UpgradeService } from '../../domain/upgrades/UpgradeService';
import { SelectPhaseUseCase } from './SelectPhaseUseCase';

class MemoryRepository implements IGameStateRepository {
  constructor(private state: GameState) {}

  async load(): Promise<GameState> {
    return this.state;
  }

  async save(state: GameState): Promise<void> {
    this.state = state;
  }
}

describe('SelectPhaseUseCase', () => {
  const presenter = new GameStatePresenter(new UpgradeService());

  it('seleciona fase liberada no escopo base', async () => {
    const repository = new MemoryRepository(GameState.initial());
    const useCase = new SelectPhaseUseCase(repository, presenter);
    const dto = await useCase.execute('1-1');

    expect(dto.campaignProgress.selectedPhaseId).toBe('1-1');
  });

  it('rejeita fase DLC fora do escopo base', async () => {
    const progress = CampaignProgress.restore({
      unlockedPhaseIds: ['1-1', '5-1'],
      clearedPhaseIds: [],
      selectedPhaseId: '1-1',
      highestTierReached: 1,
      seasonCompleted: false,
    });
    const repository = new MemoryRepository(GameState.initial().withCampaignProgress(progress));
    const useCase = new SelectPhaseUseCase(repository, presenter);

    await expect(useCase.execute('5-1')).rejects.toThrow('Fase indisponível nesta versão do jogo');
  });
});
