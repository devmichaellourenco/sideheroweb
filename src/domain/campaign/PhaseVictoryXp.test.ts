import { describe, expect, it } from 'vitest';
import { effectivePhaseXpTotal } from '../balance/PhaseXpBudget';
import { GameState } from '../entities/GameState';
import { buildPhaseId } from './CampaignIds';
import { grantPhaseVictoryXp } from './PhaseVictoryXp';

describe('PhaseVictoryXp', () => {
  it('concede o XP efetivo da fase à party ativa na vitória', () => {
    const phaseId = buildPhaseId(1, 1);
    const state = GameState.initial();
    const expected = effectivePhaseXpTotal(phaseId);
    expect(expected).toBeGreaterThan(0);

    const result = grantPhaseVictoryXp(state, phaseId);

    expect(result.xpGranted).toBe(expected);
    expect(result.state.activeHeroes()[0].experience.current).toBe(expected);
  });
});
