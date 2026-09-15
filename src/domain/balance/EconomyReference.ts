import { GearRarity } from '../entities/Gear';
import { stageScalingEntryForTier } from '../progression/StageScalingCatalog';

export type EconomyTierBand = 'early' | 'mid' | 'late';

/** Ouro médio da fase 1-1 — âncora da curva de renda. */
export const REFERENCE_GOLD_BASE = 15;

/** Expoente que acompanha a curva de `goldMultiplier` sem amplificar picos de fase. */
export const REFERENCE_GOLD_EXPONENT = 1.15;

/** Fases de renda de referência para comprar um item na loja, por banda. */
export const SHOP_PHASES_TO_AFFORD: Record<GearRarity, Record<EconomyTierBand, number>> = {
  common: { early: 0.4, mid: 0.5, late: 0.6 },
  uncommon: { early: 1, mid: 1.2, late: 1.4 },
  rare: { early: 2, mid: 2.5, late: 3 },
  epic: { early: 5.25, mid: 7, late: 8.25 },
  legendary: { early: 9, mid: 10, late: 11 },
  mythic: { early: 12, mid: 13, late: 14 },
};

export function economyTierBandForTier(tier: number): EconomyTierBand {
  if (tier <= 25) return 'early';
  if (tier <= 60) return 'mid';
  return 'late';
}

export function referenceGoldPerPhaseForTier(tier: number): number {
  const goldFactor = stageScalingEntryForTier(tier).goldMultiplier / 100;
  return Math.floor(REFERENCE_GOLD_BASE * goldFactor ** REFERENCE_GOLD_EXPONENT);
}

export function shopPhasesToAffordForRarity(tier: number, rarity: GearRarity): number {
  const band = economyTierBandForTier(tier);
  return SHOP_PHASES_TO_AFFORD[rarity][band];
}
