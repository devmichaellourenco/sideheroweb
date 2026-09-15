import { getGearCatalogItem } from './GearItemCatalog';

export interface MapGearLevelRange {
  readonly min: number;
  readonly max: number;
}

/** Faixas de nível de item por mapa (v1 até Morthaven). Não se aplica a únicos de boss. */
export const MAP_GEAR_LEVEL_RANGES: Readonly<Record<number, MapGearLevelRange>> = {
  1: { min: 1, max: 12 }, // Stendra
  2: { min: 10, max: 22 }, // Gruftall
  3: { min: 20, max: 32 }, // Valdris
  4: { min: 30, max: 42 }, // Morthaven
};

export function mapIndexFromDifficultyTier(difficultyTier: number): number {
  const tier = Math.max(1, Math.floor(difficultyTier));
  return Math.min(4, Math.max(1, Math.ceil(tier / 50)));
}

export function gearLevelRangeForTier(difficultyTier: number): MapGearLevelRange {
  return MAP_GEAR_LEVEL_RANGES[mapIndexFromDifficultyTier(difficultyTier)];
}

/** Itens únicos de chefes finais ignoram a faixa por mapa. */
export function isExemptFromMapGearLevelPolicy(catalogOrTemplateId?: string): boolean {
  if (!catalogOrTemplateId) {
    return false;
  }

  const catalogItem = getGearCatalogItem(catalogOrTemplateId);
  if (catalogItem) {
    return Boolean(catalogItem.unique || catalogItem.namedLegendary);
  }

  return false;
}

function progressWithinMap(difficultyTier: number): number {
  const tier = Math.max(1, Math.floor(difficultyTier));
  return ((tier - 1) % 50) / 49;
}

/** Rola nível de item dentro da faixa do mapa, com viés pelo progresso na trilha. */
export function rollGearItemLevel(difficultyTier: number): number {
  const range = gearLevelRangeForTier(difficultyTier);
  const weightedMin =
    range.min + Math.floor((range.max - range.min) * progressWithinMap(difficultyTier) * 0.45);
  const span = range.max - weightedMin;
  if (span <= 0) {
    return range.max;
  }

  return weightedMin + Math.floor(Math.random() * (span + 1));
}

/** Nível determinístico para loja e loot reprodutível. */
export function deterministicGearItemLevel(difficultyTier: number, seed = 0): number {
  const range = gearLevelRangeForTier(difficultyTier);
  const span = range.max - range.min;
  const progressOffset = Math.floor(span * progressWithinMap(difficultyTier) * 0.45);
  const seedOffset = seed % Math.max(1, span + 1);
  return Math.min(range.max, range.min + progressOffset + seedOffset);
}

export function resolveGearItemLevel(
  difficultyTier: number,
  templateId?: string,
  deterministicSeed?: number,
): number {
  if (isExemptFromMapGearLevelPolicy(templateId)) {
    return Math.max(1, Math.floor(difficultyTier));
  }

  if (deterministicSeed !== undefined) {
    return deterministicGearItemLevel(difficultyTier, deterministicSeed);
  }

  return rollGearItemLevel(difficultyTier);
}
