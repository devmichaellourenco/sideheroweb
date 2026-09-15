import { describe, expect, it } from 'vitest';
import { buildPhaseId } from './CampaignIds';
import { CampaignProgress } from './CampaignProgress';

describe('CampaignProgress', () => {
  it('mantém fase cleared no progresso (legado linear; board usa missões)', () => {
    const progress = CampaignProgress.initial().markCleared(buildPhaseId(1, 1), [buildPhaseId(1, 2)], 1);

    expect(progress.canPlayPhase(buildPhaseId(1, 1))).toBe(true);
    expect(progress.isCleared(buildPhaseId(1, 1))).toBe(true);
  });

  it('desbloqueia próxima fase ao marcar cleared', () => {
    const progress = CampaignProgress.initial().markCleared(buildPhaseId(1, 1), [buildPhaseId(1, 2)], 1);

    expect(progress.isUnlocked(buildPhaseId(1, 2))).toBe(true);
    expect(progress.highestTierReached).toBe(1);
  });

  it('bloqueia fases DLC mesmo se desbloqueadas no save', () => {
    const progress = CampaignProgress.restore({
      unlockedPhaseIds: [buildPhaseId(1, 1), buildPhaseId(5, 1)],
      clearedPhaseIds: [],
      selectedPhaseId: buildPhaseId(1, 1),
      highestTierReached: 1,
      seasonCompleted: false,
    });

    expect(progress.isUnlocked(buildPhaseId(5, 1))).toBe(true);
    expect(progress.canPlayPhase(buildPhaseId(5, 1))).toBe(false);
  });
});
