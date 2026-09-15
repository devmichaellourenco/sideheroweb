/** @vitest-environment happy-dom */

import { describe, expect, it } from 'vitest';
import { GameStateDto } from '../../application/dto/GameStateDto';
import { StageProgressBarRenderer } from './StageProgressBarRenderer';

function minimalState(overrides: Partial<GameStateDto> = {}): GameStateDto {
  return {
    phaseRun: null,
    ...overrides,
  } as GameStateDto;
}

describe('StageProgressBarRenderer', () => {
  it('oculta sem phaseRun', () => {
    const root = document.createElement('div');
    root.id = 'stage-progress-root';
    const renderer = new StageProgressBarRenderer(root);

    renderer.render(minimalState());
    expect(root.classList.contains('hidden')).toBe(true);
    expect(root.innerHTML).toBe('');
  });

  it('mantém a barra durante intermissão sem phaseRun', () => {
    const root = document.createElement('div');
    const renderer = new StageProgressBarRenderer(root);
    const withProgress = minimalState({
      phaseRun: {
        phaseId: '1-1',
        displayName: 'Esgotos',
        waveIndex: 2,
        waveCount: 3,
        isBossWave: true,
        stageProgress: {
          phaseId: '1-1',
          displayName: 'Esgotos',
          fillRatio: 1,
          markers: [
            { id: 'a', kind: 'trash', label: 'W1', status: 'cleared', waveIndex: 0, trackRatio: 0.14 },
            { id: 'b', kind: 'elite', label: 'Elite', status: 'cleared', waveIndex: 1, trackRatio: 0.57 },
            { id: 'c', kind: 'boss', label: 'Boss', status: 'current', waveIndex: 2, trackRatio: 1 },
          ],
        },
      },
    });

    renderer.render(withProgress);
    expect(root.classList.contains('hidden')).toBe(false);

    renderer.render(
      minimalState({
        phaseRun: null,
        combatIntermission: {
          variant: 'phase-clear',
          clearedPhaseId: '1-1',
          clearedPhaseName: 'Esgotos',
          nextPhaseId: '1-2',
          nextPhaseName: 'Próxima',
        },
      } as Partial<GameStateDto>),
    );

    expect(root.classList.contains('hidden')).toBe(false);
    expect(root.innerHTML).toContain('stage-progress-marker--boss');
  });

  it('atualiza fill e mostra marcadores com phaseRun', () => {
    const root = document.createElement('div');
    const renderer = new StageProgressBarRenderer(root);

    renderer.render(
      minimalState({
        phaseRun: {
          phaseId: '1-1',
          displayName: 'Esgotos',
          waveIndex: 1,
          waveCount: 3,
          isBossWave: false,
          stageProgress: {
            phaseId: '1-1',
            displayName: 'Esgotos',
            fillRatio: 0.5,
            markers: [
              { id: 'a', kind: 'trash', label: 'W1', status: 'cleared', waveIndex: 0, trackRatio: 0.14 },
              { id: 'b', kind: 'elite', label: 'Elite', status: 'current', waveIndex: 1, trackRatio: 0.57 },
              { id: 'c', kind: 'boss', label: 'Boss', status: 'locked', waveIndex: 2, trackRatio: 1 },
            ],
          },
        },
      }),
    );

    expect(root.classList.contains('hidden')).toBe(false);
    expect(root.innerHTML).toContain('stage-progress-marker--current');
    expect(root.innerHTML).toContain('width: 50%');
  });
});
