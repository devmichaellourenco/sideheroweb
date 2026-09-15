import { describe, expect, it } from 'vitest';
import { resolvePhase } from './CampaignCatalog';
import { buildStageProgress, resolveWaveMarkerKind } from './StageProgress';

describe('StageProgress', () => {
  it('classifica trash, elite e boss a partir dos slots', () => {
    const phase = resolvePhase('1-50')!;
    expect(resolveWaveMarkerKind(phase.waves[0], false)).toBe('trash');
    expect(resolveWaveMarkerKind(phase.waves[1], false)).toBe('elite');
    expect(resolveWaveMarkerKind(phase.waves[phase.waves.length - 1], true)).toBe('boss');
  });

  it('marca cleared / current / locked conforme waveIndex', () => {
    const phase = resolvePhase('1-50')!;
    const progress = buildStageProgress(phase, 1);

    expect(progress.markers[0].status).toBe('cleared');
    expect(progress.markers[1].status).toBe('current');
    expect(progress.markers[2].status).toBe('locked');
    expect(progress.markers[progress.markers.length - 1].kind).toBe('boss');
  });

  it('calcula fillRatio com lead-in no 1º e 1 no boss', () => {
    const phase = resolvePhase('1-50')!;
    const start = buildStageProgress(phase, 0);
    const end = buildStageProgress(phase, phase.waves.length - 1);

    expect(start.fillRatio).toBeGreaterThan(0);
    expect(start.fillRatio).toBeLessThan(0.5);
    expect(start.markers[0].trackRatio).toBe(start.fillRatio);
    expect(end.fillRatio).toBe(1);
    expect(end.markers[end.markers.length - 1].trackRatio).toBe(1);
    expect(
      end.markers.every((m, i) =>
        i < end.markers.length - 1 ? m.status === 'cleared' : m.status === 'current',
      ),
    ).toBe(true);
  });
});
