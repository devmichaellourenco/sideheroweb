import { describe, expect, it, beforeEach } from 'vitest';
import { buildPhaseId } from '../campaign/CampaignIds';
import { phaseIdForTier, summarizePhaseEconomy, summarizeEconomyRatios } from './BalanceAudit';
import { referenceGoldPerPhaseForTier } from './EconomyReference';
import {
  clearPhaseGoldScaleCache,
  effectivePhaseGoldTotal,
  PHASE_GOLD_TARGET_RATIO,
  phaseGoldScaleForPhase,
} from './PhaseGoldBudget';

describe('PhaseGoldBudget', () => {
  beforeEach(() => {
    clearPhaseGoldScaleCache();
  });

  it('não reduz fases com poucos inimigos no tier 1', () => {
    expect(phaseGoldScaleForPhase(buildPhaseId(1, 1))).toBe(1);
  });

  it('effectivePhaseGoldTotal acompanha a escala da fase', () => {
    const phaseId = buildPhaseId(1, 1);
    expect(effectivePhaseGoldTotal(phaseId)).toBeGreaterThan(0);

    const crowded = buildPhaseId(1, 20);
    expect(phaseGoldScaleForPhase(crowded)).toBeLessThan(1);
    const economy = summarizePhaseEconomy(crowded)!;
    expect(effectivePhaseGoldTotal(crowded)).toBeGreaterThan(0);
    expect(Math.abs(effectivePhaseGoldTotal(crowded) - economy.totalGold)).toBeLessThanOrEqual(2);
  });

  it('reduz fases normais com muitos inimigos para a renda de referência', () => {
    const phaseId = buildPhaseId(1, 20);
    const scale = phaseGoldScaleForPhase(phaseId);
    const economy = summarizePhaseEconomy(phaseId)!;
    const reference = referenceGoldPerPhaseForTier(20);

    expect(scale).toBeLessThan(1);
    expect(economy.totalGold / reference).toBeLessThanOrEqual(PHASE_GOLD_TARGET_RATIO + 0.02);
  });

  it('preserva milestones com orçamento próprio', () => {
    const phaseId = buildPhaseId(1, 50);
    expect(phaseGoldScaleForPhase(phaseId)).toBe(1);

    const economy = summarizePhaseEconomy(phaseId)!;
    const ratios = summarizeEconomyRatios(economy.tier);
    expect(ratios.epicShopPrice / economy.totalGold).toBeGreaterThanOrEqual(2);
  });

  it('mantém épico na loja custando várias fases nos tiers âncora iniciais', () => {
    for (const tier of [10, 20, 25]) {
      const economy = summarizePhaseEconomy(phaseIdForTier(tier))!;
      const ratios = summarizeEconomyRatios(tier);
      expect(ratios.epicShopPrice / economy.totalGold).toBeGreaterThanOrEqual(4.5);
    }
  });
});
