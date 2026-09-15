import { parsePhaseId, PhaseId } from '../campaign/CampaignIds';

/** Reduz vida e dano dos inimigos em 30% (×0,7). */
export const PHASE_ENEMY_EASE_MULTIPLIER = 0.7;

const EASED_PHASE_RANGES: ReadonlyArray<{
  mapIndex: number;
  fromPhase: number;
  toPhase: number;
}> = [{ mapIndex: 1, fromPhase: 47, toPhase: 50 }];

export function enemyStatEaseForPhase(phaseId: PhaseId): number {
  const { mapIndex, phaseNumber } = parsePhaseId(phaseId);

  for (const range of EASED_PHASE_RANGES) {
    if (
      mapIndex === range.mapIndex &&
      phaseNumber >= range.fromPhase &&
      phaseNumber <= range.toPhase
    ) {
      return PHASE_ENEMY_EASE_MULTIPLIER;
    }
  }

  return 1;
}

export function resolvePhaseEnemyStatMultiplier(
  phaseId: PhaseId,
  baseStatMultiplier: number,
): number {
  return baseStatMultiplier * enemyStatEaseForPhase(phaseId);
}
