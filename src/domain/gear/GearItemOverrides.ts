import type { GearRarity } from '../entities/Gear';
import type { GearItemDefinition } from './GearItemDefinition';
import staticOverrides from './data/gear-item-overrides.json';

const STAT_NUMBER_KEYS = [
  'attackBonus',
  'defenseBonus',
  'healthBonus',
  'attackSpeedBonus',
  'castSpeedBonus',
  'critChanceBonus',
  'critDamageBonus',
  'fireResistBonus',
  'coldResistBonus',
  'lightningResistBonus',
  'airResistBonus',
  'allElementalResistBonus',
  'fireDamageBonus',
  'fireResistPenetrationBonus',
  'coldDamageBonus',
  'lightningDamageBonus',
  'airDamageBonus',
  'allElementalDamageBonus',
  'fireDamageFlat',
  'coldDamageFlat',
  'lightningDamageFlat',
  'airDamageFlat',
  'fireResistFlat',
  'coldResistFlat',
  'lightningResistFlat',
  'airResistFlat',
  'attackPercentBonus',
  'defensePercentBonus',
  'healthPercentBonus',
  'physicalDamagePercentBonus',
  'cooldownReductionBonus',
  'dodgeChanceBonus',
  'blockChanceBonus',
  'damageReductionBonus',
] as const;

const RARITIES: readonly GearRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
];

export type GearStatNumberKey = (typeof STAT_NUMBER_KEYS)[number];

export interface GearRequirementsOverride {
  minLevel?: number;
  str?: number;
  dex?: number;
  int?: number;
  heroId?: string | null;
}

/** Patch editável pelo Balance Lab — id/slot/sprite ficam no catálogo canônico. */
export interface GearItemOverride {
  name?: string;
  basePrice?: number;
  rarity?: GearRarity;
  lootPool?: boolean;
  unique?: boolean;
  namedLegendary?: boolean;
  salvageBlocked?: boolean;
  exclusiveHeroId?: string | null;
  requirements?: GearRequirementsOverride;
  stats?: Partial<Record<GearStatNumberKey, number>>;
}

export interface GearItemOverridesFile {
  version: number;
  updatedAt: string | null;
  items: Record<string, GearItemOverride>;
}

const embedded = staticOverrides as GearItemOverridesFile;

let runtime: GearItemOverridesFile | null = null;

export function listGearStatNumberKeys(): readonly GearStatNumberKey[] {
  return STAT_NUMBER_KEYS;
}

export function getEmbeddedGearItemOverrides(): GearItemOverridesFile {
  return {
    version: embedded.version ?? 1,
    updatedAt: embedded.updatedAt ?? null,
    items: { ...(embedded.items ?? {}) },
  };
}

export function setRuntimeGearItemOverrides(file: GearItemOverridesFile | null): void {
  runtime = file;
}

