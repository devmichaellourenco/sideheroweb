import { describe, expect, it } from 'vitest';
import { buildPhaseId } from '../CampaignIds';
import { CampaignProgress } from '../CampaignProgress';
import { mainMissionId } from './MissionId';
import {
  completedMainIdsFromClearedPhases,
  migrateLegacyCampaignToMissionProgress,
} from './migrateLegacyCampaignToMissions';

describe('migrateLegacyCampaignToMissions', () => {
  it('marca marcos até o progresso cleared (ex.: cleared 1-12 → mains até 1-10)', () => {
    const cleared = [
      buildPhaseId(1, 1),
      buildPhaseId(1, 5),
      buildPhaseId(1, 10),
      buildPhaseId(1, 11),
      buildPhaseId(1, 12),
    ];
    const mains = completedMainIdsFromClearedPhases(cleared);
    expect(mains).toEqual(
      expect.arrayContaining([
        mainMissionId('1-1'),
        mainMissionId('1-10'),
      ]),
    );
    expect(mains).not.toContain(mainMissionId('1-5'));
    expect(mains).not.toContain(mainMissionId('1-15'));
    expect(mains).not.toContain(mainMissionId('1-20'));
  });

  it('CampaignProgress.restore migra save sem missionProgress', () => {
    const progress = CampaignProgress.restore({
      unlockedPhaseIds: [buildPhaseId(1, 1), buildPhaseId(1, 6)],
      clearedPhaseIds: [buildPhaseId(1, 1), buildPhaseId(1, 2), buildPhaseId(1, 5)],
      selectedPhaseId: buildPhaseId(1, 6),
      highestTierReached: 6,
      seasonCompleted: false,
    });

    expect(progress.missionProgress.completedMainIds).toEqual(
      expect.arrayContaining([mainMissionId('1-1')]),
    );
    expect(progress.missionProgress.completedMainIds).not.toContain(mainMissionId('1-5'));
    expect(progress.toProps().missionProgress?.completedMainIds.length).toBeGreaterThan(0);
  });

  it('migrate é idempotente quando missionProgress já tem dados', () => {
    const first = migrateLegacyCampaignToMissionProgress({
      unlockedPhaseIds: [buildPhaseId(1, 1)],
      clearedPhaseIds: [buildPhaseId(1, 1)],
      selectedPhaseId: buildPhaseId(1, 1),
      highestTierReached: 1,
      seasonCompleted: false,
    });
    const second = migrateLegacyCampaignToMissionProgress({
      unlockedPhaseIds: [buildPhaseId(1, 1)],
      clearedPhaseIds: [buildPhaseId(1, 1), buildPhaseId(1, 50)],
      selectedPhaseId: buildPhaseId(1, 1),
      highestTierReached: 50,
      seasonCompleted: false,
      missionProgress: first,
    });
    expect(second.completedMainIds).toEqual(first.completedMainIds);
  });
});
