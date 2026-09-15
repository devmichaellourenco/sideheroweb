import { describe, expect, it } from 'vitest';
import { buildPhaseId } from './CampaignIds';
import { CampaignProgress } from './CampaignProgress';
import {
  BASE_GAME_MAX_MAP_INDEX,
  isPhaseReleased,
  isSeasonFinalePhase,
  releasedCampaignMaps,
  releasedCampaignPhaseCount,
  seasonFinalePhaseId,
} from './CampaignReleaseScope';

describe('CampaignReleaseScope', () => {
  it('limita jogo base a quatro regiões e 200 fases', () => {
    expect(releasedCampaignMaps()).toHaveLength(4);
    expect(releasedCampaignMaps().map((map) => map.id)).toEqual([
      'stendra',
      'gruftall',
      'valdris',
      'morthaven',
    ]);
    expect(releasedCampaignPhaseCount()).toBe(200);
    expect(BASE_GAME_MAX_MAP_INDEX).toBe(4);
  });

  it('define finale da temporada em 4-50 no perfil base', () => {
    expect(seasonFinalePhaseId()).toBe('4-50');
    expect(isSeasonFinalePhase('4-50')).toBe(true);
    expect(isSeasonFinalePhase('10-50')).toBe(false);
  });

  it('bloqueia fases DLC no perfil base', () => {
    expect(isPhaseReleased('4-50')).toBe(true);
    expect(isPhaseReleased('5-1')).toBe(false);
    expect(isPhaseReleased('10-50')).toBe(false);
  });

  it('clamp preserva progresso DLC e corrige seleção fora do escopo', () => {
    const progress = CampaignProgress.restore({
      unlockedPhaseIds: ['1-1', '5-1'],
      clearedPhaseIds: ['1-1', '4-50'],
      selectedPhaseId: '5-1',
      highestTierReached: 250,
      seasonCompleted: true,
    });

    expect(progress.unlockedPhaseIds).toEqual(['1-1', '5-1']);
    expect(progress.clearedPhaseIds).toEqual(['1-1', '4-50']);
    expect(progress.selectedPhaseId).toBe('4-50');
    expect(progress.highestTierReached).toBe(200);
    expect(progress.seasonCompleted).toBe(true);
  });

  it('clamp cai em 1-1 quando não há fase liberada válida', () => {
    const progress = CampaignProgress.restore({
      unlockedPhaseIds: ['5-1'],
      clearedPhaseIds: [],
      selectedPhaseId: '6-10',
      highestTierReached: 300,
      seasonCompleted: false,
    });

    expect(progress.selectedPhaseId).toBe(buildPhaseId(1, 1));
    expect(progress.highestTierReached).toBe(200);
  });
});
