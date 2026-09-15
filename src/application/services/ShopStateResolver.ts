import { GameState } from '../../domain/entities/GameState';
import { ShopService } from '../../domain/services/ShopService';
import type { ShopStock } from '../../domain/shop/ShopStock';
import {
  resolveActiveShop,
  ShopDefinition,
} from '../../domain/shop/ConfigurableShopCatalog';

export interface ActiveShopState {
  readonly shop: ShopDefinition;
  readonly stock: ShopStock;
  readonly state: GameState;
}

export function resolveActiveShopState(
  state: GameState,
  shopService: ShopService,
): ActiveShopState | null {
  const completedMainIds = state.campaignProgress.missionProgress.completedMainIds;
  const shop = resolveActiveShop(completedMainIds);
  if (!shop) return null;

  const existing = state.shopStock(shop.id);
  if (existing) return { shop, stock: existing, state };

  const hasAnyStock = Object.keys(state.shopStocks).length > 0;
  const stock = shopService.generateConfiguredStock(
    shop,
    state.currentDifficultyTier(),
    state.shopRefreshSeed,
    completedMainIds,
    [],
    hasAnyStock ? 0 : state.shopRefreshUses,
  );
  return { shop, stock, state: state.withShopStock(shop.id, stock) };
}

/** Renovações já usadas na loja ativa; 0 quando nenhuma loja está desbloqueada. */
export function activeShopRefreshUses(state: GameState): number {
  const shop = resolveActiveShop(state.campaignProgress.missionProgress.completedMainIds);
  if (!shop) return 0;
  return state.shopStock(shop.id)?.refreshUses ?? 0;
}
