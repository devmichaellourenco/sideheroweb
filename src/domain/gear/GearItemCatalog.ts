import { Gear, GearRarity, GearSlot } from '../entities/Gear';
import { GALNEON_HERO_ID } from './GalneonGearCatalog';
import { gearLevelRangeForTier } from './MapGearLevelPolicy';
import {
  GearItemDefinition,
  gearItemMatchesLoot,
  isGalneonCatalogItem,
  isLootPoolItem,
} from './GearItemDefinition';
import {
  applyGearItemOverride,
  getGearItemOverride,
} from './GearItemOverrides';
import catalogData from './data/gear-items.catalog.json';
import legacyTemplateMap from './data/gear-legacy-template-map.json';

const CATALOG_ITEMS: readonly GearItemDefinition[] = catalogData as GearItemDefinition[];
const BY_ID = new Map(CATALOG_ITEMS.map((entry) => [entry.id, entry]));

type LegacyTemplateMap = Record<string, Partial<Record<GearRarity, string>>>;
const LEGACY_TEMPLATE_MAP = legacyTemplateMap as LegacyTemplateMap;

/** Nomes legados (meta / sufixo antigo) → id do catálogo. */
const LEGACY_NAME_TO_CATALOG_ID: Record<string, string> = {
  'Espada Enferrujada': 'worn_sword',
  'Machado Pixel': 'field_axe',
  'Lâmina Side': 'iron_dagger',
  'Armadura 8-bit': 'leather_jerkin',
  'Placa Chrome': 'iron_vest',
  'Amuleto Idle': 'wood_talisman',
  'Pingente RPG': 'bone_pendant',
  'Badge Extensão': 'tin_brooch',
  'Espada Padrão': 'galneon_recruit_sword',
  'Couraça das Brasa': 'charred_cuirass',
  'Couraça Trovão': 'thunder_shield',
  'Lâmina Gelada': 'chill_blade',
  'Machado do Carrasco': 'headsman_axe',
  'Machado de Campo': 'field_axe',
  'Anel de Cobre': 'copper_ring',
  'Pingente Entropia': 'entropy_pendant',
};

/** Definição canônica (JSON), sem override do Balance Lab. */
export function getCatalogGearItem(catalogItemId: string): GearItemDefinition | undefined {
  return BY_ID.get(catalogItemId);
}

export function listCatalogGearItems(): readonly GearItemDefinition[] {
  return CATALOG_ITEMS;
}

/** Itens efetivos (catálogo + override do Balance Lab). */
export function listGearCatalogItems(): readonly GearItemDefinition[] {
  return CATALOG_ITEMS.map((entry) =>
    applyGearItemOverride(entry, getGearItemOverride(entry.id)),
  );
}

export function getGearCatalogItem(catalogItemId: string): GearItemDefinition | undefined {
  const baseline = BY_ID.get(catalogItemId);
  if (!baseline) return undefined;
  return applyGearItemOverride(baseline, getGearItemOverride(catalogItemId));
}

export function getGearCatalogSprite(catalogItemId: string): string | undefined {
  return getGearCatalogItem(catalogItemId)?.sprite;
}

export function listLootCatalogItemsForSlot(slot: GearSlot): GearItemDefinition[] {
  return listGearCatalogItems().filter((entry) => entry.slot === slot && isLootPoolItem(entry));
}

export function listLootCatalogItems(
  slot: GearSlot,
  rarity: GearRarity,
  difficultyTier: number,
): GearItemDefinition[] {
  const range = gearLevelRangeForTier(difficultyTier);
  const catalog = listGearCatalogItems();
  const matches = catalog.filter((entry) =>
    gearItemMatchesLoot(entry, slot, rarity, range.min, range.max),
  );

  if (matches.length > 0) {
    return matches;
  }

  return catalog.filter(
    (entry) => isLootPoolItem(entry) && entry.slot === slot && entry.rarity === rarity,
  );
}

export function listGalneonCatalogItemsForRarity(rarity: GearRarity): GearItemDefinition[] {
  return listGearCatalogItems().filter(
    (entry) => isGalneonCatalogItem(entry) && entry.rarity === rarity,
  );
}

export function resolveLegacyCatalogItemId(
  legacyTemplateId: string,
  rarity: GearRarity,
): string | undefined {
  return LEGACY_TEMPLATE_MAP[legacyTemplateId]?.[rarity];
}

