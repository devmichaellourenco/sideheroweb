import { getFeatureLevel, UpgradeLevels } from './FeatureKey';

const REFRESH_LIMITS: Record<number, number> = {
  1: 2,
  2: 5,
  3: 8,
};

export function getShopRefreshLimit(levels: UpgradeLevels): number {
  const level = getFeatureLevel(levels, 'shop_refresh');
  return REFRESH_LIMITS[level] ?? 0;
}

export function getShopRefreshDiscount(levels: UpgradeLevels): number {
  const level = getFeatureLevel(levels, 'shop_refresh');
  return level >= 3 ? 0.85 : 1;
}

export function calculateShopRefreshCost(stage: number, levels: UpgradeLevels): number {
  const base = 15 + Math.max(0, stage - 1) * 5;
  return Math.floor(base * getShopRefreshDiscount(levels));
}

export interface ShopRefreshContext {
  readonly upgradeLevels: UpgradeLevels;
  /** Renovações já usadas na loja avaliada (`ShopStock.refreshUses`). */
  readonly refreshUses: number;
  /** Mesmo tier usado para exibir o custo (`currentDifficultyTier`). */
  readonly tier: number;
  readonly gold: { canAfford: (cost: number) => boolean };
}

export function isShopRefreshUnlocked(levels: UpgradeLevels): boolean {
  return getFeatureLevel(levels, 'shop_refresh') >= 1;
}

export function shopRefreshRemaining(levels: UpgradeLevels, refreshUses: number): number {
  return Math.max(0, getShopRefreshLimit(levels) - Math.max(0, refreshUses));
}

export function canRefreshShop(context: ShopRefreshContext): boolean {
  if (!isShopRefreshUnlocked(context.upgradeLevels)) return false;
  if (shopRefreshRemaining(context.upgradeLevels, context.refreshUses) <= 0) return false;
  const cost = calculateShopRefreshCost(context.tier, context.upgradeLevels);
  return context.gold.canAfford(cost);
}
