import { describe, expect, it } from 'vitest';
import {
  isCelebrationNamedGear,
  isChapterMilestonePhaseId,
  resolveMilestoneVictoryPresentation,
} from './MilestoneRewardPresentation';

describe('MilestoneRewardPresentation', () => {
  it('identifica fases X-50 como marco', () => {
    expect(isChapterMilestonePhaseId('1-50')).toBe(true);
    expect(isChapterMilestonePhaseId('1-49')).toBe(false);
  });

  it('resolve copy de vitória para marcos principais', () => {
    const presentation = resolveMilestoneVictoryPresentation('1-50', 'Saci');

    expect(presentation.isMilestone).toBe(true);
    expect(presentation.isMajorMilestone).toBe(true);
    expect(presentation.chapterTitle).toBe('Guardião Elemental');
  });

  it('identifica gear nomeado para celebração', () => {
    expect(
      isCelebrationNamedGear({
        id: 'g1',
        name: 'Ignus Ix',
        templateId: 'ignus_ix',
        slot: 'accessory',
        rarity: 'legendary',
        isNamedLegendary: true,
      } as Parameters<typeof isCelebrationNamedGear>[0]),
    ).toBe(true);
  });
});
