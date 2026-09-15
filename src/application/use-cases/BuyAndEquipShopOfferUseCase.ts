import { Gear } from '../../domain/entities/Gear';
import { IGameStateRepository } from '../../domain/repositories/IGameStateRepository';
import { equipHeroWithGear } from '../../domain/services/GearEquipService';
import { GearStorageService } from '../../domain/services/GearStorageService';
import { ShopService } from '../../domain/services/ShopService';
import { mapGearToDto } from '../mappers/GearDtoMapper';
import { assertLoadoutEditable } from '../policies/assertLoadoutEditable';
import { GameStatePresenter } from '../presenters/GameStatePresenter';
import { GameStateDto, GearDto } from '../dto/GameStateDto';
import { resolveActiveShopState } from '../services/ShopStateResolver';

export interface BuyAndEquipShopOfferResult {
  state: GameStateDto;
  purchasedGear: GearDto;
}

const NO_SPACE_MESSAGE =
  'Sem espaço no inventário nem no baú para guardar o item equipado.';

export class BuyAndEquipShopOfferUseCase {
  constructor(
    private readonly repository: IGameStateRepository,
    private readonly shopService: ShopService,
    private readonly presenter: GameStatePresenter,
    private readonly gearStorageService: GearStorageService = new GearStorageService(),
  ) {}

  async execute(
    offerId: string,
    heroId: string,
    shopId?: string,
  ): Promise<BuyAndEquipShopOfferResult> {
    const state = await this.repository.load();
    assertLoadoutEditable(state);

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

    const targetHero = state.heroes.find((hero) => hero.id === heroId);
    if (!targetHero) {
      throw new Error('Herói não encontrado');
    }

    const equippedInSlot = targetHero.toProps().equipment?.[offer.gear.slot] ?? null;
    if (equippedInSlot) {
      const destination = this.gearStorageService.resolveLootDestination(
        state.upgradeLevels,
        state.inventory.length,
        state.stash.length,
      );
      if (!destination) {
        throw new Error(NO_SPACE_MESSAGE);
      }
    }

    const purchasedGear = Gear.create({
      ...offer.gear.toProps(),
      id: `gear-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    });

    const { hero: updatedHero, replaced } = equipHeroWithGear(targetHero, purchasedGear);
    const heroes = state.heroes.map((hero) => (hero.id === heroId ? updatedHero : hero));

    let inventory = state.inventory;
    let stash = state.stash;
    let storageLog = '';

    if (replaced) {
      const destination = this.gearStorageService.resolveLootDestination(
        state.upgradeLevels,
        inventory.length,
        stash.length,
      );
      if (!destination) {
        throw new Error(NO_SPACE_MESSAGE);
      }
      if (destination === 'inventory') {
        inventory = [...inventory, replaced];
        storageLog = ` · ${replaced.name} foi para o inventário`;
      } else {
        stash = [...stash, replaced];
        storageLog = ` · ${replaced.name} foi para o baú`;
      }
    }

    const nextStock = this.shopService.consumeOffer(active!.stock, offer);
    const nextState = active!.state
      .withGold(state.gold.spend(offer.price))
      .withHeroes(heroes)
      .withInventory(inventory)
      .withStash(stash)
      .withShopStock(active!.shop.id, nextStock)
      .addLog(
        `Comprou e equipou ${purchasedGear.name} por ${offer.price} ouro${storageLog}`,
      );

    await this.repository.save(nextState);

    return {
      state: this.presenter.present(nextState),
      purchasedGear: mapGearToDto(purchasedGear),
    };
  }
}
