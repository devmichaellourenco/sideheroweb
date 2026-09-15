import { describe, expect, it } from 'vitest';
import { GEAR_RARITIES } from '../entities/Gear';
import { mainMissionId } from '../campaign/missions/MissionId';
import { LootService } from './LootService';
import {
  getShopMaxRarityForProgress,
  getShopMaxRarityIndex,
  rollShopRarity,
  SHOP_OFFER_COUNT,
} from '../shop/ShopCatalog';
import { parseShopOfferCatalogKey, ShopService } from './ShopService';
import { getGearCatalogItem } from '../gear/GearItemCatalog';
import { resolveActiveShop } from '../shop/ConfigurableShopCatalog';

describe('ShopService', () => {
  const shopService = new ShopService(new LootService());

  it('extrai tier e seed do id da oferta', () => {
    expect(parseShopOfferCatalogKey('shop-8-2-o3')).toEqual({ stage: 8, seed: 2 });
    expect(parseShopOfferCatalogKey('shop-8-2-galneon-sword-rare')).toEqual({
      stage: 8,
      seed: 2,
    });
    expect(parseShopOfferCatalogKey('invalid')).toBeNull();
  });

  it('localiza oferta pelo catálogo embutido no id, mesmo com tier atual diferente', () => {
    const offers = shopService.generateOffers(5, 0);
    const offerId = offers[0].id;

    expect(shopService.findOffer(9, 0, offerId)?.id).toBe(offerId);
    expect(shopService.findOffer(9, 0, 'shop-5-0-o99')).toBeNull();
  });

  it('gera oito ofertas variadas por estoque', () => {
    const offers = shopService.generateOffers(12, 0);

    expect(offers).toHaveLength(SHOP_OFFER_COUNT);
    expect(new Set(offers.map((offer) => offer.id)).size).toBe(SHOP_OFFER_COUNT);
    expect(new Set(offers.map((offer) => offer.gear.templateId)).size).toBeGreaterThan(3);
  });

  it('estoque diferente após renovar seed', () => {
    const first = shopService.generateOffers(10, 0);
    const second = shopService.generateOffers(10, 1);

    expect(first.map((offer) => offer.gear.templateId)).not.toEqual(
      second.map((offer) => offer.gear.templateId),
    );
  });

  it('gera estoque da loja ativa apenas com o pool explícito e preço configurado', () => {
    const completed = [mainMissionId('1-1')];
    const shop = resolveActiveShop(completed)!;
    const stock = shopService.generateConfiguredStock(shop, 1, 0, completed);
    const offers = shopService.offersFromStock(shop, 1, stock);

    expect(offers.length).toBeGreaterThan(0);
    expect(offers.every((offer) => shop.catalogItemIds.includes(offer.catalogItemId))).toBe(true);
    expect(offers.every((offer) => offer.price >= 1)).toBe(true);
  });

  it('não repõe item épico ou superior já comprado na mesma loja', () => {
    const completed = [mainMissionId('1-50')];
    const shop = resolveActiveShop(completed)!;
    const blocked = 'valiant_blade';
    const stock = shopService.generateConfiguredStock(shop, 50, 3, completed, [blocked]);

    expect(stock.catalogItemIds).not.toContain(blocked);
    expect(stock.purchasedLimitedItemIds).toContain(blocked);
  });

  it('consome oferta e bloqueia épico+ sem alterar a cota de renovação', () => {
    const completed = [mainMissionId('1-50')];
    const shop = resolveActiveShop(completed)!;
    const stock = {
      seed: 0,
      catalogItemIds: ['worn_sword', 'valiant_blade'],
      consumedOfferIds: [] as string[],
      purchasedLimitedItemIds: [] as string[],
      refreshUses: 2,
    };
    const [commonOffer, epicOffer] = shopService.offersFromStock(shop, 50, stock);

    const afterCommon = shopService.consumeOffer(stock, commonOffer);
    expect(afterCommon.consumedOfferIds).toContain(commonOffer.id);
    expect(afterCommon.purchasedLimitedItemIds).toEqual([]);
    expect(afterCommon.refreshUses).toBe(2);

    const afterEpic = shopService.consumeOffer(afterCommon, epicOffer);
    expect(afterEpic.purchasedLimitedItemIds).toContain('valiant_blade');
    expect(afterEpic.refreshUses).toBe(2);
  });

  it('sem mains concluídas não vende acima de uncommon', () => {
    for (let seed = 0; seed < 5; seed += 1) {
      const offers = shopService.generateOffers(1, seed, []);
      for (const offer of offers) {
        expect(GEAR_RARITIES.indexOf(offer.gear.rarity)).toBeLessThanOrEqual(
          getShopMaxRarityIndex([]),
        );
      }
    }
  });

  it('usa o preço base fixo do item, sem tier/raridade na precificação', () => {
    const item = getGearCatalogItem('worn_sword')!;
    const context = { tier: 1, refreshSeed: 0, offerIndex: 0 };

    expect(shopService.calculateItemPrice(item, context)).toBe(item.basePrice);
    expect(
      shopService.calculateItemPrice(item, { ...context, tier: 200 }),
    ).toBe(item.basePrice);
  });

  it('aplica modificadores próprios da loja sobre o preço base', () => {
    const discountedShop = new ShopService(new LootService(), {
      modifiersFor: () => [
        { multiplier: 0.8 },
        { flatAdjustment: -2 },
      ],
    });
    const item = getGearCatalogItem('worn_sword')!;

    expect(
      discountedShop.calculateItemPrice(item, {
        tier: 1,
        refreshSeed: 0,
        offerIndex: 0,
      }),
    ).toBe(Math.max(1, Math.floor(item.basePrice * 0.8 - 2)));
  });
});

describe('ShopCatalog balance — caps por main', () => {
  it('cap de raridade evolui com mains concluídas', () => {
    expect(getShopMaxRarityForProgress([])).toBe('uncommon');
    expect(getShopMaxRarityForProgress([mainMissionId('1-1')])).toBe('uncommon');
    expect(getShopMaxRarityForProgress([mainMissionId('1-10')])).toBe('rare');
    expect(getShopMaxRarityForProgress([mainMissionId('1-20')])).toBe('epic');
    expect(getShopMaxRarityForProgress([mainMissionId('1-50')])).toBe('epic');
    expect(getShopMaxRarityForProgress([mainMissionId('2-1')])).toBe('epic');
    expect(getShopMaxRarityForProgress([mainMissionId('2-50')])).toBe('legendary');
    expect(getShopMaxRarityForProgress([mainMissionId('3-1')])).toBe('legendary');
    expect(getShopMaxRarityForProgress([mainMissionId('3-21')])).toBe('mythic');
    expect(getShopMaxRarityForProgress([], 121)).toBe('mythic');
  });

  it('não vende mythic antes do Ato 3 de Valdris', () => {
    const shop = new ShopService(new LootService());
    const mains = [mainMissionId('3-1')];
    for (let seed = 0; seed < 20; seed += 1) {
      const offers = shop.generateOffers(120, seed, mains);
      expect(offers.every((offer) => offer.gear.rarity !== 'mythic')).toBe(true);
    }
  });

  it('rollShopRarity respeita cap das mains', () => {
    const mains = [mainMissionId('1-10')];
    for (let index = 0; index < SHOP_OFFER_COUNT; index += 1) {
      const rarity = rollShopRarity(10, 0, index, mains);
      expect(GEAR_RARITIES.indexOf(rarity)).toBeLessThanOrEqual(getShopMaxRarityIndex(mains));
    }
  });
});
