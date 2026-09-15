import { Gear, GEAR_RARITIES } from '../entities/Gear';
import { MissionId } from '../campaign/missions/MissionId';
import {
  buildShopOfferId,
  pickUniqueShopCatalogItemId,
  rollShopRarity,
  SHOP_OFFER_COUNT,
  SHOP_SLOT_BY_INDEX,
} from '../shop/ShopCatalog';
import {
  calculateShopItemPrice,
  calculateShopRefreshCost,
  type ShopPriceModifier,
} from '../shop/ShopPricing';
import { getGearCatalogItem } from '../gear/GearItemCatalog';
import type { GearItemDefinition } from '../gear/GearItemDefinition';
import { LootService } from './LootService';
import type { ShopDefinition } from '../shop/ConfigurableShopCatalog';
import { getShopMaxRarityIndex, shopDeterministicRoll } from '../shop/ShopCatalog';
import { normalizeShopStock, type ShopStock } from '../shop/ShopStock';

export interface ShopOffer {
  id: string;
  catalogItemId: string;
  gear: Gear;
  price: number;
}

export interface ShopPriceModifierContext {
  readonly tier: number;
  readonly refreshSeed: number;
  readonly offerIndex: number;
  readonly item: GearItemDefinition;
}

/** Política própria de cada loja para desconto, ágio e outros critérios. */
export interface ShopPricingPolicy {
  modifiersFor(context: ShopPriceModifierContext): readonly ShopPriceModifier[];
}

const NO_SHOP_PRICE_MODIFIERS: ShopPricingPolicy = {
  modifiersFor: () => [],
};

export {
  calculateReferenceShopPrice,
  calculateShopItemPrice,
  calculateShopRefreshCost,
} from '../shop/ShopPricing';

export function parseShopOfferCatalogKey(
  offerId: string,
): { stage: number; seed: number } | null {
  const match = offerId.match(/^shop-(\d+)-(\d+)-/);
  if (!match) return null;

  return {
    stage: Number(match[1]),
    seed: Number(match[2]),
  };
}

export class ShopService {
  constructor(
    private readonly lootService: LootService,
    private readonly pricingPolicy: ShopPricingPolicy = NO_SHOP_PRICE_MODIFIERS,
  ) {}

  generateOffers(
    tier: number,
    refreshSeed = 0,
    completedMainIds: readonly MissionId[] = [],
  ): ShopOffer[] {
    const usedCatalogKeys = new Set<string>();
    const offers: ShopOffer[] = [];

    for (let offerIndex = 0; offerIndex < SHOP_OFFER_COUNT; offerIndex += 1) {
      const slot = SHOP_SLOT_BY_INDEX[offerIndex];
      const rarity = rollShopRarity(tier, refreshSeed, offerIndex, completedMainIds);
      const catalogItemId = pickUniqueShopCatalogItemId(
        slot,
        tier,
        refreshSeed,
        offerIndex,
        rarity,
        usedCatalogKeys,
      );
      usedCatalogKeys.add(`${slot}:${catalogItemId}`);

      const catalogItem = getGearCatalogItem(catalogItemId);
      if (!catalogItem) {
        throw new Error(`Item da loja não encontrado no catálogo: ${catalogItemId}`);
      }
      const gearId = `shop-gear-${tier}-${refreshSeed}-${offerIndex}`;
      const gear = this.lootService.generateGearFromCatalogItem(catalogItemId, gearId);

      offers.push({
        id: buildShopOfferId(tier, refreshSeed, offerIndex),
        catalogItemId,
        gear,
        price: this.calculateItemPrice(catalogItem, {
          tier,
          refreshSeed,
          offerIndex,
        }),
      });
    }

    return offers;
  }

