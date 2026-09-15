import { resolvePhase } from '../campaign/CampaignCatalog';
import { PhaseId } from '../campaign/CampaignIds';
import { getPhaseRewardOverride } from '../campaign/PhaseRewardOverrides';
import { spawnEnemiesForWave } from '../campaign/WaveEnemyFactory';
import { milestoneGoldScaleForPhase } from './MilestoneGoldCap';
import { referenceGoldPerPhaseForTier } from './EconomyReference';

/**
 * Teto de ouro por fase normal ≈ renda de referência do tier.
 * Fases com muitos inimigos não inflam a economia além da curva da loja.
 * Override `targetGold` do Balance Lab substitui o alvo (pode subir ou descer).
 */
export const PHASE_GOLD_TARGET_RATIO = 1.05;

const scaleCache = new Map<string, number>();

function cacheKey(phaseId: PhaseId, ignoreLabOverride: boolean): string {
  return `${phaseId}:${ignoreLabOverride ? 'eco' : 'lab'}`;
}

function rawPhaseGoldTotal(phaseId: PhaseId): number {
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

    total += enemies.reduce((sum, enemy) => sum + enemy.goldReward, 0);
  }

  return total;
}

export function phaseGoldScaleForPhase(
  phaseId: PhaseId,
  options?: { ignoreLabOverride?: boolean },
): number {
  const phase = resolvePhase(phaseId);
  if (!phase) {
    return 1;
  }

  const ignoreLabOverride = options?.ignoreLabOverride === true;
  const overrideTarget = ignoreLabOverride
    ? undefined
    : getPhaseRewardOverride(phaseId)?.targetGold;
  const hasOverride = overrideTarget !== undefined && overrideTarget > 0;

  if (!hasOverride && (phase.milestoneBoss || phase.seasonFinale)) {
    return 1;
  }

  const key = cacheKey(phaseId, ignoreLabOverride);
  const cached = scaleCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const rawTotal = rawPhaseGoldTotal(phaseId);
  let scale = 1;

  if (hasOverride) {
    scale = rawTotal <= 0 ? 1 : overrideTarget / rawTotal;
  } else {
    const target = referenceGoldPerPhaseForTier(phase.difficultyTier) * PHASE_GOLD_TARGET_RATIO;
    scale = rawTotal <= target ? 1 : target / rawTotal;
  }

  scaleCache.set(key, scale);
  return scale;
}

export function clearPhaseGoldScaleCache(): void {
  scaleCache.clear();
}

/**
 * Ouro esperado da fase (orçamento após escala/override do lab).
 * Pago via kills; preview do mapa usa este valor.
 */
export function effectivePhaseGoldTotal(phaseId: PhaseId): number {
  const overrideTarget = getPhaseRewardOverride(phaseId)?.targetGold;
  if (overrideTarget !== undefined && overrideTarget > 0) {
    return Math.floor(overrideTarget);
  }
  const rawTotal = rawPhaseGoldTotal(phaseId);
  if (rawTotal <= 0) return 0;
  return Math.max(0, Math.round(rawTotal * phaseGoldScaleForPhase(phaseId)));
}
