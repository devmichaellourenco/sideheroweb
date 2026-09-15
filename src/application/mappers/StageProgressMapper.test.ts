import { describe, expect, it } from 'vitest';
import { resolvePhase } from '../../domain/campaign/CampaignCatalog';
import { markerTrackRatio } from '../../domain/campaign/StageProgress';
import { mapStageProgress } from './StageProgressMapper';

describe('StageProgressMapper', () => {
  it('mapeia snapshot de domínio para DTO', () => {
    const phase = resolvePhase('1-50')!;
    const dto = mapStageProgress(phase, 2);

    expect(dto.phaseId).toBe('1-50');
    expect(dto.markers).toHaveLength(phase.waves.length);
    expect(dto.markers[2].status).toBe('current');
    expect(dto.fillRatio).toBeCloseTo(markerTrackRatio(2, phase.waves.length));
    expect(dto.markers[0].trackRatio).toBeCloseTo(markerTrackRatio(0, phase.waves.length));
  });
});
