/**
 * Snapshot editável do catálogo de itens para o Balance Lab.
 */
import type { GearRarity, GearSlot } from '../../src/domain/entities/Gear';
import {
  getCatalogGearItem,
  listCatalogGearItems,
  listGearCatalogItems,
} from '../../src/domain/gear/GearItemCatalog';
import type { GearItemDefinition } from '../../src/domain/gear/GearItemDefinition';
import {
  applyGearItemOverride,
  GEAR_STAT_NUMBER_KEYS,
  getGearItemOverride,
  normalizeGearItemOverride,
  setRuntimeGearItemOverrides,
  type GearItemOverride,
  type GearItemOverridesFile,
  type GearStatNumberKey,
} from '../../src/domain/gear/GearItemOverrides';

export interface GearLabFieldDef {
  key: GearStatNumberKey;
  label: string;
  step: number;
  group: 'primary' | 'speed' | 'crit' | 'resist' | 'element' | 'flat' | 'percent' | 'defense';
}

export const GEAR_STAT_EDIT_FIELDS: readonly GearLabFieldDef[] = [
  { key: 'attackBonus', label: 'ATK', step: 1, group: 'primary' },
  { key: 'defenseBonus', label: 'DEF', step: 1, group: 'primary' },
  { key: 'healthBonus', label: 'HP', step: 1, group: 'primary' },
  { key: 'attackSpeedBonus', label: 'ASPD %', step: 0.01, group: 'speed' },
  { key: 'castSpeedBonus', label: 'Cast %', step: 0.01, group: 'speed' },
  { key: 'cooldownReductionBonus', label: 'CDR %', step: 0.01, group: 'speed' },
  { key: 'critChanceBonus', label: 'Crit %', step: 0.01, group: 'crit' },
  { key: 'critDamageBonus', label: 'Crit dmg %', step: 0.01, group: 'crit' },
  { key: 'fireResistBonus', label: 'Fire resist %', step: 0.01, group: 'resist' },
  { key: 'coldResistBonus', label: 'Cold resist %', step: 0.01, group: 'resist' },
  { key: 'lightningResistBonus', label: 'Lightning resist %', step: 0.01, group: 'resist' },
  { key: 'airResistBonus', label: 'Air resist %', step: 0.01, group: 'resist' },
  { key: 'allElementalResistBonus', label: 'All elem resist %', step: 0.01, group: 'resist' },
  { key: 'fireDamageBonus', label: 'Fire dmg %', step: 0.01, group: 'element' },
  { key: 'coldDamageBonus', label: 'Cold dmg %', step: 0.01, group: 'element' },
  { key: 'lightningDamageBonus', label: 'Lightning dmg %', step: 0.01, group: 'element' },
  { key: 'airDamageBonus', label: 'Air dmg %', step: 0.01, group: 'element' },
  { key: 'allElementalDamageBonus', label: 'All elem dmg %', step: 0.01, group: 'element' },
  { key: 'fireResistPenetrationBonus', label: 'Fire pen %', step: 0.01, group: 'element' },
  { key: 'fireDamageFlat', label: 'Fire flat', step: 1, group: 'flat' },
  { key: 'coldDamageFlat', label: 'Cold flat', step: 1, group: 'flat' },
  { key: 'lightningDamageFlat', label: 'Lightning flat', step: 1, group: 'flat' },
  { key: 'airDamageFlat', label: 'Air flat', step: 1, group: 'flat' },
  { key: 'fireResistFlat', label: 'Fire resist flat', step: 1, group: 'flat' },
  { key: 'coldResistFlat', label: 'Cold resist flat', step: 1, group: 'flat' },
  { key: 'lightningResistFlat', label: 'Lightning resist flat', step: 1, group: 'flat' },
  { key: 'airResistFlat', label: 'Air resist flat', step: 1, group: 'flat' },
  { key: 'attackPercentBonus', label: 'ATK %', step: 0.01, group: 'percent' },
  { key: 'defensePercentBonus', label: 'DEF %', step: 0.01, group: 'percent' },
  { key: 'healthPercentBonus', label: 'HP %', step: 0.01, group: 'percent' },
  { key: 'physicalDamagePercentBonus', label: 'Phys dmg %', step: 0.01, group: 'percent' },
  { key: 'dodgeChanceBonus', label: 'Dodge %', step: 0.01, group: 'defense' },
  { key: 'blockChanceBonus', label: 'Block %', step: 0.01, group: 'defense' },
  { key: 'damageReductionBonus', label: 'DR %', step: 0.01, group: 'defense' },
];

