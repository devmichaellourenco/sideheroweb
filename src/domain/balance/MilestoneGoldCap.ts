import { PhaseDefinition } from '../campaign/PhaseDefinition';
import { PhaseId } from '../campaign/CampaignIds';
import { spawnEnemiesForWave } from '../campaign/WaveEnemyFactory';
import { calculateReferenceShopPrice } from '../shop/ShopPricing';
import { referenceGoldPerPhaseForTier } from './EconomyReference';

/** Épico na loja deve custar pelo menos N clears de milestone (BAL-007). */
export const MIN_EPIC_PHASES_ON_MILESTONE_GOLD = 2;

/** Milestone nunca paga menos que este múltiplo da renda de referência do tier. */
export const MILESTONE_GOLD_FLOOR_RATIO = 1.5;

const scaleCache = new Map<PhaseId, number>();

export function milestoneGoldCapForTier(tier: number): number {
  const epicPrice = calculateReferenceShopPrice(tier, 'epic');
  return Math.floor(epicPrice / MIN_EPIC_PHASES_ON_MILESTONE_GOLD);
}

export function milestoneGoldFloorForTier(tier: number): number {
  return Math.floor(referenceGoldPerPhaseForTier(tier) * MILESTONE_GOLD_FLOOR_RATIO);
}

function rawPhaseGoldTotal(phase: PhaseDefinition): number {
  let total = 0;

  for (let waveIndex = 0; waveIndex < phase.waves.length; waveIndex += 1) {
    const wave = phase.waves[waveIndex];
    const isBossWave = waveIndex === phase.waves.length - 1;
    const enemies = spawnEnemiesForWave(wave, {
      phaseId: phase.id,
      waveIndex,
      difficultyTier: phase.difficultyTier,
      isBossWave,
      statMultiplier: phase.statMultiplier ?? 1,
      milestoneGoldScale: 1,
      applyPhaseGoldBudget: false,
      // Evita recursão: spawn → phaseXpScale → rawPhaseXp → milestoneGoldScale → spawn.
      applyPhaseRewardOverrides: false,
    });

    total += enemies.reduce((sum, enemy) => sum + enemy.goldReward, 0);
  }

  return total;
}

export function milestoneGoldScaleForPhase(phase: PhaseDefinition): number {
  if (!phase.milestoneBoss && !phase.seasonFinale) {
    return 1;
  }

  const cached = scaleCache.get(phase.id);
  if (cached !== undefined) {
    return cached;
  }

  const rawGold = rawPhaseGoldTotal(phase);
  const cap = milestoneGoldCapForTier(phase.difficultyTier);

  const scale = rawGold <= cap ? 1 : cap / rawGold;
  scaleCache.set(phase.id, scale);
  return scale;
}

export function clearMilestoneGoldScaleCache(): void {
  scaleCache.clear();
}
