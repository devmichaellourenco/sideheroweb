import { describe, expect, it } from 'vitest';
import { HERO_OUT_OF_THE_SIDE_ID } from './AchievementCatalog';
import { AchievementProgress } from './AchievementProgress';
import { AchievementService } from './AchievementService';

describe('AchievementService', () => {
  const service = new AchievementService();

  it('completa Hero Out of the Side ao limpar 1-1 pela primeira vez', () => {
    const result = service.recordPhaseCleared(AchievementProgress.initial(), '1-1', 1_700_000_000_000);

    expect(result.updates).toHaveLength(1);
    expect(result.updates[0]).toMatchObject({
      previousProgress: 0,
      currentProgress: 1,
      justCompleted: true,
    });
    expect(result.updates[0]?.definition.id).toBe(HERO_OUT_OF_THE_SIDE_ID);
    expect(result.progress.getEntry(HERO_OUT_OF_THE_SIDE_ID).completed).toBe(true);
  });

  it('não re-dispara após completo', () => {
    const first = service.recordPhaseCleared(AchievementProgress.initial(), '1-1');
    const second = service.recordPhaseCleared(first.progress, '1-1');

    expect(second.updates).toHaveLength(0);
  });

  it('ignora fases sem achievement', () => {
    const result = service.recordPhaseCleared(AchievementProgress.initial(), '2-10');
    expect(result.updates).toHaveLength(0);
    expect(result.progress.toProps().entries).toEqual({});
  });

  it('lista catálogo com progresso atual', () => {
    const completed = service.recordPhaseCleared(AchievementProgress.initial(), '1-1').progress;
    const entries = service.listEntries(completed);
    const heroOut = entries.find((entry) => entry.definition.id === HERO_OUT_OF_THE_SIDE_ID);

    expect(entries.length).toBeGreaterThanOrEqual(1);
    expect(heroOut?.completed).toBe(true);
    expect(heroOut?.currentProgress).toBe(1);
  });
});
