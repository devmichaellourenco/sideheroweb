import { describe, expect, it } from 'vitest';
import { buildPhaseId } from '../campaign/CampaignIds';
import { mainMissionId } from '../campaign/missions/MissionId';
import { ENEMY_QUICK_PHASE_TEST_HP } from '../combat/EnemyCombatBalance';
import {
  auditTierBand,
  BALANCE_ANCHOR_TIERS,
  BALANCE_TARGETS,
  isClearSecondsInBand,
  isEpicAffordBandInRange,
  maxShopRarityIndexForMainProgress,
  maxShopRarityIndexForTier,
  phaseIdForTier,
  referenceGoldPerPhaseForTier,
  scalingEntryMonotone,
  stageScalingEntryForTier,
  summarizeEconomyRatios,
  summarizePhaseEconomy,
  tierBandForTier,
} from './BalanceAudit';

describe('BalanceAudit — curva por tier', () => {
  it('mapeia faixas early / mid / late conforme spec (jogo base v1)', () => {
    expect(tierBandForTier(1)).toBe('early');
    expect(tierBandForTier(25)).toBe('early');
    expect(tierBandForTier(26)).toBe('mid');
    expect(tierBandForTier(100)).toBe('mid');
    expect(tierBandForTier(101)).toBe('late');
    expect(tierBandForTier(200)).toBe('late');
    expect(tierBandForTier(500)).toBe('late');
  });

  it('converte tier global em phaseId da campanha', () => {
    expect(phaseIdForTier(1)).toBe('1-1');
    expect(phaseIdForTier(25)).toBe('1-25');
    expect(phaseIdForTier(26)).toBe('1-26');
    expect(phaseIdForTier(51)).toBe('2-1');
    expect(phaseIdForTier(500)).toBe('10-50');
  });

  it('mantém scaling monotônico entre tiers âncora', () => {
    for (let index = 1; index < BALANCE_ANCHOR_TIERS.length; index += 1) {
      const left = BALANCE_ANCHOR_TIERS[index - 1];
      const right = BALANCE_ANCHOR_TIERS[index];
      expect(scalingEntryMonotone(left, right)).toBe(true);
    }
  });

  it('aumenta ouro de scaling e HP por fase nos tiers âncora', () => {
    const goldMultipliers = BALANCE_ANCHOR_TIERS.map(
      (tier) => stageScalingEntryForTier(tier).goldMultiplier,
    );
    const hpByTier = BALANCE_ANCHOR_TIERS.map(
      (tier) => summarizePhaseEconomy(phaseIdForTier(tier))?.totalEnemyHp ?? 0,
    );

    for (let index = 1; index < goldMultipliers.length; index += 1) {
      expect(goldMultipliers[index]).toBeGreaterThanOrEqual(goldMultipliers[index - 1]);
    }

    // HP total sobe na curva longa; fases vizinhas podem oscilar por densidade de wave (ex. 1-25→1-26).
    expect(hpByTier[hpByTier.length - 1]).toBeGreaterThan(hpByTier[0]);
    if (!ENEMY_QUICK_PHASE_TEST_HP) {
      for (let index = 1; index < hpByTier.length; index += 1) {
        expect(hpByTier[index]).toBeGreaterThanOrEqual(hpByTier[index - 1] * 0.7);
      }
    }
  });

  it('milestone 1-50 tem mais ouro e HP que fase normal do mesmo mapa', () => {
    const normal = summarizePhaseEconomy(buildPhaseId(1, 25))!;
    const milestone = summarizePhaseEconomy(buildPhaseId(1, 50))!;

    expect(milestone.totalGold).toBeGreaterThan(normal.totalGold);
    if (!ENEMY_QUICK_PHASE_TEST_HP) {
      expect(milestone.totalEnemyHp).toBeGreaterThan(normal.totalEnemyHp);
    }
    expect(milestone.bossHp).toBeGreaterThan(0);
  });
});

