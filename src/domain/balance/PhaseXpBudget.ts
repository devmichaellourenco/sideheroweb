import { resolvePhase } from '../campaign/CampaignCatalog';
import { PhaseId } from '../campaign/CampaignIds';
import { getPhaseRewardOverride } from '../campaign/PhaseRewardOverrides';
import { spawnEnemiesForWave } from '../campaign/WaveEnemyFactory';
import { milestoneGoldScaleForPhase } from './MilestoneGoldCap';
import { resolveCampaignKillXp } from './CampaignXpScaling';

/**
 * XP de catálogo “legado” (soma teórica por papel dos inimigos).
 * Usado só como fallback / baseline do lab quando a fase não tem `targetXp`.
 * No jogo o payout é sempre `effectivePhaseXpTotal` na vitória.
 */
export function catalogPhaseXpTotal(phaseId: PhaseId): number {
  const phase = resolvePhase(phaseId);
  if (!phase) return 0;

  const milestoneGoldScale = milestoneGoldScaleForPhase(phase);
  let total = 0;

  for (let waveIndex = 0; waveIndex < phase.waves.length; waveIndex += 1) {
    const wave = phase.waves[waveIndex];
    const enemies = spawnEnemiesForWave(wave, {
      phaseId,
      waveIndex,
      difficultyTier: phase.difficultyTier,
      isBossWave: waveIndex === phase.waves.length - 1,
      statMultiplier: phase.statMultiplier ?? 1,
      milestoneGoldScale,
      applyPhaseGoldBudget: false,
      applyPhaseRewardOverrides: false,
    });

    for (const enemy of enemies) {
      const roleScale =
        enemy.role === 'boss' ? 1.6 : enemy.role === 'elite' ? 1.25 : 1;
      const xpBase = enemy.role === 'boss' ? 8 : enemy.role === 'elite' ? 5 : 2;
      total += resolveCampaignKillXp(xpBase, phase.difficultyTier, roleScale);
    }
  }

  return total;
}

/** @deprecated Escala por kill — XP agora é lump sum na vitória; mantido para lab/legacy. */
export function phaseXpScaleForPhase(phaseId: PhaseId): number {
  const override = getPhaseRewardOverride(phaseId);
  const targetXp = override?.targetXp;
  if (targetXp === undefined || targetXp <= 0) {
    return 1;
  }
  const rawTotal = catalogPhaseXpTotal(phaseId);
  return rawTotal <= 0 ? 1 : targetXp / rawTotal;
}

export function clearPhaseXpScaleCache(): void {
  // Cache removido; API mantida para callers do lab.
}

/**
 * XP que a fase paga na vitória: `targetXp` do override (fonte única do lab)
 * ou fallback do catálogo por composição. Independente do número de kills.
 */
export function effectivePhaseXpTotal(phaseId: PhaseId): number {
  const targetXp = getPhaseRewardOverride(phaseId)?.targetXp;
  if (targetXp !== undefined && targetXp > 0) return targetXp;
  return catalogPhaseXpTotal(phaseId);
}
