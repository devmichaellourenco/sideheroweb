/** Estoque persistido de uma loja: sorteio, consumo e cota de renovação próprios. */
export interface ShopStock {
  readonly seed: number;
  readonly catalogItemIds: readonly string[];
  readonly consumedOfferIds: readonly string[];
  readonly purchasedLimitedItemIds: readonly string[];
  /** Renovações já usadas nesta loja (cota é por loja, não global). */
  readonly refreshUses: number;
}

/** Forma tolerante usada ao restaurar saves antigos (campos podem faltar). */
export interface ShopStockProps {
  readonly seed?: number;
  readonly catalogItemIds?: readonly string[];
  readonly consumedOfferIds?: readonly string[];
  readonly purchasedLimitedItemIds?: readonly string[];
  readonly refreshUses?: number;
}

function nonNegativeInt(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

/**
 * Normaliza um estoque cru. Saves anteriores à cota por loja não têm
 * `refreshUses`; nesses casos herdamos o contador global para não devolver
 * renovações já gastas.
 */
export function normalizeShopStock(
  stock: ShopStockProps | ShopStock,
  legacyRefreshUses = 0,
): ShopStock {
  return {
    seed: nonNegativeInt(stock.seed, 0),
    catalogItemIds: [...(stock.catalogItemIds ?? [])],
    consumedOfferIds: [...(stock.consumedOfferIds ?? [])],
    purchasedLimitedItemIds: [...(stock.purchasedLimitedItemIds ?? [])],
    refreshUses: nonNegativeInt(stock.refreshUses, nonNegativeInt(legacyRefreshUses, 0)),
  };
}

export function cloneShopStock(stock: ShopStock): ShopStock {
  return normalizeShopStock(stock, stock.refreshUses);
}
