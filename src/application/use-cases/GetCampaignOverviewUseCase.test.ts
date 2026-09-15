import { describe, expect, it } from 'vitest';
import { GameState } from '../../domain/entities/GameState';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { UpgradeService } from '../../domain/upgrades/UpgradeService';
import { GetCampaignOverviewUseCase } from './GetCampaignOverviewUseCase';

class MemoryRepository implements IGameStateRepository {
  constructor(private state: GameState) {}

  async load(): Promise<GameState> {
    return this.state;
  }

  async save(state: GameState): Promise<void> {
    this.state = state;
  }
}

describe('GetCampaignOverviewUseCase', () => {
  const presenter = new GameStatePresenter(new UpgradeService());

  it('expõe apenas as quatro regiões do jogo base', async () => {
    const repository = new MemoryRepository(GameState.initial());
    const useCase = new GetCampaignOverviewUseCase(repository, presenter);
    const result = await useCase.execute();

    expect(result.campaign.maps).toHaveLength(4);
    expect(result.campaign.maps[0]?.actScenes).toHaveLength(5);
    expect(result.campaign.maps.map((map) => map.id)).toEqual([
      'stendra',
      'gruftall',
      'valdris',
      'morthaven',
    ]);
    expect(result.campaign.maps[0]?.missionBoard?.main?.id).toBe('main:1-1');
    expect(result.campaign.maps[0]?.missionBoard?.normals.length).toBeGreaterThanOrEqual(2);
  });
});
