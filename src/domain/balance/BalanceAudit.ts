import { buildPhaseId, difficultyTierForPhase, parsePhaseId, PhaseId } from '../campaign/CampaignIds';
import { EncounterResolver } from '../campaign/EncounterResolver';
import { calculateForgeSalvageGold } from '../forge/ForgeSalvageGoldCatalog';
import { referenceGoldPerPhaseForTier } from './EconomyReference';
import { stageScalingEntryForTier } from '../progression/StageScalingCatalog';
import {
  calculateReferenceShopPrice,
  calculateShopRefreshCost,
} from '../shop/ShopPricing';
import { getShopMaxRarityIndex } from '../shop/ShopCatalog';
import { GearRarity } from '../entities/Gear';

export type BalanceTierBand = 'early' | 'mid' | 'late';

export interface PhaseEconomySnapshot {
  phaseId: PhaseId;
  tier: number;
  waveCount: number;
  totalGold: number;
  totalEnemyHp: number;
  bossHp: number;
  estimatedClearSeconds: number;
}

export interface EconomyRatioSnapshot {
  tier: number;
  band: BalanceTierBand;
  goldPerPhase: number;
  epicShopPrice: number;
  rareShopPrice: number;
  shopRefreshCost: number;
  epicPhasesToAfford: number;
  rarePhasesToAfford: number;
  epicSalvageGold: number;
  salvagesPerEpic: number;
}

export interface TierBandAudit {
  band: BalanceTierBand;
  tiers: number[];
  minGoldPerPhase: number;
  maxGoldPerPhase: number;
  minClearSeconds: number;
  maxClearSeconds: number;
  minEpicPhasesToAfford: number;
  maxEpicPhasesToAfford: number;
}

/** Tiers âncora usados na auditoria do jogo base v1 (spec game-balance). */
export const BALANCE_ANCHOR_TIERS = [1, 10, 25, 26, 50, 100, 150, 200] as const;

/** Tiers âncora do catálogo completo (DLC / perfil full). */
export const FULL_CAMPAIGN_ANCHOR_TIERS = [250, 500] as const;

const resolver = new EncounterResolver();

interface PhaseCombatTotals {
  phaseId: PhaseId;
  tier: number;
  waveCount: number;
  totalGold: number;
  totalEnemyHp: number;
  bossHp: number;
}

function sumPhaseCombat(phaseId: PhaseId): PhaseCombatTotals | null {
  const phase = parsePhaseId(phaseId);
  const tier = difficultyTierForPhase(phase.mapIndex, phase.phaseNumber);
  let totalGold = 0;
  let totalEnemyHp = 0;
  let bossHp = 0;
  let waveCount = 0;

  for (let waveIndex = 0; ; waveIndex += 1) {
    const encounter = resolver.resolve(phaseId, waveIndex);
    if (!encounter) break;

    waveCount += 1;
    for (const enemy of encounter.enemies) {
      totalGold += enemy.goldReward;
      totalEnemyHp += enemy.stats.maxHealth;
      if (enemy.role === 'boss') {
        bossHp += enemy.stats.maxHealth;
      }
    }
  }

  if (waveCount === 0) return null;

  return { phaseId, tier, waveCount, totalGold, totalEnemyHp, bossHp };
}

export function tierBandForTier(tier: number): BalanceTierBand {
  if (tier <= 25) return 'early';
  if (tier <= 100) return 'mid';
  return 'late';
}

export function phaseIdForTier(tier: number): PhaseId {
  const safeTier = Math.max(1, Math.min(500, Math.floor(tier)));
  const mapIndex = Math.ceil(safeTier / 50);
  const phaseNumber = safeTier - (mapIndex - 1) * 50;
  return buildPhaseId(mapIndex, phaseNumber);
}

/**
 * DPS de referência para playtest idle (party de 3 heróis com progressão esperada).
 */
export function referencePartyDpsForTier(tier: number): number {
  const anchor = sumPhaseCombat(phaseIdForTier(tier));
  const band = tierBandForTier(tier);
  const targetMid =
    (BALANCE_TARGETS.clearSeconds[band].min + BALANCE_TARGETS.clearSeconds[band].max) / 2;

  if (!anchor || anchor.totalEnemyHp <= 0) {
    return 4.2 * Math.pow(tier, 0.35);
  }

  return anchor.totalEnemyHp / targetMid;
}

export function estimateClearSeconds(
  totalEnemyHp: number,
  tier: number,
  referenceHp = totalEnemyHp,
): number {
  const band = tierBandForTier(tier);
  const targetMid =
    (BALANCE_TARGETS.clearSeconds[band].min + BALANCE_TARGETS.clearSeconds[band].max) / 2;

  if (referenceHp <= 0) {
    return totalEnemyHp / Math.max(1, referencePartyDpsForTier(tier));
  }

  return (totalEnemyHp / referenceHp) * targetMid;
}

