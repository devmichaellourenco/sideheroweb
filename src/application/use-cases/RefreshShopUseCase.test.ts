import { describe, expect, it } from 'vitest';
import { mainMissionId } from '../../domain/campaign/missions/MissionId';
import { GameState } from '../../domain/entities/GameState';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { LootService } from '../../domain/services/LootService';
import { ShopService } from '../../domain/services/ShopService';
import { resolveActiveShop } from '../../domain/shop/ConfigurableShopCatalog';
import { UpgradeService } from '../../domain/upgrades/UpgradeService';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { RefreshShopUseCase } from './RefreshShopUseCase';

class MemoryRepository implements IGameStateRepository {
  constructor(private state: GameState) {}
  async load(): Promise<GameState> { return this.state; }
  async save(state: GameState): Promise<void> { this.state = state; }
  getState(): GameState { return this.state; }
}

function unlockedShopState(gold = 10_000, shopRefreshLevel = 1): GameState {
  const initial = GameState.initial();
  const missionProgress = initial.campaignProgress.missionProgress.markMainCompleted(
    mainMissionId('1-1'),
  );
  return GameState.restore({
    ...initial.toProps(),
    gold,
    upgradeLevels: { shop_refresh: shopRefreshLevel },
    campaignProgress: initial.campaignProgress.withMissionProgress(missionProgress).toProps(),
  });
}

function buildUseCase(state: GameState): {
  useCase: RefreshShopUseCase;
  repository: MemoryRepository;
  shopId: string;
} {
  const repository = new MemoryRepository(state);
  const shop = resolveActiveShop(state.campaignProgress.missionProgress.completedMainIds)!;
  return {
    useCase: new RefreshShopUseCase(
      repository,
      new ShopService(new LootService()),
      new GameStatePresenter(new UpgradeService()),
    ),
    repository,
    shopId: shop.id,
  };
}

describe('RefreshShopUseCase', () => {
  it('consome a cota no estoque da própria loja, não em um contador global', async () => {
    const { useCase, repository, shopId } = buildUseCase(unlockedShopState());

    const first = await useCase.execute(shopId);

    expect(first.shopRefreshRemaining).toBe(1);
    expect(repository.getState().shopStock(shopId)!.refreshUses).toBe(1);
    expect(repository.getState().shopStock(shopId)!.seed).toBe(1);

    const second = await useCase.execute(shopId);

    expect(second.shopRefreshRemaining).toBe(0);
    expect(second.canAffordRefresh).toBe(false);
    expect(repository.getState().shopStock(shopId)!.refreshUses).toBe(2);
  });

  it('rejeita renovar após esgotar a cota da loja mesmo com ouro sobrando', async () => {
    const { useCase, shopId } = buildUseCase(unlockedShopState());

    await useCase.execute(shopId);
    await useCase.execute(shopId);

    await expect(useCase.execute(shopId)).rejects.toThrow(
      'Limite de renovações desta loja atingido',
    );
  });

  it('mantém as compras limitadas ao renovar e desconta o ouro do custo do tier', async () => {
    const state = unlockedShopState(1_000);
    const { useCase, repository, shopId } = buildUseCase(state);

    const result = await useCase.execute(shopId);

    expect(repository.getState().gold.value()).toBe(1_000 - result.refreshCost);
    expect(result.shop.stockSeed).toBe(1);
    expect(result.shop.difficultyTier).toBe(state.currentDifficultyTier());
  });
});
