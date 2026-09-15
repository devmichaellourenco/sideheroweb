import { describe, expect, it } from 'vitest';
import {
  getAchievementById,
  HERO_OUT_OF_THE_SIDE_ID,
  listAchievements,
  listAchievementsForPhaseCleared,
} from './AchievementCatalog';

describe('AchievementCatalog', () => {
  it('expõe Hero - Out of the Side para clear 1-1', () => {
    const achievement = getAchievementById(HERO_OUT_OF_THE_SIDE_ID);
    expect(achievement?.title).toBe('Hero - Out of the Side');
    expect(achievement?.description).toBe('Clear stage 1-1 for the first time.');
    expect(achievement?.phaseId).toBe('1-1');
    expect(listAchievements().length).toBeGreaterThanOrEqual(5);
    expect(listAchievementsForPhaseCleared('1-1').map((entry) => entry.id)).toContain(
      HERO_OUT_OF_THE_SIDE_ID,
    );
    expect(listAchievementsForPhaseCleared('1-2')).toHaveLength(0);
  });

  it('expõe conquistas de arco regional', () => {
    expect(listAchievementsForPhaseCleared('1-50').map((e) => e.id)).toContain('stendra_guardian');
    expect(listAchievementsForPhaseCleared('2-50').map((e) => e.id)).toContain('gruftall_ember');
    expect(listAchievementsForPhaseCleared('3-50').map((e) => e.id)).toContain('valdris_shadow');
    expect(listAchievementsForPhaseCleared('4-50').map((e) => e.id)).toContain('morthaven_finale');
  });
});