export function summarizePhaseEconomy(phaseId: PhaseId): PhaseEconomySnapshot | null {
  const combat = sumPhaseCombat(phaseId);
  if (!combat) return null;

  const anchor = sumPhaseCombat(phaseIdForTier(combat.tier));

  return {
    ...combat,
    estimatedClearSeconds: estimateClearSeconds(
      combat.totalEnemyHp,
      combat.tier,
      anchor?.totalEnemyHp ?? combat.totalEnemyHp,
    ),
  };
}

export function summarizeEconomyRatios(tier: number): EconomyRatioSnapshot {
  const phaseId = phaseIdForTier(tier);
  const economy = summarizePhaseEconomy(phaseId);
  const goldPerPhase = economy?.totalGold ?? referenceGoldPerPhaseForTier(tier);
  const referenceGold = referenceGoldPerPhaseForTier(tier);
  const epicShopPrice = calculateReferenceShopPrice(tier, 'epic');
  const rareShopPrice = calculateReferenceShopPrice(tier, 'rare');
  const epicSalvageGold = calculateForgeSalvageGold('epic', tier);

  return {
    tier,
    band: tierBandForTier(tier),
    goldPerPhase,
    epicShopPrice,
    rareShopPrice,
    shopRefreshCost: calculateShopRefreshCost(tier),
    epicPhasesToAfford: epicShopPrice / Math.max(1, referenceGold),
    rarePhasesToAfford: rareShopPrice / Math.max(1, referenceGold),
    epicSalvageGold,
    salvagesPerEpic: epicShopPrice / Math.max(1, epicSalvageGold),
  };
}

export function auditTierBand(band: BalanceTierBand, tiers: readonly number[]): TierBandAudit {
  const snapshots = tiers
    .filter((tier) => tierBandForTier(tier) === band)
    .map((tier) => summarizeEconomyRatios(tier));
  const clears = tiers
    .filter((tier) => tierBandForTier(tier) === band)
    .map((tier) => summarizePhaseEconomy(phaseIdForTier(tier))?.estimatedClearSeconds ?? 0);

  return {
    band,
    tiers: [...tiers.filter((tier) => tierBandForTier(tier) === band)],
    minGoldPerPhase: Math.min(...snapshots.map((entry) => entry.goldPerPhase)),
    maxGoldPerPhase: Math.max(...snapshots.map((entry) => entry.goldPerPhase)),
    minClearSeconds: Math.min(...clears),
    maxClearSeconds: Math.max(...clears),
    minEpicPhasesToAfford: Math.min(...snapshots.map((entry) => entry.epicPhasesToAfford)),
    maxEpicPhasesToAfford: Math.max(...snapshots.map((entry) => entry.epicPhasesToAfford)),
  };
}

/** Faixas alvo documentadas na spec de balanceamento. */
export const BALANCE_TARGETS = {
  clearSeconds: {
    early: { min: 18, max: 130 },
    mid: { min: 40, max: 200 },
    late: { min: 55, max: 320 },
  },
  epicPhasesToAfford: {
    early: { min: 1.5, max: 9 },
    mid: { min: 2, max: 12 },
    late: { min: 2.5, max: 14 },
  },
  scalingMonotone: true,
} as const;

export function isClearSecondsInBand(band: BalanceTierBand, seconds: number): boolean {
  const target = BALANCE_TARGETS.clearSeconds[band];
  return seconds >= target.min && seconds <= target.max;
}

export function isEpicAffordBandInRange(band: BalanceTierBand, phasesToAfford: number): boolean {
  const target = BALANCE_TARGETS.epicPhasesToAfford[band];
  return phasesToAfford >= target.min && phasesToAfford <= target.max;
}

export function scalingEntryMonotone(leftTier: number, rightTier: number): boolean {
  if (rightTier <= leftTier) return true;

  const left = stageScalingEntryForTier(leftTier);
  const right = stageScalingEntryForTier(rightTier);

  return (
    right.atkDmgMultiplier >= left.atkDmgMultiplier &&
    right.hpMultiplier >= left.hpMultiplier &&
    right.goldMultiplier >= left.goldMultiplier &&
    right.expMultiplier >= left.expMultiplier
  );
}

export function maxShopRarityIndexForMainProgress(
  completedMainIds: readonly string[],
  difficultyTier = 1,
): number {
  return getShopMaxRarityIndex(completedMainIds, difficultyTier);
}

/** Compat: só o gate mythic por tier; demais caps exigem mains. */
export function maxShopRarityIndexForTier(tier: number): number {
  return getShopMaxRarityIndex([], tier);
}

export function shopCapRarityAtTier(tier: number): GearRarity {
  const index = getShopMaxRarityIndex([], tier);
  const rarities: GearRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
  return rarities[index] ?? 'mythic';
}

export { stageScalingEntryForTier } from '../progression/StageScalingCatalog';
export { referenceGoldPerPhaseForTier } from './EconomyReference';
