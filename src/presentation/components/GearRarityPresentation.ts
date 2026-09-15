/** Raridades de gear exibidas na UI (borda / labels). */
export const GEAR_RARITY_ORDER = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
] as const;

export type GearRarityKey = (typeof GEAR_RARITY_ORDER)[number];

const RARITY_SET = new Set<string>(GEAR_RARITY_ORDER);

/** Rank numérico para ordenação (maior = mais raro). */
export const GEAR_RARITY_RANK: Record<GearRarityKey, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
  mythic: 6,
};

export function normalizeGearRarity(rarity: string | null | undefined): GearRarityKey {
  if (rarity && RARITY_SET.has(rarity)) {
    return rarity as GearRarityKey;
  }
  return 'common';
}

/** Classe CSS da superfície do item (`common`, `rare`, … ou `empty`). */
export function gearRaritySurfaceClass(rarity: string | null | undefined): string {
  if (!rarity || rarity === 'empty') return 'empty';
  return normalizeGearRarity(rarity);
}

export function compareGearRarityRank(left: string, right: string): number {
  return (
    (GEAR_RARITY_RANK[normalizeGearRarity(right)] ?? 0) -
    (GEAR_RARITY_RANK[normalizeGearRarity(left)] ?? 0)
  );
}
