import type { MissionId } from '../campaign/missions/MissionId';
import { MAIN_QUEST_PHASE_NUMBERS } from '../campaign/missions/MissionId';
import { getGearCatalogItem } from '../gear/GearItemCatalog';
import embeddedCatalog from './data/shops.catalog.json';
import embeddedOverrides from './data/shop-overrides.json';

export interface ShopDefinition {
  readonly id: string;
  readonly name: string;
  readonly unlockAfterMainId: MissionId;
  readonly catalogItemIds: readonly string[];
  readonly priceMultiplier: number;
  readonly flatPriceAdjustment: number;
}

export interface ShopDefinitionOverride {
  readonly name?: string;
  readonly unlockAfterMainId?: MissionId;
  readonly catalogItemIds?: readonly string[];
  readonly priceMultiplier?: number;
  readonly flatPriceAdjustment?: number;
}

export interface ShopOverridesFile {
  readonly version: number;
  readonly updatedAt: string | null;
  readonly shops: Readonly<Record<string, ShopDefinitionOverride>>;
  readonly deletedShopIds?: readonly string[];
}

const catalog = embeddedCatalog as readonly ShopDefinition[];
const catalogById = new Map(catalog.map((definition) => [definition.id, definition]));
const SHOP_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAIN_ID_PATTERN = /^main:(\d+)-(\d+)$/;
const embedded = normalizeShopOverridesFile(embeddedOverrides);
let runtime: ShopOverridesFile | null = null;

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeShopId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const id = value.trim().toLowerCase();
  return SHOP_ID_PATTERN.test(id) ? id : null;
}

export function normalizeShopUnlockId(value: unknown): MissionId | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(MAIN_ID_PATTERN);
  if (!match) return null;
  const phase = Number(match[2]);
  if (!(MAIN_QUEST_PHASE_NUMBERS as readonly number[]).includes(phase)) return null;
  return `main:${Number(match[1])}-${phase}`;
}

function normalizeCatalogItemIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return [...new Set(
    value.filter(
      (id): id is string =>
        typeof id === 'string' && getGearCatalogItem(id) !== undefined,
    ),
  )];
}

export function normalizeShopOverride(value: unknown): ShopDefinitionOverride | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const normalized: {
    name?: string;
    unlockAfterMainId?: MissionId;
    catalogItemIds?: string[];
    priceMultiplier?: number;
    flatPriceAdjustment?: number;
  } = {};
  if (typeof raw.name === 'string' && raw.name.trim()) normalized.name = raw.name.trim();
  const unlockAfterMainId = normalizeShopUnlockId(raw.unlockAfterMainId);
  if (unlockAfterMainId) normalized.unlockAfterMainId = unlockAfterMainId;
  const catalogItemIds = normalizeCatalogItemIds(raw.catalogItemIds);
  if (catalogItemIds) normalized.catalogItemIds = catalogItemIds;
  if (typeof raw.priceMultiplier === 'number' && Number.isFinite(raw.priceMultiplier)) {
    normalized.priceMultiplier = Math.max(0, raw.priceMultiplier);
  }
  if (
    typeof raw.flatPriceAdjustment === 'number' &&
    Number.isFinite(raw.flatPriceAdjustment)
  ) {
    normalized.flatPriceAdjustment = raw.flatPriceAdjustment;
  }
  return Object.keys(normalized).length > 0 ? normalized : null;
}

export function normalizeShopDefinition(
  shopId: unknown,
  value: unknown,
): ShopDefinition | null {
  const id = normalizeShopId(shopId);
  const override = normalizeShopOverride(value);
  if (
    !id ||
    !override?.name ||
    !override.unlockAfterMainId ||
    !override.catalogItemIds ||
    override.catalogItemIds.length === 0 ||
    override.priceMultiplier === undefined ||
    override.flatPriceAdjustment === undefined
  ) {
    return null;
  }
  return { id, ...override } as ShopDefinition;
}