const SLOT_LABEL: Record<GearSlot, string> = {
  weapon: 'Arma',
  armor: 'Armadura',
  accessory: 'Acessório',
};

const RARITY_LABEL: Record<GearRarity, string> = {
  common: 'Comum',
  uncommon: 'Incomum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
  mythic: 'Mítico',
};

export interface GearLabListEntry {
  id: string;
  name: string;
  baselineName: string;
  slot: GearSlot;
  slotLabel: string;
  rarity: GearRarity;
  rarityLabel: string;
  sprite: string;
  spriteUrl: string;
  attackBonus: number;
  defenseBonus: number;
  healthBonus: number;
  basePrice: number;
  minLevel: number;
  hasOverride: boolean;
  unique: boolean;
  namedLegendary: boolean;
  lootPool: boolean;
}

export interface GearLabDetail {
  id: string;
  sprite: string;
  spriteId: string;
  spriteUrl: string;
  slot: GearSlot;
  slotLabel: string;
  baseline: GearItemDefinition;
  effective: GearItemDefinition;
  hasOverride: boolean;
  override: GearItemOverride | null;
}

export interface GearItemsLabPayload {
  items: GearLabListEntry[];
  slots: Array<{ id: GearSlot; label: string }>;
  rarities: Array<{ id: GearRarity; label: string }>;
  statFields: readonly GearLabFieldDef[];
  updatedAt: string | null;
  overrideCount: number;
}

export function applyLabGearItemOverrides(
  file: GearItemOverridesFile | null,
): void {
  setRuntimeGearItemOverrides(file);
}

function spriteUrlFor(sprite: string): string {
  return `/panel/assets/${sprite.replace(/^\/+/, '')}`;
}

function toListEntry(item: GearItemDefinition, baseline: GearItemDefinition): GearLabListEntry {
  return {
    id: item.id,
    name: item.name,
    baselineName: baseline.name,
    slot: item.slot,
    slotLabel: SLOT_LABEL[item.slot],
    rarity: item.rarity,
    rarityLabel: RARITY_LABEL[item.rarity],
    sprite: item.sprite,
    spriteUrl: spriteUrlFor(item.sprite),
    attackBonus: item.attackBonus ?? 0,
    defenseBonus: item.defenseBonus ?? 0,
    healthBonus: item.healthBonus ?? 0,
    basePrice: item.basePrice,
    minLevel: item.requirements?.minLevel ?? 1,
    hasOverride: getGearItemOverride(item.id) !== null,
    unique: Boolean(item.unique),
    namedLegendary: Boolean(item.namedLegendary),
    lootPool: item.lootPool !== false && !item.unique && !item.namedLegendary,
  };
}

