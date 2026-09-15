import { describe, expect, it } from 'vitest';
import {
  canRefreshShop,
  getShopRefreshLimit,
  shopRefreshRemaining,
} from './ShopRefreshRules';

describe('ShopRefreshRules', () => {
  it('cota e restante usam refreshUses da loja, não um contador global implícito', () => {
    const levels = { shop_refresh: 1 };
    expect(getShopRefreshLimit(levels)).toBe(2);
    expect(shopRefreshRemaining(levels, 0)).toBe(2);
    expect(shopRefreshRemaining(levels, 2)).toBe(0);
  });

  it('avalia ouro e tier explícitos da loja ativa', () => {
    const levels = { shop_refresh: 1 };
    expect(
      canRefreshShop({
        upgradeLevels: levels,
        refreshUses: 0,
        tier: 1,
        gold: { canAfford: () => true },
      }),
    ).toBe(true);
    expect(
      canRefreshShop({
        upgradeLevels: levels,
        refreshUses: 2,
        tier: 1,
        gold: { canAfford: () => true },
      }),
    ).toBe(false);
    expect(
      canRefreshShop({
        upgradeLevels: {},
        refreshUses: 0,
        tier: 1,
        gold: { canAfford: () => true },
      }),
    ).toBe(false);
  });
});