export function findCatalogItemBySpriteId(
  spriteId: string,
  rarity: GearRarity,
  difficultyTier?: number,
  slot?: GearSlot,
): GearItemDefinition | undefined {
  const byId = getGearCatalogItem(spriteId);
  if (byId && byId.spriteId === spriteId) {
    if (!rarity || byId.rarity === rarity) {
      return byId;
    }
  }

  const legacyCatalogId = resolveLegacyCatalogItemId(spriteId, rarity);
  if (legacyCatalogId) {
    return getGearCatalogItem(legacyCatalogId);
  }

  if (spriteId === 'galneon_standard_sword') {
    const galneonItems = listGalneonCatalogItemsForRarity(rarity);
    if (galneonItems.length === 0) {
      return undefined;
    }
    if (difficultyTier === undefined) {
      return galneonItems[0];
    }
    const range = gearLevelRangeForTier(difficultyTier);
    const inRange = galneonItems.filter((entry) => {
      const minLevel = entry.requirements?.minLevel ?? 1;
      return minLevel >= range.min && minLevel <= range.max;
    });
    return (inRange.length > 0 ? inRange : galneonItems)[0];
  }

  let candidates = listGearCatalogItems().filter(
    (entry) => entry.spriteId === spriteId && entry.rarity === rarity,
  );

  if (slot) {
    candidates = candidates.filter((entry) => entry.slot === slot);
  }

  if (candidates.length === 0) {
    return undefined;
  }

  if (candidates.length === 1 || difficultyTier === undefined) {
    return candidates[0];
  }

  const range = gearLevelRangeForTier(difficultyTier);
  const inRange = candidates.filter((entry) => {
    const minLevel = entry.requirements?.minLevel ?? 1;
    return minLevel >= range.min && minLevel <= range.max;
  });

  return (inRange.length > 0 ? inRange : candidates)[0];
}

/** @deprecated Use findCatalogItemBySpriteId — alias para saves legados. */
export const findCatalogItemByTemplateAndRarity = findCatalogItemBySpriteId;

export function stripGearRaritySuffix(name: string): string {
  return name.replace(/\s*\([^)]+\)\s*$/, '').trim();
}

export function resolveCatalogItemId(
  name: string,
  slot: GearSlot,
  legacySpriteId?: string,
  rarity?: GearRarity,
): string | undefined {
  const normalized = stripGearRaritySuffix(name);

  const byExactName = listGearCatalogItems().find(
    (entry) => entry.slot === slot && stripGearRaritySuffix(entry.name) === normalized,
  );
  if (byExactName) {
    return byExactName.id;
  }

  if (normalized === name && CATALOG_ITEMS.some((entry) => entry.id === normalized)) {
    const byId = getGearCatalogItem(normalized);
    if (byId && byId.slot === slot) {
      return byId.id;
    }
  }

  const legacyId = LEGACY_NAME_TO_CATALOG_ID[normalized];
  if (legacyId) {
    return legacyId;
  }

  if (legacySpriteId && rarity) {
    const bySprite = findCatalogItemBySpriteId(legacySpriteId, rarity, undefined, slot);
    if (bySprite) {
      return bySprite.id;
    }
  }

  if (legacySpriteId) {
    const bySpriteOnly = getGearCatalogItem(legacySpriteId);
    if (bySpriteOnly) {
      return bySpriteOnly.id;
    }
  }

  return undefined;
}

export function createGearFromCatalogItem(catalogItemId: string, instanceId?: string): Gear {
  const definition = getGearCatalogItem(catalogItemId);
  if (!definition) {
    throw new Error(`Item de catálogo inválido: ${catalogItemId}`);
  }

  const {
    id: catalogId,
    spriteId,
    sprite: _sprite,
    basePrice: _basePrice,
    lootPool: _lootPool,
    exclusiveHeroId,
    unique: _unique,
    namedLegendary: _namedLegendary,
    salvageBlocked: _salvageBlocked,
    attackBonus = 0,
    defenseBonus = 0,
    healthBonus = 0,
    ...rest
  } = definition;

  const requirements = { ...(rest.requirements ?? { minLevel: 1 }) };
  if (exclusiveHeroId) {
    requirements.heroId = exclusiveHeroId;
  } else if (isGalneonCatalogItem(definition)) {
    requirements.heroId = GALNEON_HERO_ID;
  }

  const { requirements: _ignoredReqs, ...gearFields } = rest;

  return Gear.create({
    ...gearFields,
    attackBonus,
    defenseBonus,
    healthBonus,
    templateId: spriteId,
    id: instanceId ?? `gear-${catalogId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    catalogItemId: catalogId,
    requirements,
  });
}

/** Reaplica stats/requisitos atuais do catálogo, preservando o id da instância. */
export function resyncGearFromCatalog(gear: Gear): Gear {
  if (!gear.catalogItemId || !getGearCatalogItem(gear.catalogItemId)) {
    return gear;
  }
  return createGearFromCatalogItem(gear.catalogItemId, gear.id);
}

export function isSalvageBlockedCatalogItem(catalogItemId: string): boolean {
  return getGearCatalogItem(catalogItemId)?.salvageBlocked === true;
}