export function buildGearItemsLabPayload(options?: {
  diskOverrides?: GearItemOverridesFile | null;
  updatedAt?: string | null;
  slot?: GearSlot | '';
  rarity?: GearRarity | '';
  q?: string;
}): GearItemsLabPayload {
  applyLabGearItemOverrides(options?.diskOverrides ?? null);

  const query = (options?.q ?? '').trim().toLowerCase();
  const items = listGearCatalogItems()
    .map((item) => {
      const baseline = getCatalogGearItem(item.id)!;
      return toListEntry(item, baseline);
    })
    .filter((item) => {
      if (options?.slot && item.slot !== options.slot) return false;
      if (options?.rarity && item.rarity !== options.rarity) return false;
      if (!query) return true;
      return (
        item.id.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.baselineName.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const slotCmp = a.slot.localeCompare(b.slot);
      if (slotCmp !== 0) return slotCmp;
      const rarityOrder = Object.keys(RARITY_LABEL);
      const rarityCmp = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
      if (rarityCmp !== 0) return rarityCmp;
      return a.minLevel - b.minLevel || a.name.localeCompare(b.name);
    });

  const overrideCount = listCatalogGearItems().filter(
    (item) => getGearItemOverride(item.id) !== null,
  ).length;

  applyLabGearItemOverrides(null);

  return {
    items,
    slots: (Object.keys(SLOT_LABEL) as GearSlot[]).map((id) => ({
      id,
      label: SLOT_LABEL[id],
    })),
    rarities: (Object.keys(RARITY_LABEL) as GearRarity[]).map((id) => ({
      id,
      label: RARITY_LABEL[id],
    })),
    statFields: GEAR_STAT_EDIT_FIELDS,
    updatedAt: options?.updatedAt ?? null,
    overrideCount,
  };
}

export function getGearItemLabDetail(
  catalogItemId: string,
  diskOverrides?: GearItemOverridesFile | null,
): GearLabDetail | null {
  applyLabGearItemOverrides(diskOverrides ?? null);
  const baseline = getCatalogGearItem(catalogItemId);
  if (!baseline) {
    applyLabGearItemOverrides(null);
    return null;
  }
  const override = getGearItemOverride(catalogItemId);
  const effective = applyGearItemOverride(baseline, override);
  applyLabGearItemOverrides(null);

  return {
    id: baseline.id,
    sprite: baseline.sprite,
    spriteId: baseline.spriteId,
    spriteUrl: spriteUrlFor(baseline.sprite),
    slot: baseline.slot,
    slotLabel: SLOT_LABEL[baseline.slot],
    baseline,
    effective,
    hasOverride: override !== null,
    override,
  };
}

/** Diff do rascunho contra o baseline — só campos que mudaram. */
export function buildGearItemOverrideFromDraft(
  baseline: GearItemDefinition,
  draft: {
    name: string;
    basePrice: number;
    rarity: GearRarity;
    lootPool: boolean;
    unique: boolean;
    namedLegendary: boolean;
    salvageBlocked: boolean;
    exclusiveHeroId: string;
    requirements: { minLevel: number; str: number; dex: number; int: number; heroId: string };
    stats: Partial<Record<GearStatNumberKey, number>>;
  },
): GearItemOverride | null {
  const patch: GearItemOverride = {};
  const name = draft.name.trim();
  if (name && name !== baseline.name) patch.name = name;
  if (draft.basePrice !== baseline.basePrice) {
    patch.basePrice = Math.max(1, Math.floor(draft.basePrice));
  }
  if (draft.rarity !== baseline.rarity) patch.rarity = draft.rarity;

  const baselineLoot = baseline.lootPool !== false;
  if (draft.lootPool !== baselineLoot) patch.lootPool = draft.lootPool;
  if (draft.unique !== Boolean(baseline.unique)) patch.unique = draft.unique;
  if (draft.namedLegendary !== Boolean(baseline.namedLegendary)) {
    patch.namedLegendary = draft.namedLegendary;
  }
  if (draft.salvageBlocked !== Boolean(baseline.salvageBlocked)) {
    patch.salvageBlocked = draft.salvageBlocked;
  }

  const baselineExclusive = baseline.exclusiveHeroId ?? '';
  if (draft.exclusiveHeroId.trim() !== baselineExclusive) {
    patch.exclusiveHeroId = draft.exclusiveHeroId.trim() || null;
  }

  const req: NonNullable<GearItemOverride['requirements']> = {};
  const baseMin = baseline.requirements?.minLevel ?? 1;
  const baseStr = baseline.requirements?.str ?? 0;
  const baseDex = baseline.requirements?.dex ?? 0;
  const baseInt = baseline.requirements?.int ?? 0;
  const baseHero = baseline.requirements?.heroId ?? '';
  if (draft.requirements.minLevel !== baseMin) req.minLevel = draft.requirements.minLevel;
  if (draft.requirements.str !== baseStr) req.str = draft.requirements.str;
  if (draft.requirements.dex !== baseDex) req.dex = draft.requirements.dex;
  if (draft.requirements.int !== baseInt) req.int = draft.requirements.int;
  if (draft.requirements.heroId.trim() !== baseHero) {
    req.heroId = draft.requirements.heroId.trim() || null;
  }
  if (Object.keys(req).length > 0) patch.requirements = req;

  const stats: Partial<Record<GearStatNumberKey, number>> = {};
  for (const key of GEAR_STAT_NUMBER_KEYS) {
    const draftValue = draft.stats[key] ?? 0;
    const baseValue = baseline[key] ?? 0;
    if (draftValue !== baseValue) stats[key] = draftValue;
  }
  if (Object.keys(stats).length > 0) patch.stats = stats;

  return normalizeGearItemOverride(patch);
}

export { normalizeGearItemOverride };
