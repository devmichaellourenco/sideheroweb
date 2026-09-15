import { difficultyTierForPhase, parsePhaseId, PhaseId } from '../campaign/CampaignIds';

/**
 * Mythic só pode aparecer em loja/loot de área a partir do Ato 3 de Valdris
 * (fases 21–30 do mapa 3 → tier global 121+).
 */
export const MYTHIC_UNLOCK_MAP_INDEX = 3;
export const MYTHIC_UNLOCK_PHASE_NUMBER = 21;
export const MYTHIC_UNLOCK_DIFFICULTY_TIER = difficultyTierForPhase(
  MYTHIC_UNLOCK_MAP_INDEX,
  MYTHIC_UNLOCK_PHASE_NUMBER,
);

export function isMythicGearUnlockedForTier(difficultyTier: number): boolean {
  return Math.max(1, Math.floor(difficultyTier)) >= MYTHIC_UNLOCK_DIFFICULTY_TIER;
}

export function isMythicGearUnlockedForPhase(phaseId: PhaseId): boolean {
  const { mapIndex, phaseNumber } = parsePhaseId(phaseId);
  return isMythicGearUnlockedForTier(difficultyTierForPhase(mapIndex, phaseNumber));
}
