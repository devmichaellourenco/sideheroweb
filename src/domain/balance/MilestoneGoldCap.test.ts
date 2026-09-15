import { describe, expect, it } from 'vitest';
import { buildPhaseId } from '../campaign/CampaignIds';
import { summarizePhaseEconomy, summarizeEconomyRatios } from './BalanceAudit';
import {
  clearMilestoneGoldScaleCache,
  MIN_EPIC_PHASES_ON_MILESTONE_GOLD,
  milestoneGoldCapForTier,
  milestoneGoldFloorForTier,
  milestoneGoldScaleForPhase,
} from './MilestoneGoldCap';
import { resolvePhase } from '../campaign/CampaignCatalog';

const MILESTONE_PHASE_IDS = [
  buildPhaseId(1, 50),
  buildPhaseId(2, 50),
  buildPhaseId(5, 50),
  buildPhaseId(10, 50),
] as const;

describe('MilestoneGoldCap — BAL-007', () => {
  it('reduz ouro bruto quando milestone excede o teto', () => {
    clearMilestoneGoldScaleCache();
    const phase = resolvePhase(buildPhaseId(1, 50))!;
    const scale = milestoneGoldScaleForPhase(phase);

    expect(scale).toBeLessThan(1);
    expect(scale).toBeGreaterThan(0);
  });

  it('não altera fases normais', () => {
    clearMilestoneGoldScaleCache();
    const phase = resolvePhase(buildPhaseId(2, 49))!;

    expect(milestoneGoldScaleForPhase(phase)).toBe(1);
  });

  it('milestones pagam pelo menos o piso de renda de referência (v1)', () => {
    clearMilestoneGoldScaleCache();

    // Âncoras do jogo base; DLC (5-50+) fica fora até recalibrar ouro BAL-013.
    for (const phaseId of [buildPhaseId(1, 50), buildPhaseId(2, 50)] as const) {
      const phase = resolvePhase(phaseId)!;
      const economy = summarizePhaseEconomy(phaseId)!;
      const floor = milestoneGoldFloorForTier(phase.difficultyTier);

      expect(economy.totalGold).toBeGreaterThanOrEqual(Math.floor(floor * 0.95));
    }
  });

  it('épico na loja custa pelo menos N clears de milestone nos marcos principais', () => {
    clearMilestoneGoldScaleCache();

    for (const phaseId of MILESTONE_PHASE_IDS) {
      const economy = summarizePhaseEconomy(phaseId)!;
      const ratios = summarizeEconomyRatios(economy.tier);
      const phasesToEpicOnMilestone = ratios.epicShopPrice / economy.totalGold;

      expect(phasesToEpicOnMilestone).toBeGreaterThanOrEqual(MIN_EPIC_PHASES_ON_MILESTONE_GOLD);
      expect(economy.totalGold).toBeLessThanOrEqual(milestoneGoldCapForTier(economy.tier) + 3);
    }
  });
});
