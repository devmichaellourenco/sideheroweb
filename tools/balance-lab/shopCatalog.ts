import { listMissionCatalog } from '../../src/domain/campaign/missions/MissionCatalog';
import { phaseIdFromMainMissionId } from '../../src/domain/campaign/missions/MissionId';
import { listGearCatalogItems, getGearCatalogItem } from '../../src/domain/gear/GearItemCatalog';
import {
  getCanonicalShop,
  listConfiguredShops,
  normalizeShopDefinition,
  normalizeShopOverride,
  setRuntimeShopOverrides,
  shopProgressionTier,
  type ShopDefinition,
  type ShopDefinitionOverride,
  type ShopOverridesFile,
} from '../../src/domain/shop/ConfigurableShopCatalog';
import {
  calculateShopItemPrice,
  calculateShopRefreshCost,
} from '../../src/domain/shop/ShopPricing';
import { shopDeterministicRoll, getShopMaxRarityIndex, SHOP_OFFER_COUNT } from '../../src/domain/shop/ShopCatalog';
import { GEAR_RARITIES } from '../../src/domain/entities/Gear';

export interface ShopLabDraft {
  id: string;
  name: string;
  unlockAfterMainId: string;
  catalogItemIds: string[];
  priceMultiplier: number;
  flatPriceAdjustment: number;
}

export function applyLabShopOverrides(file: ShopOverridesFile | null): void {
  setRuntimeShopOverrides(file);
}

export function buildShopLabPayload(options?: {
  diskOverrides?: ShopOverridesFile | null;
  q?: string;
  mapIndex?: number;
}) {
  applyLabShopOverrides(options?.diskOverrides ?? null);
  const query = (options?.q ?? '').trim().toLowerCase();
  const deleted = new Set(options?.diskOverrides?.deletedShopIds ?? []);
  const overrideIds = new Set(Object.keys(options?.diskOverrides?.shops ?? {}));
  const shops = listConfiguredShops()
    .filter((shop) => {
      const phaseId = phaseIdFromMainMissionId(shop.unlockAfterMainId);
      const mapIndex = phaseId ? Number(phaseId.split('-')[0]) : 0;
      if (options?.mapIndex && mapIndex !== options.mapIndex) return false;
      return !query || shop.id.toLowerCase().includes(query) || shop.name.toLowerCase().includes(query);
    })
    .map((shop) => ({
      ...shop,
      canonical: getCanonicalShop(shop.id) !== null,
      hasOverride: overrideIds.has(shop.id),
      progressionTier: shopProgressionTier(shop.unlockAfterMainId),
    }))
    .sort((a, b) => a.progressionTier - b.progressionTier || a.id.localeCompare(b.id));

  const milestones = listMissionCatalog()
    .filter((mission) => mission.kind === 'main')
    .map((mission) => ({
      id: mission.id,
      name: mission.name,
      mapId: mission.mapId,
      phaseId: mission.phaseTemplateId,
      mapIndex: Number(mission.phaseTemplateId.split('-')[0]),
      progressionTier: shopProgressionTier(mission.id),
    }))
    .sort((a, b) => a.progressionTier - b.progressionTier || a.id.localeCompare(b.id));

  const items = listGearCatalogItems()
    .map((item) => ({
      id: item.id,
      name: item.name,
      rarity: item.rarity,
      slot: item.slot,
      basePrice: item.basePrice,
      sprite: item.sprite,
      spriteUrl: `/panel/assets/${item.sprite.replace(/^\/+/, '')}`,
    }))
    .sort((a, b) => a.slot.localeCompare(b.slot) || a.rarity.localeCompare(b.rarity) || a.name.localeCompare(b.name));

  applyLabShopOverrides(null);
  return {
    shops,
    milestones,
    items,
    deletedShopIds: [...deleted],
    updatedAt: options?.diskOverrides?.updatedAt ?? null,
  };
}

