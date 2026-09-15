import { describe, expect, it } from 'vitest';
import { mainMissionId } from '../../domain/campaign/missions/MissionId';
import { GameState } from '../../domain/entities/GameState';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { LootService } from '../../domain/services/LootService';
import { ShopService } from '../../domain/services/ShopService';
import { resolveActiveShop } from '../../domain/shop/ConfigurableShopCatalog';
import { UpgradeService } from '../../domain/upgrades/UpgradeService';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { BuyShopOfferUseCase } from './BuyShopOfferUseCase';

class MemoryRepository implements IGameStateRepository {
  constructor(private state: GameState) {}
  async load(): Promise<GameState> { return this.state; }
  async save(state: GameState): Promise<void> { this.state = state; }
  getState(): GameState { return this.state; }
}

function stateWithShop(gold = 10_000): GameState {
  const initial = GameState.initial();
  const missionProgress = initial.campaignProgress.missionProgress.markMainCompleted(
    mainMissionId('1-1'),
  );
  return GameState.restore({
    ...initial.toProps(),
    gold,
    campaignProgress: initial.campaignProgress.withMissionProgress(missionProgress).toProps(),
  });
}

describe('BuyShopOfferUseCase', () => {
  it('persiste a oferta consumida e ela não reaparece ao reabrir', async () => {
    const service = new ShopService(new LootService());
    const initial = stateWithShop();
    const completed = initial.campaignProgress.missionProgress.completedMainIds;
    const shop = resolveActiveShop(completed)!;
    const stock = service.generateConfiguredStock(shop, 1, 0, completed, [], 1);
    const state = initial.withShopStock(shop.id, stock);
    const offer = service.offersFromStock(shop, 1, stock)[0];
    const repository = new MemoryRepository(state);
    const useCase = new BuyShopOfferUseCase(
      repository,
      service,
      new GameStatePresenter(new UpgradeService()),
    );

    await useCase.execute(offer.id);

    const savedStock = repository.getState().shopStock(shop.id)!;
    expect(savedStock.consumedOfferIds).toContain(offer.id);
    expect(savedStock.refreshUses).toBe(1);
    expect(service.offersFromStock(shop, 1, savedStock).map((entry) => entry.id))
      .not.toContain(offer.id);
  });

  it('recusa comprar novamente uma oferta consumida', async () => {
    const service = new ShopService(new LootService());
    const initial = stateWithShop();
    const completed = initial.campaignProgress.missionProgress.completedMainIds;
    const shop = resolveActiveShop(completed)!;
    const stock = service.generateConfiguredStock(shop, 1, 0, completed);
    const offer = service.offersFromStock(shop, 1, stock)[0];
    const repository = new MemoryRepository(initial.withShopStock(shop.id, stock));
    const useCase = new BuyShopOfferUseCase(
      repository,
      service,
      new GameStatePresenter(new UpgradeService()),
    );

    await useCase.execute(offer.id);
    await expect(useCase.execute(offer.id)).rejects.toThrow('Oferta não encontrada');
  });
});
