import { describe, expect, it } from 'vitest';
import { mainMissionId } from '../../domain/campaign/missions/MissionId';
import { GameState, GameStateProps } from '../../domain/entities/GameState';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { LootService } from '../../domain/services/LootService';
import { ShopService } from '../../domain/services/ShopService';
import { resolveActiveShop } from '../../domain/shop/ConfigurableShopCatalog';
import { UpgradeService } from '../../domain/upgrades/UpgradeService';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GetShopOffersUseCase } from './GetShopOffersUseCase';

class MemoryRepository implements IGameStateRepository {
  constructor(private state: GameState) {}
  async load(): Promise<GameState> { return this.state; }
  async save(state: GameState): Promise<void> { this.state = state; }
  getState(): GameState { return this.state; }
}

const shopService = new ShopService(new LootService());

function propsWithUnlockedShop(overrides: Partial<GameStateProps> = {}): GameStateProps {
  const initial = GameState.initial();
  const missionProgress = initial.campaignProgress.missionProgress.markMainCompleted(
    mainMissionId('1-1'),
  );
  return {
    ...initial.toProps(),
    gold: 10_000,
    upgradeLevels: { shop_refresh: 1 },
    campaignProgress: initial.campaignProgress.withMissionProgress(missionProgress).toProps(),
    ...overrides,
  };
}

function buildUseCase(state: GameState): GetShopOffersUseCase {
  return new GetShopOffersUseCase(
    new MemoryRepository(state),
    shopService,
    new GameStatePresenter(new UpgradeService()),
  );
}

describe('GetShopOffersUseCase', () => {
  it('loja recém-desbloqueada começa com a cota cheia, ignorando o contador global legado', async () => {
    const state = GameState.restore(propsWithUnlockedShop({ shopRefreshUses: 5 }));

    const result = await buildUseCase(state).execute();

    expect(result.shopRefreshRemaining).toBe(2);
    expect(result.canAffordRefresh).toBe(true);
    expect(result.state.shopRefreshUses).toBe(0);
  });

  it('estoque antigo sem refreshUses herda o contador global ao migrar o save', async () => {
    const base = GameState.restore(propsWithUnlockedShop());
    const shop = resolveActiveShop(base.campaignProgress.missionProgress.completedMainIds)!;
    const legacyStock = {
      seed: 3,
      catalogItemIds: [...shop.catalogItemIds.slice(0, 4)],
      consumedOfferIds: [],
      purchasedLimitedItemIds: [],
    };
    const state = GameState.restore(
      propsWithUnlockedShop({
        shopRefreshUses: 1,
        shopStocks: { [shop.id]: legacyStock },
      }),
    );

    const result = await buildUseCase(state).execute();

    expect(state.shopStock(shop.id)!.refreshUses).toBe(1);
    expect(result.shopRefreshRemaining).toBe(1);
    expect(result.state.shopRefreshUses).toBe(1);
    expect(result.shop?.stockSeed).toBe(3);
  });
});
