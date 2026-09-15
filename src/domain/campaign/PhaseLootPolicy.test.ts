import { describe, expect, it } from 'vitest';
import { buildPhaseId } from './CampaignIds';
import { CampaignProgress } from './CampaignProgress';
import {
  grantsPhaseChests,
  isPhaseReplay,
  scalePhaseGold,
  scalePhaseXp,
} from './PhaseLootPolicy';

describe('PhaseLootPolicy', () => {
  it('concede baús na primeira conclusão do template', () => {
    const progress = CampaignProgress.initial();
    expect(grantsPhaseChests(progress, buildPhaseId(1, 1))).toBe(true);
  });

  it('não garante baú de 1ª clear após template cleared (normais usam chance normal)', () => {
    const progress = CampaignProgress.initial().markCleared(
      buildPhaseId(1, 2),
      [buildPhaseId(1, 3)],
      2,
    );
    expect(grantsPhaseChests(progress, buildPhaseId(1, 2))).toBe(false);
  });

  it('não aplica penalidade de ouro/XP (sem replay de fase)', () => {
    const progress = CampaignProgress.initial().markCleared(
      buildPhaseId(1, 2),
      [buildPhaseId(1, 3)],
      2,
    );
    const phaseId = buildPhaseId(1, 2);

    expect(isPhaseReplay(progress, phaseId)).toBe(false);
    expect(scalePhaseGold(100, progress, phaseId)).toBe(100);
    expect(scalePhaseXp(100, progress, phaseId)).toBe(100);
  });

  it('mantém 100% ouro e XP na primeira conclusão', () => {
    const progress = CampaignProgress.initial();
    const phaseId = buildPhaseId(1, 1);

    expect(scalePhaseGold(100, progress, phaseId)).toBe(100);
    expect(scalePhaseXp(100, progress, phaseId)).toBe(100);
  });
});
