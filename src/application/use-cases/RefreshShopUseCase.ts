import { FeatureAccessPolicy } from '../../domain/policies/FeatureAccessPolicy';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import {
  calculateShopRefreshCost,
  canRefreshShop,
  shopRefreshRemaining,
} from '../../domain/upgrades/ShopRefreshRules';
import { ShopService } from '../../domain/services/ShopService';
import { ShopDto, ShopOfferDto } from '../dto/ShopOfferDto';
import { mapGearToDto } from '../mappers/GearDtoMapper';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto } from '../dto/GameStateDto';
import { resolveActiveShopState } from '../services/ShopStateResolver';

export interface RefreshShopResult {
  state: GameStateDto;
  offers: ShopOfferDto[];
  refreshCost: number;
  canAffordRefresh: boolean;
  shopRefreshRemaining: number;
  shop: ShopDto;
}

export class RefreshShopUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly shopService: ShopService,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(shopId?: string): Promise<RefreshShopResult> {
    const loadedState = await this.repository.load();
    const active = resolveActiveShopState(loadedState, this.shopService);
    if (!active) {
      throw new Error('Nenhuma loja desbloqueada');
    }
    if (shopId && active.shop.id !== shopId) {
      throw new Error('Loja não está mais ativa');
    }
    const state = active.state;

    if (!FeatureAccessPolicy.resolve(state.upgradeLevels).shopRefresh) {
      throw new Error('Renovar loja não desbloqueado');
    }

    const tier = state.currentDifficultyTier();
    if (shopRefreshRemaining(state.upgradeLevels, active.stock.refreshUses) <= 0) {
      throw new Error('Limite de renovações desta loja atingido');
    }

    const refreshCost = calculateShopRefreshCost(tier, state.upgradeLevels);

    if (!state.gold.canAfford(refreshCost)) {
      throw new Error('Ouro insuficiente para renovar a loja');
    }

    const nextStock = this.shopService.generateConfiguredStock(
      active.shop,
      tier,
      active.stock.seed + 1,
      state.campaignProgress.missionProgress.completedMainIds,
      active.stock.purchasedLimitedItemIds,
      active.stock.refreshUses + 1,
    );
    const nextState = state
      .withGold(state.gold.spend(refreshCost))
      .withShopStock(active.shop.id, nextStock)
      .addLog(`Renovou a loja por ${refreshCost} ouro`);

    await this.repository.save(nextState);

    const nextTier = nextState.currentDifficultyTier();
    const offers = this.shopService
      .offersFromStock(active.shop, nextTier, nextStock)
      .map((offer) => ({
        id: offer.id,
        price: offer.price,
        gear: mapGearToDto(offer.gear),
        canAfford: nextState.gold.canAfford(offer.price),
      }));

    return {
      state: this.presenter.present(nextState),
      offers,
      refreshCost: calculateShopRefreshCost(nextTier, nextState.upgradeLevels),
      canAffordRefresh: canRefreshShop({
        upgradeLevels: nextState.upgradeLevels,
        refreshUses: nextStock.refreshUses,
        tier: nextTier,
        gold: nextState.gold,
      }),
      shopRefreshRemaining: shopRefreshRemaining(
        nextState.upgradeLevels,
        nextStock.refreshUses,
      ),
      shop: {
        id: active.shop.id,
        name: active.shop.name,
        stockSeed: nextStock.seed,
        difficultyTier: nextTier,
      },
    };
  }
}