describe('BalanceAudit — economia ouro vs loja/forja', () => {
  it('cap de raridade da loja evolui nos marcos de main (BAL-015)', () => {
    expect(maxShopRarityIndexForMainProgress([])).toBe(1);
    expect(maxShopRarityIndexForMainProgress([mainMissionId('1-5')])).toBe(2);
    expect(maxShopRarityIndexForMainProgress([mainMissionId('1-50')])).toBe(3);
    expect(maxShopRarityIndexForMainProgress([mainMissionId('2-50')])).toBe(4);
    expect(maxShopRarityIndexForMainProgress([mainMissionId('3-1')])).toBe(4);
    expect(maxShopRarityIndexForMainProgress([mainMissionId('3-21')])).toBe(5);
    // Mythic também por tier ≥ 121 (gate legado Valdris Ato 3)
    expect(maxShopRarityIndexForTier(120)).toBe(1);
    expect(maxShopRarityIndexForTier(121)).toBe(5);
  });

  it('épico na loja custa múltiplas fases de renda de referência, sem starvation nos tiers âncora', () => {
    for (const tier of BALANCE_ANCHOR_TIERS) {
      const ratios = summarizeEconomyRatios(tier);
      const band = tierBandForTier(tier);
      const referenceGold = referenceGoldPerPhaseForTier(tier);

      expect(ratios.epicPhasesToAfford).toBeGreaterThan(1);
      expect(isEpicAffordBandInRange(band, ratios.epicPhasesToAfford)).toBe(true);
      expect(ratios.epicShopPrice).toBeGreaterThan(referenceGold * 2);
      expect(ratios.shopRefreshCost).toBeLessThan(referenceGold * 3);
      if (tier >= 10) {
        expect(ratios.salvagesPerEpic).toBeGreaterThan(1);
      }
    }
  });

  it('resume bandas early/mid/late com métricas agregadas', () => {
    const early = auditTierBand('early', BALANCE_ANCHOR_TIERS);
    const mid = auditTierBand('mid', BALANCE_ANCHOR_TIERS);
    const late = auditTierBand('late', BALANCE_ANCHOR_TIERS);

    expect(early.tiers).toEqual([1, 10, 25]);
    expect(mid.tiers).toEqual([26, 50, 100]);
    expect(late.tiers).toEqual([150, 200]);
    expect(early.maxGoldPerPhase).toBeLessThan(mid.minGoldPerPhase * 4);
    expect(mid.maxGoldPerPhase).toBeLessThan(late.minGoldPerPhase * 2);
  });
});

describe('BalanceAudit — tempo de clear estimado', () => {
  it('mantém clears dos tiers âncora dentro das faixas alvo', () => {
    for (const tier of BALANCE_ANCHOR_TIERS) {
      const snapshot = summarizePhaseEconomy(phaseIdForTier(tier))!;
      const band = tierBandForTier(tier);
      const target = BALANCE_TARGETS.clearSeconds[band];

      expect(snapshot.estimatedClearSeconds).toBeGreaterThanOrEqual(target.min);
      expect(snapshot.estimatedClearSeconds).toBeLessThanOrEqual(target.max);
      expect(isClearSecondsInBand(band, snapshot.estimatedClearSeconds)).toBe(true);
    }
  });

  it('finale 4-50 é o marco com mais HP entre os milestones do jogo base', () => {
    if (ENEMY_QUICK_PHASE_TEST_HP) return;

    const finale = summarizePhaseEconomy(buildPhaseId(4, 50))!;
    const mid = summarizePhaseEconomy(buildPhaseId(3, 50))!;

    expect(finale.totalEnemyHp).toBeGreaterThanOrEqual(mid.totalEnemyHp);
    expect(finale.totalEnemyHp).toBeGreaterThan(mid.totalEnemyHp);
    expect(finale.estimatedClearSeconds).toBeGreaterThanOrEqual(mid.estimatedClearSeconds);
    expect(isClearSecondsInBand('late', finale.estimatedClearSeconds)).toBe(true);
  });
});

describe('BalanceAudit — BAL-007 milestone gold', () => {
  it('marcos X-50 não trivializam épico na loja', () => {
    for (const mapIndex of [1, 2, 4]) {
      const phaseId = buildPhaseId(mapIndex, 50);
      const economy = summarizePhaseEconomy(phaseId)!;
      const ratios = summarizeEconomyRatios(economy.tier);

      expect(ratios.epicShopPrice / economy.totalGold).toBeGreaterThanOrEqual(2);
    }
  });
});