function activeFile(): GearItemOverridesFile {
  return runtime ?? {
    version: embedded.version ?? 1,
    updatedAt: embedded.updatedAt ?? null,
    items: embedded.items ?? {},
  };
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeRequirements(
  input: GearRequirementsOverride | null | undefined,
): GearRequirementsOverride | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const next: GearRequirementsOverride = {};
  const minLevel = finiteNumber(input.minLevel);
  if (minLevel !== undefined) next.minLevel = Math.max(1, Math.floor(minLevel));
  const str = finiteNumber(input.str);
  if (str !== undefined) next.str = Math.max(0, Math.floor(str));
  const dex = finiteNumber(input.dex);
  if (dex !== undefined) next.dex = Math.max(0, Math.floor(dex));
  const int = finiteNumber(input.int);
  if (int !== undefined) next.int = Math.max(0, Math.floor(int));
  if (input.heroId === null) {
    next.heroId = null;
  } else if (typeof input.heroId === 'string' && input.heroId.trim()) {
    next.heroId = input.heroId.trim();
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

function normalizeStats(
  input: Partial<Record<GearStatNumberKey, number>> | null | undefined,
): Partial<Record<GearStatNumberKey, number>> | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const next: Partial<Record<GearStatNumberKey, number>> = {};
  for (const key of STAT_NUMBER_KEYS) {
    const value = finiteNumber(input[key]);
    if (value !== undefined) next[key] = value;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

export function normalizeGearItemOverride(
  input: GearItemOverride | null | undefined,
): GearItemOverride | null {
  if (!input || typeof input !== 'object') return null;
  const next: GearItemOverride = {};

  if (typeof input.name === 'string' && input.name.trim()) {
    next.name = input.name.trim();
  }
  const basePrice = finiteNumber(input.basePrice);
  if (basePrice !== undefined && basePrice > 0) {
    next.basePrice = Math.max(1, Math.floor(basePrice));
  }
  if (typeof input.rarity === 'string' && RARITIES.includes(input.rarity as GearRarity)) {
    next.rarity = input.rarity as GearRarity;
  }
  if (typeof input.lootPool === 'boolean') next.lootPool = input.lootPool;
  if (typeof input.unique === 'boolean') next.unique = input.unique;
  if (typeof input.namedLegendary === 'boolean') next.namedLegendary = input.namedLegendary;
  if (typeof input.salvageBlocked === 'boolean') next.salvageBlocked = input.salvageBlocked;

  if (input.exclusiveHeroId === null) {
    next.exclusiveHeroId = null;
  } else if (typeof input.exclusiveHeroId === 'string' && input.exclusiveHeroId.trim()) {
    next.exclusiveHeroId = input.exclusiveHeroId.trim();
  }

  const requirements = normalizeRequirements(input.requirements);
  if (requirements) next.requirements = requirements;

  const stats = normalizeStats(input.stats);
  if (stats) next.stats = stats;

  return Object.keys(next).length > 0 ? next : null;
}

export function getGearItemOverride(catalogItemId: string): GearItemOverride | null {
  return normalizeGearItemOverride(activeFile().items?.[catalogItemId]);
}

export function applyGearItemOverride(
  baseline: GearItemDefinition,
  override: GearItemOverride | null | undefined,
): GearItemDefinition {
  const patch = normalizeGearItemOverride(override);
  if (!patch) return baseline;

  const requirements = { ...(baseline.requirements ?? { minLevel: 1 }) };
  if (patch.requirements) {
    if (patch.requirements.minLevel !== undefined) {
      requirements.minLevel = patch.requirements.minLevel;
    }
    if (patch.requirements.str !== undefined) requirements.str = patch.requirements.str;
    if (patch.requirements.dex !== undefined) requirements.dex = patch.requirements.dex;
    if (patch.requirements.int !== undefined) requirements.int = patch.requirements.int;
    if (patch.requirements.heroId === null) {
      delete requirements.heroId;
    } else if (patch.requirements.heroId !== undefined) {
      requirements.heroId = patch.requirements.heroId;
    }
  }

  let exclusiveHeroId = baseline.exclusiveHeroId;
  if (patch.exclusiveHeroId === null) {
    exclusiveHeroId = undefined;
  } else if (patch.exclusiveHeroId !== undefined) {
    exclusiveHeroId = patch.exclusiveHeroId;
  }

  const next: GearItemDefinition = {
    ...baseline,
    ...(patch.stats ?? {}),
    name: patch.name ?? baseline.name,
    basePrice: patch.basePrice ?? baseline.basePrice,
    rarity: patch.rarity ?? baseline.rarity,
    lootPool: patch.lootPool ?? baseline.lootPool,
    unique: patch.unique ?? baseline.unique,
    namedLegendary: patch.namedLegendary ?? baseline.namedLegendary,
    salvageBlocked: patch.salvageBlocked ?? baseline.salvageBlocked,
    exclusiveHeroId,
    requirements,
  };

  return next;
}

export function withGearItemOverrides(
  items: readonly GearItemDefinition[],
): GearItemDefinition[] {
  return items.map((item) => applyGearItemOverride(item, getGearItemOverride(item.id)));
}

export { STAT_NUMBER_KEYS as GEAR_STAT_NUMBER_KEYS };