  generateConfiguredStock(
    shop: ShopDefinition,
    tier: number,
    seed: number,
    completedMainIds: readonly MissionId[],
    purchasedLimitedItemIds: readonly string[] = [],
    refreshUses = 0,
  ): ShopStock {
    const maxRarityIndex = getShopMaxRarityIndex(completedMainIds, tier);
    const blocked = new Set(purchasedLimitedItemIds);
    const candidates = shop.catalogItemIds.filter((catalogItemId) => {
      const item = getGearCatalogItem(catalogItemId);
      if (!item) return false;
      const rarityIndex = GEAR_RARITIES.indexOf(item.rarity);
      return rarityIndex <= maxRarityIndex && !blocked.has(catalogItemId);
    });
    const available = [...candidates];
    const catalogItemIds: string[] = [];

    while (available.length > 0 && catalogItemIds.length < SHOP_OFFER_COUNT) {
      const index =
        shopDeterministicRoll(tier, seed, catalogItemIds.length) % available.length;
      catalogItemIds.push(available.splice(index, 1)[0]);
    }

    return normalizeShopStock({
      seed,
      catalogItemIds,
      consumedOfferIds: [],
      purchasedLimitedItemIds,
      refreshUses,
    });
  }

  offersFromStock(shop: ShopDefinition, _tier: number, stock: ShopStock): ShopOffer[] {
    const consumed = new Set(stock.consumedOfferIds);
    return stock.catalogItemIds.flatMap((catalogItemId, offerIndex) => {
      const id = this.buildConfiguredOfferId(shop.id, stock.seed, offerIndex);
      if (consumed.has(id)) return [];
      const item = getGearCatalogItem(catalogItemId);
      if (!item) return [];
      return [{
        id,
        catalogItemId,
        gear: this.lootService.generateGearFromCatalogItem(
          catalogItemId,
          `shop-gear-${shop.id}-${stock.seed}-${offerIndex}`,
        ),
        price: calculateShopItemPrice(item.basePrice, [{
          multiplier: shop.priceMultiplier,
          flatAdjustment: shop.flatPriceAdjustment,
        }]),
      }];
    });
  }

  findConfiguredOffer(
    shop: ShopDefinition,
    tier: number,
    stock: ShopStock,
    offerId: string,
  ): ShopOffer | null {
    return this.offersFromStock(shop, tier, stock).find((offer) => offer.id === offerId) ?? null;
  }

  consumeOffer(stock: ShopStock, offer: ShopOffer): ShopStock {
    const rarityIndex = GEAR_RARITIES.indexOf(offer.gear.rarity);
    const limited =
      rarityIndex >= GEAR_RARITIES.indexOf('epic') &&
      !stock.purchasedLimitedItemIds.includes(offer.catalogItemId)
        ? [...stock.purchasedLimitedItemIds, offer.catalogItemId]
        : [...stock.purchasedLimitedItemIds];
    return normalizeShopStock({
      seed: stock.seed,
      catalogItemIds: stock.catalogItemIds,
      consumedOfferIds: stock.consumedOfferIds.includes(offer.id)
        ? [...stock.consumedOfferIds]
        : [...stock.consumedOfferIds, offer.id],
      purchasedLimitedItemIds: limited,
      refreshUses: stock.refreshUses,
    });
  }

  buildConfiguredOfferId(shopId: string, seed: number, offerIndex: number): string {
    return `shop:${shopId}:${seed}:o${offerIndex}`;
  }

  findOffer(
    tier: number,
    refreshSeed: number,
    offerId: string,
    completedMainIds: readonly MissionId[] = [],
  ): ShopOffer | null {
    const catalog = parseShopOfferCatalogKey(offerId);
    const resolvedTier = catalog?.stage ?? tier;
    const resolvedSeed = catalog?.seed ?? refreshSeed;

    return (
      this.generateOffers(resolvedTier, resolvedSeed, completedMainIds).find(
        (offer) => offer.id === offerId,
      ) ?? null
    );
  }

  calculateRefreshCost(tier: number): number {
    return calculateShopRefreshCost(tier);
  }

  calculateItemPrice(
    item: GearItemDefinition,
    context: Omit<ShopPriceModifierContext, 'item'>,
  ): number {
    return calculateShopItemPrice(
      item.basePrice,
      this.pricingPolicy.modifiersFor({ ...context, item }),
    );
  }
}
