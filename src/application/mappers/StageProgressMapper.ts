import { buildStageProgress } from '../../domain/campaign/StageProgress';
import { PhaseDefinition } from '../../domain/campaign/PhaseDefinition';
import { StageProgressDto } from '../dto/StageProgressDto';

export function mapStageProgress(
  phase: PhaseDefinition,
  waveIndex: number,
): StageProgressDto {
  const snapshot = buildStageProgress(phase, waveIndex);
  return {
    phaseId: snapshot.phaseId,
    displayName: snapshot.displayName,
    fillRatio: snapshot.fillRatio,
    markers: snapshot.markers.map((marker) => ({
      id: marker.id,
      kind: marker.kind,
      label: marker.label,
      status: marker.status,
      waveIndex: marker.waveIndex,
      trackRatio: marker.trackRatio,
    })),
  };
}
