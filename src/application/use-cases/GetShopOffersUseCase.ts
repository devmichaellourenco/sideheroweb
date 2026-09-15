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

export interface GetShopOffersResult {
  state: GameStateDto;
  offers: ShopOfferDto[];
  refreshCost: number;
  canAffordRefresh: boolean;
  shopRefreshUnlocked: boolean;
  shopRefreshRemaining: number;
  shop: ShopDto | null;
}

export class GetShopOffersUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly shopService: ShopService,
    private readonly presenter: GameStatePresenter,
  ) {}

  async execute(): Promise<GetShopOffersResult> {
    const loadedState = await this.repository.load();
    const active = resolveActiveShopState(loadedState, this.shopService);
    const state = active?.state ?? loadedState;
    if (state !== loadedState) await this.repository.save(state);
    const tier = state.currentDifficultyTier();
    const offers = (active
      ? this.shopService.offersFromStock(active.shop, tier, active.stock)
      : [])
      .map((offer) => ({
        id: offer.id,
        price: offer.price,
        gear: mapGearToDto(offer.gear),
        canAfford: state.gold.canAfford(offer.price),
      }));

    const refreshCost = calculateShopRefreshCost(tier, state.upgradeLevels);
    const refreshUses = active?.stock.refreshUses ?? 0;
    const shopRefreshUnlocked = FeatureAccessPolicy.resolve(state.upgradeLevels).shopRefresh;

    return {
      state: this.presenter.present(state),
      offers,
      refreshCost,
      canAffordRefresh:
        active !== null &&
        canRefreshShop({
          upgradeLevels: state.upgradeLevels,
          refreshUses,
          tier,
          gold: state.gold,
        }),
      shopRefreshUnlocked,
      shopRefreshRemaining: shopRefreshRemaining(state.upgradeLevels, refreshUses),
      shop: active
        ? {
            id: active.shop.id,
            name: active.shop.name,
            stockSeed: active.stock.seed,
            difficultyTier: tier,
          }
        : null,
    };
  }
}
