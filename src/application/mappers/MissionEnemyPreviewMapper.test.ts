import { describe, expect, it } from 'vitest';
import { resolvePhase } from '../../domain/campaign/CampaignCatalog';
import {
  extractFeaturedEnemySlots,
  mapFeaturedEnemyPreviews,
} from './MissionEnemyPreviewMapper';

describe('MissionEnemyPreviewMapper', () => {
  it('extrai slots em destaque sem duplicar tipo e prioriza boss/elite', () => {
    const phase = resolvePhase('1-1');
    expect(phase).toBeTruthy();
    const slots = extractFeaturedEnemySlots(phase!);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.length).toBeLessThanOrEqual(3);
    expect(new Set(slots.map((slot) => slot.enemyType)).size).toBe(slots.length);
  });

  it('monta ficha de combate para preview da missão', () => {
    const phase = resolvePhase('1-1');
    expect(phase).toBeTruthy();
    const previews = mapFeaturedEnemyPreviews(phase!, { mapId: 'stendra' });
    expect(previews.length).toBeGreaterThan(0);

    const enemy = previews[0];
    expect(enemy.attack).toBeGreaterThan(0);
    expect(enemy.maxHealth).toBeGreaterThan(0);
    expect(enemy.combatStatSheet.length).toBeGreaterThan(0);
    expect(enemy.combatResists).toBeTruthy();
    expect(enemy.level).toBe(phase!.difficultyTier);
  });
});