export function normalizeShopOverridesFile(value: unknown): ShopOverridesFile {
  const raw =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const rawShops =
    raw.shops && typeof raw.shops === 'object' && !Array.isArray(raw.shops)
      ? (raw.shops as Record<string, unknown>)
      : {};
  const shops: Record<string, ShopDefinitionOverride> = {};
  for (const [rawId, rawShop] of Object.entries(rawShops)) {
    const id = normalizeShopId(rawId);
    const normalized = normalizeShopOverride(rawShop);
    if (!id || !normalized) continue;
    if (!catalogById.has(id) && !normalizeShopDefinition(id, normalized)) continue;
    shops[id] = normalized;
  }
  const deletedShopIds = Array.isArray(raw.deletedShopIds)
    ? [...new Set(raw.deletedShopIds.map(normalizeShopId).filter((id): id is string => !!id))]
    : [];
  return {
    version:
      typeof raw.version === 'number' && Number.isFinite(raw.version)
        ? Math.max(1, Math.floor(raw.version))
        : 1,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
    shops,
    deletedShopIds,
  };
}

function applyOverride(
  definition: ShopDefinition,
  override: ShopDefinitionOverride | undefined,
): ShopDefinition {
  if (!override) return definition;
  const catalogItemIds = Array.isArray(override.catalogItemIds)
    ? override.catalogItemIds.filter(
        (id): id is string => typeof id === 'string' && getGearCatalogItem(id) !== undefined,
      )
    : [...definition.catalogItemIds];

  return {
    id: definition.id,
    name:
      typeof override.name === 'string' && override.name.trim()
        ? override.name.trim()
        : definition.name,
    unlockAfterMainId:
      normalizeShopUnlockId(override.unlockAfterMainId) ?? definition.unlockAfterMainId,
    catalogItemIds,
    priceMultiplier: Math.max(
      0,
      finiteOr(override.priceMultiplier, definition.priceMultiplier),
    ),
    flatPriceAdjustment: finiteOr(
      override.flatPriceAdjustment,
      definition.flatPriceAdjustment,
    ),
  };
}

function activeOverrides(): ShopOverridesFile {
  return runtime ?? embedded;
}

export function setRuntimeShopOverrides(file: ShopOverridesFile | null): void {
  runtime = file ? normalizeShopOverridesFile(file) : null;
}

export function getEmbeddedShopOverrides(): ShopOverridesFile {
  return {
    version: embedded.version ?? 1,
    updatedAt: embedded.updatedAt ?? null,
    shops: { ...(embedded.shops ?? {}) },
    deletedShopIds: [...(embedded.deletedShopIds ?? [])],
  };
}

export function listConfiguredShops(): readonly ShopDefinition[] {
  const file = activeOverrides();
  const overrides = file.shops ?? {};
  const deleted = new Set(file.deletedShopIds ?? []);
  const configured = catalog
    .filter((definition) => !deleted.has(definition.id))
    .map((definition) => applyOverride(definition, overrides[definition.id]));
  for (const [shopId, override] of Object.entries(overrides)) {
    if (catalogById.has(shopId) || deleted.has(shopId)) continue;
    const definition = normalizeShopDefinition(shopId, override);
    if (definition) configured.push(definition);
  }
  return configured;
}

export function getConfiguredShop(shopId: string): ShopDefinition | null {
  return listConfiguredShops().find((shop) => shop.id === shopId) ?? null;
}

export function isCanonicalShopId(shopId: string): boolean {
  return catalogById.has(shopId);
}

export function getCanonicalShop(shopId: string): ShopDefinition | null {
  return catalogById.get(shopId) ?? null;
}

export function shopProgressionTier(unlockAfterMainId: MissionId): number {
  const match = unlockAfterMainId.match(MAIN_ID_PATTERN);
  if (!match) return -1;
  return Number(match[1]) * 1_000 + Number(match[2]);
}

/** A loja de maior marco concluído fica ativa; o ID desempata deterministicamente. */
export function resolveActiveShop(
  completedMainIds: readonly MissionId[],
): ShopDefinition | null {
  const completed = new Set(completedMainIds);
  return (
    listConfiguredShops()
      .filter((shop) => completed.has(shop.unlockAfterMainId))
      .sort(
        (a, b) =>
          shopProgressionTier(b.unlockAfterMainId) -
            shopProgressionTier(a.unlockAfterMainId) ||
          b.id.localeCompare(a.id),
      )[0] ?? null
  );
}
