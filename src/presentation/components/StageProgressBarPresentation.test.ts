import { describe, expect, it } from 'vitest';
import { StageProgressDto } from '../../application/dto/StageProgressDto';
import { renderStageProgressBar } from './StageProgressBarPresentation';

const LEAD_IN = 0.14;

function sampleProgress(overrides: Partial<StageProgressDto> = {}): StageProgressDto {
  const mid = LEAD_IN + (1 - LEAD_IN) * 0.5;
  return {
    phaseId: '1-1',
    displayName: 'Esgotos',
    fillRatio: mid,
    markers: [
      {
        id: '1-1:w0',
        kind: 'trash',
        label: 'W1',
        status: 'cleared',
        waveIndex: 0,
        trackRatio: LEAD_IN,
      },
      {
        id: '1-1:w1',
        kind: 'elite',
        label: 'Elite',
        status: 'current',
        waveIndex: 1,
        trackRatio: mid,
      },
      {
        id: '1-1:w2',
        kind: 'boss',
        label: 'Boss',
        status: 'locked',
        waveIndex: 2,
        trackRatio: 1,
      },
    ],
    ...overrides,
  };
}

describe('StageProgressBarPresentation', () => {
  it('renderiza lead-in no 1º, boss no fim e sem texto de label', () => {
    const html = renderStageProgressBar(sampleProgress());
    const firstLeft = Math.round(LEAD_IN * 1000) / 10;

    expect(html).toContain('stage-progress-bar');
    expect(html).toContain('stage-progress-bar__fill');
    expect(html).toContain(`left: ${firstLeft}%`);
    expect(html).toContain('left: 100%');
    expect(html).toContain('stage-progress-marker--trash');
    expect(html).toContain('stage-progress-marker--elite');
    expect(html).toContain('stage-progress-marker--boss');
    expect(html).not.toContain('stage-progress-marker__label');
    expect(html).toContain('Esgotos');
  });
});
