import { describe, expect, it } from 'vitest';
import { buildPhaseId } from '../campaign/CampaignIds';
import {
  enemyStatEaseForPhase,
  PHASE_ENEMY_EASE_MULTIPLIER,
  resolvePhaseEnemyStatMultiplier,
} from './PhaseEnemyEase';

describe('PhaseEnemyEase', () => {
  it('aplica facilidade nas fases 1-47 a 1-50 de Stendra', () => {
    expect(enemyStatEaseForPhase(buildPhaseId(1, 46))).toBe(1);
    expect(enemyStatEaseForPhase(buildPhaseId(1, 47))).toBe(PHASE_ENEMY_EASE_MULTIPLIER);
    expect(enemyStatEaseForPhase(buildPhaseId(1, 48))).toBe(PHASE_ENEMY_EASE_MULTIPLIER);
    expect(enemyStatEaseForPhase(buildPhaseId(1, 49))).toBe(PHASE_ENEMY_EASE_MULTIPLIER);
    expect(enemyStatEaseForPhase(buildPhaseId(1, 50))).toBe(PHASE_ENEMY_EASE_MULTIPLIER);
  });

  it('não altera outros mapas', () => {
    expect(enemyStatEaseForPhase(buildPhaseId(2, 47))).toBe(1);
    expect(enemyStatEaseForPhase(buildPhaseId(2, 50))).toBe(1);
  });

  it('compõe com statMultiplier base da fase', () => {
    expect(resolvePhaseEnemyStatMultiplier(buildPhaseId(1, 50), 1.5)).toBeCloseTo(1.05);
    expect(resolvePhaseEnemyStatMultiplier(buildPhaseId(1, 47), 1.12)).toBeCloseTo(0.784);
  });
});
