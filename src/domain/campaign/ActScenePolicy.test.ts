import { describe, expect, it } from 'vitest';
import { buildActSceneId, SEASON_FINALE_EPILOGUE_ID } from './ActSceneCatalog';
import { CampaignProgress } from './CampaignProgress';
import {
  detectNewlyUnlockedActScene,
  detectSeasonFinaleEpilogue,
  firstPhaseIdForAct,
  isActUnlocked,
} from './ActScenePolicy';
import { resolveActScene } from './ActSceneCatalog';

describe('ActScenePolicy', () => {
  it('considera ato desbloqueado quando a primeira fase do ato está liberada', () => {
    const progress = CampaignProgress.initial();

    expect(isActUnlocked(progress, 'stendra', 1)).toBe(true);
    expect(isActUnlocked(progress, 'stendra', 2)).toBe(false);
  });

  it('detecta cena do Ato I na primeira sessão', () => {
    const progress = CampaignProgress.initial();
    const scene = detectNewlyUnlockedActScene(null, progress);

    expect(scene?.id).toBe(buildActSceneId('stendra', 1));
  });

  it('detecta cena ao desbloquear o Ato II', () => {
    const before = CampaignProgress.initial()
      .markCleared('1-1', ['1-2'], 1)
      .markCleared('1-2', ['1-3'], 2);
    let progress = before;
    for (let phase = 3; phase <= 9; phase += 1) {
      progress = progress.markCleared(`1-${phase}`, [`1-${phase + 1}`], phase);
    }
    const after = progress.markCleared('1-10', ['1-11'], 10);

    const scene = detectNewlyUnlockedActScene(progress, after);
    expect(scene?.id).toBe(buildActSceneId('stendra', 2));
  });

  it('não repete cena já vista', () => {
    const progress = CampaignProgress.initial().markActSceneViewed(buildActSceneId('stendra', 1));
    const scene = detectNewlyUnlockedActScene(null, progress);

    expect(scene).toBeNull();
  });

  it('detecta epílogo na primeira conclusão da temporada', () => {
    const before = CampaignProgress.initial();
    const after = before.markSeasonCompleted();

    expect(detectSeasonFinaleEpilogue(before, after)?.id).toBe(SEASON_FINALE_EPILOGUE_ID);
  });

  it('não repete epílogo de temporada já visto', () => {
    const before = CampaignProgress.initial();
    const after = before
      .markSeasonCompleted()
      .markActSceneViewed(SEASON_FINALE_EPILOGUE_ID);

    expect(detectSeasonFinaleEpilogue(before, after)).toBeNull();
  });

  it('mapeia primeira fase de cada ato', () => {
    expect(firstPhaseIdForAct(1, 1)).toBe('1-1');
    expect(firstPhaseIdForAct(1, 2)).toBe('1-11');
    expect(resolveActScene('morthaven', 5)?.title).toContain('Duque');
  });
});
