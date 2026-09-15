import { afterEach, describe, expect, it } from 'vitest';
import { clearPhaseGoldScaleCache } from '../balance/PhaseGoldBudget';
import {
  clearPhaseXpScaleCache,
  effectivePhaseXpTotal,
  phaseXpScaleForPhase,
} from '../balance/PhaseXpBudget';
import { resolvePhase } from './CampaignCatalog';
import { buildPhaseId } from './CampaignIds';
import {
  normalizePhaseRewardOverride,
  setRuntimePhaseRewardOverrides,
} from './PhaseRewardOverrides';

describe('PhaseRewardOverrides', () => {
  afterEach(() => {
    setRuntimePhaseRewardOverrides(null);
    clearPhaseXpScaleCache();
    clearPhaseGoldScaleCache();
  });

  it('normalizePhaseRewardOverride aceita nome e/ou alvos', () => {
    expect(normalizePhaseRewardOverride({})).toBeNull();
    expect(normalizePhaseRewardOverride({ targetXp: 0 })).toBeNull();
    expect(normalizePhaseRewardOverride({ displayName: '  ' })).toBeNull();
    expect(normalizePhaseRewardOverride({ displayName: ' Estrada ' })).toEqual({
      displayName: 'Estrada',
      targetXp: undefined,
      targetGold: undefined,
    });
    expect(normalizePhaseRewardOverride({ targetXp: 40, targetGold: 12 })).toEqual({
      displayName: undefined,
      targetXp: 40,
      targetGold: 12,
    });
  });

  it('aplica displayName do override em resolvePhase', () => {
    const phaseId = buildPhaseId(1, 1);
    const baseline = resolvePhase(phaseId);
    expect(baseline).not.toBeNull();

    setRuntimePhaseRewardOverrides({
      [phaseId]: { displayName: 'Nome do Lab' },
    });
    clearPhaseXpScaleCache();
    clearPhaseGoldScaleCache();

    expect(resolvePhase(phaseId)?.displayName).toBe('Nome do Lab');
  });

  it('targetXp define o XP efetivo da fase (payout na vitória)', () => {
    const phaseId = buildPhaseId(1, 1);
    const baselineXp = effectivePhaseXpTotal(phaseId);
    expect(baselineXp).toBeGreaterThan(0);

    const targetXp = Math.max(baselineXp * 3, baselineXp + 10);
    setRuntimePhaseRewardOverrides({ [phaseId]: { targetXp } });
    clearPhaseXpScaleCache();

    expect(effectivePhaseXpTotal(phaseId)).toBe(targetXp);
    expect(phaseXpScaleForPhase(phaseId)).toBeCloseTo(targetXp / baselineXp, 5);
  });

  it('não entra em recursão ao resolver XP de milestone com targetXp', () => {
    const phaseId = buildPhaseId(1, 50);
    const phase = resolvePhase(phaseId);
    expect(phase?.milestoneBoss || phase?.seasonFinale).toBeTruthy();

    const baselineXp = effectivePhaseXpTotal(phaseId);
    expect(baselineXp).toBeGreaterThan(0);

    setRuntimePhaseRewardOverrides({ [phaseId]: { targetXp: Math.max(baselineXp * 2, 40) } });
    clearPhaseXpScaleCache();

    expect(() => phaseXpScaleForPhase(phaseId)).not.toThrow();
    expect(phaseXpScaleForPhase(phaseId)).toBeGreaterThan(0);
    expect(effectivePhaseXpTotal(phaseId)).toBeGreaterThan(0);
  });
});
