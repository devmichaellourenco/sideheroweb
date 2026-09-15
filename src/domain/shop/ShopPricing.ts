import { GearRarity } from '../entities/Gear';
import {
  referenceGoldPerPhaseForTier,
  shopPhasesToAffordForRarity,
} from '../balance/EconomyReference';

const REFRESH_BASE_COST = 15;

/** Ajuste de preço pertencente à loja, nunca ao item. */
export interface ShopPriceModifier {
  readonly multiplier?: number;
  readonly flatAdjustment?: number;
}

/**
 * Preço final: valor fixo do item × modificadores da loja + ajustes fixos.
 * Modificadores multiplicativos se acumulam por produto.
 */
export function calculateShopItemPrice(
  basePrice: number,
  modifiers: readonly ShopPriceModifier[] = [],
): number {
  const safeBasePrice = Math.max(1, Math.floor(basePrice));
  const multiplier = modifiers.reduce((total, modifier) => {
    const value = modifier.multiplier;
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? total * value
      : total;
  }, 1);
  const flatAdjustment = modifiers.reduce((total, modifier) => {
    const value = modifier.flatAdjustment;
    return typeof value === 'number' && Number.isFinite(value) ? total + value : total;
  }, 0);

  return Math.max(1, Math.floor(safeBasePrice * multiplier + flatAdjustment));
}

/**
 * Referência econômica por tier/raridade. Não precifica itens; serve apenas
 * para budgets e auditorias de progressão.
 */
export function calculateReferenceShopPrice(tier: number, rarity: GearRarity): number {
  const referenceGold = referenceGoldPerPhaseForTier(tier);
  const phases = shopPhasesToAffordForRarity(tier, rarity);
  return Math.max(1, Math.floor(referenceGold * phases));
}

export function calculateShopRefreshCost(tier: number): number {
  return REFRESH_BASE_COST + Math.max(0, tier - 1) * 5;
}
