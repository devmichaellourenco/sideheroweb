import { Gear } from '../../domain/entities/Gear';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { GearStorageService } from '../../domain/services/GearStorageService';
import { ShopService } from '../../domain/services/ShopService';
import { mapGearToDto } from '../mappers/GearDtoMapper';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto, GearDto } from '../dto/GameStateDto';
import { resolveActiveShopState } from '../services/ShopStateResolver';

export interface BuyShopOfferResult {
  state: GameStateDto;
  purchasedGear: GearDto;
}

export class BuyShopOfferUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly shopService: ShopService,
    private readonly presenter: GameStatePresenter,
    private readonly gearStorageService: GearStorageService = new GearStorageService(),
  ) {}

  async execute(offerId: string, shopId?: string): Promise<BuyShopOfferResult> {
    const state = await this.repository.load();
    const active = resolveActiveShopState(state, this.shopService);
    if (shopId && active?.shop.id !== shopId) {
      throw new Error('Loja não está mais ativa');
    }
    const offer = active
      ? this.shopService.findConfiguredOffer(
          active.shop,
          state.currentDifficultyTier(),
          active.stock,
          offerId,
        )
      : null;

    if (!offer) {
      throw new Error('Oferta não encontrada');
    }

    if (!state.gold.canAfford(offer.price)) {
      throw new Error('Ouro insuficiente');
    }

    const purchasedGear = Gear.create({
      ...offer.gear.toProps(),
      id: `gear-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    });
    this.gearStorageService.assertCanAddToInventory(state);
    const nextStock = this.shopService.consumeOffer(active!.stock, offer);
    const nextState = active!.state
      .withGold(state.gold.spend(offer.price))
      .withInventory([...state.inventory, purchasedGear])
      .withShopStock(active!.shop.id, nextStock)
      .addLog(`Comprou ${purchasedGear.name} por ${offer.price} ouro`);

    await this.repository.save(nextState);

    return {
      state: this.presenter.present(nextState),
      purchasedGear: mapGearToDto(purchasedGear),
    };
  }
}