export function getShopLabDetail(
  shopId: string,
  diskOverrides?: ShopOverridesFile | null,
): (ShopDefinition & { canonical: boolean; hasOverride: boolean }) | null {
  applyLabShopOverrides(diskOverrides ?? null);
  const shop = listConfiguredShops().find((entry) => entry.id === shopId);
  applyLabShopOverrides(null);
  if (!shop) return null;
  return {
    ...shop,
    canonical: getCanonicalShop(shopId) !== null,
    hasOverride: Boolean(diskOverrides?.shops?.[shopId]),
  };
}

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

export interface ShopStockPreviewOffer {
  catalogItemId: string;
  name: string;
  rarity: string;
  basePrice: number;
  effectivePrice: number;
}

export interface ShopStockPreview {
  shopId: string;
  shopName: string;
  seed: number;
  tier: number;
  refreshCost: number;
  offers: ShopStockPreviewOffer[];
}

export function previewShopStock(
  shopId: string,
  opts: {
    seed?: number;
    tier?: number;
    diskOverrides?: ShopOverridesFile | null;
  } = {},
): ShopStockPreview | null {
  applyLabShopOverrides(opts.diskOverrides ?? null);
  const shop = listConfiguredShops().find((s) => s.id === shopId);
  applyLabShopOverrides(null);
  if (!shop) return null;

  const tier = opts.tier ?? shopProgressionTier(shop.unlockAfterMainId);
  const seed = opts.seed ?? 0;
  const maxRarityIndex = getShopMaxRarityIndex([], tier);

  const candidates = shop.catalogItemIds.filter((itemId) => {
    const item = getGearCatalogItem(itemId);
    if (!item) return false;
    return GEAR_RARITIES.indexOf(item.rarity) <= maxRarityIndex;
  });

  const available = [...candidates];
  const picked: string[] = [];
  while (available.length > 0 && picked.length < SHOP_OFFER_COUNT) {
    const index = shopDeterministicRoll(tier, seed, picked.length) % available.length;
    picked.push(available.splice(index, 1)[0]);
  }

  const offers: ShopStockPreviewOffer[] = picked.flatMap((itemId) => {
    const item = getGearCatalogItem(itemId);
    if (!item) return [];
    return [{
      catalogItemId: itemId,
      name: item.name,
      rarity: item.rarity,
      basePrice: item.basePrice,
      effectivePrice: calculateShopItemPrice(item.basePrice, [
        { multiplier: shop.priceMultiplier, flatAdjustment: shop.flatPriceAdjustment },
      ]),
    }];
  });

  return {
    shopId: shop.id,
    shopName: shop.name,
    seed,
    tier,
    refreshCost: calculateShopRefreshCost(tier),
    offers,
  };
}

export function buildShopOverrideFromDraft(
  shopId: string,
  draft: ShopLabDraft,
): ShopDefinitionOverride {
  const normalized = normalizeShopDefinition(shopId, draft);
  if (!normalized) {
    throw new Error('Loja inválida: revise id, nome, marco, itens e modificadores');
  }
  const baseline = getCanonicalShop(shopId);
  if (!baseline) return normalized;

  const patch: {
    name?: string;
    unlockAfterMainId?: string;
    catalogItemIds?: readonly string[];
    priceMultiplier?: number;
    flatPriceAdjustment?: number;
  } = {};
  if (normalized.name !== baseline.name) patch.name = normalized.name;
  if (normalized.unlockAfterMainId !== baseline.unlockAfterMainId) {
    patch.unlockAfterMainId = normalized.unlockAfterMainId;
  }
  if (!sameIds(normalized.catalogItemIds, baseline.catalogItemIds)) {
    patch.catalogItemIds = normalized.catalogItemIds;
  }
  if (normalized.priceMultiplier !== baseline.priceMultiplier) {
    patch.priceMultiplier = normalized.priceMultiplier;
  }
  if (normalized.flatPriceAdjustment !== baseline.flatPriceAdjustment) {
    patch.flatPriceAdjustment = normalized.flatPriceAdjustment;
  }
  return normalizeShopOverride(patch) ?? {};
}
